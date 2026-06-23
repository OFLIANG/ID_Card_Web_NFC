/* ══════════════════════════════════════════════
   遥感宇宙主题 · Three.js 3D Globe + Satellites
   ══════════════════════════════════════════════ */

/* Three.js loaded via <script> tag as global THREE */

/* ══════════════════════════════════════════════
   Part A: Three.js 3D Globe Scene
   ══════════════════════════════════════════════ */

const canvas = document.getElementById('globe-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.8, 4.5);
camera.lookAt(0, 0, 0);

/* ── Lighting ── */
const ambientLight = new THREE.AmbientLight(0x2a4a7a, 1.0);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

const rimLight = new THREE.PointLight(0x00e5ff, 2.0, 20);
rimLight.position.set(-3, 2, -3);
scene.add(rimLight);

/* ── Starfield ── */
function createStarfield() {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const r = 30 + Math.random() * 70;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        sizes[i] = Math.random() * 1.5 + 0.3;

        // Color variation: mostly white/blue with some warm stars
        const t = Math.random();
        if (t < 0.6) {
            colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
        } else if (t < 0.85) {
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
        } else {
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.6;
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    return new THREE.Points(geo, mat);
}

const starfield = createStarfield();
scene.add(starfield);

/* ── Wireframe Earth Globe ── */
function createGlobe() {
    const group = new THREE.Group();

    // Main wireframe sphere (longitude/latitude grid)
    const sphereGeo = new THREE.SphereGeometry(1.5, 48, 32);
    const wireframeMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
    });
    const wireframeSphere = new THREE.Mesh(sphereGeo, wireframeMat);
    group.add(wireframeSphere);

    // Glowing latitude/longitude rings (fewer, brighter)
    const ringMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.7,
    });

    // Latitude rings
    for (let lat = -60; lat <= 60; lat += 30) {
        const r = 1.505 * Math.cos(lat * Math.PI / 180);
        const y = 1.505 * Math.sin(lat * Math.PI / 180);
        const ringGeo = new THREE.BufferGeometry();
        const pts = [];
        for (let i = 0; i <= 64; i++) {
            const a = (i / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
        }
        ringGeo.setFromPoints(pts);
        group.add(new THREE.Line(ringGeo, ringMat));
    }

    // Longitude rings
    for (let lng = 0; lng < 180; lng += 30) {
        const ringGeo = new THREE.BufferGeometry();
        const pts = [];
        for (let i = 0; i <= 64; i++) {
            const a = (i / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(
                1.505 * Math.cos(a * 1) * Math.sin(lng * Math.PI / 180),
                1.505 * Math.sin(a * 1 - Math.PI / 2),
                1.505 * Math.cos(a * 1) * Math.cos(lng * Math.PI / 180)
            ));
        }
        ringGeo.setFromPoints(pts);
        group.add(new THREE.Line(ringGeo, ringMat));
    }

    // Inner glowing solid sphere
    const innerGeo = new THREE.SphereGeometry(1.48, 64, 64);
    const innerMat = new THREE.MeshPhongMaterial({
        color: 0x0a1a30,
        emissive: 0x002040,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.95,
        shininess: 30,
    });
    group.add(new THREE.Mesh(innerGeo, innerMat));

    // Atmosphere glow (Fresnel-like outer shell)
    const atmosphereGeo = new THREE.SphereGeometry(1.7, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0x00e5ff) },
            viewVector: { value: camera.position },
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.65 - dot(vNormal, vNormel), 2.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, intensity * 1.2);
            }
        `,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    group.add(atmosphere);

    return { group, atmosphere, wireframeSphere };
}

const globe = createGlobe();
scene.add(globe.group);

/* ── Data Points on Globe ── */
function createDataPoints() {
    const group = new THREE.Group();
    const points = [
        { lat: 39.9, lng: 116.4, color: 0xff6d00 },  // Beijing
        { lat: 31.2, lng: 121.5, color: 0x00e5ff },  // Shanghai
        { lat: 23.1, lng: 113.3, color: 0x00e5ff },  // Guangzhou
        { lat: 22.3, lng: 114.2, color: 0x00e5ff },  // Hong Kong
        { lat: 35.7, lng: 139.7, color: 0x3d5afe },  // Tokyo
        { lat: 37.6, lng: 127.0, color: 0x3d5afe },  // Seoul
        { lat: 1.3, lng: 103.8, color: 0x00e5ff },   // Singapore
    ];

    points.forEach(p => {
        const phi = (90 - p.lat) * (Math.PI / 180);
        const theta = (p.lng + 180) * (Math.PI / 180);
        const r = 1.52;

        const x = -r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);

        // Point dot
        const dotGeo = new THREE.SphereGeometry(0.02, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({
            color: p.color,
            transparent: true,
            opacity: 0.9,
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(x, y, z);
        group.add(dot);

        // Pulse ring
        const ringGeo = new THREE.RingGeometry(0.02, 0.04, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: p.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, y, z);
        ring.lookAt(0, 0, 0);
        ring.userData = { baseScale: 1, phase: Math.random() * Math.PI * 2 };
        group.add(ring);
    });

    return group;
}

const dataPoints = createDataPoints();
scene.add(dataPoints);

/* ── Satellite Orbits & Satellites ── */
function createSatelliteOrbit(radiusX, radiusY, tiltX, tiltZ, color, speed, satColor) {
    const group = new THREE.Group();

    // Orbit ring
    const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, 0, 2 * Math.PI, false, 0);
    const points = curve.getPoints(128);
    const orbitGeo = new THREE.BufferGeometry();
    const pts3D = points.map(p => new THREE.Vector3(p.x, 0, p.y));
    orbitGeo.setFromPoints(pts3D);
    const orbitMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.rotation.x = tiltX;
    orbitLine.rotation.z = tiltZ;
    group.add(orbitLine);

    // Dashed orbit (second pass for visual depth)
    const dashMat = new THREE.LineDashedMaterial({
        color: color,
        transparent: true,
        opacity: 0.1,
        dashSize: 0.3,
        gapSize: 0.2,
    });
    const dashOrbit = new THREE.Line(orbitGeo.clone(), dashMat);
    dashOrbit.computeLineDistances();
    dashOrbit.rotation.x = tiltX;
    dashOrbit.rotation.z = tiltZ;
    group.add(dashOrbit);

    // Satellite body
    const satGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.06, 0.04, 0.06);
    const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x8899aa,
        emissive: satColor,
        emissiveIntensity: 0.3,
        shininess: 80,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    satGroup.add(body);

    // Solar panel left
    const panelGeo = new THREE.BoxGeometry(0.12, 0.005, 0.06);
    const panelMat = new THREE.MeshPhongMaterial({
        color: 0x1a237e,
        emissive: 0x001040,
        emissiveIntensity: 0.2,
        shininess: 100,
    });
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.x = -0.12;
    satGroup.add(panelL);

    // Solar panel right
    const panelR = panelL.clone();
    panelR.position.x = 0.12;
    satGroup.add(panelR);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.05);
    const antennaMat = new THREE.MeshBasicMaterial({ color: satColor });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.y = 0.035;
    satGroup.add(antenna);

    // Glow
    const glowGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
        color: satColor,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
    });
    satGroup.add(new THREE.Mesh(glowGeo, glowMat));

    group.add(satGroup);

    return {
        group, satGroup, orbitLine,
        radiusX, radiusY, tiltX, tiltZ,
        speed, angle: Math.random() * Math.PI * 2
    };
}

const satellites = [
    createSatelliteOrbit(2.2, 1.8, 0.3, 0.1, 0x00e5ff, 0.003, 0x00e5ff),
    createSatelliteOrbit(2.6, 2.0, -0.2, 0.4, 0xff6d00, 0.002, 0xff6d00),
    createSatelliteOrbit(2.0, 1.9, 0.5, -0.3, 0x3d5afe, 0.004, 0x3d5afe),
];

satellites.forEach(s => scene.add(s.group));

/* ── Scan Line (sweeping across globe) ── */
function createScanLine() {
    const geo = new THREE.PlaneGeometry(4, 0.01);
    const mat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const line = new THREE.Mesh(geo, mat);
    return { mesh: line, direction: 1, speed: 0.008 };
}

const scanLine = createScanLine();
scanLine.mesh.position.y = 1.5;
scene.add(scanLine.mesh);

/* ── Connection Lines (satellite to earth) ── */
function createConnectionBeam(fromSat) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geo, mat);
    return { line, fromSat, active: true };
}

const connections = satellites.map(s => createConnectionBeam(s));
connections.forEach(c => scene.add(c.line));


/* ══════════════════════════════════════════════
   Part B: 2D Overlay Canvas (scan lines, HUD)
   ══════════════════════════════════════════════ */

const overlayCanvas = document.getElementById('overlay-canvas');
const ctx = overlayCanvas.getContext('2d');

function resizeOverlay() {
    overlayCanvas.width = window.innerWidth;
    overlayCanvas.height = window.innerHeight;
}
resizeOverlay();

/* ── HUD Corner Brackets ── */
function drawCorners(ctx, w, h) {
    const s = 30; // bracket size
    const o = 20; // offset from edge
    const lw = 1;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = lw;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(o, o + s); ctx.lineTo(o, o); ctx.lineTo(o + s, o);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - o - s, o); ctx.lineTo(w - o, o); ctx.lineTo(w - o, o + s);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(o, h - o - s); ctx.lineTo(o, h - o); ctx.lineTo(o + s, h - o);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - o - s, h - o); ctx.lineTo(w - o, h - o); ctx.lineTo(w - o, h - o - s);
    ctx.stroke();
}

/* ── Horizontal Scan Lines (subtle) ── */
function drawScanLines(ctx, w, h, time) {
    const lineSpacing = 4;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.015)';
    for (let y = 0; y < h; y += lineSpacing) {
        ctx.fillRect(0, y, w, 1);
    }

    // Sweeping bright scan line
    const sweepY = ((time * 0.05) % (h + 40)) - 20;
    const sweepGrad = ctx.createLinearGradient(0, sweepY - 20, 0, sweepY + 20);
    sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    sweepGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.04)');
    sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(0, sweepY - 20, w, 40);
}

/* ── Coordinate Grid (subtle background) ── */
function drawGrid(ctx, w, h) {
    const gridSize = 60;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.02)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}


/* ══════════════════════════════════════════════
   Part C: Animation Loop
   ══════════════════════════════════════════════ */

const clock = new THREE.Clock();
let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();
    frameCount++;

    // ── Globe rotation ──
    globe.group.rotation.y += 0.001;
    globe.wireframeSphere.rotation.y -= 0.0005;

    // ── Update atmosphere viewVector ──
    globe.atmosphere.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(
        camera.position, globe.group.position
    );

    // ── Starfield slow drift ──
    starfield.rotation.y += 0.00008;
    starfield.rotation.x += 0.00003;

    // ── Data point pulse ──
    dataPoints.children.forEach(child => {
        if (child.userData.phase !== undefined) {
            const s = 1 + 0.3 * Math.sin(time * 2 + child.userData.phase);
            child.scale.set(s, s, s);
            child.material.opacity = 0.3 + 0.4 * Math.sin(time * 2 + child.userData.phase);
        }
    });

    // ── Satellite orbits ──
    satellites.forEach(sat => {
        sat.angle += sat.speed;

        const x = sat.radiusX * Math.cos(sat.angle);
        const z = sat.radiusY * Math.sin(sat.angle);

        // Apply tilt
        const tiltedX = x * Math.cos(sat.tiltZ) - 0 * Math.sin(sat.tiltZ);
        const tiltedY = x * Math.sin(sat.tiltZ) * Math.cos(sat.tiltX) + z * Math.sin(sat.tiltX);
        const tiltedZ = -x * Math.sin(sat.tiltZ) * Math.sin(sat.tiltX) + z * Math.cos(sat.tiltX);

        sat.satGroup.position.set(tiltedX, tiltedY, tiltedZ);

        // Satellite always faces forward
        sat.satGroup.lookAt(0, 0, 0);
        sat.satGroup.rotateY(Math.PI);
    });

    // ── Connection beams ──
    connections.forEach(conn => {
        const satPos = conn.fromSat.satGroup.position;
        const positions = conn.line.geometry.attributes.position.array;

        // From satellite
        positions[0] = satPos.x;
        positions[1] = satPos.y;
        positions[2] = satPos.z;

        // To nearest point on globe surface
        const dir = satPos.clone().normalize();
        positions[3] = dir.x * 1.5;
        positions[4] = dir.y * 1.5;
        positions[5] = dir.z * 1.5;

        conn.line.geometry.attributes.position.needsUpdate = true;
        conn.line.material.opacity = 0.1 + 0.1 * Math.sin(time * 3);
    });

    // ── Scan line sweep ──
    scanLine.mesh.position.y += scanLine.speed * scanLine.direction;
    if (scanLine.mesh.position.y > 1.5) scanLine.direction = -1;
    if (scanLine.mesh.position.y < -1.5) scanLine.direction = 1;
    scanLine.mesh.material.opacity = 0.15 + 0.1 * Math.sin(time * 2);
    scanLine.mesh.lookAt(camera.position);

    // ── Camera subtle movement ──
    camera.position.x = Math.sin(time * 0.15) * 0.3;
    camera.position.y = 0.8 + Math.cos(time * 0.1) * 0.15;
    camera.lookAt(0, 0, 0);

    // ── Render ──
    renderer.render(scene, camera);

    // ── 2D Overlay ──
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    drawGrid(ctx, overlayCanvas.width, overlayCanvas.height);
    drawScanLines(ctx, overlayCanvas.width, overlayCanvas.height, time * 60);
    drawCorners(ctx, overlayCanvas.width, overlayCanvas.height);
}

animate();

/* ── Resize Handler ── */
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    resizeOverlay();
});


/* ══════════════════════════════════════════════
   Part D: Interactive Functions
   ══════════════════════════════════════════════ */

/* ── vCard Download ── */
window.downloadVCard = function() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:梁超;;;;
FN:梁超
TEL;TYPE=CELL:13153152494
EMAIL:13153152494@163.com
NOTE:NFC智能名片
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '梁超.vcf';
    a.click();
    URL.revokeObjectURL(url);
    showToast('联系人文件已下载');
};

/* ── Share ── */
window.shareCard = async function() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: '梁超 · 个人名片',
                text: '这是梁超的数字名片，NFC触碰即达！',
                url: window.location.href,
            });
        } catch (e) { /* user cancelled */ }
    } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('链接已复制到剪贴板');
    }
};

/* ── Copy to Clipboard ── */
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(`已复制: ${text}`);
    } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(`已复制: ${text}`);
    }
};

/* ── Toast ── */
function showToast(msg) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    text.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ── Telemetry Data Update ── */
function updateTelemetry() {
    const alt = 500 + Math.floor(Math.random() * 20);
    const el = document.getElementById('satAlt');
    if (el) el.textContent = alt + 'km';
}
setInterval(updateTelemetry, 5000);

/* ── WeChat Modal ── */
window.openWeChatModal = function() {
    const modal = document.getElementById('wechatModal');
    if (modal) modal.classList.add('show');
};

window.closeWeChatModal = function() {
    const modal = document.getElementById('wechatModal');
    if (modal) modal.classList.remove('show');
};

window.launchWeChat = function() {
    // Try to open WeChat app via deep link
    window.location.href = 'weixin://dl/add?qr=Life_Copy';
    // Fallback: close modal after a moment
    setTimeout(() => closeWeChatModal(), 2000);
};
