/** Small text helpers drawn over the scene: a tooltip that follows the mouse and a bottom hint. */
export class Tooltip {
    constructor(parent) {
        this.el = document.createElement('div');
        this.el.className = 'scene-tooltip';
        parent.appendChild(this.el);
    }

    show(html, event) {
        this.el.innerHTML = html;
        this.el.classList.add('visible');
        if (event) this.move(event);
    }

    move(event) {
        this.el.style.transform = `translate(${event.clientX + 16}px, ${event.clientY + 16}px)`;
    }

    hide() {
        this.el.classList.remove('visible');
    }
}

export class Hint {
    constructor(parent, text) {
        this.el = document.createElement('p');
        this.el.className = 'scene-hint visible';
        this.el.textContent = text;
        parent.appendChild(this.el);
    }

    show() { this.el.classList.add('visible'); }

    hide() { this.el.classList.remove('visible'); }
}
