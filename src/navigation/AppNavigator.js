import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ResultScreen from '../screens/ResultScreen';
import AIArtDashboardScreen from '../screens/AIArtDashboardScreen';
import AIImageScreen from '../screens/AIImageScreen';
import AIImageResultScreen from '../screens/AIImageResultScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import LensCameraScreen from '../screens/LensCameraScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AIRemixScreen from '../screens/AIRemixScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PremiumVIPScreen from '../screens/PremiumVIPScreen';
import PermissionScreen from '../screens/PermissionScreen';
import { usePremium } from '../context/PremiumContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ isAuthorized, onPermissionsGranted }) {
  const { isOnboardingComplete, isLoading } = usePremium();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#131313' }}>
        <ActivityIndicator size="large" color="#ADC7FF" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!isAuthorized) {
      return "Permission";
    }
    if (!isOnboardingComplete) {
      return "Onboarding";
    }
    return "Home";
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          detachPreviousScreen: false,
          contentStyle: { backgroundColor: '#131313' },
          animationDuration: 200,
        }}
      >
        <Stack.Screen 
          name="Permission" 
          options={{ animation: 'none' }}
        >
          {(props) => <PermissionScreen {...props} onPermissionsGranted={onPermissionsGranted} />}
        </Stack.Screen>
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
          options={{ animation: 'none' }}
        />
        <Stack.Screen name="PremiumVIP" component={PremiumVIPScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="AIArtDashboard" component={AIArtDashboardScreen} />
        <Stack.Screen name="AIImageScreen" component={AIImageScreen} />
        <Stack.Screen name="AIImageResult" component={AIImageResultScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="LensCamera" component={LensCameraScreen} />
        <Stack.Screen name="Downloads" component={DownloadsScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="AIRemix" component={AIRemixScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
