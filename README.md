# Portfolio TV

Portfolio 3D (Three.js) : un bureau avec une TV cathodique, une console style Mega Drive,
des cartons de projets et des cadres "about me".

## Lancer en local

```bash
npm start
```

Puis ouvrir http://localhost:5173 (aucune dépendance à installer, Three.js est chargé depuis un CDN).

## Où modifier quoi

| Je veux…                                   | Fichier                         |
|--------------------------------------------|---------------------------------|
| Ajouter / éditer un projet ou une catégorie | `js/data/projects.js`           |
| Éditer mon nom, ma photo, mes cadres        | `js/data/about.js`              |
| Déplacer un objet, changer couleurs/caméra  | `js/config/scene.config.js`     |
| Remplacer un cube par un vrai modèle 3D     | `model: 'assets/models/xxx.glb'` dans `scene.config.js` |
| Mettre les cartons à droite                 | `layout.cartonsSide: 'right'`   |
| Régler le carrousel de boîtes de jeu        | `selection` dans `scene.config.js` |
| Mettre une vraie jaquette                   | `cover: 'assets/images/projects/xxx.jpg'` dans `projects.js` |

### Modèles 3D

Chaque objet de `scene.config.js` a un champ `model`. Laissé à `null`, un placeholder est généré.
Pour la TV, nomme le maillage de l'écran `Screen` dans ton modèle (Blender) pour que l'image s'y affiche.
Pour la console, nomme le bouton `PowerButton`.

## Structure

```
index.html                 page d'entrée (reste à la racine pour l'hébergement, ex. GitHub Pages)
css/                       feuilles de style
html/
  projects/                pages HTML des projets (affichées dans la TV)
js/
  config/scene.config.js   positions, couleurs, caméra, modèles
  data/                    contenu (projets, about me)
  core/                    rendu, caméra, interactions, chargement des modèles
  objects/                 un fichier par objet de la scène
  ui/                      interface HTML par-dessus la scène
  utils/                   textures dessinées, animations
  tools/serve.mjs          petit serveur local (npm start)
assets/
  models/                  fichiers .glb
  images/                  photos, jaquettes
```