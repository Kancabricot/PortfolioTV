import { tr, ui } from '../i18n.js';

/**
 * Side panel describing the selected game case.
 * Callbacks: onPrevious, onNext, onBack, onLaunch.
 */
export class ProjectPanel {
    constructor(parent, callbacks) {
        this.el = document.createElement('aside');
        this.el.className = 'side-panel project-panel';
        this.el.innerHTML = `
            <p class="panel-category"></p>
            <h2 class="panel-title"></h2>
            <p class="panel-meta"></p>
            <ul class="panel-tags"></ul>
            <p class="panel-summary"></p>
            <div class="panel-nav">
                <button class="pixel-button" data-action="previous">◀</button>
                <span class="panel-counter"></span>
                <button class="pixel-button" data-action="next">▶</button>
            </div>
            <div class="panel-actions">
                <button class="pixel-button" data-action="back"></button>
                <button class="pixel-button primary" data-action="launch"></button>
            </div>
            <p class="panel-keys"></p>
        `;
        parent.appendChild(this.el);

        const handlers = {
            previous: callbacks.onPrevious,
            next: callbacks.onNext,
            back: callbacks.onBack,
            launch: callbacks.onLaunch,
        };
        this.el.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) handlers[action]?.();
        });

        this.$ = (selector) => this.el.querySelector(selector);
        this.current = null;
        this.renderStaticText();
    }

    renderStaticText() {
        this.$('[data-action="previous"]').setAttribute('aria-label', ui('previous'));
        this.$('[data-action="next"]').setAttribute('aria-label', ui('next'));
        this.$('[data-action="back"]').textContent = ui('panelBack');
        this.$('[data-action="launch"]').textContent = ui('launch');
        this.$('.panel-keys').textContent = ui('projectKeys');
    }

    show(category, project, index, count) {
        this.current = { category, project, index, count };
        this.$('.panel-category').textContent = tr(category.label);
        this.$('.panel-title').textContent = tr(project.title);
        this.$('.panel-meta').textContent = [tr(project.year), tr(project.role)].filter(Boolean).join(' · ');
        this.$('.panel-tags').replaceChildren(...project.tags.map((tag) => {
            const li = document.createElement('li');
            li.textContent = tr(tag);
            return li;
        }));
        this.$('.panel-summary').textContent = tr(project.summary);
        this.$('.panel-counter').textContent = `${index + 1} / ${count}`;
        this.$('[data-action="previous"]').disabled = index === 0;
        this.$('[data-action="next"]').disabled = index === count - 1;
        this.el.style.setProperty('--project-color', project.color);
        this.el.classList.add('visible');
    }

    /** Re-renders every text in the current language. */
    refresh() {
        this.renderStaticText();
        if (this.current) {
            const { category, project, index, count } = this.current;
            const visible = this.el.classList.contains('visible');
            this.show(category, project, index, count);
            if (!visible) this.hide();
        }
    }

    hide() {
        this.el.classList.remove('visible');
    }
}
