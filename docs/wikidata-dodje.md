# Fiches Wikidata : Dodje et Dodje Solutions

Préparé le 25 novembre 2026. But : faire reconnaître « Dodje » comme une entité par Google et Bing, qui corrigent aujourd'hui « dodje » en « dodge ».

## 1. Ce qui existe déjà

Recherche sur wikidata.org le 25/11/2026 (« Dodje », « Dodje Solutions », « Dodjé », et recherche par identifiant App Store `6743447215` et Google Play `xyz.dodje.app`) :

- Aucun élément pour l'application ni pour la société.
- **Q1773692 « Dodjé »** est un département du Tchad (Logone Occidental). Sans rapport : ne rien fusionner, ne rien lier.
- Le Wiktionnaire et Wikipédia utilisent « dodje » et « Dodjé » pour d'autres sens. Pas de lien Wikipédia à mettre.

## 2. Références publiques

| Référence | URL | Ce qu'elle prouve |
|---|---|---|
| Registre des entreprises (data.gouv) | https://annuaire-entreprises.data.gouv.fr/entreprise/990706087 | DODJE SOLUTIONS, SIREN 990 706 087, SAS (code 5710), créée le 28/08/2025, siège 8 allée du Parc d'Orléans, 45000 Orléans, active, code APE 62.01Z (programmation informatique) |
| App Store | https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215 | Appli « Dodje - Finance, Jeux, Leçons », vendeur Dodje Solutions, sortie le 20/10/2025, gratuite, langue français, catégories Éducation et Finance, site du vendeur dodje.fr |
| Google Play | https://play.google.com/store/apps/details?id=xyz.dodje.app | Appli Android, identifiant `xyz.dodje.app` |
| Site officiel | https://dodje.fr | Présentation, éditeur, liens vers les stores et les réseaux |
| Presse | aucune trouvée | Une recherche web ne renvoie aucun article indépendant sur Dodje |

Remarque : la société est enregistrée le 28/08/2025, alors que le site parle d'une fondation en 2024. Sur Wikidata, on met la date du registre (P571 = 2025-08-28), car c'est la seule date vérifiable.

## 3. Admissibilité et risque de suppression

Règle : [Wikidata:Notability](https://www.wikidata.org/wiki/Wikidata:Notability). Un élément est admissible s'il remplit **un** des trois critères :

1. Lien vers une page Wikipédia, Wikivoyage, Commons, etc. → **non** (aucune page).
2. Entité clairement identifiable, décrite par des références sérieuses et publiques → **plutôt oui, mais fragile.**
   - La société : oui. Le registre officiel français (SIREN) est une référence publique et sérieuse. C'est le meilleur point d'appui.
   - L'appli : identifiable sans ambiguïté (identifiants App Store et Google Play uniques, éditeur connu). Mais les seules sources sont celles de l'éditeur et des stores. Aucune source indépendante (presse, blog spécialisé, classement).
3. Besoin structurel : l'élément est nécessaire pour compléter un autre élément → **oui pour la société**, puisque l'appli la cite comme développeur et éditeur.

**Avis franc :**

- Risque **faible à moyen** pour la société (SIREN officiel, critère 2 + critère 3).
- Risque **moyen** pour l'appli. Les relecteurs de Wikidata suppriment souvent les éléments de jeunes startups et d'applis récentes qui n'ont que des sources « maison ». Une suppression ne pénalise pas le site, mais on perd le bénéfice.
- Ce qui réduit le risque : des références complètes sur chaque déclaration, aucun ton promotionnel dans la description, et surtout **un ou deux articles de presse indépendants** (presse locale d'Orléans comme La République du Centre ou Magcentre, médias finance perso, French Tech Centre-Val de Loire). Dès qu'un article existe, l'ajouter comme référence (P854) sur l'élément de l'appli.
- À éviter : créer une page Wikipédia maintenant (elle serait refusée pour manque de notoriété et attirerait l'attention sur l'élément Wikidata).

## 4. Fiche « Dodje Solutions » (à créer en premier)

**Libellés et descriptions**

| | Français | Anglais |
|---|---|---|
| Libellé | Dodje Solutions | Dodje Solutions |
| Description | entreprise française éditrice de l'application Dodje | French company, developer of the Dodje app |
| Alias | DODJE SOLUTIONS | — |

**Déclarations** (chaque ligne a pour référence : URL de la référence P854 = lien du registre, date de consultation P813 = 25/11/2026)

| Propriété | Valeur |
|---|---|
| nature de l'élément (P31) | entreprise (Q4830453) |
| pays (P17) | France (Q142) |
| siège (P159) | Orléans (Q6548) |
| forme juridique (P1454) | société par actions simplifiée (Q112176862) |
| date de fondation (P571) | 28 août 2025 |
| numéro SIREN (P1616) | 990706087 |
| site officiel (P856) | https://dodje.fr (référence : App Store, champ vendeur) |

## 5. Fiche « Dodje » (l'application)

**Libellés et descriptions**

| | Français | Anglais |
|---|---|---|
| Libellé | Dodje | Dodje |
| Description | application mobile française d'éducation financière | French financial education mobile app |
| Alias | Dodje - Finance, Jeux, Leçons ; Dodje app | Dodje - Finance, Jeux, Leçons ; Dodje app |

**Déclarations** (référence par défaut : P854 = URL App Store, P813 = 25/11/2026 ; exceptions indiquées)

| Propriété | Valeur | Référence |
|---|---|---|
| nature de l'élément (P31) | application mobile (Q620615) | App Store |
| nature de l'élément (P31) | jeu vidéo (Q7889) | dodje.fr |
| développé par (P178) | Dodje Solutions (Q de la société) | App Store |
| publié par (P123) | Dodje Solutions (Q de la société) | App Store |
| pays d'origine (P495) | France (Q142) | App Store |
| langue (P407) | français (Q150) | App Store |
| plateforme (P400) | iOS (Q48493) | App Store |
| plateforme (P400) | Android (Q94) | Google Play |
| date de publication (P577) | 20 octobre 2025 (qualificatif plateforme P400 = iOS) | App Store |
| site officiel (P856) | https://dodje.fr | App Store |
| identifiant App Store (P3861) | 6743447215 | App Store |
| identifiant Google Play (P3418) | xyz.dodje.app | Google Play |
| identifiant Instagram (P2003) | dodjeapp | dodje.fr |
| identifiant TikTok (P7085) | dodje.app | dodje.fr |
| identifiant X (P2002) | DodjeApp | dodje.fr |
| genre (P136) | logiciel ludo-éducatif (Q1224999) | App Store |
| sujet principal (P921) | éducation financière (Q1416374) | App Store |

La date de sortie Android n'est pas affichée publiquement sur Google Play : on ne met donc que la date iOS.

## 6. Version QuickStatements

Outil : https://quickstatements.toolforge.org/ (connexion avec le compte Wikidata). Menu « New batch », coller, « Import V1 commands », puis « Run ».

### Étape A : la société

```
CREATE
LAST	Lfr	"Dodje Solutions"
LAST	Len	"Dodje Solutions"
LAST	Dfr	"entreprise française éditrice de l'application Dodje"
LAST	Den	"French company, developer of the Dodje app"
LAST	Afr	"DODJE SOLUTIONS"
LAST	P31	Q4830453	S854	"https://annuaire-entreprises.data.gouv.fr/entreprise/990706087"	S813	+2026-11-25T00:00:00Z/11
LAST	P17	Q142	S854	"https://annuaire-entreprises.data.gouv.fr/entreprise/990706087"	S813	+2026-11-25T00:00:00Z/11
LAST	P159	Q6548	S854	"https://annuaire-entreprises.data.gouv.fr/entreprise/990706087"	S813	+2026-11-25T00:00:00Z/11
LAST	P1454	Q112176862	S854	"https://annuaire-entreprises.data.gouv.fr/entreprise/990706087"	S813	+2026-11-25T00:00:00Z/11
LAST	P571	+2025-08-28T00:00:00Z/11	S854	"https://annuaire-entreprises.data.gouv.fr/entreprise/990706087"	S813	+2026-11-25T00:00:00Z/11
LAST	P1616	"990706087"	S854	"https://annuaire-entreprises.data.gouv.fr/entreprise/990706087"	S813	+2026-11-25T00:00:00Z/11
LAST	P856	"https://dodje.fr"	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
```

Noter le Q obtenu (par exemple Q130000000). Il remplace `QSOCIETE` dans l'étape B.

### Étape B : l'application

```
CREATE
LAST	Lfr	"Dodje"
LAST	Len	"Dodje"
LAST	Dfr	"application mobile française d'éducation financière"
LAST	Den	"French financial education mobile app"
LAST	Afr	"Dodje - Finance, Jeux, Leçons"
LAST	Afr	"Dodje app"
LAST	Aen	"Dodje - Finance, Jeux, Leçons"
LAST	Aen	"Dodje app"
LAST	P31	Q620615	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P31	Q7889	S854	"https://dodje.fr/"	S813	+2026-11-25T00:00:00Z/11
LAST	P178	QSOCIETE	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P123	QSOCIETE	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P495	Q142	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P407	Q150	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P400	Q48493	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P400	Q94	S854	"https://play.google.com/store/apps/details?id=xyz.dodje.app"	S813	+2026-11-25T00:00:00Z/11
LAST	P577	+2025-10-20T00:00:00Z/11	P400	Q48493	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P856	"https://dodje.fr"	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P3861	"6743447215"	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P3418	"xyz.dodje.app"	S854	"https://play.google.com/store/apps/details?id=xyz.dodje.app"	S813	+2026-11-25T00:00:00Z/11
LAST	P2003	"dodjeapp"	S854	"https://dodje.fr/"	S813	+2026-11-25T00:00:00Z/11
LAST	P7085	"dodje.app"	S854	"https://dodje.fr/"	S813	+2026-11-25T00:00:00Z/11
LAST	P2002	"DodjeApp"	S854	"https://dodje.fr/"	S813	+2026-11-25T00:00:00Z/11
LAST	P136	Q1224999	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
LAST	P921	Q1416374	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
```

Les colonnes sont séparées par des tabulations. Si le copier-coller les transforme en espaces, QuickStatements accepte aussi les barres verticales `|` à la place.

### Étape C (facultative) : relier la société à son produit

```
QSOCIETE	P1056	QAPPLI	S854	"https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215"	S813	+2026-11-25T00:00:00Z/11
```

(P1056 = produit ou prestation.)

## 7. Marche à suivre sans QuickStatements (à la main)

1. Se connecter sur https://www.wikidata.org (créer un compte si besoin : Special:CreateAccount).
2. Aller sur https://www.wikidata.org/wiki/Special:NewItem. Langue « fr », libellé « Dodje Solutions », description et alias de la section 4. Cliquer sur « Créer ».
3. Sur la page créée, en bas de la liste des déclarations, cliquer « + ajouter une déclaration », taper l'identifiant de la propriété (P31, P17…), choisir la valeur, puis « + ajouter une référence » → P854 (URL) + P813 (date). « Publier ».
4. Ajouter les libellés anglais via « modifier » en haut de la page (bloc « Dans d'autres langues »).
5. Recommencer avec l'appli « Dodje » (section 5), en mettant le Q de la société dans P178 et P123.
6. Ne pas lier à Q1773692 ni à aucune page Wikipédia.

## 8. Après publication

- Ajouter `https://www.wikidata.org/wiki/Qxxx` dans le `sameAs` des JSON-LD Organization (Q de la société) et MobileApplication (Q de l'appli) dans `index.html` (uniquement dans le `<head>`).
- Ajouter un article de presse comme référence dès qu'il en paraît un.
- Surveiller la page de l'élément pendant 2 à 3 semaines : une proposition de suppression apparaît sur [Wikidata:Requests for deletions](https://www.wikidata.org/wiki/Wikidata:Requests_for_deletions). Si c'est le cas, y répondre en citant le SIREN et le besoin structurel.
