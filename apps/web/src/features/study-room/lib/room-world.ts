import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { memberLook } from "./scene-seats";
import { deskPosition } from "./room-world-layout";

export interface WorldSeat { id: string | null; online: boolean }
export interface WorldState { seats: WorldSeat[]; resting: boolean; synchronized: boolean; title: string }
type Pick = { memberId: string } | { music: true };

/** Original procedural observatory. No remote assets; one disposable WebGL context. */
export function createRoomWorld(host: HTMLElement, onPick: (pick: Pick) => void, onLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#a7c6c9");
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 100);
  camera.position.set(11, 10, 15);
  camera.lookAt(0, 1, 0);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];
  const material = (color: string) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .85, flatShading: true }));
    return materials.get(color)!;
  };
  const box = new THREE.BoxGeometry(1, 1, 1);
  const sphere = new THREE.SphereGeometry(1, 12, 8);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
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
      const transformed = child.geometry.clone().applyMatrix4(inverse.clone().multiply(child.matrixWorld));
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
  scene.add(new THREE.HemisphereLight("#dff3ef", "#655340", 2.2));
  const sun = new THREE.DirectionalLight("#ffe4b4", 3.5);
  sun.position.set(-5, 10, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 30 });
  sun.shadow.normalBias = .04; scene.add(sun);
  // Floating stone foundation and individually laid, subtly varied wooden boards.
  block(scene, "#607e75", [0, -.5, 0], [12.7, .65, 8.8]);
  block(scene, "#345d59", [0, -.93, 0], [11.9, .3, 8]);
  for (let i = 0; i < 26; i++) {
    block(scene, ["#ba9470", "#b28c68", "#c39e76"][i % 3], [-6 + i * .48, -.1, 0], [.46, .2, 8.4]);
  }
  // Woven study rug and brass edging ground the desks within the room.
  block(scene, "#416e69", [0, .025, .6], [8.1, .025, 5.5]);
  for (const x of [-4, 4]) block(scene, "#d3b678", [x, .045, .6], [.06, .015, 5.4]);
  for (const z of [-2.1, 3.3]) block(scene, "#d3b678", [0, .045, z], [8.05, .015, .06]);
  for (let i = 0; i < 12; i++) block(scene, "#679085", [-3.7 + i * .67, .045, .6], [.02, .015, 5.3]);
  // Open cutaway: heavy beams, pale masonry, an arched mountain outlook.
  for (const x of [-6, -.5, 6]) {
    block(scene, "#526d67", [x, 2.2, -4.1], [.38, 4.4, .45]);
    block(scene, "#c0b48c", [x, .4, -4.1], [.68, .8, .68]);
  }
  block(scene, "#526d67", [0, 4.3, -4.1], [12.6, .45, .5]);
  block(scene, "#879990", [-6.15, 1.1, -1.3], [.3, 2.2, 5.6]);
  block(scene, "#bfbe9c", [-6.15, 2.3, -1.3], [.4, .2, 5.7]);
  block(scene, "#9ba994", [0, .6, -4.25], [12, 1.2, .3]);
  block(scene, "#d4c69c", [0, 1.25, -4.1], [12.2, .18, .55]);
  // Original arch, built from beveled-looking radial stones rather than a borrowed asset.
  for (let i = 0; i <= 14; i++) {
    const angle = Math.PI * i / 14;
    const stone = block(scene, i % 2 ? "#dfd4b4" : "#c7c4a4",
      [-3.1 + 2.05 * Math.cos(angle), 2 + 2.05 * Math.sin(angle), -4.05], [.46, .36, .6]);
    stone.rotation.z = angle - Math.PI / 2;
  }
  for (const x of [-5.15, -1.05]) block(scene, "#d6cdb0", [x, 1.6, -4.05], [.36, .9, .6]);
  // Mountain silhouettes beyond the outlook; a soft sun and clustered conifers.
  const cone = new THREE.ConeGeometry(1, 1, 5); geometries.push(cone);
  for (let i = 0; i < 7; i++) {
    mesh(scene, cone, i % 2 ? "#699396" : "#83a9a2", [-8 + i * 2.6, 1.1, -8 - (i % 2)], [3.1, 5 + i % 3, 1.2]);
  }
  orb(scene, "#f3d9a2", [-4.7, 4.1, -9], [.65, .65, .2]);
  for (let i = 0; i < 6; i++) {
    mesh(scene, cone, "#406f64", [-5.8 + i * .95, .9, -5.5], [.45, 2.4, .45]);
    block(scene, "#6c604c", [-5.8 + i * .95, .1, -5.5], [.12, 1, .12]);
  }
  // Bookshelves: varied spines, pottery and hanging foliage.
  for (const y of [1.5, 2.6, 3.7]) {
    block(scene, "#665743", [3.5, y, -3.85], [4.3, .13, .7]);
    for (let b = 0; b < 12; b++) {
      const book = block(scene, ["#8b6c53", "#416c71", "#c9ab6c", "#7e8870", "#a27667"][b % 5],
        [1.8 + b * .29, y + .25 + b % 3 * .04, -3.85], [.2, .4 + b % 3 * .08, .35]);
      book.rotation.z = b % 5 === 0 ? -.12 : 0;
    }
  }
  for (let i = 0; i < 18; i++) {
    const leaf = orb(scene, i % 2 ? "#527a55" : "#749269", [-5.7 + Math.sin(i * .8) * .2, 4.3 - i * .12, -3.7], [.2, .12, .15]);
    leaf.rotation.z = i * .9;
  }
  for (const x of [-5.5, 5.5]) {
    mesh(scene, cylinder, "#987449", [x, .38, 3.2], [.4, .7, .4]);
    for (let i = 0; i < 6; i++) orb(scene, "#5e855d", [x + Math.sin(i) * .2, .8 + i * .1, 3.2 + Math.cos(i) * .2], [.28, .2, .28]);
  }
  // Brass-framed in-room music screen. Raycast and DOM entry point share one dialog.
  const tv = new THREE.Group(); tv.position.set(.1, 2.35, -3.3); tv.userData.music = true; scene.add(tv);
  block(tv, "#ae9258", [0, 0, 0], [2.3, 1.4, .2]);
  block(tv, "#21494e", [0, 0, .12], [2.08, 1.18, .04]);
  const screen = document.createElement("canvas"); screen.width = 512; screen.height = 288;
  const screenTexture = new THREE.CanvasTexture(screen); screenTexture.colorSpace = THREE.SRGBColorSpace;
  textures.push(screenTexture);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });
  const screenGeometry = new THREE.PlaneGeometry(2.02, 1.12); geometries.push(screenGeometry);
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
  for (const x of [-.55, 5.9]) {
    block(scene, "#62523e", [x, 3.35, -3.6], [.12, .55, .12]);
    const lantern = orb(scene, "#efc47e", [x, 3, -3.6], [.2, .3, .2]);
    lantern.material = new THREE.MeshStandardMaterial({ color: "#f4d49b", emissive: "#d9a34e", emissiveIntensity: .7 });
    materials.set(`lantern${x}`, lantern.material);
    const light = new THREE.PointLight("#ffd59b", 5, 6, 2); light.position.set(x, 2.9, -3); scene.add(light);
  }
  const environmentCleanup = batch(scene);
  const furniture = new THREE.Group(); scene.add(furniture);
  let furnitureCleanup = () => {};
  const characters = new Map<string, THREE.Group>();
  let slots = "", current: WorldState = { seats: [], resting: false, synchronized: true, title: "" };
  function desk(x: number, z: number) {
    const root = new THREE.Group(); root.position.set(x, 0, z); furniture.add(root);
    block(root, "#86684d", [0, 1.02, 0], [1.9, .16, 1.12]);
    block(root, "#cbac78", [0, 1.12, 0], [1.95, .08, 1.16]);
    for (const dx of [-.75, .75]) for (const dz of [-.38, .38]) block(root, "#5f5943", [dx, .5, dz], [.11, 1, .11]);
    block(root, "#466e68", [0, .65, -.85], [.85, .15, .65]);
    block(root, "#486c63", [0, 1.02, -1.1], [.85, .8, .12]);
    for (const dx of [-.33, .33]) block(root, "#5f5943", [dx, .35, -.85], [.09, .7, .09]);
    const book = block(root, "#efdfb0", [0, 1.18, .06], [.65, .07, .45]); book.rotation.y = -.1;
    block(root, "#a2a181", [0, 1.225, .06], [.02, .01, .45]);
    mesh(root, cylinder, "#5d8782", [-.64, 1.25, .1], [.12, .23, .12]);
    block(root, "#ae9258", [.68, 1.35, -.3], [.05, .45, .05]);
    orb(root, "#ead7a1", [.65, 1.6, -.28], [.18, .08, .16]);
  }
  function character(id: string) {
    const look = memberLook(id), root = new THREE.Group(); root.userData.memberId = id;
    const shirt = ["#588f86", "#657fa1", "#ad795d", "#8877a1", "#ac995f"][look.color];
    const skin = ["#dcb494", "#c99473", "#b78062"][look.hair];
    orb(root, shirt, [0, 1.05, -.8], [.33, .42, .25]);
    // Cloak shoulder and neck scarf distinguish the original scholar silhouettes.
    orb(root, "#d0bc80", [0, 1.32, -.77], [.35, .09, .26]);
    orb(root, skin, [0, 1.65, -.79], [.25, .3, .24]);
    orb(root, ["#4b3e35", "#705440", "#423a42"][look.hair], [0, 1.85, -.84], [.27, .16, .26]);
    const hat = orb(root, shirt, [.03, 1.98, -.86], [.34, .08, .28]); hat.rotation.z = -.18;
    for (const dx of [-.09, .09]) orb(root, "#303b37", [dx, 1.68, -.555], [.022, .035, .02]);
    for (const dx of [-.18, .18]) {
      block(root, "#3e5051", [dx, .55, -.55], [.21, .45, .22]);
      orb(root, "#514c41", [dx, .31, -.44], [.15, .1, .26]);
      const arm = orb(root, shirt, [dx * 1.8, 1.14, -.46], [.12, .15, .35]); arm.rotation.x = -.25;
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
