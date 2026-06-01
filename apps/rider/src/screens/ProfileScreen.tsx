import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const resetApp = () => {
    Alert.alert('Reset App', 'This will clear all local data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'Home' as any }] });
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a1628' }}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="card-outline" size={20} color="#c9952b" />
          <Text style={styles.rowText}>Subscription</Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="shield-outline" size={20} color="#c9952b" />
          <Text style={styles.rowText}>Safety Settings</Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="notifications-outline" size={20} color="#c9952b" />
          <Text style={styles.rowText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="help-circle-outline" size={20} color="#c9952b" />
          <Text style={styles.rowText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={resetApp}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={[styles.rowText, { color: '#ef4444' }]}>Reset App</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>HiWay Rider v1.0.0</Text>
        <Text style={styles.versionSub}>Revolutionary rideshare. Zero surge.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.5)' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: 'rgba(30,58,95,0.3)',
    borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.4)',
  },
  rowText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  version: { alignItems: 'center', paddingTop: 40 },
  versionText: { color: '#475569', fontSize: 12 },
  versionSub: { color: '#475569', fontSize: 11, marginTop: 2 },
});
