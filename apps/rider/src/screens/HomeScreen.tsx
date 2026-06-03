import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Dimensions, Animated,
} from 'react-native';
import { MapView, Camera, Marker, UserLocation } from '@maplibre/maplibre-react-native';
import type { CameraRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../api/client';
import { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  riderId: string;
  riderName: string;
};

const PLACES = [
  { name: 'Downtown', lat: 40.7128, lng: -74.006 },
  { name: 'Airport', lat: 40.6413, lng: -73.7781 },
  { name: 'Grand Central', lat: 40.7527, lng: -73.9772 },
  { name: 'Times Square', lat: 40.758, lng: -73.9855 },
  { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969 },
  { name: 'Central Park', lat: 40.7829, lng: -73.9654 },
];

export default function HomeScreen({ navigation, riderId, riderName }: Props) {
  const cameraRef = useRef<CameraRef>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [fare, setFare] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof PLACES>([]);
  const [booking, setBooking] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location is needed to find nearby drivers.');
        return;
      }
      setLocationPermission(true);
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(coords);
      cameraRef.current?.flyTo([coords.lng, coords.lat], 1000);
    })();

    // Load subscription
    api.subscription.get(riderId).then(setSubscription).catch(() => {});
  }, []);

  const searchPlaces = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < 1) { setSearchResults([]); return; }
    const matches = PLACES.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(matches);
  }, []);

  const selectDropoff = useCallback(async (place: typeof PLACES[0]) => {
    setDropoff({ lat: place.lat, lng: place.lng, name: place.name });
    setSearchQuery(place.name);
    setSearchResults([]);

    if (location) {
      const minLat = Math.min(location.lat, place.lat);
      const maxLat = Math.max(location.lat, place.lat);
      const minLng = Math.min(location.lng, place.lng);
      const maxLng = Math.max(location.lng, place.lng);

      cameraRef.current?.fitBounds(
        [maxLng + 0.01, maxLat + 0.01],
        [minLng - 0.01, minLat - 0.01],
        [100, 50, 350, 50],
        500,
      );

      // Get fare estimate
      try {
        const est = await api.estimate({
          pickupLat: location.lat,
          pickupLng: location.lng,
          dropoffLat: place.lat,
          dropoffLng: place.lng,
          riderId,
        });
        setFare(est);
        Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true }).start();
      } catch {}
    }
  }, [location, riderId]);

  const requestRide = async () => {
    if (!location || !dropoff) return;
    setBooking(true);
    try {
      navigation.navigate('Ride', {});
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a1628' }}>
      <MapView
        style={{ flex: 1 }}
        mapStyle={MAP_STYLE}
        logoEnabled
        logoPosition={{ bottom: 8, left: 8 }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: [-74.006, 40.7128], zoom: 12 }}
        />
        {locationPermission && <UserLocation visible showsUserHeadingIndicator />}
        {dropoff && (
          <Marker id="dropoff" lngLat={[dropoff.lng, dropoff.lat]}>
            <View style={styles.markerPin}>
              <View style={styles.markerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>HiWay</Text>
          <Text style={styles.riderName}>{riderName}</Text>
        </View>
        {subscription?.tier && subscription.tier !== 'none' && (
          <View style={styles.subBadge}>
            <Text style={styles.subBadgeText}>{subscription.tier.toUpperCase()}</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{
              translateY: sheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            }],
          },
        ]}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.handle} />
            <View style={styles.searchContainer}>
              <View style={styles.locationDot} />
              <TextInput
                style={styles.searchInput}
                placeholder="Where to?"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={searchPlaces}
              />
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.searchResult}
                    onPress={() => selectDropoff(p)}
                  >
                    <View style={styles.searchResultIcon}>
                      <Text>📍</Text>
                    </View>
                    <View>
                      <Text style={styles.searchResultName}>{p.name}</Text>
                      <Text style={styles.searchResultAddr}>New York, NY</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {fare && (
              <View style={styles.fareCard}>
                <View style={styles.fareRow}>
                  <View>
                    <Text style={styles.fareLabel}>Estimated fare</Text>
                    <Text style={styles.fareAmount}>
                      ${fare.discountedAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.fareDetails}>
                    <Text style={styles.fareDetail}>
                      {fare.distance.toFixed(1)} mi
                    </Text>
                    <Text style={styles.fareDetail}>
                      {fare.duration} min
                    </Text>
                  </View>
                </View>

                {(fare.discount || 0) > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {fare.subscriptionTier} discount — save ${fare.discount.toFixed(2)}
                    </Text>
                    <View style={styles.fareBreakdown}>
                      <Text style={styles.breakdownText}>
                        Base: ${fare.breakdown.base.toFixed(2)} · Per mi: ${fare.breakdown.perMile.toFixed(2)} · Time: ${fare.breakdown.time.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.requestBtn, booking && styles.requestBtnDisabled]}
                  onPress={requestRide}
                  disabled={booking}
                >
                  {booking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.requestBtnText}>
                      Request HiWay — ${fare.discountedAmount.toFixed(2)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.features}>
              {[
                '✦ No surge pricing',
                '⬡ Drivers keep 100%',
                '🛡 Real-time safety',
                '📱 Subscribe & save',
              ].map((f, i) => (
                <View key={i} style={styles.featurePill}>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(10,22,40,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.5)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  riderName: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  subBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, backgroundColor: 'rgba(201,149,43,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,149,43,0.2)',
  },
  subBadgeText: { color: '#c9952b', fontSize: 11, fontWeight: '600' },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 30,
    maxHeight: height * 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 10,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: '#d1d5db', borderRadius: 2,
    alignSelf: 'center', marginTop: 8, marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f5f9', borderRadius: 14,
    padding: 14, marginBottom: 8,
  },
  locationDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#ef4444', marginRight: 10,
  },
  searchInput: {
    flex: 1, fontSize: 15, color: '#1a1a2e',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchResults: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8,
  },
  searchResult: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
  },
  searchResultIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  searchResultName: { fontWeight: '600', color: '#0a1628', fontSize: 14 },
  searchResultAddr: { fontSize: 12, color: '#94a3b8' },
  fareCard: {
    backgroundColor: '#f8f9fc', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12,
  },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fareLabel: { fontSize: 13, color: '#64748b' },
  fareAmount: { fontSize: 28, fontWeight: '800', color: '#0a1628', marginTop: 2 },
  fareDetails: { alignItems: 'flex-end' },
  fareDetail: { fontSize: 13, color: '#64748b' },
  discountBadge: {
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  discountText: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  fareBreakdown: { marginTop: 8 },
  breakdownText: { fontSize: 11, color: '#94a3b8' },
  requestBtn: {
    backgroundColor: '#c9952b', padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 12,
    shadowColor: '#c9952b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 4,
  },
  requestBtnDisabled: { opacity: 0.5 },
  requestBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  featurePill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 20 },
  featureText: { fontSize: 11, color: '#475569' },
  markerPin: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  markerInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});
