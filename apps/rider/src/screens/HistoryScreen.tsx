import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { api } from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

export default function HistoryScreen({ navigation }: Props) {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const riderId = await AsyncStorage.getItem('hiway_rider_id');
      if (riderId) {
        try {
          const data = await api.rider.getHistory(riderId);
          setRides(data);
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a1628' }}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
      </View>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No rides yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <Ionicons name="car-outline" size={20} color="#c9952b" />
              <Text style={styles.routeName}>{item.pickup?.name || 'Ride'}</Text>
            </View>
            <Text style={styles.rideDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
            </Text>
            <View style={styles.rideFooter}>
              <Text style={styles.fareText}>${item.fare?.toFixed(2) || '—'}</Text>
              <Text style={[styles.statusText, {
                color: item.status === 'completed' ? '#10b981' : item.status === 'cancelled' ? '#ef4444' : '#f59e0b'
              }]}>
                {item.status || 'completed'}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.5)' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748b', fontSize: 14, marginTop: 8 },
  rideCard: {
    backgroundColor: 'rgba(30,58,95,0.3)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(30,58,95,0.4)',
  },
  rideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  rideDate: { color: '#64748b', fontSize: 12, marginTop: 4 },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.4)' },
  fareText: { color: '#c9952b', fontWeight: '700', fontSize: 14 },
  statusText: { fontSize: 12, fontWeight: '500' },
});
