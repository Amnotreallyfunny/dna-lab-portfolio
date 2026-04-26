let scene, camera, renderer, composer, dnaGroup, raycaster, mouse;
let interactiveNodes = [];
let isUniverseActive = false;
let clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00080a);
    scene.fog = new THREE.Fog(0x00080a, 50, 500);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createNetwork();
    createCentralCore();
    createSectors();

    camera.position.set(0, 500, 500);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createNetwork() {
    const size = 1000;
    const grid = new THREE.GridHelper(size, 40, 0x00ffcc, 0x011a1a);
    grid.position.y = -50;
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);
}

function createCentralCore() {
    const segments = 150;
    const radius = 10;
    const height = 150;
    const twist = Math.PI * 10;

    for (let i = 0; i < segments; i++) {
        const ratio = i / segments;
        const angle = ratio * twist;
        const y = ratio * height - height/2;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;

        const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
        p1.position.set(x1, y, z1);
        dnaGroup.add(p1);

        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
        p2.position.set(x2, y, z2);
        dnaGroup.add(p2);

        const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)]);
        dnaGroup.add(new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.1 })));
    }
}

function createSectors() {
    // Sector Coordinates
    const sectors = [
        { id: 'amazon', pos: [-150, 50, -150], color: 0xffaa00, label: 'AMAZON_LAB' },
        { id: 'aiotel', pos: [150, 50, -150], color: 0x00ccff, label: 'IOT_WING' },
        { id: 'robotics', pos: [0, 50, 200], color: 0xff0055, label: 'ROBOTICS_BAY' },
        { id: 'skills', pos: [0, -20, 0], color: 0x00ffcc, label: 'CORE_SPECS' }
    ];

    sectors.forEach(s => {
        const group = new THREE.Group();
        
        // Sector Room (Wireframe Cube)
        const roomGeom = new THREE.BoxGeometry(80, 80, 80);
        const roomMat = new THREE.MeshBasicMaterial({ color: s.color, wireframe: true, transparent: true, opacity: 0.1 });
        const room = new THREE.Mesh(roomGeom, roomMat);
        group.add(room);

        // Interactive Core
        const core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(8, 1),
            new THREE.MeshBasicMaterial({ color: s.color, wireframe: true })
        );
        core.userData = { type: s.id, camPos: new THREE.Vector3(s.pos[0], s.pos[1], s.pos[2] + 100) };
        group.add(core);
        interactiveNodes.push(core);

        // Data Cable back to central core
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(s.pos[0], s.pos[1], s.pos[2])];
        const cableGeom = new THREE.BufferGeometry().setFromPoints(points);
        scene.add(new THREE.Line(cableGeom, new THREE.LineBasicMaterial({ color: s.color, transparent: true, opacity: 0.2 })));

        group.position.set(s.pos[0], s.pos[1], s.pos[2]);
        scene.add(group);
    });
}

function onClick() {
    if (!isUniverseActive) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveNodes);
    if (intersects.length > 0) {
        const node = intersects[0].object;
        focusSector(node.userData.type, node.userData.camPos, node.getWorldPosition(new THREE.Vector3()));
    }
}

function focusSector(type, camPos, targetPos) {
    gsap.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z, duration: 2, ease: "expo.inOut" });
    
    const dummy = new THREE.Object3D();
    dummy.position.copy(camPos);
    dummy.lookAt(targetPos);
    
    gsap.to(camera.quaternion, {
        x: dummy.quaternion.x, y: dummy.quaternion.y, z: dummy.quaternion.z, w: dummy.quaternion.w,
        duration: 2, ease: "expo.inOut",
        onComplete: () => { document.getElementById(`${type}-overlay`).classList.remove('hidden'); }
    });
}

function closeOverlay(id) {
    document.getElementById(id).classList.add('hidden');
    gsap.to(camera.position, { x: 0, y: 300, z: 400, duration: 2, ease: "power2.inOut" });
    gsap.to(camera.rotation, { x: -0.6, y: 0, z: 0, duration: 2 });
}

function animate() {
    requestAnimationFrame(animate);
    if (dnaGroup) dnaGroup.rotation.y += 0.005;
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
    gsap.to(camera.position, { x: 0, y: 300, z: 400, duration: 3, ease: "expo.inOut" });
});

window.focusSector = (type) => {
    const node = interactiveNodes.find(n => n.userData.type === type);
    if (node) focusSector(type, node.userData.camPos, node.getWorldPosition(new THREE.Vector3()));
};

window.closeOverlay = closeOverlay;
init();
