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
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.8, 4.5);
camera.lookAt(0, 0, 0);

/* ── Responsive camera: ensure globe always fully visible ── */
function updateCameraForScreen() {
    var aspect = window.innerWidth / window.innerHeight;
    var globeRadius = 2.0;
    var satMaxRadius = 3.4;  // max satellite orbit + margin
    var vFOV = 50;
    var fovRad = vFOV * Math.PI / 180;
    var tanHalf = Math.tan(fovRad / 2);

    // Ensure the full scene (globe + satellites) fits horizontally
    var minCamZ_width = satMaxRadius / (tanHalf * Math.max(aspect, 0.25));
    // Ensure the full scene fits vertically
    var minCamZ_height = satMaxRadius / tanHalf;
    var camZ = Math.max(minCamZ_width, minCamZ_height, 4.0);

    camera.fov = vFOV;
    camera.position.z = camZ;
    camera.updateProjectionMatrix();
}
updateCameraForScreen();

/* ── Lighting (soft, uniform) ── */
const ambientLight = new THREE.AmbientLight(0x2a4a7a, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.25);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

/* Rim light positioned over the Pacific Ocean (away from Asia) */
const rimLight = new THREE.PointLight(0x00e5ff, 0.8, 20);
rimLight.position.set(3, 2, 3);
scene.add(rimLight);

/* Secondary subtle glow on the Pacific limb to keep Asia clear */
const pacificGlow = new THREE.PointLight(0x00e5ff, 0.35, 15);
pacificGlow.position.set(4, -0.5, 2);
scene.add(pacificGlow);

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
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
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
    const sphereGeo = new THREE.SphereGeometry(2.0, 48, 32);
    const wireframeMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
    });
    const wireframeSphere = new THREE.Mesh(sphereGeo, wireframeMat);
    group.add(wireframeSphere);

    // Glowing latitude/longitude rings (fewer, brighter)
    const ringMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.35,
    });

    // Latitude rings
    for (let lat = -60; lat <= 60; lat += 30) {
        const r = 2.005 * Math.cos(lat * Math.PI / 180);
        const y = 2.005 * Math.sin(lat * Math.PI / 180);
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
                2.005 * Math.cos(a * 1) * Math.sin(lng * Math.PI / 180),
                2.005 * Math.sin(a * 1 - Math.PI / 2),
                2.005 * Math.cos(a * 1) * Math.cos(lng * Math.PI / 180)
            ));
        }
        ringGeo.setFromPoints(pts);
        group.add(new THREE.Line(ringGeo, ringMat));
    }

    // Inner glowing solid sphere
    const innerGeo = new THREE.SphereGeometry(1.98, 64, 64);
    const innerMat = new THREE.MeshPhongMaterial({
        color: 0x0a1a30,
        emissive: 0x002040,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
        shininess: 10,
    });
    group.add(new THREE.Mesh(innerGeo, innerMat));

    // Atmosphere glow (Fresnel-like outer shell)
    // Lower threshold (0.38) concentrates glow at the limb/edges away from
    // the globe center, keeping markers and borders clearly visible.
    const atmosphereGeo = new THREE.SphereGeometry(2.2, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0x00e5ff) },
            viewVector: { value: camera.position },
            glowIntensity: { value: 1.0 },
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.38 - dot(vNormal, vNormel), 2.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            uniform float glowIntensity;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity * glowIntensity;
                gl_FragColor = vec4(glow, intensity * glowIntensity * 0.5);
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
/* Rotate globe so Asia faces the camera (away from the Pacific glow) */
globe.group.rotation.y = Math.PI * 0.6;
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
        const r = 2.02;

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

/* ── Helper: lat/lng → 3D position on sphere ── */
function latLngToVector3(lat, lng, radius) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lng + 180) * (Math.PI / 180);
    var x = -(radius) * Math.sin(phi) * Math.cos(theta);
    var y = (radius) * Math.cos(phi);
    var z = (radius) * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
}

/* ── Country Borders + China Enhancement ── */
(function loadCountryBorders() {
    var borderGroup = new THREE.Group();
    var chinaBorderGroup = new THREE.Group();   // China national border (thick, bright)
    var chinaProvGroup = new THREE.Group();      // China provincial borders
    var BORDER_RADIUS = 2.008;
    var loaded = false;

    /* Default country border material (subtle) */
    var borderMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    /* China national border material (prominent, thicker via glow) */
    var chinaBorderMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    /* China national border glow layer (wider, fainter for glow halo) */
    var chinaBorderGlowMat = new THREE.LineBasicMaterial({
        color: 0x00b8d4,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    /* China provincial border material */
    var chinaProvMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    /* Helper: draw line loop from coordinate ring */
    function drawBorderRing(ring, material, radius, group) {
        var pts = [];
        var step = ring.length > 400 ? 2 : 1;
        for (var i = 0; i < ring.length; i += step) {
            var c = ring[i];
            pts.push(latLngToVector3(c[1], c[0], radius));
        }
        if (pts.length < 2) return;
        var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        group.add(new THREE.Line(lineGeo, material.clone()));
    }

    /* Helper: extract all rings from a TopoJSON feature */
    function extractRings(feature) {
        var geometries = feature.geometry.type === 'MultiPolygon'
            ? feature.geometry.coordinates
            : [feature.geometry.coordinates];
        var allRings = [];
        geometries.forEach(function(polygon) {
            polygon.forEach(function(ring) { allRings.push(ring); });
        });
        return allRings;
    }

    /* 1) Load world country borders (110m, low-res for general countries) */
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(function(res) { return res.json(); })
        .then(function(topo) {
            var geo = topojson.feature(topo, topo.objects.countries);
            geo.features.forEach(function(feature) {
                var id = feature.id || feature.properties && feature.properties.name;
                var isChina = (id === '156' || id === 'CHN' ||
                    (feature.properties && feature.properties.name === 'China'));

                var rings = extractRings(feature);
                rings.forEach(function(ring) {
                    if (isChina) {
                        /* China: draw on the enhanced border group (skip here) */
                        return;
                    }
                    drawBorderRing(ring, borderMat, BORDER_RADIUS, borderGroup);
                });
            });
            globe.group.add(borderGroup);
            loaded = true;
            console.log('[Globe] Country borders loaded (' + borderGroup.children.length + ' lines)');

            /* Load higher-res China borders separately */
            loadChinaEnhancedBorders();
        })
        .catch(function(err) {
            console.warn('[Globe] Failed to load country borders:', err);
        });

    /* 2) Load enhanced China borders (50m resolution + provincial) */
    function loadChinaEnhancedBorders() {
        /* Use the 50m countries dataset to get a cleaner China outline */
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
            .then(function(res) { return res.json(); })
            .then(function(topo) {
                var geo = topojson.feature(topo, topo.objects.countries);
                geo.features.forEach(function(feature) {
                    var id = feature.id || '';
                    var isChina = (id === '156');
                    if (!isChina) return;

                    var rings = extractRings(feature);

                    /* Draw China national border: main line (thick) */
                    rings.forEach(function(ring) {
                        drawBorderRing(ring, chinaBorderMat, BORDER_RADIUS, chinaBorderGroup);
                    });

                    /* Draw China national border: glow halo layer (slightly higher) */
                    rings.forEach(function(ring) {
                        drawBorderRing(ring, chinaBorderGlowMat, BORDER_RADIUS + 0.003, chinaBorderGroup);
                    });

                    globe.group.add(chinaBorderGroup);
                    console.log('[Globe] China national border loaded (' + chinaBorderGroup.children.length + ' lines)');
                });
            })
            .catch(function(err) {
                console.warn('[Globe] Failed to load China 50m border:', err);
                /* Fallback: highlight China from the 110m data */
                highlightChinaFallback();
            });

        /* Load China admin1 (provincial) boundaries from Natural Earth */
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@1/world/110m.json')
            .then(function(res) { return res.json(); })
            .then(function(topo) {
                /* Try admin1 subunits if available */
                if (topo.objects && topo.objects.states) {
                    var geo = topojson.feature(topo, topo.objects.states);
                    /* Filter: China admin1 codes are typically 156001..156999 */
                    geo.features.forEach(function(feature) {
                        var fId = String(feature.id || '');
                        /* China admin1 IDs in 110m-states are 156* prefix or 156001-156999 */
                        if (!fId.startsWith('156')) return;
                        var rings = extractRings(feature);
                        rings.forEach(function(ring) {
                            drawBorderRing(ring, chinaProvMat, BORDER_RADIUS + 0.001, chinaProvGroup);
                        });
                    });
                    if (chinaProvGroup.children.length > 0) {
                        globe.group.add(chinaProvGroup);
                        console.log('[Globe] China provincial borders loaded (' + chinaProvGroup.children.length + ' lines)');
                    }
                }
            })
            .catch(function(err) {
                console.warn('[Globe] Province borders load skipped:', err.message);
            });

        /* Also try the dedicated China admin GeoJSON for higher detail */
        fetch('https://raw.githubusercontent.com/nicholasmuni/geojson-china/master/china_provinces.geojson')
            .then(function(res) { return res.json(); })
            .then(function(geojson) {
                geojson.features.forEach(function(feature) {
                    var geometries = feature.geometry.type === 'MultiPolygon'
                        ? feature.geometry.coordinates
                        : [feature.geometry.coordinates];
                    geometries.forEach(function(polygon) {
                        polygon.forEach(function(ring) {
                            drawBorderRing(ring, chinaProvMat, BORDER_RADIUS + 0.001, chinaProvGroup);
                        });
                    });
                });
                /* Avoid duplicate additions */
                if (!globe.group.children.includes(chinaProvGroup) && chinaProvGroup.children.length > 0) {
                    globe.group.add(chinaProvGroup);
                    console.log('[Globe] China provinces (detailed) loaded (' + chinaProvGroup.children.length + ' lines)');
                }
            })
            .catch(function() {
                /* Silently ignore — the 110m states fallback may have already added provinces */
            });
    }

    function highlightChinaFallback() {
        /* If 50m load fails, try to enhance China from the already-loaded 110m borders */
        borderGroup.children.forEach(function(line) {
            if (line.material && line.material.opacity < 0.15) {
                /* We can't distinguish China from 110m alone, so leave defaults */
            }
        });
    }

    // Expose for animation loop (pulse on drag)
    globe._borderGroup = borderGroup;
    globe._chinaBorderGroup = chinaBorderGroup;
    globe._chinaProvGroup = chinaProvGroup;
    globe._borderLoaded = function() { return loaded; };
})();

/* ── Location Marker (current position) ── */
(function initLocationMarker() {
    var markerGroup = new THREE.Group();
    var MARKER_RADIUS = 2.03;
    var userLat = null, userLng = null;

    function placeMarker(lat, lng) {
        userLat = lat;
        userLng = lng;
        var pos = latLngToVector3(lat, lng, MARKER_RADIUS);

        // === Vertical beacon beam ===
        var beamHeight = 0.35;
        var beamGeo = new THREE.BufferGeometry();
        var beamTop = latLngToVector3(lat, lng, MARKER_RADIUS + beamHeight);
        beamGeo.setFromPoints([pos, beamTop]);
        var beamMat = new THREE.LineBasicMaterial({
            color: 0xff6d00,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
        });
        var beam = new THREE.Line(beamGeo, beamMat);
        markerGroup.add(beam);

        // === Star marker at position ===
        // Create a 4-pointed star shape using two triangles
        var starShape = new THREE.Shape();
        var outerR = 0.045, innerR = 0.015;
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
            var r = i % 2 === 0 ? outerR : innerR;
            var sx = Math.cos(angle) * r;
            var sy = Math.sin(angle) * r;
            if (i === 0) starShape.moveTo(sx, sy);
            else starShape.lineTo(sx, sy);
        }
        starShape.closePath();
        var starGeo = new THREE.ShapeGeometry(starShape);
        var starMat = new THREE.MeshBasicMaterial({
            color: 0xff6d00,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var star = new THREE.Mesh(starGeo, starMat);
        star.position.copy(pos);
        star.lookAt(new THREE.Vector3(0, 0, 0));
        star.userData.type = 'location-star';
        markerGroup.add(star);

        // === Pulsing ring 1 ===
        var ring1Geo = new THREE.RingGeometry(0.03, 0.05, 24);
        var ring1Mat = new THREE.MeshBasicMaterial({
            color: 0xff6d00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
        ring1.position.copy(pos);
        ring1.lookAt(new THREE.Vector3(0, 0, 0));
        ring1.userData = { type: 'pulse-ring', phase: 0, speed: 1.2 };
        markerGroup.add(ring1);

        // === Pulsing ring 2 (offset phase) ===
        var ring2Geo = new THREE.RingGeometry(0.03, 0.05, 24);
        var ring2Mat = new THREE.MeshBasicMaterial({
            color: 0xff6d00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        ring2.position.copy(pos);
        ring2.lookAt(new THREE.Vector3(0, 0, 0));
        ring2.userData = { type: 'pulse-ring', phase: Math.PI, speed: 1.2 };
        markerGroup.add(ring2);

        // === Glow point at base ===
        var glowGeo = new THREE.SphereGeometry(0.03, 12, 12);
        var glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6d00,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(pos);
        markerGroup.add(glow);

        globe.group.add(markerGroup);
        console.log('[Globe] Location marker placed at (' + lat.toFixed(2) + ', ' + lng.toFixed(2) + ')');
    }

    // Try geolocation, fallback to Beijing
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                placeMarker(pos.coords.latitude, pos.coords.longitude);
            },
            function(err) {
                console.warn('[Globe] Geolocation denied, using fallback (Beijing):', err.message);
                placeMarker(39.9, 116.4);
            },
            { timeout: 5000, maximumAge: 60000 }
        );
    } else {
        placeMarker(39.9, 116.4);
    }

    // Expose for animation
    globe._locationMarker = markerGroup;
})();

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

const satellites = [];

/* ── 7 Satellites — randomly and uniformly distributed around the globe ── */
var SATELLITE_COUNT = 7;

/* Pick a distinct color for each satellite */
var _satPalette = [0x00e5ff, 0x00b0ff, 0xff6d00, 0x3d5afe, 0x76ff03, 0xe040fb, 0xffab40];

for (var _si = 0; _si < SATELLITE_COUNT; _si++) {
    /* Uniformly distribute initial phase angle across full circle */
    var phaseAngle = (_si / SATELLITE_COUNT) * Math.PI * 2;

    /* Random orbital radius between 2.3 and 2.6 (Earth r=2.0 + altitude) */
    var orbitR = 2.3 + Math.random() * 0.3;

    /* Random tilt to give varied orbital planes */
    var tiltX = (Math.random() - 0.5) * 0.8;   // ~±23°
    var tiltZ = (Math.random() - 0.5) * 0.6;   // ~±17°

    var orbitRadiusX = orbitR;
    var orbitRadiusY = orbitR * (0.90 + Math.random() * 0.10); // slight eccentricity
    var speed = 0.001 + Math.random() * 0.003;

    var satColor = _satPalette[_si % _satPalette.length];
    var sat = createSatelliteOrbit(
        orbitRadiusX, orbitRadiusY, tiltX, tiltZ,
        satColor, speed, satColor
    );
    sat.orbitRadius = orbitR;
    sat.angle = phaseAngle; // uniform starting position
    satellites.push(sat);
}

satellites.forEach(function(s) { scene.add(s.group); });

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
scanLine.mesh.position.y = 2.0;
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
   Part C: Globe Drag Interaction
   ══════════════════════════════════════════════ */

var globeDragging = false;
var globeDragStart = { x: 0, y: 0 };
var globeVelocity = { x: 0, y: 0 };
var globeVelocityY = 0;  // Y-axis rotation velocity (left/right drag)
var globeVelocityX = 0;  // X-axis rotation velocity (up/down drag)
var globeUserInteracting = false;
var globeInteractable = false;  // true when cardOpacity === 0

function updateGlobeInteractable(opacity) {
    globeInteractable = (opacity === 0);
    var overlay = document.querySelector('.ui-overlay');
    if (overlay) {
        if (globeInteractable) {
            overlay.classList.add('globe-only');
            canvas.classList.add('globe-active');
            canvas.style.cursor = 'grab';
        } else {
            overlay.classList.remove('globe-only');
            canvas.classList.remove('globe-active');
            canvas.style.cursor = '';
        }
    }
}

/* ── Pointer events on canvas for globe drag ── */
canvas.addEventListener('pointerdown', function (e) {
    if (!globeInteractable) return;
    globeDragging = true;
    globeDragStart.x = e.clientX;
    globeDragStart.y = e.clientY;
    globeVelocity.x = 0;
    globeVelocity.y = 0;
    globeVelocityY = 0;
    globeVelocityX = 0;
    globeUserInteracting = true;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
}, { passive: false });

window.addEventListener('pointermove', function (e) {
    if (!globeDragging || !globeInteractable) return;
    var dx = e.clientX - globeDragStart.x;
    var dy = e.clientY - globeDragStart.y;
    // Rotate globe: horizontal drag → Y axis, vertical drag → X axis
    globe.group.rotation.y += dx * 0.005;
    globe.group.rotation.x += dy * 0.003;
    // Clamp X rotation to prevent flipping
    globe.group.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.group.rotation.x));
    // Track velocity for inertia
    globeVelocity.x = dx;
    globeVelocity.y = dy;
    globeVelocityY = dx * 0.005;
    globeVelocityX = dy * 0.003;
    globeDragStart.x = e.clientX;
    globeDragStart.y = e.clientY;
    // Atmosphere feedback: intensify glow during drag
    if (globe.atmosphere) {
        globe.atmosphere.material.uniforms.glowColor.value.setHex(0x00ffff);
    }
    e.preventDefault();
}, { passive: false });

window.addEventListener('pointerup', function () {
    if (!globeDragging) return;
    globeDragging = false;
    canvas.style.cursor = 'grab';
    // Apply inertia with decay
    setTimeout(function () { globeUserInteracting = false; }, 200);
    // Atmosphere glow smoothly returns to normal in animate loop
});

/* ── Touch interaction effects ── */
/* When globe is interactable, block ALL touch defaults on canvas to prevent
   page scrolling / bouncing while user drags the globe on mobile */
canvas.addEventListener('touchstart', function (e) {
    if (!globeInteractable) return;
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(10);
    // Block page scroll: only globe should respond to touch
    e.preventDefault();
    // 双重阻断：CSS class + inline style，确保页面完全不跟随滚动
    document.body.classList.add('globe-touch-active');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
    if (!globeInteractable) return;
    // Prevent page scroll entirely during globe drag
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', function () {
    // 立即移除全局阻断，不使用延迟
    document.body.classList.remove('globe-touch-active');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
});

canvas.addEventListener('touchcancel', function () {
    document.body.classList.remove('globe-touch-active');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
});

/* ══════════════════════════════════════════════
   Part D: Animation Loop
   ══════════════════════════════════════════════ */

const clock = new THREE.Clock();
let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();
    frameCount++;

    // ── Globe rotation (with inertia) ──
    if (!globeDragging && !globeUserInteracting) {
        // Apply inertia decay
        globeVelocityY *= 0.96;
        globeVelocityX *= 0.96;

        if (Math.abs(globeVelocityY) > 0.00001 || Math.abs(globeVelocityX) > 0.00001) {
            // Momentum from user drag
            globe.group.rotation.y += globeVelocityY;
            globe.group.rotation.x += globeVelocityX;
            globe.group.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.group.rotation.x));
        } else {
            // Auto-rotate when idle
            globe.group.rotation.y += 0.001;
            globeVelocityY = 0;
            globeVelocityX = 0;
        }
    }
    globe.wireframeSphere.rotation.y -= 0.0005;

    // ── Update atmosphere viewVector ──
    globe.atmosphere.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(
        camera.position, globe.group.position
    );

    // ── Atmosphere glow feedback during drag ──
    if (globe.atmosphere) {
        if (globeDragging) {
            var dragSpeed = Math.sqrt(globeVelocity.x * globeVelocity.x + globeVelocity.y * globeVelocity.y);
            var targetGlow = Math.min(3.0, 1.0 + dragSpeed * 0.005);
            globe.atmosphere.material.uniforms.glowIntensity.value +=
                (targetGlow - globe.atmosphere.material.uniforms.glowIntensity.value) * 0.15;
            globe.atmosphere.material.uniforms.glowColor.value.lerp(new THREE.Color(0x00ffff), 0.1);
        } else {
            globe.atmosphere.material.uniforms.glowIntensity.value +=
                (1.0 - globe.atmosphere.material.uniforms.glowIntensity.value) * 0.05;
            globe.atmosphere.material.uniforms.glowColor.value.lerp(new THREE.Color(0x00e5ff), 0.03);
        }
    }

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

    // ── Location marker pulse animation ──
    if (globe._locationMarker) {
        globe._locationMarker.children.forEach(function(child) {
            if (child.userData && child.userData.type === 'pulse-ring') {
                var t = (time * child.userData.speed + child.userData.phase) % (Math.PI * 2);
                var norm = t / (Math.PI * 2);  // 0→1
                var scale = 1 + norm * 4;
                child.scale.set(scale, scale, scale);
                child.material.opacity = (1 - norm) * 0.8;
            }
        });
    }

    // ── Border opacity pulse on drag ──
    if (globe._borderGroup && globe._borderLoaded && globe._borderLoaded()) {
        var targetOpacity = globeDragging ? 0.25 : 0.12;
        globe._borderGroup.children.forEach(function(line) {
            if (line.material) {
                line.material.opacity += (targetOpacity - line.material.opacity) * 0.08;
            }
        });
    }
    /* China national border: brighter, pulses with drag */
    if (globe._chinaBorderGroup) {
        var chinaTarget = globeDragging ? 0.75 : 0.55;
        globe._chinaBorderGroup.children.forEach(function(line) {
            if (line.material && line.material.opacity > 0.3) {
                line.material.opacity += (chinaTarget - line.material.opacity) * 0.08;
            } else if (line.material) {
                var glowTarget = globeDragging ? 0.35 : 0.2;
                line.material.opacity += (glowTarget - line.material.opacity) * 0.08;
            }
        });
    }
    /* China provincial borders: subtle pulse */
    if (globe._chinaProvGroup && globe._chinaProvGroup.children.length > 0) {
        var provTarget = globeDragging ? 0.30 : 0.18;
        globe._chinaProvGroup.children.forEach(function(line) {
            if (line.material) {
                line.material.opacity += (provTarget - line.material.opacity) * 0.08;
            }
        });
    }

    // ── Satellite orbits ──
    satellites.forEach(function(sat) {
        sat.angle += sat.speed;

        var x = sat.radiusX * Math.cos(sat.angle);
        var z = sat.radiusY * Math.sin(sat.angle);

        /* Apply tilt */
        var tiltedX = x * Math.cos(sat.tiltZ);
        var tiltedY = x * Math.sin(sat.tiltZ) * Math.cos(sat.tiltX) + z * Math.sin(sat.tiltX);
        var tiltedZ = -x * Math.sin(sat.tiltZ) * Math.sin(sat.tiltX) + z * Math.cos(sat.tiltX);

        sat.satGroup.position.set(tiltedX, tiltedY, tiltedZ);
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
        positions[3] = dir.x * 2.0;
        positions[4] = dir.y * 2.0;
        positions[5] = dir.z * 2.0;

        conn.line.geometry.attributes.position.needsUpdate = true;
        conn.line.material.opacity = 0.1 + 0.1 * Math.sin(time * 3);
    });

    // ── Scan line sweep ──
    scanLine.mesh.position.y += scanLine.speed * scanLine.direction;
    if (scanLine.mesh.position.y > 2.0) scanLine.direction = -1;
    if (scanLine.mesh.position.y < -2.0) scanLine.direction = 1;
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
    updateCameraForScreen();
    renderer.setSize(w, h);
    resizeOverlay();
});


/* ══════════════════════════════════════════════
   Part D: Interactive Functions
   ══════════════════════════════════════════════ */

/* ── vCard Download ── */
window.downloadVCard = function () {
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
window.shareCard = async function () {
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
window.copyToClipboard = async function (text) {
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
var _telemetryIdx = 0;
function updateTelemetry() {
    _telemetryIdx = (_telemetryIdx + 1) % SATELLITE_COUNT;
    var satId = 'SAT-' + String(_telemetryIdx + 1).padStart(2, '0');
    var alt = 500 + Math.floor(Math.random() * 300);

    var satEl = document.getElementById('satId');
    var altEl = document.getElementById('satAlt');
    if (satEl) satEl.textContent = satId;
    if (altEl) altEl.textContent = alt + 'km';
}
/* Show first satellite immediately, then cycle every 4 seconds */
updateTelemetry();
setInterval(updateTelemetry, 4000);

/* ── WeChat Modal ── */
window.openWeChatModal = function () {
    const modal = document.getElementById('wechatModal');
    if (modal) modal.classList.add('show');
};

window.closeWeChatModal = function () {
    const modal = document.getElementById('wechatModal');
    if (modal) modal.classList.remove('show');
};

window.launchWeChat = function () {
    // Try to open WeChat app via deep link
    window.location.href = 'weixin://dl/add?qr=Life_Copy';
    // Fallback: close modal after a moment
    setTimeout(() => closeWeChatModal(), 2000);
};

/* ── WeChat Link: copy ID + jump to WeChat ── */
(function initWeChatLink() {
    const wechatLink = document.getElementById('wechatLink');
    if (!wechatLink) return;

    wechatLink.addEventListener('click', function (e) {
        e.preventDefault();
        const wechatId = 'Life_Copy';

        // 1. Copy WeChat ID to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(wechatId).then(function () {
                showToast('toast-wechat-copied');
            }).catch(function () {
                fallbackCopy(wechatId);
            });
        } else {
            fallbackCopy(wechatId);
        }

        // 2. Try to open WeChat app (after a short delay to allow copy)
        setTimeout(function () {
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
            setTimeout(function () {
                toast.classList.remove('show');
            }, 2000);
        }
    }
})();

/* ── Tennis Modal ── */
window.openTennisModal = function () {
    var modal = document.getElementById('tennisModal');
    if (!modal) return;
    modal.classList.add('show');
};

window.closeTennisModal = function () {
    var modal = document.getElementById('tennisModal');
    if (modal) modal.classList.remove('show');
};

(function initTennisLink() {
    var tennisLink = document.getElementById('tennisLink');
    if (!tennisLink) return;
    tennisLink.addEventListener('click', function (e) {
        e.preventDefault();
        hapticFeedback('tap');
        openTennisModal();
    });
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
    const METEOR_ION = ['#00e5ff', '#00b0ff', '#40c4ff'];   // blue ionization trail

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
            this.tailLength = 30 + Math.random() * 50;
            this.size = 0.6 + Math.random() * 1.2;
            this.life = 1.0;
            this.fadeSpeed = 0.003 + Math.random() * 0.005;
            this.brightness = 0.2 + Math.random() * 0.5;

            // White/bright meteor colors with random alpha variation
            const whitePalette = ['#ffffff', '#f5f5f5', '#e0e0e0', '#eceff1', '#fffde7', '#fff9c4'];
            this.headColor = '#ffffff';
            this.bodyColor = whitePalette[Math.floor(Math.random() * whitePalette.length)];
            this.tailColor = whitePalette[Math.floor(Math.random() * whitePalette.length)];
            this.ionColor = whitePalette[Math.floor(Math.random() * whitePalette.length)];
            this.randomAlpha = 0.15 + Math.random() * 0.45;
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

            // Draw ionization trail (white, wide, very faint)
            ctx.globalAlpha = alpha * this.randomAlpha * 0.12;
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

            // Draw main tail (white fading out)
            ctx.globalAlpha = alpha * this.randomAlpha * 0.5;
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

            // Draw hot core (bright white)
            ctx.globalAlpha = alpha * this.randomAlpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = this.headColor;
            ctx.fill();

            // Head glow (white)
            ctx.globalAlpha = alpha * this.randomAlpha * 0.3;
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
        var _touchFrameCount = 0;
        document.addEventListener('touchstart', function (e) {
            const touch = e.touches[0];
            // Spawn a small burst on tap
            if (touch) {
                const colorPool = ['#ffffff', '#fff8e1', '#e0e0e0'];
                const color = colorPool[Math.floor(Math.random() * colorPool.length)];
                sparkParticles.push(new Spark(
                    touch.clientX, touch.clientY,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    color,
                    1.5 + Math.random(),
                    12 + Math.floor(Math.random() * 10)
                ));
            }
        }, { passive: true });

        document.addEventListener('touchmove', function (e) {
            _touchFrameCount++;
            // Only spawn particles every 3rd frame to reduce jank
            if (_touchFrameCount % 3 !== 0) return;
            const touch = e.touches[0];
            const colorPool = ['#ffffff', '#fff8e1', '#e0e0e0', '#b0bec5'];
            const color = colorPool[Math.floor(Math.random() * colorPool.length)];
            sparkParticles.push(new Spark(
                touch.clientX + (Math.random() - 0.5) * 8,
                touch.clientY + (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 1.2,
                color,
                1 + Math.random(),
                12 + Math.floor(Math.random() * 10)
            ));
        }, { passive: true });
    }
})();


/* ═══════════════════════════════════════════════
   Haptic / Vibration Feedback (Mobile)
   ═══════════════════════════════════════════════ */
function hapticFeedback(type) {
    // Disabled — user requested no tap feedback on mobile
    return;
    switch (type) {
        case 'tap': navigator.vibrate(8); break;   // button / tap
        case 'scroll': navigator.vibrate(4); break;   // scroll (very subtle)
        case 'success': navigator.vibrate([10, 50, 10]); break; // success pattern
        default: navigator.vibrate(6); break;
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
            'social-tennis': '网球助教',
            'btn-save': '保存联系人',
            'btn-share': '分享名片',
            'nfc-text': 'NFC · 触碰即达',
            'wechat-title': '添加微信好友',
            'wechat-id-label': '微信ID',
            'wechat-copy': '复制',
            'wechat-open': '打开微信',
            'wechat-close': '关闭',
            'wechat-hint': '长按识别二维码 或 复制ID搜索添加',
            'tennis-title': '挥拍青春 · 网球助教',
            'tennis-subtitle': '青春不等待，球场见真章',
            'tennis-label-location': '训练地点',
            'tennis-location': '不固定场地',
            'tennis-label-levels': '课程分级',
            'tennis-levels': '0基础 / 提升稳定性 / 练球',
            'tennis-label-form': '授课形式',
            'tennis-form': '1v1 / 1v多',
            'tennis-label-coach': '教练',
            'tennis-coach': '梁超',
            'tennis-qr-label': '扫码添加教练微信',
            'tennis-btn-call': '电话咨询',
            'tennis-btn-wechat': '微信咨询',
            'tennis-close': '关闭',
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
            'social-tennis': 'Tennis Coach',
            'btn-save': 'Save Contact',
            'btn-share': 'Share Card',
            'nfc-text': 'NFC · TAP TO CONNECT',
            'wechat-title': 'Add WeChat Friend',
            'wechat-id-label': 'WeChat ID',
            'wechat-copy': 'Copy',
            'wechat-open': 'Open WeChat',
            'wechat-close': 'Close',
            'wechat-hint': 'Long-press QR code or copy ID to search',
            'tennis-title': 'Swing Youth · Tennis Coach',
            'tennis-subtitle': 'Youth won\'t wait — see you on the court',
            'tennis-label-location': 'Location',
            'tennis-location': 'Non-fixed venue',
            'tennis-label-levels': 'Levels',
            'tennis-levels': 'Beginner / Improving stability / Practicing',
            'tennis-label-form': 'Format',
            'tennis-form': '1-on-1 / 1-on-n',
            'tennis-label-coach': 'Coach',
            'tennis-coach': 'LeongBro',
            'tennis-qr-label': 'Scan to add coach WeChat',
            'tennis-btn-call': 'Call',
            'tennis-btn-wechat': 'WeChat',
            'tennis-close': 'Close',
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

    var currentLang = localStorage.getItem('lang') || 'en';

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

/* ══════════════════════════════════════════════
   Part F: UI Zoom Control
   - Button zoom (bottom-right floating panel)
   - Pinch-to-zoom on mobile
   ══════════════════════════════════════════════ */

(function () {
    var zoomLevel = 1.0;
    var ZOOM_MIN = 0.3;
    var ZOOM_MAX = 5.0;
    var ZOOM_STEP = 0.15;
    var ZOOM_SMOOTH = 0.08;  // interpolation factor for pinch smoothness

    var zoomLevelEl = document.getElementById('zoomLevel');
    var uiOverlay = document.querySelector('.ui-overlay');
    var cardContainer = document.querySelector('.card-container');

    function getStorageZoom() {
        try {
            var v = parseFloat(localStorage.getItem('nfc-zoom'));
            return isNaN(v) ? 1.0 : Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v));
        } catch (e) { return 1.0; }
    }

    function saveStorageZoom(v) {
        try { localStorage.setItem('nfc-zoom', v); } catch (e) { }
    }

    function applyZoom(scale) {
        zoomLevel = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale)) * 100) / 100;

        // Scale ONLY the card content, not the entire overlay
        // This keeps zoom controls, FAB button, scrollbar pinned to screen edges
        if (cardContainer) {
            // 缩放时禁用过渡，确保实时跟手
            cardContainer.classList.add('no-transition');
            cardContainer.style.transformOrigin = 'center top';
            cardContainer.style.transform = 'scale(' + zoomLevel + ')';
            void cardContainer.offsetHeight;
            cardContainer.classList.remove('no-transition');
        }

        // Scale the 3D globe by adjusting the camera zoom factor
        if (typeof camera !== 'undefined' && camera) {
            camera.zoom = zoomLevel;
            camera.updateProjectionMatrix();
        }

        // Keep overlay scroll centered after zoom change
        if (uiOverlay) {
            var scrollTarget = (uiOverlay.scrollHeight - uiOverlay.clientHeight) / 2;
            uiOverlay.scrollTo({ top: scrollTarget, behavior: 'instant' });
        }

        if (zoomLevelEl) zoomLevelEl.textContent = Math.round(zoomLevel * 100) + '%';
        saveStorageZoom(zoomLevel);
    }

    // --- Button zoom ---
    window.zoomIn = function () {
        applyZoom(zoomLevel + ZOOM_STEP);
    };

    window.zoomOut = function () {
        applyZoom(zoomLevel - ZOOM_STEP);
    };

    window.zoomReset = function () {
        applyZoom(1.0);
    };

    // --- FAB palette toggle ---
    window.toggleFabPalette = function () {
        var palette = document.getElementById('fabPalette');
        var main = document.getElementById('fabMain');
        if (!palette || !main) return;
        var isOpen = palette.classList.toggle('show');
        main.classList.toggle('active', isOpen);
    };

    // Close FAB palette when tapping outside
    document.addEventListener('click', function (e) {
        var fab = document.getElementById('fabZoom');
        if (fab && !fab.contains(e.target)) {
            var palette = document.getElementById('fabPalette');
            var main = document.getElementById('fabMain');
            if (palette) palette.classList.remove('show');
            if (main) main.classList.remove('active');
            var opPalette = document.getElementById('fabOpacityPalette');
            if (opPalette) opPalette.classList.remove('show');
        }
    });

    // --- Opacity Control ---
    var cardOpacity = 100;
    var isDraggingOpacity = false;

    // Remove cardFadeIn animation after it finishes so JS inline opacity works
    // (CSS animation with forwards has higher cascade priority than inline styles)
    function removeCardAnimation() {
        var card = document.getElementById('mainCard');
        if (card) {
            card.style.animation = 'none';
            card.style.opacity = '1';
        }
    }
    setTimeout(removeCardAnimation, 1600); // 0.3s delay + 1.2s animation = 1.5s

    function applyCardOpacity(val) {
        cardOpacity = Math.max(0, Math.min(100, Math.round(val)));
        // Expose to global scope for collapse toggle
        window._cardOpacity = cardOpacity;
        var card = document.getElementById('mainCard');
        var container = document.getElementById('cardContainer');

        // 临时禁用过渡动画，确保拖拽滑块时透明度实时同步更新
        if (container) container.classList.add('no-transition');

        if (card) {
            card.style.animation = 'none';   // clear animation so inline opacity takes effect
            card.style.opacity = cardOpacity / 100;
            // When fully transparent, disable all pointer events so links/buttons are unreachable
            card.style.pointerEvents = cardOpacity === 0 ? 'none' : 'auto';
        }
        // collapseState is defined later (Part G); guard with typeof check
        var isCollapsed = (typeof collapseState !== 'undefined' && collapseState.collapsed);
        if (container && !isCollapsed) {
            container.style.visibility = cardOpacity === 0 ? 'hidden' : '';
            // 完全屏蔽交互：opacity=0 时添加 card-blocked 类，彻底屏蔽内部所有可点击元素
            if (cardOpacity === 0) {
                container.classList.add('card-blocked');
                container.style.pointerEvents = 'none';
            } else {
                container.classList.remove('card-blocked');
                container.style.pointerEvents = '';
            }
        }

        // 强制 reflow 使样式立即生效后，恢复过渡能力
        if (container) {
            void container.offsetHeight;
            container.classList.remove('no-transition');
        }

        // Update globe interactable state for drag rotation
        if (typeof updateGlobeInteractable === 'function') {
            updateGlobeInteractable(cardOpacity);
        }
        var levelEl = document.getElementById('opacityLevel');
        if (levelEl) levelEl.textContent = cardOpacity + '%';
        var fill = document.getElementById('opacityFill');
        if (fill) fill.style.width = (cardOpacity) + '%';
        var thumb = document.getElementById('opacityThumb');
        if (thumb) {
            // At 0% thumb is at far left, at 100% thumb is at far right
            thumb.style.left = cardOpacity + '%';
            thumb.style.right = 'auto';
            thumb.style.transform = 'translate(-50%, -50%)';
        }
    }

    function updateOpacityFromPointer(clientX) {
        var track = document.getElementById('opacityTrack');
        if (!track) return;
        var rect = track.getBoundingClientRect();
        var ratio = (clientX - rect.left) / rect.width;
        applyCardOpacity(ratio * 100);
    }

    /* Opacity thumb uses pointer events (unified mouse+touch) to avoid
       document-level touchstart/touchmove that would block scrolling */
    var opacityThumb = document.getElementById('opacityThumb');
    var opacityTrack = document.getElementById('opacityTrack');
    var _opacityTarget = opacityThumb || opacityTrack;

    if (_opacityTarget) {
        _opacityTarget.addEventListener('pointerdown', function (e) {
            isDraggingOpacity = true;
            updateOpacityFromPointer(e.clientX);
            e.preventDefault();
            e.stopPropagation();
        });
        _opacityTarget.addEventListener('touchstart', function (e) {
            isDraggingOpacity = true;
            updateOpacityFromPointer(e.touches[0].clientX);
        }, { passive: true });
    }

    document.addEventListener('pointermove', function (e) {
        if (isDraggingOpacity) {
            updateOpacityFromPointer(e.clientX);
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('pointerup', function () { isDraggingOpacity = false; });
    document.addEventListener('pointercancel', function () { isDraggingOpacity = false; });

    // Touchmove only on the track element to avoid blocking page scroll
    if (opacityTrack) {
        opacityTrack.addEventListener('touchmove', function (e) {
            if (isDraggingOpacity) {
                updateOpacityFromPointer(e.touches[0].clientX);
                e.preventDefault();
            }
        }, { passive: false });
    }
    document.addEventListener('touchend', function () { isDraggingOpacity = false; });
    document.addEventListener('touchcancel', function () { isDraggingOpacity = false; });

    window.toggleOpacityPalette = function () {
        var opPalette = document.getElementById('fabOpacityPalette');
        if (!opPalette) return;
        opPalette.classList.toggle('show');
        // Initialize thumb position on first open
        if (opPalette.classList.contains('show')) {
            applyCardOpacity(cardOpacity);
        }
    };

    // Initialize opacity display
    applyCardOpacity(100);

    // --- Pinch-to-zoom ---
    var pinchStartDist = 0;
    var pinchStartZoom = 1.0;
    var isPinching = false;

    function getTouchDist(touches) {
        var dx = touches[0].clientX - touches[1].clientX;
        var dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    document.addEventListener('touchstart', function (e) {
        if (e.touches.length === 2) {
            isPinching = true;
            pinchStartDist = getTouchDist(e.touches);
            pinchStartZoom = zoomLevel;
        }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
        if (!isPinching || e.touches.length !== 2) return;
        var currentDist = getTouchDist(e.touches);
        var ratio = currentDist / pinchStartDist;
        applyZoom(pinchStartZoom * ratio);
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
        if (isPinching) {
            isPinching = false;
            hapticFeedback('tap');
        }
    }, { passive: true });

    // --- Mouse wheel zoom (Ctrl + scroll) ---
    document.addEventListener('wheel', function (e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            var delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            applyZoom(zoomLevel + delta);
        }
    }, { passive: false });

    // Auto-adapt scale to screen size (always run on load)
    (function autoAdaptScale() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var minDim = Math.min(w, h);
        var targetScale = 1.0;
        if (minDim <= 320) targetScale = 0.72;
        else if (minDim <= 350) targetScale = 0.80;
        else if (minDim <= 375) targetScale = 0.88;
        else if (minDim <= 390) targetScale = 0.94;
        // 391+ stays at 1.0
        applyZoom(targetScale);
    })();

    // Re-adapt scale on viewport resize (e.g., orientation change)
    var _resizeAdaptTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(_resizeAdaptTimer);
        _resizeAdaptTimer = setTimeout(function () {
            var w = window.innerWidth;
            var h = window.innerHeight;
            var minDim = Math.min(w, h);
            var targetScale = 1.0;
            if (minDim <= 320) targetScale = 0.72;
            else if (minDim <= 350) targetScale = 0.80;
            else if (minDim <= 375) targetScale = 0.88;
            else if (minDim <= 390) targetScale = 0.94;
            applyZoom(targetScale);
        }, 250);
    });
})();

/* ══════════════════════════════════════════════
   Part G: 一键收放个人信息 (Collapse Toggle)
   收起时卡片动态缩小并飞向按钮位置；
   展开时从按钮位置反向放大淡入恢复完整面板。
   ══════════════════════════════════════════════ */
var collapseState = {
    collapsed: false,
    animating: false,
    _timer: null,
    _cachedOffset: null   // 缓存收起前的偏移量，供展开时使用
};

/**
 * 计算 card-container 收缩到 collapse 按钮位置所需的 transform 值
 * 返回 { dx, dy } —— 相对于卡片自身坐标系的平移量（px）
 */
function _calcCollapseOffset(cardEl, btnEl) {
    var cardRect = cardEl.getBoundingClientRect();
    var btnRect  = btnEl.getBoundingClientRect();
    // 卡片中心 vs 按钮中心
    var cx = cardRect.left + cardRect.width  / 2;
    var cy = cardRect.top  + cardRect.height / 2;
    var bx = btnRect.left + btnRect.width  / 2;
    var by = btnRect.top  + btnRect.height / 2;
    return { dx: bx - cx, dy: by - cy };
}

/**
 * 动画完成回调的通用处理：清除 animating 标记、移除 timer、更新 globe 可交互状态
 */
function _finishCollapseAnim(opts) {
    collapseState.animating = false;
    if (collapseState._timer) { clearTimeout(collapseState._timer); collapseState._timer = null; }
    if (collapseState._transitionHandler) {
        var c = document.getElementById('cardContainer');
        if (c) c.removeEventListener('transitionend', collapseState._transitionHandler);
        collapseState._transitionHandler = null;
    }
    if (opts && typeof opts.globeOpacity !== 'undefined') {
        if (typeof updateGlobeInteractable === 'function') updateGlobeInteractable(opts.globeOpacity);
    }
    if (opts && typeof opts.restoreBlocked !== 'undefined') {
        var ctn = document.getElementById('cardContainer');
        if (ctn) {
            if (opts.restoreBlocked) {
                ctn.classList.add('card-blocked');
                ctn.style.pointerEvents = 'none';
            } else {
                ctn.classList.remove('card-blocked');
                ctn.style.pointerEvents = '';
            }
        }
    }
}

/**
 * 绑定 transitionend 监听器 + 2 秒安全回退
 * primaryProp: 主要过渡属性（'transform' 或 'opacity'）
 */
function _bindCollapseTransitionEnd(cardContainer, onDone, primaryProp) {
    var done = false;
    function handler(e) {
        if (done) return;
        // 仅响应目标属性的 transitionend
        if (primaryProp && e.propertyName && e.propertyName !== primaryProp) return;
        done = true;
        onDone();
    }
    collapseState._transitionHandler = handler;
    cardContainer.addEventListener('transitionend', handler, { once: false });
    // 安全回退：2 秒后无论 transitionend 是否触发都强制完成
    collapseState._timer = setTimeout(function () {
        if (!done) {
            done = true;
            onDone();
        }
    }, 2000);
}

function toggleCollapsePanel() {
    // Safety: 如果 animating 卡住超过 2.5 秒，强制重置防止界面锁死
    if (collapseState.animating) {
        if (collapseState._animStart && (Date.now() - collapseState._animStart > 2500)) {
            _finishCollapseAnim({ globeOpacity: 100 });
        } else {
            return;
        }
    }

    var cardContainer = document.getElementById('cardContainer');
    var toggleBtn = document.getElementById('fabCollapseToggle');
    if (!cardContainer || !toggleBtn) return;

    hapticFeedback('tap');

    // 清除之前的 timer 和 transitionend 监听
    if (collapseState._timer) { clearTimeout(collapseState._timer); collapseState._timer = null; }
    if (collapseState._transitionHandler) {
        cardContainer.removeEventListener('transitionend', collapseState._transitionHandler);
        collapseState._transitionHandler = null;
    }

    collapseState.animating = true;
    collapseState._animStart = Date.now();

    if (!collapseState.collapsed) {
        /* ── 收起：计算偏移，transform 到按钮位置并缩为 0 ── */
        collapseState.collapsed = true;
        toggleBtn.classList.add('collapsed');

        // 确保收起动画使用 CSS transition（移除 no-transition）
        cardContainer.classList.remove('no-transition');

        // 在卡片尚未缩放前缓存偏移量（展开时卡片已缩为0，无法正确计算）
        var offset = _calcCollapseOffset(cardContainer, toggleBtn);
        collapseState._cachedOffset = offset;

        // 立即屏蔽所有交互 + 添加 card-blocked 类，防止动画期间误触
        cardContainer.classList.add('card-blocked');
        cardContainer.style.pointerEvents = 'none';
        var card = document.getElementById('mainCard');
        if (card) {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0';
        }

        cardContainer.style.transformOrigin = 'center center';
        cardContainer.style.transform =
            'translate(' + offset.dx + 'px, ' + offset.dy + 'px) scale(0)';
        cardContainer.style.opacity = '0';
        cardContainer.style.visibility = 'hidden';
        cardContainer.classList.add('collapsed');

        // 使用 transitionend 监听动画完成（优先于 setTimeout）
        _bindCollapseTransitionEnd(cardContainer, function () {
            _finishCollapseAnim({ globeOpacity: 0 });
        }, 'transform');

    } else {
        /* ── 展开：先用缓存偏移确保收起位置，再恢复完整面板 ── */
        collapseState.collapsed = false;
        toggleBtn.classList.remove('collapsed');
        cardContainer.classList.remove('collapsed');

        // 确保展开动画使用 CSS transition
        cardContainer.classList.remove('no-transition');

        // 先恢复可见性，为动画做准备
        cardContainer.style.visibility = 'visible';

        // 使用缓存的偏移量（此时卡片已缩为0，不能用 getBoundingClientRect 重算）
        var offset = collapseState._cachedOffset || { dx: 0, dy: -200 };
        cardContainer.style.transformOrigin = 'center center';
        cardContainer.style.transform =
            'translate(' + offset.dx + 'px, ' + offset.dy + 'px) scale(0)';
        cardContainer.style.opacity = '0';
        collapseState._cachedOffset = null;
        // 强制 reflow，确保浏览器应用了上面的值（从 scale(0) 位置开始动画）
        void cardContainer.offsetHeight;

        // 恢复完整面板（CSS transition 会自动从 scale(0) 动画到 scale(1)）
        var savedOpacity = (typeof window._cardOpacity !== 'undefined') ? window._cardOpacity : 100;
        cardContainer.style.transform = 'scale(1) translate(0, 0)';
        cardContainer.style.opacity = (savedOpacity > 0) ? (savedOpacity / 100) : '0';
        cardContainer.style.visibility = savedOpacity > 0 ? '' : 'hidden';

        if (savedOpacity > 0) {
            var card = document.getElementById('mainCard');
            if (card) {
                card.style.opacity = savedOpacity / 100;
                card.style.pointerEvents = 'auto';
            }
        }

        // 使用 transitionend 监听动画完成（优先于 setTimeout）
        _bindCollapseTransitionEnd(cardContainer, function () {
            _finishCollapseAnim({
                globeOpacity: savedOpacity,
                restoreBlocked: savedOpacity === 0
            });
        }, 'transform');
    }
}
