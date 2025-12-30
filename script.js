// Update year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle with ARIA
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('primary-nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', String(!expanded));
    navToggle.setAttribute('aria-expanded', String(!expanded));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nav.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Skip link focus
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
  skipLink.addEventListener('click', () => {
    const target = document.querySelector(skipLink.getAttribute('href'));
    if (target) target.setAttribute('tabindex', '-1'), target.focus();
  });
}

// Reveal on scroll (IntersectionObserver)
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    }),
    { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
  );
  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('revealed'));
}

/* Azure Maps integration */
let map, datasource, routeLayer;
const statusEl = document.getElementById('demo-status');
const comfortBtn = document.getElementById('comfortRouteBtn');

function initMap() {
  map = new atlas.Map('azureMap', {
    center: [77.4538, 28.6692], // Ghaziabad approx
    zoom: 11,
    style: 'road',
    language: 'en-US',
    authOptions: {
      authType: 'subscriptionKey',
      subscriptionKey: 'YOUR_AZURE_MAPS_KEY' // TODO: replace with your key
    }
  });

  map.events.add('ready', () => {
    datasource = new atlas.source.DataSource();
    map.sources.add(datasource);

    // Heat layers (quiet vs noisy)
    const noisyPoints = [
      [77.433, 28.650], [77.445, 28.655], [77.455, 28.665],
      [77.470, 28.640], [77.480, 28.645], [77.500, 28.635]
    ].map((c) => new atlas.data.Feature(new atlas.data.Point(c), { level: 1.0 }));

    const quietPoints = [
      [77.390, 28.700], [77.410, 28.690], [77.420, 28.715],
      [77.460, 28.700], [77.470, 28.720]
    ].map((c) => new atlas.data.Feature(new atlas.data.Point(c), { level: 0.2 }));

    const noisyDs = new atlas.source.DataSource();
    const quietDs = new atlas.source.DataSource();
    noisyDs.add(noisyPoints);
    quietDs.add(quietPoints);

    map.sources.add(noisyDs);
    map.sources.add(quietDs);

    map.layers.add(new atlas.layer.HeatMapLayer(quietDs, 'quiet-heat', {
      radius: 18,
      colorGradient: [
        'rgba(0,0,0,0)',
        'rgba(22,197,94,0.35)',
        'rgba(22,197,94,0.65)'
      ],
      opacity: 0.8,
      weightExpression: ['get', 'level']
    }));

    map.layers.add(new atlas.layer.HeatMapLayer(noisyDs, 'noisy-heat', {
      radius: 20,
      colorGradient: [
        'rgba(0,0,0,0)',
        'rgba(239,68,68,0.35)',
        'rgba(239,68,68,0.8)'
      ],
      opacity: 0.9,
      weightExpression: ['get', 'level']
    }));

    // Route layer placeholder
    routeLayer = new atlas.layer.LineLayer(datasource, 'comfort-route', {
      strokeColor: '#0EA5A2',
      strokeWidth: 5,
      lineJoin: 'round',
      lineCap: 'round',
      opacity: 0.9
    });
    map.layers.add(routeLayer);

    // Pins for origin/destination
    const origin = new atlas.data.Feature(new atlas.data.Point([77.4538, 28.6692]));
    const destination = new atlas.data.Feature(new atlas.data.Point([77.4316, 28.6384]));
    datasource.add([origin, destination]);

    map.layers.add(new atlas.layer.SymbolLayer(datasource, null, {
      iconOptions: { image: 'pin-round', allowOverlap: true },
      textOptions: { textField: ['get', 'name'], offset: [0, 1.2] }
    }));
  });
}

// Comfort-aware route (demo algorithm)
// - Sample two candidate polylines: fastest-ish and quieter detour
// - Compute a simple "noise penalty" by sampling nearby noisy points
// - Choose route with lower combined cost: distance + noisePenalty
function suggestComfortRoute() {
  if (!map || !datasource) return;
  statusEl.textContent = 'Analyzing routes for comfort...';
  comfortBtn.disabled = true;

  // Parse inputs
  const [olat, olon] = document.getElementById('origin').value.split(',').map((v) => parseFloat(v.trim()));
  const [dlat, dlon] = document.getElementById('destination').value.split(',').map((v) => parseFloat(v.trim()));
  const origin = [olon, olat];
  const dest = [dlon, dlat];

  // Candidate A: direct-ish path (straight segments)
  const routeA = new atlas.data.LineString([origin, [(origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2], dest]);

  // Candidate B: detour via quieter zone (nudged north)
  const mid = [(origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2 + 0.02];
  const routeB = new atlas.data.LineString([origin, mid, dest]);

  // Simple noise sampling: higher penalty near noisy points (mock)
  const noisySamples = [
    [77.445, 28.655], [77.455, 28.665], [77.480, 28.645], [77.500, 28.635]
  ];

  function routeCost(line) {
    const coords = line.coordinates;
    let dist = 0;
    for (let i = 1; i < coords.length; i++) {
      dist += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    }
    // Noise penalty: sum of inverse distance to noisy points
    let penalty = 0;
    coords.forEach((c) => {
      noisySamples.forEach((n) => {
        const d = Math.hypot(c[0] - n[0], c[1] - n[1]);
        penalty += 1 / Math.max(d, 0.0001);
      });
    });
    return dist + penalty * 0.2;
  }

  const costA = routeCost(routeA);
  const costB = routeCost(routeB);
  const chosen = costB < costA ? routeB : routeA;

  // Render chosen route
  datasource.remove((f) => f.type === 'LineString');
  datasource.add(new atlas.data.Feature(chosen));

  setTimeout(() => {
    statusEl.textContent = `Suggested route: ${costB < costA ? 'quieter detour' : 'direct path'} (comfort-aware)`;
    comfortBtn.disabled = false;
  }, 800);
}

// Initialize map after SDK loads
if (window.atlas) {
  initMap();
} else {
  console.error('Azure Maps SDK not loaded.');
}

// Demo button
if (comfortBtn) {
  comfortBtn.addEventListener('click', suggestComfortRoute);
}