import * as THREE from 'three';

/**
 * Creates a texture drawn with the 2D canvas API.
 * The returned texture has a `redraw(fn)` helper to update it later.
 */
export function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    draw(ctx, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.redraw = (fn) => {
        ctx.clearRect(0, 0, width, height);
        fn(ctx, width, height);
        texture.needsUpdate = true;
    };
    return texture;
}

export function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
}

/* ---------------------------------------------------------------- drawers */

export function drawCartonLabel(ctx, w, h, { label }) {
    // Handle hole
    ctx.fillStyle = 'rgba(30, 18, 8, 0.85)';
    roundRect(ctx, w * 0.32, h * 0.1, w * 0.36, h * 0.14, h * 0.07);
    ctx.fill();

    // Paper sticker, slightly crooked
    ctx.save();
    ctx.translate(w / 2, h * 0.6);
    ctx.rotate(-0.04);
    ctx.fillStyle = '#f6f1e3';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;
    ctx.fillRect(-w * 0.36, -h * 0.2, w * 0.72, h * 0.4);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#1e1b2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = h * 0.2;
    ctx.font = `${size}px 'Permanent Marker', cursive`;
    while (ctx.measureText(label).width > w * 0.64 && size > 10) {
        size -= 2;
        ctx.font = `${size}px 'Permanent Marker', cursive`;
    }
    ctx.fillText(label, 0, 0);
    ctx.restore();
}

export function drawDiploma(ctx, w, h, { heading, title, subtitle, name }) {
    ctx.fillStyle = '#f4ecd8';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#b08d3c';
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 44, w - 88, h - 88);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a5c1e';
    ctx.font = `600 ${h * 0.07}px Georgia, serif`;
    ctx.fillText(heading.toUpperCase(), w / 2, h * 0.24);

    ctx.fillStyle = '#2a2233';
    ctx.font = `italic ${h * 0.11}px Georgia, serif`;
    ctx.fillText(name, w / 2, h * 0.45);

    ctx.font = `${h * 0.075}px Georgia, serif`;
    wrapText(ctx, title, w * 0.75).forEach((line, i) => ctx.fillText(line, w / 2, h * 0.62 + i * h * 0.09));

    ctx.fillStyle = '#6b6275';
    ctx.font = `${h * 0.055}px Georgia, serif`;
    ctx.fillText(subtitle, w / 2, h * 0.84);

    // Seal
    ctx.fillStyle = '#b3261e';
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.8, h * 0.07, 0, Math.PI * 2);
    ctx.fill();
}

export function drawTextCard(ctx, w, h, { title, text, subtitle }) {
    ctx.fillStyle = '#fbf7ef';
    ctx.fillRect(0, 0, w, h);

    const pad = w * 0.1;
    ctx.fillStyle = '#2a2233';
    ctx.textAlign = 'left';
    ctx.font = `700 ${w * 0.1}px Fredoka, sans-serif`;
    ctx.fillText(title, pad, pad + w * 0.08);

    if (subtitle) {
        ctx.fillStyle = '#c8541f';
        ctx.font = `600 ${w * 0.05}px Fredoka, sans-serif`;
        ctx.fillText(subtitle, pad, pad + w * 0.17);
    }

    ctx.fillStyle = '#4a4257';
    const size = w * 0.055;
    ctx.font = `400 ${size}px Fredoka, sans-serif`;
    wrapText(ctx, text, w - pad * 2).forEach((line, i) => {
        ctx.fillText(line, pad, pad + w * 0.3 + i * size * 1.45);
    });
}

export function drawPhotoPlaceholder(ctx, w, h, { initials }) {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#ffb86b');
    gradient.addColorStop(1, '#8c6bd6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${w * 0.3}px Fredoka, sans-serif`;
    ctx.fillText(initials, w / 2, h / 2);
}

/** Idle screen of the TV (title screen of a retro game). */
export function drawTvIdle(ctx, w, h, { title, subtitle, time }) {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.7);
    gradient.addColorStop(0, '#1c3a78');
    gradient.addColorStop(1, '#070d1f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ffd36b';
    ctx.font = `${h * 0.075}px 'Press Start 2P', monospace`;
    ctx.fillText(title, w / 2, h * 0.38);

    ctx.fillStyle = '#9fc3ff';
    ctx.font = `${h * 0.035}px 'Press Start 2P', monospace`;
    ctx.fillText(subtitle, w / 2, h * 0.5);

    if (Math.floor(time * 1.6) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${h * 0.045}px 'Press Start 2P', monospace`;
        ctx.fillText('PRESS START', w / 2, h * 0.72);
    }

    // Scanlines + a bit of noise
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 300; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
}

export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/** Draws `img` to fill the rect, cropping the overflow (like CSS object-fit: cover). */
function drawImageCover(ctx, img, x, y, w, h) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

/**
 * Game case jacket in a 16-bit cartridge style: black grid header, artwork, title bar.
 * `image` (optional) replaces the generated artwork.
 */
export function drawGameCover(ctx, w, h, { title, color, label, image }) {
    const header = h * 0.13;
    const footer = h * 0.11;

    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, w, h);

    // Artwork
    const artY = header;
    const artH = h - header - footer;
    if (image) {
        drawImageCover(ctx, image, 0, artY, w, artH);
    } else {
        const sky = ctx.createLinearGradient(0, artY, 0, artY + artH);
        sky.addColorStop(0, '#1a1033');
        sky.addColorStop(0.55, color);
        sky.addColorStop(1, '#ffcf8a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, artY, w, artH);

        // Striped retro sun
        const sunY = artY + artH * 0.62;
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, sunY, w * 0.3, Math.PI, 0);
        ctx.clip();
        ctx.fillStyle = '#ffe08a';
        ctx.fillRect(0, sunY - w * 0.3, w, w * 0.3);
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) ctx.fillRect(0, sunY - w * 0.04 - i * w * 0.05, w, 4 + i);
        ctx.restore();

        // Perspective floor grid
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        const floorY = sunY;
        for (let i = -8; i <= 8; i++) {
            ctx.beginPath();
            ctx.moveTo(w / 2 + i * w * 0.02, floorY);
            ctx.lineTo(w / 2 + i * w * 0.2, artY + artH);
            ctx.stroke();
        }
        for (let i = 1; i < 6; i++) {
            const y = floorY + (artY + artH - floorY) * (i / 6) ** 1.6;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Big title on the artwork
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let size = w * 0.11;
        ctx.font = `${size}px 'Press Start 2P', monospace`;
        while (ctx.measureText(title).width > w * 0.86 && size > 12) {
            size -= 2;
            ctx.font = `${size}px 'Press Start 2P', monospace`;
        }
        ctx.fillStyle = '#1a1033';
        ctx.fillText(title, w / 2 + 4, artY + artH * 0.22 + 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(title, w / 2, artY + artH * 0.22);
    }

    // Grid header
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, w, header);
    ctx.strokeStyle = '#2c2c33';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += header / 4) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, header); ctx.stroke();
    }
    for (let y = 0; y < header; y += header / 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.fillStyle = '#d7263d';
    ctx.font = `italic 700 ${header * 0.5}px Fredoka, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('16-BIT', w * 0.05, header / 2);
    ctx.fillStyle = '#d9d9e0';
    ctx.font = `600 ${header * 0.26}px Fredoka, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(label.toUpperCase(), w * 0.95, header / 2);

    // Title bar
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, h - footer, w, footer);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    let size = footer * 0.36;
    ctx.font = `${size}px 'Press Start 2P', monospace`;
    while (ctx.measureText(title).width > w * 0.9 && size > 8) {
        size -= 1;
        ctx.font = `${size}px 'Press Start 2P', monospace`;
    }
    ctx.fillText(title, w / 2, h - footer / 2);
}

/** Case spine: title written bottom to top. */
export function drawGameSpine(ctx, w, h, { title, color }) {
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h * 0.08);

    ctx.save();
    ctx.translate(w / 2, h * 0.55);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${w * 0.42}px 'Press Start 2P', monospace`;
    ctx.fillText(title, 0, 0, h * 0.8);
    ctx.restore();
}

/** TV screen while a project page is loading. */
export function drawTvLoading(ctx, w, h, { title, time }) {
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9fc3ff';
    ctx.font = `${h * 0.04}px 'Press Start 2P', monospace`;
    ctx.fillText(`LOADING${'.'.repeat(Math.floor(time * 3) % 4)}`, w / 2, h * 0.42);

    ctx.fillStyle = '#ffd36b';
    ctx.font = `${h * 0.06}px 'Press Start 2P', monospace`;
    ctx.fillText(title, w / 2, h * 0.55, w * 0.9);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
}
