import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { applyTransform, box, cylinder, loadOrPlaceholder } from '../core/ObjectFactory.js';

function buildPlaceholder(def) {
    const [w, h, d] = def.size;
    const g = new THREE.Group();

    const body = new THREE.Mesh(
        new RoundedBoxGeometry(w, h, d, 3, 0.03),
        new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.35, metalness: 0.1 }),
    );
    body.position.y = h / 2;
    g.add(body);

    // Round top with the cartridge slot (Mega Drive style)
    const disk = cylinder(d * 0.38, 0.03, '#26262c', { roughness: 0.3 });
    disk.position.set(w * 0.08, h + 0.015, 0);
    g.add(disk);

    const slot = box(w * 0.32, 0.02, 0.05, '#0c0c0e');
    slot.position.set(disk.position.x, h + 0.035, 0);
    g.add(slot);

    // Power button (will be the "OFF" button later)
    const power = box(0.08, 0.025, 0.06, def.accentColor, { roughness: 0.4 });
    power.name = 'PowerButton';
    power.position.set(-w * 0.36, h + 0.012, d * 0.22);
    g.add(power);

    const reset = box(0.06, 0.02, 0.05, '#55555c');
    reset.position.set(-w * 0.24, h + 0.01, d * 0.22);
    g.add(reset);

    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 8),
        new THREE.MeshBasicMaterial({ color: '#ff3b3b' }),
    );
    led.position.set(-w * 0.42, h + 0.005, d * 0.4);
    g.add(led);

    return g;
}

export async function createGameConsole(def) {
    const content = await loadOrPlaceholder(def, () => buildPlaceholder(def));

    const group = applyTransform(new THREE.Group(), def);
    group.name = 'GameConsole';
    group.add(content);

    return { group, powerButton: content.getObjectByName('PowerButton') };
}
