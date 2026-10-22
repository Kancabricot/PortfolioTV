import { sceneConfig } from './config/scene.config.js';
import { categories } from './data/projects.js';
import { about } from './data/about.js';

import { Stage } from './core/Stage.js';
import { CameraRig } from './core/CameraRig.js';
import { Interaction } from './core/Interaction.js';
import { Sound } from './core/Sound.js';
import { App } from './App.js';
import { onLanguageChange, tr } from './i18n.js';

import { createDesk } from './objects/Desk.js';
import { createTelevision } from './objects/Television.js';
import { createGameConsole } from './objects/GameConsole.js';
import { createCartonStack } from './objects/CartonStack.js';
import { createAboutCorner } from './objects/AboutCorner.js';
import { CaseShowcase } from './objects/CaseShowcase.js';
import { createDust } from './objects/Dust.js';

/** Mirrors the cartons / about-me sides when cartonsSide is 'right'. */
function sided(def, defaultSide) {
    if (sceneConfig.layout.cartonsSide === defaultSide) return def;
    const [x, y, z] = def.position;
    const [rx, ry, rz] = def.rotation ?? [0, 0, 0];
    return { ...def, position: [-x, y, z], rotation: [rx, -ry, rz] };
}

/** The pixel font has no accented capitals: 'TIMOTHÉE' -> 'TIMOTHEE'. */
const pixelText = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

/** Title screen texts of the TV, in the current language. */
const tvTexts = () => ({
    title: pixelText(`${about.firstName} ${about.lastName}`),
    subtitle: pixelText(tr(about.title)),
});

async function waitForFonts() {
    // Canvas textures need the web fonts to be ready before drawing.
    await Promise.all([
        document.fonts.load("20px 'Press Start 2P'"),
        document.fonts.load("20px 'Permanent Marker'"),
        document.fonts.load('400 20px Fredoka'),
        document.fonts.load('700 20px Fredoka'),
    ]);
}

async function init() {
    const { objects } = sceneConfig;
    const stage = new Stage(document.getElementById('scene-container'), sceneConfig);
    const rig = new CameraRig(stage.camera, sceneConfig.camera);

    await waitForFonts();

    const [desk, tv, gameConsole, cartons, aboutCorner] = await Promise.all([
        createDesk(objects.desk),
        createTelevision(objects.tv, { texts: tvTexts(), stage }),
        createGameConsole(objects.console),
        createCartonStack(sided(objects.cartons, 'left'), categories),
        // About corner sits on the opposite side of the cartons.
        createAboutCorner(sided(objects.about, 'left'), about),
    ]);

    stage.add(desk.group, tv.group, gameConsole.group, cartons.group, aboutCorner.group);

    const dust = sceneConfig.ambience.dust.enabled ? createDust(sceneConfig.ambience.dust) : null;
    if (dust) stage.add(dust.group);

    onLanguageChange(() => tv.setTexts(tvTexts()));

    const interaction = new Interaction(stage.camera, stage.renderer.domElement);
    const showcase = new CaseShowcase(stage.scene, objects.gameCase, sceneConfig.selection, interaction);
    const app = new App({
        config: sceneConfig, rig, interaction, cartons, showcase, tv, gameConsole, aboutCorner, about,
        sound: new Sound(),
    });

    stage.onTick((dt, t) => {
        rig.update(dt);
        tv.update(t);
        app.update(dt, t);
        dust?.update(t);
    });

    // Exposed for debugging in the browser console.
    window.portfolio = { app, stage, rig, tv, gameConsole, cartons, aboutCorner, showcase };

    document.getElementById('loader').classList.add('hidden');

    // Intro: the camera glides down to the desk, clicks wait until it arrives.
    app.busy = true;
    await rig.goTo('home', sceneConfig.camera.introDuration);
    app.busy = false;
}

init();
