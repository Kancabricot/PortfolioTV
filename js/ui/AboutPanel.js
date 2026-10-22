const TEXT = {
    skills: 'Compétences',
    diplomas: 'Diplômes',
    back: 'Retour',
    keys: 'Clique un cadre pour le voir de près · Échap retour',
};

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/**
 * Side panel with everything from js/data/about.js.
 * Callbacks: onBack.
 */
export class AboutPanel {
    constructor(parent, about, { onBack }) {
        this.el = document.createElement('aside');
        this.el.className = 'side-panel about-panel';
        this.el.innerHTML = this.render(about);
        parent.appendChild(this.el);

        this.el.querySelector('[data-action="back"]').addEventListener('click', onBack);
    }

    render(about) {
        const diplomas = about.frames.filter((f) => f.kind === 'diploma');
        const skills = about.skills ?? [];
        const links = about.links ?? [];

        return `
            <div class="about-header">
                ${about.photo ? `<img class="about-photo" src="${escapeHtml(about.photo)}" alt="">` : ''}
                <div>
                    <h2 class="panel-title">${escapeHtml(about.firstName)} ${escapeHtml(about.lastName)}</h2>
                    <p class="panel-category">${escapeHtml(about.title)}</p>
                </div>
            </div>
            <p class="panel-summary">${escapeHtml(about.bio)}</p>
            ${skills.length ? `
                <h3 class="panel-heading">${TEXT.skills}</h3>
                <ul class="panel-tags">${skills.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
            ` : ''}
            ${diplomas.length ? `
                <h3 class="panel-heading">${TEXT.diplomas}</h3>
                <ul class="about-diplomas">
                    ${diplomas.map((d) => `<li><strong>${escapeHtml(d.title)}</strong><span>${escapeHtml(d.subtitle ?? '')}</span></li>`).join('')}
                </ul>
            ` : ''}
            <div class="panel-actions">
                <button class="pixel-button" data-action="back">${TEXT.back}</button>
                ${links.map((l) => `<a class="pixel-button primary" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`).join('')}
            </div>
            <p class="panel-keys">${TEXT.keys}</p>
        `;
    }

    show() { this.el.classList.add('visible'); }

    hide() { this.el.classList.remove('visible'); }
}
