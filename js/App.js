import * as THREE from 'three';
import { ProjectPanel } from './ui/ProjectPanel.js';
import { Hint, Tooltip } from './ui/SceneHints.js';

const TEXT = {
    hint: 'Clique sur un carton pour découvrir mes projets',
    projectCount: (n) => `${n} projet${n > 1 ? 's' : ''}`,
};

const MOBILE_QUERY = window.matchMedia('(max-width: 760px)');

/**
 * Wires the scene together and handles the navigation states:
 *   home      -> overview of the desk
 *   selection -> a carton is open, its game cases are shown
 */
export class App {
    constructor({ config, rig, interaction, cartons, showcase }) {
        this.config = config;
        this.rig = rig;
        this.interaction = interaction;
        this.cartons = cartons;
        this.showcase = showcase;

        this.state = 'home';
        this.category = null;

        const ui = document.getElementById('ui');
        this.tooltip = new Tooltip(ui);
        this.hint = new Hint(ui, TEXT.hint);
        this.panel = new ProjectPanel(ui, {
            onPrevious: () => showcase.previous(),
            onNext: () => showcase.next(),
            onBack: () => this.goHome(),
            onLaunch: () => this.launch(showcase.project),
        });

        showcase.onSelect = (project, index, count) => this.panel.show(this.category, project, index, count);
        showcase.onActivate = (project) => this.launch(project);

        this.registerCartons();
        window.addEventListener('keydown', (e) => this.onKey(e));
    }

    registerCartons() {
        for (const carton of this.cartons.cartons) {
            const { category } = carton.userData;
            this.interaction.register(carton, {
                onEnter: (_, e) => {
                    this.cartons.setHovered(carton, true);
                    if (this.state === 'home') {
                        this.tooltip.show(`<strong>${category.label}</strong> · ${TEXT.projectCount(category.projects.length)}`, e);
                    }
                },
                onMove: (_, e) => this.tooltip.move(e),
                onLeave: () => {
                    this.cartons.setHovered(carton, false);
                    this.tooltip.hide();
                },
                onClick: () => this.openCategory(carton),
            });
        }
    }

    /** Camera framing for the project selection, derived from the opened carton's position. */
    selectionView(carton) {
        const c = this.config.selection;
        const side = this.config.layout.cartonsSide === 'left' ? 1 : -1;
        const [ox, oy, oz] = c.showcaseOffset;
        const anchor = this.cartons.group.position.clone().add(new THREE.Vector3(ox * side, oy + carton.position.y, oz));

        const target = anchor.clone().add(new THREE.Vector3(...c.targetShift));
        // On phones the panel sits at the bottom: center the cases and push them up instead.
        if (MOBILE_QUERY.matches) target.set(anchor.x, anchor.y - 0.32, anchor.z);
        const position = target.clone().add(new THREE.Vector3(...c.cameraOffset));

        return {
            anchor,
            view: {
                position: position.toArray(),
                target: target.toArray(),
                parallax: c.parallax,
                minAspect: c.minAspect,
            },
        };
    }

    async openCategory(carton) {
        const { category } = carton.userData;
        if (this.category === category) return;

        this.state = 'selection';
        this.category = category;
        this.hint.hide();
        this.tooltip.hide();

        this.cartons.setOpen(carton);
        const { anchor, view } = this.selectionView(carton);
        this.rig.goTo(view);
        await this.showcase.open(category, anchor, this.cartons.mouthOf(carton));
    }

    goHome() {
        if (this.state === 'home') return;
        this.state = 'home';
        this.category = null;

        this.showcase.close();
        this.cartons.setOpen(null);
        this.panel.hide();
        this.rig.goTo('home');
        this.hint.show();
    }

    launch(project) {
        // Step 3: zoom into the TV and show the project page.
        console.info(`Launch "${project.title}" -> ${project.page}`);
    }

    onKey(e) {
        if (this.state !== 'selection') return;
        if (e.key === 'ArrowRight') this.showcase.next();
        else if (e.key === 'ArrowLeft') this.showcase.previous();
        else if (e.key === 'Escape') this.goHome();
        else if (e.key === 'Enter') this.launch(this.showcase.project);
    }

    update(dt, time) {
        this.interaction.update();
        this.cartons.update(dt);
        this.showcase.update(dt, time);
    }
}
