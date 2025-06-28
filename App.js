import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet, Text, View, Dimensions, TouchableOpacity, Modal,
    ScrollView, Platform, Linking, Image as RNImage
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors'; // Using DeviceMotion for orientation

// ==== I18N ====
const translations = {
    en: {
        title: "Landmark Compass Tokyo",
        subtitle: "Shows directions to landmarks in Tokyo",
        description: "Try this when you go up to a high place in Tokyo",
        north: "N",
        east: "E",
        south: "S",
        west: "W",
        locationGetting: "🔃 Getting location...",
        compassInitializing: "🔃 Initializing compass sensor...",
        compassChecking: "🔃 Checking compass sensor...",
        locationSuccess: "✅ Location acquired",
        locationError: "❌ Failed to get location: ",
        locationNotSupported: "❌ Geolocation is not supported",
        locationDenied: "❌ Location access denied by user.",
        locationUnavailable: "Location unavailable",
        locationTimeout: "Request timed out",
        locationUnknownError: "Unknown error",
        compassSuccess: "✅ Compass sensor available",
        compassDenied: "❌ Compass sensor access denied by user.",
        compassPermissionError: "❌ Failed to get compass permission",
        compassNotSupported: "❌ Compass sensor not supported by device.",
        refreshButton: "Refresh Location",
        refreshing: "🔃 Refreshing...",
        locationUpdating: "🔃 Updating location...",
        loadingLocation: "Getting location...",
        sensorPermissionTitle: "To Show Directions",
        sensorPermissionDescription: "This app needs access to your location and device orientation to show directions to landmarks.",
        privacyDetail1: "Location and orientation data is processed only on your device",
        privacyDetail2: "Location is used only for calculating directions to landmarks",
        privacyDetail3: "Compass sensor is used only to detect device orientation",
        privacyDetail4: "No personal information is collected or transmitted",
        cancelButton: "Don't Allow",
        okButton: "Allow",
        permissionsRequired: "Location and compass sensor permissions are required for this app to function correctly. Please grant permissions via app settings if you denied them previously.",
        githubLink: "Source code is available on GitHub"
    },
    ja: {
        title: "Landmark Compass Tokyo",
        subtitle: "東京の各ランドマークの方角を表示します",
        description: "東京で高いところに登ったら、使ってみてください",
        north: "北",
        east: "東",
        south: "南",
        west: "西",
        locationGetting: "🔃 位置情報を取得中...",
        compassInitializing: "🔃 方位センサーを初期化中...",
        compassChecking: "🔃 方位センサーを確認中...",
        locationSuccess: "✅ 位置情報を取得しました",
        locationError: "❌ 位置情報の取得に失敗: ",
        locationNotSupported: "❌ 位置情報がサポートされていません",
        locationDenied: "❌ 位置情報の使用が拒否されました",
        locationUnavailable: "位置情報が利用できません",
        locationTimeout: "タイムアウトしました",
        locationUnknownError: "不明なエラー",
        compassSuccess: "✅ 方位センサーが利用可能です",
        compassDenied: "❌ 方位センサーの使用が拒否されました",
        compassPermissionError: "❌ 方位センサーの許可取得に失敗",
        compassNotSupported: "❌ 方位センサーがサポートされていません",
        refreshButton: "位置情報を更新",
        refreshing: "🔃 更新中...",
        locationUpdating: "🔃 位置情報を更新中...",
        loadingLocation: "位置情報を取得中...",
        sensorPermissionTitle: "方角を表示するために",
        sensorPermissionDescription: "ランドマークへの方角を表示するため、位置情報とデバイスの向きの取得の許可が必要です。",
        privacyDetail1: "位置情報およびデバイスの向きの情報はお使いのデバイス上でのみ処理されます",
        privacyDetail2: "位置情報はランドマークの方角計算のみに使用されます",
        privacyDetail3: "方位センサーはデバイスの向きを検出するためのみに使用されます",
        privacyDetail4: "個人情報の収集や外部送信は一切行いません",
        cancelButton: "許可しない",
        okButton: "許可する",
        permissionsRequired: "本アプリを使用するには位置情報と方位センサーの権限が必要です。以前に拒否した場合は、アプリの設定から権限を許可してください。",
        githubLink: "ソースコードはGitHubにて公開中"
    }
};

let currentLanguage = 'en'; // Default language
const getDeviceLanguage = () => {
    // Basic language detection, can be improved with a library
    // For Expo, Location.getLocaleAsync() can be an option but might need more permissions
    // For simplicity, we'll stick to a basic check or allow manual switching if needed
    // const locale = Localization.locale; // Expo Localization
    // return locale.startsWith('ja') ? 'ja' : 'en';
    return 'en'; // Keeping it simple for now
};
currentLanguage = getDeviceLanguage();
const getText = (key) => translations[currentLanguage][key] || translations['en'][key] || key;

// ==== CONFIG ====
const landmarks = {
    'tower': { name: 'Tokyo Tower', latitude: 35.6586, longitude: 139.7454, image: require('./images/tower.png') },
    'tree': { name: 'Tokyo Skytree', latitude: 35.7101, longitude: 139.8107, image: require('./images/tree.png') },
    'fuji': { name: 'Mt. Fuji', latitude: 35.3606, longitude: 138.7274, image: require('./images/fuji.png') }
};

const locationOptions = {
    accuracy: Location.Accuracy.Balanced, // Balanced for battery saving
    timeInterval: 5000, // Update interval for location
    distanceInterval: 10, // Update distance for location
};

const distanceConfig = {
    currentUnit: 'km' // 'km' or 'miles'
};

const COMPASS_UPDATE_INTERVAL = 100; // milliseconds for compass updates (throttled)


// ==== CALCULATIONS ====
const CalculationUtils = {
    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    },
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },
    kmToMiles(km) {
        return km * 0.621371;
    },
    formatDistance(distanceKm) {
        const unit = distanceConfig.currentUnit;
        if (unit === 'miles') {
            const distanceMiles = this.kmToMiles(distanceKm);
            if (distanceMiles < 0.1) return `${Math.round(distanceMiles * 5280)}ft`;
            if (distanceMiles < 10) return `${distanceMiles.toFixed(1)}mi`;
            return `${Math.round(distanceMiles)}mi`;
        } else {
            if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
            if (distanceKm < 10) return `${distanceKm.toFixed(1)}km`;
            return `${Math.round(distanceKm)}km`;
        }
    }
};

// ==== COMPONENTS ====

const Header = () => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>🗼 {getText('title')} 🗼</Text>
        <Text style={styles.headerSubtitle}>{getText('subtitle')}</Text>
        <Text style={styles.headerDescription}>{getText('description')}</Text>
    </View>
);

const StatusDisplay = ({ locationStatus, compassStatus, permissionsDeniedMessage }) => (
    <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{locationStatus}</Text>
        <Text style={styles.statusText}>{compassStatus}</Text>
        {permissionsDeniedMessage && <Text style={[styles.statusText, styles.warningMessage]}>{permissionsDeniedMessage}</Text>}
    </View>
);

const LoadingSpinner = ({ visible, text }) => {
    if (!visible) return null;
    return (
        <View style={styles.loadingSpinnerContainer}>
            <View style={styles.spinnerRing} />
            <Text style={styles.spinnerText}>{text}</Text>
        </View>
    );
};

const LandmarkMarker = ({ landmarkId, landmarkData, currentHeading, userLocation }) => {
    if (!userLocation) return null;

    const bearing = CalculationUtils.calculateBearing(
        userLocation.latitude, userLocation.longitude,
        landmarkData.latitude, landmarkData.longitude
    );
    const distanceKm = CalculationUtils.calculateDistance(
        userLocation.latitude, userLocation.longitude,
        landmarkData.latitude, landmarkData.longitude
    );

    const relativeBearing = bearing - currentHeading;
    const { width: screenWidth } = Dimensions.get('window');
    const compassSize = Math.min(screenWidth - 40, 290); // Max size based on CSS
    const radius = (compassSize / 2) - 20; // Adjusted for icon size and padding

    const angleRad = (relativeBearing - 90) * Math.PI / 180; // -90 to align 0deg North
    const x = Math.cos(angleRad) * radius;
    const y = Math.sin(angleRad) * radius;

    // Landmark icon positioning (center of the icon at the calculated point)
    const iconSize = compassSize * 0.15; // Responsive icon size
    const landmarkStyle = {
        position: 'absolute',
        left: compassSize / 2 + x - iconSize / 2,
        top: compassSize / 2 + y - iconSize / 2, // Adjusted so bottom of icon points
        width: iconSize,
        height: iconSize,
        // transform: [{ translateX: -iconSize / 2 }, { translateY: -iconSize }], // Center horizontally, bottom touches point
    };

    // Line from center to landmark
    const lineStyle = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 2,
        height: radius, // Line length
        backgroundColor: '#999eff',
        transformOrigin: '0 0', // Rotate from the center
        transform: [
            { translateX: -1 }, // Center the line
            { rotate: `${relativeBearing}deg` },
        ],
        zIndex: 1,
    };

    // Distance text positioning (along the line, rotated correctly)
    const distanceTextAngle = relativeBearing > 90 && relativeBearing < 270 ? relativeBearing + 180 : relativeBearing;
    const distanceTextStyle = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: [
            { translateX: (-radius / 2) * Math.sin(relativeBearing * Math.PI / 180) - 20 }, // Adjust for text width
            { translateY: (radius / 2) * Math.cos(relativeBearing * Math.PI / 180) },
            { rotate: `${-relativeBearing}deg` }, // Counter-rotate text to keep it upright
        ],
        backgroundColor: '#e8ecff',
        color: '#999eff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        fontSize: 10, // Responsive font size
        fontWeight: 'bold',
        zIndex: 5,
    };
     const distanceTextContainerStyle = {
        position: 'absolute',
        left: '50%',
        top: '50%', // Start from center
        // Adjust position along the line using polar coordinates
        transform: [
            { translateX: (radius / 2) * Math.cos((relativeBearing - 90) * Math.PI / 180) },
            { translateY: (radius / 2) * Math.sin((relativeBearing - 90) * Math.PI / 180) },
        ],
        zIndex: 5,
    };

    const actualDistanceTextStyle = {
         transform: [{ rotate: `${-relativeBearing}deg` }], // Counter-rotate text
         backgroundColor: '#e8ecff',
         color: '#999eff',
         paddingHorizontal: 8,
         paddingVertical: 3,
         borderRadius: 12,
         fontSize: Math.max(10, compassSize * 0.035),
         fontWeight: 'bold',
         textAlign: 'center',
    };


    return (
        <>
            <View style={lineStyle} />
            <View style={distanceTextContainerStyle}>
                 <Text style={actualDistanceTextStyle}>
                    {CalculationUtils.formatDistance(distanceKm)}
                </Text>
            </View>
            <RNImage source={landmarkData.image} style={landmarkStyle} resizeMode="contain" />
        </>
    );
};


const Compass = ({ currentHeading, userLocation, isLoading }) => {
    const { width: screenWidth } = Dimensions.get('window');
    // Ensure compassSize is calculated correctly based on available width
    const compassOuterPadding = 40; // Total padding for the compass container (20px on each side from original CSS)
    const compassMaxHardwareSize = 290; // Max size from CSS
    // Calculate available width for the circle itself
    const availableWidthForCircle = screenWidth - styles.container.padding * 2 - styles.compass.padding * 2 - compassOuterPadding;
    const compassSize = Math.min(availableWidthForCircle, compassMaxHardwareSize);


    const compassCircleStyle = {
        width: compassSize,
        height: compassSize,
        borderRadius: compassSize / 2,
        borderWidth: 3,
        borderColor: '#667eea',
        backgroundColor: '#e8ecff', // Simplified background
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        transform: [{ rotate: `${-currentHeading}deg` }] // Rotate the entire compass face
    };

    const directionTextStyle = (angle) => ({
        position: 'absolute',
        fontWeight: 'bold',
        fontSize: Math.max(14, compassSize * 0.05), // Responsive font size
        color: '#667eea',
        transform: [{ rotate: `${currentHeading + angle}deg` }] // Counter-rotate text
    });

    return (
        <View style={styles.compass}>
            <View style={compassCircleStyle}>
                {/* Directional Markers (N, E, S, W) - position them on the edge */}
                <Text style={[directionTextStyle(0), { top: 5, alignSelf: 'center' }]}>{getText('north')}</Text>
                <Text style={[directionTextStyle(0), { right: 5, alignSelf: 'center', top: '45%' }]}>{getText('east')}</Text>
                <Text style={[directionTextStyle(0), { bottom: 5, alignSelf: 'center' }]}>{getText('south')}</Text>
                <Text style={[directionTextStyle(0), { left: 5, alignSelf: 'center', top: '45%' }]}>{getText('west')}</Text>

                {Object.keys(landmarks).map(id => (
                    <LandmarkMarker
                        key={id}
                        landmarkId={id}
                        landmarkData={landmarks[id]}
                        currentHeading={currentHeading}
                        userLocation={userLocation}
                    />
                ))}
                 <LoadingSpinner visible={isLoading} text={getText('loadingLocation')} />
            </View>
        </View>
    );
};


const RefreshButton = ({ onPress, isRefreshing }) => (
    <TouchableOpacity onPress={onPress} disabled={isRefreshing} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>
            {isRefreshing ? getText('refreshing') : getText('refreshButton')}
        </Text>
    </TouchableOpacity>
);

const GithubLink = () => (
    <TouchableOpacity onPress={() => Linking.openURL("https://github.com/cubic9com/LandmarkCompassTokyo")}>
        <Text style={styles.githubLink}>{getText('githubLink')}</Text>
    </TouchableOpacity>
);

const PermissionModal = ({ visible, onAllow, onDeny }) => (
    <Modal
        transparent={true}
        visible={visible}
        animationType="slide"
        onRequestClose={onDeny} // Android back button
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getText('sensorPermissionTitle')}</Text>
                <Text style={styles.modalDescription}>{getText('sensorPermissionDescription')}</Text>
                <View style={styles.privacyDetailsContainer}>
                    <Text style={styles.privacyDetailItem}>• {getText('privacyDetail1')}</Text>
                    <Text style={styles.privacyDetailItem}>• {getText('privacyDetail2')}</Text>
                    <Text style={styles.privacyDetailItem}>• {getText('privacyDetail3')}</Text>
                    <Text style={styles.privacyDetailItem}>• {getText('privacyDetail4')}</Text>
                </View>
                <View style={styles.modalButtonContainer}>
                    <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onDeny}>
                        <Text style={styles.modalButtonTextAlt}>{getText('cancelButton')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.modalButtonOk]} onPress={onAllow}>
                        <Text style={styles.modalButtonText}>{getText('okButton')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);


// ==== APP ====
export default function App() {
    const [locationStatus, setLocationStatus] = useState(getText('locationGetting'));
    const [compassStatus, setCompassStatus] = useState(getText('compassChecking'));
    const [userLocation, setUserLocation] = useState(null);
    const [currentHeading, setCurrentHeading] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [permissionsGranted, setPermissionsGranted] = useState({ location: false, motion: false });
    const [permissionsRequested, setPermissionsRequested] = useState(false);
    const [permissionsDeniedMessage, setPermissionsDeniedMessage] = useState('');


    const motionSubscription = useRef(null);
    const locationSubscription = useRef(null);
    const lastHeading = useRef(0);


    const requestPermissions = async () => {
        setIsLoading(true);
        let finalLocationGranted = permissionsGranted.location;
        let finalMotionGranted = permissionsGranted.motion;

        // Location Permission
        if (!finalLocationGranted) {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            if (locStatus === 'granted') {
                finalLocationGranted = true;
                setLocationStatus(getText('locationSuccess'));
            } else {
                setLocationStatus(getText('locationDenied'));
                setPermissionsDeniedMessage(prev => prev + getText('locationDenied') + ' ');
            }
        }

        // Device Motion Permission (implicitly handled by starting subscription on iOS, Android generally doesn't require explicit permission for basic sensors if declared in manifest)
        // However, to be safe, we'll check if we can start it.
        if (!finalMotionGranted) {
             try {
                const isAvailable = await DeviceMotion.isAvailableAsync();
                if (isAvailable) {
                    // On iOS, starting the listener might trigger a prompt if not already granted.
                    // On Android, if declared in manifest, it should work.
                    // We will attempt to start it later.
                    finalMotionGranted = true; // Assume granted or will be prompted on use.
                    setCompassStatus(getText('compassInitializing'));
                } else {
                    setCompassStatus(getText('compassNotSupported'));
                    setPermissionsDeniedMessage(prev => prev + getText('compassNotSupported') + ' ');
                }
            } catch (e) {
                 setCompassStatus(getText('compassPermissionError'));
                 setPermissionsDeniedMessage(prev => prev + getText('compassPermissionError') + ' ');
            }
        }

        setPermissionsGranted({ location: finalLocationGranted, motion: finalMotionGranted });

        if (finalLocationGranted && finalMotionGranted) {
            setModalVisible(false);
            initializeServices();
        } else {
            // If still not granted, keep modal or show error message
            setModalVisible(false); // Hide modal, show inline message
            if (!finalLocationGranted || !finalMotionGranted) {
                 setPermissionsDeniedMessage(getText('permissionsRequired'));
            }
        }
        setIsLoading(false);
        setPermissionsRequested(true);
    };

    const initializeServices = async () => {
        if (!permissionsGranted.location || !permissionsGranted.motion) {
            setIsLoading(false);
            if (!permissionsRequested) { // Show modal only on first load if permissions not set
                setModalVisible(true);
            } else {
                 setPermissionsDeniedMessage(getText('permissionsRequired'));
            }
            return;
        }

        setIsLoading(true);
        setLocationStatus(getText('locationGetting'));
        setCompassStatus(getText('compassInitializing'));

        // Start Location Tracking
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); // Get initial high accuracy
            setUserLocation(loc.coords);
            setLocationStatus(getText('locationSuccess'));

            locationSubscription.current = await Location.watchPositionAsync(
                locationOptions,
                (newLocation) => {
                    setUserLocation(newLocation.coords);
                    // No need to set status here, already acquired or updating
                }
            );
        } catch (error) {
            setLocationStatus(getText('locationError') + error.message);
            console.error("Location error:", error);
            setIsLoading(false);
            return; // Stop if location fails
        }

        // Start Device Motion Sensor for Compass
        DeviceMotion.setUpdateInterval(COMPASS_UPDATE_INTERVAL);
        motionSubscription.current = DeviceMotion.addListener(motionData => {
            if (motionData && motionData.rotation && motionData.rotation.alpha !== null) {
                // Android: alpha is 0-360, 0 when Z axis points North.
                // iOS: alpha is 0-360, 0 when X axis points North if `magneticNorth` frame.
                // Need to normalize. A common approach is to use magnetometer data if available,
                // but DeviceMotion's alpha is often a fused heading.
                // For simplicity, let's assume alpha gives a usable heading.
                // This might need platform-specific adjustments or a more robust compass library for production.

                let heading = motionData.rotation.alpha; // 0-360

                // This is a common transformation if alpha is relative to device, not true/magnetic north
                // For Expo DeviceMotion, alpha is typically heading (0 = North) on Android.
                // On iOS, it might need webkitCompassHeading-like adjustment if it's raw alpha.
                // Let's assume for now it's a direct heading.
                // heading = (360 - heading) % 360; // If 0 is East or some other convention

                // Throttle updates for performance
                if (Math.abs(heading - lastHeading.current) > 1) { // Update if change > 1 degree
                    setCurrentHeading(heading);
                    lastHeading.current = heading;
                    if (compassStatus !== getText('compassSuccess')) {
                        setCompassStatus(getText('compassSuccess'));
                    }
                }
            }
        });
        setIsLoading(false);
    };


    useEffect(() => {
        // On mount, check initial permission status
        (async () => {
            const { status: locStatus } = await Location.getForegroundPermissionsAsync();
            const motionAvailable = await DeviceMotion.isAvailableAsync(); // Checks if sensor is present

            const initialLocationGranted = locStatus === 'granted';
            // Motion doesn't have a 'getPermissionAsync' like location.
            // We infer it's "granted" if available and we can subscribe, or if user previously allowed.
            // For now, assume if available, we can try. The modal handles explicit denial.
            const initialMotionGranted = motionAvailable;


            if (initialLocationGranted && initialMotionGranted) {
                setPermissionsGranted({ location: true, motion: true });
                initializeServices();
            } else {
                setModalVisible(true); // Show modal if either permission is missing
            }
        })();

        return () => {
            // Cleanup subscriptions
            if (locationSubscription.current && typeof locationSubscription.current.remove === 'function') {
                locationSubscription.current.remove();
            }
            if (motionSubscription.current && typeof motionSubscription.current.remove === 'function') {
                 DeviceMotion.removeSubscription(motionSubscription.current);
            }
        };
    }, []); // Empty array means run once on mount and clean up on unmount

    const handleAllowPermissions = () => {
        setModalVisible(false);
        requestPermissions(); // This will re-check and initialize
    };

    const handleDenyPermissions = () => {
        setModalVisible(false);
        setLocationStatus(getText('locationDenied'));
        setCompassStatus(getText('compassDenied'));
        setPermissionsDeniedMessage(getText('permissionsRequired'));
        setIsLoading(false);
        setPermissionsRequested(true); // Mark as requested so modal doesn't reappear automatically
    };

    const handleRefreshLocation = async () => {
        if (!permissionsGranted.location) {
            setLocationStatus(getText('locationDenied'));
            // Optionally, re-trigger permission modal or guide to settings
            setModalVisible(true);
            return;
        }
        setIsRefreshing(true);
        setLocationStatus(getText('locationUpdating'));
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setUserLocation(loc.coords);
            setLocationStatus(getText('locationSuccess'));
        } catch (error) {
            setLocationStatus(getText('locationError') + error.message);
        }
        setIsRefreshing(false);
    };


    // Determine overall loading state
    const trulyLoading = isLoading || (!userLocation && permissionsGranted.location);


    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.rootContainer}>
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.container}>
                    <Header />
                    <StatusDisplay
                        locationStatus={locationStatus}
                        compassStatus={compassStatus}
                        permissionsDeniedMessage={!permissionsGranted.location || !permissionsGranted.motion ? permissionsDeniedMessage : ''}
                    />
                    <Compass
                        currentHeading={currentHeading}
                        userLocation={userLocation}
                        isLoading={trulyLoading && (!permissionsDeniedMessage)} // Show compass loading only if not denied
                    />
                    <RefreshButton onPress={handleRefreshLocation} isRefreshing={isRefreshing} />
                    <GithubLink />
                </View>
            </ScrollView>
            <PermissionModal
                visible={modalVisible && !permissionsRequested} // Show only if not explicitly denied/allowed yet
                onAllow={handleAllowPermissions}
                onDeny={handleDenyPermissions}
            />
        </LinearGradient>
    );
}

// ==== STYLES ====
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', // Center content vertically in the scroll view
        padding: 15, // Original container padding
        minHeight: screenHeight, // Ensure it takes at least full screen height
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: screenWidth * 0.06, // Responsive font size
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        marginBottom: 10, // Adjusted from h1 margin-bottom
    },
    headerSubtitle: {
        fontSize: screenWidth * 0.04, // Responsive font size
        color: 'white',
        opacity: 0.9,
        textAlign: 'center',
    },
    headerDescription: {
        fontSize: screenWidth * 0.035, // Responsive font size
        color: 'white',
        opacity: 0.9,
        textAlign: 'center',
        marginTop: 5,
    },
    statusContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        width: '100%',
        maxWidth: 400, // Max width from original CSS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    statusText: {
        fontSize: screenWidth * 0.035,
        marginBottom: 5,
        paddingVertical: 3,
    },
    warningMessage: {
        color: '#e74c3c',
        fontWeight: 'bold',
        marginTop: 10,
    },
    compass: {
        // backgroundColor: '#e8ecff', // Moved to compassCircleStyle
        borderRadius: 20,
        padding: 20, // Padding for the compass container itself
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 7,
        alignItems: 'center', // Center the circle
        width: '100%', // Take available width
        maxWidth: 370, // Max width based on 290px circle + padding
    },
    // CompassCircle style is now dynamic in the component
    loadingSpinnerContainer: { // For the spinner inside the compass
        position: 'absolute', // Position it over the compass circle
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'rgba(232, 236, 255, 0.8)', // Optional: slight overlay
        zIndex: 20,
    },
    spinnerRing: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: 'rgba(102, 126, 234, 0.2)',
        borderTopColor: '#667eea',
        marginBottom: 10,
        // Animation is typically handled by libraries or Animated API in RN
    },
    spinnerText: {
        fontSize: screenWidth * 0.03,
        color: '#667eea',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    refreshButton: {
        width: '100%',
        maxWidth: 400,
        padding: 15,
        backgroundColor: '#667eea', // Fallback, LinearGradient preferred
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(102, 126, 234, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
        marginTop: 10, // Give some space
    },
    refreshButtonText: {
        color: 'white',
        fontSize: screenWidth * 0.04,
        fontWeight: 'bold',
    },
    githubLink: {
        color: '#e0e0ff', // Lighter color for dark background
        fontSize: screenWidth * 0.035,
        padding: 20,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        padding: 25, // Increased padding
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 10,
        maxWidth: 400,
        width: '90%',
        alignItems: 'center', // Center text
    },
    modalTitle: {
        color: '#667eea',
        marginBottom: 15,
        fontSize: screenWidth * 0.055, // Responsive
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalDescription: {
        color: '#333',
        marginBottom: 15, // Increased margin
        lineHeight: screenWidth * 0.05, // Responsive
        fontSize: screenWidth * 0.04,  // Responsive
        textAlign: 'center',
    },
    privacyDetailsContainer: {
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        padding: 15,
        borderRadius: 10,
        marginVertical: 15, // Increased margin
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
        width: '100%', // Take full width of modal content
    },
    privacyDetailItem: {
        fontSize: screenWidth * 0.035, // Responsive
        lineHeight: screenWidth * 0.05, // Responsive
        color: '#555',
        marginBottom: 8,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 15, // Supported in React Native (for newer versions) or use justifyContent
        marginTop: 25,
        justifyContent: 'space-around', // If gap is not supported
        width: '100%',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20, // Adjusted padding
        borderRadius: 10,
        flex: 1, // Make buttons take equal width
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48, // Good tap target size
    },
    modalButtonCancel: {
        backgroundColor: '#f1f2f6',
        borderWidth: 1, // Subtle border
        borderColor: '#ddd',
    },
    modalButtonOk: {
        backgroundColor: '#667eea', // Using solid color from gradient
        shadowColor: 'rgba(102, 126, 234, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 3,
    },
    modalButtonText: {
        color: 'white',
        fontSize: screenWidth * 0.04, // Responsive
        fontWeight: 'bold',
    },
    modalButtonTextAlt: {
        color: '#666',
        fontSize: screenWidth * 0.04, // Responsive
        fontWeight: 'bold',
    },
});

// Note: The spinner animation for spinnerRing (keyframes spin)
// and landmark animations (landmarkHeightAnimation, distanceSlideIn)
// would require the Animated API in React Native for equivalent effects.
// This initial conversion focuses on structure, styling, and core functionality.
// Advanced animations can be added as a separate step.

// Also, image paths like './images/tower.png' assume that you have an 'images'
// folder at the same level as your App.js, and these images are correctly
// bundled by Metro bundler.

```
