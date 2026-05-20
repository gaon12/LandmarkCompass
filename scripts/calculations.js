// ========================================
// CALCULATION FUNCTIONS
// ========================================

/**
 * Calculation utilities for geographic calculations
 * Handles bearing, distance, and coordinate transformations
 */
const CalculationUtils = {
    
    /**
     * Convert degrees to radians.
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    /**
     * Calculates the bearing (direction) from one coordinate to another using spherical trigonometry
     * @param {number} lat1 - Latitude of the starting point
     * @param {number} lng1 - Longitude of the starting point
     * @param {number} lat2 - Latitude of the destination point
     * @param {number} lng2 - Longitude of the destination point
     * @returns {number} Bearing in degrees (0-360)
     */
    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = this.toRadians(lng2 - lng1);
        const lat1Rad = this.toRadians(lat1);
        const lat2Rad = this.toRadians(lat2);
        
        const y = Math.sin(dLng) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    },
    
    /**
     * Calculates the distance between two coordinates using the Haversine formula
     * Provides accurate distance calculation for geographic coordinates
     * @param {number} lat1 - Starting point latitude in degrees
     * @param {number} lng1 - Starting point longitude in degrees
     * @param {number} lat2 - Destination point latitude in degrees
     * @param {number} lng2 - Destination point longitude in degrees
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const lat1Rad = this.toRadians(lat1);
        const lat2Rad = this.toRadians(lat2);
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const sinDLat = Math.sin(dLat / 2);
        const sinDLng = Math.sin(dLng / 2);
        
        const a = sinDLat * sinDLat +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  sinDLng * sinDLng;
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },
    
    /**
     * Converts kilometers to miles
     * @param {number} km - Distance in kilometers
     * @returns {number} Distance in miles
     */
    kmToMiles(km) {
        return km * 0.621371;
    },
    
    /**
     * Formats distance for display with appropriate units and precision
     * Supports both metric (km/m) and imperial (miles/feet) units based on config
     * @param {number} distanceKm - Distance in kilometers
     * @returns {string} Formatted distance string with units
     */
    formatDistance(distanceKm) {
        const unit = distanceConfig.currentUnit;
        
        if (unit === 'miles') {
            const distanceMiles = this.kmToMiles(distanceKm);
            
            if (distanceMiles < 0.1) {
                // Display in feet for very short distances
                const feet = Math.round(distanceMiles * 5280);
                return `${feet}ft`;
            } else if (distanceMiles < 10) {
                // Display with 1 decimal place for distances under 10 miles
                return `${distanceMiles.toFixed(1)}mi`;
            } else {
                // Display as whole numbers for distances over 10 miles
                return `${Math.round(distanceMiles)}mi`;
            }
        } else {
            // Metric units (km/m)
            if (distanceKm < 1) {
                // Display in meters for distances under 1km
                return `${Math.round(distanceKm * 1000)}m`;
            } else if (distanceKm < 10) {
                // Display with 1 decimal place for distances 1-10km
                return `${distanceKm.toFixed(1)}km`;
            } else {
                // Display as whole numbers for distances over 10km
                return `${Math.round(distanceKm)}km`;
            }
        }
    },

    /**
     * Calculates and caches the bearing and distance for every configured landmark.
     * These values only depend on the user's location, so they do not need to be
     * recalculated on every compass heading update.
     */
    updateLandmarkCalculations() {
        if (!AppState.location.current) return;

        Object.entries(landmarks).forEach(([landmarkId, landmark]) => {
            const bearing = this.calculateBearing(
                AppState.location.current.lat,
                AppState.location.current.lng,
                landmark.latitude,
                landmark.longitude
            );

            const distance = this.calculateDistance(
                AppState.location.current.lat,
                AppState.location.current.lng,
                landmark.latitude,
                landmark.longitude
            );

            AppState.landmarks.calculated.set(landmarkId, { bearing, distance });
        });
    },
    
    /**
     * Calculates directions and distances to all landmarks from the current position
     * Enhanced version that includes cached distance calculations
     */
    calculateAllDirections() {
        if (!AppState.location.current) return;

        this.updateLandmarkCalculations();
        LandmarkRenderer.updateAllLandmarksFromCache();
    }
};

// Export for global access
window.CalculationUtils = CalculationUtils;
