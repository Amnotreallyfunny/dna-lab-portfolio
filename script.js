let scene, camera, renderer, dnaGroup, raycaster, mouse;
let interactiveNodes = [];
let isUniverseActive = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createUniverse();
    createDNA();
    addLights();

    camera.position.z = 100;
    camera.position.y = 50;
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createUniverse() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createDNA() {
    const segments = 100;
    const radius = 10;
    const height = 150;
    const twist = Math.PI * 4;

    const sphereGeom = new THREE.SphereGeometry(0.5, 16, 16);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, opacity: 0.3, transparent: true });

    for (let i = 0; i < segments; i++) {
        const ratio = i / segments;
        const angle = ratio * twist;
        const y = (ratio - 0.5) * height;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;

        // Atoms
        const atom1 = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc }));
        atom1.position.set(x1, y, z1);
        dnaGroup.add(atom1);

        const atom2 = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc }));
        atom2.position.set(x2, y, z2);
        dnaGroup.add(atom2);

        // Connection
        const points = [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeom, lineMat);
        dnaGroup.add(line);

        // Add interactive hubs at specific points
        if (i === 20) createHub(x1, y, z1, 'experience', 'STATION_01');
        if (i === 50) createHub(x1, y, z1, 'skills', 'TOOLKIT_ROOT');
        if (i === 80) createHub(x1, y, z1, 'projects', 'SYNTHESIS_CORE');
    }
}

function createHub(x, y, z, type, label) {
    const hubGeom = new THREE.IcosahedronGeometry(3, 1);
    const hubMat = new THREE.MeshPhongMaterial({ 
        color: 0x00ffcc, 
        emissive: 0x00ffcc, 
        wireframe: true 
    });
    const hub = new THREE.Mesh(hubGeom, hubMat);
    hub.position.set(x, y, z);
    hub.userData = { type, label };
    dnaGroup.add(hub);
    interactiveNodes.push(hub);
}

function addLights() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00ffcc, 2, 100);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick() {
    if (!isUniverseActive) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveNodes);

    if (intersects.length > 0) {
        const node = intersects[0].object;
        focusNode(node.userData.type, node.position);
    }
}

function focusNode(type, position) {
    const targetPos = position ? position.clone().add(new THREE.Vector3(0, 0, 15)) : new THREE.Vector3(0, 0, 20);
    
    gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
            showOverlay(`${type}-overlay`);
        }
    });
}

function showOverlay(id) {
    document.getElementById(id).classList.remove('hidden');
    gsap.fromTo(`#${id}`, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 });
}

function closeOverlay(id) {
    gsap.to(`#${id}`, { 
        opacity: 0, 
        scale: 0.8, 
        duration: 0.5, 
        onComplete: () => {
            document.getElementById(id).classList.add('hidden');
            // Reset camera position
            gsap.to(camera.position, { z: 100, y: 50, x: 0, duration: 2, ease: "power2.inOut" });
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (dnaGroup) {
        dnaGroup.rotation.y += 0.005;
        if (!isUniverseActive) {
            dnaGroup.rotation.z += 0.001;
        }
    }
    renderer.render(scene, camera);
}

// UI Controllers
document.getElementById('enter-btn').addEventListener('click', () => {
    isUniverseActive = true;
    gsap.to('#intro-screen', { opacity: 0, duration: 1.5, onComplete: () => {
        document.getElementById('intro-screen').style.display = 'none';
        document.querySelectorAll('.ui-element').forEach(el => el.classList.remove('hidden'));
    }});
    
    // Initial fly-in
    gsap.to(camera.position, { z: 80, y: 0, duration: 3, ease: "power3.out" });
});

window.focusNode = (type) => {
    const node = interactiveNodes.find(n => n.userData.type === type);
    if (node) {
        const worldPos = new THREE.Vector3();
        node.getWorldPosition(worldPos);
        focusNode(type, worldPos);
    }
};

window.closeOverlay = closeOverlay;

init();
