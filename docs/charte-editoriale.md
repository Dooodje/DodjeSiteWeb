# Charte éditoriale Dodje

Elle s'applique à tout ce que publient les tâches planifiées (actus et histoires). `scripts/contenu.mjs` en contrôle une partie automatiquement ; le reste dépend de toi, rédacteur.

## Pour qui on écrit

Un ou une 18-35 ans en France qui veut comprendre l'argent sans se sentir bête. Il lit sur son téléphone, dans le métro, entre deux parties de Dodje. Il n'a pas de conseiller financier et n'en veut pas.

## La voix

- **Tutoiement, toujours.** Jamais « vous ».
- **Phrases courtes.** Une idée par phrase. Si une phrase fait plus de 25 mots, coupe-la.
- **Concret avant abstrait.** Un exemple chiffré vaut mieux qu'une définition. « Sur 1 000 €, ça fait 35 € » plutôt que « une part minime ».
- **Le ton d'un pote qui s'y connaît**, pas d'un prof ni d'un banquier. On peut sourire (« Ironie de l'histoire : ces stries venaient d'un virus »), jamais se moquer du lecteur.
- **Honnête sur ce qu'on ne sait pas.** « Personne ne sait exactement pourquoi » est une bonne phrase.
- **Zéro promesse.** Pas de « devenir riche », pas de rendement promis, pas de conseil personnalisé (« achète », « vends »). On explique, le lecteur décide.

## Ce qui fait « texte d'IA » (interdit)

Refusé automatiquement par la garde :
« Dans un monde où », « Il est important de noter », « Il est crucial », « Plongeons », « En conclusion », « En somme », « Dans cet article », « Nous allons voir », « Force est de constater », « À l'ère de », « révolutionnaire », « incontournable », « N'hésite pas à », « Que tu sois... ou... », « Décortiquons », « Au cœur de », « Il était une fois », « Naviguer dans », « paysage financier ».

À éviter aussi :
- les listes de trois adjectifs (« simple, rapide et efficace ») ;
- commencer chaque section par une question rhétorique ;
- les conclusions qui résument ce qu'on vient de lire ;
- les tirets cadratins (—), les points médians (·), le tilde (~) : ils sont remplacés automatiquement, mais écris sans ;
- plus de 4 points d'exclamation par article.

## La structure qui marche (Google, Discover et moteurs IA)

1. **Titre (30 à 62 caractères)** : le mot-clé principal au début, un chiffre ou une date si possible. Il doit donner envie de cliquer sans mentir. « | Dodje » est ajouté tout seul.
2. **Chapô « En bref » (25 à 80 mots)** : la réponse complète, avec le chiffre clé et sa date. Une IA doit pouvoir le citer tel quel.
3. **Chaque section commence par une phrase en gras** qui répond seule au titre de la section, avec le chiffre et la source (« selon l'INSEE »). Puis le détail.
4. **Titres de sections = vraies questions ou promesses concrètes** (« Que s'est-il passé le 3 février 1637 ? »).
5. **Chiffres toujours attribués** dans la phrase : « selon la Banque de France », « d'après Service Public ».
6. **FAQ** : 3 à 6 questions telles que les gens les tapent dans Google, réponses autonomes de 1 à 3 phrases.
7. **2 à 5 liens internes** vers des pages qui existent (`node scripts/contenu.mjs liens`).

## Les faits

- **Chaque chiffre de l'article doit apparaître dans l'extrait d'une source** (champ `extrait`) ou dans un calcul déclaré (champ `calculs`). La garde le vérifie : un chiffre introuvable bloque la publication.
- Une actu cite au moins une **source officielle** (service-public.gouv.fr, impots.gouv.fr, INSEE, Banque de France, AMF, URSSAF, Légifrance, CAF, BCE...).
- Une mesure pas encore votée ou pas encore en vigueur est présentée comme telle.
- Une histoire distingue ce qui est établi de ce qui relève de la légende.

## Le lien avec le jeu

Quand c'est naturel (pas à chaque paragraphe), relie le sujet à l'île de Dodje : l'atelier (ton job), le moulin (ton épargne), la réserve (ta banque), le phare (tes placements), l'agence (l'immobilier), la foreuse (la crypto). Le bloc « Jouer à Dodje » en fin d'article est ajouté automatiquement : n'en ajoute pas d'autre.
