# Tâche planifiée : l'actu du jour

Objectif : **un article d'actualité par jour**, en ligne tôt le matin, utile pour l'argent d'un 18-35 ans en France, et bien indexé.
Tu travailles seul : personne ne relit avant publication. Le contrôle (`scripts/contenu.mjs`) est ton filet, pas une excuse.

## 1. Préparer

1. Le dépôt GitHub `Dooodje/DodjeSiteWeb` doit être disponible avec droit d'écriture. S'il ne l'est pas, ajoute-le (outil `add_repo`, owner `Dooodje`, repo `DodjeSiteWeb`, access `push`) puis clone-le (`git clone --depth 50`). Sinon `git pull --rebase origin main`.
2. Lis `docs/charte-editoriale.md` et `docs/format-article.md`.
3. Regarde la date du jour à Paris. Si `data/actu-auto-log.json` contient déjà une entrée à cette date, **arrête-toi** : l'actu du jour est faite.
4. `node scripts/contenu.mjs sujets actu` : ce qui est déjà publié. Ne refais pas un sujet traité, sauf s'il y a un fait nouveau et daté (et alors, angle différent et nouveau slug).

## 2. Choisir LE sujet

Cherche sur le web (recherches courtes, plusieurs angles) ce qui a changé ou va changer **dans les 7 prochains jours ou depuis 3 jours** pour l'argent des particuliers en France :
- impôts, prélèvement à la source, dates limites ;
- épargne : Livret A, LEP, PEL, assurance-vie, taux ;
- aides et prestations : CAF, prime d'activité, chèque énergie, APL, dates de versement ;
- salaire, SMIC, chômage, retraite ;
- crédit, banque, frais, assurance, énergie ;
- bourse, ETF, crypto (régulation, fiscalité, gros mouvement de marché qui inquiète) ;
- arnaques signalées par l'AMF, la DGCCRF, la police ou les banques.

Choisis le sujet **le plus utile**, pas le plus spectaculaire. Le bon test : « est-ce que ça peut changer une décision ou éviter une erreur à quelqu'un cette semaine ? ». Un sujet avec une date limite proche passe devant.

Pense recherche Google : quelle phrase les gens tapent ? (« prime de noël 2026 date », « livret a février 2027 taux »). Ce sera ton `primaryKeyword`.

## 3. Lire les sources

- Ouvre 2 à 5 pages, dont **au moins une officielle** (service-public.gouv.fr, impots.gouv.fr, economie.gouv.fr, INSEE, Banque de France, AMF, URSSAF, CAF, Légifrance...).
- Pour chaque source, note dans `extrait` les phrases qui contiennent les chiffres et les dates que tu vas utiliser. Fidèle au texte, pas plus de 120 mots par extrait.
- Si tu ne trouves pas de source officielle ou pas au moins 3 chiffres précis, change de sujet.

## 4. Écrire

Crée `content/actualites/<slug>.json` en suivant `docs/format-article.md`. Rappels :
- titre avec le mot-clé au début et un chiffre ou une date ;
- « En bref » qui donne toute la réponse ;
- une section « Ce que ça change pour toi » ou « Ce que tu peux faire » ;
- un exemple chiffré concret (et le calcul dans `calculs`) ;
- dates explicites (« le 10 décembre 2026 »), jamais « bientôt » ou « récemment » ;
- relie au jeu une fois si c'est naturel (le moulin pour l'épargne, la réserve pour la banque, etc.).

## 5. Vérifier et publier

1. `node scripts/contenu.mjs verifier content/actualites/<slug>.json`. Corrige jusqu'à obtenir ✓ (5 essais maximum ; si ça bloque toujours, change de sujet ou arrête-toi sans publier).
2. Relis-toi une fois en te demandant : « est-ce qu'un humain pourrait avoir écrit ça ? ». Supprime toute phrase qui sonne creuse.
3. `node scripts/contenu.mjs publier content/actualites/<slug>.json`
4. Publie :
   ```
   git add -A
   git commit -m "actu: <titre>"
   git pull --rebase origin main && git push origin HEAD:main
   ```
   Le push sur `main` déclenche le déploiement GitHub Pages (images, sitemap, sitemap Google News, IndexNow).

## 6. Rendre compte

Termine par 3 lignes : le titre, l'URL `https://dodje.fr/actualites/<slug>`, et le mot-clé visé. Si tu n'as rien publié, dis pourquoi en une phrase.
