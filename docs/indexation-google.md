# Indexation Google de dodje.fr : audit du 25 novembre 2026

Source : Search Console (captures du 16/11/2026), recherches `site:` et vérification des URL en ligne.

## Ce qui était vrai en ligne

- Les articles auto-publiés d'octobre (SMIC, plafonds, livrets) **étaient indexés**, mais Google masquait la plupart
  d'entre eux : « nous avons omis quelques entrées qui sont très similaires ».
- **Aucun article publié depuis le 19/11 n'était dans Google** (Black Friday, Anthropic, acompte, Tracfin, gaz...).
- `/outils`, `/guides` et `/actualites` répondaient **301 vers `/outils/`...**, alors que leur canonique, le sitemap
  et les ~1 500 liens internes pointent vers la version sans slash. La canonique désignait donc une URL qui redirige
  vers la page elle-même : « Erreur liée à des redirections » (`/outils`) et « Autre page avec balise canonique
  correcte » (`/actualites/`, `/guides/`). Les hubs, principal chemin de découverte des articles, n'étaient pas indexés.
- `dodje.fr/DodjeSiteWeb/...` (ancien chemin GitHub Pages) : 404. Pas de page 404 personnalisée.
- Le script de rédaction datait l'article du **lendemain 6h30** alors qu'il était mis en ligne la veille au soir :
  `datePublished` dans le futur au premier passage de Googlebot.
- `sitemap-news.xml` contenait aussi le blog (Google News : actualités de moins de 2 jours uniquement).
- `public/sitemap.xml` et `public/feed.xml` étaient des copies figées de septembre (écrasées au build, mais trompeuses).

## Cause de « Explorée / Détectée, non indexée »

1. **Contenu à grande échelle quasi identique.** 47 pages générées en septembre et octobre (190 à 330 mots) déclinaient
   les mêmes 6 chiffres (SMIC, Livret A, LEP, LDDS, PEA, taux de crédit) en actualité + article de blog + guide.
   Exemple : `actualites/smic-horaire-brut`, `blog/une-heure-payee-au-smic`, `actualites/smic-net-mensuel`,
   `actualites/smic-mensuel-brut-et-net`... C'est exactement ce que Google classe comme contenu de faible valeur ajoutée :
   il en indexe une, laisse les autres de côté et réduit l'exploration du reste du site.
2. **23 pages de glossaire** qui répétaient trois fois la définition déjà présente dans le glossaire complet.
3. **Actualités périmées** (juillet, août, septembre 2026) remplacées par une version plus récente du même sujet.
4. **Hubs non indexables** (point ci-dessus) : les nouveaux articles n'avaient qu'un chemin de découverte faible.
5. Site jeune et peu cité : Google dose son budget d'exploration. Moins de pages, plus fortes, c'est plus d'exploration
   pour celles qui comptent.

## Ce qui a été corrigé

- **Hubs** : le build écrit `outils.html`, `guides.html`, `actualites.html` à la racine (comme `blog.html`).
  GitHub Pages sert alors `/outils` en 200 ; `/outils/` reste servi avec la même canonique. Aucun lien à changer,
  page d'accueil intacte.
- **Regroupement** : 75 pages fusionnées dans la page la plus complète de leur sujet (liste dans `public/_redirects`) :
  47 fiches chiffres, 23 pages de glossaire (vers l'ancre `#term-...` du glossaire complet, où IPO, IA et
  semi-conducteur ont été ajoutés), 1 doublon (épargne de précaution) et 4 actualités périmées.
  Les liens internes pointent directement vers la nouvelle cible.
- **Redirections GitHub Pages** : pages de redirection immédiate (meta refresh 0 + canonique, sans `noindex` qui
  contredisait la canonique), pour chaque règle et pour **toutes** les pages sous `/DodjeSiteWeb/...`.
- **Page 404** (`404.html`, noindex) avec liens vers les hubs ; elle renvoie aussi les visiteurs de `/DodjeSiteWeb/x`,
  `x.html/` ou `x/` vers la bonne adresse.
- **Noindex** sur 2 actualités périmées sans successeur (calendrier fiscal et budget de juillet 2026).
- **Sitemap, flux, llms.txt** : uniquement les pages indexables (ni redirection, ni noindex, ni 404) ; IndexNow lit ce sitemap.
  Sitemap passé de 224 à 147 URL. `sitemap-news.xml` limité aux actualités de moins de 2 jours. Le flux RSS est
  daté par la date de publication.
- **Hubs complets** : 6 guides et 8 calculateurs n'étaient liés depuis aucun hub, ils le sont.
- **Rédaction automatique** (`scripts/publish-ai-daily.mjs`) :
  - date et heure de publication réelles (jamais dans le futur) ;
  - sujet écarté avant rédaction s'il double une page existante (titre proche ou mot-clé principal déjà porté par
    une page) ; Haiku reçoit aussi la liste des guides et calculateurs pour ne pas les répéter ;
  - article écarté après rédaction s'il double une page (pas de correction : ce n'est pas un problème de forme) ;
  - « À lire aussi » choisi par sujet parmi actualités, blog et guides (plus seulement les 3 derniers) ;
  - jamais de lien vers une page en noindex ou une redirection.
  Le plafond `EDITION_BUDGET_USD` (0,15 $) n'a pas changé ; les gardes ajoutées ne coûtent rien.
- **`npm run validate:seo`** bloque désormais le déploiement si : une URL du sitemap ne répond pas en 200, redirige,
  est en noindex ou n'a pas la même canonique ; un hub n'a pas son alias ; une page de rubrique n'est pas liée depuis
  son hub ; un lien interne pointe vers une redirection ; `sitemap-news.xml` contient autre chose que des actualités
  de moins de 2 jours ; les redirections `/DodjeSiteWeb/` ou la 404 manquent.

## Règles à garder

- Une requête = une page. Avant d'écrire sur un sujet, chercher la page existante et l'enrichir plutôt que d'en créer une.
- Une actualité qui se répète (taux, barème) met à jour l'article le plus récent du sujet ou redirige l'ancien vers le nouveau.
- Pas de page par terme de glossaire : une ancre dans le glossaire complet.
- Retirer une page = ajouter une ligne dans `public/_redirects` (le build écrit la redirection) et mettre à jour les liens.

## À faire dans la Search Console (propriétaire du site)

1. **Sitemaps** : renvoyer `https://dodje.fr/sitemap.xml` (et `sitemap-news.xml`).
2. **Introuvable (404)** : « Valider la correction ». Les URL `/DodjeSiteWeb/...` redirigent ; `/conditions-utilisation.html/`
   restera en 404 (adresse qui n'a jamais existé, sans lien interne), c'est le bon comportement.
3. **Erreur liée à des redirections** (`/outils`) : « Valider la correction ».
4. **Explorée / Détectée, non indexée** : « Valider la correction » une fois le sitemap relu. Les pages regroupées
   passeront dans « Page avec redirection », c'est normal.
5. **Inspection d'URL → Demander l'indexation** (une dizaine par jour au maximum) : `/`, `/actualites`, `/blog`, `/guides`,
   `/outils`, puis les articles récents les plus utiles (ex. `/actualites/smic-decembre-2026-hausse-1-6-montant-net`,
   `/blog/epargne-de-precaution-combien-mettre-de-cote`, `/actualites/prix-immobilier-ancien-baisse-3e-trimestre-2026`,
   `/blog/acompte-sur-salaire-comment-faire`, `/guides/glossaire-finance-investissement-2026`).
6. « Autre page avec balise canonique correcte » (`/index.html`, `/conditions-utilisation.html`, `/actualites/`, `/guides/`) :
   rien à faire, c'est Google qui confirme qu'il a choisi la bonne URL.
7. `/feed.xml` « Explorée, non indexée » : normal, un flux RSS n'a pas vocation à être indexé.

Délai : quelques jours pour les redirections et les hubs, 2 à 6 semaines pour que l'indexation des articles reparte.
