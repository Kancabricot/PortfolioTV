import * as THREE from 'three';
import { ProjectPanel } from './ui/ProjectPanel.js';
import { Hint, Tooltip } from './ui/SceneHints.js';

const TEXT = {
    hint: 'Clique sur un carton pour découvrir mes projets',
    projectCount: (n) => `${n} projet${n > 1 ? 's' : ''}`,
    powerOff: '<strong>⏻ POWER</strong> · revenir au bureau',
};

const MOBILE_QUERY = window.matchMedia('(max-width: 760px)');

/**
 * Wires the scene together and handles the navigation states:
 *   home      -> overview of the desk
 *   selection -> a carton is open, its game cases are shown
 *   tv        -> a project is launched and shown inside the TV
 */
export class App {
    constructor({ config, rig, interaction, cartons, showcase, tv, gameConsole }) {
        this.config = config;
        this.rig = rig;
        this.interaction = interaction;
        this.cartons = cartons;
        this.showcase = showcase;
        this.tv = tv;
        this.gameConsole = gameConsole;

        this.state = 'home';
        this.category = null;
        this.busy = false; // true during the launch / power-off transitions

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

        tv.onPageEscape = () => this.powerOff();

        this.registerCartons();
        this.registerConsole();
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

    /** The whole console acts as the POWER button while a project is on screen. */
    registerConsole() {
        this.interaction.register(this.gameConsole.group, {
            onEnter: (_, e) => {
                if (this.state !== 'tv') return;
                this.gameConsole.setPowerHighlight(true);
                this.tooltip.show(TEXT.powerOff, e);
            },
            onMove: (_, e) => this.tooltip.move(e),
            onLeave: () => {
                this.gameConsole.setPowerHighlight(false);
                this.tooltip.hide();
            },
            onClick: () => this.powerOff(),
        });
    }

    /** Camera framing in front of the TV screen. */
    tvView() {
        const c = this.config.tvView;
        const { center } = this.tv.screenFrame();
        return {
            position: center.clone().add(new THREE.Vector3(...c.cameraOffset)).toArray(),
            target: center.clone().add(new THREE.Vector3(...c.targetOffset)).toArray(),
            parallax: c.parallax,
            minAspect: c.minAspect,
        };
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
        if (this.busy || this.state === 'tv' || this.category === category) return;

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
        if (this.busy || this.state !== 'selection') return;
        this.state = 'home';
        this.category = null;

        this.showcase.close();
        this.cartons.setOpen(null);
        this.panel.hide();
        this.rig.goTo('home');
        this.hint.show();
    }

    /** Inserts the selected game in the console, zooms on the TV and turns the page on. */
    async launch(project) {
        if (this.busy || this.state !== 'selection' || !project) return;
        this.busy = true;
        this.state = 'tv';
        this.category = null;

        this.panel.hide();
        this.tooltip.hide();
        this.showcase.close({ selectedTo: this.gameConsole.slotPosition() });
        this.cartons.setOpen(null);
        this.tv.setLoading(project.title.toUpperCase());

        await this.rig.goTo(this.tvView());
        this.tv.showPage(project.page);
        this.tv.setInteractive(true);
        this.busy = false;
    }

    /** POWER button: turns the TV off and goes back to the desk overview. */
    async powerOff() {
        if (this.busy || this.state !== 'tv') return;
        this.busy = true;
        this.gameConsole.setPowerHighlight(false);
        this.tooltip.hide();
        window.focus(); // take keyboard focus back from the page

        await this.tv.hidePage();
        this.state = 'home';
        this.hint.show();
        await this.rig.goTo('home');
        this.busy = false;
    }

    onKey(e) {
        if (this.state === 'tv' && e.key === 'Escape') this.powerOff();
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
