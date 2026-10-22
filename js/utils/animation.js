import * as THREE from 'three';

/** Frame-rate independent smoothing factor (use with lerp). */
export const dampFactor = (lambda, dt) => 1 - Math.exp(-lambda * dt);

/** Moves an object's position / rotation / scale a step toward `target`. */
export function dampTransform(object, target, lambda, dt) {
    const k = dampFactor(lambda, dt);
    if (target.position) object.position.lerp(target.position, k);
    if (target.quaternion) object.quaternion.slerp(target.quaternion, k);
    if (target.scale !== undefined) {
        const s = THREE.MathUtils.lerp(object.scale.x, target.scale, k);
        object.scale.setScalar(s);
    }
}

/** Sets the emissive glow of every material under `object` (used for hover). */
export function setHighlight(object, color, intensity) {
    object.traverse((child) => {
        const materials = child.isMesh ? [].concat(child.material) : [];
        for (const m of materials) {
            if (!m.emissive) continue;
            m.emissive.set(color);
            m.emissiveIntensity = intensity;
        }
    });
}

/** Gives `object` its own copy of its materials so highlighting it doesn't affect others. */
export function ownMaterials(object) {
    object.traverse((child) => {
        if (child.isMesh) child.material = Array.isArray(child.material) ? child.material.map((m) => m.clone()) : child.material.clone();
    });
    return object;
}
