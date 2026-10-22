import * as THREE from 'three';
import { applyTransform, box, enableShadows } from '../core/ObjectFactory.js';
import {
    canvasTexture, drawDiploma, drawPhotoPlaceholder, drawTextCard,
} from '../utils/canvasTextures.js';

const textureLoader = new THREE.TextureLoader();
const PX_PER_UNIT = 1024;

/** Loads an image as a texture cropped to fill a `width/height` area. */
function coverTexture(url, width, height) {
    const texture = textureLoader.load(url, (tex) => {
        const imageAspect = tex.image.width / tex.image.height;
        const frameAspect = width / height;
        if (imageAspect > frameAspect) {
            tex.repeat.set(frameAspect / imageAspect, 1);
            tex.offset.set((1 - tex.repeat.x) / 2, 0);
        } else {
            tex.repeat.set(1, imageAspect / frameAspect);
            tex.offset.set(0, (1 - tex.repeat.y) / 2);
        }
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function frameContent(frame, about, w, h) {
    const cw = Math.round(w * PX_PER_UNIT);
    const ch = Math.round(h * PX_PER_UNIT);
    const name = `${about.firstName} ${about.lastName}`;

    switch (frame.kind) {
        case 'photo':
            if (about.photo) return coverTexture(about.photo, w, h);
            return canvasTexture(cw, ch, (ctx) => drawPhotoPlaceholder(ctx, cw, ch, {
                initials: `${about.firstName[0]}${about.lastName[0]}`,
            }));
        case 'diploma':
            return canvasTexture(cw, ch, (ctx) => drawDiploma(ctx, cw, ch, { ...frame, name }));
        case 'text':
            return canvasTexture(cw, ch, (ctx) => drawTextCard(ctx, cw, ch, {
                title: frame.title ?? name,
                subtitle: frame.subtitle ?? about.title,
                text: frame.text ?? about.bio,
            }));
        default:
            throw new Error(`Unknown frame kind "${frame.kind}"`);
    }
}

function buildFrame(frame, about, frameColor) {
    const [w, h] = frame.size;
    const border = 0.04;
    const depth = 0.03;

    // Pivot at the bottom edge so `lean` tilts the frame back on the desk.
    const pivot = new THREE.Group();

    const back = box(w + border * 2, h + border * 2, depth, frameColor, { roughness: 0.5 });
    back.position.y = (h + border * 2) / 2;
    pivot.add(back);

    const picture = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshStandardMaterial({ map: frameContent(frame, about, w, h), roughness: 0.8 }),
    );
    picture.position.set(0, back.position.y, depth / 2 + 0.001);
    pivot.add(picture);

    // Easel stand behind
    const standLength = h * 0.75;
    const stand = box(0.05, standLength, 0.015, frameColor);
    stand.geometry.translate(0, -standLength / 2, 0);
    stand.position.set(0, h * 0.7, -depth / 2);
    stand.rotation.x = 0.45;
    pivot.add(stand);

    pivot.rotation.x = -(frame.lean ?? 0.15);

    const holder = new THREE.Group();
    holder.add(pivot);
    holder.position.set(...frame.position);
    holder.rotation.y = frame.rotationY ?? 0;
    holder.userData.frame = frame;
    return enableShadows(holder);
}

export async function createAboutCorner(def, about) {
    const group = applyTransform(new THREE.Group(), def);
    group.name = 'AboutCorner';

    const frames = about.frames.map((frame) => buildFrame(frame, about, def.frameColor));
    group.add(...frames);

    return { group, frames };
}
