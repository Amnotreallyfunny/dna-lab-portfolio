let scene, camera, renderer, composer, dnaGroup, raycaster, mouse;
let interactiveNodes = [];
let isUniverseActive = false;
let clock = new THREE.Clock();

// Corridor Dimensions
const corridorWidth = 40;
const corridorHeight = 30;
const corridorLength = 600;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00080a);
    scene.fog = new THREE.Fog(0x00080a, 50, 400);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

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
    mouse = new THREE.Vector2(0, 0);

    createHallway();
    createDNALab();
    createSectors();

    camera.position.set(0, 5, 250);
    camera.lookAt(0, 5, -300);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createHallway() {
    const floorGeom = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x050a10, metalness: 0.9, roughness: 0.1 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -corridorLength / 2 + 300;
    scene.add(floor);

    const ceiling = floor.clone();
    ceiling.position.y = corridorHeight;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    const wallGeom = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x020508, metalness: 0.8, roughness: 0.5 });

    const leftWall = new THREE.Mesh(wallGeom, wallMat);
    leftWall.position.x = -corridorWidth / 2;
    leftWall.position.y = corridorHeight / 2;
    leftWall.position.z = -corridorLength / 2 + 300;
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = corridorWidth / 2;
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    const grid = new THREE.GridHelper(corridorLength, 60, 0x00ffcc, 0x011a1a);
    grid.position.set(0, 0.1, -corridorLength/2 + 300);
    grid.rotation.y = Math.PI / 2;
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    for(let i = 0; i < 6; i++) {
        const pLight = new THREE.PointLight(0x00ffcc, 0.5, 100);
        pLight.position.set(0, corridorHeight - 2, 200 - i * 120);
        scene.add(pLight);
    }
    scene.add(new THREE.AmbientLight(0x101010));
}

function createDNALab() {
    const segments = 120;
    const radius = 6;
    const height = 80;
    const twist = Math.PI * 6;
    for (let i = 0; i < segments; i++) {
        const ratio = i / segments;
        const angle = ratio * twist;
        const y = ratio * height + 2;
        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;
        const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
        p1.position.set(x1, y, z1);
        dnaGroup.add(p1);
        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
        p2.position.set(x2, y, z2);
        dnaGroup.add(p2);
        const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)]);
        dnaGroup.add(new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.1 })));
    }
    dnaGroup.position.set(0, 0, -280);
}

function createSectors() {
    const sectors = [
        { id: 'amazon', side: 'left', z: 150, color: 0xffaa00 },
        { id: 'aiotel', side: 'right', z: 50, color: 0x00ccff },
        { id: 'robotics', side: 'left', z: -50, color: 0xff0055 },
        { id: 'skills', side: 'right', z: -150, color: 0x00ffcc }
    ];
    sectors.forEach(s => {
        const x = s.side === 'left' ? -corridorWidth/2 : corridorWidth/2;
        const group = new THREE.Group();
        const door = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 15), new THREE.MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.2 }));
        group.add(door);
        const hub = new THREE.Mesh(new THREE.BoxGeometry(5, 25, 20), new THREE.MeshBasicMaterial({ visible: false }));
        hub.userData = { 
            type: s.id, 
            walkPos: new THREE.Vector3(s.side === 'left' ? -10 : 10, 5, s.z),
            targetPos: new THREE.Vector3(s.side === 'left' ? -corridorWidth/2 : corridorWidth/2, 5, s.z)
        };
        group.add(hub);
        interactiveNodes.push(hub);
        group.position.set(x, 10, s.z);
        scene.add(group);
    });
}

function onClick(event) {
    if (!isUniverseActive) return;
    if (event.target.closest('.hologram-panel') || event.target.closest('header') || event.target.tagName === 'BUTTON') return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveNodes, true);
    if (intersects.length > 0) {
        const node = intersects[0].object;
        triggerSectorNavigation(node.userData.type, node.userData.walkPos, node.userData.targetPos);
    }
}

function triggerSectorNavigation(type, walkPos, targetPos) {
    document.querySelectorAll('.hologram-panel').forEach(p => p.classList.add('hidden'));
    const tl = gsap.timeline();
    tl.to(camera.position, { z: walkPos.z, duration: Math.abs(camera.position.z - walkPos.z) / 100 + 0.5, ease: "power1.inOut" });
    tl.to(camera.position, { x: walkPos.x, duration: 0.8, ease: "power2.out" }, "-=0.3");
    const dummy = new THREE.Object3D();
    dummy.position.copy(walkPos);
    dummy.lookAt(targetPos.x, targetPos.y, targetPos.z);
    tl.to(camera.quaternion, { x: dummy.quaternion.x, y: dummy.quaternion.y, z: dummy.quaternion.z, w: dummy.quaternion.w, duration: 0.8, onComplete: () => { 
        const overlay = document.getElementById(`${type}-overlay`);
        if (overlay) {
            overlay.classList.remove('hidden');
            gsap.fromTo(overlay, { opacity: 0, scale: 0.9, xPercent: -50, yPercent: -50, left: "50%", top: "50%" }, { opacity: 1, scale: 1, duration: 0.4 });
        }
    }}, "-=0.5");
}

function closeOverlay(id) {
    document.getElementById(id).classList.add('hidden');
    const dummy = new THREE.Object3D();
    dummy.position.copy(camera.position);
    dummy.lookAt(0, 5, -500);
    gsap.to(camera.quaternion, { x: dummy.quaternion.x, y: dummy.quaternion.y, z: dummy.quaternion.z, w: dummy.quaternion.w, duration: 1, ease: "power2.inOut" });
    gsap.to(camera.position, { x: 0, duration: 0.8 });
}

function animate() {
    requestAnimationFrame(animate);
    if (dnaGroup) dnaGroup.rotation.y += 0.01;
    composer.render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
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
    gsap.to(camera.position, { z: 220, duration: 2, ease: "power2.out" });
});

window.focusSector = (type) => {
    const node = interactiveNodes.find(n => n.userData.type === type);
    if (node) triggerSectorNavigation(type, node.userData.walkPos, node.userData.targetPos);
};


window.closeOverlay = closeOverlay;
init();
