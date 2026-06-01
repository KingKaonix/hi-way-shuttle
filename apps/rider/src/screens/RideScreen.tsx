import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Animated, Vibration,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { api } from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Ride'>;
  route: any;
};

type RideStatus = 'searching' | 'accepted' | 'enroute' | 'picked_up' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_COLORS: Record<RideStatus, string> = {
  searching: '#f59e0b',
  accepted: '#3b82f6',
  enroute: '#10b981',
  picked_up: '#10b981',
  in_progress: '#10b981',
  completed: '#64748b',
  cancelled: '#ef4444',
};

export default function RideScreen({ navigation }: Props) {
  const [status, setStatus] = useState<RideStatus>('searching');
  const [driverName] = useState('Alex Rivera');
  const [driverVehicle] = useState('Tesla Model 3 · Navy');
  const [fare] = useState(12.50);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for searching
    if (status === 'searching') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      // Simulate match after 3s
      setTimeout(() => {
        setStatus('accepted');
        if (Vibration) Vibration.vibrate(100);
      }, 3000);
    }
  }, [status]);

  const cancelRide = () => {
    Alert.alert('Cancel Ride', 'Are you sure?', [
      { text: 'Keep riding', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: () => {
        setStatus('cancelled');
        setTimeout(() => navigation.goBack(), 1500);
      }},
    ]);
  };

  const statusLabel = (s: RideStatus) => {
    const labels: Record<RideStatus, string> = {
      searching: 'Finding your driver...',
      accepted: 'Driver assigned',
      enroute: 'Driver en route',
      picked_up: 'You\'re picked up!',
      in_progress: 'On the way',
      completed: 'Trip completed!',
      cancelled: 'Cancelled',
    };
    return labels[s];
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a1628' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 40.7128, longitude: -74.006,
          latitudeDelta: 0.02, longitudeDelta: 0.02,
        }}
        showsUserLocation
      />

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.statusLabel}>{statusLabel(status)}</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Status indicator */}
      {status === 'searching' && (
        <View style={styles.searchingOverlay}>
          <Animated.View style={[styles.searchingCircle, { opacity: pulseAnim }]} />
          <ActivityIndicator size="large" color="#c9952b" />
          <Text style={styles.searchingText}>Finding your driver</Text>
          <Text style={styles.searchingSub}>Using AI-powered matching...</Text>
          <TouchableOpacity onPress={cancelRide} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active ride card */}
      {status !== 'searching' && status !== 'cancelled' && (
        <View style={styles.rideCard}>
          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{driverName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.driverVehicle}>{driverVehicle}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
          </View>

          <View style={styles.rideStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>ETA</Text>
              <Text style={styles.statValue}>3 min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Fare</Text>
              <Text style={styles.statValue}>${fare.toFixed(2)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, { color: STATUS_COLORS[status], fontSize: 12 }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
              Alert.alert('Trip shared', 'Your location has been shared with your emergency contact.');
            }}>
              <Ionicons name="share-outline" size={18} color="#475569" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={cancelRide}>
              <Ionicons name="close-outline" size={18} color="#dc2626" />
              <Text style={[styles.actionText, { color: '#dc2626' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
              Alert.alert('Safety Alert', 'Emergency contacts have been notified.');
              Vibration.vibrate(200);
            }}>
              <Ionicons name="shield-outline" size={18} color="#dc2626" />
              <Text style={[styles.actionText, { color: '#dc2626' }]}>Safety</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Completed */}
      {status === 'completed' && (
        <View style={styles.completedOverlay}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text style={styles.completedText}>Trip Complete!</Text>
          <Text style={styles.completedSub}>You earned 50 HiWay points</Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cancelled */}
      {status === 'cancelled' && (
        <View style={styles.completedOverlay}>
          <Ionicons name="close-circle" size={64} color="#ef4444" />
          <Text style={[styles.completedText, { color: '#ef4444' }]}>Ride Cancelled</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(10,22,40,0.9)',
  },
  backBtn: { padding: 4 },
  statusLabel: { color: '#e7b433', fontWeight: '600', fontSize: 14 },
  searchingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(10,22,40,0.7)',
    zIndex: 5,
  },
  searchingCircle: {
    position: 'absolute',
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201,149,43,0.15)',
  },
  searchingText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 },
  searchingSub: { color: '#64748b', fontSize: 14, marginTop: 4 },
  cancelBtn: { marginTop: 32, padding: 12, paddingHorizontal: 32 },
  cancelBtnText: { color: '#ef4444', fontWeight: '600' },
  rideCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 10,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#c9952b',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  driverName: { color: '#0a1628', fontWeight: '700', fontSize: 16 },
  driverVehicle: { color: '#64748b', fontSize: 13 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  rideStats: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#94a3b8', fontSize: 11 },
  statValue: { color: '#0a1628', fontWeight: '700', fontSize: 16, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e2e8f0' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  actionDanger: { backgroundColor: '#fef2f2' },
  actionText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  completedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(10,22,40,0.8)', zIndex: 10,
  },
  completedText: { color: '#10b981', fontSize: 22, fontWeight: '700', marginTop: 12 },
  completedSub: { color: '#64748b', fontSize: 14, marginTop: 4 },
  doneBtn: { marginTop: 24, backgroundColor: '#c9952b', padding: 14, paddingHorizontal: 48, borderRadius: 14 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
