import * as THREE from 'three';
import { createGameCase, disposeObject } from './GameCase.js';
import { dampTransform, setHighlight } from '../utils/animation.js';

const EXIT_DURATION = 900; // ms before closed cases are removed

/**
 * The project carousel: game cases pop out of an open carton and line up,
 * the selected one in front.
 *
 * Events: onSelect(project, index, count), onActivate(project) (click on the selected case).
 */
export class CaseShowcase {
    constructor(scene, caseDef, config, interaction) {
        this.scene = scene;
        this.caseDef = caseDef;
        this.config = config;
        this.interaction = interaction;

        this.cases = [];
        this.leaving = [];
        this.selected = 0;
        this.anchor = new THREE.Vector3();
        this.mouth = new THREE.Vector3();
        this.unregister = [];

        this.onSelect = () => {};
        this.onActivate = () => {};
    }

    get isOpen() {
        return this.cases.length > 0;
    }

    get project() {
        return this.cases[this.selected]?.userData.project;
    }

    /** anchor: where the selected case floats. mouth: where cases come from (world space). */
    async open(category, anchor, mouth) {
        this.close();
        this.anchor.copy(anchor);
        this.mouth.copy(mouth);

        const cases = await Promise.all(category.projects.map((project) => createGameCase(this.caseDef, project, category)));
        cases.forEach((gameCase, i) => {
            gameCase.position.copy(mouth);
            gameCase.scale.setScalar(0.05);
            gameCase.userData.delay = i * 0.08;
            this.scene.add(gameCase);
            this.unregister.push(this.interaction.register(gameCase, {
                onClick: () => (i === this.selected ? this.onActivate(this.project) : this.select(i)),
                onEnter: () => setHighlight(gameCase, '#ffffff', 0.12),
                onLeave: () => setHighlight(gameCase, '#000000', 0),
            }));
        });
        this.cases = cases;
        this.select(0);
    }

    /**
     * Sends the cases back into the carton, then removes them.
     * selectedTo: optional world position the selected case flies to instead (the console slot).
     */
    close({ selectedTo } = {}) {
        if (!this.isOpen) return;
        this.unregister.forEach((off) => off());
        this.unregister = [];

        const leaving = this.cases;
        leaving.forEach((gameCase, i) => {
            const toSlot = selectedTo && i === this.selected;
            gameCase.userData.exitTarget = {
                position: toSlot ? selectedTo.clone() : this.mouth.clone(),
                quaternion: new THREE.Quaternion(),
                scale: 0.001,
            };
            setHighlight(gameCase, '#000000', 0);
        });
        this.cases = [];
        this.leaving.push(...leaving);
        setTimeout(() => {
            for (const gameCase of leaving) {
                this.scene.remove(gameCase);
                disposeObject(gameCase);
            }
            this.leaving = this.leaving.filter((c) => !leaving.includes(c));
        }, EXIT_DURATION);
    }

    select(index) {
        if (!this.isOpen) return;
        this.selected = THREE.MathUtils.clamp(index, 0, this.cases.length - 1);
        this.onSelect(this.project, this.selected, this.cases.length);
    }

    next() { this.select(this.selected + 1); }

    previous() { this.select(this.selected - 1); }

    targetFor(index, time) {
        const c = this.config;
        const offset = index - this.selected;
        const side = Math.abs(offset);

        const position = this.anchor.clone();
        position.x += offset * c.spacing + Math.sign(offset) * (side > 0 ? c.spacing * 0.35 : 0);
        position.z -= side * c.depthStep;

        let rotationY = -Math.sign(offset) * c.turn;
        if (offset === 0) {
            // Gentle idle float on the selected case
            position.y += Math.sin(time * 1.6) * 0.012;
            rotationY = Math.sin(time * 0.7) * 0.12;
        }

        const scale = side > c.visibleSide ? 0.001 : (offset === 0 ? c.selectedScale : c.sideScale);
        return {
            position,
            quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0)),
            scale,
        };
    }

    update(dt, time) {
        this.cases.forEach((gameCase, i) => {
            if (gameCase.userData.delay > 0) {
                gameCase.userData.delay -= dt;
                return;
            }
            dampTransform(gameCase, this.targetFor(i, time), 7, dt);
        });

        for (const gameCase of this.leaving) dampTransform(gameCase, gameCase.userData.exitTarget, 6, dt);
    }
}
