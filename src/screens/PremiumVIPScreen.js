import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Linking,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;

const FeatureRow = ({ feature, basic, pro, iconSource }) => (
  <View style={styles.tableRow}>
    <View style={[styles.flex2, styles.featureCol]}>
      {iconSource ? (
        <Image source={iconSource} style={styles.featureIcon} />
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
      <Text style={styles.featureText}>{feature}</Text>
    </View>
    <View style={[styles.flex1, styles.centerContent]}>
      {basic === 'check' ? (
        <Image source={require('../components/Vector (4).png')} style={styles.statusIcon} />
      ) : (
        <Image source={require('../components/Vector (5).png')} style={styles.crossIcon} />
      )}
    </View>
    <View style={[styles.flex1, styles.centerContent]}>
      {pro === 'check' ? (
        <Image source={require('../components/Vector (4).png')} style={styles.statusIcon} />
      ) : (
        <Image source={require('../components/Vector (5).png')} style={styles.crossIcon} />
      )}
    </View>
  </View>
);

export default function PremiumVIPScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleStartTrial = () => {
    // Basic navigation logic to bypass to Home for now
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const openPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const openTermsOfUse = () => {
    navigation.navigate('TermsOfService');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#131313" translucent={false} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + (10 * scale), 20 * scale) }]} showsVerticalScrollIndicator={false}>

        {/* Background Collage */}
        <Image
          source={require('../components/Dynamic Image Collage.png')}
          style={styles.collageImage}
        />
        <Image
          source={require('../components/Dynamic Image Collage_mask-group (2).png')}
          style={styles.collageImageRight}
        />

        {/* Top Spacer to preserve layout */}
        <View style={styles.topSpacer} />

        {/* Title & Subtitle */}
        <Text style={styles.title}>Create your Creativity</Text>
        <Text style={styles.subtitle}>
          Subscribe VIP Plan to Enjoy Unlimited Search Engine{'\n'}with ADs Free Application
        </Text>

        {/* Features Table */}
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableHeaderText, styles.flex2]}>Features</Text>
            <Text style={[styles.tableHeaderText, styles.flex1, styles.centerText]}>Basic</Text>
            <Text style={[styles.tableHeaderText, styles.flex1, styles.centerText]}>Pro</Text>
          </View>

          {/* Rows */}
          <FeatureRow
            feature="Find or Create Images"
            basic="check"
            pro="check"
            iconSource={require('../components/Group 1000006994.png')}
          />
          <FeatureRow
            feature="AI Image Generator"
            basic="check"
            pro="check"
            iconSource={require('../components/Group.png')}
          />
          <FeatureRow
            feature="Advance Option"
            basic="cross"
            pro="check"
            iconSource={require('../components/hugeicons_connect.png')}
          />
          <FeatureRow
            feature="Premium Support"
            basic="cross"
            pro="check"
            iconSource={require('../components/Vector (6).png')}
          />
          <FeatureRow
            feature="AD-free Experience"
            basic="cross"
            pro="check"
            iconSource={require('../components/Group (1).png')}
          />
        </View>

        {/* Spacer to push remaining content to the bottom */}
        <View style={{ flex: 1 }} />

        {/* Trial Info */}
        <Text style={styles.trialInfo}>
          3-day free trial, then Rs 850 per week. Auto-renew,{'\n'}cancel anytime in the Play Store.
        </Text>

        {/* Start Free Trial Button */}
        <Pressable
          onPress={handleStartTrial}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.buttonText}>Start Free Trial</Text>
        </Pressable>

        {/* Footer Links */}
        <View style={styles.footerRow}>
          <TouchableOpacity onPress={openPrivacyPolicy}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openTermsOfUse}>
            <Text style={styles.footerLink}>Terms of use</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131313',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 70 * scale,
    alignItems: 'center',
  },
  collageImage: {
    position: 'absolute',
    top: -218 * scale,
    left: -362 * scale,
    width: 890 * scale,
    height: 1195.79 * scale,
    resizeMode: 'contain',
  },
  collageImageRight: {
    position: 'absolute',
    top: -218 * scale,
    right: -100 * scale,
    width: 890 * scale,
    height: 1195.79 * scale,
    resizeMode: 'contain',
  },
  topSpacer: {
    width: '100%',
    height: 700 * scale,
    marginBottom: 24,
  },
  placeholderText: {
    color: '#000',
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 67.63 * scale,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Roboto',
    width: 691.86 * scale,
    alignSelf: 'center',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 34.62 * scale,
    fontWeight: 'normal',
    textAlign: 'center',
    lineHeight: 34.62 * 1.587 * scale,
    marginBottom: 40 * scale,
    fontFamily: 'Roboto',
    width: 855 * scale,
    alignSelf: 'center',
  },
  tableContainer: {
    width: '100%',
    marginBottom: 40 * scale,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24 * scale,
  },
  tableHeaderRow: {
    // marginBottom removed to keep spacing equal with feature rows
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 38.82 * scale,
    fontWeight: '500',
    fontFamily: 'Gilroy-Medium',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  centerText: {
    textAlign: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  featureCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    marginRight: 12,
    borderRadius: 4,
  },
  featureIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 41.24 * scale,
    fontWeight: '500',
    fontFamily: 'Gilroy-Medium',
  },
  statusIcon: {
    width: 32.59 * scale,
    height: 23.28 * scale,
    resizeMode: 'contain',
  },
  crossIcon: {
    width: 18.62 * scale,
    height: 18.62 * scale,
    resizeMode: 'contain',
  },
  check: {
    color: '#22C55E', // Green
    fontSize: 16,
    fontWeight: 'bold',
  },
  cross: {
    color: '#EF4444', // Red
    fontSize: 16,
    fontWeight: 'bold',
  },
  trialInfo: {
    color: '#A0A3BD',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    fontFamily: 'Geist',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#ADC7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonText: {
    color: '#00285B',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Geist',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: (1080 - 218.4 * 2) * scale,
    alignSelf: 'center',
  },
  footerLink: {
    color: '#FFFFFF',
    fontSize: 37.02 * scale,
    fontFamily: 'Gilroy-Medium',
  },
});
