/**
 * Projects, grouped by category.
 *
 * - Each category is one cardboard box in the stack (first = bottom box).
 * - Each project is one game case inside that box.
 *
 * Add a category or a project by adding an entry: the scene builds itself from this list.
 *
 * Project fields:
 *   id       : unique id
 *   title    : name on the game case
 *   cover    : artwork for the game case front (null -> generated placeholder)
 *   color    : accent color (placeholder artwork, info panel)
 *   year, role, tags, summary : short info shown next to the case
 *   page     : HTML page shown inside the TV when the game is launched
 *              (copy html/projects/_template.html to start a new one)
 */
const IMG = 'assets/images/projects';

export const categories = [
    {
        id: 'school',
        label: "Projets d'école",
        projects: [
            {
                id: 'core-defender',
                title: 'CoreDefender',
                cover: `${IMG}/core-defender/CDMainPage.gif`,
                color: '#e4572e',
                year: '',
                role: '',
                tags: ['C++', 'Unreal Engine 5', 'PC'],
                summary: 'Résumé à écrire.',
                page: 'html/projects/core-defender.html',
            },
            {
                id: 'sponge',
                title: 'Sponge',
                cover: `${IMG}/sponge/cover.png`,
                color: '#f2c14e',
                year: '',
                role: '',
                tags: ['Blueprint', 'Unreal Engine', 'Mur / PC'],
                summary: 'Jeu 2 joueurs projeté sur le mur de l\'Agora, commandé par la ville de Montpellier pour « Cœur de Ville en Lumière ».',
                page: 'html/projects/sponge.html',
            },
            {
                id: 'mara',
                title: 'Mara',
                cover: `${IMG}/mara/cover.png`,
                color: '#7b5ea7',
                year: '',
                role: '',
                tags: ['Blueprint', 'Unreal Engine', 'PC'],
                summary: 'Résumé à écrire.',
                page: 'html/projects/mara.html',
            },
            {
                id: 'maze',
                title: 'Maze',
                cover: `${IMG}/maze/cover.png`,
                color: '#3fa34d',
                year: '',
                role: '',
                tags: ['C++', 'Sans moteur', 'PC'],
                summary: 'Résumé à écrire.',
                page: 'html/projects/maze.html',
            },
            {
                id: 'listrik',
                title: 'Listrik',
                cover: `${IMG}/listrik/cover.png`,
                color: '#3a7bd5',
                year: '',
                role: 'Solo',
                tags: ['JavaScript', 'Phaser 3', 'Web'],
                summary: 'Mon tout premier jeu : un puzzle-platformer autour d\'une batterie portée par un petit robot. Jouable directement dans la TV !',
                page: 'html/projects/listrik.html',
            },
        ],
    },
    {
        id: 'prototypes',
        label: 'Prototypes',
        projects: [
            {
                id: 'build-and-groove',
                title: 'Build & Groove',
                cover: `${IMG}/build-and-groove/cover.png`,
                color: '#e0559b',
                year: '',
                role: '',
                tags: ['Blueprint', 'Unreal Engine', 'PC'],
                summary: 'Résumé à écrire.',
                page: 'html/projects/build-and-groove.html',
            },
        ],
    },
    {
        id: 'jams',
        label: 'Game Jams',
        projects: [
            {
                id: 'game-jam',
                title: 'Game Jams',
                cover: `${IMG}/game-jam/cover.png`,
                color: '#66c0f4',
                year: '',
                role: '',
                tags: ['Multi-moteurs', 'Jam', 'PC'],
                summary: 'Résumé à écrire.',
                page: 'html/projects/game-jam.html',
            },
        ],
    },
];
