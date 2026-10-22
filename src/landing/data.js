// Données de la landing, partagées entre le générateur HTML et le script du navigateur.
// Positions des biomes : [left, top, width, ancreX, ancreY] en % du recadrage de l'île (biomeDisplayLayout de l'app).
export const POS = [null, [22.96, 37.77, 17.7, 31.56, 49.02], [34.87, 28.11, 20.76, 45.57, 42.24], [26.71, 53.06, 20.05, 36.74, 64.96], [38.17, 47.19, 22.97, 49.7, 59.13], [10.12, 17.65, 20.84, 20.37, 31.44], [48.95, 64.73, 21.6, 60.03, 79.69], [52.96, 35.74, 20.04, 62.89, 46.65], [54.5, 11.93, 14.12, 61.57, 26.28], [8.54, 55.22, 23.71, 20.14, 69.23], [26.3, 64.3, 27.21, 40.45, 82.62], [27.74, 18.79, 18.63, 37.04, 26.28], [41.28, 9.74, 15.39, 48.97, 24.44], [6.89, 35.23, 18.89, 16.33, 52.42], [58.2, 52.21, 20.78, 68.61, 65.27], [69.38, 30.59, 18.83, 78.61, 45.76], [68.01, 8.53, 25.61, 80.06, 21.87]]

// Comme dans l'app (GLOBAL_MAP_BIOME_ART_CHAPTER) : Immobilier (6) et Structuration pro (13)
// échangent leur visuel, chacun posé sur son propre point d'ancrage.
export function biomeLayout(n) {
  const art = n === 6 ? 13 : n === 13 ? 6 : n
  const p = POS[n], q = POS[art]
  if (art === n) return { art, pos: p }
  return { art, pos: [+(q[0] + p[3] - q[3]).toFixed(2), +(q[1] + p[4] - q[4]).toFixed(2), q[2], p[3], p[4]] }
}

// Nom court (pastille), titre et sous-titre de la collection Firestore « chapters », description.
export const CHAPTERS = [null,
  { name: 'Mindset', monde: 'Fondations', title: "L'Éveil", sub: "Le rapport à l'argent", desc: 'Détruis tes croyances limitantes et pose les vraies fondations de la richesse.' },
  { name: 'Budget', monde: 'Fondations', title: 'Le Nettoyage', sub: 'Organiser son budget', desc: 'Éliminez vos dettes toxiques et vos mauvaises habitudes pour libérer votre horizon financier.' },
  { name: 'Sécurité', monde: 'Fondations', title: 'La Citadelle', sub: "Matelas d'épargne", desc: "Bâtissez vos premières défenses : l'épargne de précaution pour devenir inattaquable." },
  { name: 'Fiscalité', monde: 'Accumulation', title: "L'Armurerie", sub: 'Impôts & Optimisation', desc: 'Maîtrisez les comptes stratégiques et les livrets pour stocker et multiplier votre valeur.' },
  { name: 'Bourse', monde: 'Accumulation', title: 'Les Marchés', sub: 'Bourse & ETF', desc: "Apprenez à naviguer sur les courants de l'économie mondiale et des marchés financiers." },
  { name: 'Immobilier', monde: 'Accumulation', title: 'La Pierre', sub: 'Immobilier', desc: "Ancrez votre richesse dans le réel en maîtrisant les bases de l'investissement locatif." },
  { name: 'Crypto', monde: 'Accumulation', title: 'Le Nouveau Monde', sub: 'Crypto', desc: 'Explorez les terres émergentes de la blockchain et de la finance décentralisée.' },
  { name: 'Or et divers', monde: 'Accumulation', title: 'Le Coffre-Fort', sub: 'Métaux', desc: 'Sécurisez et optimisez vos actifs précieux pour une croissance saine à long terme.' },
  { name: 'Allocation', monde: 'Stratégie', title: "L'Alchimiste", sub: "Allocation d'actifs", desc: "L'art de l'allocation d'actifs : transformez vos investissements en un système harmonieux." },
  { name: 'Défiscalisation', monde: 'Expertise', title: 'Le Labyrinthe', sub: 'Défiscalisation & SCPI', desc: 'Maîtrisez les règles du jeu fiscal pour protéger vos rendements des méandres administratifs.' },
  { name: 'Private Equity', monde: 'Expertise', title: "L'Économie Réelle", sub: 'Private Equity', desc: 'Comprenez les rouages profonds de la création de valeur concrète et du business.' },
  { name: 'Trading', monde: 'Expertise', title: 'La Salle des Marchés', sub: 'Trading', desc: 'Affrontez la volatilité extrême et apprenez à dompter les risques de haute altitude.' },
  { name: 'Structuration pro', monde: 'Expertise', title: "L'Empire", sub: 'Holding & Sociétés', desc: 'Érigez des structures juridiques puissantes pour dominer et protéger votre écosystème.' },
  { name: 'International', monde: 'Expertise', title: "L'International", sub: 'Expatriation & Devises', desc: "Déployez votre capital à l'échelle mondiale pour une liberté géographique et financière." },
  { name: 'Héritage', monde: 'Expertise', title: "L'Héritage", sub: 'Transmission', desc: 'Préparez votre succession et assurez la pérennité de votre richesse sur plusieurs générations.' },
  { name: "L'Arène", monde: 'Compétition', title: "L'Arène", sub: 'Tournoi entre joueurs', desc: 'Chaque semaine, mets en pratique ce que tu as appris face aux autres joueurs.' }
]

export const BUILDINGS = [
  { id: 'atelier', tag: 'Ton job', title: "L'atelier", desc: 'Tape dessus pour toucher ton salaire à chaque session.' },
  { id: 'moulin', tag: 'Ton épargne', title: 'Le moulin', desc: 'Ton épargne de précaution : sûre, mais pas très généreuse.' },
  { id: 'reserve', tag: 'Ta banque', title: 'La réserve', desc: "Elle protège ton argent, mais l'inflation le grignote." },
  { id: 'phare', tag: 'Tes placements', title: 'Le phare', desc: 'Actions et ETF pour faire grandir ton patrimoine.' },
  { id: 'agence', tag: 'Ton immobilier', title: "L'agence", desc: 'Achète, loue, valorise, pierre après pierre.' },
  { id: 'foreuse', tag: 'Ton wallet', title: 'La foreuse', desc: 'Bitcoin, Ethereum : comprends avant de te lancer.' }
]

// 3 questions simples par biome : [quiz], [vrai ou faux], [curseur]
export const QUIZ = {
  1: [["Qu'est-ce qui te rend vraiment plus riche sur la durée ?", ["Gagner plus, point", "Dépenser moins que ce que tu gagnes et placer l'écart", "Attendre un coup de chance"], 1, "Ce n'est pas ce que tu gagnes qui compte, c'est ce que tu gardes et fais grandir."],
      ["Un gros salaire suffit toujours à devenir riche.", false, "Sans épargne ni investissement, même un gros salaire peut tout dépenser."],
      ["Tu mets 100 € de côté chaque mois. Combien as-tu au bout d'un an ?", ["600 €", "1 000 €", "1 200 €", "1 500 €"], 2, "100 € fois 12 mois, ça fait 1 200 €. Petit à petit, ça monte."]],
  2: [["La règle 50/30/20, c'est…", ["50 % besoins, 30 % envies, 20 % épargne", "50 % épargne, 30 % loyer, 20 % sorties", "50 % impôts, 30 % courses, 20 % loisirs"], 0, "Une base simple : les besoins, les envies, puis l'épargne."],
      ["Faire un budget, c'est forcément se priver de tout.", false, "Un budget sert à choisir où va ton argent, pas à tout t'interdire."],
      ["Avec 2 000 € par mois et la règle 50/30/20, combien épargnes-tu ?", ["200 €", "400 €", "600 €", "1 000 €"], 1, "20 % de 2 000 €, ça fait 400 € par mois."]],
  3: [["À quoi sert l'épargne de précaution ?", ["Faire face à un imprévu sans t'endetter", "Spéculer en bourse", "Payer tes vacances"], 0, "C'est ton coussin de sécurité en cas de coup dur."],
      ["L'épargne de précaution doit pouvoir être retirée rapidement.", true, "Elle doit être disponible tout de suite, par exemple sur un livret."],
      ["Combien de mois de dépenses garde-t-on souvent de côté ?", ["1 mois", "3 à 6 mois", "12 mois", "24 mois"], 1, "La règle courante : de 3 à 6 mois de dépenses."]],
  4: [["En France, l'impôt sur le revenu fonctionne par…", ["Tranches, chacune avec son taux", "Un taux unique sur tout le revenu", "Tirage au sort"], 0, "Chaque tranche de revenu a son propre taux."],
      ["Passer dans une tranche supérieure fait baisser ton revenu après impôt.", false, "Seule la partie au-dessus du seuil est taxée plus fort."],
      ["Combien de tranches compte le barème de l'impôt sur le revenu ?", ["3", "5", "7", "10"], 1, "5 tranches : 0 %, 11 %, 30 %, 41 % et 45 %."]],
  5: [["Un ETF, c'est…", ["Un panier d'actions acheté d'un coup", "Un livret bancaire garanti", "Une crypto"], 0, "Un ETF suit tout un indice : tu diversifies en un seul achat."],
      ["Mettre tout ton argent sur une seule action, c'est bien diversifier.", false, "C'est l'inverse : si elle chute, tout chute."],
      ["À 7 % par an, en combien d'années ton argent double-t-il environ ?", ["5 ans", "10 ans", "15 ans", "20 ans"], 1, "Règle de 72 : 72 divisé par 7, environ 10 ans."]],
  6: [["Acheter un bien pour le louer, c'est un investissement…", ["Locatif", "Boursier", "Fiscal"], 0, "Le loyer rembourse une partie du bien au fil du temps."],
      ["Un loyer encaissé, c'est entièrement du bénéfice.", false, "Il faut retirer les charges, les impôts, les travaux et le crédit."],
      ["Un appartement à 100 000 € loué 500 € par mois : quel rendement brut ?", ["3 %", "6 %", "9 %", "12 %"], 1, "6 000 € de loyers par an sur 100 000 €, ça fait 6 % brut."]],
  7: [["Combien de bitcoins existeront au maximum ?", ["21 millions", "Une quantité illimitée", "1 milliard"], 0, "Le nombre de bitcoins est plafonné à 21 millions."],
      ["Une crypto peut perdre plus de la moitié de sa valeur en peu de temps.", true, "Les cryptos sont très volatiles : prudence avant d'investir."],
      ["En quelle année le bitcoin a-t-il été lancé ?", ["2005", "2009", "2013", "2017"], 1, "Le réseau Bitcoin démarre en janvier 2009."]],
  8: [["On dit souvent que l'or sert de…", ["Valeur refuge en temps de crise", "Placement garanti à 10 %", "Monnaie pour les courses"], 0, "L'or tient souvent mieux quand tout le reste tremble."],
      ["L'or verse des dividendes chaque année.", false, "L'or ne rapporte rien en lui-même : tout se joue sur son prix."],
      ["De l'or pur, c'est combien de carats ?", ["14", "18", "22", "24"], 3, "24 carats, c'est de l'or pur."]],
  9: [["Diversifier, c'est…", ["Répartir ton argent entre plusieurs placements", "Tout mettre sur le meilleur placement", "Changer souvent de banque"], 0, "Plusieurs paniers, pour ne pas tout perdre d'un coup."],
      ["Plus ton horizon de placement est long, plus tu peux en général prendre de risque.", true, "Le temps aide à lisser les hauts et les bas."],
      ["Règle des « 100 moins ton âge » : à 30 ans, quelle part en actions ?", ["30 %", "50 %", "70 %", "90 %"], 2, "100 moins 30, ça donne 70 % en actions. C'est un repère, pas une loi."]],
  10: [["Une SCPI permet de…", ["Investir dans l'immobilier avec d'autres épargnants", "Acheter des cryptos", "Ne plus payer d'impôts"], 0, "Tu achètes des parts d'un parc immobilier géré pour toi."],
      ["Une réduction d'impôt rend un placement bon à coup sûr.", false, "Un mauvais placement reste mauvais, même défiscalisé."],
      ["Le plafond de versement d'un PEA classique est de…", ["75 000 €", "150 000 €", "225 000 €", "Illimité"], 1, "150 000 € de versements sur un PEA classique."]],
  11: [["Le private equity, c'est investir dans…", ["Des entreprises non cotées en bourse", "Des livrets d'épargne", "Des matières premières"], 0, "Tu finances des entreprises qui ne sont pas en bourse."],
      ["On revend une part de startup aussi facilement qu'une action cotée.", false, "Ton argent reste souvent bloqué plusieurs années."],
      ["Un fonds de private equity bloque souvent ton argent pendant…", ["1 an", "3 ans", "8 à 10 ans", "30 ans"], 2, "Souvent 8 à 10 ans avant de récupérer ta mise."]],
  12: [["Un ordre stop loss sert à…", ["Limiter tes pertes en vendant automatiquement", "Doubler tes gains", "Bloquer ton compte"], 0, "Il coupe la position si le prix descend trop."],
      ["Le trading à court terme est plus risqué que l'investissement à long terme.", true, "Plus l'horizon est court, plus le hasard pèse lourd."],
      ["Tu perds 50 % sur une position. Combien faut-il regagner pour revenir à zéro ?", ["50 %", "75 %", "100 %", "150 %"], 2, "De 50 à 100, il faut doubler : +100 %."]],
  13: [["Une holding, c'est une société qui…", ["Détient des parts d'autres sociétés", "Vend des produits en magasin", "Prête aux particuliers"], 0, "Elle sert à piloter et à protéger tes autres sociétés."],
      ["Ton argent perso et celui de ta société, c'est la même chose.", false, "Ce sont deux patrimoines séparés."],
      ["Combien d'associés faut-il au minimum pour créer une SAS ?", ["1", "2", "5", "7"], 0, "Un seul suffit : on parle alors de SASU."]],
  14: [["Quand l'euro baisse face au dollar, un voyage aux États-Unis devient…", ["Plus cher", "Moins cher", "Gratuit"], 0, "Avec un euro plus faible, chaque dollar te coûte plus."],
      ["Le taux de change peut faire varier tes placements à l'étranger.", true, "Même si l'actif ne bouge pas, la devise peut bouger."],
      ["1 € vaut 1,10 $. Combien de dollars pour 100 € ?", ["90 $", "100 $", "110 $", "120 $"], 2, "100 fois 1,10, ça fait 110 $."]],
  15: [["Transmettre son patrimoine de son vivant, ça s'appelle…", ["Une donation", "Un crédit", "Une franchise"], 0, "Une donation transmet de ton vivant, souvent avec moins d'impôts."],
      ["L'assurance vie peut servir à transmettre un capital.", true, "Elle permet de désigner librement qui reçoit l'argent."],
      ["Abattement d'un parent vers chaque enfant, tous les 15 ans ?", ["50 000 €", "100 000 €", "150 000 €", "300 000 €"], 1, "100 000 € par parent et par enfant, tous les 15 ans."]],
  16: [["Les intérêts composés, c'est…", ["Gagner des intérêts sur tes intérêts", "Payer deux fois tes impôts", "Un prêt à taux zéro"], 0, "Tes gains produisent à leur tour des gains : c'est l'effet boule de neige."],
      ["Un placement qui promet un gros rendement sans risque, c'est souvent une arnaque.", true, "Rendement et risque vont toujours ensemble."],
      ["1 000 € à 10 % par an pendant 2 ans, intérêts composés ?", ["1 100 €", "1 200 €", "1 210 €", "1 300 €"], 2, "1 000 → 1 100 → 1 210 € : les intérêts rapportent aussi."]]
}
