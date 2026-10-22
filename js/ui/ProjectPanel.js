const TEXT = {
    previous: 'Précédent',
    next: 'Suivant',
    back: 'Retour',
    launch: '▶ Lancer',
    keys: '← → changer · Entrée lancer · Échap retour',
};

/**
 * Side panel describing the selected game case.
 * Callbacks: onPrevious, onNext, onBack, onLaunch.
 */
export class ProjectPanel {
    constructor(parent, callbacks) {
        this.el = document.createElement('aside');
        this.el.className = 'project-panel';
        this.el.innerHTML = `
            <p class="panel-category"></p>
            <h2 class="panel-title"></h2>
            <p class="panel-meta"></p>
            <ul class="panel-tags"></ul>
            <p class="panel-summary"></p>
            <div class="panel-nav">
                <button class="pixel-button" data-action="previous" aria-label="${TEXT.previous}">◀</button>
                <span class="panel-counter"></span>
                <button class="pixel-button" data-action="next" aria-label="${TEXT.next}">▶</button>
            </div>
            <div class="panel-actions">
                <button class="pixel-button" data-action="back">${TEXT.back}</button>
                <button class="pixel-button primary" data-action="launch">${TEXT.launch}</button>
            </div>
            <p class="panel-keys">${TEXT.keys}</p>
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
    }

    show(category, project, index, count) {
        this.$('.panel-category').textContent = category.label;
        this.$('.panel-title').textContent = project.title;
        this.$('.panel-meta').textContent = [project.year, project.role].filter(Boolean).join(' · ');
        this.$('.panel-tags').replaceChildren(...project.tags.map((tag) => {
            const li = document.createElement('li');
            li.textContent = tag;
            return li;
        }));
        this.$('.panel-summary').textContent = project.summary;
        this.$('.panel-counter').textContent = `${index + 1} / ${count}`;
        this.$('[data-action="previous"]').disabled = index === 0;
        this.$('[data-action="next"]').disabled = index === count - 1;
        this.el.style.setProperty('--project-color', project.color);
        this.el.classList.add('visible');
    }

    hide() {
        this.el.classList.remove('visible');
    }
}
