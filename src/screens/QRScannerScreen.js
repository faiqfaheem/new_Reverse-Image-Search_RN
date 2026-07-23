import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Clipboard,
  Animated,
  Linking,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, Copy, Check, RefreshCw, AlertCircle, Camera } from 'lucide-react-native';
import { addHistoryEntry } from '../utils/historyManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH * 0.7;

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [copied, setCopied] = useState(false);

  // Animated laser line
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Loop the laser animation while scanning is active
  useEffect(() => {
    if (permission?.granted && !scanned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [permission, scanned]);

  if (!permission) {
    // Permissions are still loading
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Scanner...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Permission not granted / fallback screen
    return (
      <SafeAreaView style={styles.fallbackContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.fallbackContent}>
          <View style={styles.iconWrapper}>
            <Camera size={48} color="#FF3B30" />
          </View>
          <Text style={styles.fallbackTitle}>Camera Access Required</Text>
          <Text style={styles.fallbackDescription}>
            We need camera access so you can scan QR codes directly inside the app. Please grant permissions to proceed.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.secondaryBtnText}>Open Device Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.textBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    const trimmedData = data.trim();
    
    addHistoryEntry('qr', trimmedData);

    // Navigate to Result screen with the scanned content and a fromQR flag
    navigation.navigate('Result', { 
      searchQuery: trimmedData, 
      imageUri: null, 
      fromQR: true 
    });

    // Reset scanner state after a short delay so if they return they can scan again
    setTimeout(() => {
      setScanned(false);
    }, 1500);
  };

  const handleCopyToClipboard = () => {
    Clipboard.setString(scanResult);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDismissResult = () => {
    setScanResult('');
    setScanned(false);
  };

  // Interpolate laser line position
  const translateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark Transparent Overlays around the Scanner Square */}
      <View style={styles.overlayContainer}>
        {/* Top Dark Bar */}
        <View style={[styles.darkOverlay, styles.topOverlay]}>
          <SafeAreaView style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <View style={{ width: 40 }} />
          </SafeAreaView>
        </View>

        {/* Middle row containing: Left Overlay | Scanning Window | Right Overlay */}
        <View style={styles.middleRow}>
          <View style={styles.darkOverlay} />
          
          <View style={styles.scannerFrame}>
            {/* Corner Indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Animated Laser Line */}
            {!scanned && (
              <Animated.View
                style={[
                  styles.laser,
                  { transform: [{ translateY }] }
                ]}
              />
            )}
          </View>

          <View style={styles.darkOverlay} />
        </View>

        {/* Bottom Dark Bar */}
        <View style={[styles.darkOverlay, styles.bottomOverlay]}>
          <Text style={styles.hintText}>
            Align the QR code within the frame to scan
          </Text>
        </View>
      </View>

      {/* Result Dialog Modal */}
      <Modal
        visible={!!scanResult}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDismissResult}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AlertCircle size={24} color="#007AFF" />
              <Text style={styles.modalTitle}>Scanned Content</Text>
            </View>

            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{scanResult}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.copyBtn]}
                onPress={handleCopyToClipboard}
              >
                {copied ? (
                  <>
                    <Check size={18} color="#FFF" style={styles.btnIcon} />
                    <Text style={styles.copyBtnText}>Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={18} color="#FFF" style={styles.btnIcon} />
                    <Text style={styles.copyBtnText}>Copy Text</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.dismissBtn]}
                onPress={handleDismissResult}
              >
                <RefreshCw size={18} color="#333" style={styles.btnIcon} />
                <Text style={styles.dismissBtnText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 12,
  },
  // Fallback styling
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  fallbackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackDescription: {
    fontSize: 15,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    backgroundColor: '#007AFF',
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#2C2C2E',
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  secondaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textBtn: {
    paddingVertical: 10,
  },
  textBtnText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  // Overlay Layout
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  topOverlay: {
    flex: 0,
    height: SCREEN_HEIGHT * 0.22,
    justifyContent: 'flex-start',
  },
  bottomOverlay: {
    flex: 0,
    height: SCREEN_HEIGHT * 0.28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  middleRow: {
    height: SCANNER_SIZE,
    flexDirection: 'row',
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  // Corners
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#007AFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  laser: {
    height: 3,
    width: '100%',
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  hintText: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  resultBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    maxHeight: 180,
    marginBottom: 24,
  },
  resultText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtn: {
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dismissBtn: {
    backgroundColor: '#E5E5EA',
  },
  dismissBtnText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
});
