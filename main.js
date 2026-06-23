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
    showToast('toast-vcard');
};

/* ── Share ── */
window.shareCard = async function() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: window.__t('share-title') || '梁超 · 个人名片',
                text: window.__t('share-text') || '这是梁超的数字名片，NFC触碰即达！',
                url: window.location.href,
            });
        } catch (e) { /* user cancelled */ }
    } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('toast-link');
    }
};

/* ── Copy to Clipboard ── */
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('toast-copied');
    } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('toast-copied');
    }
};

/* ── Toast ── */
function showToast(msg) {
    var toast = document.getElementById('toast');
    var text = document.getElementById('toastText');
    // Support i18n key lookup
    if (typeof window.__t === 'function' && window.__t(msg)) {
        text.textContent = window.__t(msg);
    } else {
        text.textContent = msg;
    }
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2000);
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

/* ── WeChat Link: copy ID + jump to WeChat ── */
(function initWeChatLink() {
    const wechatLink = document.getElementById('wechatLink');
    if (!wechatLink) return;

    wechatLink.addEventListener('click', function(e) {
        e.preventDefault();
        const wechatId = 'Life_Copy';

        // 1. Copy WeChat ID to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(wechatId).then(function() {
                showToast('toast-wechat-copied');
            }).catch(function() {
                fallbackCopy(wechatId);
            });
        } else {
            fallbackCopy(wechatId);
        }

        // 2. Try to open WeChat app (after a short delay to allow copy)
        setTimeout(function() {
            window.location.href = 'weixin://';
        }, 500);
    });

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('toast-wechat-copied');
        } catch (err) {
            showToast('toast-wechat-fail');
        }
        document.body.removeChild(ta);
    }

    function showToast(msg) {
        var toast = document.getElementById('toast');
        var toastText = document.getElementById('toastText');
        if (toast && toastText) {
            toastText.textContent = (typeof window.__t === 'function' && window.__t(msg)) || msg;
            toast.classList.add('show');
            setTimeout(function() {
                toast.classList.remove('show');
            }, 2000);
        }
    }
})();

/* ═══════════════════════════════════════════════
   Meteor / Shooting Star Particle Effects
   - Background: periodic meteors streak across the sky
   - PC: mouse trail spawns meteor sparks with glow
   - Mobile: touch spawns expanding ring + meteor burst
   Real meteor colors: white-yellow core → orange → red trail
   ═══════════════════════════════════════════════ */
(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    /* ── Realistic meteor color palette ── */
    const METEOR_HEAD = ['#ffffff', '#fff8e1', '#ffe0b2'];  // hot white/yellow core
    const METEOR_BODY = ['#ffab40', '#ff6d00', '#ff3d00'];   // orange body
    const METEOR_TAIL = ['#ff1744', '#d50000', '#880e4f'];   // red/deep tail
    const METEOR_ION  = ['#00e5ff', '#00b0ff', '#40c4ff'];   // blue ionization trail

    let meteors = [];
    let sparkParticles = [];
    let rings = [];
    let mouse = { x: -1000, y: -1000, px: -1000, py: -1000 };
    let W, H;

    /* ── Resize ── */
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    /* ── Meteor class (background streaking meteors) ── */
    class Meteor {
        constructor() {
            // Random start position from top/sides
            const side = Math.random();
            if (side < 0.4) {
                // From top-left
                this.x = Math.random() * W * 0.5;
                this.y = -20;
                this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
            } else if (side < 0.7) {
                // From top-right
                this.x = W * 0.5 + Math.random() * W * 0.5;
                this.y = -20;
                this.angle = Math.PI * 0.75 + (Math.random() - 0.5) * 0.5;
            } else {
                // From left side
                this.x = -20;
                this.y = Math.random() * H * 0.4;
                this.angle = Math.PI / 6 + Math.random() * 0.4;
            }

            this.speed = 4 + Math.random() * 6;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.tailLength = 60 + Math.random() * 100;
            this.size = 1.5 + Math.random() * 2;
            this.life = 1.0;
            this.fadeSpeed = 0.003 + Math.random() * 0.005;
            this.brightness = 0.7 + Math.random() * 0.3;

            // Slight color variation
            this.headColor = METEOR_HEAD[Math.floor(Math.random() * METEOR_HEAD.length)];
            this.bodyColor = METEOR_BODY[Math.floor(Math.random() * METEOR_BODY.length)];
            this.tailColor = METEOR_TAIL[Math.floor(Math.random() * METEOR_TAIL.length)];
            this.ionColor = METEOR_ION[Math.floor(Math.random() * METEOR_ION.length)];
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.fadeSpeed;
            // Slight gravity effect
            this.vy += 0.01;
        }

        draw() {
            if (this.life <= 0) return;
            const alpha = this.life * this.brightness;

            // Calculate trail direction (opposite to velocity)
            const trailX = -this.vx;
            const trailY = -this.vy;
            const len = Math.sqrt(trailX * trailX + trailY * trailY);
            const nx = trailX / len;
            const ny = trailY / len;

            // Draw ionization trail (blue, wide, faint)
            ctx.globalAlpha = alpha * 0.08;
            const ionGrad = ctx.createLinearGradient(
                this.x, this.y,
                this.x + nx * this.tailLength * 1.3, this.y + ny * this.tailLength * 1.3
            );
            ionGrad.addColorStop(0, this.ionColor);
            ionGrad.addColorStop(1, 'transparent');
            ctx.strokeStyle = ionGrad;
            ctx.lineWidth = this.size * 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + nx * this.tailLength * 1.3, this.y + ny * this.tailLength * 1.3);
            ctx.stroke();

            // Draw main tail (red → orange gradient)
            ctx.globalAlpha = alpha * 0.35;
            const tailGrad = ctx.createLinearGradient(
                this.x, this.y,
                this.x + nx * this.tailLength, this.y + ny * this.tailLength
            );
            tailGrad.addColorStop(0, this.bodyColor);
            tailGrad.addColorStop(0.5, this.tailColor);
            tailGrad.addColorStop(1, 'transparent');
            ctx.strokeStyle = tailGrad;
            ctx.lineWidth = this.size * 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + nx * this.tailLength, this.y + ny * this.tailLength);
            ctx.stroke();

            // Draw hot core (bright white-yellow)
            ctx.globalAlpha = alpha * 0.9;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = this.headColor;
            ctx.fill();

            // Head glow
            ctx.globalAlpha = alpha * 0.25;
            const headGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
            headGlow.addColorStop(0, this.headColor);
            headGlow.addColorStop(0.5, this.bodyColor);
            headGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = headGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }

        isOffScreen() {
            return this.x < -200 || this.x > W + 200 || this.y > H + 200 || this.life <= 0;
        }
    }

    /* ── Spark class (small glowing embers from interaction) ── */
    class Spark {
        constructor(x, y, vx, vy, color, size, life) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.color = color;
            this.size = size;
            this.life = life;
            this.maxLife = life;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.96;
            this.vy *= 0.96;
            this.vy += 0.02; // gravity
            this.life--;
        }
        draw() {
            const alpha = this.life / this.maxLife;
            // Core
            ctx.globalAlpha = alpha * 0.9;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            // Glow
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha * 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    /* ── Ring class (touch expanding shockwave) ── */
    class Ring {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.radius = 0;
            this.maxRadius = 60 + Math.random() * 50;
            this.life = 35;
            this.maxLife = 35;
            this.color = color;
        }
        update() {
            this.radius += (this.maxRadius - this.radius) * 0.1;
            this.life--;
        }
        draw() {
            const alpha = this.life / this.maxLife;
            ctx.globalAlpha = alpha * 0.4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Inner glow
            ctx.globalAlpha = alpha * 0.12;
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    /* ── Spawn background meteors periodically ── */
    let meteorTimer = 0;
    function spawnRandomMeteor() {
        meteors.push(new Meteor());
    }

    /* ── Spawn mouse trail sparks (PC) ── */
    function spawnMouseSparks(x, y, px, py) {
        const dx = x - px;
        const dy = y - py;
        const speed = Math.sqrt(dx * dx + dy * dy);
        const count = Math.min(Math.floor(speed / 4), 5);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const sx = px + dx * t + (Math.random() - 0.5) * 6;
            const sy = py + dy * t + (Math.random() - 0.5) * 6;
            const colorPool = [...METEOR_HEAD, ...METEOR_BODY, ...METEOR_ION];
            const color = colorPool[Math.floor(Math.random() * colorPool.length)];
            sparkParticles.push(new Spark(
                sx, sy,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                color,
                2 + Math.random() * 2,
                20 + Math.floor(Math.random() * 20)
            ));
        }
    }

    /* ── Spawn touch burst (Mobile) ── */
    function spawnTouchBurst(x, y) {
        // Expanding rings
        const ringColor = METEOR_ION[Math.floor(Math.random() * METEOR_ION.length)];
        rings.push(new Ring(x, y, ringColor));
        rings.push(new Ring(x, y, ringColor));

        // Particle burst in meteor colors
        const count = 25 + Math.floor(Math.random() * 15);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const spd = 1 + Math.random() * 4;
            // Most particles are warm colors (like meteor), some blue
            const colorPool = [...METEOR_HEAD, ...METEOR_BODY, ...METEOR_TAIL, ...METEOR_ION];
            const color = colorPool[Math.floor(Math.random() * colorPool.length)];
            sparkParticles.push(new Spark(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                color,
                1 + Math.random() * 2.5,
                25 + Math.floor(Math.random() * 25)
            ));
        }
    }

    /* ── Main animation loop ── */
    function animate() {
        ctx.clearRect(0, 0, W, H);

        // Spawn random background meteors
        meteorTimer++;
        if (meteorTimer > 90 + Math.random() * 150) { // every ~1.5-4 seconds
            spawnRandomMeteor();
            meteorTimer = 0;
        }

        // Update & draw meteors
        meteors = meteors.filter(m => !m.isOffScreen());
        for (const m of meteors) {
            m.update();
            m.draw();
        }

        // Update & draw rings
        rings = rings.filter(r => r.life > 0);
        for (const r of rings) {
            r.update();
            r.draw();
        }

        // Update & draw sparks
        sparkParticles = sparkParticles.filter(s => s.life > 0);
        for (const s of sparkParticles) {
            s.update();
            s.draw();
        }

        // PC: mouse glow (warm meteor core)
        if (!isMobile && mouse.x > 0) {
            ctx.globalAlpha = 0.12;
            const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 25);
            grad.addColorStop(0, '#ffe0b2');
            grad.addColorStop(0.4, '#ff6d00');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        requestAnimationFrame(animate);
    }
    animate();

    /* ── PC: Mouse events ── */
    if (!isMobile) {
        document.addEventListener('mousemove', function (e) {
            mouse.px = mouse.x;
            mouse.py = mouse.y;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            spawnMouseSparks(e.clientX, e.clientY, mouse.px, mouse.py);
        });
    }

    /* ── Mobile: Touch events ── */
    if (isMobile) {
        document.addEventListener('touchstart', function (e) {
            const touch = e.touches[0];
            spawnTouchBurst(touch.clientX, touch.clientY);
            hapticFeedback('tap');
        }, { passive: true });

        document.addEventListener('touchmove', function (e) {
            const touch = e.touches[0];
            const colorPool = [...METEOR_BODY, ...METEOR_TAIL];
            const color = colorPool[Math.floor(Math.random() * colorPool.length)];
            sparkParticles.push(new Spark(
                touch.clientX + (Math.random() - 0.5) * 8,
                touch.clientY + (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 1.2,
                color,
                1 + Math.random(),
                15 + Math.floor(Math.random() * 12)
            ));
        }, { passive: true });
    }
})();


/* ═══════════════════════════════════════════════
   Haptic / Vibration Feedback (Mobile)
   ═══════════════════════════════════════════════ */
function hapticFeedback(type) {
    if (!navigator.vibrate) return;
    switch (type) {
        case 'tap':     navigator.vibrate(8);   break;   // button / tap
        case 'scroll':  navigator.vibrate(4);   break;   // scroll (very subtle)
        case 'success': navigator.vibrate([10, 50, 10]); break; // success pattern
        default:        navigator.vibrate(6);   break;
    }
}

/* ── Attach haptics to all interactive elements ── */
(function initHaptics() {
    // Buttons / clickable elements
    document.addEventListener('click', function (e) {
        const target = e.target.closest('button, a, .contact-item, .social-item, .wechat-copy-btn, .wechat-btn-open, .wechat-btn-close');
        if (target) hapticFeedback('tap');
    });

    // Scroll haptic (throttled)
    let lastScrollHaptic = 0;
    const overlay = document.querySelector('.ui-overlay');
    if (overlay) {
        overlay.addEventListener('scroll', function () {
            const now = Date.now();
            if (now - lastScrollHaptic > 300) {
                hapticFeedback('scroll');
                lastScrollHaptic = now;
            }
        }, { passive: true });
    }
})();


/* ═══════════════════════════════════════════════
   i18n — Chinese / English Language Switch
   ═══════════════════════════════════════════════ */
(function initI18n() {
    var translations = {
        zh: {
            'telemetry-label-sat': '卫星',
            'telemetry-label-alt': '高度',
            'telemetry-label-status': '状态',
            'telemetry-value-status': '运行中',
            'subtitle': '遥感 · 连接',
            'section-contact': '通信频道',
            'label-tel': '电话 TEL',
            'label-email': '邮箱 EMAIL',
            'label-wechat': '微信 WECHAT',
            'section-data': '数据链路',
            'social-douyin': '抖音',
            'social-netease': '网易云音乐',
            'btn-save': '保存联系人',
            'btn-share': '分享名片',
            'nfc-text': 'NFC · 触碰即达',
            'wechat-title': '添加微信好友',
            'wechat-id-label': '微信ID',
            'wechat-copy': '复制',
            'wechat-open': '打开微信',
            'wechat-close': '关闭',
            'wechat-hint': '长按识别二维码 或 复制ID搜索添加',
            'toast-copied': '已复制',
            'toast-vcard': '联系人文件已下载',
            'toast-link': '链接已复制到剪贴板',
            'toast-wechat-copied': '微信号已复制',
            'toast-wechat-fail': '请长按手动复制',
            'share-title': '梁超 · 个人名片',
            'share-text': '这是梁超的数字名片，NFC触碰即达！',
            'lang-switch': 'EN',
        },
        en: {
            'telemetry-label-sat': 'SAT',
            'telemetry-label-alt': 'ALT',
            'telemetry-label-status': 'STATUS',
            'telemetry-value-status': 'ACTIVE',
            'subtitle': 'REMOTE SENSING · CONNECT',
            'section-contact': 'CONTACT',
            'label-tel': 'PHONE',
            'label-email': 'EMAIL',
            'label-wechat': 'WECHAT',
            'section-data': 'DATA LINKS',
            'social-douyin': 'TikTok',
            'social-netease': 'NetEase Music',
            'btn-save': 'Save Contact',
            'btn-share': 'Share Card',
            'nfc-text': 'NFC · TAP TO CONNECT',
            'wechat-title': 'Add WeChat Friend',
            'wechat-id-label': 'WeChat ID',
            'wechat-copy': 'Copy',
            'wechat-open': 'Open WeChat',
            'wechat-close': 'Close',
            'wechat-hint': 'Long-press QR code or copy ID to search',
            'toast-copied': 'Copied',
            'toast-vcard': 'Contact file downloaded',
            'toast-link': 'Link copied to clipboard',
            'toast-wechat-copied': 'WeChat ID copied',
            'toast-wechat-fail': 'Please long-press to copy manually',
            'share-title': 'LeongBro · Digital Card',
            'share-text': 'LeongBro\'s digital card — tap NFC to connect!',
            'lang-switch': '中',
        }
    };

    var currentLang = localStorage.getItem('lang') || 'zh';

    function applyLang(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        var t = translations[lang];

        // Update data-i18n elements (text content)
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });

        // Update lang toggle button
        var toggleBtn = document.getElementById('langToggle');
        if (toggleBtn) toggleBtn.textContent = t['lang-switch'];

        // Update html lang attribute
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    }

    // Expose translation lookup & switchLang globally
    window.__t = function (key) {
        return translations[currentLang][key] || key;
    };

    window.switchLang = function () {
        var newLang = currentLang === 'zh' ? 'en' : 'zh';
        applyLang(newLang);
        hapticFeedback('tap');
    };

    // Apply saved language on load
    applyLang(currentLang);
})();
