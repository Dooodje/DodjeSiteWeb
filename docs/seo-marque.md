# Marque Dodje : audit et plan d'optimisation quotidienne

Audit du 25 novembre 2026. Ce fichier sert aussi de liste de tâches à l'optimisation quotidienne :
chaque jour, une seule tâche est traitée, cochée ici et notée dans le journal en bas de page.

## 1. Constat

### Correction « dodje » en « dodge »

| Où | Recherche | Ce qui s'affiche | Position de Dodje |
|---|---|---|---|
| Google | dodje | « Résultats pour dodge », Dodje seulement si on force | absent (1er si on force) |
| Google | dodje app | « Résultats pour dodge app » | absent |
| Google | dodje finance | « Résultats pour dodge finance » | absent |
| Bing | dodje | « Résultats pour dodge inclus » | 1er |
| DuckDuckGo | dodje | « Including results for dodge » | 1er hors pubs |
| Google Play | dodje | « Résultats pour dodge » | absent |
| Google | jeu pour apprendre la finance | pas de correction | 9e (guide « Meilleurs jeux ») |

**Pourquoi Google et Google Play corrigent :** « dodje » est un mot très peu cherché, à une lettre d'une marque énorme (Dodge).
Google ne connaît pas encore Dodje comme une entité, et presque personne ne clique sur « Essayez avec l'orthographe dodje ».
Aucun réglage ne désactive la correction. Elle disparaît quand trois choses s'accumulent :

1. Google identifie Dodje comme une entité : Wikidata, fiche d'établissement, profils officiels liés entre eux et au site.
2. Assez de gens cherchent « dodje » puis cliquent sur un résultat Dodje sans reformuler.
3. D'autres sites parlent de « Dodje » avec le même contexte (appli, finance, jeu) : presse, annuaires, partenaires.

Sur Google Play, s'ajoute le volume : 100+ téléchargements et 10 avis, c'est trop peu pour que Play fasse confiance à la requête.

### Le site (dodje.fr)

Bien en place : Organization, WebSite (nom « Dodje »), MobileApplication avec liens vers les stores, `sameAs` (Instagram, X,
TikTok, Discord, stores), bannière iOS `apple-itunes-app`, titres de page qui finissent par « | Dodje », llms.txt, sitemap.

À corriger :
- Le titre de l'accueil ne commence pas par « Dodje » (Google le réécrit d'ailleurs en « Dodje: Le jeu gratuit… »).
- `alternateName` de l'Organization et de l'app est rempli de mots-clés génériques (« app éducation financiere »…).
  Ça brouille l'entité : on dit à Google que Dodje s'appelle aussi « app éducation financière ».
- Pas de page « À propos » qui serve de fiche d'identité (qui, où, depuis quand, liens officiels, « Dodje s'écrit avec un j »).
- L'équipe éditoriale est déclarée comme une `Person`.
- `sameAs` sans LinkedIn, YouTube ni Wikidata.
- Pas de page dédiée à l'appli (« télécharger Dodje », « Dodje app »), alors que ce sont les requêtes de marque les plus fréquentes.

### Les stores

- App Store : « Dodje - Finance, Jeux, Leçons », sous-titre « Comprends l'argent simplement », 29 notes à 5,0.
  Le sous-titre ne contient aucun mot que les gens cherchent.
- Google Play : même titre, 4,6 sur 10 avis, 100+ téléchargements. Dodje n'apparaît pas sur la recherche « dodje ».
- Les fiches stores ne sont pas dans le code : elles se modifient dans App Store Connect et la Play Console.

## 2. Ce qui ne peut être fait que par l'équipe (comptes et accès)

Par ordre d'impact. L'optimisation quotidienne prépare les textes prêts à coller pour chacune.

- [ ] Google Search Console : vérifier dodje.fr, envoyer sitemap.xml et sitemap-news.xml, suivre la requête « dodje ».
- [x] Bing Webmaster Tools : site ajouté (45 clics, 1 900 impressions sur 5 semaines au 25 novembre 2026).
- [ ] Bing Webmaster Tools : envoyer sitemap.xml et sitemap-news.xml, vérifier IndexNow (Paramètres > IndexNow), lancer Site Scan.
- [ ] Wikidata : créer l'élément « Dodje » (application mobile, développeur Dodje Solutions, site, ID App Store, ID Google Play, Instagram).
- [ ] Fiche d'établissement Google « Dodje Solutions » à Orléans, catégorie éditeur de logiciels.
- [ ] Page LinkedIn entreprise et chaîne YouTube au nom de Dodje, liées au site.
- [ ] App Store Connect : sous-titre « Jeu pour apprendre la finance » et champ mots-clés (100 caractères).
- [ ] Play Console : description courte qui commence par « Dodje, le jeu pour apprendre la finance ».
- [ ] Avis Google Play : vérifier que la demande d'avis dans l'appli s'affiche bien sur Android.
- [ ] Mentions externes : Product Hunt, AlternativeTo, annuaires French Tech, presse et podcasts finance, toujours « Dodje, l'appli… ».
- [ ] Réseaux sociaux : renvoyer vers les liens directs des stores (pas « cherche Dodje sur le Play Store », qui tombe sur Dodge).
- [ ] Backlinks (Bing : « pas assez de liens entrants de domaines de qualité »). Plan détaillé, textes prêts à coller et journal : `docs/backlinks.md`.
  - [ ] Semaine 1 : Wikidata, LinkedIn, YouTube, Bing Places, AlternativeTo, Crunchbase, SaaSHub.
  - [ ] Semaine 2 : French Tech Loire Valley, CCI Centre-Val de Loire, Dev'Up, Welcome to the Jungle.
  - [ ] Semaine 3 : lancement Product Hunt ; 10 mails écoles et associations, 5 mails presse locale.
  - [ ] Semaine 4 : La finance pour tous, Banque de France (EDUCFI), Crésus, Finances & Pédagogie.
  - [ ] Semaine 5 : 10 podcasts finance, 10 créateurs de contenu.
  - [ ] Baromètre à partir des réponses réelles aux quiz de l'appli (données anonymes, accord de l'équipe).

## 3. Optimisations quotidiennes (une par jour, faites automatiquement)

**Règle obligatoire : la page d'accueil (index.html) ne doit jamais changer visuellement.** Sur l'accueil, seules les balises
invisibles du `<head>` (title, meta, données structurées) peuvent être modifiées ; rien dans le `<body>`, le CSS ou les scripts qu'elle charge.

Règles : une tâche par jour, la plus haute non cochée. Construire et valider le SEO avant de publier. Ne rien inventer
(chiffres, avis, distinctions). Ne pas toucher aux articles publiés par Baptiste sauf correction technique.

- [ ] Accueil, `<head>` uniquement : balise title « Dodje : le jeu gratuit pour comprendre l'argent », `alternateName` limités aux vrais noms (Dodje App, Dodje Solutions).
- [ ] Page /a-propos : fiche d'identité de Dodje (créateurs, Orléans, date de lancement, liens officiels, « s'écrit avec un j »), schéma AboutPage + Organization.
- [ ] Page /application : « Télécharger Dodje sur iPhone et Android », liens et QR code des stores, captures, FAQ installation, schéma MobileApplication.
- [ ] Équipe éditoriale déclarée en `Organization` au lieu de `Person` sur toutes les pages.
- [ ] llms.txt, ai.txt et summary.json : première phrase « Dodje (avec un j) est le jeu gratuit pour apprendre la finance ».
- [ ] Liens internes : chaque guide et article renvoie vers /application et /jeu avec « Dodje » dans le texte du lien.
- [ ] Textes prêts à coller pour l'App Store (sous-titre, mots-clés, texte promo) et Google Play (description courte et longue).
- [ ] Déclarations Wikidata prêtes à saisir (propriétés et valeurs).
- [ ] Viser le top 3 sur « jeu pour apprendre la finance » (9e aujourd'hui) : renforcer /guides/jeu-educatif-finance et le guide des meilleurs jeux.
- [ ] Page comparatif « Meilleures applis pour apprendre la finance 2026 » (Dodje + alternatives réelles, sans dénigrer).
- [ ] Vitesse : poids des images de l'accueil, LCP et CLS mesurés avec Lighthouse.
- [ ] Ajouter LinkedIn, YouTube et Wikidata dans `sameAs` dès que les profils existent.
- [ ] Contrôle des liens cassés et des redirections sur tout le site.
- [ ] Calculateurs embarquables : version iframe de 5 calculateurs (Livret A, intérêts composés, brut-net, prêt immobilier, inflation) avec code à copier et lien « Calculateur par Dodje » (voir `docs/backlinks.md`, section 5).
- [ ] Données citables : graphique téléchargeable sous licence CC BY « Source : Dodje (dodje.fr) » sur /guides/donnees-finance-france et /guides/classements-finance-france-2026.
- [ ] Kit enseignant gratuit (PDF, quiz imprimable, séquence d'une heure avec Dodje) pour les profs de SES et les associations.
- [ ] Contrôle Bing : `npm run build && node scripts/bing-audit.mjs` (titres, descriptions, h1, alt, hreflang, JSON-LD, liens), corriger ce qui sort.
- [ ] Mise à jour des guides les plus anciens (dates, chiffres officiels, liens).
- [ ] Contrôle hebdomadaire : la recherche « dodje » sur Google, Bing et Google Play, noté dans le journal.

## 4. Journal

| Date | Tâche | Résultat |
|---|---|---|
| 2026-11-25 | Audit initial | Correction en « dodge » sur Google, Bing, DuckDuckGo et Google Play |
| 2026-11-25 | Audit Bing Webmaster Tools | IndexNow refusé par Bing (403) : clé changée, soumission après chaque mise en ligne. 15 descriptions raccourcies, hreflang ajouté à 15 pages. Plan backlinks dans docs/backlinks.md |
