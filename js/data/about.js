/**
 * About me: the frames standing on the side of the desk.
 *
 * Frame kinds:
 *   'photo'   : picture frame showing `about.photo` (or initials if null)
 *   'diploma' : certificate style frame (heading / title / subtitle)
 *   'text'    : card with a title and a paragraph (defaults to the bio)
 *
 * Placement is local to the about corner (see sceneConfig.objects.about):
 *   position : [x, y, z]   bottom-center of the frame, y = 0 is the desk
 *   rotationY: turn toward the camera (radians)
 *   lean     : how much the frame leans back (radians)
 *   size     : [width, height]
 */
export const about = {
    firstName: 'Timothée',
    lastName: 'Fontan',
    title: 'Game Developer & Gameplay Programmer',
    photo: 'assets/images/about/profile.png',
    bio: "Développeur gameplay passionné. Ce texte est un placeholder : écris ici quelques lignes sur toi, ton parcours et ce que tu aimes créer.",
    // Shown in the About me panel (empty lists are hidden).
    skills: ['Unreal Engine', 'C++', 'Blueprint', 'JavaScript'],
    links: [
        { label: 'GitHub', url: 'https://github.com/Kancabricot' },
        { label: 'itch.io', url: 'https://kancabricot.itch.io' },
    ],

    frames: [
        {
            kind: 'diploma',
            heading: 'Diplôme',
            title: 'Nom du diplôme',
            subtitle: 'École — Année',
            position: [0.25, 0, -0.4],
            rotationY: -0.1,
            lean: 0.15,
            size: [0.95, 0.7],
        },
        {
            kind: 'text',
            title: 'About me',
            position: [-0.6, 0, 0.1],
            rotationY: 0.15,
            lean: 0.18,
            size: [0.62, 0.78],
        },
        {
            kind: 'photo',
            position: [0.45, 0, 0.5],
            rotationY: -0.35,
            lean: 0.22,
            size: [0.5, 0.6],
        },
    ],
};
