import * as THREE from 'three';
import { applyTransform, box, enableShadows } from '../core/ObjectFactory.js';
import { dampFactor, setHighlight } from '../utils/animation.js';
import { tr } from '../i18n.js';
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

/** Draw function for the frame's picture, in the current language (null for photos). */
function frameDrawer(frame, about, cw, ch) {
    const name = `${about.firstName} ${about.lastName}`;
    switch (frame.kind) {
        case 'photo':
            if (about.photo) return null;
            return (ctx) => drawPhotoPlaceholder(ctx, cw, ch, {
                initials: `${about.firstName[0]}${about.lastName[0]}`,
            });
        case 'diploma':
            return (ctx) => drawDiploma(ctx, cw, ch, {
                heading: tr(frame.heading),
                title: tr(frame.title),
                subtitle: tr(frame.subtitle),
                name,
            });
        case 'text':
            return (ctx) => drawTextCard(ctx, cw, ch, {
                title: tr(frame.title) ?? name,
                subtitle: tr(frame.subtitle ?? about.title),
                text: tr(frame.text ?? about.bio),
            });
        default:
            throw new Error(`Unknown frame kind "${frame.kind}"`);
    }
}

function frameContent(frame, about, w, h) {
    const cw = Math.round(w * PX_PER_UNIT);
    const ch = Math.round(h * PX_PER_UNIT);
    const draw = frameDrawer(frame, about, cw, ch);
    if (!draw) return coverTexture(about.photo, w, h);

    const texture = canvasTexture(cw, ch, draw);
    texture.userData.refresh = () => texture.redraw(draw);
    return texture;
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
    holder.userData.picture = picture;
    holder.userData.opacity = 1;
    holder.traverse((child) => {
        if (child.isMesh) child.material.transparent = true;
    });
    return enableShadows(holder);
}

export async function createAboutCorner(def, about) {
    const group = applyTransform(new THREE.Group(), def);
    group.name = 'AboutCorner';

    const frames = about.frames.map((frame) => buildFrame(frame, about, def.frameColor));
    group.add(...frames);

    /**
     * Camera view looking straight at a frame's picture, close enough to read it.
     * fov: camera vertical field of view in degrees. fill: share of the screen height the frame takes.
     */
    function closeUpView(holder, fov, fill) {
        const { picture, frame } = holder.userData;
        const center = picture.getWorldPosition(new THREE.Vector3());
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(picture.getWorldQuaternion(new THREE.Quaternion()));
        const distance = (frame.size[1] / fill) / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
        return {
            position: center.clone().addScaledVector(normal, distance).toArray(),
            target: center.toArray(),
            parallax: 0.015,
            minAspect: frame.size[0] / frame.size[1] * 1.3,
        };
    }

    function setHovered(holder, hovered) {
        setHighlight(holder, '#ffcc88', hovered ? 0.18 : 0);
    }

    // During a close-up the other frames fade out so they don't hide the focused one.
    let focused = null;
    function setFocus(holder) {
        focused = holder;
    }

    function update(dt) {
        const k = dampFactor(8, dt);
        for (const holder of frames) {
            const target = !focused || holder === focused ? 1 : 0;
            holder.userData.opacity += (target - holder.userData.opacity) * k;
            const { opacity } = holder.userData;
            holder.visible = opacity > 0.01;
            holder.traverse((child) => {
                if (!child.isMesh) return;
                child.material.opacity = opacity;
                child.castShadow = opacity > 0.5;
            });
        }
    }

    /** Redraws the frames' texts in the current language. */
    function refreshTexts() {
        for (const holder of frames) holder.userData.picture.material.map.userData.refresh?.();
    }

    return { group, frames, closeUpView, setHovered, setFocus, update, refreshTexts };
}
