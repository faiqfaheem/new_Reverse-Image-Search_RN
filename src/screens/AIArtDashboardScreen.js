import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  BackHandler,
  Image,
  ScrollView,
} from 'react-native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUsageStats } from '../utils/usageLimitManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;

// Figma specs: W:960, H:640 — scale proportionally to screen width
const HERO_WIDTH = SCREEN_WIDTH;
const HERO_HEIGHT = (640 / 960) * SCREEN_WIDTH;



export default function AIArtDashboardScreen({ navigation, isTab, onOpenDrawer }) {
  const [textToImageCredits, setTextToImageCredits] = React.useState('...');
  const [imageToImageCredits, setImageToImageCredits] = React.useState('...');

  React.useEffect(() => {
    const fetchStats = async () => {
      const textStats = await getUsageStats('text_to_image');
      const imageStats = await getUsageStats('image_to_image');
      setTextToImageCredits(textStats.remaining);
      setImageToImageCredits(imageStats.remaining);
    };

    fetchStats();

    const unsubscribeFocus = navigation?.addListener('focus', fetchStats);
    const intervalId = setInterval(fetchStats, 2000);

    return () => {
      if (unsubscribeFocus) unsubscribeFocus();
      clearInterval(intervalId);
    };
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (isTab) {
        // When rendered as a tab inside HomeScreen, let HomeScreen's BackHandler 
        // handle the back press to switch the activeTab back to 'explore'.
        return;
      }

      const onDashboardBackPress = () => {
        // In stack mode — go back to previous screen
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onDashboardBackPress);
      return () => subscription.remove();
    }, [navigation, isTab])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftContainer}>
          {!isTab && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Image Search</Text>
        </View>
        {/* <TouchableOpacity onPress={() => navigation?.navigate('PremiumVIP')} activeOpacity={0.8}>
          <Image
            source={require('../components/image 30.png')}
            style={styles.headerCrown}
            resizeMode="contain"
          />
        </TouchableOpacity> */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Galaxy Image */}
        <View style={styles.heroContainer}>
          <Image
            source={
              Platform.OS === 'ios'
                ? Image.resolveAssetSource(require('../components/mask_group.png'))
                : require('../components/Mask group.png')
            }
            style={[
              styles.heroImage,
              Platform.OS === 'ios' && {
                width: Math.round(960 * scale),
                height: Math.round(640 * scale),
              },
            ]}
            resizeMode="cover"
          />
          {/* Gradient overlay at bottom so text blends nicely */}
          <View style={styles.heroOverlay} />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroSubtitle}>Unleash your</Text>
            <Text style={styles.heroTitle}>Creativity</Text>
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.content}>

          {/* Card 1: AI Prompt Studio */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation?.navigate('AIImageScreen')}
            activeOpacity={0.75}
          >
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/Background.png'))
                  : require('../components/Background.png')
              }
              style={[styles.iconBox, Platform.OS === 'ios' && { width: 46, height: 46 }]}
              resizeMode="contain"
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>AI Prompt Studio</Text>
              <View style={styles.creditRow}>
                <View style={styles.greenDot} />
                <Text style={styles.cardSubtitle}>{textToImageCredits}/5 Credits Left</Text>
              </View>
            </View>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/arrow.png'))
                  : require('../components/arrow.png')
              }
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Card 2: Custom AI Models */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation?.navigate('AIRemix')}
            activeOpacity={0.75}
          >
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/Background2.png'))
                  : require('../components/Background2.png')
              }
              style={[styles.iconBox, Platform.OS === 'ios' && { width: 46, height: 46 }]}
              resizeMode="contain"
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Custom AI Models</Text>
              <View style={styles.creditRow}>
                <View style={styles.greenDot} />
                <Text style={styles.cardSubtitle}>{imageToImageCredits}/5 Credits Left</Text>
              </View>
            </View>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/arrow.png'))
                  : require('../components/arrow.png')
              }
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Card 3: Saved Gallery */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation?.navigate('Downloads', { isAIOnly: true })}
            activeOpacity={0.75}
          >
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/Background1.png'))
                  : require('../components/Background1.png')
              }
              style={[styles.iconBox, Platform.OS === 'ios' && { width: 46, height: 46 }]}
              resizeMode="contain"
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Saved Gallery</Text>
              <Text style={styles.cardSubtitle}>Access your creations</Text>
            </View>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/arrow.png'))
                  : require('../components/arrow.png')
              }
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

        </View>
      </ScrollView>
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
    backgroundColor: '#131313',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
  },
  menuBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCrown: {
    width: 94 * scale,
    height: 94 * scale,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 48.68 * scale,
    fontWeight: 'bold',
    marginLeft: 16 * scale,
    fontFamily: 'Inter',
  },
  scrollContent: {
    flexGrow: 1,
  },
  /* ── Hero Image ── */
  heroContainer: {
    width: 960 * scale,
    height: 640 * scale,
    alignSelf: 'center', // This perfectly aligns the left and right padding with the buttons
    borderRadius: 40 * scale, // Matches the 40 * scale radius of the cards
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: Platform.OS === 'ios' ? Math.round(960 * scale) : '100%',
    height: Platform.OS === 'ios' ? Math.round(640 * scale) : '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.5,
    // Simulated gradient from transparent to #131313
    backgroundColor: 'transparent',
    backgroundImage: undefined, // not supported in RN — use LinearGradient if needed
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    lineHeight: 48,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  /* ── Cards ── */
  content: {
    paddingTop: 30 * scale,
    paddingBottom: 40 * scale,
    gap: 43.89 * scale,
    alignItems: 'center',
  },
  card: {
    width: 960 * scale,
    height: 290.74 * scale,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40 * scale,
    gap: 40 * scale,
    backgroundColor: '#1C1C26',
    borderRadius: 40 * scale,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  cardSubtitle: {
    color: '#6E6E80',
    fontSize: 13,
    marginTop: 3,
    fontFamily: 'Inter-Regular',
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
});
