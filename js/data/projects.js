/**
 * Projects, grouped by category.
 *
 * - Each category is one cardboard box in the stack (first = bottom box).
 * - Each project is one game case inside that box.
 *
 * Add a category or a project by adding an entry: the scene builds itself from this list.
 *
 * Project fields:
 *   id       : unique id, used in URLs later
 *   title    : name on the game case
 *   cover    : image for the game case front (null -> generated placeholder)
 *   color    : main color of the placeholder cover
 *   year, role, tags, summary : short info shown next to the case
 *   page     : HTML page shown inside the TV when the game is launched
 */
export const categories = [
    {
        id: 'games',
        label: 'Jeux',
        projects: [
            {
                id: 'listrik',
                title: 'Listrik',
                cover: null,
                color: '#3a7bd5',
                year: '',
                role: '',
                tags: [],
                summary: 'Résumé à écrire.',
                page: 'html/projects/listrik.html',
            },
            {
                id: 'sponge',
                title: 'Sponge',
                cover: null,
                color: '#f2c14e',
                year: '',
                role: '',
                tags: [],
                summary: 'Résumé à écrire.',
                page: 'html/projects/sponge.html',
            },
        ],
    },
    {
        id: 'jams',
        label: 'Game Jams',
        projects: [
            {
                id: 'core-defender',
                title: 'Core Defender',
                cover: null,
                color: '#e4572e',
                year: '',
                role: '',
                tags: [],
                summary: 'Résumé à écrire.',
                page: 'html/projects/core-defender.html',
            },
        ],
    },
    {
        id: 'tools',
        label: 'Outils',
        projects: [
            {
                id: 'steam-panel',
                title: 'Steam Panel',
                cover: null,
                color: '#66c0f4',
                year: '',
                role: '',
                tags: [],
                summary: 'Résumé à écrire.',
                page: 'html/projects/steam-panel.html',
            },
        ],
    },
];
