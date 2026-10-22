import * as THREE from 'three';

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * Moves the camera between named views (sceneConfig.camera.views)
 * and adds a small mouse parallax on top.
 */
export class CameraRig {
    constructor(camera, config) {
        this.camera = camera;
        this.config = config;

        this.position = new THREE.Vector3();
        this.target = new THREE.Vector3();
        this.view = null;
        this.tween = null;

        this.pointer = new THREE.Vector2();
        this.smoothPointer = new THREE.Vector2();
        window.addEventListener('pointermove', (e) => {
            this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
        });

        this.goTo(config.initialView, 0);
    }

    /** Animates to a named view. Resolves when the move is finished. */
    goTo(name, duration = this.config.transitionDuration) {
        const view = this.config.views[name];
        if (!view) throw new Error(`Unknown camera view "${name}"`);
        this.view = view;

        const toPosition = new THREE.Vector3(...view.position);
        const toTarget = new THREE.Vector3(...view.target);

        if (duration <= 0) {
            this.position.copy(toPosition);
            this.target.copy(toTarget);
            this.tween = null;
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.tween = {
                fromPosition: this.position.clone(),
                fromTarget: this.target.clone(),
                toPosition,
                toTarget,
                elapsed: 0,
                duration,
                resolve,
            };
        });
    }

    update(dt) {
        if (this.tween) {
            const tw = this.tween;
            tw.elapsed += dt;
            const k = easeInOutCubic(Math.min(tw.elapsed / tw.duration, 1));
            this.position.lerpVectors(tw.fromPosition, tw.toPosition, k);
            this.target.lerpVectors(tw.fromTarget, tw.toTarget, k);
            if (k >= 1) {
                this.tween = null;
                tw.resolve();
            }
        }

        // Back off on narrow screens so the whole view still fits.
        const offset = this.position.clone().sub(this.target);
        const minAspect = this.view.minAspect ?? 0;
        if (this.camera.aspect < minAspect) offset.multiplyScalar(minAspect / this.camera.aspect);

        const amount = this.view.parallax ?? this.config.parallax;
        this.smoothPointer.lerp(this.pointer, 1 - Math.exp(-dt * 4));

        this.camera.position.copy(this.target).add(offset);
        this.camera.position.x += this.smoothPointer.x * amount;
        this.camera.position.y += this.smoothPointer.y * amount * 0.5;
        this.camera.lookAt(this.target);
    }
}
