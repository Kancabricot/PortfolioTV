import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();
const modelCache = new Map();

async function loadModel(path) {
    if (!modelCache.has(path)) modelCache.set(path, gltfLoader.loadAsync(path));
    const gltf = await modelCache.get(path);
    return gltf.scene.clone(true);
}

export function enableShadows(object) {
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    return object;
}

export function applyTransform(object, { position, rotation, scale } = {}) {
    if (position) object.position.set(...position);
    if (rotation) object.rotation.set(...rotation);
    if (scale !== undefined) {
        if (Array.isArray(scale)) object.scale.set(...scale);
        else object.scale.setScalar(scale);
    }
    return object;
}

/**
 * Returns the 3D content for an object definition:
 * the model at `def.model` when set and loadable, otherwise `buildPlaceholder()`.
 * Transforms are NOT applied here, so callers can reuse it for sub-parts.
 */
export async function loadOrPlaceholder(def, buildPlaceholder) {
    if (def.model) {
        try {
            return enableShadows(await loadModel(def.model));
        } catch (err) {
            console.warn(`Could not load model "${def.model}", using placeholder.`, err);
        }
    }
    return enableShadows(buildPlaceholder());
}

/** Small shape helpers for placeholders. */
export function box(w, h, d, color, options = {}) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...options }),
    );
    return mesh;
}

export function cylinder(radius, height, color, options = {}) {
    return new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 24),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...options }),
    );
}
