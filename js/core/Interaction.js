import * as THREE from 'three';

/**
 * Mouse picking: register objects with hover / click handlers.
 *
 *   const off = interaction.register(mesh, { onClick, onEnter, onLeave });
 *   off(); // unregister
 */
export class Interaction {
    constructor(camera, domElement) {
        this.camera = camera;
        this.dom = domElement;
        this.enabled = true;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.targets = new Map(); // Object3D -> handlers
        this.hovered = null;
        this.pointerInside = false;
        this.lastEvent = null;

        domElement.addEventListener('pointermove', (e) => {
            this.pointerInside = true;
            this.lastEvent = e;
            this.updatePointer(e);
        });
        domElement.addEventListener('pointerleave', () => {
            this.pointerInside = false;
            this.setHovered(null);
        });
        domElement.addEventListener('click', (e) => {
            this.updatePointer(e);
            const hit = this.pick();
            if (hit) this.targets.get(hit)?.onClick?.(hit, e);
        });
    }

    register(object, handlers) {
        this.targets.set(object, handlers);
        return () => {
            if (this.hovered === object) this.setHovered(null);
            this.targets.delete(object);
        };
    }

    updatePointer(e) {
        const rect = this.dom.getBoundingClientRect();
        this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    }

    /** Returns the registered object under the pointer, if any. */
    pick() {
        if (!this.enabled || this.targets.size === 0) return null;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects([...this.targets.keys()], true);
        for (const { object } of hits) {
            for (let o = object; o; o = o.parent) {
                if (this.targets.has(o)) return o;
            }
        }
        return null;
    }

    setHovered(object) {
        if (object === this.hovered) return;
        if (this.hovered) this.targets.get(this.hovered)?.onLeave?.(this.hovered);
        this.hovered = object;
        if (object) this.targets.get(object)?.onEnter?.(object, this.lastEvent);
        this.dom.style.cursor = object ? 'pointer' : '';
    }

    /** Call every frame: hover follows the camera even when the mouse doesn't move. */
    update() {
        if (!this.pointerInside) return;
        const hit = this.pick();
        this.setHovered(hit);
        if (hit) this.targets.get(hit)?.onMove?.(hit, this.lastEvent);
    }
}
