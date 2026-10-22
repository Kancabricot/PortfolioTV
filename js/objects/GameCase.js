import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { loadOrPlaceholder } from '../core/ObjectFactory.js';
import { tr } from '../i18n.js';
import {
    canvasTexture, drawGameCover, drawGameSpine, loadImage,
} from '../utils/canvasTextures.js';

const COVER_PX = 1200; // texture pixels per unit

function buildPlaceholder(def) {
    const [w, h, d] = def.size;
    return new THREE.Mesh(
        new RoundedBoxGeometry(w, h, d, 2, 0.008),
        new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.35 }),
    );
}

/** A game case (centered on its pivot) showing a project's jacket on the front. */
export async function createGameCase(def, project, category) {
    const [w, h, d] = def.size;
    const content = await loadOrPlaceholder(def, () => buildPlaceholder(def));

    const group = new THREE.Group();
    group.name = `GameCase:${project.id}`;
    group.userData.project = project;
    group.add(content);

    // Jacket
    const cw = Math.round(w * COVER_PX);
    const ch = Math.round(h * COVER_PX);
    let image = null;
    const drawCover = (ctx) => drawGameCover(ctx, cw, ch, {
        title: tr(project.title),
        color: project.color,
        label: tr(category.label),
        image,
    });
    const coverTexture = canvasTexture(cw, ch, drawCover);
    if (project.cover) {
        loadImage(project.cover)
            .then((loaded) => {
                image = loaded;
                coverTexture.redraw(drawCover);
            })
            .catch(() => console.warn(`Could not load cover "${project.cover}"`));
    }
    group.userData.refreshTexts = () => coverTexture.redraw(drawCover);
    const coverMaterial = new THREE.MeshStandardMaterial({ map: coverTexture, roughness: 0.3 });

    const customCover = content.getObjectByName('Cover');
    if (customCover) {
        customCover.material = coverMaterial;
    } else {
        const cover = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.96), coverMaterial);
        cover.position.z = d / 2 + 0.001;
        group.add(cover);

        const spineTexture = canvasTexture(Math.round(d * COVER_PX * 2), Math.round(h * COVER_PX), (ctx, sw, sh) => drawGameSpine(ctx, sw, sh, project));
        const spine = new THREE.Mesh(
            new THREE.PlaneGeometry(d * 0.8, h * 0.96),
            new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.35 }),
        );
        spine.position.x = -w / 2 - 0.001;
        spine.rotation.y = -Math.PI / 2;
        group.add(spine);
    }

    // Floating cases look better without hard shadows on the desk.
    group.traverse((child) => {
        if (child.isMesh) child.castShadow = false;
    });
    return group;
}

export function disposeObject(object) {
    object.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry.dispose();
        for (const m of [].concat(child.material)) {
            m.map?.dispose();
            m.dispose();
        }
    });
}
