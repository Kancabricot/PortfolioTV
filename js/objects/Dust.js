import * as THREE from 'three';
import { canvasTexture } from '../utils/canvasTextures.js';

/** Soft dust specks slowly floating above the desk. */
export function createDust(def) {
    const { count, area, center, amplitude } = def;
    const base = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        base[i * 3] = center[0] + (Math.random() - 0.5) * area[0];
        base[i * 3 + 1] = center[1] + (Math.random() - 0.5) * area[1];
        base[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2];
        phase[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));

    const sprite = canvasTexture(64, 64, (ctx, w, h) => {
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    });

    const points = new THREE.Points(geometry, new THREE.PointsMaterial({
        color: def.color,
        size: def.size,
        map: sprite,
        transparent: true,
        opacity: def.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    }));
    points.name = 'Dust';

    const positions = geometry.attributes.position;
    function update(time) {
        const t = time * def.speed;
        for (let i = 0; i < count; i++) {
            const p = phase[i];
            positions.array[i * 3] = base[i * 3] + Math.sin(t + p) * amplitude;
            positions.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.7 + p * 2) * amplitude;
            positions.array[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.8 + p) * amplitude;
        }
        positions.needsUpdate = true;
    }

    return { group: points, update };
}
