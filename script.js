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

// Community Reports Storage
const communityReports = {
  noise: [],
  crowds: [],
  construction: []
};

// AI Comfort Prediction Engine
const comfortAI = {
  predict: function (location, time) {
    const hour = new Date(time).getHours();
    const baseComfort = 0.7;
    const rushHourPenalty = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19) ? -0.3 : 0;
    const nearbyReports = this.getNearbyReports(location);
    const reportPenalty = nearbyReports.length * -0.1;
    return Math.max(0, Math.min(1, baseComfort + rushHourPenalty + reportPenalty));
  },
  getNearbyReports: function (location) {
    return [...communityReports.noise, ...communityReports.crowds, ...communityReports.construction]
      .filter(r => Math.hypot(r.coords[0] - location[0], r.coords[1] - location[1]) < 0.02);
  }
};

// Report Noise Zone
function reportNoiseZone(coords, level, description) {
  fetch('http://localhost:3000/api/reports/noise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coords, level, description })
  })
    .then(res => res.json())
    .then(report => {
      communityReports.noise.push(report);
      addReportMarker(report, 'noise');
      updateReportsCount();
    })
    .catch(() => {
      const report = { coords, level, description, timestamp: Date.now() };
      communityReports.noise.push(report);
      addReportMarker(report, 'noise');
      updateReportsCount();
    });
}

// Report Crowded Area
function reportCrowdedArea(coords, density, description) {
  fetch('http://localhost:3000/api/reports/crowd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coords, density, description })
  })
    .then(res => res.json())
    .then(report => {
      communityReports.crowds.push(report);
      addReportMarker(report, 'crowd');
      updateReportsCount();
    })
    .catch(() => {
      const report = { coords, density, description, timestamp: Date.now() };
      communityReports.crowds.push(report);
      addReportMarker(report, 'crowd');
      updateReportsCount();
    });
}

// Report Construction Zone
function reportConstruction(coords, description) {
  fetch('http://localhost:3000/api/reports/construction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coords, description })
  })
    .then(res => res.json())
    .then(report => {
      communityReports.construction.push(report);
      addReportMarker(report, 'construction');
      updateReportsCount();
    })
    .catch(() => {
      const report = { coords, description, timestamp: Date.now() };
      communityReports.construction.push(report);
      addReportMarker(report, 'construction');
      updateReportsCount();
    });
}

// Load reports from backend
function loadReports() {
  fetch('http://localhost:3000/api/reports')
    .then(res => res.json())
    .then(data => {
      communityReports.noise = data.noise;
      communityReports.crowds = data.crowds;
      communityReports.construction = data.construction;
      data.noise.forEach(r => addReportMarker(r, 'noise'));
      data.crowds.forEach(r => addReportMarker(r, 'crowd'));
      data.construction.forEach(r => addReportMarker(r, 'construction'));
      updateReportsCount();
    })
    .catch(() => console.log('Backend offline, using local mode'));
}

// Add marker to map
function addReportMarker(report, type) {
  if (!map || !datasource) return;
  const colors = { noise: '#ef4444', crowd: '#f59e0b', construction: '#8b5cf6' };
  const point = new atlas.data.Feature(new atlas.data.Point(report.coords), {
    type,
    color: colors[type],
    description: report.description
  });
  datasource.add(point);
}

// Update map with community reports
function updateMapWithReports() {
  if (!map || !datasource) return;
  const allReports = [...communityReports.noise, ...communityReports.crowds, ...communityReports.construction];
  allReports.forEach(report => {
    const point = new atlas.data.Feature(new atlas.data.Point(report.coords), { type: 'report' });
    datasource.add(point);
  });
}

// Update community reports count in UI
function updateReportsCount() {
  const counter = document.getElementById('community-reports-count');
  if (counter) {
    const total = communityReports.noise.length + communityReports.crowds.length + communityReports.construction.length;
    counter.textContent = `${total} community reports`;
  }
}

window.reportNoiseZone = reportNoiseZone;
window.reportCrowdedArea = reportCrowdedArea;
window.reportConstruction = reportConstruction;
window.comfortAI = comfortAI;
window.communityReports = communityReports;
window.updateReportsCount = updateReportsCount;
window.loadReports = loadReports;

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

    loadReports();

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
      iconOptions: {
        image: 'marker-red',
        allowOverlap: true,
        size: 0.8
      },
      filter: ['any', ['==', ['get', 'type'], 'noise'], ['==', ['get', 'type'], 'crowd'], ['==', ['get', 'type'], 'construction']]
    }));

    // Add popup on marker click
    map.events.add('click', datasource, (e) => {
      if (e.shapes && e.shapes.length > 0) {
        const props = e.shapes[0].getProperties();
        if (props.description) {
          new atlas.Popup({
            content: `<div style="padding:10px"><b>${props.type}</b><br>${props.description}</div>`,
            position: e.shapes[0].getCoordinates()
          }).open(map);
        }
      }
    });
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

  // Add community-reported zones
  communityReports.noise.forEach(r => noisyZones.push(r.coords));
  communityReports.construction.forEach(r => noisyZones.push(r.coords));

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
if (window.atlas && document.getElementById('azureMap')) {
  initMap();
} else if (!document.getElementById('azureMap')) {
  console.log('Azure Maps not needed on this page');
} else {
  console.error('Azure Maps SDK not loaded.');
}

// Add event listener for index.html demo button only
document.addEventListener('DOMContentLoaded', () => {
  // Only run on index.html (check for Azure Maps element)
  if (document.getElementById('azureMap')) {
    const findRouteBtn = document.getElementById('findRouteBtn');
    if (findRouteBtn && window.planComfortableRoute) {
      findRouteBtn.addEventListener('click', () => {
        const originInput = document.getElementById('startInput');
        const destInput = document.getElementById('endInput');

        if (originInput && destInput) {
          const origin = [77.4538, 28.6692];
          const destination = [77.4316, 28.6384];
          window.planComfortableRoute(origin, destination);
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
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`Location precision: ${accuracy}m`);

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
            let errorMsg = 'Could not get your location.';
            if (error.code === error.TIMEOUT) errorMsg = 'Location request timed out. Please try again or enter manually.';
            alert(errorMsg);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    });
  }

  if (findRouteBtn) {
    findRouteBtn.addEventListener('click', (e) => {
      // Use a more robust check: if these specific inputs exist, we are on the demo section
      const isDemoFormExist = originInput && destinationInput && findRouteBtn.closest('.demo-form');

      if (isDemoFormExist) {
        const start = originInput.value;
        const end = destinationInput.value;

        if (start || end) {
          const params = new URLSearchParams();
          if (start) params.append('start', start);
          if (end) params.append('end', end);

          // Use relative path for better compatibility with GitHub Pages/subfolders
          window.location.href = `Rivo.html?${params.toString()}`;
        } else {
          window.location.href = 'Rivo.html';
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