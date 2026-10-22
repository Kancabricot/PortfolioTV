import { tr, ui } from '../i18n.js';

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/** Localized + escaped text. */
const text = (value) => escapeHtml(tr(value) ?? '');

/**
 * Side panel with everything from js/data/about.js.
 * Callbacks: onBack.
 */
export class AboutPanel {
    constructor(parent, about, { onBack }) {
        this.about = about;
        this.el = document.createElement('aside');
        this.el.className = 'side-panel about-panel';
        parent.appendChild(this.el);

        this.el.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="back"]')) onBack();
        });
        this.refresh();
    }

    /** Re-renders the panel in the current language. */
    refresh() {
        const { about } = this;
        const diplomas = about.frames.filter((f) => f.kind === 'diploma');
        const skills = about.skills ?? [];
        const links = about.links ?? [];

        this.el.innerHTML = `
            <div class="about-header">
                ${about.photo ? `<img class="about-photo" src="${escapeHtml(about.photo)}" alt="">` : ''}
                <div>
                    <h2 class="panel-title">${text(about.firstName)} ${text(about.lastName)}</h2>
                    <p class="panel-category">${text(about.title)}</p>
                </div>
            </div>
            <p class="panel-summary">${text(about.bio)}</p>
            ${skills.length ? `
                <h3 class="panel-heading">${ui('skills')}</h3>
                <ul class="panel-tags">${skills.map((s) => `<li>${text(s)}</li>`).join('')}</ul>
            ` : ''}
            ${diplomas.length ? `
                <h3 class="panel-heading">${ui('diplomas')}</h3>
                <ul class="about-diplomas">
                    ${diplomas.map((d) => `<li><strong>${text(d.title)}</strong><span>${text(d.subtitle)}</span></li>`).join('')}
                </ul>
            ` : ''}
            <div class="panel-actions">
                <button class="pixel-button" data-action="back">${ui('panelBack')}</button>
                ${links.map((l) => `<a class="pixel-button primary" href="${escapeHtml(tr(l.url))}" target="_blank" rel="noopener">${text(l.label)}</a>`).join('')}
            </div>
            <p class="panel-keys">${ui('aboutKeys')}</p>
        `;
    }

    show() { this.el.classList.add('visible'); }

    hide() { this.el.classList.remove('visible'); }
}
