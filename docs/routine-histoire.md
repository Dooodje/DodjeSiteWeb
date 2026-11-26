# Tâche planifiée : une histoire de l'argent (lundi, mercredi, vendredi)

Objectif : **3 histoires par semaine** sur l'histoire de l'économie, de la bourse, de la monnaie et de la crypto, racontées comme une bonne anecdote entre amis, avec à la fin **la leçon pour ton argent**. Ces pages sont intemporelles : elles doivent pouvoir se lire dans 5 ans et être citées par les moteurs IA.

## 1. Préparer

1. Le dépôt GitHub `Dooodje/DodjeSiteWeb` doit être disponible avec droit d'écriture. S'il ne l'est pas, ajoute-le (outil `add_repo`, owner `Dooodje`, repo `DodjeSiteWeb`, access `push`) puis clone-le (`git clone --depth 50`). Sinon `git pull --rebase origin main`.
2. Lis `docs/charte-editoriale.md`, `docs/format-article.md` et l'exemple `content/histoire/tulipomanie-1637-premiere-bulle-speculative.json`.
3. Si `data/histoire-log.json` contient déjà une entrée à la date du jour (Paris), **arrête-toi**.

## 2. Choisir le sujet

1. `node scripts/contenu.mjs sujets histoire` : ce qui est déjà publié.
2. Ouvre `data/histoire-calendrier.json`.
   - **Priorité 1** : un sujet dont l'`anniversaire` (MM-JJ) tombe dans les 5 prochains jours. L'angle « il y a X ans, jour pour jour » marche très bien sur Google Discover.
   - **Priorité 2** : le premier sujet de la liste qui n'est pas encore publié.
   - Tu peux aussi choisir un sujet hors liste s'il est lié à l'actualité de la semaine (un krach qui rappelle 1929, une nouvelle bulle...). Ajoute-le alors à la liste avec `"publie": true`.
3. Une fois publié, passe `"publie": true` sur le sujet dans `data/histoire-calendrier.json`.

## 3. Se documenter

- 3 à 6 sources sérieuses : Banque de France (fiches « Mot de l'actu », ABC de l'économie), Citéco, BnF/Gallica, INSEE, AMF, BCE, Fed, BIS, FMI, encyclopédies (Universalis, Wikipedia pour croiser les dates), livres d'histoire économique connus.
- Croise chaque date et chaque chiffre sur au moins 2 sources quand c'est possible. Si les sources divergent, dis-le (« entre 2 000 et 3 000 florins selon les récits »).
- Sépare clairement le prouvé de la légende (comme le marin et son bulbe de tulipe).
- Recopie dans chaque `extrait` les phrases avec les chiffres et les dates que tu utilises (120 mots maximum par extrait).

## 4. Écrire

Crée `content/histoire/<slug>.json` (format : `docs/format-article.md`). Ce qui fait une bonne histoire Dodje :
- **une accroche concrète** dans le titre : un objet, un chiffre, un personnage (« Tulipomanie : quand un bulbe valait une maison ») ;
- **un récit chronologique** avec des scènes : un lieu, une date, des gens ;
- **les mécanismes expliqués simplement** (pourquoi les prix montent, pourquoi ça casse) ;
- **le pont avec aujourd'hui** (crypto, bourse, immobilier, inflation...) ;
- **`lesson`** : une leçon actionnable pour un jeune adulte, sans conseil d'investissement personnalisé ;
- le lien avec l'île de Dodje quand il est naturel (le phare pour la bourse, la foreuse pour la crypto, la réserve pour les banques, le moulin pour l'épargne) ;
- `eventDate` renseignée.

## 5. Vérifier et publier

1. `node scripts/contenu.mjs verifier content/histoire/<slug>.json`. Corrige jusqu'à ✓ (5 essais maximum).
2. Relis en te demandant : « est-ce que j'aurais envie de raconter ça à un ami ? ». Coupe ce qui est scolaire.
3. `node scripts/contenu.mjs publier content/histoire/<slug>.json`
4. Publie :
   ```
   git add -A
   git commit -m "histoire: <titre>"
   git pull --rebase origin main && git push origin HEAD:main
   ```

## 6. Rendre compte

3 lignes : le titre, l'URL `https://dodje.fr/histoire/<slug>`, le mot-clé visé.
