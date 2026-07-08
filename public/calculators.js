(function () {
  'use strict';

  var BAREME = {
    smicMensuel: 1823.03,
    pmss: 3925,
    cotNonCadre: 0.22,
    cotCadre: 0.252,
    csgDeductible: 0.029,
    csgNonDeductible: 0.042,
    crds: 0.005,
    tauxPretImmo: 3.31,
    tauxHCSF: 0.35,
    dureePretMax: 25,
    peaPs: 0.186,
    ctoIr: 0.128,
    ctoPs: 0.186,
    microBnc: 0.212,
    microBic: 0.218,
    microPresta: 0.218,
    acreFactor: 0.75,
    livretAPlafond: 22950,
    lepPlafond: 10000,
    perPlafondMax: 35194,
    perPlafondMin: 4399,
    irTranches: [
      [11294, 0],
      [28797, 0.11],
      [82341, 0.3],
      [177106, 0.41],
      [Infinity, 0.45]
    ]
  };

  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function fmt(n) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(n);
  }

  function fmtPct(n) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(n / 100);
  }

  function fmtDec(n) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function show(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }

  function brutToNet(brut, statut) {
    return salaireDetaille(brut, statut).net;
  }

  function salaireDetaille(brutMensuel, statut) {
    var brut = Math.max(0, brutMensuel);
    var cadre = statut === 'cadre';
    var pmss = BAREME.pmss;
    var plafond = Math.min(brut, pmss);
    var tranche2 = cadre ? Math.max(0, Math.min(brut, pmss * 8) - pmss) : 0;
    var assietteCSG = brut * 0.9825;
    var lignes = [
      { label: 'Vieillesse plafonnée (6,90 %)', montant: plafond * 0.069 },
      { label: 'Vieillesse déplafonnée (0,40 %)', montant: brut * 0.004 },
      { label: 'Agirc-Arrco tranche 1 (3,15 %)', montant: plafond * 0.0315 },
      { label: 'CEG tranche 1 (0,86 %)', montant: plafond * 0.0086 }
    ];
    if (tranche2 > 0) {
      lignes.push({ label: 'Agirc-Arrco tranche 2 (8,64 %)', montant: tranche2 * 0.0864 });
      lignes.push({ label: 'CEG tranche 2 (1,08 %)', montant: tranche2 * 0.0108 });
      lignes.push({ label: 'CET (0,14 %)', montant: tranche2 * 0.0014 });
    }
    if (cadre) {
      lignes.push({ label: 'APEC (0,024 %)', montant: Math.min(brut, pmss * 4) * 0.00024 });
    }
    lignes.push({ label: 'CSG déductible (6,80 %)', montant: assietteCSG * 0.068 });
    lignes.push({ label: 'CSG non déductible (2,40 %)', montant: assietteCSG * 0.024 });
    lignes.push({ label: 'CRDS (0,50 %)', montant: assietteCSG * 0.005 });
    var totalCot = lignes.reduce(function (s, l) {
      return s + l.montant;
    }, 0);
    var net = Math.max(0, brut - totalCot);
    var netImposable = net + assietteCSG * 0.024 + assietteCSG * 0.005;
    return {
      brut: brut,
      lignes: lignes,
      totalCot: totalCot,
      net: net,
      netImposable: netImposable,
      tauxEffectif: brut > 0 ? (totalCot / brut) * 100 : 0
    };
  }

  function netToBrutMensuel(netCible, statut) {
    if (netCible <= 0) return 0;
    var low = netCible;
    var high = netCible * 2.5;
    for (var i = 0; i < 40; i++) {
      var mid = (low + high) / 2;
      var net = salaireDetaille(mid, statut).net;
      if (net < netCible) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }

  function impotRevenuAnnuel(revenuImposable, parts) {
    var q = revenuImposable / Math.max(1, parts);
    var impot = 0;
    var prev = 0;
    for (var i = 0; i < BAREME.irTranches.length; i++) {
      var plafond = BAREME.irTranches[i][0];
      var taux = BAREME.irTranches[i][1];
      if (q <= prev) break;
      var base = Math.min(q, plafond) - prev;
      if (base > 0) impot += base * taux;
      prev = plafond;
    }
    return Math.max(0, impot * Math.max(1, parts));
  }

  function versementMensuel(montant, periode) {
    return periode === 'annuel' ? montant / 12 : montant;
  }

  function perPlafondDeduction(revenuAnnuel) {
    var plafond = revenuAnnuel * 0.1;
    if (revenuAnnuel > BAREME.perPlafondMin) {
      plafond = Math.max(plafond, BAREME.perPlafondMin);
    }
    return Math.min(plafond, BAREME.perPlafondMax);
  }

  function revenuAnnuel(montant, periode) {
    return periode === 'mensuel' ? montant * 12 : montant;
  }

  function mensualitePret(montant, tauxAnnuel, dureeAnnees) {
    if (montant <= 0 || dureeAnnees <= 0) return 0;
    var r = tauxAnnuel / 100 / 12;
    var n = dureeAnnees * 12;
    if (r === 0) return montant / n;
    return (montant * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function projectionEpargne(capital, versementMensuel, dureeAnnees, tauxAnnuel, plafond) {
    var solde = capital;
    var versements = capital;
    var tauxM = tauxAnnuel / 100 / 12;
    for (var m = 0; m < dureeAnnees * 12; m++) {
      if (versementMensuel > 0 && solde < plafond) {
        var v = Math.min(versementMensuel, Math.max(0, plafond - solde));
        solde += v;
        versements += v;
      }
      solde *= 1 + tauxM;
    }
    return { final: solde, versements: versements, interets: solde - versements };
  }

  function bindForm(formId, handler, autoCalc) {
    var form = document.getElementById(formId);
    if (!form) return;
    var run = function () {
      handler(new FormData(form));
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      run();
    });
    if (autoCalc || form.getAttribute('data-auto-calc') === 'true') {
      var timer;
      var debounced = function () {
        clearTimeout(timer);
        timer = setTimeout(run, 280);
      };
      form.querySelectorAll('input, select').forEach(function (el) {
        el.addEventListener('input', debounced);
        el.addEventListener('change', debounced);
      });
      run();
    }
  }

  bindForm('calc-budget', function (fd) {
    var revenus = num(fd.get('revenus'));
    var dep =
      num(fd.get('loyer')) +
      num(fd.get('courses')) +
      num(fd.get('transport')) +
      num(fd.get('loisirs')) +
      num(fd.get('autres'));
    var reste = revenus - dep;
    var taux = revenus > 0 ? (reste / revenus) * 100 : 0;
    setText('bg-result-depenses', fmt(dep));
    setText('bg-result-taux', fmtPct(taux));
    setText('bg-result-reste', fmt(reste));
    show('bg-results');
    if (window.DodjeCharts) DodjeCharts.budget(fd, dep);
  });

  bindForm('calc-livret-a', function (fd) {
    var capital = num(fd.get('capital'));
    var versement = versementMensuel(num(fd.get('versement')), fd.get('versement_periode') || 'mensuel');
    var duree = num(fd.get('duree'));
    var taux = num(fd.get('taux'));
    var r = projectionEpargne(capital, versement, duree, taux, BAREME.livretAPlafond);
    var interetAnnuel = r.final * (taux / 100);
    var plafondAtteint = r.versements >= BAREME.livretAPlafond - 1;
    setText('la-result-versements', fmtDec(r.versements));
    setText('la-result-interets', fmtDec(r.interets));
    setText('la-result-capital', fmtDec(r.final));
    setText('la-result-interets-m', fmtDec(r.interets / Math.max(1, duree * 12)));
    setText('la-result-interets-a', fmtDec(interetAnnuel));
    setText('la-result-versement-m', fmtDec(versement));
    setText('la-result-versement-a', fmtDec(versement * 12));
    setText('la-result-plafond', plafondAtteint ? 'Plafond atteint' : fmt(BAREME.livretAPlafond));
    var hint = document.getElementById('la-plafond-hint');
    if (hint) hint.hidden = !plafondAtteint;
    show('la-results');
    if (window.DodjeCharts) DodjeCharts.line('la-chart', r);
  });

  bindForm('calc-lep', function (fd) {
    var versement = versementMensuel(num(fd.get('versement')), fd.get('versement_periode') || 'mensuel');
    var r = projectionEpargne(
      num(fd.get('capital')),
      versement,
      num(fd.get('duree')),
      num(fd.get('taux')),
      BAREME.lepPlafond
    );
    setText('lep-result-capital', fmtDec(r.final));
    setText('lep-result-interets', fmtDec(r.interets));
    setText('lep-result-verse-m', fmtDec(versement));
    setText('lep-result-verse-a', fmtDec(versement * 12));
    setText('lep-result-interets-m', fmtDec(r.interets / Math.max(1, num(fd.get('duree')) * 12)));
    setText('lep-result-interets-a', fmtDec(r.interets / Math.max(1, num(fd.get('duree')))));
    show('lep-results');
  });

  bindForm('calc-dca', function (fd) {
    var versement = versementMensuel(num(fd.get('versement')), fd.get('versement_periode') || 'mensuel');
    var duree = num(fd.get('duree'));
    var taux = num(fd.get('taux'));
    var frais = num(fd.get('frais'));
    var totalVerse = 0;
    var solde = 0;
    var totalFrais = 0;
    var tm = taux / 100 / 12;
    for (var m = 0; m < duree * 12; m++) {
      totalVerse += versement;
      var net = Math.max(0, versement - frais);
      totalFrais += Math.min(frais, versement);
      solde = (solde + net) * (1 + tm);
    }
    setText('dca-result-final', fmt(solde));
    setText('dca-result-verse', fmt(totalVerse));
    setText('dca-result-frais', fmt(totalFrais));
    setText('dca-result-verse-m', fmtDec(versement));
    setText('dca-result-verse-a', fmtDec(versement * 12));
    show('dca-results');
    if (window.DodjeCharts) DodjeCharts.line('dca-chart', { final: solde, versements: totalVerse });
  });

  bindForm('calc-interets', function (fd) {
    var versement = versementMensuel(num(fd.get('versement')), fd.get('versement_periode') || 'mensuel');
    var r = projectionEpargne(
      num(fd.get('capital')),
      versement,
      num(fd.get('duree')),
      num(fd.get('taux')),
      1e12
    );
    setText('ic-result-versements', fmt(r.versements));
    setText('ic-result-gains', fmt(r.interets));
    setText('ic-result-final', fmt(r.final));
    setText('ic-result-verse-m', fmtDec(versement));
    setText('ic-result-verse-a', fmtDec(versement * 12));
    show('ic-results');
    if (window.DodjeCharts) DodjeCharts.line('ic-chart', r);
  });

  bindForm('calc-pea-cto', function (fd) {
    var gain = num(fd.get('gain'));
    var duree = num(fd.get('duree'));
    var peaTax = duree >= 5 ? gain * BAREME.peaPs : gain * (BAREME.ctoIr + BAREME.ctoPs);
    var ctoTax = gain * (BAREME.ctoIr + BAREME.ctoPs);
    setText('pc-result-pea', fmt(gain - peaTax));
    setText('pc-result-cto', fmt(gain - ctoTax));
    setText('pc-result-ecart', fmt(ctoTax - peaTax));
    show('pc-results');
  });

  bindForm('calc-pret-conso', function (fd) {
    var m = mensualitePret(num(fd.get('montant')), num(fd.get('taux')), num(fd.get('duree')));
    var total = m * num(fd.get('duree')) * 12;
    setText('pco-result-mensualite', fmt(m));
    setText('pco-result-cout', fmt(total - num(fd.get('montant'))));
    show('pco-results');
  });

  bindForm('calc-frais-bourse', function (fd) {
    var montant = num(fd.get('montant'));
    var ordres = num(fd.get('ordres'));
    var courtiers = [
      { nom: 'Trade Republic', frais: 1 },
      { nom: 'Boursorama', frais: 1.99 },
      { nom: 'Fortuneo', frais: 1.95 },
      { nom: 'Degiro', frais: 1 }
    ];
    var body = document.getElementById('fb-comparison-body');
    if (body) {
      body.innerHTML = courtiers
        .map(function (c) {
          var annuel = c.frais * ordres;
          return (
            '<tr><td>' +
            c.nom +
            '</td><td>' +
            fmt(c.frais) +
            '</td><td>' +
            fmt(annuel) +
            '</td><td>' +
            fmtPct(montant > 0 ? (annuel / (montant * ordres)) * 100 : 0) +
            '</td></tr>'
          );
        })
        .join('');
    }
    show('fb-results');
  });

  bindForm('calc-inflation', function (fd) {
    var montant = num(fd.get('montant'));
    var periode = fd.get('montant_periode') || 'annuel';
    var montantAnnuel = periode === 'mensuel' ? montant * 12 : montant;
    var taux = num(fd.get('taux'));
    var annees = num(fd.get('annees'));
    var pouvoir = montantAnnuel / Math.pow(1 + taux / 100, annees);
    var perte = montantAnnuel - pouvoir;
    setText('inf-result-pouvoir', fmt(pouvoir));
    setText('inf-result-perte', fmt(perte));
    setText('inf-result-pouvoir-m', fmtDec(pouvoir / 12));
    setText('inf-result-perte-m', fmtDec(perte / 12));
    setText('inf-result-montant-a', fmtDec(montantAnnuel));
    show('inf-results');
  });

  bindForm('calc-per', function (fd) {
    var revenu = revenuAnnuel(num(fd.get('revenu')), fd.get('revenu_periode') || 'annuel');
    var versementAnnuel = num(fd.get('versement'));
    if ((fd.get('versement_periode') || 'annuel') === 'mensuel') {
      versementAnnuel = versementAnnuel * 12;
    }
    var plafond = Math.min(versementAnnuel, perPlafondDeduction(revenu));
    var tmi = num(fd.get('tmi'));
    var economie = plafond * (tmi / 100);
    var duree = num(fd.get('duree'));
    var taux = num(fd.get('taux'));
    var r = projectionEpargne(0, plafond / 12, duree, taux, 1e12);
    var coutNet = plafond - economie;
    setText('per-result-plafond', fmtDec(plafond));
    setText('per-result-plafond-m', fmtDec(plafond / 12));
    setText('per-result-economie', fmtDec(economie));
    setText('per-result-economie-m', fmtDec(economie / 12));
    setText('per-result-cout-net', fmtDec(coutNet));
    setText('per-result-capital', fmtDec(r.final));
    setText('per-result-verse', fmtDec(r.versements));
    setText('per-result-gains', fmtDec(r.interets));
    setText('per-result-plafond-max', fmtDec(perPlafondDeduction(revenu)));
    show('per-results');
  });

  bindForm('calc-projection-patrimoine', function (fd) {
    var capital = num(fd.get('capital'));
    var versement = versementMensuel(num(fd.get('versement')), fd.get('versement_periode') || 'mensuel');
    var duree = num(fd.get('duree'));
    var rLivret = projectionEpargne(capital, versement, duree, 1.5, BAREME.livretAPlafond);
    var rFonds = projectionEpargne(capital, versement, duree, 2.5, 1e12);
    var rEtf = projectionEpargne(capital, versement, duree, 7, 1e12);
    setText('pp-result-livret', fmtDec(rLivret.final));
    setText('pp-result-fonds', fmtDec(rFonds.final));
    setText('pp-result-etf', fmtDec(rEtf.final));
    setText('pp-result-livret-gains', fmtDec(rLivret.interets));
    setText('pp-result-fonds-gains', fmtDec(rFonds.interets));
    setText('pp-result-etf-gains', fmtDec(rEtf.interets));
    show('pp-results');
    if (window.DodjeCharts) {
      DodjeCharts.bar('pp-chart', [rLivret.final, rFonds.final, rEtf.final]);
    }
  });

  bindForm('calc-assvie', function (fd) {
    var versement = versementMensuel(num(fd.get('versement')), fd.get('versement_periode') || 'mensuel');
    var r = projectionEpargne(
      num(fd.get('capital')),
      versement,
      num(fd.get('duree')),
      num(fd.get('taux')),
      1e12
    );
    setText('av-result-final', fmtDec(r.final));
    setText('av-result-gains', fmtDec(r.interets));
    setText('av-result-verse', fmtDec(r.versements));
    setText('av-result-verse-m', fmtDec(versement));
    setText('av-result-verse-a', fmtDec(versement * 12));
    show('av-results');
  });

  bindForm('calc-salaire', function (fd) {
    var sens = fd.get('sens') || 'brut-net';
    var periode = fd.get('periode') || 'mensuel';
    var statut = fd.get('statut') || 'non-cadre';
    var tempsPlein = num(fd.get('temps')) || 100;
    var montant = num(fd.get('montant'));
    var pas = fd.get('pas') === 'on';
    var tauxPas = num(fd.get('taux_pas'));
    var brutMensuel;

    if (periode === 'annuel') montant = montant / 12;

    if (sens === 'net-brut') {
      brutMensuel = netToBrutMensuel(montant, statut);
    } else {
      brutMensuel = montant;
    }

    brutMensuel = brutMensuel * (tempsPlein / 100);
    var detail = salaireDetaille(brutMensuel, statut);
    var netApresImp = detail.net;
    var pasMensuel = 0;

    if (pas && tauxPas > 0) {
      pasMensuel = (detail.netImposable * (tauxPas / 100));
      netApresImp = detail.net - pasMensuel;
    } else if (pas) {
      var impotAnnuel = impotRevenuAnnuel(detail.netImposable * 12, 1);
      pasMensuel = impotAnnuel / 12;
      netApresImp = detail.net - pasMensuel;
    }

    setText('sal-result-brut-m', fmtDec(detail.brut));
    setText('sal-result-brut-a', fmtDec(detail.brut * 12));
    setText('sal-result-net-m', fmtDec(detail.net));
    setText('sal-result-net-a', fmtDec(detail.net * 12));
    setText('sal-result-imposable-m', fmtDec(detail.netImposable));
    setText('sal-result-imposable-a', fmtDec(detail.netImposable * 12));
    setText('sal-result-cot', fmtDec(detail.totalCot));
    setText('sal-result-taux', fmtPct(detail.tauxEffectif));

    if (pas) {
      setText('sal-result-pas', fmtDec(pasMensuel));
      setText('sal-result-net-apres', fmtDec(netApresImp));
      show('sal-row-pas');
      show('sal-row-net-apres');
    } else {
      var pasRow = document.getElementById('sal-row-pas');
      var apresRow = document.getElementById('sal-row-net-apres');
      if (pasRow) pasRow.hidden = true;
      if (apresRow) apresRow.hidden = true;
    }

    var tbody = document.getElementById('sal-detail-body');
    if (tbody) {
      tbody.innerHTML = detail.lignes
        .map(function (l) {
          return (
            '<tr><td>' +
            l.label +
            '</td><td>− ' +
            fmtDec(l.montant) +
            '</td></tr>'
          );
        })
        .join('');
    }
    show('sal-results');
    show('sal-detail');
  });

  bindForm('calc-emprunt', function (fd) {
    var revenus = num(fd.get('revenus'));
    var charges = num(fd.get('charges'));
    var taux = num(fd.get('taux')) || BAREME.tauxPretImmo;
    var duree = num(fd.get('duree')) || BAREME.dureePretMax;
    var apport = num(fd.get('apport'));
    var mensualiteMax = Math.max(0, revenus * BAREME.tauxHCSF - charges);
    var r = taux / 100 / 12;
    var n = duree * 12;
    var capacite = r === 0 ? mensualiteMax * n : (mensualiteMax * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
    capacite += apport;
    setText('emp-result-mensualite', fmt(mensualiteMax));
    setText('emp-result-capacite', fmt(capacite));
    setText('emp-result-emprunt', fmt(Math.max(0, capacite - apport)));
    show('emp-results');
  });

  bindForm('calc-statuts-entreprise', function (fd) {
    var montant = num(fd.get('montant'));
    var mode = fd.get('mode');
    var activite = fd.get('activite') || 'presta';
    var acre = fd.get('acre') === 'on';
    var tauxMicro =
      activite === 'bic' ? BAREME.microBic : activite === 'bnc' ? BAREME.microBnc : BAREME.microPresta;
    if (acre) tauxMicro *= BAREME.acreFactor;
    var ca = mode === 'mensuel' ? montant * 12 : montant;
    var netSalarie = brutToNet(ca, 'non-cadre');
    var netMicro = ca * (1 - tauxMicro);
    var netEi = ca * 0.71;
    var netSasuDiv = ca * 0.58;
    var netSasuSal = brutToNet(ca * 0.7, 'cadre');
    setText('st-result-salarie', fmt(netSalarie));
    setText('st-result-micro', fmt(netMicro));
    setText('st-result-ei', fmt(netEi));
    setText('st-result-sasu-div', fmt(netSasuDiv));
    setText('st-result-sasu-sal', fmt(netSasuSal));
    setText('st-detail-salarie', 'Brut annuel équivalent : ' + fmt(ca));
    setText('st-detail-micro', 'Cotisations micro : ' + fmtPct(tauxMicro * 100));
    show('st-results');
    var tbody = document.getElementById('st-sim-table-body');
    if (tbody) {
      var rows = [
        ['Salarié', ca, ca - netSalarie, 0, netSalarie],
        ['Micro', ca, ca * tauxMicro, 0, netMicro],
        ['EI IR', ca, ca * 0.29, 0, netEi],
        ['SASU div.', ca, ca * 0.42, 0, netSasuDiv],
        ['SASU sal.', ca * 0.7, ca * 0.3, 0, netSasuSal]
      ];
      tbody.innerHTML = rows
        .map(function (row) {
          return (
            '<tr><td>' +
            row[0] +
            '</td><td>' +
            fmt(row[1]) +
            '</td><td>' +
            fmt(row[2]) +
            '</td><td>' +
            fmt(row[3]) +
            '</td><td>' +
            fmt(row[4]) +
            '</td><td>' +
            fmt(row[4] / 12) +
            '</td></tr>'
          );
        })
        .join('');
    }
    if (window.DodjeCharts) DodjeCharts.bar('st-chart', [netSalarie, netMicro, netEi, netSasuDiv, netSasuSal]);
  });

  bindForm('calc-locatif', function (fd) {
    var prix = num(fd.get('prix'));
    var loyer = num(fd.get('loyer'));
    var charges = num(fd.get('charges'));
    var taxe = num(fd.get('taxe'));
    var mensualite = num(fd.get('mensualite'));
    var apport = num(fd.get('apport'));
    var fraisNotaire = num(fd.get('notaire')) || prix * 0.08;
    var coutTotal = prix + fraisNotaire - apport;
    var loyersAnnuels = loyer * 12;
    var brut = prix > 0 ? (loyersAnnuels / prix) * 100 : 0;
    var net = prix > 0 ? ((loyersAnnuels - charges - taxe) / prix) * 100 : 0;
    var cashflow = loyer - charges / 12 - taxe / 12 - mensualite;
    var rendementApport = apport > 0 ? ((loyersAnnuels - charges - taxe - mensualite * 12) / apport) * 100 : 0;
    setText('loc-result-brut', fmtPct(brut));
    setText('loc-result-net', fmtPct(net));
    setText('loc-result-cashflow', fmtDec(cashflow));
    setText('loc-result-cout', fmt(coutTotal));
    setText('loc-result-rendement-apport', fmtPct(rendementApport));
    show('loc-results');
  });

  bindForm('calc-chomage', function (fd) {
    var brut = num(fd.get('brut'));
    var periode = fd.get('periode') || 'mensuel';
    if (periode === 'annuel') brut = brut / 12;
    var sjr = brut / 30.42;
    var plafondJournalier = 0.75 * sjr;
    var areJour = Math.min(0.57 * sjr, plafondJournalier);
    if (sjr > 14.52) {
      areJour = 0.404 * sjr + 0.57 * (sjr - 14.52);
      areJour = Math.min(areJour, plafondJournalier);
    }
    var areBrute = areJour * 30;
    var areNette = areBrute * 0.93;
    var ratio = brut > 0 ? (areBrute / brut) * 100 : 0;
    setText('cho-result-brute', fmtDec(areBrute));
    setText('cho-result-nette', fmtDec(areNette));
    setText('cho-result-brute-a', fmtDec(areBrute * 12));
    setText('cho-result-nette-a', fmtDec(areNette * 12));
    setText('cho-result-sjr', fmtDec(sjr) + ' / jour');
    setText('cho-result-ratio', fmtPct(ratio));
    show('cho-results');
  });

  bindForm('calc-pret-immo', function (fd) {
    var montant = num(fd.get('montant'));
    var taux = num(fd.get('taux')) || BAREME.tauxPretImmo;
    var duree = num(fd.get('duree')) || 20;
    var assurance = num(fd.get('assurance'));
    var m = mensualitePret(montant, taux, duree);
    var mensTotale = m + assurance;
    var total = mensTotale * duree * 12;
    var interets = m * duree * 12 - montant;
    setText('pi-result-mensualite', fmtDec(m));
    setText('pi-result-assurance', fmtDec(assurance));
    setText('pi-result-total-m', fmtDec(mensTotale));
    setText('pi-result-interets', fmtDec(interets));
    setText('pi-result-cout-total', fmtDec(total));
    show('pi-results');
  });

  bindForm('calc-salaire-3000', function (fd) {
    var statut = fd.get('statut') || 'non-cadre';
    var detail = salaireDetaille(3000, statut);
    var pas = fd.get('pas') === 'on';
    var tauxPas = num(fd.get('taux_pas'));
    setText('s3-net-m', fmtDec(detail.net));
    setText('s3-net-a', fmtDec(detail.net * 12));
    setText('s3-cot', fmtDec(detail.totalCot));
    var rowPas = document.getElementById('s3-row-pas');
    if (rowPas) {
      if (pas && tauxPas > 0) {
        setText('s3-net-apres', fmtDec(detail.net * (1 - tauxPas / 100)));
        rowPas.hidden = false;
      } else {
        rowPas.hidden = true;
      }
    }
    show('s3-results');
  });

  bindForm('calc-micro-entreprise', function (fd) {
    var ca = num(fd.get('ca'));
    if ((fd.get('ca_periode') || 'annuel') === 'mensuel') ca = ca * 12;
    var activite = fd.get('activite') || 'bic';
    var acre = fd.get('acre') === 'on';
    var taux =
      activite === 'bnc'
        ? BAREME.microBnc
        : activite === 'vente'
          ? 0.123
          : activite === 'cipav'
            ? 0.232
            : BAREME.microBic;
    if (acre) taux *= BAREME.acreFactor;
    var cot = ca * taux;
    var net = ca - cot;
    setText('me-result-net-a', fmtDec(net));
    setText('me-result-net-m', fmtDec(net / 12));
    setText('me-result-cot-a', fmtDec(cot));
    setText('me-result-cot-m', fmtDec(cot / 12));
    setText('me-result-taux', fmtPct(taux * 100));
    setText('me-result-ca-a', fmtDec(ca));
    show('me-results');
  });

  bindForm('calc-impot', function (fd) {
    var revenu = num(fd.get('revenu'));
    var parts = num(fd.get('parts')) || 1;
    var periode = fd.get('periode') || 'annuel';
    if (periode === 'mensuel') revenu = revenu * 12;
    var impot = impotRevenuAnnuel(revenu, parts);
    var net = revenu - impot;
    var tauxMoyen = revenu > 0 ? (impot / revenu) * 100 : 0;
    setText('ir-result-impot', fmtDec(impot));
    setText('ir-result-net', fmtDec(net));
    setText('ir-result-net-m', fmtDec(net / 12));
    setText('ir-result-taux', fmtPct(tauxMoyen));
    setText('ir-result-quotient', fmtDec(revenu / parts));
    show('ir-results');
  });
})();
