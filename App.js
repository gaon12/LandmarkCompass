import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, Modal } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

const landmarks = {
  tower: { latitude: 35.6586, longitude: 139.7454, image: require('./images/tower.png') },
  tree: { latitude: 35.7101, longitude: 139.8107, image: require('./images/tree.png') },
  fuji: { latitude: 35.3606, longitude: 138.7274, image: require('./images/fuji.png') }
};

const translations = {
  en: {
    title: 'Landmark Compass Tokyo',
    subtitle: 'Shows directions to landmarks in Tokyo',
    refresh: 'Refresh Location',
    permissionTitle: 'To Show Directions',
    permissionDesc: 'This app needs access to your location and orientation.',
    allow: 'Allow',
    deny: "Don't Allow"
  },
  ja: {
    title: 'Landmark Compass Tokyo',
    subtitle: '東京の各ランドマークの方角を表示します',
    refresh: '位置情報を更新',
    permissionTitle: '方角を表示するために',
    permissionDesc: 'ランドマークへの方角を表示するため、位置情報とデバイスの向きの取得が必要です。',
    allow: '許可する',
    deny: '許可しない'
  }
};

const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
const lang = locale.startsWith('ja') ? 'ja' : 'en';
const t = key => translations[lang][key] || translations.en[key];

export default function App() {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [modalVisible, setModalVisible] = useState(true);

  const size = Math.min(Dimensions.get('window').width * 0.8, 300);
  const lineLength = size / 2 - 20;

  useEffect(() => {
    let magnetSub;
    if (!modalVisible) {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        magnetSub = Magnetometer.addListener(data => {
          let angle = Math.atan2(data.y, data.x);
          let deg = angle * (180 / Math.PI);
          if (deg < 0) deg += 360;
          setHeading(deg);
        });
        Magnetometer.setUpdateInterval(200);
      })();
    }
    return () => {
      if (magnetSub) magnetSub.remove();
    };
  }, [modalVisible]);

  const refreshLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const calcBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) - Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = km => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    if (km < 10) return `${km.toFixed(1)}km`;
    return `${Math.round(km)}km`;
  };

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('permissionTitle')}</Text>
            <Text style={styles.modalDesc}>{t('permissionDesc')}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>{t('allow')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Text style={styles.title}>{t('title')}</Text>
      <Text style={styles.subtitle}>{t('subtitle')}</Text>
      <View style={[styles.compass, { width: size, height: size }]}>
        <View style={styles.directions}>
          <Text style={[styles.dir, styles.north]}>N</Text>
          <Text style={[styles.dir, styles.east]}>E</Text>
          <Text style={[styles.dir, styles.south]}>S</Text>
          <Text style={[styles.dir, styles.west]}>W</Text>
        </View>
        {location && Object.entries(landmarks).map(([key, lm]) => {
          const bearing = calcBearing(location.latitude, location.longitude, lm.latitude, lm.longitude);
          const distance = calcDistance(location.latitude, location.longitude, lm.latitude, lm.longitude);
          const angle = bearing - heading;
          return (
            <View key={key} style={[styles.lineContainer, { transform: [{ rotate: `${angle}deg` }] }]}>
              <View style={[styles.line, { height: lineLength }]} />
              <Text style={styles.distance}>{formatDistance(distance)}</Text>
              <Image source={lm.image} style={styles.landmark} resizeMode="contain" />
            </View>
          );
        })}
      </View>
      <TouchableOpacity style={styles.button} onPress={refreshLocation}>
        <Text style={styles.btnText}>{t('refresh')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  compass: { justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#667eea', borderRadius: 999 },
  directions: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  dir: { position: 'absolute', fontWeight: 'bold', color: '#667eea' },
  north: { top: 4 },
  east: { right: 4 },
  south: { bottom: 4 },
  west: { left: 4 },
  lineContainer: { position: 'absolute', justifyContent: 'flex-start', alignItems: 'center' },
  line: { width: 2, backgroundColor: '#667eea' },
  distance: { fontSize: 12, marginTop: 2, color: '#667eea' },
  landmark: { width: 30, height: 30, marginTop: 2 },
  button: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#667eea', borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  modalBackdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalBox: { backgroundColor:'white', padding:20, borderRadius:10, width:'80%' },
  modalTitle: { fontSize:18, fontWeight:'bold', marginBottom:10, textAlign:'center' },
  modalDesc: { fontSize:14, marginBottom:20, textAlign:'center' },
  modalButtons: { flexDirection:'row', justifyContent:'center' },
  modalBtn: { backgroundColor:'#667eea', paddingVertical:10, paddingHorizontal:20, borderRadius:8 }
});

