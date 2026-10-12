/* =========================================================
   Menu, nav highlight, contact form
   ========================================================= */
const header   = document.getElementById('header');
const menuBtn  = document.getElementById('menuBtn');
const navbar   = document.getElementById('navbar');
const navLinks = [...navbar.querySelectorAll('a')];

function setMenu(open) {
  menuBtn.classList.toggle('open', open);
  navbar.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn.addEventListener('click', () => setMenu(!navbar.classList.contains('open')));
navLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 860) setMenu(false); });

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// highlight the link of the section currently in view
const sections = [...document.querySelectorAll('main section[id]')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

// contact form (front-end only – connect a service such as Formspree to really send)
const form   = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', e => {
  e.preventDefault();
  status.textContent = 'Thanks! Your message is ready to send.';
  form.reset();
});

/* =========================================================
   Three.js background: particle field + wireframe shapes
   - reacts to mouse / touch
   - drifts with page scroll
   - lighter on phones, static for "reduce motion"
   ========================================================= */
(function initThree() {
  if (typeof THREE === 'undefined') return; // CDN blocked / offline: page still works

  const canvas = document.getElementById('bg');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile() });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d0d0d, 0.045);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 8;

  const PURPLE = 0x7c3aed;
  const LILAC  = 0xd8b4fe;

  // --- particles
  const COUNT = isMobile() ? 700 : 1800;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: LILAC, size: 0.045, transparent: true, opacity: 0.8, depthWrite: false })
  );
  scene.add(particles);

  // --- floating wireframe shapes
  const group = new THREE.Group();
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6, 1),
    new THREE.MeshBasicMaterial({ color: PURPLE, wireframe: true, transparent: true, opacity: 0.55 })
  );
  group.add(core);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.6, 0.04, 160, 8, 2, 3),
    new THREE.MeshBasicMaterial({ color: LILAC, transparent: true, opacity: 0.35 })
  );
  group.add(knot);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.015, 8, 120),
    new THREE.MeshBasicMaterial({ color: PURPLE, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = Math.PI / 2.4;
  group.add(ring);

  // --- sizing: on small screens the shape sits behind the content, smaller and dimmer
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    if (isMobile()) {
      group.scale.setScalar(0.65);
      group.position.set(0, 1.2, -2);
    } else {
      group.scale.setScalar(1);
      group.position.set(w > 1100 ? -3.2 : 0, 0, 0); // sits beside the hero image on wide screens
    }
  }
  resize();
  window.addEventListener('resize', resize);

  // --- input
  const mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  function setTarget(cx, cy) {
    target.x = (cx / window.innerWidth) * 2 - 1;
    target.y = (cy / window.innerHeight) * 2 - 1;
  }
  window.addEventListener('pointermove', e => setTarget(e.clientX, e.clientY), { passive: true });

  let scrollProgress = 0;
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- loop

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); loop(); }
  });

  function render(t) {
    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    core.rotation.x = t * 0.25 + mouse.y * 0.6;
    core.rotation.y = t * 0.35 + mouse.x * 0.6;
    knot.rotation.x = -t * 0.12;
    knot.rotation.y = t * 0.18;
    ring.rotation.z = t * 0.2;

    particles.rotation.y = t * 0.02 + mouse.x * 0.15;
    particles.rotation.x = mouse.y * 0.1;

    // scroll: fly through the particle field and tilt the shapes

    
    camera.position.y = -scrollProgress * 6;
    group.position.y = (isMobile() ? 1.2 : 0) - scrollProgress * 6;
    camera.position.x = mouse.x * 0.4;
    camera.lookAt(camera.position.x, camera.position.y, 0);

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    render(clock.getElapsedTime());
    requestAnimationFrame(loop);
  }

  if (reduceMotion) render(0); // single still frame
  else loop();
})();
