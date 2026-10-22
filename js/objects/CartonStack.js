import * as THREE from 'three';
import { applyTransform, box, loadOrPlaceholder } from '../core/ObjectFactory.js';
import { canvasTexture, drawCartonLabel } from '../utils/canvasTextures.js';
import { dampFactor, ownMaterials, setHighlight } from '../utils/animation.js';
import { tr } from '../i18n.js';

// Deterministic pseudo-random so the stack looks the same on every visit.
const seeded = (i) => {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
};

function buildCarton(def, isTop) {
    const [w, h, d] = def.boxSize;
    const g = new THREE.Group();

    const body = box(w, h, d, def.color, { roughness: 0.95 });
    body.position.y = h / 2;
    g.add(body);

    // Brown tape on the top box
    if (isTop) {
        const tape = box(0.14, 0.004, d + 0.004, '#a87a48', { roughness: 0.4 });
        tape.position.y = h + 0.002;
        g.add(tape);
    }
    return g;
}

/** One carton per category, stacked from the bottom up. */
export async function createCartonStack(def, categories) {
    const [w, h, d] = def.boxSize;
    const group = applyTransform(new THREE.Group(), def);
    group.name = 'CartonStack';

    const cartons = await Promise.all(categories.map(async (category, i) => {
        const isTop = i === categories.length - 1;
        const content = ownMaterials(await loadOrPlaceholder(def, () => buildCarton(def, isTop)));

        const carton = new THREE.Group();
        carton.name = `Carton:${category.id}`;
        carton.userData.category = category;
        carton.add(content);

        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(w * 0.9, h * 0.9),
            new THREE.MeshStandardMaterial({
                map: canvasTexture(512, 320, (ctx, cw, ch) => drawCartonLabel(ctx, cw, ch, { label: tr(category.label) })),
                transparent: true,
                roughness: 0.9,
            }),
        );
        label.position.set(0, h / 2, d / 2 + 0.002);
        carton.add(label);
        carton.userData.label = label;

        carton.position.set((seeded(i + 1) - 0.5) * 0.08, i * h, (seeded(i + 7) - 0.5) * 0.06);
        carton.rotation.y = (seeded(i + 3) - 0.5) * 2 * def.jitter;
        carton.userData.basePosition = carton.position.clone();
        carton.userData.pull = 0;
        group.add(carton);
        return carton;
    }));

    let openCarton = null;

    /** Slides a carton out of the stack like a drawer (null closes it). */
    function setOpen(carton) {
        openCarton = carton;
    }

    function setHovered(carton, hovered) {
        setHighlight(carton, def.hoverColor, hovered ? 0.25 : 0);
    }

    /** Point just above the open carton, in world space: where game cases come out. */
    function mouthOf(carton) {
        return carton.localToWorld(new THREE.Vector3(0, h * 0.8, 0));
    }

    function update(dt) {
        const k = dampFactor(8, dt);
        for (const carton of cartons) {
            const { basePosition } = carton.userData;
            const targetPull = carton === openCarton ? def.pullDistance : 0;
            carton.userData.pull += (targetPull - carton.userData.pull) * k;
            const { pull } = carton.userData;
            carton.position.set(
                basePosition.x + Math.sin(carton.rotation.y) * pull,
                basePosition.y,
                basePosition.z + Math.cos(carton.rotation.y) * pull,
            );
        }
    }

    /** Redraws the labels in the current language. */
    function refreshTexts() {
        for (const carton of cartons) {
            const { category, label } = carton.userData;
            label.material.map.redraw((ctx, cw, ch) => drawCartonLabel(ctx, cw, ch, { label: tr(category.label) }));
        }
    }

    return { group, cartons, setOpen, setHovered, mouthOf, update, refreshTexts };
}
