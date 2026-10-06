import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { memberLook } from "./scene-seats";
import { deskPosition } from "./room-world-layout";

export interface WorldSeat { id: string | null; online: boolean }
export interface WorldState { seats: WorldSeat[]; resting: boolean; synchronized: boolean; title: string; dark?: boolean }
type Pick = { memberId: string } | { music: true };

/** Original procedural observatory. No remote assets; one disposable WebGL context. */
export function createRoomWorld(host: HTMLElement, onPick: (pick: Pick) => void, onLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dce8ec");
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 100);
  camera.position.set(9, 8, 13);
  camera.lookAt(0, 1, 0);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];
  const material = (color: string) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .68 }));
    return materials.get(color)!;
  };
  const box = new RoundedBoxGeometry(1, 1, 1, 2, .09);
  const sphere = new THREE.SphereGeometry(1, 20, 14);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 20);
  geometries.push(box, sphere, cylinder);
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string,
    at: number[], scale: number[]) => {
    const m = new THREE.Mesh(geometry, material(color));
    m.position.set(at[0], at[1], at[2]); m.scale.set(scale[0], scale[1], scale[2]);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const block = (parent: THREE.Object3D, color: string, at: number[], scale: number[]) => mesh(parent, box, color, at, scale);
  const orb = (parent: THREE.Object3D, color: string, at: number[], scale: number[]) => mesh(parent, sphere, color, at, scale);
  // Merge by material, retaining interactive character/TV roots and their transforms.
  function batch(root: THREE.Object3D, recursive = false) {
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const groups = new Map<THREE.MeshStandardMaterial, THREE.BufferGeometry[]>();
    const originals: THREE.Mesh[] = [];
    const collect = (child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshStandardMaterial)) return;
      const clone = child.geometry.clone().applyMatrix4(inverse.clone().multiply(child.matrixWorld));
      // RoundedBox is non-indexed; normalize the other primitives before merging.
      const transformed = clone.index ? clone.toNonIndexed() : clone;
      if (transformed !== clone) clone.dispose();
      if (!groups.has(child.material)) groups.set(child.material, []);
      groups.get(child.material)!.push(transformed); originals.push(child);
    };
    if (recursive) root.traverse(collect); else root.children.forEach(collect);
    originals.forEach(m => m.removeFromParent());
    const batches: THREE.BufferGeometry[] = [];
    for (const [mat, pieces] of groups) {
      const geometry = mergeGeometries(pieces);
      pieces.forEach(g => g.dispose());
      if (!geometry) continue;
      batches.push(geometry);
      const merged = new THREE.Mesh(geometry, mat); merged.castShadow = true; merged.receiveShadow = true; root.add(merged);
    }
    return () => batches.forEach(g => g.dispose());
  }
  const ambient = new THREE.HemisphereLight("#e6f5ff", "#788788", 2.4); scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff0d9", 3.2);
  sun.position.set(-5, 10, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 30 });
  sun.shadow.normalBias = .04; scene.add(sun);
  // Sculptural cutaway: stone, oak and one orbital window. No borrowed artwork.
  block(scene, "#9db5bc", [0, -.48, 0], [12.7, .7, 8.8]);
  block(scene, "#496572", [0, -.87, 0], [12.1, .15, 8.3]);
  for (let i = 0; i < 12; i++) block(scene, i % 2 ? "#c0aa90" : "#c9b69e", [-5.78 + i * 1.05, -.05, 0], [1.03, .15, 8.4]);
  block(scene, "#527c82", [0, .04, .6], [9.5, .06, 6.35]);
  block(scene, "#70979b", [0, .08, .6], [9.1, .025, 5.95]);
  block(scene, "#d5e1dd", [-6, 1, -1.5], [.25, 2.1, 5.5]);
  block(scene, "#e1e9e2", [0, .5, -4.1], [12, 1, .25]);
  block(scene, "#d5e1dd", [3.2, 2.5, -4.1], [5.6, 4.6, .25]);
  const oculus = new THREE.TorusGeometry(1.95, .18, 12, 64);
  const rim = new THREE.TorusGeometry(1.74, .025, 8, 64);
  const pane = new THREE.CircleGeometry(1.73, 64);
  const orbit = new THREE.TorusGeometry(.8, .022, 6, 40);
  geometries.push(oculus, rim, pane, orbit);
  mesh(scene, oculus, "#e1e9e2", [-3.2, 2.55, -4.1], [1, 1, 1]);
  mesh(scene, rim, "#b5a27b", [-3.2, 2.55, -3.88], [1, 1, 1]);
  mesh(scene, pane, "#a3c5ce", [-3.2, 2.55, -4.12], [1, 1, 1]);
  const instrument = new THREE.Group(); instrument.position.set(-3.2, 2.55, -3.8); scene.add(instrument);
  for (let i = 0; i < 3; i++) {
    const ring = mesh(instrument, orbit, "#b5a27b", [0, 0, 0], [1, 1, 1]); ring.rotation.set(i * .7, i * .8, i * .5);
  }
  orb(instrument, "#e8d6ab", [0, 0, 0], [.12, .12, .12]);
  block(scene, "#a9bdbb", [3.2, 1.05, -3.55], [5.2, .6, .9]);
  for (const x of [1.25, 5.1]) {
    block(scene, "#9d8b75", [x, 1.65, -3.7], [1.1, .08, .55]);
    for (let i = 0; i < 3; i++) block(scene, ["#3d6a7b", "#b5a27b", "#7d9690"][i], [x - .25 + i * .22, 1.86, -3.7], [.16, .35 + i * .06, .25]);
  }
  for (const x of [-5.3, 5.3]) {
    mesh(scene, cylinder, "#d5e1dd", [x, .42, 2.9], [.38, .75, .38]);
    for (let i = 0; i < 5; i++) {
      const leaf = orb(scene, "#668c7d", [x + Math.sin(i * 2) * .17, .9 + i * .08, 2.9 + Math.cos(i * 2) * .15], [.13, .36, .1]); leaf.rotation.z = Math.sin(i * 2) * .65;
    }
  }
  // Brass-framed in-room music screen. Raycast and DOM entry point share one dialog.
  const tv = new THREE.Group(); tv.position.set(3.15, 2.75, -3.8); tv.userData.music = true; scene.add(tv);
  block(tv, "#496572", [0, 0, 0], [3.2, 1.83, .2]);
  block(tv, "#b5a27b", [0, 0, .1], [3.02, 1.68, .06]);
  const screen = document.createElement("canvas"); screen.width = 512; screen.height = 288;
  const screenTexture = new THREE.CanvasTexture(screen); screenTexture.colorSpace = THREE.SRGBColorSpace;
  textures.push(screenTexture);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });
  const screenGeometry = new THREE.PlaneGeometry(2.94, 1.62); geometries.push(screenGeometry);
  const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial); screenMesh.position.z = .15; tv.add(screenMesh);
  const updateTitle = (title: string) => {
    const ctx = screen.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#153e42"; ctx.fillRect(0, 0, 512, 288);
    ctx.textAlign = "center"; ctx.fillStyle = "#d3bc83"; ctx.font = "64px sans-serif"; ctx.fillText("♫", 256, 94);
    ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#e7efdf";
    const words = title.split(/\s+/); let line = "", y = 140, lines = 0;
    for (const word of words) {
      if (ctx.measureText(line + word).width > 450 && line) {
        ctx.fillText(line.trim(), 256, y); y += 30; line = ""; lines++;
        if (lines === 2) break;
      }
      line += word + " ";
    }
    if (lines < 2) ctx.fillText(line.trim(), 256, y);
    ctx.font = "18px sans-serif"; ctx.fillStyle = "#aecac2"; ctx.fillText("Nhạc phòng chọn", 256, 250);
    screenTexture.needsUpdate = true;
  };
  // Lanterns pool warm light without many expensive dynamic shadow maps.
  for (const x of [.1]) {
    block(scene, "#496572", [x, 4.2, -3.2], [.03, .7, .03]);
    const lantern = orb(scene, "#efc47e", [x, 3.72, -3.2], [.28, .19, .28]);
    lantern.material = new THREE.MeshStandardMaterial({ color: "#f4d49b", emissive: "#d9a34e", emissiveIntensity: .7 });
    materials.set(`lantern${x}`, lantern.material);
    const light = new THREE.PointLight("#ffd59b", 3, 6, 2); light.position.set(x, 3.5, -3); scene.add(light);
  }
  const environmentCleanup = batch(scene);
  const furniture = new THREE.Group(); scene.add(furniture);
  let furnitureCleanup = () => {};
  const characters = new Map<string, THREE.Group>();
  let slots = "", current: WorldState = { seats: [], resting: false, synchronized: true, title: "" };
  function desk(x: number, z: number) {
    const root = new THREE.Group(); root.position.set(x, 0, z); furniture.add(root);
    block(root, "#9d8b75", [0, 1.02, 0], [1.9, .13, 1.12]);
    block(root, "#c9b69e", [0, 1.1, 0], [1.95, .08, 1.16]);
    for (const dx of [-.75, .75]) for (const dz of [-.38, .38]) block(root, "#496572", [dx, .5, dz], [.08, 1, .08]);
    block(root, "#527c82", [0, .63, -.87], [.85, .15, .65]);
    block(root, "#527c82", [0, 1.03, -1.1], [.85, .7, .15]);
    for (const dx of [-.33, .33]) block(root, "#496572", [dx, .31, -.85], [.07, .62, .07]);
    const book = block(root, "#e1e9e2", [0, 1.17, .06], [.65, .04, .45]); book.rotation.y = -.1;
    block(root, "#9db5bc", [0, 1.2, .06], [.02, .01, .45]);
    mesh(root, cylinder, "#527c82", [-.64, 1.25, .1], [.1, .2, .1]);
  }
  function character(id: string) {
    const look = memberLook(id), root = new THREE.Group(); root.userData.memberId = id;
    const shirt = ["#588f86", "#657fa1", "#ad795d", "#8877a1", "#ac995f"][look.color];
    const skin = ["#e2bba0", "#c99473", "#a7785c"][look.hair];
    const hair = ["#3d3533", "#725341", "#383540"][look.hair];
    orb(root, shirt, [0, 1.08, -.8], [.3, .4, .22]);
    block(root, "#e1e9e2", [0, 1.34, -.57], [.2, .08, .08]);
    orb(root, skin, [0, 1.68, -.76], [.29, .32, .27]);
    orb(root, hair, [0, 1.85, -.85], [.3, .2, .25]);
    for (let i = 0; i < 3; i++) {
      const fringe = orb(root, hair, [-.14 + i * .13, 1.89, -.62], [.12, .08, .15]); fringe.rotation.z = -.3;
    }
    for (const dx of [-.115, .115]) {
      orb(root, "#303b37", [dx, 1.68, -.501], [.028, .034, .018]);
      orb(root, skin, [dx * 2.55, 1.67, -.76], [.06, .09, .05]);
    }
    orb(root, skin, [0, 1.59, -.483], [.04, .045, .045]);
    for (const dx of [-.18, .18]) {
      block(root, "#496572", [dx, .67, -.55], [.19, .45, .22]);
      orb(root, "#303b37", [dx, .4, -.4], [.14, .1, .23]);
      const arm = orb(root, shirt, [dx * 1.7, 1.13, -.46], [.105, .13, .31]); arm.rotation.x = -.25;
      orb(root, skin, [dx * 1.8, 1.15, -.12], [.09, .08, .12]);
    }
    const pen = block(root, "#caa45a", [.3, 1.2, -.04], [.025, .24, .025]); pen.rotation.z = -.4;
    root.userData.disposeBatches = batch(root);
    scene.add(root); characters.set(id, root); return root;
  }
  let disposed = false, visible = true, intersecting = true, pageHidden = false, frame = 0, lastFrame = 0, renders = 0, animatedRenders = 0;
  host.dataset.animatedFrames = "0";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const render = () => {
    if (disposed || !visible || !intersecting || pageHidden || document.hidden) return;
    renderer.render(scene, camera); host.dataset.frames = String(++renders);
    host.dataset.drawCalls = String(renderer.info.render.calls);
  };
  function animate(time: number) {
    frame = 0;
    if (disposed || !visible || !intersecting || pageHidden || document.hidden) return;
    // Check at the scheduling boundary as well as the media change event. A queued
    // frame can observe the preference before a browser dispatches that event.
    if (motion.matches) {
      host.dataset.motion = "reduced";
      characters.forEach(person => { person.rotation.x = 0; });
      render();
      return;
    }
    if (time - lastFrame >= 1000 / 24) {
      lastFrame = time;
      for (const [id, person] of characters) {
        const active = current.synchronized && current.seats.some(s => s.id === id && s.online);
        person.rotation.x = active && !motion.matches ? Math.sin(time / 1600 + memberLook(id).delay) * .012 : 0;
      }
      render();
      host.dataset.animatedFrames = String(++animatedRenders);
    }
    if (!motion.matches && current.synchronized && current.seats.some(s => s.id && s.online)) frame = requestAnimationFrame(animate);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0;
    if (motion.matches) characters.forEach(person => { person.rotation.x = 0; });
    render();
    if (!disposed && visible && intersecting && !pageHidden && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
    host.dataset.motion = motion.matches ? "reduced" : "enabled";
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const span = Math.max(5.35, 8.2 / aspect);
    Object.assign(camera, { left: -span * aspect, right: span * aspect, top: span, bottom: -span });
    camera.updateProjectionMatrix(); render();
  }
  const observer = new ResizeObserver(resize); observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; resume(); }); intersection.observe(host);
  const raycaster = new THREE.Raycaster();
  function pick(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hits = raycaster.intersectObjects([...characters.values(), tv], true);
    if (!hits.length) return;
    let object: THREE.Object3D | null = hits[0].object;
    while (object) {
      if (object.userData.memberId) { onPick({ memberId: object.userData.memberId }); return; }
      if (object.userData.music) { onPick({ music: true }); return; }
      object = object.parent;
    }
  }
  function lost(event: Event) { event.preventDefault(); cancelAnimationFrame(frame); onLost(); }
  function pageHide() { pageHidden = true; cancelAnimationFrame(frame); frame = 0; }
  function pageShow() { pageHidden = false; resume(); }
  canvas.addEventListener("pointerup", pick); canvas.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", resume); motion.addEventListener("change", resume);
  window.addEventListener("pagehide", pageHide); window.addEventListener("pageshow", pageShow);
  resize();
  return {
    update(next: WorldState) {
      if (current.dark !== next.dark) {
        const dark = !!next.dark;
        scene.background = new THREE.Color(dark ? "#173544" : "#dce8ec");
        ambient.color.set(dark ? "#9ac8ed" : "#e6f5ff"); ambient.intensity = dark ? 1.7 : 2.4;
        sun.color.set(dark ? "#bad9f1" : "#fff0d9"); sun.intensity = dark ? 2 : 3.2;
        const night: Record<string, string> = { "#d5e1dd": "#567785", "#e1e9e2": "#81959d", "#9db5bc": "#415f70", "#a9bdbb": "#4c6d78", "#a3c5ce": "#234f6a", "#c0aa90": "#887c70", "#c9b69e": "#a39681", "#70979b": "#527b89", "#527c82": "#395f71" };
        materials.forEach((mat, key) => { if (key.startsWith("#")) mat.color.set(dark ? night[key] ?? key : key); });
      }
      const nextSlots = next.seats.map(s => s.id ?? "_").join("|");
      if (slots !== nextSlots) {
        slots = nextSlots; furnitureCleanup(); furniture.clear();
        next.seats.forEach((s, i) => {
          const [x, z] = deskPosition(i, next.seats.length); desk(x, z);
          if (s.id) (characters.get(s.id) ?? character(s.id)).position.set(x, 0, z);
        });
        furnitureCleanup = batch(furniture, true);
        for (const [id, person] of characters) if (!next.seats.some(s => s.id === id)) { person.userData.disposeBatches(); scene.remove(person); characters.delete(id); }
      }
      for (const [id, person] of characters) {
        const online = next.synchronized && next.seats.some(s => s.id === id && s.online);
        person.scale.setScalar(online ? 1 : .97);
        person.rotation.z = online && next.resting ? -.035 : 0;
      }
      if (current.title !== next.title) updateTitle(next.title);
      current = next; resume();
    },
    setVisible(active: boolean) { visible = active; resume(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
      canvas.removeEventListener("pointerup", pick); canvas.removeEventListener("webglcontextlost", lost);
      document.removeEventListener("visibilitychange", resume); motion.removeEventListener("change", resume);
      window.removeEventListener("pagehide", pageHide); window.removeEventListener("pageshow", pageShow);
      environmentCleanup(); furnitureCleanup(); characters.forEach(p => p.userData.disposeBatches());
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      screenMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
