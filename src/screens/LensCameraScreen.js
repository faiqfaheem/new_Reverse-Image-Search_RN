import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LENS_FRAME_SIZE = SCREEN_WIDTH * 0.75;

export default function LensCameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.fallbackContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.fallbackContent}>
          <Camera size={48} color="#FF3B30" style={{ marginBottom: 20 }} />
          <Text style={styles.fallbackTitle}>Camera Access Required</Text>
          <Text style={styles.fallbackDescription}>
            We need camera access so you can capture images for visual search.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.textBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.textBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        // Go to Result Screen with the captured photo
        navigation.navigate('Result', { searchQuery: '', imageUri: photo.uri });
      } catch (e) {
        console.warn('Camera capture error:', e);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleOpenGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Gallery permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'Images',
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      navigation.navigate('Result', { searchQuery: '', imageUri: result.assets[0].uri });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
        facing="back"
      />

      {/* Header Overlay */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Google Lens</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Center Viewfinder Frame Overlay */}
      <View style={styles.viewfinderContainer} pointerEvents="none">
        <View style={styles.viewfinderFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryBtn} onPress={handleOpenGallery}>
          <ImageIcon size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.captureOuterBtn} 
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={[styles.captureInnerBtn, isCapturing && { backgroundColor: '#888' }]} />
        </TouchableOpacity>

        <View style={{ width: 50 }} />
      </View>

      {isCapturing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  fallbackContainer: { flex: 1, backgroundColor: '#121212' },
  fallbackContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  fallbackTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  fallbackDescription: { fontSize: 15, color: '#AAA', textAlign: 'center', marginBottom: 32 },
  primaryBtn: { backgroundColor: '#007AFF', width: '100%', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  textBtn: { paddingVertical: 10 },
  textBtnText: { color: '#007AFF', fontSize: 15, fontWeight: '500' },
  
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 10,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderFrame: {
    width: LENS_FRAME_SIZE,
    height: LENS_FRAME_SIZE * 1.2,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },

  bottomControls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureOuterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  processingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  }
});
