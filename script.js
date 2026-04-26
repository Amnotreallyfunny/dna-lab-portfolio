let scene, camera, renderer, dnaGroup, raycaster, mouse;
let interactiveNodes = [];
let isUniverseActive = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00050a);
    scene.fog = new THREE.Fog(0x00050a, 10, 300);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createLab();
    createDNA();
    createStations();
    addLights();

    // Starting camera position (outside looking in or at entrance)
    camera.position.set(0, 20, 100);
    camera.lookAt(0, 10, 0);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createLab() {
    const floorSize = 200;
    
    // Floor with grid
    const floorGeom = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x101a20, 
        metalness: 0.8, 
        roughness: 0.2 
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(floorSize, 20, 0x00ffcc, 0x051015);
    grid.position.y = 0.05;
    scene.add(grid);

    // Walls
    const wallHeight = 60;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x050a10, metalness: 0.5, roughness: 0.5 });
    
    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(floorSize, wallHeight), wallMat);
    backWall.position.z = -floorSize/2;
    backWall.position.y = wallHeight/2;
    scene.add(backWall);

    // Side walls
    const sideWallGeom = new THREE.PlaneGeometry(floorSize, wallHeight);
    const leftWall = new THREE.Mesh(sideWallGeom, wallMat);
    leftWall.position.x = -floorSize/2;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.y = wallHeight/2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeom, wallMat);
    rightWall.position.x = floorSize/2;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.y = wallHeight/2;
    scene.add(rightWall);

    // Neon trim on walls
    const neonGeom = new THREE.BoxGeometry(floorSize, 0.5, 0.5);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    
    const trim = new THREE.Mesh(neonGeom, neonMat);
    trim.position.set(0, wallHeight - 2, -floorSize/2 + 0.5);
    scene.add(trim);
}

function createDNA() {
    const segments = 60;
    const radius = 5;
    const height = 40;
    const twist = Math.PI * 4;

    const sphereGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, opacity: 0.4, transparent: true });

    // Pedestal for DNA
    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 10, 2, 32),
        new THREE.MeshStandardMaterial({ color: 0x202020, metalness: 0.9 })
    );
    pedestal.position.y = 1;
    scene.add(pedestal);

    for (let i = 0; i < segments; i++) {
        const ratio = i / segments;
        const angle = ratio * twist;
        const y = ratio * height + 2;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;

        const atom1 = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.5 }));
        atom1.position.set(x1, y, z1);
        dnaGroup.add(atom1);

        const atom2 = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.5 }));
        atom2.position.set(x2, y, z2);
        dnaGroup.add(atom2);

        const points = [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeom, lineMat);
        dnaGroup.add(line);
    }
    dnaGroup.position.y = 5;
}

function createStations() {
    // Station 1: Experience (Left)
    createStationMesh(-40, 0, -30, 'experience', 'STATION_EXP');
    // Station 2: Skills (Right)
    createStationMesh(40, 0, -30, 'skills', 'STATION_SKL');
    // Station 3: Projects (Center-Back)
    createStationMesh(0, 0, -60, 'projects', 'STATION_PRJ');
}

function createStationMesh(x, y, z, type, label) {
    const group = new THREE.Group();
    
    // Console Base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(10, 15, 5),
        new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.8 })
    );
    base.position.y = 7.5;
    group.add(base);

    // Screen
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 6),
        new THREE.MeshPhongMaterial({ 
            color: 0x001010, 
            emissive: 0x00ffcc, 
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide
        })
    );
    screen.position.set(0, 11, 2.6);
    screen.rotation.x = -0.2;
    group.add(screen);

    // Interactive Hub (Invisible click area or glowing element)
    const hubGeom = new THREE.BoxGeometry(12, 16, 6);
    const hubMat = new THREE.MeshBasicMaterial({ visible: false });
    const hub = new THREE.Mesh(hubGeom, hubMat);
    hub.position.y = 8;
    hub.userData = { type, label, camPos: new THREE.Vector3(x, 15, z + 20) };
    group.add(hub);
    interactiveNodes.push(hub);

    group.position.set(x, y, z);
    scene.add(group);

    // Add a point light at each station
    const light = new THREE.PointLight(0x00ffcc, 0.5, 30);
    light.position.set(x, 15, z + 5);
    scene.add(light);
}

function addLights() {
    const ambientLight = new THREE.AmbientLight(0x101010);
    scene.add(ambientLight);

    // Spotlight on DNA
    const spotLight = new THREE.SpotLight(0x00ffcc, 2);
    spotLight.position.set(0, 50, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 100;
    spotLight.castShadow = true;
    scene.add(spotLight);
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
        focusStation(node.userData.type, node.userData.camPos, node.getWorldPosition(new THREE.Vector3()));
    }
}

function focusStation(type, camPos, targetPos) {
    gsap.to(camera.position, {
        x: camPos.x,
        y: camPos.y,
        z: camPos.z,
        duration: 1.5,
        ease: "power2.inOut"
    });

    const lookTarget = targetPos.clone().add(new THREE.Vector3(0, 5, 0));
    
    // We can't easily gsap lookAt, so we use a dummy object
    const dummy = new THREE.Object3D();
    dummy.position.copy(camera.position);
    dummy.lookAt(lookTarget);
    const targetQuaternion = dummy.quaternion.clone();

    gsap.to(camera.quaternion, {
        x: targetQuaternion.x,
        y: targetQuaternion.y,
        z: targetQuaternion.z,
        w: targetQuaternion.w,
        duration: 1.5,
        onComplete: () => {
            showOverlay(`${type}-overlay`);
        }
    });
}

function showOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.classList.remove('hidden');
    gsap.fromTo(`#${id}`, { opacity: 0, x: "-50%", y: "-40%" }, { opacity: 1, x: "-50%", y: "-50%", duration: 0.5 });
}

function closeOverlay(id) {
    gsap.to(`#${id}`, { 
        opacity: 0, 
        y: "-40%", 
        duration: 0.4, 
        onComplete: () => {
            document.getElementById(id).classList.add('hidden');
            // Return to central lab view
            gsap.to(camera.position, { x: 0, y: 25, z: 70, duration: 1.5, ease: "power2.inOut" });
            gsap.to(camera.rotation, { x: -0.2, y: 0, z: 0, duration: 1.5 });
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (dnaGroup) {
        dnaGroup.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}

// UI Controllers
document.getElementById('enter-btn').addEventListener('click', () => {
    isUniverseActive = true;
    gsap.to('#intro-screen', { opacity: 0, duration: 1, onComplete: () => {
        document.getElementById('intro-screen').style.display = 'none';
        document.querySelectorAll('.ui-element').forEach(el => el.classList.remove('hidden'));
    }});
    
    // Dramatic fly-in into the lab
    gsap.to(camera.position, { x: 0, y: 25, z: 70, duration: 2.5, ease: "power3.out" });
    gsap.to(camera.rotation, { x: -0.2, duration: 2.5 });
});

window.focusNode = (type) => {
    const node = interactiveNodes.find(n => n.userData.type === type);
    if (node) {
        const worldPos = node.getWorldPosition(new THREE.Vector3());
        focusStation(type, node.userData.camPos, worldPos);
    }
};

window.closeOverlay = closeOverlay;

init();
