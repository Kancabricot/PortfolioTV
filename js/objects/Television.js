import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { applyTransform, box, cylinder, loadOrPlaceholder } from '../core/ObjectFactory.js';
import { canvasTexture, drawTvIdle, drawTvLoading } from '../utils/canvasTextures.js';

const PAGE_WIDTH = 1024;       // CSS pixels of the page shown in the TV
const TURN_OFF_DURATION = 450; // ms, must match the tv-off animation in css/ui.css

function buildPlaceholder(def) {
    const [w, h, d] = def.size;
    const { position: sp, size: ss } = def.screen;
    const g = new THREE.Group();

    const body = new THREE.Mesh(
        new RoundedBoxGeometry(w, h, d, 4, 0.08),
        new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.55 }),
    );
    body.position.y = h / 2;
    g.add(body);

    const bezel = box(ss[0] + 0.12, ss[1] + 0.12, 0.04, def.bezelColor);
    bezel.position.set(sp[0], sp[1], d / 2);
    g.add(bezel);

    // Knob panel on the right
    const panelX = (sp[0] + ss[0] / 2 + w / 2) / 2;
    [0.95, 0.7].forEach((y) => {
        const knob = cylinder(0.07, 0.06, '#3a332d');
        knob.rotation.x = Math.PI / 2;
        knob.position.set(panelX, y, d / 2 + 0.03);
        g.add(knob);
    });
    for (let i = 0; i < 5; i++) {
        const grill = box(0.22, 0.015, 0.01, '#3a332d');
        grill.position.set(panelX, 0.3 + i * 0.05, d / 2 + 0.005);
        g.add(grill);
    }

    // Rabbit-ear antenna
    const base = cylinder(0.08, 0.05, '#2b2622');
    base.position.set(0.3, h + 0.025, -0.1);
    g.add(base);
    [-0.45, 0.35].forEach((angle) => {
        const rod = cylinder(0.008, 0.8, '#bfbfbf', { metalness: 0.8, roughness: 0.3 });
        rod.geometry.translate(0, 0.4, 0);
        rod.position.copy(base.position);
        rod.rotation.z = angle;
        g.add(rod);
    });

    return g;
}

/** Real HTML page placed on the screen with a CSS3D object (see Stage.addCssObject). */
function createPageLayer(screenSize) {
    const [sw, sh] = screenSize;
    const element = document.createElement('div');
    element.className = 'tv-page';
    element.style.width = `${PAGE_WIDTH}px`;
    element.style.height = `${Math.round(PAGE_WIDTH * (sh / sw))}px`;
    element.innerHTML = `
        <div class="tv-page-inner">
            <iframe title="Project"></iframe>
            <div class="tv-crt"></div>
        </div>
    `;

    const object = new CSS3DObject(element);
    object.visible = false;
    return { element, object, iframe: element.querySelector('iframe') };
}

/**
 * The CRT TV. Screen modes: 'idle' title screen, 'loading', 'page' (project page), 'off' (black).
 * Set `onPageEscape` to react to the Escape key pressed inside the page.
 */
export async function createTelevision(def, { texts, stage }) {
    let { title, subtitle } = texts;
    const content = await loadOrPlaceholder(def, () => buildPlaceholder(def));

    const group = applyTransform(new THREE.Group(), def);
    group.name = 'Television';
    group.add(content);

    // Screen: a mesh named "Screen" inside a custom model, or our own plane.
    const screenTexture = canvasTexture(640, 480, (ctx, w, h) => drawTvIdle(ctx, w, h, { title, subtitle, time: 0 }));
    const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });

    let screen = content.getObjectByName('Screen');
    if (screen) {
        screen.material = screenMaterial;
    } else {
        screen = new THREE.Mesh(new THREE.PlaneGeometry(...def.screen.size), screenMaterial);
        screen.name = 'Screen';
        screen.position.set(...def.screen.position);
        group.add(screen);
    }

    // Blueish light spilling from the screen onto the desk
    const glow = new THREE.PointLight(def.glow.color, def.glow.intensity, def.glow.distance);
    glow.position.set(def.screen.position[0], def.screen.position[1], def.screen.position[2] + 0.5);
    group.add(glow);

    // The page follows an anchor sitting just in front of the screen.
    const page = createPageLayer(def.screen.size);
    const pageAnchor = new THREE.Object3D();
    pageAnchor.position.set(...def.screen.position);
    pageAnchor.position.z += 0.002;
    group.add(pageAnchor);
    stage.addCssObject(page.object, pageAnchor, def.screen.size[0]);

    const tv = {
        group,
        screen,
        mode: 'idle',
        loadingTitle: '',
        onPageEscape: () => {},
    };

    // Forward Escape from inside the page (the iframe keeps keyboard focus once clicked).
    page.iframe.addEventListener('load', () => {
        try {
            page.iframe.contentWindow.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') tv.onPageEscape();
            });
        } catch {
            // Cross-origin page: Escape only works outside of it.
        }
    });

    /** World-space center and size of the screen, used to frame the camera. */
    tv.screenFrame = () => ({
        center: screen.getWorldPosition(new THREE.Vector3()),
        normal: new THREE.Vector3(0, 0, 1).applyQuaternion(screen.getWorldQuaternion(new THREE.Quaternion())),
        size: def.screen.size.map((v) => v * group.scale.x),
    });

    /** Changes the idle title screen texts (e.g. on language change). */
    tv.setTexts = (newTexts) => {
        ({ title, subtitle } = newTexts);
    };

    tv.setIdle = () => {
        tv.mode = 'idle';
    };

    tv.setLoading = (projectTitle) => {
        tv.mode = 'loading';
        tv.loadingTitle = projectTitle;
    };

    tv.showPage = (url) => {
        tv.mode = 'page';
        page.iframe.src = url;
        page.object.visible = true;
        page.element.classList.remove('off');
        page.element.classList.add('on');
    };

    /** Reloads the page currently on screen (e.g. in another language). */
    tv.reloadPage = (url) => {
        if (tv.mode === 'page') page.iframe.src = url;
    };

    tv.setInteractive = (interactive) => page.element.classList.toggle('interactive', interactive);

    /** Plays the turn-off animation, then goes back to the idle screen. */
    tv.hidePage = () => new Promise((resolve) => {
        tv.mode = 'off';
        tv.setInteractive(false);
        page.element.classList.remove('on');
        page.element.classList.add('off');
        setTimeout(() => {
            page.object.visible = false;
            page.iframe.src = 'about:blank';
            tv.mode = 'idle';
            resolve();
        }, TURN_OFF_DURATION);
    });

    let lastRedraw = 0;
    tv.update = (time) => {
        if (time - lastRedraw < 1 / 12) return; // retro 12 fps is plenty
        lastRedraw = time;
        if (tv.mode === 'idle') {
            screenTexture.redraw((ctx, w, h) => drawTvIdle(ctx, w, h, { title, subtitle, time }));
        } else if (tv.mode === 'off') {
            screenTexture.redraw((ctx, w, h) => {
                ctx.fillStyle = '#05070f';
                ctx.fillRect(0, 0, w, h);
            });
        } else {
            screenTexture.redraw((ctx, w, h) => drawTvLoading(ctx, w, h, { title: tv.loadingTitle, time }));
        }
        glow.intensity = def.glow.intensity * (0.9 + Math.random() * 0.15);
    };

    return tv;
}
