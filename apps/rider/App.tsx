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
import RideScreen from './src/screens/RideScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Home: undefined;
  Ride: { rideId?: string };
  History: undefined;
  Profile: undefined;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [riderName, setRiderName] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      let id = await AsyncStorage.getItem('hiway_rider_id');
      let name = await AsyncStorage.getItem('hiway_rider_name');

      if (!id) {
        // First launch — register
        const displayName = 'Rider';
        const result = await api.rider.register({
          name: displayName,
          phone: '',
          email: `rider_${Date.now()}@hiway.app`,
        });
        id = result.rider.id;
        name = result.rider.name;
        await AsyncStorage.setItem('hiway_rider_id', id);
        await AsyncStorage.setItem('hiway_rider_name', name);
      }

      setRiderId(id);
      setRiderName(name || '');
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
        <Text style={styles.loadingText}>HiWay Rider</Text>
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
              {(props) => <HomeScreen {...props} riderId={riderId!} riderName={riderName} />}
            </Stack.Screen>
            <Stack.Screen name="Ride" component={RideScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0a1628',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#e7b433',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: -0.5,
  },
});
