let scene, camera, renderer, composer, dnaGroup, raycaster, mouse;
let interactiveNodes = [];
let isUniverseActive = false;
let clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020406);
    scene.fog = new THREE.FogExp2(0x020406, 0.005);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Post Processing
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createAtmosphere();
    createLab();
    createDNA();
    createStations();
    addLights();

    camera.position.set(0, 30, 150);
    camera.lookAt(0, 20, 0);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createAtmosphere() {
    // Dust Particles
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 2000; i++) {
        vertices.push(
            Math.random() * 400 - 200,
            Math.random() * 100,
            Math.random() * 400 - 200
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ size: 0.1, color: 0x00ffcc, transparent: true, opacity: 0.5 });
    const dust = new THREE.Points(geometry, material);
    scene.add(dust);
}

function createLab() {
    const floorSize = 300;
    
    // Polished Floor
    const floorGeom = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x0a0c10, 
        metalness: 0.9, 
        roughness: 0.1,
        emissive: 0x001111,
        emissiveIntensity: 0.1
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(floorSize, 40, 0x00ffcc, 0x020508);
    grid.position.y = 0.1;
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // Sci-fi Pillars
    const pillarGeom = new THREE.CylinderGeometry(2, 3, 60, 6);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1, roughness: 0.2 });
    
    const pillarPositions = [
        [-80, -80], [80, -80], [-80, 80], [80, 80]
    ];

    pillarPositions.forEach(pos => {
        const pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.set(pos[0], 30, pos[1]);
        scene.add(pillar);
        
        // Pillar neon strip
        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 60, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x00ffcc })
        );
        strip.position.set(pos[0], 30, pos[1] + 2.8);
        scene.add(strip);
    });
}

function createDNA() {
    const segments = 80;
    const radius = 6;
    const height = 50;
    const twist = Math.PI * 6;

    const sphereGeom = new THREE.SphereGeometry(0.4, 16, 16);
    
    // Core structure
    for (let i = 0; i < segments; i++) {
        const ratio = i / segments;
        const angle = ratio * twist;
        const y = ratio * height + 5;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;

        const atom1 = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1 }));
        atom1.position.set(x1, y, z1);
        dnaGroup.add(atom1);

        const atom2 = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1 }));
        atom2.position.set(x2, y, z2);
        dnaGroup.add(atom2);

        const points = [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.3 }));
        dnaGroup.add(line);
    }

    // Pedestal Base
    const pedestalGroup = new THREE.Group();
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(12, 15, 2, 32), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 1 }));
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 1, 32), new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc }));
    base2.position.y = 1.5;
    pedestalGroup.add(base1, base2);
    scene.add(pedestalGroup);
}

function createStations() {
    createHighTechStation(-50, 0, -20, 'experience', 'STATION_ALPHA');
    createHighTechStation(50, 0, -20, 'skills', 'STATION_BETA');
    createHighTechStation(0, 0, -70, 'projects', 'STATION_GAMMA');
}

function createHighTechStation(x, y, z, type, label) {
    const station = new THREE.Group();
    
    // Main Body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(15, 20, 8),
        new THREE.MeshStandardMaterial({ color: 0x080808, metalness: 1, roughness: 0.1 })
    );
    body.position.y = 10;
    station.add(body);

    // Decorative neon panels
    const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1, emissive: 0x00ffcc, emissiveIntensity: 0.05 })
    );
    panel.position.set(0, 10, 4.1);
    station.add(panel);

    // Floating UI Screen
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 10),
        new THREE.MeshPhongMaterial({ 
            color: 0x000000, 
            emissive: 0x00ffcc, 
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        })
    );
    screen.position.set(0, 22, 5);
    screen.rotation.x = -0.1;
    station.add(screen);

    // Detection Area
    const hub = new THREE.Mesh(
        new THREE.BoxGeometry(18, 25, 12),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hub.position.y = 12;
    hub.userData = { type, label, camPos: new THREE.Vector3(x, 22, z + 30) };
    station.add(hub);
    interactiveNodes.push(hub);

    station.position.set(x, y, z);
    scene.add(station);

    // Station light
    const light = new THREE.PointLight(0x00ffcc, 1, 40);
    light.position.set(x, 25, z + 10);
    scene.add(light);
}

function addLights() {
    scene.add(new THREE.AmbientLight(0x050505));

    const spot = new THREE.SpotLight(0x00ffcc, 5);
    spot.position.set(0, 100, 0);
    spot.angle = Math.PI / 4;
    spot.penumbra = 1;
    spot.decay = 2;
    spot.distance = 200;
    spot.castShadow = true;
    scene.add(spot);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 50, 100);
    scene.add(rimLight);
}

function onClick() {
    if (!isUniverseActive) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveNodes);
    if (intersects.length > 0) {
        const node = intersects[0].object;
        focusStation(node.userData.type, node.userData.camPos, node.getWorldPosition(new THREE.Vector3()));
    }
}

function focusStation(type, camPos, targetPos) {
    gsap.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z, duration: 2, ease: "expo.inOut" });
    
    const dummy = new THREE.Object3D();
    dummy.position.copy(camPos);
    dummy.lookAt(targetPos.x, targetPos.y + 10, targetPos.z);
    
    gsap.to(camera.quaternion, {
        x: dummy.quaternion.x, y: dummy.quaternion.y, z: dummy.quaternion.z, w: dummy.quaternion.w,
        duration: 2, ease: "expo.inOut",
        onComplete: () => { showOverlay(`${type}-overlay`); }
    });
}

function showOverlay(id) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    gsap.fromTo(el, { opacity: 0, scale: 0.9, y: "-45%" }, { opacity: 1, scale: 1, y: "-50%", duration: 0.6, ease: "back.out(1.7)" });
}

function closeOverlay(id) {
    gsap.to(`#${id}`, { 
        opacity: 0, scale: 0.9, duration: 0.4, 
        onComplete: () => {
            document.getElementById(id).classList.add('hidden');
            gsap.to(camera.position, { x: 0, y: 35, z: 100, duration: 2, ease: "expo.inOut" });
            gsap.to(camera.rotation, { x: -0.2, y: 0, z: 0, duration: 2 });
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    if (dnaGroup) {
        dnaGroup.rotation.y = time * 0.5;
        dnaGroup.position.y = Math.sin(time) * 2;
    }

    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
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
    gsap.to('#intro-screen', { opacity: 0, duration: 1.5, onComplete: () => {
        document.getElementById('intro-screen').style.display = 'none';
        document.querySelectorAll('.ui-element').forEach(el => el.classList.remove('hidden'));
    }});
    gsap.to(camera.position, { x: 0, y: 35, z: 100, duration: 3, ease: "power4.inOut" });
    gsap.to(camera.rotation, { x: -0.2, duration: 3 });
});

window.focusNode = (type) => {
    const node = interactiveNodes.find(n => n.userData.type === type);
    if (node) focusStation(type, node.userData.camPos, node.getWorldPosition(new THREE.Vector3()));
};

window.closeOverlay = closeOverlay;
init();
