import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { applyTransform, box, cylinder, loadOrPlaceholder } from '../core/ObjectFactory.js';
import { canvasTexture, drawTvIdle } from '../utils/canvasTextures.js';

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

export async function createTelevision(def, { title, subtitle }) {
    const content = await loadOrPlaceholder(def, () => buildPlaceholder(def));

    const group = applyTransform(new THREE.Group(), def);
    group.name = 'Television';
    group.add(content);

    // Screen: a mesh named "Screen" inside a custom model, or our own plane.
    const idleTexture = canvasTexture(640, 480, (ctx, w, h) => drawTvIdle(ctx, w, h, { title, subtitle, time: 0 }));
    const screenMaterial = new THREE.MeshBasicMaterial({ map: idleTexture, toneMapped: false });

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

    let lastRedraw = 0;
    function update(time) {
        if (time - lastRedraw < 1 / 12) return; // retro 12 fps is plenty
        lastRedraw = time;
        idleTexture.redraw((ctx, w, h) => drawTvIdle(ctx, w, h, { title, subtitle, time }));
        glow.intensity = def.glow.intensity * (0.9 + Math.random() * 0.15);
    }

    return { group, screen, update };
}
