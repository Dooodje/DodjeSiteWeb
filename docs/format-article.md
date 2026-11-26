# Format d'un article (fichier JSON)

Un article = un fichier `content/actualites/<slug>.json` ou `content/histoire/<slug>.json`.
Exemple complet : `content/histoire/tulipomanie-1637-premiere-bulle-speculative.json`.

```
node scripts/contenu.mjs verifier content/histoire/mon-article.json   # contrôle, n'écrit rien
node scripts/contenu.mjs publier  content/histoire/mon-article.json   # crée la page, met à jour hubs, accueil et journal
node scripts/contenu.mjs sujets histoire                              # ce qui est déjà publié
node scripts/contenu.mjs liens                                        # pages internes qu'on peut lier
```

| Champ | Obligatoire | Règle |
|---|---|---|
| `kind` | oui | `"actu"` ou `"histoire"` |
| `slug` | oui | 3 à 12 mots, minuscules, sans accents, tirets. Contient le mot-clé. Ne change plus jamais une fois publié. |
| `kicker` | oui | Rubrique courte (32 caractères max) : « Impôts », « Épargne », « Bulles et krachs », « Crypto »... |
| `title` | oui | 30 à 62 caractères, mot-clé au début. Sans « \| Dodje » (ajouté automatiquement). |
| `primaryKeyword` | oui | La requête Google visée (« tulipomanie », « prime de noël 2026 »). |
| `metaDescription` | oui | 110 à 158 caractères, donne la réponse et un chiffre, finit par un point. |
| `bluf` | oui | Chapô « En bref », 25 à 80 mots, répond à la question avec le chiffre clé et la date. |
| `keyFigures` | non | 0 à 4 `{ "value": "10 000 florins", "label": "..." }` affichés en cartes. |
| `keyPoints` | oui | 3 à 5 phrases « À retenir ». |
| `sections` | oui | 4 à 8 `{ "h2": "...", "html": "..." }`. Balises autorisées : p, ul, ol, li, strong, em, a, table, thead, tbody, tr, th, td, br, blockquote. Chaque section commence par `<p><strong>réponse directe</strong> ...`. |
| `lesson` | histoire | « La leçon pour ton argent » : 15 mots minimum, concrète. |
| `definitions` | non | 0 à 4 `{ "term", "definition" }`. |
| `faq` | oui | 3 à 6 `{ "question", "answer" }`. |
| `internalLinks` | oui | 2 à 5 `{ "href": "/guides/...", "label" }`, href pris dans `contenu.mjs liens`. |
| `sources` | oui | 2 à 8 `{ "label", "url", "extrait" }`. L'extrait (15 mots minimum) reprend les phrases de la source qui contiennent les chiffres utilisés. URL https exacte. |
| `calculs` | non | Calculs faits à partir des sources (« 3,5 % de 1 000 florins = 35 florins »), pour que la garde accepte les chiffres dérivés. |
| `eventDate` | non | Histoire : date de l'événement (AAAA-MM-JJ). |
| `update` | non | `true` pour republier une page existante (même slug) en gardant sa date de publication. |

Longueur : 650 à 1 600 mots pour une actu, 800 à 2 000 pour une histoire.

Ce que le script fait à la publication :
- page HTML dans le design éditorial, titre « … | Dodje », auteur Dodje Solutions, données structurées (NewsArticle ou Article, FAQPage), image (créée au déploiement) ;
- carte en tête du hub (`/actualites` ou `/histoire`) et dans « Le journal de l'île » de l'accueil ;
- entrée dans le journal (`data/actu-auto-log.json` ou `data/histoire-log.json`), repris par le sitemap, le sitemap Google News (actus), le flux RSS et llms.txt au déploiement ;
- au déploiement : IndexNow (Bing, Yandex, Seznam...) reçoit les nouvelles URL.
