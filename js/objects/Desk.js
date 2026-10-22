import * as THREE from 'three';
import { applyTransform, box, loadOrPlaceholder } from '../core/ObjectFactory.js';

export async function createDesk(def) {
    const [w, h, d] = def.size;

    const content = await loadOrPlaceholder(def, () => {
        const top = box(w, h, d, def.color, { roughness: 0.6 });
        top.position.y = -h / 2; // desk surface at y = 0
        return top;
    });

    const group = applyTransform(new THREE.Group(), def);
    group.name = 'Desk';
    group.add(content);
    return { group };
}
