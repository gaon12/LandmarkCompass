// Landmark coordinate data
// Each landmark can also define displayName and shortName.
// - displayName is used for the image alt text and accessibility labels.
// - shortName is used as a compact text fallback when no matching image exists.
// Add a matching image as images/{landmarkId}.png when a custom icon is available.
const landmarks = {
    'tower': {
        displayName: 'Tokyo Tower',
        shortName: 'Tokyo Tower',
        latitude: 35.6586,
        longitude: 139.7454
    },
    'tree': {
        displayName: 'Tokyo Skytree',
        shortName: 'Skytree',
        latitude: 35.7101,
        longitude: 139.8107
    },
    'fuji': {
        displayName: 'Mount Fuji',
        shortName: 'Fuji',
        latitude: 35.3606,
        longitude: 138.7274
    },
    'tokyo-station': {
        displayName: 'Tokyo Station',
        shortName: 'Tokyo Sta.',
        latitude: 35.6812,
        longitude: 139.7671
    },
    'imperial-palace': {
        displayName: 'Imperial Palace',
        shortName: 'Palace',
        latitude: 35.6852,
        longitude: 139.7528
    },
    'shibuya-scramble': {
        displayName: 'Shibuya Scramble Crossing',
        shortName: 'Shibuya',
        latitude: 35.6595,
        longitude: 139.7005
    },
    'tokyo-metropolitan-government': {
        displayName: 'Tokyo Metropolitan Government Building',
        shortName: 'Tocho',
        latitude: 35.6896,
        longitude: 139.6921
    },
    'rainbow-bridge': {
        displayName: 'Rainbow Bridge',
        shortName: 'Rainbow',
        latitude: 35.6369,
        longitude: 139.7630
    },
    'odaiba-statue-of-liberty': {
        displayName: 'Odaiba Statue of Liberty',
        shortName: 'Odaiba',
        latitude: 35.6277,
        longitude: 139.7713
    },
    'sensoji': {
        displayName: 'Sensō-ji Temple',
        shortName: 'Sensō-ji',
        latitude: 35.7148,
        longitude: 139.7967
    },
    'ueno-park': {
        displayName: 'Ueno Park',
        shortName: 'Ueno',
        latitude: 35.7156,
        longitude: 139.7745
    },
    'meiji-jingu': {
        displayName: 'Meiji Jingu Shrine',
        shortName: 'Meiji',
        latitude: 35.6764,
        longitude: 139.6993
    },
    'national-diet': {
        displayName: 'National Diet Building',
        shortName: 'Diet',
        latitude: 35.6759,
        longitude: 139.7449
    },
    'tokyo-dome': {
        displayName: 'Tokyo Dome',
        shortName: 'Dome',
        latitude: 35.7056,
        longitude: 139.7519
    },
    'roppongi-hills': {
        displayName: 'Roppongi Hills Mori Tower',
        shortName: 'Roppongi',
        latitude: 35.6605,
        longitude: 139.7292
    },
    'tokyo-big-sight': {
        displayName: 'Tokyo Big Sight',
        shortName: 'Big Sight',
        latitude: 35.6298,
        longitude: 139.7941
    },
    'haneda-airport': {
        displayName: 'Haneda Airport',
        shortName: 'Haneda',
        latitude: 35.5494,
        longitude: 139.7798
    }
};

// Privacy-focused location options for minimal data collection
const locationOptions = {
    enableHighAccuracy: false, // Battery saving and privacy protection
    timeout: 30000,
    maximumAge: 60000 // 1 minutes cache for privacy and performance
};

// Distance unit configuration
// To switch between units, change 'currentUnit' value:
// - 'km': Displays distances in kilometers and meters (metric)
// - 'miles': Displays distances in miles and feet (imperial)
const distanceConfig = {
    defaultUnit: 'km', // 'km' or 'miles'
    currentUnit: 'km'  // Change this to 'miles' to use imperial units
};

// Export for global access
window.landmarks = landmarks;
window.locationOptions = locationOptions;
window.distanceConfig = distanceConfig;
