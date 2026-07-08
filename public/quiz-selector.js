(function () {
  'use strict';

  function initQuizWizard(formId, config) {
    var form = document.getElementById(formId);
    if (!form) return;

    var steps = form.querySelectorAll('.quiz-step');
    var progressBar = form.querySelector('.quiz-progress-fill');
    var progressLabel = form.querySelector('.quiz-progress-label');
    var resultEl = document.getElementById(config.resultId);
    var currentStep = 0;
    var answers = {};

    function showStep(index) {
      steps.forEach(function (step, i) {
        step.hidden = i !== index;
      });
      var pct = ((index + 1) / steps.length) * 100;
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressLabel) progressLabel.textContent = 'Étape ' + (index + 1) + ' sur ' + steps.length;
      form.querySelector('.quiz-btn-prev').hidden = index === 0;
      form.querySelector('.quiz-btn-next').hidden = index === steps.length - 1;
      form.querySelector('.quiz-btn-submit').hidden = index !== steps.length - 1;
    }

    function collectStepAnswers() {
      var step = steps[currentStep];
      var name = step.getAttribute('data-name');
      var selected = step.querySelector('input[type="radio"]:checked');
      if (!selected) return false;
      answers[name] = selected.value;
      return true;
    }

    form.querySelector('.quiz-btn-next').addEventListener('click', function () {
      if (!collectStepAnswers()) {
        alert('Choisis une option pour continuer.');
        return;
      }
      currentStep += 1;
      showStep(currentStep);
    });

    form.querySelector('.quiz-btn-prev').addEventListener('click', function () {
      currentStep -= 1;
      showStep(currentStep);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!collectStepAnswers()) {
        alert('Choisis une option pour voir ton résultat.');
        return;
      }
      var result = config.computeResult(answers);
      renderResult(resultEl, result, config);
      steps.forEach(function (s) { s.hidden = true; });
      form.querySelector('.quiz-nav').hidden = true;
      form.querySelector('.quiz-progress').hidden = true;
      resultEl.hidden = false;
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    showStep(0);
  }

  function renderResult(el, result, config) {
    if (!el) return;
    el.innerHTML =
      '<div class="quiz-result-card">' +
        '<p class="quiz-result-kicker">Ton profil : ' + result.profile + '</p>' +
        '<h3 class="quiz-result-title">' + result.title + '</h3>' +
        '<p class="quiz-result-lead">' + result.summary + '</p>' +
        '<ul class="quiz-result-points">' +
          result.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
        '</ul>' +
        (result.caveat ? '<div class="content-note"><p><strong>Attention :</strong> ' + result.caveat + '</p></div>' : '') +
        '<div class="quiz-result-links">' +
          result.links.map(function (l) {
            return '<a href="' + l.href + '">' + l.label + '</a>';
          }).join('') +
        '</div>' +
        '<a href="/#hero" class="calc-btn quiz-cta-app">Approfondir avec l\'app Dodje</a>' +
      '</div>';
  }

  var PEA_SCORES = {
    tradeRepublic: { id: 'tradeRepublic', name: 'Trade Republic', label: 'Trade Republic' },
    fortuneo: { id: 'fortuneo', name: 'Fortuneo', label: 'Fortuneo' },
    boursorama: { id: 'boursorama', name: 'Boursorama Banque', label: 'Boursorama' },
    bourseDirect: { id: 'bourseDirect', name: 'Bourse Direct', label: 'Bourse Direct' },
    xtb: { id: 'xtb', name: 'XTB', label: 'XTB' }
  };

  function computePeaResult(a) {
    var scores = { tradeRepublic: 0, fortuneo: 0, boursorama: 0, bourseDirect: 0, xtb: 0 };

    if (a.objectif === 'dca') { scores.tradeRepublic += 5; scores.xtb += 3; scores.fortuneo += 2; }
    if (a.objectif === 'actif') { scores.bourseDirect += 4; scores.xtb += 3; }
    if (a.objectif === 'actions') { scores.bourseDirect += 3; scores.fortuneo += 2; scores.boursorama += 2; }
    if (a.objectif === 'decouvre') { scores.tradeRepublic += 4; scores.boursorama += 3; scores.fortuneo += 3; }

    if (a.montant === 'petit') { scores.tradeRepublic += 4; scores.xtb += 4; }
    if (a.montant === 'moyen') { scores.fortuneo += 4; scores.tradeRepublic += 3; scores.xtb += 2; }
    if (a.montant === 'gros') { scores.bourseDirect += 4; scores.fortuneo += 2; }
    if (a.montant === 'tres_gros') { scores.bourseDirect += 5; scores.xtb += 2; }

    if (a.preference === 'mobile') { scores.tradeRepublic += 5; }
    if (a.preference === 'banque') { scores.fortuneo += 5; scores.boursorama += 4; }
    if (a.preference === 'pro') { scores.xtb += 4; scores.bourseDirect += 2; }
    if (a.preference === 'frais') { scores.bourseDirect += 5; scores.xtb += 4; scores.tradeRepublic += 2; }

    if (a.client === 'boursorama') { scores.boursorama += 8; }
    if (a.client === 'fortuneo') { scores.fortuneo += 8; }
    if (a.client === 'autre') { scores.fortuneo += 1; scores.boursorama += 1; }

    if (a.horizon === 'long') { scores.tradeRepublic += 2; scores.fortuneo += 2; scores.boursorama += 1; }

    var winner = 'tradeRepublic';
    Object.keys(scores).forEach(function (k) {
      if (scores[k] > scores[winner]) winner = k;
    });

    var profiles = {
      tradeRepublic: {
        profile: 'Investisseur DCA mobile',
        title: 'Trade Republic te correspond le mieux',
        summary: 'Pour ton profil, Trade Republic est souvent le choix le plus efficient en 2026 : plans d\'investissement programmés gratuits, interface mobile épurée et frais de courtage bas (1 euro par ordre ponctuel, 0 euro en DCA automatique selon les grilles 2026).',
        points: [
          'Idéal pour un DCA mensuel sur ETF éligibles PEA dès 10 euros',
          'Pas de droits de garde sur le PEA',
          'Parcours 100 % mobile, adapté aux débutants',
          'Ouvre ton PEA tôt pour lancer le compteur des 5 ans fiscaux'
        ],
        caveat: 'Trade Republic est une entité européenne. Vérifie les conditions tarifaires à jour et la liste des ETF éligibles PEA avant d\'ouvrir.',
        links: [
          { href: '/guides/top-5-courtiers-bourse-2026', label: 'Comparatif courtiers bourse 2026' },
          { href: '/guides/etf-debutant-france-2026', label: 'Guide ETF débutant' },
          { href: '/outils/calculateur-dca-etf', label: 'Simulateur DCA ETF' }
        ]
      },
      fortuneo: {
        profile: 'Banque en ligne complète',
        title: 'Fortuneo est ta meilleure option',
        summary: 'Fortuneo combine banque en ligne française et PEA compétitif. La formule Starter rend gratuit le premier ordre du mois jusqu\'à 500 euros, pratique pour un investissement mensuel modéré.',
        points: [
          'Établissement agréé ACPR en France',
          'PEA + compte bancaire + livrets réglementés au même endroit',
          'Service client en français, rassurant pour débuter',
          'Frais compétitifs sur ordres ponctuels plus importants'
        ],
        caveat: 'Pas de plan d\'investissement automatique aussi poussé que Trade Republic. Compare la grille tarifaire Fortuneo 2026 selon ta formule.',
        links: [
          { href: '/guides/top-5-courtiers-bourse-2026', label: 'Top 5 courtiers 2026' },
          { href: '/outils/comparatif-comptes-bancaires-en-ligne-2026', label: 'Comparatif banques en ligne' },
          { href: '/guides/pea-vs-cto-complet-2026', label: 'Guide PEA vs CTO' }
        ]
      },
      boursorama: {
        profile: 'Écosystème bancaire intégré',
        title: 'Boursorama Banque est le plus cohérent pour toi',
        summary: 'Tu as déjà (ou tu veux) un compte Boursorama : centraliser banque, épargne et PEA simplifie la gestion. Interface complète, catalogue large d\'ETF et actions éligibles.',
        points: [
          'Un seul interlocuteur pour compte courant, Livret A et PEA',
          'Offres ponctuelles d\'ordres gratuits à l\'ouverture (vérifier conditions 2026)',
          'Plateforme web et app matures',
          'Idéal si tu investis déjà chez Bourso'
        ],
        caveat: 'Sur du DCA mensuel strict, les frais peuvent être supérieurs à Trade Republic ou Fortuneo Starter. Passe en revue la brochure tarifaire PEA 2026.',
        links: [
          { href: '/guides/top-5-courtiers-bourse-2026', label: 'Comparatif courtiers' },
          { href: '/outils/comparatif-courtiers-bourse', label: 'Simulateur frais courtage' },
          { href: '/guides/investir-en-bourse-france-debutant', label: 'Investir en bourse débutant' }
        ]
      },
      bourseDirect: {
        profile: 'Investisseur autonome orienté frais',
        title: 'Bourse Direct correspond à ton profil',
        summary: 'Bourse Direct affiche parmi les frais de courtage les plus bas du marché français (0,99 euro par ordre jusqu\'à 1 000 euros en 2026 selon les comparatifs publics). Adapté si tu passes tes ordres toi-même et que tu privilégies le coût pur.',
        points: [
          'Frais minimaux sur ordres manuels',
          'Catalogue large de valeurs françaises et européennes',
          'Pas de droits de garde sur le PEA',
          'Pertinent si tu investis des montants réguliers ou importants en manuel'
        ],
        caveat: 'Interface moins guidée que les néo-courtiers. Moins adapté si tu veux tout automatiser sur mobile.',
        links: [
          { href: '/guides/top-5-courtiers-bourse-2026', label: 'Top 5 courtiers' },
          { href: '/outils/calculateur-frais-bourse', label: 'Calculateur frais bourse' },
          { href: '/guides/meilleurs-etf-pea-2026', label: 'Meilleurs ETF PEA' }
        ]
      },
      xtb: {
        profile: 'Polyvalent avec support humain',
        title: 'XTB est le courtier le plus adapté',
        summary: 'XTB propose 0 % de frais de courtage sous plafond mensuel selon sa grille 2026, une interface desktop avancée et un service client joignable. Bon compromis si tu veux des outils pro sans nécessairement automatiser en DCA.',
        points: [
          'Frais de courtage très compétitifs sous plafond',
          'Support client par téléphone et email en français',
          'Plateforme xStation complète pour le suivi',
          'PEA + accès crypto via CFD (produit à haut risque, séparé du PEA)'
        ],
        caveat: 'Vérifie le catalogue ETF éligibles PEA et les plafonds de frais nuls. Les CFD crypto sont très risqués et distincts du PEA.',
        links: [
          { href: '/guides/top-5-courtiers-bourse-2026', label: 'Comparatif courtiers' },
          { href: '/guides/glossaire-finance-investissement-2026', label: 'Glossaire finance' },
          { href: '/outils/comparatif-pea-cto', label: 'Simulateur PEA vs CTO' }
        ]
      }
    };

    return profiles[winner] || profiles.tradeRepublic;
  }

  function computeStatutResult(a) {
    if (a.priorite === 'simplicite' && (a.ca === 'faible' || a.ca === 'moyen') && a.charges !== 'elevees') {
      return {
        profile: 'Créateur pragmatique',
        title: 'Micro-entreprise (auto-entrepreneur)',
        summary: 'La micro-entreprise est le statut le plus simple pour tester une activité en France : création gratuite en ligne, comptabilité allégée (livre des recettes) et cotisations calculées en pourcentage du chiffre d\'affaires.',
        points: [
          'Cotisations : 12,3 % (vente) à 25,6 % (BNC) du CA en 2026',
          'Plafond : 77 700 euros en prestations de services, 188 700 euros en vente',
          'Comptabilité minimale, idéal pour un side project ou un test marché',
          'Pas de protection chômage ni congés payés'
        ],
        caveat: 'Depuis juillet 2026, l\'Acre est réduit à 25 % (au lieu de 50 %). Au-delà des plafonds, change de régime.',
        links: [
          { href: '/outils/calculateur-micro-entreprise', label: 'Calculateur micro-entreprise' },
          { href: '/outils/comparatif-statuts-entreprise-france-2026', label: 'Comparatif statuts complet' },
          { href: '/actualites/changements-budget-juillet-2026', label: 'Actu Acre juillet 2026' }
        ]
      };
    }

    if (a.priorite === 'protection' || a.priorite === 'croissance') {
      return {
        profile: 'Entrepreneur structuré',
        title: 'SASU (ou EURL) à l\'IS',
        summary: 'Une SASU limite ta responsabilité aux apports et facilite l\'entrée d\'associés ou une levée de fonds ultérieure. Rémunération possible en salaire (protection sociale assimilée salarié) ou en dividendes (flat tax 30 %).',
        points: [
          'Responsabilité limitée au capital apporté',
          'Comptabilité et bilan obligatoires (800 à 3 000 euros/an)',
          'Optimisation possible IS 15/25 % puis distribution dividendes',
          'Évolutive vers SAS multi-associés'
        ],
        caveat: 'Coûts de création et de gestion supérieurs à la micro. Fais valider ton montage par un expert-comptable.',
        links: [
          { href: '/outils/comparatif-statuts-entreprise-france-2026', label: 'Simulateur comparatif statuts' },
          { href: '/guides/glossaire-finance-investissement-2026', label: 'Glossaire SASU, EURL, IS' },
          { href: '/outils/calculateur-impot-revenu', label: 'Simulateur impôt sur le revenu' }
        ]
      };
    }

    if (a.ca === 'eleve' || a.charges === 'elevees') {
      return {
        profile: 'Indépendant avec charges réelles',
        title: 'EI ou EURL à l\'impôt sur le revenu',
        summary: 'Au-delà du plafond micro ou avec des charges professionnelles importantes (matériel, sous-traitance, locaux), le régime réel à l\'IR permet de déduire tes frais réels et d\'optimiser le net.',
        points: [
          'Comptabilité réelle, déduction des charges professionnelles',
          'Cotisations TNS sur le bénéfice (~42 %)',
          'Pas de plafond de chiffre d\'affaires',
          'Option EIRL pour protéger le patrimoine personnel'
        ],
        caveat: 'Plus complexe administrativement. Obligation de tenir une comptabilité ou de mandater un expert-comptable.',
        links: [
          { href: '/outils/comparatif-statuts-entreprise-france-2026', label: 'Compare les statuts chiffrés' },
          { href: '/outils/calculateur-micro-entreprise', label: 'Compare avec la micro' },
          { href: '/guides/glossaire-finance-investissement-2026', label: 'Glossaire TNS, EI, EURL' }
        ]
      };
    }

    if (a.securite === 'oui' && a.situation === 'salarie') {
      return {
        profile: 'Side project en parallèle',
        title: 'Garde ton CDI + micro-entreprise en complément',
        summary: 'Tant que ton activité complémentaire reste sous les plafonds micro, tu conserves les avantages du salariat (chômage, congés, retraite cadre) tout en testant ton projet avec un statut simple.',
        points: [
          'Double activité salarié + auto-entrepreneur autorisée',
          'Micro-entreprise pour la partie freelance',
          'Pas de conflit si tu respectes ton contrat de travail',
          'Passage en société quand le CA décolle'
        ],
        caveat: 'Vérifie la clause d\'exclusivité ou de concurrence dans ton contrat de travail. Déclare ton activité secondaire.',
        links: [
          { href: '/outils/calculateur-salaire-brut-net', label: 'Calculateur salaire net' },
          { href: '/outils/calculateur-micro-entreprise', label: 'Simulateur micro' },
          { href: '/outils/comparatif-statuts-entreprise-france-2026', label: 'Quand changer de statut' }
        ]
      };
    }

    if (a.priorite === 'impots' && a.ca !== 'faible') {
      return {
        profile: 'Optimisation fiscale',
        title: 'SASU avec mix salaire + dividendes',
        summary: 'Pour optimiser impôts et protection sociale, la SASU permet de combiner une rémunération de président (cotisations assimilées salarié) et des dividendes soumis à la flat tax. Pertinent au-delà de 40 000 euros de bénéfice annuel.',
        points: [
          'Salaire = protection sociale proche du régime salarié',
          'Dividendes = flat tax 30 % sur la part distribuée',
          'IS 15 % puis 25 % sur les bénéfices en société',
          'Flexibilité du montage selon ta situation familiale'
        ],
        caveat: 'Montage complexe. Un expert-comptable est quasi indispensable dès la première année.',
        links: [
          { href: '/outils/comparatif-statuts-entreprise-france-2026', label: 'Simulateur statuts' },
          { href: '/outils/calculateur-impot-revenu', label: 'Impôt sur le revenu' },
          { href: '/guides/glossaire-finance-investissement-2026', label: 'Glossaire fiscal' }
        ]
      };
    }

    return {
      profile: 'Profil équilibré',
      title: 'Micro-entreprise pour démarrer, puis réévaluer',
      summary: 'Dans ta situation, la micro-entreprise reste le point de départ le plus rationnel. Tu pourras basculer en EURL ou SASU quand tu dépasses les plafonds ou que tes charges réelles justifient le régime réel.',
      points: [
        'Démarrage en quelques minutes sur autoentrepreneur.urssaf.fr',
        'Pas de comptabilité complexe la première année',
        'Simulateur Dodje pour estimer tes cotisations',
        'Réévalue à 12-24 mois selon ton CA réel'
      ],
      caveat: 'Ce résultat est une orientation pédagogique, pas un conseil juridique personnalisé.',
      links: [
        { href: '/outils/calculateur-micro-entreprise', label: 'Calculateur micro-entreprise' },
        { href: '/outils/comparatif-statuts-entreprise-france-2026', label: 'Comparatif chiffré des statuts' },
        { href: '/guides/glossaire-finance-investissement-2026', label: 'Glossaire statuts juridiques' }
      ]
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    initQuizWizard('quiz-pea', {
      resultId: 'quiz-pea-result',
      computeResult: computePeaResult
    });
    initQuizWizard('quiz-statut', {
      resultId: 'quiz-statut-result',
      computeResult: computeStatutResult
    });
  });
})();
