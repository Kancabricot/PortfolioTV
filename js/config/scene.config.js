/**
 * Scene configuration: everything about *where* and *how* things are drawn.
 *
 * Every object entry accepts:
 *   model    : path to a .glb/.gltf file (e.g. 'assets/models/tv.glb').
 *              null -> a placeholder built from simple shapes is used instead.
 *   position : [x, y, z]   (desk top is y = 0, camera looks toward -z)
 *   rotation : [x, y, z]   in radians
 *   scale    : number or [x, y, z]
 *
 * Content (projects, about me) lives in js/data/, not here.
 */
export const sceneConfig = {
    renderer: {
        exposure: 1.1,
        maxPixelRatio: 2,
    },

    layout: {
        // 'left' or 'right': side of the desk holding the project cartons.
        // The about-me corner automatically takes the other side.
        cartonsSide: 'left',
    },

    camera: {
        fov: 38,
        initialView: 'home',
        transitionDuration: 1.6, // seconds
        parallax: 0.12,          // how much the camera follows the mouse
        views: {
            // minAspect: below this width/height ratio the camera backs off so the scene still fits.
            home: { position: [0, 1.95, 5.4], target: [0, 0.6, 0], minAspect: 1.75 },
        },
    },

    // Camera when a project is launched, relative to the TV screen center.
    // The console stays visible at the bottom so its POWER button can be clicked.
    tvView: {
        cameraOffset: [0, 0.5, 2.5],
        targetOffset: [0, -0.18, 0.3],
        parallax: 0.02,
        minAspect: 1.5,
    },

    // Project selection: game cases come out of the open carton and line up.
    selection: {
        // Where the selected case floats, relative to the carton stack (x is mirrored with cartonsSide).
        showcaseOffset: [0.25, 0.6, 1.3],
        // Camera relative to the showcase. targetShift moves the cases left of the screen center
        // to leave room for the info panel.
        cameraOffset: [0, 0.2, 1.5],
        targetShift: [0.32, 0, 0],
        parallax: 0.04,
        minAspect: 1.3,
        // Carousel layout
        spacing: 0.36,       // horizontal gap between cases
        depthStep: 0.22,     // side cases sit further back
        turn: 0.4,           // side cases turn toward the center (radians)
        selectedScale: 1.15,
        sideScale: 0.8,
        visibleSide: 2,      // how many cases are shown on each side of the selected one
    },

    lights: {
        hemisphere: { sky: '#9d86e0', ground: '#2a1f3d', intensity: 0.9 },
        key: { color: '#ffd2a1', intensity: 2.6, position: [-3, 5, 3], castShadow: true },
        rim: { color: '#7aa7ff', intensity: 1.4, position: [3.5, 3, -3] },
    },

    objects: {
        desk: {
            model: null,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: 1,
            size: [7, 0.2, 3.2],
            color: '#7a4f36',
        },

        tv: {
            model: null,
            position: [0, 0, -0.45],
            rotation: [0, 0, 0],
            scale: 1,
            size: [1.8, 1.4, 1.3],
            color: '#d8c7a6',
            bezelColor: '#2b2622',
            // Where the picture is drawn, in the TV's local space.
            // With a custom model, name a mesh "Screen" and it will be used instead.
            screen: { position: [-0.18, 0.72, 0.675], size: [1.24, 0.94] },
            glow: { color: '#7fb4ff', intensity: 2.5, distance: 4 },
        },

        console: {
            model: null,
            position: [0, 0, 0.8],
            rotation: [0, 0, 0],
            scale: 1,
            size: [1.0, 0.1, 0.55],
            color: '#1b1b1f',
            accentColor: '#c8102e',
        },

        cartons: {
            model: null, // one model reused for every carton of the stack
            position: [-2.3, 0, -0.1],
            rotation: [0, 0.25, 0],
            scale: 1,
            boxSize: [0.95, 0.6, 0.7],
            color: '#c49a6c',
            jitter: 0.12, // random twist between stacked boxes (radians)
            pullDistance: 0.35, // how far a carton slides out when opened
            hoverColor: '#ffcc88',
        },

        // Mega Drive style game case, one per project.
        gameCase: {
            model: null, // with a custom model, name the front mesh "Cover" to receive the jacket
            size: [0.27, 0.38, 0.045],
            color: '#141416',
        },

        about: {
            position: [2.25, 0, -0.1],
            rotation: [0, -0.2, 0],
            scale: 1,
            frameColor: '#3d2a1e',
        },
    },
};
