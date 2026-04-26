let scene, camera, renderer, composer, dnaGroup, raycaster, mouse;
let interactiveNodes = [];
let isUniverseActive = false;
let clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00080a);
    scene.fog = new THREE.Fog(0x00080a, 50, 400);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Post Processing for that Digital Glow
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.0;
    bloomPass.radius = 0.5;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createDigitalGrid();
    createDataDNA();
    createDiagnosticStations();
    addDataStreams();

    camera.position.set(0, 100, 250);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createDigitalGrid() {
    const size = 500;
    const divisions = 50;
    
    // Primary Grid
    const gridHelper = new THREE.GridHelper(size, divisions, 0x00ffcc, 0x011a1a);
    gridHelper.position.y = -20;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Secondary vertical grid lines (Wireframe Walls)
    const wallGeom = new THREE.PlaneGeometry(size, 100, 20, 10);
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.05 });
    
    const backWall = new THREE.Mesh(wallGeom, wallMat);
    backWall.position.z = -size/2;
    backWall.position.y = 30;
    scene.add(backWall);
}

function createDataDNA() {
    const segments = 120;
    const radius = 8;
    const height = 100;
    const twist = Math.PI * 8;

    const sphereGeom = new THREE.SphereGeometry(0.3, 8, 8);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.2 });

    for (let i = 0; i < segments; i++) {
        const ratio = i / segments;
        const angle = ratio * twist;
        const y = ratio * height - height/2;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;

        // "Base Pairs" as Point Clouds
        const p1 = new THREE.Mesh(sphereGeom, new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
        p1.position.set(x1, y, z1);
        dnaGroup.add(p1);

        const p2 = new THREE.Mesh(sphereGeom, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
        p2.position.set(x2, y, z2);
        dnaGroup.add(p2);

        const points = [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeom, lineMat);
        dnaGroup.add(line);
    }
}

function createDiagnosticStations() {
    // Station Alpha: Amazon
    createNode(-60, 20, 40, 'experience', 'STATION_ALPHA // BACKEND_TUNING');
    // Station Beta: Skills
    createNode(60, 20, 40, 'skills', 'STATION_BETA // GENETIC_TOOLKIT');
    // Station Gamma: Projects
    createNode(0, 50, -60, 'projects', 'STATION_GAMMA // SYNTHESIS_VAULT');
}

function createNode(x, y, z, type, labelText) {
    const group = new THREE.Group();

    // Wireframe Box (Digital Hub)
    const hubGeom = new THREE.IcosahedronGeometry(6, 1);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true });
    const hub = new THREE.Mesh(hubGeom, hubMat);
    group.add(hub);

    // Inner Glowing Core
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2, 0),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc })
    );
    group.add(core);

    // Callout Label (Sprite or Text would be here, we'll use a detection area)
    hub.userData = { type, label: labelText, camPos: new THREE.Vector3(x, y + 5, z + 30) };
    interactiveNodes.push(hub);

    group.position.set(x, y, z);
    scene.add(group);
}

function addDataStreams() {
    const count = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i*3] = (Math.random() - 0.5) * 400;
        positions[i*3+1] = Math.random() * 100;
        positions[i*3+2] = (Math.random() - 0.5) * 400;
        speeds[i] = Math.random() * 0.5 + 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 0.5, color: 0x00ffcc, transparent: true, opacity: 0.8 });
    const streams = new THREE.Points(geometry, material);
    scene.add(streams);
    
    scene.userData.streams = { mesh: streams, speeds: speeds };
}

function onClick() {
    if (!isUniverseActive) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveNodes);
    if (intersects.length > 0) {
        const node = intersects[0].object;
        focusTwin(node.userData.type, node.userData.camPos, node.getWorldPosition(new THREE.Vector3()));
    }
}

function focusTwin(type, camPos, targetPos) {
    gsap.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z, duration: 1.5, ease: "power3.inOut" });
    
    const dummy = new THREE.Object3D();
    dummy.position.copy(camPos);
    dummy.lookAt(targetPos);
    
    gsap.to(camera.quaternion, {
        x: dummy.quaternion.x, y: dummy.quaternion.y, z: dummy.quaternion.z, w: dummy.quaternion.w,
        duration: 1.5, ease: "power3.inOut",
        onComplete: () => { showOverlay(`${type}-overlay`); }
    });
}

function showOverlay(id) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    gsap.fromTo(el, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4 });
}

function closeOverlay(id) {
    gsap.to(`#${id}`, { 
        opacity: 0, duration: 0.3, 
        onComplete: () => {
            document.getElementById(id).classList.add('hidden');
            gsap.to(camera.position, { x: 0, y: 100, z: 250, duration: 2, ease: "power2.inOut" });
            gsap.to(camera.rotation, { x: -0.4, y: 0, z: 0, duration: 2 });
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    if (dnaGroup) {
        dnaGroup.rotation.y = time * 0.2;
    }

    if (scene.userData.streams) {
        const positions = scene.userData.streams.mesh.geometry.attributes.position.array;
        const speeds = scene.userData.streams.speeds;
        for (let i = 0; i < speeds.length; i++) {
            positions[i*3+1] -= speeds[i];
            if (positions[i*3+1] < 0) positions[i*3+1] = 100;
        }
        scene.userData.streams.mesh.geometry.attributes.position.needsUpdate = true;
    }

    composer.render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

document.getElementById('enter-btn').addEventListener('click', () => {
    isUniverseActive = true;
    gsap.to('#intro-screen', { opacity: 0, duration: 1, onComplete: () => {
        document.getElementById('intro-screen').style.display = 'none';
        document.querySelectorAll('.ui-element').forEach(el => el.classList.remove('hidden'));
    }});
    gsap.to(camera.position, { x: 0, y: 80, z: 180, duration: 2.5, ease: "expo.inOut" });
    gsap.to(camera.rotation, { x: -0.4, duration: 2.5 });
});

window.focusNode = (type) => {
    const node = interactiveNodes.find(n => n.userData.type === type);
    if (node) focusTwin(type, node.userData.camPos, node.getWorldPosition(new THREE.Vector3()));
};

window.closeOverlay = closeOverlay;
init();
