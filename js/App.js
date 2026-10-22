import * as THREE from 'three';
import { ProjectPanel } from './ui/ProjectPanel.js';
import { AboutPanel } from './ui/AboutPanel.js';
import { ScreenOverlay } from './ui/ScreenOverlay.js';
import { FloatingButton, Hint, Tooltip } from './ui/SceneHints.js';
import {
    LANGUAGES, getLanguage, onLanguageChange, pageUrl, setLanguage, tr, ui,
} from './i18n.js';

const MOBILE_QUERY = window.matchMedia('(max-width: 760px)');

/**
 * Wires the scene together and handles the navigation states:
 *   home      -> overview of the desk
 *   selection -> a carton is open, its game cases are shown
 *   tv        -> a project is launched and shown inside the TV
 *   about     -> overview of the about-me frames, with the about panel
 *   closeup   -> the camera looks at a single frame
 * Every text comes from js/data (see js/i18n.js) and is refreshed on language change.
 */
export class App {
    constructor({ config, rig, interaction, cartons, showcase, tv, gameConsole, aboutCorner, about, sound }) {
        this.config = config;
        this.rig = rig;
        this.interaction = interaction;
        this.cartons = cartons;
        this.showcase = showcase;
        this.tv = tv;
        this.gameConsole = gameConsole;
        this.aboutCorner = aboutCorner;
        this.sound = sound;

        this.state = 'home';
        this.category = null;
        this.project = null; // project on screen in the 'tv' state
        this.busy = false; // true during the launch / power-off transitions

        const layer = document.getElementById('ui');
        this.tooltip = new Tooltip(layer);
        this.hint = new Hint(layer, ui('hint'));
        this.panel = new ProjectPanel(layer, {
            onPrevious: () => showcase.previous(),
            onNext: () => showcase.next(),
            onBack: () => this.goHome(),
            onLaunch: () => this.launch(showcase.project),
        });

        this.aboutPanel = new AboutPanel(layer, about, { onBack: () => this.back() });
        this.backButton = new FloatingButton(layer, ui('back'), () => this.back());
        this.screenOverlay = new ScreenOverlay(layer, { powerLabel: ui('power'), onPower: () => this.powerOff() });
        this.createTopBar(layer);
        onLanguageChange(() => this.refreshTexts());

        showcase.onSelect = (project, index, count) => {
            this.panel.show(this.category, project, index, count);
            sound.play('select');
        };
        showcase.onActivate = (project) => this.launch(project);

        tv.onPageEscape = () => this.powerOff();

        this.registerCartons();
        this.registerConsole();
        this.registerFrames();
        window.addEventListener('keydown', (e) => this.onKey(e));
    }

    /** Language and sound buttons in the top right corner. */
    createTopBar(layer) {
        const bar = document.createElement('div');
        bar.className = 'top-bar';
        bar.innerHTML = `
            <button class="pixel-button" data-action="language" aria-label="Language / Langue">
                ${LANGUAGES.map((lang) => `<span data-lang="${lang}">${lang.toUpperCase()}</span>`).join(' / ')}
            </button>
            <button class="pixel-button" data-action="sound"></button>
        `;
        layer.appendChild(bar);

        this.languageButton = bar.querySelector('[data-action="language"]');
        this.soundButton = bar.querySelector('[data-action="sound"]');
        this.languageButton.addEventListener('click', () => {
            const next = LANGUAGES[(LANGUAGES.indexOf(getLanguage()) + 1) % LANGUAGES.length];
            setLanguage(next);
            this.sound.play('click');
        });
        this.soundButton.addEventListener('click', () => {
            this.sound.setMuted(!this.sound.muted);
            this.updateTopBar();
            this.sound.play('click');
        });
        this.updateTopBar();
    }

    updateTopBar() {
        this.languageButton.querySelectorAll('[data-lang]').forEach((el) => {
            el.classList.toggle('active', el.dataset.lang === getLanguage());
        });
        this.soundButton.textContent = ui('sound', this.sound.muted);
    }

    /** Re-renders every text of the page and of the 3D scene in the current language. */
    refreshTexts() {
        this.updateTopBar();
        this.hint.el.textContent = ui('hint');
        this.backButton.el.textContent = ui('back');
        this.tooltip.hide();
        this.panel.refresh();
        this.aboutPanel.refresh();
        this.cartons.refreshTexts();
        this.aboutCorner.refreshTexts();
        this.showcase.refreshTexts();
        if (this.project) {
            this.tv.reloadPage(pageUrl(this.project.page));
            this.screenOverlay.reload(pageUrl(this.project.page));
        }
    }

    registerCartons() {
        for (const carton of this.cartons.cartons) {
            const { category } = carton.userData;
            this.interaction.register(carton, {
                onEnter: (_, e) => {
                    this.cartons.setHovered(carton, true);
                    this.sound.play('hover');
                    if (this.state === 'home') {
                        this.tooltip.show(`<strong>${tr(category.label)}</strong> · ${ui('projectCount', category.projects.length)}`, e);
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

    registerFrames() {
        for (const holder of this.aboutCorner.frames) {
            const { frame } = holder.userData;
            this.interaction.register(holder, {
                onEnter: (_, e) => {
                    if (this.state === 'tv' || this.state === 'closeup') return;
                    this.aboutCorner.setHovered(holder, true);
                    this.sound.play('hover');
                    if (this.state !== 'about') this.tooltip.show(`<strong>${ui('frameLabel')[frame.kind]}</strong>`, e);
                },
                onMove: (_, e) => this.tooltip.move(e),
                onLeave: () => {
                    this.aboutCorner.setHovered(holder, false);
                    this.tooltip.hide();
                },
                onClick: () => {
                    if (this.state === 'about') this.closeUp(holder);
                    else this.openAbout();
                },
            });
        }
    }

    /** The whole console acts as the POWER button while a project is on screen. */
    registerConsole() {
        this.interaction.register(this.gameConsole.group, {
            onEnter: (_, e) => {
                if (this.state !== 'tv') return;
                this.gameConsole.setPowerHighlight(true);
                this.sound.play('hover');
                this.tooltip.show(ui('powerOff'), e);
            },
            onMove: (_, e) => this.tooltip.move(e),
            onLeave: () => {
                this.gameConsole.setPowerHighlight(false);
                this.tooltip.hide();
            },
            onClick: () => this.powerOff(),
        });
    }

    /** Camera framing of the about-me corner, leaving room for the panel on the left. */
    aboutView() {
        const c = this.config.aboutView;
        const side = this.config.layout.cartonsSide === 'left' ? 1 : -1;
        const mirror = ([x, y, z]) => new THREE.Vector3(x * side, y, z);

        const anchor = this.aboutCorner.group.position.clone().add(mirror(c.targetOffset));
        const target = anchor.clone().add(new THREE.Vector3(...c.targetShift));
        // On phones the panel sits at the bottom: center the frames and push them up instead.
        if (MOBILE_QUERY.matches) target.set(anchor.x - 0.2, anchor.y - 0.6, anchor.z);

        return {
            position: target.clone().add(mirror(c.cameraOffset)).toArray(),
            target: target.toArray(),
            parallax: c.parallax,
            minAspect: MOBILE_QUERY.matches ? c.mobileMinAspect : c.minAspect,
        };
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
                minAspect: MOBILE_QUERY.matches ? c.mobileMinAspect : c.minAspect,
            },
        };
    }

    /** Hides whatever the selection / about states show (not the TV). */
    clearState() {
        this.showcase.close();
        this.cartons.setOpen(null);
        this.panel.hide();
        this.category = null;
        this.aboutPanel.hide();
        this.backButton.hide();
        this.tooltip.hide();
        this.aboutCorner.setFocus(null);
    }

    async openCategory(carton) {
        const { category } = carton.userData;
        if (this.busy || this.state === 'tv' || this.category === category) return;

        if (this.state === 'about' || this.state === 'closeup') this.clearState();
        this.state = 'selection';
        this.sound.play('open');
        this.category = category;
        this.hint.hide();
        this.tooltip.hide();

        this.cartons.setOpen(carton);
        const { anchor, view } = this.selectionView(carton);
        this.rig.goTo(view);
        await this.showcase.open(category, anchor, this.cartons.mouthOf(carton));
    }

    goHome() {
        if (this.busy || this.state === 'home' || this.state === 'tv') return;
        this.clearState();
        this.state = 'home';
        this.sound.play('back');
        this.rig.goTo('home');
        this.hint.show();
    }

    openAbout() {
        if (this.busy || this.state === 'tv') return;
        this.sound.play(this.state === 'closeup' ? 'back' : 'click');
        this.clearState();
        this.state = 'about';
        this.hint.hide();
        this.rig.goTo(this.aboutView());
        this.aboutPanel.show();
    }

    closeUp(holder) {
        if (this.busy) return;
        this.state = 'closeup';
        this.sound.play('select');
        this.aboutCorner.setHovered(holder, false);
        this.aboutCorner.setFocus(holder);
        this.aboutPanel.hide();
        this.tooltip.hide();
        this.backButton.show();
        this.rig.goTo(this.aboutCorner.closeUpView(holder, this.rig.camera.fov, this.config.aboutView.closeUpFill));
    }

    /** One step back: close-up -> about -> home, selection -> home. */
    back() {
        if (this.state === 'closeup') this.openAbout();
        else this.goHome();
    }

    /** Inserts the selected game in the console, zooms on the TV and turns the page on. */
    async launch(project) {
        if (this.busy || this.state !== 'selection' || !project) return;
        this.busy = true;
        this.state = 'tv';
        this.category = null;
        this.project = project;

        this.sound.play('launch');
        this.panel.hide();
        this.tooltip.hide();
        this.showcase.close({ selectedTo: this.gameConsole.slotPosition() });
        this.cartons.setOpen(null);
        this.tv.setLoading(tr(project.title).toUpperCase());

        await this.rig.goTo(this.tvView());
        this.sound.play('tvOn');
        if (MOBILE_QUERY.matches) {
            this.screenOverlay.show(pageUrl(project.page));
        } else {
            this.tv.showPage(pageUrl(project.page));
            this.tv.setInteractive(true);
        }
        this.busy = false;
    }

    /** POWER button: turns the TV off and goes back to the desk overview. */
    async powerOff() {
        if (this.busy || this.state !== 'tv') return;
        this.busy = true;
        this.gameConsole.setPowerHighlight(false);
        this.tooltip.hide();
        this.sound.play('tvOff');
        window.focus(); // take keyboard focus back from the page

        if (this.screenOverlay.isOpen) {
            await this.screenOverlay.hide();
            this.tv.setIdle();
        } else {
            await this.tv.hidePage();
        }
        this.state = 'home';
        this.project = null;
        this.hint.show();
        await this.rig.goTo('home');
        this.busy = false;
    }

    onKey(e) {
        if (this.state === 'tv' && e.key === 'Escape') this.powerOff();
        if ((this.state === 'about' || this.state === 'closeup') && e.key === 'Escape') this.back();
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
        this.aboutCorner.update(dt);
    }
}
