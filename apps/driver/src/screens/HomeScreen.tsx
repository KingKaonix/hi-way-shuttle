import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Vibration,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { Map, Camera, UserLocation, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { CameraRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../App';
import {
  fetchRoute, formatDuration, formatDistance,
  routeToGeoJSON, openDirections,
} from '../utils/navigation';

const { width, height } = Dimensions.get('window');
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const PICKUP = { lat: 40.7128, lng: -74.006, name: 'Downtown' };
const DROPOFF = { lat: 40.6413, lng: -73.7781, name: 'Airport Terminal 2' };

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  driverId: string;
  driverName: string;
};

export default function HomeScreen({ navigation, driverId, driverName }: Props) {
  const cameraRef = useRef<CameraRef>(null);
  const [online, setOnline] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.006 });
  const [showRequest, setShowRequest] = useState(false);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);
  const [trips, setTrips] = useState(0);
  const [rating, setRating] = useState(5.0);
  const [requestTimer, setRequestTimer] = useState(15);
  const [routeGeo, setRouteGeo] = useState<any>(null);
  const [routeETA, setRouteETA] = useState<{ duration: number; distance: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch route when ride is accepted or when moving
  const loadRoute = useCallback(async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    setLoading(true);
    const result = await fetchRoute([from.lng, from.lat], [to.lng, to.lat]);
    if (result) {
      setRouteGeo(routeToGeoJSON(result.geometry.coordinates));
      setRouteETA({ duration: result.geometry.duration, distance: result.geometry.distance });

      // Fit map to route bounds
      const coords = result.geometry.coordinates;
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      cameraRef.current?.fitBounds(
        [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005],
        [Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005],
        [120, 50, 120, 50],
        500,
      );
    }
    setLoading(false);
  }, []);

  const navigateTo = useCallback(async () => {
    if (activeRide) {
      await openDirections(DROPOFF, location);
    }
  }, [activeRide, location]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access is required for ride matching.');
        return;
      }
      setLocationPermission(true);

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          cameraRef.current?.flyTo([pos.coords.longitude, pos.coords.latitude], 500);
          if (online) {
            api.driver.setStatus(driverId, { online: true, ...coords }).catch(() => {});
          }
          // Refresh route if active
          if (activeRide) {
            loadRoute(coords, DROPOFF);
          }
        }
      );

      loadEarnings();
    })();
  }, []);

  const loadEarnings = async () => {
    try {
      const data = await api.driver.getEarnings(driverId);
      setEarnings(data.totalEarnings || 0);
      setTrips(data.totalTrips || 0);
      setRating(data.rating || 5.0);
    } catch {}
  };

  const toggleOnline = async () => {
    const newState = !online;
    setOnline(newState);
    try { await api.driver.setStatus(driverId, { online: newState, ...location }); } catch {}
    if (newState) {
      setTimeout(() => { if (newState) simulateRideRequest(); }, 5000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setShowRequest(false);
    }
  };

  const simulateRideRequest = () => {
    setShowRequest(true);
    setRequestTimer(15);
    Vibration.vibrate([200, 100, 200]);
    timerRef.current = setInterval(() => {
      setRequestTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); declineRide(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const acceptRide = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowRequest(false);
    const ride = { id: 'ride_' + Date.now(), status: 'accepted', fare: 12.50 };
    setActiveRide(ride);
    Vibration.vibrate(100);

    // Fetch route to pickup
    await loadRoute(location, PICKUP);
  };

  const declineRide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowRequest(false);
  };

  const completeRide = () => {
    if (!activeRide) return;
    const newEarnings = earnings + activeRide.fare;
    setEarnings(newEarnings);
    setTrips(prev => prev + 1);
    AsyncStorage.setItem('hiway_earnings', String(newEarnings));
    AsyncStorage.setItem('hiway_trips', String(trips + 1));
    setActiveRide(null);
    setRouteGeo(null);
    setRouteETA(null);
    Alert.alert(`Trip Complete!`, `You earned $${activeRide.fare.toFixed(2)}`);
  };

  const cancelRide = () => {
    setActiveRide(null);
    setRouteGeo(null);
    setRouteETA(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a1628' }}>
      <Map style={{ flex: 1 }} mapStyle={MAP_STYLE} logoEnabled logoPosition={{ bottom: 8, left: 8 }}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: [-74.006, 40.7128], zoomLevel: 14 }}
        />
        {locationPermission && <UserLocation visible showsUserHeadingIndicator />}

        {/* Route line */}
        {routeGeo && (
          <GeoJSONSource id="routeSource" geoJSON={routeGeo}>
            <Layer
              id="routeLine"
              style={{
                lineColor: '#38bdf8',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.85,
              }}
            />
          </GeoJSONSource>
        )}
      </Map>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{driverName.charAt(0)}</Text></View>
          <View>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.statusText}>{online ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, online ? styles.toggleOn : styles.toggleOff]}
          onPress={toggleOnline}
        >
          <Text style={styles.toggleText}>{online ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Ride request card */}
      {showRequest && (
        <View style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <Text style={styles.requestTitle}>NEW RIDE REQUEST</Text>
            <Text style={styles.requestTimer}>{requestTimer}s</Text>
          </View>
          <View style={styles.requestRow}>
            <Ionicons name="location" size={16} color="#10b981" />
            <Text style={styles.requestText}>{PICKUP.name} · 0.8 mi away</Text>
          </View>
          <View style={styles.requestRow}>
            <Ionicons name="navigate" size={16} color="#c9952b" />
            <Text style={styles.requestText}>{DROPOFF.name}</Text>
          </View>
          <View style={styles.requestFare}>
            <Text style={styles.fareLabel}>Est. Fare</Text>
            <Text style={styles.fareAmount}>$12.50</Text>
          </View>
          <View style={styles.requestActions}>
            <TouchableOpacity style={styles.declineBtn} onPress={declineRide}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={acceptRide}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active ride with navigation */}
      {activeRide && (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <View style={styles.activeDot} />
            <Text style={styles.activeStatus}>Pickup — {PICKUP.name}</Text>
            <Text style={styles.activeFare}>${activeRide.fare.toFixed(2)}</Text>
          </View>

          {routeETA && (
            <View style={styles.etaRow}>
              <View style={styles.etaItem}>
                <Ionicons name="time-outline" size={16} color="#10b981" />
                <Text style={styles.etaValue}>{formatDuration(routeETA.duration)}</Text>
                <Text style={styles.etaLabel}>ETA</Text>
              </View>
              <View style={styles.etaDivider} />
              <View style={styles.etaItem}>
                <Ionicons name="navigate-outline" size={16} color="#c9952b" />
                <Text style={styles.etaValue}>{formatDistance(routeETA.distance)}</Text>
                <Text style={styles.etaLabel}>Distance</Text>
              </View>
            </View>
          )}

          <View style={styles.activeRoute}>
            <View style={styles.routeLine} />
            <View>
              <Text style={styles.routePickup}>{PICKUP.name}</Text>
              <Text style={styles.routeDropoff}>{DROPOFF.name} · dropoff</Text>
            </View>
          </View>

          <View style={styles.activeActions}>
            <TouchableOpacity style={styles.navigateBtn} onPress={navigateTo} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#0f172a" />
                  <Text style={styles.navigateText}>Navigate</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={completeRide}>
              <Text style={styles.completeText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelActiveBtn} onPress={cancelRide}>
              <Ionicons name="close" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stats */}
      {!activeRide && !showRequest && (
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Earnings</Text>
              <Text style={styles.statValueGold}>${earnings.toFixed(2)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Trips</Text>
              <Text style={styles.statValue}>{trips}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Rating</Text>
              <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewEarnings} onPress={() => navigation.navigate('Earnings')}>
            <Text style={styles.viewEarningsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#c9952b" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, backgroundColor: 'rgba(10,22,40,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.5)',
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#c9952b', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  driverName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusText: { color: '#64748b', fontSize: 11 },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  toggleOn: { backgroundColor: '#10b981' },
  toggleOff: { backgroundColor: '#475569' },
  toggleText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  requestCard: {
    position: 'absolute', bottom: 100, left: 16, right: 16, zIndex: 10,
    backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(201,149,43,0.3)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10,
  },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  requestTitle: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  requestTimer: { color: '#c9952b', fontSize: 16, fontWeight: '700' },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  requestText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  requestFare: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.5)', marginTop: 4 },
  fareLabel: { color: '#64748b', fontSize: 11 },
  fareAmount: { color: '#10b981', fontSize: 22, fontWeight: '800' },
  requestActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  declineBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center' },
  declineText: { color: '#ef4444', fontWeight: '600' },
  acceptBtn: { flex: 3, padding: 14, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '700' },
  activeCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 10,
  },
  activeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#38bdf8', marginRight: 8 },
  activeStatus: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },
  activeFare: { color: '#c9952b', fontWeight: '800', fontSize: 18 },
  etaRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, marginBottom: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.5)',
  },
  etaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  etaDivider: { width: 1, height: 24, backgroundColor: 'rgba(30,58,95,0.5)' },
  etaValue: { color: '#fff', fontWeight: '700', fontSize: 14 },
  etaLabel: { color: '#64748b', fontSize: 11 },
  activeRoute: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.5)' },
  routeLine: { width: 2, backgroundColor: '#38bdf8', borderRadius: 1 },
  routePickup: { color: '#fff', fontWeight: '600', fontSize: 14 },
  routeDropoff: { color: '#64748b', fontSize: 13, marginTop: 2 },
  activeActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  navigateBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 14, borderRadius: 12, backgroundColor: '#38bdf8',
  },
  navigateText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  completeBtn: {
    flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  completeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelActiveBtn: {
    width: 48, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelActiveText: { color: '#ef4444', fontWeight: '600' },
  statsCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 10,
  },
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#64748b', fontSize: 11 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 },
  statValueGold: { color: '#c9952b', fontSize: 22, fontWeight: '800', marginTop: 2 },
  viewEarnings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 },
  viewEarningsText: { color: '#c9952b', fontSize: 13, fontWeight: '600' },
});
