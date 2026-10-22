import * as THREE from 'three';

/**
 * Owns the renderer, scene, camera, lights and the render loop.
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

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.1, 100);
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
    }

    tick() {
        const dt = Math.min(this.clock.getDelta(), 0.1);
        const t = this.clock.elapsedTime;
        for (const fn of this.tickers) fn(dt, t);
        this.renderer.render(this.scene, this.camera);
    }
}
