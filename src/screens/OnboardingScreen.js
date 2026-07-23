import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  StatusBar,
  Image,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;
const scaleY = (SCREEN_HEIGHT - 100) / 2430;

const onboardingSlides = [
  {
    title: "See the Unseen",
    desc: "Our advanced AI visual search engine identifies objects and art styles in seconds.",
    image: Platform.OS === 'ios'
      ? require('../components/hero_illustration_container.png')
      : require('../components/Hero Illustration Container.png')
  },
  {
    title: "Create with AI",
    desc: "Turn simple descriptions into museum-quality digital art using our specialized Vision-X models.",
    image: Platform.OS === 'ios'
      ? require('../components/hero_graphic_container_margin.png')
      : require('../components/Hero Graphic Container_margin.png')
  },
  {
    title: "Your Creative Hub",
    desc: "Manage projects, store your gallery, and explore trending styles from the global community.",
    image: Platform.OS === 'ios'
      ? require('../components/tool_space_visualization_margin.png')
      : require('../components/3D Tool Space Visualization_margin.png')
  }
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);


  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < onboardingSlides.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = async () => {
    if (currentIndex < 2) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); // Temporarily bypassed PremiumVIP
    }
  };

  const renderDescription = (index) => {
    if (index === 1) {
      return (
        <Text style={styles.slideDescription}>
          Turn simple descriptions into museum-quality digital art using our specialized <Text style={{ color: '#ADC7FF' }}>Vision-X</Text> models.
        </Text>
      );
    }
    return (
      <Text style={styles.slideDescription}>
        {onboardingSlides[index].desc}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131313" translucent={false} />

      {/* Top spacing header */}
      <View style={styles.header} />

      <View style={styles.contentContainer}>
        {/* Horizontal ScrollView for swiping */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          bounces={false}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {onboardingSlides.map((slide, index) => {
            const resolvedSource = Platform.OS === 'ios'
              ? Image.resolveAssetSource(slide.image)
              : slide.image;

            return (
              <View key={index} style={styles.slideContainer}>
                <View style={styles.graphicContainer}>
                  <Image
                    source={resolvedSource}
                    style={[
                      styles.illustrationImage,
                      Platform.OS === 'ios' && {
                        width: Math.round(788 * scale),
                        height: Math.round(640 * scale),
                      },
                    ]}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.textWrapper}>
                  <Text numberOfLines={1} adjustsFontSizeToFit={true} style={styles.slideTitle}>
                    {slide.title}
                  </Text>
                  {renderDescription(index)}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Section with Indicators and Button */}
        <View style={styles.bottomSection}>
          {/* Pagination dots indicators */}
          <View style={styles.paginationContainer}>
            <View style={[styles.dot, currentIndex === 0 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, currentIndex === 1 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, currentIndex === 2 ? styles.dotActive : styles.dotInactive]} />
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed
              ]}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit={true} style={styles.primaryButtonText}>
                {currentIndex === 2 ? "GET STARTED" : "Next →"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    height: 0,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? Math.max(16, 4 * scale) : 4 * scale,
  },
  graphicContainer: {
    width: Platform.OS === 'ios' ? Math.round(788 * scale) : 788 * scale,
    height: Platform.OS === 'ios' ? Math.round(640 * scale) : 640 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20 * scale,
    position: 'relative',
  },
  illustrationImage: {
    width: Platform.OS === 'ios' ? Math.round(788 * scale) : '100%',
    height: Platform.OS === 'ios' ? Math.round(640 * scale) : '100%',
    resizeMode: 'contain',
  },
  textWrapper: {
    width: 953 * scale,
    alignItems: 'center',
    paddingHorizontal: 20 * scale,
  },
  slideTitle: {
    color: '#E2E2E8',
    fontSize: 56.16 * scale,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 74.9 * scale,
    letterSpacing: -1.4 * scale,
    width: 765.04 * scale,
    alignSelf: 'center',
    marginBottom: 16 * scale,
  },
  slideDescription: {
    color: '#C1C6D7',
    fontSize: 37.44 * scale,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 52 * scale,
    letterSpacing: 0,
    width: 786 * scale,
    alignSelf: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: 158.67 * scale,
    height: 14 * scale,
    marginBottom: 140 * scaleY,
  },
  dot: {
    height: 14 * scale,
    borderRadius: 7 * scale,
    marginHorizontal: 14 * scale,
  },
  dotActive: {
    width: 62.67 * scale,
    backgroundColor: '#ADC7FF',
  },
  dotInactive: {
    width: 20 * scale,
    backgroundColor: '#333539',
  },
  buttonContainer: {
    alignSelf: 'center',
  },
  primaryButton: {
    width: 953 * scale,
    height: 139 * scale,
    borderRadius: 15 * scale,
    backgroundColor: '#ADC7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#002E68',
    fontWeight: 'bold',
    fontSize: 45 * scale,
    letterSpacing: 0.5,
  },
});
