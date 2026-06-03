import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { api } from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Earnings'>;
};

export default function EarningsScreen({ navigation }: Props) {
  const [earnings, setEarnings] = useState(0);
  const [trips, setTrips] = useState(0);
  const [rating, setRating] = useState(5.0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const driverId = await AsyncStorage.getItem('hiway_driver_id');
      if (driverId) {
        try {
          const data = await api.driver.getEarnings(driverId);
          setEarnings(data.totalEarnings || 0);
          setTrips(data.totalTrips || 0);
          setRating(data.rating || 5.0);

          const hist = await api.driver.getHistory(driverId);
          setHistory(hist);
        } catch {}
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a1628' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryAmount}>${earnings.toFixed(0)}</Text>
          <Text style={styles.summarySub}>You keep 100%</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{trips}</Text>
            <Text style={styles.summaryStatLabel}>Trips</Text>
          </View>
          <TouchableOpacity style={styles.payoutBtn} onPress={() => navigation.navigate('Payout')}>
            <Ionicons name="wallet-outline" size={18} color="#c9952b" />
            <Text style={styles.payoutBtnText}>Payouts</Text>
            <Ionicons name="chevron-forward" size={16} color="#c9952b" />
          </TouchableOpacity>

          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.summaryStatLabel}>Rating</Text>
          </View>
        </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySub}>Go online to start earning</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripRoute}>{item.pickup?.name || 'Trip'}</Text>
              <Text style={styles.tripFare}>${item.fare?.toFixed(2) || '—'}</Text>
            </View>
            <Text style={styles.tripDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.5)',
  },
  backBtn: { padding: 4 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  summary: { padding: 16, gap: 12 },
  summaryCard: {
    backgroundColor: 'rgba(30,58,95,0.3)', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  summaryLabel: { color: '#64748b', fontSize: 13 },
  summaryAmount: {
    fontSize: 42, fontWeight: '800',
    color: '#c9952b', marginTop: 4,
  },
  summarySub: { color: '#10b981', fontSize: 12, fontWeight: '600', marginTop: 4 },
  payoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16, padding: 12,
    backgroundColor: 'rgba(201,149,43,0.1)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(201,149,43,0.2)',
  },
  payoutBtnText: { color: '#c9952b', fontWeight: '600', fontSize: 14 },

  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryStat: {
    flex: 1, backgroundColor: 'rgba(30,58,95,0.3)', borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  summaryStatValue: { color: '#fff', fontSize: 28, fontWeight: '700' },
  summaryStatLabel: { color: '#64748b', fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748b', fontSize: 16, fontWeight: '600', marginTop: 8 },
  emptySub: { color: '#475569', fontSize: 13, marginTop: 4 },
  tripCard: {
    backgroundColor: 'rgba(30,58,95,0.3)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tripRoute: { color: '#fff', fontWeight: '600', fontSize: 15 },
  tripFare: { color: '#c9952b', fontWeight: '700', fontSize: 16 },
  tripDate: { color: '#64748b', fontSize: 12, marginTop: 4 },
});
