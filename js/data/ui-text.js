/**
 * Interface text (buttons, hints, tooltips) in every language.
 * Project and about-me content lives in projects.js / about.js.
 */
export const UI_TEXT = {
    en: {
        hint: 'Click a box or a frame to explore',
        back: '◀ Back',
        power: '⏻ POWER',
        powerOff: '<strong>⏻ POWER</strong> · back to the desk',
        sound: (muted) => (muted ? 'SOUND: OFF' : 'SOUND: ON'),
        projectCount: (n) => `${n} project${n > 1 ? 's' : ''}`,
        frameLabel: { photo: 'Photo', diploma: 'Diploma', text: 'About me' },

        // Project panel
        previous: 'Previous',
        next: 'Next',
        panelBack: 'Back',
        launch: '▶ Play',
        projectKeys: '← → browse · Enter play · Esc back',

        // About panel
        skills: 'Skills',
        diplomas: 'Diplomas',
        aboutKeys: 'Click a frame for a closer look · Esc back',
    },
    fr: {
        hint: 'Clique sur un carton ou un cadre pour explorer',
        back: '◀ Retour',
        power: '⏻ POWER',
        powerOff: '<strong>⏻ POWER</strong> · revenir au bureau',
        sound: (muted) => (muted ? 'SON : OFF' : 'SON : ON'),
        projectCount: (n) => `${n} projet${n > 1 ? 's' : ''}`,
        frameLabel: { photo: 'Photo', diploma: 'Diplôme', text: 'À propos' },

        previous: 'Précédent',
        next: 'Suivant',
        panelBack: 'Retour',
        launch: '▶ Lancer',
        projectKeys: '← → changer · Entrée lancer · Échap retour',

        skills: 'Compétences',
        diplomas: 'Diplômes',
        aboutKeys: 'Clique un cadre pour le voir de près · Échap retour',
    },
};
