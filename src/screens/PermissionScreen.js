import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  AppState,
  StatusBar,
  Dimensions,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PermissionLogo from '../components/PermissionLogo';
import { Check, X } from 'lucide-react-native';
import { Camera } from 'expo-camera';
// TODO: Re-enable when adding notification features
// import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

// Native Android Storage/Media Permission Helpers
export const checkNativeStoragePermission = async () => {
  if (Platform.OS === 'android') {
    const permission = Platform.Version >= 33 
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES 
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    return await PermissionsAndroid.check(permission);
  }
  if (Platform.OS === 'ios') {
    const res = await MediaLibrary.getPermissionsAsync();
    return res.granted || res.status === 'granted';
  }
  return true;
};

export const requestNativeStoragePermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  if (Platform.OS === 'ios') {
    const res = await MediaLibrary.requestPermissionsAsync();
    return res.granted || res.status === 'granted';
  }
  return true;
};

export default function PermissionScreen({ onPermissionsGranted, navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: null,
    media: null,
    // notifications: null, // TODO: Re-enable when adding notification features
    microphone: null,
  });

  const appState = useRef(AppState.currentState);

  // Passive check that does NOT request permissions
  const checkPermissionStatus = async () => {
    try {
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      
      const isMediaGranted = await checkNativeStoragePermission();
      const mediaStatusCombined = {
        granted: isMediaGranted,
        status: isMediaGranted ? 'granted' : 'denied',
        canAskAgain: true
      };

      // TODO: Re-enable when adding notification features
      // const notificationsStatus = await Notifications.getPermissionsAsync();
      const microphoneStatus = { granted: true, status: 'granted' }; // Automatically granted

      return {
        camera: cameraStatus,
        media: mediaStatusCombined,
        // notifications: notificationsStatus, // TODO: Re-enable
        microphone: microphoneStatus,
      };
    } catch (error) {
      console.error('Error checking permission status:', error);
      return {
        camera: { granted: false, status: 'undetermined' },
        media: { granted: false, status: 'undetermined' },
        // notifications: { granted: false, status: 'undetermined' }, // TODO: Re-enable
        microphone: { granted: true, status: 'granted' },
      };
    }
  };

  const syncAndCheck = async (shouldNavigate = true) => {
    const status = await checkPermissionStatus();
    setPermissions(status);
    setLoading(false);

    const allGranted = Boolean(
      isGranted(status.camera) &&
      isGranted(status.media) &&
      // isGranted(status.notifications) && // TODO: Re-enable when adding notification features
      isGranted(status.microphone)
    );

    if (allGranted && shouldNavigate) {
      onPermissionsGranted();
      if (navigation) {
        navigation.replace('Onboarding');
      }
    }
  };

  useEffect(() => {
    // Initial check on launch
    syncAndCheck(true);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Sync state when coming back from system settings
        syncAndCheck(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isGranted = (perm) => {
    return perm?.granted || perm?.status === 'granted';
  };

  const isPermanentlyDenied = (perm) => {
    if (!perm) return false;
    return (perm.status === 'denied' || perm.granted === false) && perm.canAskAgain === false;
  };

  const handleRequestCamera = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let res = await Camera.requestCameraPermissionsAsync();
      if (Platform.OS === 'ios' && (!res || !res.granted) && res?.canAskAgain) {
        res = await ImagePicker.requestCameraPermissionsAsync();
      }
      setPermissions((prev) => ({ ...prev, camera: res }));
      return res;
    } catch (error) {
      console.error('Failed to request Camera permission:', error);
      Alert.alert('Permission Error', 'Failed to request camera permission.');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestMedia = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let combinedRes;
      if (Platform.OS === 'ios') {
        let res = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!res || (!res.granted && res.canAskAgain !== false)) {
          res = await MediaLibrary.requestPermissionsAsync();
        }
        const isGranted = Boolean(res?.granted || res?.status === 'granted');
        combinedRes = {
          granted: isGranted,
          status: res?.status || (isGranted ? 'granted' : 'denied'),
          canAskAgain: res?.canAskAgain !== false
        };
        setPermissions((prev) => ({ ...prev, media: combinedRes }));
        
        if (!isGranted && res?.canAskAgain === false) {
          Alert.alert(
            'Photo Library Permission',
            'Photo Library access is required to select and save images. Please enable Photo Library access in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => handleOpenSettings() },
            ]
          );
        }
      } else {
        const isGrantedNative = await requestNativeStoragePermission();
        combinedRes = {
          granted: isGrantedNative,
          status: isGrantedNative ? 'granted' : 'denied',
          canAskAgain: true
        };
        setPermissions((prev) => ({ ...prev, media: combinedRes }));
      }

      return combinedRes;
    } catch (error) {
      console.error('Failed to request Media/Storage permission:', error);
      if (Platform.OS === 'ios') {
        handleOpenSettings();
      }
    } finally {
      setBusy(false);
    }
  };

  // TODO: Re-enable when adding notification features
  // const handleRequestNotifications = async () => {
  //   if (busy) return;
  //   setBusy(true);
  //   try {
  //     const res = await Notifications.requestPermissionsAsync({
  //       ios: {
  //         allowAlert: true,
  //         allowBadge: true,
  //         allowSound: true,
  //       },
  //     });
  //     setPermissions((prev) => ({ ...prev, notifications: res }));
  //     return res;
  //   } catch (error) {
  //     console.error('Failed to request Notifications permission:', error);
  //     Alert.alert('Permission Error', 'Failed to request notification permission.');
  //   } finally {
  //     setBusy(false);
  //   }
  // };

  const handleRequestMicrophone = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setPermissions((prev) => ({ ...prev, microphone: res }));
      return res;
    } catch (error) {
      console.error('Failed to request Microphone permission:', error);
      Alert.alert('Permission Error', 'Failed to request microphone permission.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        try {
          await Linking.sendIntent('android.settings.APPLICATION_DETAILS_SETTINGS', [
            { key: 'package', value: 'com.yourname.reverseimagesearchapp' }
          ]);
        } catch (_) {
          await Linking.openSettings();
        }
      } else {
        await Linking.openSettings();
      }
    } catch (err) {
      Linking.openSettings();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#29BD4F" />
      </View>
    );
  }

  // Sequential permission configuration
  const permissionFlow = [
    {
      key: 'media',
      title: Platform.OS === 'ios' ? 'Photo Library Permission' : 'Storage Permission',
      status: permissions.media,
      request: handleRequestMedia,
      settingsLabel: Platform.OS === 'ios' ? 'PHOTO LIBRARY' : 'STORAGE',
    },
    {
      key: 'camera',
      title: 'Camera Permission',
      status: permissions.camera,
      request: handleRequestCamera,
      settingsLabel: 'CAMERA',
    },
    // TODO: Re-enable when adding notification features
    // {
    //   key: 'notifications',
    //   title: 'Notification Permission',
    //   status: permissions.notifications,
    //   request: handleRequestNotifications,
    //   settingsLabel: 'NOTIFICATIONS',
    // },
  ];

  const handlePermissionRequest = async (item) => {
    if (busy) return;

    // Always attempt to trigger the OS dialog directly
    await item.request();

    await syncAndCheck(true);
  };

  // Get the next permission in sequence that needs action
  const nextRequired = permissionFlow.find((item) => !isGranted(item.status));

  const handleActionButtonPress = async () => {
    if (!nextRequired) {
      onPermissionsGranted();
      return;
    }

    await handlePermissionRequest(nextRequired);
  };

  // Determine bottom button details
  let actionButtonText = 'PROCEED';
  if (nextRequired) {
    const isDenied = isPermanentlyDenied(nextRequired.status);
    if (isDenied) {
      actionButtonText = `OPEN SETTINGS FOR ${nextRequired.settingsLabel}`;
    } else {
      actionButtonText = `ALLOW ${nextRequired.settingsLabel} PERMISSION`;
    }
  }

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // Proportional scaling from Figma canvas width (1080px)
  const scale = SCREEN_WIDTH / 1080;
  const logoWidth = 534 * scale;
  const logoHeight = 534 * scale;
  const logoTop = 489 * scale;

  // Figma list container size & spacing (W 685, total H 819, Gap Y 150 from logo bottom)
  const listWidth = 685 * scale;
  const listGap = 150 * scale;

  // Figma title properties (W 685, H 84, Y 1173)
  const titleWidth = 685 * scale;
  const titleHeight = 84 * scale;
  const titleFontSize = 71.31 * scale;
  const titleGap = 0 * scale; // Reduced gap to bring list closer to heading

  // Remaining height of the 819px container for the checklist items (819 - 84 - 63 = 672)
  const checklistHeight = (819 - 84 - 63) * scale;

  // Exact Figma text properties
  const textWidth = 550 * scale; // Increased from 384 to prevent text truncation
  const textHeight = 51 * scale;
  const fontSize = 43.64 * scale;

  const circleSize = 32 * scale;
  const iconSize = 18.62 * scale;
  const circleLeftOffset = 0;
  const circleMarginRight = 34.69 * scale; // Gap to make text start exactly at X 238

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131313" translucent={true} />

      <View style={{ flex: 1 }}>
        {/* Spacing from top matching Figma Y 489 */}
        <View style={{ height: logoTop }} />

        {/* Security Logo matching Figma W 534 H 534 */}
        <View style={styles.logoContainer}>
          <PermissionLogo width={logoWidth} height={logoHeight} />
        </View>

        {/* Spacing between logo and list matching Figma Y 150 */}
        <View style={{ height: listGap }} />

        {/* Title Header: Permission Required! */}
        <View style={{ width: titleWidth, minHeight: titleHeight, justifyContent: 'center', alignSelf: 'center' }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
            style={[styles.headerText, { fontSize: titleFontSize }]}
          >
            Permission Required!
          </Text>
        </View>

        {/* Permissions List matching Figma W 685, H 672 */}
        <View style={[styles.listContainer, { width: titleWidth, height: checklistHeight, marginTop: -100 * scale }]}>
          {permissionFlow.map((item, index) => {
            const granted = isGranted(item.status);
            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [
                  styles.listItem,
                  {
                    height: 120 * scale,
                    alignItems: 'flex-start',
                  },
                  pressed && styles.listItemPressed
                ]}
                onPress={async () => {
                  if (!granted) {
                    if (isPermanentlyDenied(item.status)) {
                      handleOpenSettings();
                    } else {
                      await handlePermissionRequest(item);
                    }
                  }
                }}
              >
                <View
                  style={[
                    styles.checkCircle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      marginLeft: circleLeftOffset,
                      marginRight: circleMarginRight,
                      borderWidth: 0,
                      marginTop: ((51 - 32) / 2) * scale, // Vertically center the circle relative to the 51px text height
                    },
                    granted ? styles.checkCircleGranted : styles.checkCircleDenied
                  ]}
                >
                  {granted ? (
                    <Image
                      source={
                        Platform.OS === 'ios'
                          ? Image.resolveAssetSource(require('../components/vector_tick_2.png'))
                          : require('../components/Vector tick(2).png')
                      }
                      style={[
                        { width: 32.59 * scale, height: 23.28 * scale, resizeMode: 'contain' },
                        Platform.OS === 'ios' && {
                          width: Math.round(32.59 * scale),
                          height: Math.round(23.28 * scale),
                        },
                      ]}
                    />
                  ) : (
                    <Image
                      source={
                        Platform.OS === 'ios'
                          ? Image.resolveAssetSource(require('../components/vector_cross_1.png'))
                          : require('../components/Vector (cross) (1).png')
                      }
                      style={[
                        { width: iconSize, height: iconSize, resizeMode: 'contain' },
                        Platform.OS === 'ios' && {
                          width: Math.round(iconSize),
                          height: Math.round(iconSize),
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={{ width: textWidth, height: textHeight, justifyContent: 'center' }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.listItemText,
                      {
                        color: granted ? '#86FF29' : '#FF2929',
                        fontSize,
                      }
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Button at the bottom matching Figma coordinates X 63, Y 2142, W 953, H 139, Radius 15, Fill #ADC7FF */}
      <View style={[styles.buttonContainer, { marginBottom: 4 * scale }]}>
        <Pressable
          onPress={handleActionButtonPress}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              width: 953 * scale,
              height: 139 * scale,
              borderRadius: 15 * scale,
            },
            pressed && styles.buttonPressed
          ]}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            style={[styles.primaryButtonText, { fontSize: 45 * scale }]}
          >
            {actionButtonText}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#131313',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  listContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  listItemPressed: {
    opacity: 0.7,
  },
  checkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDenied: {
    borderColor: '#FF2929',
    backgroundColor: 'transparent',
  },
  checkCircleGranted: {
    borderColor: '#86FF29',
    backgroundColor: 'transparent',
  },
  listItemText: {
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
    opacity: 0.8,
  },
  buttonContainer: {
    alignSelf: 'center',
  },
  primaryButton: {
    backgroundColor: '#ADC7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#131313',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
