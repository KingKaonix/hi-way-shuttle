import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { api } from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payout'>;
};

export default function PayoutScreen({ navigation }: Props) {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const id = await AsyncStorage.getItem('hiway_driver_id');
    if (!id) return;
    setDriverId(id);
    try {
      const [bal, pays, meths] = await Promise.all([
        api.driver.getBalance(id),
        api.driver.getPayouts(id),
        api.driver.getPayoutMethods(id),
      ]);
      setBalance(bal);
      setPayouts(pays);
      setMethods(meths);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const requestPayout = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      Alert.alert('Minimum', 'Minimum payout is $10');
      return;
    }
    if (balance && amount > balance.available) {
      Alert.alert('Insufficient', `You have $${balance.available.toFixed(2)} available`);
      return;
    }
    setWithdrawing(true);
    try {
      const method = methods[0] || { type: 'stripe', label: 'Bank Transfer' };
      await api.driver.requestPayout(driverId!, { amount, method });
      Alert.alert('Requested', `Payout of $${amount.toFixed(2)} is being processed`);
      setWithdrawAmount('');
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setWithdrawing(false);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
      paid: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
      cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
    };
    const c = colors[status] || colors.pending;
    return (
      <View style={[styles.badge, { backgroundColor: c.bg }]}>
        <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a1628' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>Payouts</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={payouts}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c9952b" />}
        ListHeaderComponent={
          <View>
            {/* Balance card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ${balance?.available?.toFixed(2) || '0.00'}
              </Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceStat}>
                  <Text style={styles.balanceStatValue}>${(balance?.totalEarnings || 0).toFixed(0)}</Text>
                  <Text style={styles.balanceStatLabel}>Earned</Text>
                </View>
                <View style={styles.balanceStat}>
                  <Text style={[styles.balanceStatValue, { color: '#64748b' }]}>${(balance?.paidOut || 0).toFixed(0)}</Text>
                  <Text style={styles.balanceStatLabel}>Paid Out</Text>
                </View>
                <View style={styles.balanceStat}>
                  <Text style={[styles.balanceStatValue, { color: '#f59e0b' }]}>${(balance?.pending || 0).toFixed(0)}</Text>
                  <Text style={styles.balanceStatLabel}>Pending</Text>
                </View>
              </View>
            </View>

            {/* Withdraw */}
            <View style={styles.withdrawCard}>
              <Text style={styles.sectionTitle}>Request Payout</Text>
              <View style={styles.withdrawRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.withdrawInput}
                  placeholder="10.00"
                  placeholderTextColor="#475569"
                  keyboardType="decimal-pad"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />
                <TouchableOpacity
                  style={[styles.withdrawBtn, (!withdrawAmount || withdrawing) && { opacity: 0.5 }]}
                  onPress={requestPayout}
                  disabled={!withdrawAmount || withdrawing}
                >
                  {withdrawing ? (
                    <ActivityIndicator color="#0f172a" size="small" />
                  ) : (
                    <Text style={styles.withdrawBtnText}>Withdraw</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.minNote}>Minimum $10 · Free · 1-3 business days</Text>
            </View>

            {/* Payout method */}
            <View style={styles.methodCard}>
              <Text style={styles.sectionTitle}>Payout Method</Text>
              {methods.length === 0 ? (
                <Text style={styles.noMethod}>No payout method set</Text>
              ) : (
                methods.map(m => (
                  <View key={m.id} style={styles.methodRow}>
                    <Ionicons name="card-outline" size={20} color="#c9952b" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodLabel}>{m.label}</Text>
                      <Text style={styles.methodType}>{m.type}</Text>
                    </View>
                  </View>
                ))
              )}
              <TouchableOpacity style={styles.addMethodBtn}>
                <Ionicons name="add" size={16} color="#c9952b" />
                <Text style={styles.addMethodText}>Add Method</Text>
              </TouchableOpacity>
            </View>

            {/* Payout history header */}
            <Text style={styles.historyTitle}>Payout History</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.payoutCard}>
            <View style={styles.payoutRow}>
              <View>
                <Text style={styles.payoutAmount}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.payoutDate}>
                  {new Date(item.requestedAt).toLocaleDateString()}
                </Text>
              </View>
              {statusBadge(item.status)}
            </View>
            {item.method && (
              <Text style={styles.payoutMethod}>via {item.method.label || item.method.type}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No payouts yet</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
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
  balanceCard: {
    margin: 16, backgroundColor: 'rgba(30,58,95,0.3)', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  balanceLabel: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  balanceAmount: { color: '#c9952b', fontSize: 42, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  balanceRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  balanceStat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 10, padding: 12 },
  balanceStatValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  balanceStatLabel: { color: '#64748b', fontSize: 11, marginTop: 2 },
  withdrawCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(30,58,95,0.3)', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 12 },
  withdrawRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dollarSign: { color: '#64748b', fontSize: 24, fontWeight: '700' },
  withdrawInput: {
    flex: 1, color: '#fff', fontSize: 24, fontWeight: '700',
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(30,58,95,0.5)',
  },
  withdrawBtn: {
    backgroundColor: '#c9952b', padding: 14, paddingHorizontal: 20,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  withdrawBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  minNote: { color: '#475569', fontSize: 11, marginTop: 8, textAlign: 'center' },
  methodCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(30,58,95,0.3)', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  noMethod: { color: '#475569', fontSize: 13, fontStyle: 'italic' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  methodLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
  methodType: { color: '#64748b', fontSize: 12, marginTop: 1 },
  addMethodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  addMethodText: { color: '#c9952b', fontSize: 13, fontWeight: '600' },
  historyTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginHorizontal: 16, marginBottom: 8, marginTop: 4 },
  payoutCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: 'rgba(30,58,95,0.3)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutAmount: { color: '#fff', fontSize: 18, fontWeight: '700' },
  payoutDate: { color: '#64748b', fontSize: 12, marginTop: 2 },
  payoutMethod: { color: '#475569', fontSize: 12, marginTop: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#64748b', fontSize: 14, marginTop: 8 },
});
