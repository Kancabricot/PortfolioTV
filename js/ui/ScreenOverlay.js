const TURN_OFF_DURATION = 450; // ms, must match the tv-off animation in css/ui.css

/**
 * Full-screen version of the TV screen, used on phones where the page inside the 3D TV
 * would be too small to read. Same CRT look and turn-on / turn-off animations.
 * Callbacks: onPower (POWER button or Escape inside the page).
 */
export class ScreenOverlay {
    constructor(parent, { powerLabel, onPower }) {
        this.el = document.createElement('div');
        this.el.className = 'screen-overlay';
        this.el.innerHTML = `
            <div class="tv-page-inner">
                <iframe title="Project"></iframe>
                <div class="tv-crt"></div>
            </div>
            <button class="pixel-button power-button">${powerLabel}</button>
        `;
        parent.appendChild(this.el);

        this.iframe = this.el.querySelector('iframe');
        this.el.querySelector('.power-button').addEventListener('click', onPower);
        this.iframe.addEventListener('load', () => {
            try {
                this.iframe.contentWindow.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') onPower();
                });
            } catch {
                // Cross-origin page: Escape only works outside of it.
            }
        });
    }

    get isOpen() {
        return this.el.classList.contains('on');
    }

    show(url) {
        this.iframe.src = url;
        this.el.classList.remove('off');
        this.el.classList.add('on');
    }

    /** Reloads the page currently shown (e.g. in another language). */
    reload(url) {
        if (this.isOpen) this.iframe.src = url;
    }

    hide() {
        return new Promise((resolve) => {
            this.el.classList.remove('on');
            this.el.classList.add('off');
            setTimeout(() => {
                this.el.classList.remove('off');
                this.iframe.src = 'about:blank';
                resolve();
            }, TURN_OFF_DURATION);
        });
    }
}
