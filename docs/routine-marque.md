# Tâche planifiée : suivi de la marque Dodje (chaque lundi)

Objectif : savoir chaque semaine où Dodje apparaît quand on cherche « dodje » et les grandes requêtes du jeu, sur Google et dans les stores, et corriger ce qui peut l'être sur le site.

## 1. Préparer

1. Le dépôt GitHub `Dooodje/DodjeSiteWeb` doit être disponible avec droit d'écriture. S'il ne l'est pas, ajoute-le (outil `add_repo`, owner `Dooodje`, repo `DodjeSiteWeb`, access `push`) puis clone-le (`git clone --depth 50`). Sinon `git pull --rebase origin main`.
2. Lis `docs/aso-stores.md`, `docs/seo-marque.md` et le dernier rapport dans `docs/rapports/` s'il existe.

## 2. Mesurer

**Moteurs de recherche** (recherche web) :
- « dodje », « dodje app », « dodje jeu », « dodje finance »
- « jeu pour apprendre la finance », « app éducation financière », « apprendre la bourse en jouant », « jeu pour apprendre l'argent »
Pour chaque requête, note : la position de dodje.fr, le titre et la description affichés, et si Google propose « dodge » à la place.

**App Store** : `https://itunes.apple.com/search?term=<requête>&country=fr&entity=software&limit=25` (JSON). Requêtes : dodje, apprendre la finance, jeu finance, apprendre la bourse, éducation financière, apprendre crypto. Note la position de l'app `id6743447215` (ou « absente du top 25 »).

**Google Play** : `https://play.google.com/store/search?q=<requête>&c=apps&hl=fr&gl=FR`, mêmes requêtes. Note la position de `xyz.dodje.app`.

Si une page ne s'ouvre pas, dis-le dans le rapport et passe à la suite, ne contourne pas.

## 3. Écrire le rapport

`docs/rapports/marque-AAAA-MM-JJ.md` : un tableau requête / Google / App Store / Google Play, la tendance par rapport au rapport précédent (↑ ↓ =), et 3 actions maximum, classées par impact.

## 4. Corriger ce qui est sur le site

Tu peux modifier directement, si c'est justifié par la mesure :
- le titre ou la description d'une page qui se classe mal sur sa requête (garde toujours « … | Dodje » à la fin du titre, et le titre de l'accueil « Le jeu gratuit pour enfin comprendre l'argent | Dodje ») ;
- des liens internes vers les pages qui doivent remonter ;
- `docs/aso-stores.md` si une recherche montre un meilleur mot-clé.

Tu ne modifies pas : le design, les scripts, les workflows, la page d'accueil en dehors des balises title et description.

Puis :
```
git add -A
git commit -m "marque: rapport du AAAA-MM-JJ"
git pull --rebase origin main && git push origin HEAD:main
```

## 5. Rendre compte

5 lignes maximum : les positions sur « dodje » (Google, App Store, Play), le plus gros changement de la semaine, et l'action la plus utile que seul le fondateur peut faire (par exemple mettre à jour la fiche App Store avec les textes de `docs/aso-stores.md`).
