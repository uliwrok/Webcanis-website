import * as THREE from 'three';
import { GLTFLoader } from '../lib/three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../lib/three/examples/jsm/environments/RoomEnvironment.js';
import { getLaptopPose, laptopPoses } from './laptop-motion.mjs';

let screenSource = null;
let updateScreen = null;

// A business condition can call this with a local image URL, or null to clear it.
export async function setLaptopScreenImage(source = null) {
    if (source !== null) {
        if (typeof source !== 'string') throw new TypeError('A screen image must be a URL string or null.');
        const url = new URL(source, document.baseURI);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== location.origin) {
            throw new Error('Laptop screen images must use a same-origin HTTP(S) URL.');
        }
        source = url.href;
    }
    screenSource = source;
    if (updateScreen) await updateScreen(source);
}

export async function createLaptopRenderer(journey) {
    const sharedStage = journey.querySelector('.laptop-stage');
    const slots = [...journey.querySelectorAll('[data-model-pose]')];
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = 'laptop-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.2;
    pmrem.dispose();
    room.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777780, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe5edff, 1.2);
    fill.position.set(4, 2, -3);
    scene.add(fill);
    const camera = new THREE.PerspectiveCamera(35, 1728 / 1077, .01, 20);
    camera.position.set(0, 0, .6);
    camera.updateMatrixWorld();

    let gltf;
    try {
        gltf = await new GLTFLoader().loadAsync(sharedStage.dataset.modelUrl);
    } catch (error) {
        environment.dispose();
        renderer.dispose();
        throw error;
    }
    const model = gltf.scene;
    const hinge = model.getObjectByName('Lid_Hinge');
    const screen = model.getObjectByName('Screen_Surface');
    if (!hinge || !screen?.isMesh) {
        renderer.dispose();
        environment.dispose();
        throw new Error('The laptop model is missing its hinge or screen mesh.');
    }
    model.traverse(object => {
        if (!object.isMesh) return;
        for (const material of [].concat(object.material)) {
            if (material.metalness < .1) material.envMapIntensity = .15;
        }
    });
    // Remove both embedded placeholder maps. No camera website or texture is shown initially.
    const originalScreen = screen.material;
    const oldTextures = new Set([originalScreen.map, originalScreen.emissiveMap].filter(Boolean));
    const oldImages = new Set([...oldTextures].map(texture => texture.image));
    oldTextures.forEach(texture => texture.dispose());
    oldImages.forEach(image => image?.close?.());
    originalScreen.dispose();
    screen.material = new THREE.MeshBasicMaterial({
        color: 0x090c10, toneMapped: false, side: THREE.DoubleSide
    });
    // Bring the independent screen in front of the exported gasket's solid front face.
    screen.position.y -= .0006;
    scene.add(model);
    sharedStage.append(canvas);
    journey.dataset.modelState = 'ready';
    journey.dataset.screenState = 'blank';

    const bounds = new THREE.Box3();
    const center = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const corners = [];
    model.traverse(object => {
        if (!object.isMesh) return;
        object.geometry.computeBoundingBox();
        const { min, max } = object.geometry.boundingBox;
        for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
            corners.push({ object, point: new THREE.Vector3(x, y, z) });
        }
    });

    function projectedBounds() {
        const result = { left: Infinity, right: -Infinity, top: -Infinity, bottom: Infinity };
        for (const { object, point } of corners) {
            projected.copy(point).applyMatrix4(object.matrixWorld).project(camera);
            result.left = Math.min(result.left, projected.x);
            result.right = Math.max(result.right, projected.x);
            result.bottom = Math.min(result.bottom, projected.y);
            result.top = Math.max(result.top, projected.y);
        }
        return result;
    }
    let state = { enhanced: false, time: 0 };
    let lastSignature = '';
    let disposed = false;
    let contextLost = false;
    let screenTexture = null;
    let imageRequest = 0;

    function draw() {
        if (disposed || contextLost || document.hidden) return;
        let host = sharedStage;
        let pose = getLaptopPose(state.time);
        if (!state.enhanced) {
            host = slots.reduce((closest, slot) => {
                const distance = element => {
                    const rect = element.getBoundingClientRect();
                    return Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
                };
                return distance(slot) < distance(closest) ? slot : closest;
            }, slots[0]);
            pose = laptopPoses[host.dataset.modelPose];
        }
        if (canvas.parentElement !== host) {
            host.append(canvas);
            lastSignature = '';
        }
        const rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > window.innerHeight) return;
        const signature = `${state.enhanced}:${state.enhanced ? state.time : host.dataset.modelPose}:${rect.width}:${rect.height}`;
        if (signature === lastSignature) return;
        lastSignature = signature;
        renderer.setSize(rect.width, rect.height, false);
        const designHeight = rect.height / rect.width * 1728;
        hinge.rotation.x = pose.lid;
        model.position.set(0, 0, 0);
        model.scale.setScalar(1);
        model.rotation.set(pose.pitch, pose.yaw, pose.roll, 'YXZ');
        model.updateMatrixWorld(true);
        bounds.setFromObject(model);
        bounds.getCenter(center);
        model.position.copy(center).negate();
        model.updateMatrixWorld(true);
        camera.aspect = rect.width / rect.height;
        camera.zoom = 1;
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
        const unzoomed = projectedBounds();
        camera.zoom = state.enhanced
            ? (pose.width / 1728 * 2) / (unzoomed.right - unzoomed.left)
            : Math.min(1.74 / (unzoomed.right - unzoomed.left), 1.8 / (unzoomed.top - unzoomed.bottom));
        camera.updateProjectionMatrix();
        const framed = projectedBounds();
        const targetX = state.enhanced ? pose.x / 1728 * 2 - 1 : 0;
        const targetY = state.enhanced ? 1 - pose.y / designHeight * 2 : 0;
        camera.setViewOffset(rect.width, rect.height,
            ((framed.left + framed.right) / 2 - targetX) * rect.width / 2,
            (targetY - (framed.top + framed.bottom) / 2) * rect.height / 2,
            rect.width, rect.height);
        renderer.render(scene, camera);
    }

    async function setScreenImage(source) {
        const request = ++imageRequest;
        let texture = null;
        if (source) {
            texture = await new THREE.TextureLoader().loadAsync(source);
            if (request !== imageRequest || disposed) {
                texture.dispose();
                return;
            }
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        }
        screenTexture?.dispose();
        screenTexture = texture;
        screen.material.map = texture;
        screen.material.color.set(texture ? 0xffffff : 0x090c10);
        screen.material.needsUpdate = true;
        journey.dataset.screenState = texture ? 'image' : 'blank';
        lastSignature = '';
        draw();
    }

    function dispose() {
        disposed = true;
        imageRequest++;
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        model.traverse(object => {
            if (!object.isMesh) return;
            geometries.add(object.geometry);
            for (const material of [].concat(object.material)) {
                materials.add(material);
                for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
            }
        });
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
        const images = new Set([...textures].map(texture => texture.image));
        textures.forEach(texture => texture.dispose());
        images.forEach(image => image?.close?.());
        environment.dispose();
        renderer.dispose();
        updateScreen = null;
    }

    updateScreen = setScreenImage;
    try {
        await setScreenImage(screenSource);
    } catch (error) {
        console.warn('The initial laptop screen image could not be loaded; leaving it blank.', error);
        await setScreenImage(null);
    }
    canvas.addEventListener('webglcontextlost', () => {
        contextLost = true;
        journey.dataset.modelState = 'unavailable';
    });
    document.addEventListener('visibilitychange', () => { lastSignature = ''; draw(); });
    window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
    return { update(nextState) { state = nextState; draw(); } };
}
