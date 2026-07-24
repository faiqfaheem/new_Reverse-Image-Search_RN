import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Share,
  Alert,
  Modal,
  Animated,
  Platform,
  BackHandler,
} from 'react-native';
import { ArrowLeft, Download, Sparkles, X } from 'lucide-react-native';
import { generateAIImage } from '../services/aiService';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { addSavedDownload } from '../utils/downloadManager';
import { checkUsageLimit, incrementUsage } from '../utils/usageLimitManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;

export default function AIImageResultScreen({ route, navigation }) {
  const {
    prompt = '',
    style = 'none',
    style_preset = '',
    aspectRatio = '1:1',
    imageCount = 1,
    negativePrompt = '',
  } = route?.params || {};

  const [currentPrompt, setCurrentPrompt] = useState(prompt);

  const getAspectRatioNumber = (ratioStr) => {
    if (!ratioStr || typeof ratioStr !== 'string' || !ratioStr.includes(':')) {
      return 1;
    }
    let actualRatioStr = ratioStr;
    if (ratioStr === '4:3') {
      actualRatioStr = '4:5';
    }
    const [widthStr, heightStr] = actualRatioStr.split(':');
    const w = parseFloat(widthStr);
    const h = parseFloat(heightStr);
    if (!isNaN(w) && !isNaN(h) && h !== 0) {
      return w / h;
    }
    return 1;
  };

  const ratioNumber = getAspectRatioNumber(aspectRatio);

  const [iterations, setIterations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [previewImage, setPreviewImage] = useState(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleDownloadImage = async (uri) => {
    if (!uri) {
      Alert.alert("Error", "No image source found to download.");
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "Media Library permission is required to save the AI art to your gallery."
      );
      return;
    }

    try {
      let localUri = uri;

      if (uri.startsWith('data:image') || uri.includes(';base64,')) {
        const parts = uri.split(';base64,');
        const base64Data = parts[1];
        let extension = 'png';
        const match = uri.match(/data:image\/(\w+);base64/);
        if (match && match[1]) {
          extension = match[1];
        }

        const filename = `ai_art_${Date.now()}.${extension}`;
        localUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(localUri, base64Data, {
          encoding: 'base64',
        });
      } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const filename = uri.split('/').pop().split('?')[0] || `ai_art_${Date.now()}.jpg`;
        const tempUri = `${FileSystem.documentDirectory}${filename}`;
        const result = await FileSystem.downloadAsync(uri, tempUri);
        localUri = result.uri;
      }

      let assetCreated = false;
      let galleryAssetId = null;
      try {
        const asset = await MediaLibrary.createAssetAsync(localUri);
        assetCreated = true;
        galleryAssetId = asset.id;
        const albumName = 'Reverse Image Search';
        const album = await MediaLibrary.getAlbumAsync(albumName);
        if (album === null) {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (saveErr) {
        console.warn("Album saving failed:", saveErr);
        if (!assetCreated) {
          await MediaLibrary.saveToLibraryAsync(localUri);
        }
      }

      const aiOriginalName = uri.startsWith('http')
        ? (uri.split('/').pop().split('?')[0] || `ai_art_${Date.now()}.jpg`)
        : `ai_art_${Date.now()}.jpg`;
      await addSavedDownload(localUri, galleryAssetId, true, aiOriginalName);
      showToast("Image saved successfully!");
    } catch (error) {
      console.error("Save image error:", error);
      Alert.alert(
        "Download Failed",
        "Network drop or error saving AI art. Please try again."
      );
    }
  };

  const isMounted = useRef(true);
  const abortControllersRef = useRef({});

  useEffect(() => {
    return () => {
      isMounted.current = false;
      Object.values(abortControllersRef.current).forEach(controller => controller.abort());
    };
  }, []);

  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    if (!globalLoading) {
      setLoadingStage(0);
      return;
    }
    const t1 = setTimeout(() => setLoadingStage(1), 2200);
    const t2 = setTimeout(() => setLoadingStage(2), 5500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [globalLoading]);

  const handleGenerationSuccess = (newImagesArray) => {
    setIterations((prevIterations) => {
      const updatedList = [...prevIterations, ...newImagesArray];
      setSelectedIndex(updatedList.length - 1);
      return updatedList;
    });
  };

  const runGenerations = async () => {
    setGlobalLoading(true);
    try {
      // Run imageCount generations in parallel
      const promises = Array.from({ length: imageCount }, (_, i) => {
        const controller = new AbortController();
        const reqId = `${Date.now()}_${i}`;
        abortControllersRef.current[reqId] = controller;
        return generateAIImage(currentPrompt, {
          aspectRatio,
          negativePrompt,
          style_preset,
          signal: controller.signal
        });
      });

      const results = await Promise.all(promises);
      if (!isMounted.current) return;

      // Filter out any null/empty results
      const validResults = results.filter(Boolean);
      if (validResults.length > 0) {
        handleGenerationSuccess(validResults);
      }
      setGlobalLoading(false);
    } catch (err) {
      if (!isMounted.current || err.name === 'AbortError') return;
      console.error('Text-to-Image Generation error:', err);
      setGlobalLoading(false);
      Alert.alert(
        'Generation Error',
        `Generation failed: ${err.message || 'Please check your connection and try again.'}`
      );
      if (navigation) {
        try {
          navigation.navigate('Home');
        } catch (_) {
          navigation.navigate('HomeScreen');
        }
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    runGenerations();
  }, []);

  const handleBackToHome = () => {
    if (globalLoading) return;
    if (navigation) {
      try {
        navigation.navigate('Home');
      } catch (_) {
        navigation.navigate('HomeScreen');
      }
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (globalLoading) return true;
      if (previewImage) {
        setPreviewImage(null);
        return true;
      }
      handleBackToHome();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [previewImage, navigation, globalLoading]);

  const currentImageUri = iterations[selectedIndex] || null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131313" translucent={true} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={handleBackToHome}
        >
          <ArrowLeft size={24} color="#FFF" style={Platform.OS === 'ios' ? { width: 24, height: 24 } : null} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat With AI</Text>
        <TouchableOpacity
          style={[
            styles.saveHeaderBtn,
            Platform.OS === 'ios' && {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
          onPress={() => handleDownloadImage(currentImageUri)}
          disabled={!currentImageUri}
        >
          {Platform.OS === 'ios' ? (
            <Download
              size={Platform.OS === 'ios' ? 20 : 20}
              color="#131313"
              style={{ width: 20, height: 20, marginRight: 4 }}
            />
          ) : (
            <Image
              source={require('../components/Container (1).png')}
              style={{ width: 39.11 * scale, height: 54 * scale, marginRight: 4 }}
              resizeMode="contain"
            />
          )}
          <Text style={styles.saveHeaderBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Main Image Preview */}
        <TouchableOpacity
          style={[
            styles.mainPreviewContainer,
            { aspectRatio: ratioNumber },
          ]}
          activeOpacity={0.9}
          onPress={() => {
            if (currentImageUri) {
              setPreviewImage(currentImageUri);
            }
          }}
        >
          {globalLoading && iterations.length === 0 ? (
            <ActivityIndicator size="large" color="#ADC7FF" />
          ) : currentImageUri ? (
            <Image
              source={{ uri: currentImageUri }}
              style={styles.mainPreviewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#8B90A0', fontSize: 14 }}>No Image Preview</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* More Variations / Iterations */}
        {iterations.length > 0 && (
          <View style={styles.variationsSection}>
            <View style={styles.variationsHeader}>
              <Text style={styles.variationsTitle}>MORE VARIATIONS</Text>
              <Text style={styles.variationsCount}>
                {iterations.length} {iterations.length === 1 ? 'Iteration' : 'Iterations'}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variationsScroll}>
              {iterations.map((imgUri, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.variationThumbnailWrapper,
                    selectedIndex === index && styles.variationThumbnailSelected
                  ]}
                  onPress={() => setSelectedIndex(index)}
                >
                  <Image
                    source={{ uri: imgUri }}
                    style={[
                      styles.variationThumbnail,
                      Platform.OS === 'ios' && {
                        width: Math.round(180 * scale),
                        height: Math.round(180 * scale),
                      },
                    ]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Edit Prompt Card */}
        <View style={styles.promptCard}>
          <View style={styles.promptCardHeader}>
            <Text style={styles.promptCardTitle}>Edit Prompt</Text>
            <View style={styles.recentWrapper}>
              <Image source={require('../components/Container (2).png')} style={{ width: 27.68 * scale, height: 27.68 * scale }} resizeMode="contain" />
              <Text style={styles.recentText}>Recent</Text>
            </View>
          </View>
          <View style={styles.promptTextContainer}>
            <TextInput
              style={styles.promptTextInput}
              value={currentPrompt}
              onChangeText={setCurrentPrompt}
              multiline={true}
              placeholder="Edit your prompt..."
              placeholderTextColor="#8B90A0"
            />
          </View>
        </View>

      </ScrollView>

      {/* Generate More Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.generateMoreBtn,
            Platform.OS === 'ios' && {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
          onPress={async () => {
            const usage = await checkUsageLimit('text_to_image', imageCount);
            if (!usage.allowed) {
              Alert.alert('Limit Reached', `Not enough credits! You need ${imageCount} credits, but only have ${usage.remaining} left today.`);
              return;
            }
            await incrementUsage('text_to_image', imageCount);
            runGenerations();
          }}
        >
          <Text style={styles.generateMoreBtnText}>Generate More</Text>
          {Platform.OS === 'ios' ? (
            <Sparkles
              size={Platform.OS === 'ios' ? 20 : 20}
              color="#131313"
              style={{ width: 20, height: 20, marginLeft: 8 }}
            />
          ) : (
            <Image
              source={require('../components/Container (3).png')}
              style={{ width: 52.55 * scale, height: 52.55 * scale }}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewImage(null)}>
            <X size={30} color="#FFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={[styles.modalPreviewImage, { aspectRatio: ratioNumber }]} />
          )}
        </View>
      </Modal>

      {/* Multi-Step Generation Dialogue Modal */}
      <Modal visible={globalLoading} transparent={true} animationType="fade">
        <View style={styles.modalLoadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#ADC7FF" style={{ marginBottom: 16 }} />
            <Text style={styles.loadingStageTitle}>
              {loadingStage === 0 ? "Sending Request..." : loadingStage === 1 ? "Processing Image..." : "Finalizing Render..."}
            </Text>
            <Text style={styles.loadingStageSubtext}>
              {loadingStage === 0 
                ? "Uploading prompt & settings to AI engine..." 
                : loadingStage === 1 
                ? "Synthesizing artwork via Vision-X models..." 
                : "Applying high-res detail & finalizing output..."}
            </Text>

            {/* Step Progress Indicators */}
            <View style={styles.stepDotsRow}>
              <View style={[styles.stepDot, loadingStage >= 0 && styles.stepDotActive]} />
              <View style={[styles.stepDot, loadingStage >= 1 && styles.stepDotActive]} />
              <View style={[styles.stepDot, loadingStage >= 2 && styles.stepDotActive]} />
            </View>
          </View>
        </View>
      </Modal>

      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    height: Platform.OS === 'android' ? 56 + StatusBar.currentHeight : 56,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Geist',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ADC7FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveHeaderBtnText: {
    color: '#131313',
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 200,
  },
  mainPreviewContainer: {
    width: '100%',
    backgroundColor: '#1C1C26',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 0,
    alignSelf: 'center',
  },
  mainPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Geist',
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 20,
  },
  variationsSection: {
    marginBottom: 24,
  },
  variationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  variationsTitle: {
    color: '#8B90A0',
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  variationsCount: {
    color: '#ADC7FF',
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '500',
  },
  variationsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variationThumbnailWrapper: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#1C1C26',
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  variationThumbnailSelected: {
    borderColor: '#ADC7FF',
  },
  variationThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  promptCard: {
    backgroundColor: '#1C1C26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A35',
    marginBottom: 24,
  },
  promptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptCardTitle: {
    color: '#8B90A0',
    fontSize: 13,
    fontFamily: 'Geist',
    fontWeight: 'bold',
  },
  recentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentText: {
    color: '#ADC7FF',
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '500',
    marginLeft: 4,
  },
  promptTextContainer: {
    backgroundColor: '#131313',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A35',
    position: 'relative',
    minHeight: 100,
  },
  promptTextInput: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Geist',
    lineHeight: 20,
    paddingBottom: 24,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  generateMoreBtn: {
    width: 836 * scale,
    height: 152.87 * scale,
    backgroundColor: '#ADC7FF',
    borderRadius: 57.33 * scale,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  generateMoreBtnText: {
    color: '#131313',
    fontSize: 18,
    fontFamily: 'Geist',
    fontWeight: 'bold',
    marginRight: 28.69 * scale,
  },

  // White Placeholders for Icons
  placeholderIconTinyWhite: {
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  placeholderIconSmallWhite: {
    width: 16,
    height: 16,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  placeholderIconMediumWhite: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  placeholderIconRoundWhite: {
    width: 28,
    height: 28,
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalPreviewImage: {
    width: SCREEN_WIDTH - 40,
    resizeMode: 'contain',
    borderRadius: 16,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#323232',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalLoadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1C1C26',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A35',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingStageTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Geist',
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  loadingStageSubtext: {
    color: '#8B90A0',
    fontSize: 13,
    fontFamily: 'Geist',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A35',
  },
  stepDotActive: {
    backgroundColor: '#ADC7FF',
  },
});

