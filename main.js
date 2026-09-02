import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

////////////////////////

const loader = new THREE.TextureLoader();
const texture = loader.load("assets/fih1.png");
// someTexture.offset.set(xOffset, yOffset);
// texture.colorSpace = THREE.SRGBColorSpace;

////////////////////////

// Fish Sine
function fishSine(x, t, freq = 1, offset = 0) {
  return (x * 0.1 + 0.2) * Math.sin((x - t / 12) * freq + offset);
}

// Search
const eps = 0.1;
function nextFishPoint(x, y, t, q, f, o) {
  let l = q * 0.5;
  let r = q;
  // mid_dist = 0;
  while (r - l > eps) {
    let mid = (l + r) / 2;
    let mid_y = fishSine(x + mid, t, f, o);

    let mid_dist = Math.hypot(mid, mid_y - y);

    if (mid_dist > q) {
      r = mid;
    } else {
      l = mid;
    }
  }

  let mid = (l + r) / 2;

  return x + mid;
}

/////////////////////////

function makeFish(w, h, seg, amp, freq, offset) {
  const children = [];
  /** @type {THREE.Mesh} */
  let last;

  const q = w / seg;

  console.log(w, h, seg);

  const mesh = new THREE.Group();

  for (let i = 0; i < seg; i++) {
    const newTex = texture.clone();
    const material = new THREE.MeshBasicMaterial({
      // color: new THREE.Color(i / seg, 1 - i / seg, 0, 0.5),
      map: newTex,
      side: THREE.DoubleSide,
      transparent: true,
    });

    newTex.repeat = new THREE.Vector2(1 / seg, 1);
    newTex.offset = new THREE.Vector2(i / seg, 0);

    const pivot = new THREE.Group();

    const geometry = new THREE.PlaneGeometry(q, h);
    const plane = new THREE.Mesh(geometry, material);

    pivot.add(plane);
    plane.position.set(q / 2, 0, 0);
    children.push(pivot);

    if (last != null) last.attach(pivot);
    last = pivot;

    pivot.position.set(q, 0, 0);
    console.log(children);
  }

  mesh.add(children[0]);
  scene.add(mesh);

  const render = (time) => {
    const q = w / seg;

    const timeConst = 1 / 30;

    const tt = time * timeConst;

    let last_x = 0;
    let last_y = amp * fishSine(0, tt, freq, offset);

    children[0].position.y = last_y;

    children.forEach((c, i) => {
      const nx = nextFishPoint(last_x, last_y, tt, q);
      const ny = amp * fishSine(nx, tt, freq, offset);

      c.rotation.y = Math.atan2(ny - last_y, nx - last_x);

      last_x = nx;
      last_y = ny;
    });
  };

  const setPos = (x, y, z) => {
    if (x instanceof Object) {
      y = x.y;
      z = x.z;
      x = x.x;
    }
    if (x) mesh.position.x = x;
    if (y) mesh.position.y = y;
    if (z) mesh.position.z = z;
  };

  return {
    freq,
    w,
    mesh,
    offset,
    render,
    setPos,
  };
}

// const plane = new THREE.Mesh(geometry, material);

const fishes = [];

for(let i = 0; i < 20; i++) {
  const w = Math.random() * 3 + 1;
  const freq = Math.random() * 1.2 + 0.3;
  const offset = Math.random() * Math.PI;
  const fish = makeFish(w, w / 4, 5, w / 4, freq, offset);

  fish.setPos(
    (Math.random() * 2 - 1) * 5,
    (Math.random() * 2 - 1) * 8,
    (Math.random() * 2 - 1) * 3,
  );

  fishes.push(fish);
}

function animate(time) {

  fishes.forEach((fish) => {
    const angle = time * 0.00012 * fish.freq + 2 * fish.offset;
    const x = Math.sin(angle) * fish.w * 4;
    const z = Math.cos(angle) * fish.w * 4;
    fish.render(time);
    fish.setPos({ x, z });
    fish.mesh.rotation.y = Math.PI + angle;
  });
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
