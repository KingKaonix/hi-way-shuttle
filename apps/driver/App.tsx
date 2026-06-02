import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { api } from './src/api/client';
import HomeScreen from './src/screens/HomeScreen';
import EarningsScreen from './src/screens/EarningsScreen';
import PayoutScreen from './src/screens/PayoutScreen';

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Home: undefined;
  Earnings: undefined;
  Payout: undefined;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      let id = await AsyncStorage.getItem('hiway_driver_id');
      let name = await AsyncStorage.getItem('hiway_driver_name');
      let vehicle = await AsyncStorage.getItem('hiway_driver_vehicle');

      if (!id) {
        const displayName = 'Driver';
        const result = await api.driver.register({
          name: displayName,
          vehicle: 'Sedan',
          licensePlate: 'HIWAY',
          email: `driver_${Date.now()}@hiway.driver`,
        });
        id = result.driver.id;
        name = result.driver.name;
        vehicle = result.driver.vehicle;
        await AsyncStorage.setItem('hiway_driver_id', id);
        await AsyncStorage.setItem('hiway_driver_name', name);
        await AsyncStorage.setItem('hiway_driver_vehicle', vehicle || '');
      }

      setDriverId(id);
      setDriverName(name || '');
    } catch (e) {
      console.error('Init failed:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#c9952b" />
        <Text style={styles.loadingText}>HiWay Driver</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0a1628' },
              animation: 'slide_from_bottom',
            }}
          >
            <Stack.Screen name="Home">
              {(props) => <HomeScreen {...props} driverId={driverId!} driverName={driverName} />}
            </Stack.Screen>
            <Stack.Screen name="Earnings" component={EarningsScreen} />
          <Stack.Screen name="Payout" component={PayoutScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#e7b433', fontSize: 20, fontWeight: '800', marginTop: 12 },
});
