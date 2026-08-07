import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image,
  BackHandler,
  Dimensions,
  InteractionManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { checkUsageLimit, incrementUsage } from '../utils/usageLimitManager';

const STYLE_TEMPLATES = [
  { id: '3d-Model', name: '3D Model', image: require('../components/tempelates/3d.png'), style_preset: '3d-model' },
  { id: 'Analog-film', name: 'Analog Film', image: require('../components/tempelates/analog_film.png'), style_preset: 'analog-film' },
  { id: 'Anime', name: 'Anime', image: require('../components/tempelates/anime.png'), style_preset: 'anime' },
  { id: 'Cinematic', name: 'Cinematic', image: require('../components/tempelates/cinematic.png'), style_preset: 'cinematic' },
  { id: 'Comic-book', name: 'Comic Book', image: require('../components/tempelates/comic.png'), style_preset: 'comic-book' },
  { id: 'Digital-art', name: 'Digital Art', image: require('../components/tempelates/digital_art.png'), style_preset: 'digital-art' },
  { id: 'Enhance', name: 'Enhance', image: require('../components/tempelates/enhance.png'), style_preset: 'enhance' },
  { id: 'Fantasy-art', name: 'Fantasy Art', image: require('../components/tempelates/fantasy_art.png'), style_preset: 'fantasy-art' },
  { id: 'Isometric', name: 'Isometric', image: require('../components/tempelates/isometric.png'), style_preset: 'isometric' },
  { id: 'Line-art', name: 'Line Art', image: require('../components/tempelates/line_art.png'), style_preset: 'line-art' },
  { id: 'Low-poly', name: 'Low Poly', image: require('../components/tempelates/low_poly.png'), style_preset: 'low-poly' },
  { id: 'Modeling-compound', name: 'Modeling Compound', image: require('../components/tempelates/modelling.png'), style_preset: 'modeling-compound' },
  { id: 'Neon-punk', name: 'Neon Punk', image: require('../components/tempelates/neon.png'), style_preset: 'neon-punk' },
  { id: 'Origami', name: 'Origami', image: require('../components/tempelates/origami.png'), style_preset: 'origami' },
  { id: 'Photographic', name: 'Photographic', image: require('../components/tempelates/phtographic.png'), style_preset: 'photographic' },
  { id: 'Pixel-art', name: 'Pixel Art', image: require('../components/tempelates/pixel.png'), style_preset: 'pixel-art' }
];

if (Platform.OS === 'ios') {
  STYLE_TEMPLATES.forEach((tpl) => {
    try {
      if (tpl.image) {
        const resolved = Image.resolveAssetSource(tpl.image);
        if (resolved && resolved.uri) {
          Image.prefetch(resolved.uri);
        }
      }
    } catch (_) { }
  });
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;
const PILL_CONTAINER_WIDTH = 948 * scale;
const PILL_GAP = 31.06 * scale;
const PILL_WIDTH = (PILL_CONTAINER_WIDTH - 3 * PILL_GAP) / 4;

export default function AIImageScreen({ navigation }) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photographic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [imageCount, setImageCount] = useState(1);


  const [isStyleModalVisible, setIsStyleModalVisible] = useState(false);

  // ── Clean up state on unmount ──
  useEffect(() => {
    return () => {
      setPrompt('');
      setSelectedStyle('photographic');
      setSelectedRatio('1:1');
      setImageCount(1);
    };
  }, []);

  // ── Hardware back → always return to Generate AI dashboard ──
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isStyleModalVisible) {
          setIsStyleModalVisible(false);
          return true;
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('AIArtDashboard');
        }
        return true; // prevent default (Home) navigation
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, isStyleModalVisible])
  );

  const handleCreate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt describing the image you want to generate.');
      return;
    }

    const usage = await checkUsageLimit('text_to_image', imageCount);
    if (!usage.allowed) {
      alert(`Not enough credits! You need ${imageCount} credits, but only have ${usage.remaining} left today.`);
      return;
    }

    await incrementUsage('text_to_image', imageCount);

    const selectedStyleData = STYLE_TEMPLATES.find(s => s.id === selectedStyle);
    navigation.replace('AIImageResult', {
      prompt: prompt.trim(),
      style: selectedStyle,
      style_preset: selectedStyleData?.style_preset || '',
      aspectRatio: selectedRatio,
      imageCount: imageCount,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FFF" translucent={true} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation?.canGoBack()) {
              navigation.goBack();
            } else {
              try {
                navigation?.navigate('AIArtDashboard');
              } catch (_) {
                navigation?.navigate('Home');
              }
            }
          }}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat With AI</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Enter Prompt Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle} >Enter Prompt:</Text>
            <View style={styles.promptInputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Bear On the Mountains"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                multiline={true}
                numberOfLines={4}
                value={prompt}
                onChangeText={setPrompt}
                textAlignVertical="top"
              />
              <Image
                source={require('../components/Container.png')}
                style={styles.promptAiIcon}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Styles Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Select Style:</Text>
            <TouchableOpacity
              style={styles.styleSelectorBtn}
              onPress={() => setIsStyleModalVisible(true)}
            >
              <View style={styles.styleSelectorTextContainer}>
                <Text style={styles.styleSelectorLabel}>Style</Text>
                <Text style={styles.styleSelectorValue}>
                  {STYLE_TEMPLATES.find(s => s.id === selectedStyle)?.name || selectedStyle}
                </Text>
              </View>
              <View style={styles.plusIconContainer}>
                <Image source={require('../components/Icon.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
              </View>
            </TouchableOpacity>
          </View>


          {/* Aspect Ratio Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Aspect Ratio:</Text>
            <View style={styles.pillsRow}>
              {['1:1', '4:3', '3:2', '2:3', '16:9', '9:16', '5:4', '4:5'].map((ratio) => {
                const isSelected = selectedRatio === ratio;
                return (
                  <TouchableOpacity
                    key={ratio}
                    style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                    onPress={() => setSelectedRatio(ratio)}
                  >
                    <View style={[styles.ratioIconSquare, isSelected && styles.ratioIconSquareSelected]} />
                    <Text style={[styles.pillBtnText, isSelected && styles.pillBtnTextSelected]}>
                      {ratio}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Image Generate Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.pillsRow}>
              {[1, 2, 3, 4].map((count) => {
                const isSelected = imageCount === count;
                return (
                  <TouchableOpacity
                    key={count}
                    style={[styles.pillBtn, isSelected && styles.pillBtnSelected, styles.countPillBtn]}
                    onPress={() => setImageCount(count)}
                  >
                    <Text style={[styles.pillBtnText, isSelected && styles.pillBtnTextSelected]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>



        </ScrollView>
        {/* Absolute bottom-aligned create button */}
        <SafeAreaView style={styles.executeFooter}>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
            <Text style={styles.createBtnText}>Create</Text>
            <ArrowRight size={20} color="#00285B" style={styles.createBtnArrow} />
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Styles Modal Selector */}
      <Modal
        visible={isStyleModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsStyleModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#131313" translucent={true} />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsStyleModalVisible(false)}
            >
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>AI Styles</Text>
            <View style={{ width: 32 }} />
          </View>

          <FlatList
            data={STYLE_TEMPLATES}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.stylesGrid}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => {
              const isSelected = selectedStyle === item.id;
              return (
                <TouchableOpacity
                  style={[styles.styleCard, isSelected && styles.styleCardSelected]}
                  onPress={() => {
                    setSelectedStyle(item.id);
                    setIsStyleModalVisible(false);
                  }}
                >
                  {item.image ? (
                    <Image source={item.image} style={styles.styleCardImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.styleCardImage, { backgroundColor: '#FFFFFF' }]} />
                  )}
                  <View style={styles.styleCardOverlay}>
                    <Text style={styles.styleCardText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

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
  promptInputWrapper: {
    position: 'relative',
    width: 948 * scale,
    height: 520 * scale,
  },
  promptAiIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 65.42 * scale,
    height: 80.01 * scale,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,

    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingVertical: 24 * scale,
    paddingBottom: 120,
    alignItems: 'center',
  },
  sectionContainer: {
    width: 948 * scale,
    marginBottom: 32 * scale,
  },
  sectionTitle: {
    fontFamily: 'Geist',
    fontWeight: '500',
    fontSize: 37.92 * scale,
    lineHeight: 54.2 * scale,
    letterSpacing: 3.79 * scale,
    color: '#8B90A0',
    marginBottom: 16 * scale,
  },
  textInput: {
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    borderColor: '#2A2A35',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Geist',
    color: '#FFF',
    flex: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: PILL_CONTAINER_WIDTH,
    justifyContent: 'space-between',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C26',
    height: 119.3 * scale,
    paddingHorizontal: 51.77 * scale,
    borderRadius: 60 * scale,
    width: PILL_WIDTH,
    marginBottom: PILL_GAP,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  pillBtnSelected: {
    backgroundColor: '#ADC7FF',
    borderColor: '#ADC7FF',
  },
  pillBtnText: {
    fontSize: 15,
    fontFamily: 'Geist',
    fontWeight: 'bold',
    color: '#8B90A0',
  },
  pillBtnTextSelected: {
    color: '#131313',
  },
  ratioIconSquare: {
    width: 41.42 * scale,
    height: 41.42 * scale,
    borderWidth: 4 * scale,
    borderColor: '#8B90A0',
    backgroundColor: 'transparent',
    borderRadius: 8 * scale,
    marginRight: 12 * scale,
  },
  ratioIconSquareSelected: {
    borderColor: '#131313',
  },
  countPillBtn: {
    minWidth: 56,
    justifyContent: 'center',
  },

  executeFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#131313',
    paddingTop: 16,
    paddingBottom: 30,
    alignItems: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#ADC7FF',
    width: 956 * scale,
    height: 188 * scale,
    borderRadius: 94 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createBtnText: {
    color: '#00285B',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Geist',
  },
  createBtnArrow: {
    position: 'absolute',
    right: 20,
  },
  styleSelectorBtn: {
    flexDirection: 'row',
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    borderColor: '#2A2A35',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '55%',
  },
  styleSelectorTextContainer: {
    flexDirection: 'column',
  },
  styleSelectorLabel: {
    fontSize: 11,
    fontFamily: 'Geist',
    color: '#8B90A0',
  },
  styleSelectorValue: {
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#FFF',
    marginTop: 2,
    textTransform: 'lowercase',
  },
  plusIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#131313',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Geist',
    fontWeight: 'bold',
    color: '#FFF',
  },
  stylesGrid: {
    padding: 12,
  },
  styleCard: {
    width: '48%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  styleCardSelected: {
    borderColor: '#3B82F6',
  },
  styleCardImage: {
    width: '100%',
    height: '100%',
  },
  styleCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleCardText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Geist',
    fontWeight: '600',
    textAlign: 'center',
  },
});
