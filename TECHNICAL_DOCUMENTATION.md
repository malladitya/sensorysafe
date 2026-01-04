# Rivo Navigation - Technical Documentation

## Overview
Rivo Navigation is a sensory-friendly navigation app designed for people with autism and sensory sensitivities. It uses AI and community data to find comfortable, low-stimulus routes.

---

## Core Features

### 1. **Sensory-Optimized Routing**
- **Technology**: Custom pathfinding algorithm
- **Function**: Prioritizes quiet streets, parks, and low-crowd areas
- **Implementation**: `generateComfortRoute()` in `script.js`
- **Data Sources**: Community reports, noise zones, crowd density

### 2. **AI Comfort Prediction Engine**
- **Algorithm**: Time-based comfort scoring with community feedback
- **Inputs**: 
  - Location coordinates
  - Time of day
  - Nearby community reports
- **Output**: Comfort score (0-1 scale)
- **Implementation**: `comfortAI.predict()` in `script.js`
- **Features**:
  - Rush hour detection (8-10 AM, 5-7 PM)
  - Proximity-based report analysis
  - Real-time scoring

### 3. **Community Reporting System**
- **Backend**: Node.js + Express REST API
- **Storage**: In-memory (upgradeable to database)
- **Report Types**:
  - Noise zones (traffic, construction)
  - Crowded areas (markets, stations)
  - Construction zones
- **API Endpoints**:
  - `POST /api/reports/noise`
  - `POST /api/reports/crowd`
  - `POST /api/reports/construction`
  - `GET /api/reports`
- **Features**:
  - GPS-based location capture
  - Timestamp tracking
  - Real-time map markers

### 4. **Interactive Map Visualization**
- **Platform**: Azure Maps SDK
- **Features**:
  - Heat map layers (quiet vs noisy zones)
  - Community report markers
  - Route visualization
  - 3D tilt effects
  - Responsive controls
- **Implementation**: `initMap()` in `script.js`

### 5. **Geolocation Services**
- **API**: HTML5 Geolocation API
- **Accuracy**: High-precision GPS
- **Features**:
  - Current location detection
  - Reverse geocoding (OpenStreetMap Nominatim)
  - Error handling with fallbacks
- **Implementation**: `helpers.js`

---

## Technical Stack

### Frontend
- **HTML5**: Semantic markup, accessibility features
- **CSS3**: Custom properties, responsive design, dark mode
- **JavaScript (ES6+)**: Modular architecture
- **Azure Maps SDK**: Map rendering and controls
- **EmailJS**: Contact form integration

### Backend
- **Runtime**: Node.js v24+
- **Framework**: Express.js
- **Middleware**: CORS, body-parser
- **Port**: 3000

### APIs & Services
- **Azure Maps**: Map visualization
- **Geolocation API**: GPS positioning
- **Nominatim**: Reverse geocoding
- **EmailJS**: Email notifications

---

## Architecture

### File Structure
```
sensorysafe/
├── index.html          # Main landing page
├── Rivo.html         # Navigation app interface
├── style.css           # Global styles
├── layout.css          # Layout components
├── script.js           # Core functionality
├── helpers.js          # User-friendly functions
├── layout.js           # Header/footer components
├── server.js           # Backend API
├── package.json        # Dependencies
└── components/
    ├── header.html     # Reusable header
    └── footer.html     # Reusable footer
```

### Data Flow
1. User reports issue → Frontend captures GPS
2. POST request to backend → Data stored
3. Backend returns report with ID
4. Frontend adds marker to map
5. All users see updated markers on load

---

## Key Algorithms

### Comfort Prediction Algorithm
```javascript
comfort = baseComfort (0.7)
        - rushHourPenalty (0.3 if rush hour)
        - reportPenalty (0.1 per nearby report)
Result: 0-1 scale (0=high stress, 1=very comfortable)
```

### Route Generation
1. Define noisy zones (static + community reports)
2. Calculate midpoint between origin/destination
3. Check if direct path intersects noisy zones
4. If yes: Create detour waypoints
5. If no: Use direct route
6. Render route on map

### Proximity Detection
```javascript
distance = √((lon1-lon2)² + (lat1-lat2)²)
threshold = 0.02 degrees (~2km)
```

---

## Features Implementation

### Real-Time Updates
- **Method**: Fetch API with polling
- **Interval**: On-demand (page load, user action)
- **Fallback**: Local storage for offline mode

### Accessibility
- **WCAG 2.1 AA Compliant**
- **Features**:
  - Semantic HTML
  - ARIA labels
  - Keyboard navigation
  - Skip links
  - Screen reader support
  - High contrast mode

### Responsive Design
- **Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1024px)
- **Approach**: Mobile-first
- **Techniques**: Flexbox, CSS Grid, media queries

### Dark Mode
- **Storage**: localStorage
- **Toggle**: Theme button
- **Implementation**: CSS custom properties

---

## Performance Optimizations

1. **Lazy Loading**: Images and non-critical resources
2. **Debouncing**: Geolocation requests
3. **Caching**: Map tiles, static assets
4. **Minification**: CSS/JS (production)
5. **CDN**: External libraries

---

## Security Features

1. **CORS**: Enabled for API
2. **Input Validation**: Server-side checks
3. **HTTPS**: Required for geolocation
4. **Rate Limiting**: Planned for API
5. **Data Privacy**: No PII storage

---

## Browser Compatibility

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS 14+, Android 10+

---

## API Documentation

### POST /api/reports/noise
**Request:**
```json
{
  "coords": [77.4538, 28.6692],
  "level": 0.9,
  "description": "Heavy traffic"
}
```
**Response:**
```json
{
  "coords": [77.4538, 28.6692],
  "level": 0.9,
  "description": "Heavy traffic",
  "timestamp": 1234567890,
  "id": 1234567890
}
```

### GET /api/reports
**Response:**
```json
{
  "noise": [...],
  "crowds": [...],
  "construction": [...]
}
```

---

## Future Enhancements

1. **Database Integration**: PostgreSQL/MongoDB
2. **User Authentication**: OAuth 2.0
3. **Push Notifications**: Service Workers
4. **Offline Mode**: Progressive Web App
5. **Machine Learning**: TensorFlow.js for predictions
6. **Voice Navigation**: Web Speech API
7. **Multi-language**: i18n support
8. **Analytics**: Privacy-focused tracking

---

## Setup & Deployment

### Development
```bash
npm install
npm start
# Open index.html in browser
```

### Production
1. Set Azure Maps API key
2. Configure EmailJS credentials
3. Deploy backend to cloud (AWS/Azure/Heroku)
4. Deploy frontend to CDN/hosting
5. Enable HTTPS
6. Configure CORS for production domain

---

## Dependencies

### Backend
- express: ^4.18.2
- cors: ^2.8.5

### Frontend (CDN)
- Azure Maps SDK: 2.x
- EmailJS: 3.x
- Google Fonts: Poppins, Open Sans

---

## Testing

### Manual Testing
- Geolocation accuracy
- Report submission
- Map rendering
- Route generation
- Cross-browser compatibility

### Recommended Tools
- Lighthouse (Performance)
- WAVE (Accessibility)
- BrowserStack (Cross-browser)

---

## License
MIT License

## Contact
For technical support: [Contact Form on Website]

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained By**: Rivo Navigation Team
