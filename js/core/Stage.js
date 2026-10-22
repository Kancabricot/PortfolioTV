import * as THREE from 'three';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

// CSS3D works in pixels: at our ~1 unit = 1 meter scale, elements end up a few pixels from the
// camera and the browser's 3D math becomes imprecise (the page drifts off the TV screen).
// The CSS layer is therefore rendered in a copy of the world scaled up by this factor.
const CSS_SCALE = 1000;

const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();

/**
 * Owns the renderers, scene, camera, lights and the render loop.
 * A CSS3D layer on top of the WebGL canvas displays real HTML in 3D (the TV page),
 * see addCssObject().
 */
export class Stage {
    constructor(container, config) {
        this.container = container;
        this.tickers = [];

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.renderer.maxPixelRatio));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = config.renderer.exposure;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        this.cssRenderer = new CSS3DRenderer();
        this.cssRenderer.domElement.className = 'css3d-layer';
        container.appendChild(this.cssRenderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.1, 100);

        this.cssScene = new THREE.Scene();
        this.cssCamera = new THREE.PerspectiveCamera();
        this.cssObjects = [];
        this.clock = new THREE.Clock();

        this.setupLights(config.lights);

        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.renderer.setAnimationLoop(() => this.tick());
    }

    setupLights({ hemisphere, key, rim }) {
        this.scene.add(new THREE.HemisphereLight(hemisphere.sky, hemisphere.ground, hemisphere.intensity));

        const keyLight = new THREE.DirectionalLight(key.color, key.intensity);
        keyLight.position.set(...key.position);
        if (key.castShadow) {
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.set(2048, 2048);
            keyLight.shadow.camera.left = -4.5;
            keyLight.shadow.camera.right = 4.5;
            keyLight.shadow.camera.top = 4.5;
            keyLight.shadow.camera.bottom = -4.5;
            keyLight.shadow.bias = -0.0005;
            keyLight.shadow.radius = 4;
        }
        this.scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(rim.color, rim.intensity);
        rimLight.position.set(...rim.position);
        this.scene.add(rimLight);
    }

    add(...objects) {
        this.scene.add(...objects);
    }

    /**
     * Shows a CSS3DObject glued to `anchor` (any Object3D of the 3D scene).
     * `size` is the anchor-space width the element must cover.
     */
    addCssObject(object, anchor, size) {
        object.userData.anchor = anchor;
        object.userData.unitScale = size / parseFloat(object.element.style.width); // element needs an inline px width
        this.cssScene.add(object);
        this.cssObjects.push(object);
    }

    syncCssLayer() {
        this.cssCamera.copy(this.camera);
        this.cssCamera.position.multiplyScalar(CSS_SCALE);
        this.cssCamera.updateMatrixWorld();

        for (const object of this.cssObjects) {
            object.userData.anchor.matrixWorld.decompose(_position, _quaternion, _scale);
            object.position.copy(_position).multiplyScalar(CSS_SCALE);
            object.quaternion.copy(_quaternion);
            object.scale.copy(_scale).multiplyScalar(CSS_SCALE * object.userData.unitScale);
        }
    }

    /** fn(deltaSeconds, elapsedSeconds) is called every frame. */
    onTick(fn) {
        this.tickers.push(fn);
    }

    get aspect() {
        return this.camera.aspect;
    }

    resize() {
        const { clientWidth: w, clientHeight: h } = this.container;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.cssRenderer.setSize(w, h);
    }

    tick() {
        const dt = Math.min(this.clock.getDelta(), 0.1);
        const t = this.clock.elapsedTime;
        for (const fn of this.tickers) fn(dt, t);
        this.renderer.render(this.scene, this.camera);
        this.syncCssLayer();
        this.cssRenderer.render(this.cssScene, this.cssCamera);
    }
}
