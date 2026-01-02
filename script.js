// Update year (Handled by layout.js)
// document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle with ARIA (Handled by layout.js)
// const navToggle = document.querySelector('.nav-toggle');
// const nav = document.getElementById('primary-nav');
// if (navToggle && nav) {
//   navToggle.addEventListener('click', () => {
//     const expanded = nav.getAttribute('aria-expanded') === 'true';
//     nav.setAttribute('aria-expanded', String(!expanded));
//     navToggle.setAttribute('aria-expanded', String(!expanded));
//   });
//   document.addEventListener('keydown', (e) => {
//     if (e.key === 'Escape') {
//       nav.setAttribute('aria-expanded', 'false');
//       navToggle.setAttribute('aria-expanded', 'false');
//     }
//   });
// }

// Skip link focus (Handled by layout.js)
// const skipLink = document.querySelector('.skip-link');
// if (skipLink) {
//   skipLink.addEventListener('click', () => {
//     const target = document.querySelector(skipLink.getAttribute('href'));
//     if (target) target.setAttribute('tabindex', '-1'), target.focus();
//   });
// }

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

/* 3D stage interaction: tilt and parallax */
(() => {
  const stageWrap = document.querySelector('.three-d-stage');
  const stage = document.querySelector('.stage');
  if (!stageWrap || !stage) return;

  const maxTilt = 8; // degrees
  const depthMap = {
    'card--panel': 40,
    'card--map': 10
  };

  function setTransform(xDeg, yDeg) {
    // read CSS scale (responsive) and apply with rotation
    const rootStyle = getComputedStyle(document.documentElement);
    const scaleVal = parseFloat(rootStyle.getPropertyValue('--stage-scale')) || 1;
    stage.style.transform = `rotateX(${xDeg}deg) rotateY(${yDeg}deg) scale(${scaleVal})`;
    // parallax child cards (use CSS variable depths where possible)
    stage.querySelectorAll('.card').forEach((c) => {
      const isPanel = c.classList.contains('card--panel');
      const depthCss = isPanel ? rootStyle.getPropertyValue('--card-panel-depth') : rootStyle.getPropertyValue('--card-map-depth');
      const depth = depthCss ? depthCss.trim() : (isPanel ? '40px' : '10px');
      c.style.transform = `translateZ(${depth})`;
    });
  }

  function onMove(e) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = stageWrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = (clientX - cx) / rect.width;
    const dy = (clientY - cy) / rect.height;
    const yDeg = dx * maxTilt;
    const xDeg = -dy * maxTilt;
    setTransform(xDeg, yDeg);
  }

  function onLeave() { setTransform(0, 0); }

  stageWrap.addEventListener('mousemove', onMove);
  stageWrap.addEventListener('touchmove', onMove, { passive: true });
  stageWrap.addEventListener('mouseleave', onLeave);
  stageWrap.addEventListener('touchend', onLeave);
})();

/* Azure Maps integration */
let map, datasource, routeLayer;

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

// Function to plan and display comfortable route from external form data
function planComfortableRoute(originCoords, destCoords) {
  if (!map || !datasource) {
    console.error('Map not initialized');
    return;
  }

  // Clear existing routes and pins
  datasource.clear();

  // Add new origin and destination pins
  const origin = new atlas.data.Feature(new atlas.data.Point(originCoords), { name: 'Origin' });
  const destination = new atlas.data.Feature(new atlas.data.Point(destCoords), { name: 'Destination' });

  // Create comfort-aware route avoiding noisy areas
  const comfortRoute = generateComfortRoute(originCoords, destCoords);

  datasource.add([origin, destination, new atlas.data.Feature(comfortRoute)]);

  // Center map on the route
  const bounds = atlas.data.BoundingBox.fromData([origin, destination]);
  map.setCamera({ bounds: bounds, padding: 50 });
}

// Generate comfort-aware route that avoids noisy zones
function generateComfortRoute(origin, dest) {
  const noisyZones = [
    [77.445, 28.655], [77.455, 28.665], [77.480, 28.645], [77.500, 28.635]
  ];

  // Calculate waypoints that avoid noisy areas
  const midLat = (origin[1] + dest[1]) / 2;
  const midLon = (origin[0] + dest[0]) / 2;

  // Check if direct path passes through noisy zones
  let needsDetour = false;
  noisyZones.forEach(zone => {
    const distToZone = Math.hypot(midLon - zone[0], midLat - zone[1]);
    if (distToZone < 0.01) needsDetour = true;
  });

  if (needsDetour) {
    // Create detour through quieter areas
    const waypoint1 = [midLon - 0.01, midLat + 0.005];
    const waypoint2 = [midLon + 0.005, midLat - 0.01];
    return new atlas.data.LineString([origin, waypoint1, waypoint2, dest]);
  } else {
    // Direct route is safe
    return new atlas.data.LineString([origin, dest]);
  }
}

// Expose function globally for external access
window.planComfortableRoute = planComfortableRoute;
//FEDBACK
//header footer to every psage 


// Initialize map after SDK loads
if (window.atlas) {
  initMap();
} else {
  console.error('Azure Maps SDK not loaded.');
}

// Add event listener for harbor.html route button
document.addEventListener('DOMContentLoaded', () => {
  const findRouteBtn = document.getElementById('findRouteBtn');
  if (findRouteBtn) {
    // Check if this is the harbor.html page (has the calculateAndDisplayRoute function)
    if (typeof calculateAndDisplayRoute === 'function') {
      // Use the existing harbor.html functionality
      findRouteBtn.addEventListener('click', () => {
        calculateAndDisplayRoute(false);
      });
    } else {
      // Fallback for other pages
      findRouteBtn.addEventListener('click', () => {
        const originInput = document.getElementById('startInput');
        const destInput = document.getElementById('endInput');

        if (originInput && destInput) {
          const origin = [77.4538, 28.6692];
          const destination = [77.4316, 28.6384];

          if (window.planComfortableRoute) {
            window.planComfortableRoute(origin, destination);
          }
        }
      });
    }
  }
});

// Geolocation and Redirection for index.html Demo
document.addEventListener('DOMContentLoaded', () => {
  const locateBtn = document.getElementById('locate-origin');
  const originInput = document.getElementById('origin');
  const destinationInput = document.getElementById('destination');
  const findRouteBtn = document.querySelector('.demo-btn');

  if (locateBtn && originInput) {
    locateBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        const originalPlaceholder = originInput.placeholder;
        originInput.value = '';
        originInput.placeholder = 'Locating...';

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            originInput.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            originInput.placeholder = originalPlaceholder;

            // Try reverse geocoding with Nominatim (OSM)
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
              .then(res => res.json())
              .then(data => {
                if (data.display_name) {
                  originInput.value = data.display_name;
                }
              })
              .catch(err => console.error('Reverse geocoding failed:', err));
          },
          (error) => {
            console.error('Geolocation error:', error);
            originInput.placeholder = originalPlaceholder;
            alert('Could not get your location. Please enter it manually.');
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    });
  }

  if (findRouteBtn) {
    findRouteBtn.addEventListener('click', (e) => {
      // Only handle redirection if we are on index.html and NOT harbor.html
      const isHomePage = window.location.pathname.endsWith('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('sensorysafe/') ||
        window.location.pathname === '';

      if (isHomePage && originInput && destinationInput) {
        const start = originInput.value;
        const end = destinationInput.value;

        if (start || end) {
          const params = new URLSearchParams();
          if (start) params.append('start', start);
          if (end) params.append('end', end);

          window.location.href = `harbor.html?${params.toString()}`;
        } else {
          window.location.href = 'harbor.html';
        }
      }
    });
  }
});



// Contact Form Handling (EmailJS)
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.querySelector('#contact form');

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;

      // Set loading state
      submitBtn.innerText = 'Sending...';
      submitBtn.disabled = true;

      // Prepare params
      const serviceID = 'YOUR_SERVICE_ID'; // User to replace
      const templateID = 'YOUR_TEMPLATE_ID'; // User to replace

      // Send via EmailJS (sendForm automatically captures input values by name attribute)
      emailjs.sendForm(serviceID, templateID, this)
        .then(() => {
          alert('Message sent successfully!');
          this.reset();
        }, (err) => {
          alert('Failed to send message. Please try again later.'); // Will trigger until keys are valid
          console.error('EmailJS Error:', err);
        })
        .finally(() => {
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
        });
    });
  }
});