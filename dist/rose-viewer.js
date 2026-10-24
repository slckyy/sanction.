import * as THREE from './vendor/three-gltf.js';

// Rose prototype. Meter-scale geometry stays fixed; only this outer assembly moves.
// The static-site dependency is locally bundled Three.js 0.186.1 + GLTFLoader (MIT).
export async function mountRose(panel) {
  const hero = panel.querySelector('.editorial-hero');
  const scroll = panel.querySelector('.page-scroll');
  const host = document.createElement('div');
  host.className = 'rose-viewer';
  hero.append(host);
  hero.removeAttribute('aria-hidden');
  const abort = new AbortController();
  const on = (target, event, fn, options = {}) => target.addEventListener(event, fn, { ...options, signal: abort.signal });
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch (error) { host.remove(); console.warn('Rose WebGL unavailable', error); return; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('rose-touch');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Rose LUMI holding a telephone. Drag to rotate freely; drag around the edges to roll. Arrow keys turn, Q and E roll, Escape returns.');
  svg.setAttribute('tabindex', '0');
  host.append(svg);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-.08, .08, .08, -.08, .01, 2);
  camera.position.set(0, 0, .4);
  const assembly = new THREE.Group();
  scene.add(assembly);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false, visible = false, ready = false, frame = 0, last = 0, time = 0;
  let width = 1, height = 1, extentX = .07, extentY = .07, pointer = null;
  const orientation = assembly.quaternion.clone(), target = orientation.clone(), rest = orientation.clone();
  const delta = orientation.clone(), idleRotation = orientation.clone();
  const velocity = new THREE.Vector3(), axis = new THREE.Vector3();
  function rotate(vector, amount = 1) {
    const angle = vector.length() * amount;
    if (angle) target.premultiply(delta.setFromAxisAngle(axis.copy(vector).normalize(), angle)).normalize();
  }
  let releaseAt = 0, hullAt = 0, model, environment;
  const meshes = [], hitShapes = [];
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), scratch = new THREE.Vector3();
  const clockNow = () => performance.now() * .001;
  function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function wake() { if (!disposed && ready && visible && !panel.hidden && !document.hidden && !frame) frame = requestAnimationFrame(draw); }
  function resize() {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width; height = rect.height;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    const half = Math.max(extentY, extentX / (width / height)) * 1.035;
    camera.top = half; camera.bottom = -half;
    camera.left = -half * width / height; camera.right = -camera.left;
    camera.updateProjectionMatrix();
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    clipHeader(); hullAt = 0; wake();
  }
  function clipHeader() {
    const top = Math.max(0, panel.querySelector('.page-title').getBoundingClientRect().bottom + 10 - host.getBoundingClientRect().top);
    host.style.clipPath = `inset(${top}px 0 0 0)`;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { resize(); wake(); } else { pointer = null; stop(); }
  }, { root: scroll });
  intersection.observe(host);
  const panelObserver = new MutationObserver(() => {
    if (panel.hidden) { pointer = null; orientation.identity(); target.identity(); velocity.set(0, 0, 0); stop(); }
    else { resize(); wake(); }
  });
  panelObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  on(scroll, 'scroll', clipHeader, { passive: true });
  on(document, 'visibilitychange', () => { if (document.hidden) stop(); else wake(); });
  on(motion, 'change', () => { last = 0; wake(); });
  on(window, 'pagehide', event => { if (event.persisted) stop(); else dispose(); });
  on(window, 'pageshow', wake);
  on(renderer.domElement, 'webglcontextlost', event => { event.preventDefault(); stop(); });
  on(renderer.domElement, 'webglcontextrestored', wake);

  // Only projected character-sized paths receive touch-action:none. The rest of
  // the hero, all page margins and all other tabs retain native page scrolling.
  function hull(points) {
    points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const a = [], b = [];
    for (const p of points) { while (a.length > 1 && cross(a.at(-2), a.at(-1), p) <= 0) a.pop(); a.push(p); }
    for (let i = points.length - 1; i >= 0; i--) { const p = points[i]; while (b.length > 1 && cross(b.at(-2), b.at(-1), p) <= 0) b.pop(); b.push(p); }
    return a.slice(0, -1).concat(b.slice(0, -1));
  }
  function updateTouchShapes() {
    scene.updateMatrixWorld(true);
    for (const shape of hitShapes) {
      const points = shape.points.map(p => {
        scratch.copy(p).applyMatrix4(shape.mesh.matrixWorld).project(camera);
        return [(scratch.x * .5 + .5) * width, (-scratch.y * .5 + .5) * height];
      });
      shape.path.setAttribute('d', 'M' + hull(points).map(p => p.map(n => n.toFixed(1)).join(',')).join('L') + 'Z');
    }
  }
  function hit(event) {
    const rect = host.getBoundingClientRect();
    ndc.set((event.clientX - rect.left) / width * 2 - 1, 1 - (event.clientY - rect.top) / height * 2);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(meshes, false).length > 0;
  }
  on(svg, 'pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || !hit(event)) return;
    event.preventDefault();
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: clockNow() };
    target.copy(orientation); velocity.set(0, 0, 0);
    svg.setPointerCapture(event.pointerId); host.classList.add('is-dragging'); wake();
  });
  on(svg, 'pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const now = clockNow(), dt = Math.max(.008, now - pointer.time);
    const dx = (event.clientX - pointer.x) * .012, dy = (event.clientY - pointer.y) * .012;
    const rect = host.getBoundingClientRect(), radius = Math.min(width, height) * .5;
    const x = (pointer.x - rect.left - width * .5) / radius;
    const y = (pointer.y - rect.top - height * .5) / radius;
    // Incremental world-space trackball rotation: no Euler limits or pole locks.
    // Tangential edge drags add roll; repeated drags can turn through any angle.
    const turn = new THREE.Vector3(dy, dx, y * dx - x * dy);
    rotate(turn);
    velocity.copy(turn).multiplyScalar(1 / dt).clampLength(0, 2.4);
    pointer = { ...pointer, x: event.clientX, y: event.clientY, time: now };
    event.preventDefault(); wake();
  });
  function release(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    pointer = null; releaseAt = clockNow(); host.classList.remove('is-dragging');
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (motion.matches) velocity.set(0, 0, 0);
    wake();
  }
  on(svg, 'pointerup', release); on(svg, 'pointercancel', release); on(svg, 'lostpointercapture', release);
  on(svg, 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'q', 'Q', 'e', 'E', 'Escape'].includes(event.key)) return;
    event.preventDefault(); velocity.set(0, 0, 0);
    if (event.key === 'Escape') target.identity();
    else {
      rotate(new THREE.Vector3(event.key === 'ArrowUp' ? -.22 : event.key === 'ArrowDown' ? .22 : 0,
        event.key === 'ArrowLeft' ? -.22 : event.key === 'ArrowRight' ? .22 : 0,
        event.key.toLowerCase() === 'q' ? .22 : event.key.toLowerCase() === 'e' ? -.22 : 0));
    }
    releaseAt = clockNow() + .65; wake();
  });
  function draw(ms) {
    frame = 0;
    if (disposed || !ready || !visible || panel.hidden || document.hidden) return;
    const now = ms * .001;
    // Quiet float runs at 30 fps; direct manipulation uses each display frame.
    if (!pointer && !motion.matches && last && now - last < 1 / 30) { frame = requestAnimationFrame(draw); return; }
    const dt = last ? Math.max(0, now - last) : 1 / 60; last = now; time += Math.min(dt, .1);
    if (!pointer) {
      const age = now - releaseAt;
      if (age >= 0) {
        const damping = Math.exp(-7 * dt);
        const coast = (1 - damping) / 7;
        rotate(velocity, coast);
        velocity.multiplyScalar(damping);
        if (age > .24) {
          const back = Math.exp(-(motion.matches ? 9 : 1.65) * dt);
          target.slerp(rest, 1 - back);
        }
      }
    }
    const ease = 1 - Math.exp(-(pointer ? 35 : 15) * dt);
    orientation.slerp(target, ease);
    const idle = motion.matches ? 0 : 1;
    axis.set(idle * .009 * Math.sin(time * .53), idle * .014 * Math.sin(time * .37), idle * .007 * Math.sin(time * .43));
    const idleAngle = axis.length();
    idleRotation.setFromAxisAngle(idleAngle ? axis.normalize() : axis.set(1, 0, 0), idleAngle);
    assembly.quaternion.copy(orientation).premultiply(idleRotation);
    assembly.position.y = idle * .0009 * Math.sin(time * .76);
    renderer.render(scene, camera);
    if (now - hullAt > .045 || pointer) { updateTouchShapes(); hullAt = now; }
    host.dataset.lumiReady = 'true';
    const settling = orientation.angleTo(rest) + target.angleTo(rest) > .0001;
    if (!motion.matches || pointer || settling) frame = requestAnimationFrame(draw);
  }
  function dispose() {
    if (disposed) return;
    disposed = true; stop(); abort.abort(); resizeObserver.disconnect(); intersection.disconnect(); panelObserver.disconnect();
    const textures = new Set(), materials = new Set();
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      for (const material of [].concat(mesh.material)) materials.add(material);
    }
    for (const material of materials) { for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); material.dispose(); }
    for (const texture of textures) { texture.source?.data?.close?.(); texture.dispose(); }
    environment?.dispose(); renderer.dispose(); renderer.forceContextLoss(); host.remove();
  }
  try {
    const gltf = await new THREE.GLTFLoader().loadAsync(new URL('./assets/rose-lumi-real.glb?v=rose-led-arm-3', import.meta.url).href);
    model = gltf.scene;
    if (disposed) { model.traverse(o => { o.geometry?.dispose(); for (const m of [].concat(o.material || [])) { for (const t of Object.values(m)) if (t?.isTexture) { t.source?.data?.close?.(); t.dispose(); } m.dispose(); } }); return; }
    model.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(model.getObjectByName('LUMI_CHARACTER')).getCenter(new THREE.Vector3());
    model.position.sub(center); assembly.add(model); scene.updateMatrixWorld(true);
    model.traverse(object => {
      if (!object.isMesh) return;
      meshes.push(object); object.castShadow = true; object.receiveShadow = true;
      for (const material of [].concat(object.material)) {
        for (const texture of [material.normalMap, material.roughnessMap]) if (texture) texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        // Core opaque PBR/emission remains usable if transmission isn't supported.
        if (material.transmission && !renderer.extensions.has('EXT_color_buffer_float')) material.transmission = 0;
      }
    });
    // A sphere about the character pivot bounds every possible 3-axis rotation,
    // including the cord and idle bob, without changing character proportions.
    extentX = extentY = 0;
    for (const mesh of meshes) {
      const position = mesh.geometry.attributes.position, points = [];
      const stride = Math.max(1, Math.floor(position.count / 420));
      for (let i = 0; i < position.count; i++) {
        scratch.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        const radius = scratch.length();
        extentX = Math.max(extentX, radius);
        extentY = Math.max(extentY, radius + .001);
        if (i % stride === 0) points.push(new THREE.Vector3().fromBufferAttribute(position, i));
      }
      const path = document.createElementNS(svg.namespaceURI, 'path');
      svg.append(path); hitShapes.push({ mesh, points, path });
    }
    // Bright rose cloud band sampled from the supplied atmosphere PNG; independent
    // of the approved #F98083 linear accent factors stored in the GLB.
    const sky = new THREE.Color().fromArray(gltf.parser.json.asset.extras.atmosphere_key_linear);
    const key = new THREE.DirectionalLight(sky.clone().lerp(new THREE.Color(0xffffff), .38), 19);
    key.position.set(-.018, -.22, .065); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -.10, right: .10, top: .10, bottom: -.10, near: .01, far: .5 });
    key.shadow.bias = -.00003; key.shadow.normalBias = .00009; key.shadow.radius = 3;
    scene.add(key, key.target);
    scene.add(new THREE.HemisphereLight(sky.clone().lerp(new THREE.Color(0xf1eff4), .8), 0x49494d, 1.8));
    const fill = new THREE.DirectionalLight(0xdedee8, 1.0); fill.position.set(.07, .015, .16); scene.add(fill);
    // Invisible broad sky reflections. This is renderer illumination, never scenery.
    const envWidth = 128, envHeight = 64, pixels = new Float32Array(envWidth * envHeight * 4);
    for (let y = 0; y < envHeight; y++) for (let x = 0; x < envWidth; x++) {
      const up = -Math.cos(Math.PI * (y + .5) / envHeight);
      const sun = Math.pow(Math.max(0, -up), 18) * 8;
      const base = .35 + .55 * Math.max(0, up);
      const offset = (y * envWidth + x) * 4;
      pixels[offset] = base * (.72 + .28 * sky.r) + sun * sky.r;
      pixels[offset + 1] = base * (.72 + .28 * sky.g) + sun * sky.g;
      pixels[offset + 2] = base * (.72 + .28 * sky.b) + sun * sky.b;
      pixels[offset + 3] = 1;
    }
    const texture = new THREE.DataTexture(pixels, envWidth, envHeight, THREE.RGBAFormat, THREE.FloatType);
    texture.mapping = THREE.EquirectangularReflectionMapping; texture.needsUpdate = true;
    const pmrem = new THREE.PMREMGenerator(renderer); environment = pmrem.fromEquirectangular(texture);
    scene.environment = environment.texture; scene.environmentIntensity = 1.1;
    texture.dispose(); pmrem.dispose();
    // Local emitters travel with their optical parts; the fixed light below doesn't.
    for (const mesh of meshes.filter(o => /LED_DIFFUSER/.test(o.material?.name))) {
      const box = new THREE.Box3().setFromObject(mesh), pos = box.getCenter(new THREE.Vector3());
      const eye = mesh.material.name === 'LUMI_EYE_LED_DIFFUSER';
      if (eye) {
        // Spill follows the actual luminous rim; the recessed center is plastic.
        const position = mesh.geometry.attributes.position, normal = mesh.geometry.attributes.normal;
        const indices = [...new Set(mesh.geometry.index.array)];
        for (let step = 0; step < 8; step++) {
          const angle = step * Math.PI / 4;
          const target = new THREE.Vector3(pos.x + Math.cos(angle) * (box.max.x - box.min.x) * .47,
            pos.y + Math.sin(angle) * (box.max.y - box.min.y) * .47, box.max.z);
          let best = Infinity, selected = 0;
          for (const i of indices) {
            scratch.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
            const distance = scratch.distanceToSquared(target);
            if (distance < best) { best = distance; selected = i; }
          }
          scratch.fromBufferAttribute(position, selected).applyMatrix4(mesh.matrixWorld);
          const direction = new THREE.Vector3().fromBufferAttribute(normal, selected).transformDirection(mesh.matrixWorld);
          scratch.addScaledVector(direction, .00055);
          const light = new THREE.PointLight(mesh.material.emissive.clone(), .000022, .023, 2);
          light.position.copy(scratch); assembly.add(light);
        }
      } else {
        pos.z = box.max.z + .0008;
        const light = new THREE.PointLight(mesh.material.emissive.clone(), .000025, .024, 2);
        light.position.copy(pos); assembly.add(light);
      }
    }
    ready = true; resize(); wake();
  } catch (error) { console.warn('Rose could not load', error); dispose(); }
  return dispose;
}
