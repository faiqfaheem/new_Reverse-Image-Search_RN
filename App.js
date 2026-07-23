import React, { useState, useEffect } from 'react';
import { StyleSheet, View, LogBox, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera as CameraAPI } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import PermissionScreen, { checkNativeStoragePermission } from './src/screens/PermissionScreen';
import SplashScreen from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { PremiumProvider } from './src/context/PremiumContext';

// Disable all warning popups/alerts on the mobile screen
LogBox.ignoreAllLogs();

export default function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Handle splash loading and initial permission check
  useEffect(() => {
    const checkPermissionsAndLoad = async () => {
      try {
        const camera = await CameraAPI.getCameraPermissionsAsync();
        const mediaGranted = await checkNativeStoragePermission();
        const notifications = await Notifications.getPermissionsAsync();

        const granted = Boolean(
          (camera?.status === 'granted' || camera?.granted === true) &&
          mediaGranted &&
          (notifications?.status === 'granted' || notifications?.granted === true)
        );
        setIsAuthorized(granted);
      } catch (err) {
        console.error('Error checking permissions on splash:', err);
      } finally {
        setTimeout(() => {
          setAppLoading(false);
        }, 2500); // Show splash for 2.5s
      }
    };

    checkPermissionsAndLoad();
  }, []);



  // Render Splash Screen during initial load
  if (appLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <SplashScreen />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <View style={styles.container}>
          <AppNavigator isAuthorized={isAuthorized} onPermissionsGranted={() => setIsAuthorized(true)} />
        </View>
      </PremiumProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
});