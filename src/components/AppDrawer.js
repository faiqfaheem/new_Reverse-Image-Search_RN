import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
  TextInput,
  Linking,
  Alert,
  Platform,
  Share,
  Dimensions,
  BackHandler,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Image as ImageIcon,
  QrCode,
  Download,
  Share2,
  Star,
  Shield,
  ArrowLeft,
  Send,
  X,
} from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;
const DRAWER_WIDTH = 908 * scale;

const galleryXml = `<svg width="47" height="47" viewBox="0 0 47 47" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.22222 47H41.7778C43.1628 47 44.4911 46.4498 45.4704 45.4704C46.4498 44.4911 47 43.1628 47 41.7778V5.22222C47 3.8372 46.4498 2.50891 45.4704 1.52955C44.4911 0.550197 43.1628 0 41.7778 0H5.22222C3.8372 0 2.50891 0.550197 1.52955 1.52955C0.550197 2.50891 0 3.8372 0 5.22222V41.7778C0 43.1628 0.550197 44.4911 1.52955 45.4704C2.50891 46.4498 3.8372 47 5.22222 47ZM13.0556 28.7222L19.2256 34.8923L28.7222 20.8889L41.7778 39.1667H5.22222L13.0556 28.7222Z" fill="white"/>
</svg>`;

const shareXml = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M33.3333 28.2974C31.6453 28.2974 30.1227 28.8902 28.968 29.8446L13.1333 21.499C13.256 21.0459 13.3333 20.5736 13.3333 20.0916C13.3333 19.6096 13.256 19.1397 13.1333 18.6866L28.8 10.4229C30.0266 11.4674 31.6481 12.0492 33.3333 12.0496C37.0107 12.0496 40 9.34811 40 6.02482C40 2.70153 37.0107 0 33.3333 0C29.656 0 26.6667 2.70153 26.6667 6.02482C26.6667 6.50681 26.744 6.97915 26.8667 7.42981L11.2 15.6935C9.9727 14.6501 8.35167 14.0684 6.66667 14.0668C2.98933 14.0668 0 16.7683 0 20.0916C0 23.4149 2.98933 26.1164 6.66667 26.1164C8.35193 26.116 9.97343 25.5341 11.2 24.4897L27.0347 32.8353C26.918 33.266 26.8581 33.7077 26.856 34.1511C26.8565 35.3082 27.2366 36.4391 27.9483 37.401C28.6599 38.3629 29.6712 39.1125 30.8542 39.5551C32.0371 39.9976 33.3388 40.1133 34.5945 39.8875C35.8502 39.6616 37.0036 39.1044 37.9089 38.2862C38.8143 37.468 39.4309 36.4256 39.6808 35.2908C39.9307 34.156 39.8027 32.9797 39.313 31.9106C38.8233 30.8415 37.9938 29.9276 36.9295 29.2845C35.8651 28.6414 34.6137 28.2979 33.3333 28.2974Z" fill="white"/>
</svg>`;

const aiArtXml = `<svg width="324" height="324" viewBox="0 0 324 324" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M114.133 56.1224C123.866 27.638 163.221 26.7753 174.761 53.5344L175.737 56.1387L188.872 94.5519C191.882 103.362 196.746 111.423 203.137 118.193C209.527 124.962 217.295 130.283 225.916 133.795L229.448 135.114L267.859 148.233C296.342 157.966 297.205 197.324 270.463 208.864L267.859 209.841L229.448 222.976C220.636 225.984 212.572 230.848 205.799 237.239C199.027 243.629 193.704 251.399 190.19 260.022L188.872 263.538L175.754 301.967C166.021 330.452 126.665 331.314 115.142 304.572L114.133 301.967L101.015 263.554C98.0065 254.741 93.1431 246.677 86.7527 239.904C80.3622 233.131 72.5934 227.808 63.9706 224.294L60.455 222.976L22.0438 209.857C-6.4554 200.123 -7.31802 160.766 19.4396 149.242L22.0438 148.233L60.455 135.114C69.264 132.103 77.3251 127.239 84.0945 120.848C90.8639 114.458 96.1841 106.689 99.6962 98.0677L101.015 94.5519L114.133 56.1224ZM275.151 2.94102e-06C278.196 -3.84087e-06 281.18 0.854179 283.763 2.46547C286.347 4.07677 288.427 6.38055 289.767 9.11501L290.548 11.0194L296.244 27.7194L312.96 33.4163C316.011 34.453 318.686 36.3724 320.646 38.9311C322.605 41.4898 323.761 44.5727 323.967 47.789C324.172 51.0054 323.419 54.2104 321.801 56.9979C320.184 59.7854 317.775 62.0299 314.88 63.447L312.96 64.2283L296.261 69.9251L290.564 86.6414C289.526 89.6922 287.605 92.3659 285.045 94.324C282.486 96.282 279.403 97.4361 276.187 97.64C272.971 97.844 269.766 97.0886 266.98 95.4696C264.194 93.8506 261.951 91.4409 260.535 88.5458L259.754 86.6414L254.057 69.9414L237.342 64.2445C234.29 63.2078 231.615 61.2884 229.656 58.7297C227.696 56.171 226.54 53.0881 226.335 49.8718C226.129 46.6554 226.883 43.4504 228.5 40.6629C230.118 37.8754 232.527 35.6309 235.421 34.2138L237.342 33.4326L254.041 27.7357L259.737 11.0194C260.835 7.80352 262.911 5.01177 265.676 3.0356C268.44 1.05944 271.753 -0.00203918 275.151 2.94102e-06Z" fill="white"/>
</svg>`;

class DrawerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Drawer Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Fallback UI if drawer crashes
    }
    return this.props.children;
  }
}

function AppDrawerInner({ isOpen, onClose, navigation }) {
  const insets = useSafeAreaInsets();
  const [panelVisible, setPanelVisible] = useState(isOpen);
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [isPrivacyVisible, setIsPrivacyVisible] = useState(false);
  const [isSupportVisible, setIsSupportVisible] = useState(false);
  const [supportText, setSupportText] = useState('');
  const [isRateModalVisible, setIsRateModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    if (isOpen) {
      setPanelVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setPanelVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setPanelVisible(false);
      onClose();
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      if (panelVisible) {
        handleClose();
        return true;
      }
      if (isTermsVisible) {
        setIsTermsVisible(false);
        handleClose();
        return true;
      }
      if (isPrivacyVisible) {
        setIsPrivacyVisible(false);
        handleClose();
        return true;
      }
      if (isSupportVisible) {
        setIsSupportVisible(false);
        handleClose();
        return true;
      }
      if (isRateModalVisible) {
        setIsRateModalVisible(false);
        handleClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [panelVisible, isTermsVisible, isPrivacyVisible, isSupportVisible, isRateModalVisible]);

  const handleShare = async () => {
    handleClose();
    try {
      await Share.share({
        message: 'Check out this awesome Reverse Image Search App! Easily search Google, Bing, and Yandex using images, camera capture, or voice transcription. Download now!',
      });
    } catch (error) {
      console.log('Share error:', error.message);
    }
  };

  const handleSendEmail = () => {
    const email = 'reverseimagesearch64@gmail.com';
    const subject = encodeURIComponent('I have an issue with Search Image');
    const body = encodeURIComponent(supportText);
    const url = `mailto:${email}?subject=${subject}&body=${body}`;

    Linking.openURL(url)
      .then(() => {
        setIsSupportVisible(false);
        handleClose();
      })
      .catch((err) => {
        Alert.alert(
          'Error',
          'Could not open your mail client automatically. Please email your issue directly to reverseimagesearch64@gmail.com'
        );
      });
  };

  const handleRateApp = () => {
    setIsRateModalVisible(false);
    handleClose();
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id64a14811'
      : 'https://play.google.com/store/apps/details?id=com.reverseimagesearch.app';

    Linking.openURL(storeUrl).catch(() => {
      Alert.alert('Error', 'Could not open Google Play Store automatically.');
    });
  };

  const getFormattedDate = () => {
    const date = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <>
      {panelVisible && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            {/* Drawer Header with Logo */}
            <View
              style={[
                styles.drawerHeader,
                Platform.OS === 'ios' && {
                  paddingTop: Math.max(insets.top, 44),
                  height: (428 * scale) + Math.max(insets.top, 44),
                },
              ]}
            >
              <Image
                source={require('./group_110.png')}
                style={styles.drawerHeaderLogo}
                resizeMode="contain"
              />
              <Text style={styles.drawerHeaderSubtitle}>Search By Image With Multi Engine</Text>
            </View>

            {/* Drawer Menu Items */}
            <ScrollView
              style={styles.drawerMenuScroll}
              contentContainerStyle={
                Platform.OS === 'ios'
                  ? { paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) + 80 }
                  : { paddingTop: 16 }
              }
            >
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { handleClose(); navigation.navigate('Home', { triggerAction: 'camera', timestamp: Date.now() }); }}>
                <View style={styles.menuIconSlot}>
                  <Camera size={22} color="#FFF" />
                </View>
                <Text style={styles.drawerMenuText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { handleClose(); navigation.navigate('Home', { triggerAction: 'gallery', timestamp: Date.now() }); }}>
                <View style={styles.menuIconSlot}>
                  <ImageIcon size={22} color="#FFF" />
                </View>
                <Text style={styles.drawerMenuText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { handleClose(); navigation.navigate('QRScanner'); }}>
                <View style={styles.menuIconSlot}>
                  <Image
                    source={require('./group_215.png')}
                    style={styles.menuPngIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.drawerMenuText}>QR Code Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { handleClose(); navigation.navigate('Downloads'); }}>
                <View style={styles.menuIconSlot}>
                  <Image
                    source={require('./drawer_dwnld.png')}
                    style={styles.menuPngIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.drawerMenuText}>Download Image</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { handleClose(); navigation.navigate('Home', { tab: 'generate_ai', timestamp: Date.now() }); }}>
                <View style={styles.menuIconSlot}>
                  <SvgXml xml={aiArtXml} width={47 * scale} height={47 * scale} />
                </View>
                <Text style={styles.drawerMenuText}>AI Art</Text>
              </TouchableOpacity>

              {/* Horizontal Divider Line */}
              <View style={styles.drawerMenuDivider} />

              <TouchableOpacity style={styles.drawerMenuItem} onPress={handleShare}>
                <View style={styles.menuIconSlot}>
                  <SvgXml xml={shareXml} width={40 * scale} height={40 * scale} />
                </View>
                <Text style={styles.drawerMenuText}>Share App</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { setSelectedRating(0); setIsRateModalVisible(true); }}>
                <View style={styles.menuIconSlot}>
                  <Image
                    source={require('./vector_6.png')}
                    style={styles.menuPngIconRateUs}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.drawerMenuText}>Rate Us</Text>
              </TouchableOpacity>

              {/* Horizontal Divider Line */}
              <View style={styles.drawerMenuDivider} />

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { setIsPrivacyVisible(true); }}>
                <View style={styles.menuIconSlot}>
                  <Image
                    source={require('./vector_7.png')}
                    style={styles.menuPngIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.drawerMenuText}>Privacy Policy</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Absolute Positioned Close Button */}
            <TouchableOpacity
              style={[
                styles.absoluteCloseBtn,
                Platform.OS === 'ios' && {
                  top: undefined,
                  bottom: Math.max(insets.bottom, 16) + 10,
                  left: (DRAWER_WIDTH - (112 * scale)) / 2,
                },
              ]}
              onPress={handleClose}
            >
              <Image
                source={require('./Ellipse 6483.png')}
                style={styles.ellipseImage}
                resizeMode="contain"
              />
              <Image
                source={require('./drawer bacl.png')}
                style={styles.absoluteIconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Terms of Service Modal */}
      <Modal
        visible={isTermsVisible}
        animationType="slide"
        onRequestClose={() => setIsTermsVisible(false)}
      >
        <SafeAreaView style={styles.termsContainer}>
          {/* Header */}
          <View style={styles.termsHeader}>
            <View style={styles.headerSafeAreaSpacer} />
            <View style={styles.headerContentRow}>
              <TouchableOpacity style={styles.termsBackBtn} onPress={() => setIsTermsVisible(false)}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.termsHeaderTitle}>Terms of Service</Text>
              <View style={{ width: 24 }} />
            </View>
          </View>

          {/* Scrollable Terms Content */}
          <ScrollView contentContainerStyle={styles.termsContentScroll}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsLastUpdated}>Last Updated: {getFormattedDate()}</Text>

            <Text style={styles.termsSectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.termsText}>
              By accessing and using this application, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </Text>

            <Text style={styles.termsSectionTitle}>2. Use License</Text>
            <Text style={styles.termsText}>
              Permission is granted to temporarily download one copy of the application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license, you may not modify, copy, or use the materials for commercial purposes.
            </Text>

            <Text style={styles.termsSectionTitle}>3. Image Queries & Privacy</Text>
            <Text style={styles.termsText}>
              This application functions as a reverse image search engine utility. When you query by uploading or selecting an image, the image is transmitted directly to third-party search engines (Google, Bing, and Yandex). We do not store, catalog, or keep any copies of your uploaded images.
            </Text>

            <Text style={styles.termsSectionTitle}>4. Limitations & Liability</Text>
            <Text style={styles.termsText}>
              In no event shall Viberay or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this application.
            </Text>

            <Text style={styles.termsSectionTitle}>5. Accuracy of Materials</Text>
            <Text style={styles.termsText}>
              The search result content and metadata returned by this app are sourced directly from public search engines. We make no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of these results.
            </Text>

            <Text style={styles.termsSectionTitle}>6. Governing Law</Text>
            <Text style={styles.termsText}>
              These terms and conditions are governed by and construed in accordance with local regulations, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </Text>

            <Text style={styles.termsSectionTitle}>7. Contacting Us</Text>
            <Text style={styles.termsText}>
              If you have any questions about these Terms of Service, please reach out to customer support at support@viberay.com.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={isPrivacyVisible}
        animationType="slide"
        onRequestClose={() => setIsPrivacyVisible(false)}
      >
        <SafeAreaView style={styles.termsContainer}>
          {/* Header */}
          <View style={styles.termsHeader}>
            <View style={styles.headerSafeAreaSpacer} />
            <View style={styles.headerContentRow}>
              <TouchableOpacity style={styles.termsBackBtn} onPress={() => setIsPrivacyVisible(false)}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.termsHeaderTitle}>Privacy Policy</Text>
              <View style={{ width: 24 }} />
            </View>
          </View>

          {/* Scrollable Privacy Content */}
          <ScrollView contentContainerStyle={styles.termsContentScroll}>
            <Text style={styles.termsTitle}>Privacy Policy</Text>
            <Text style={styles.termsLastUpdated}>Last Updated: {getFormattedDate()}</Text>

            <Text style={styles.termsSectionTitle}>1. Our Commitment to Privacy</Text>
            <Text style={styles.termsText}>
              We value your trust and are committed to protecting your privacy. This Privacy Policy describes how we handle information when you use our Reverse Image Search application.
            </Text>

            <Text style={styles.termsSectionTitle}>2. Uploaded Images & Audio Data</Text>
            <Text style={styles.termsText}>
              When you perform a reverse image search, you may select an image from your gallery, capture one with your camera, or use voice-to-text features.
              {"\n\n"}
              • Images and audio are processed strictly to complete your search request.
              {"\n"}
              • We do not store, archive, or collect your uploaded images or voice transcriptions on our servers.
            </Text>

            <Text style={styles.termsSectionTitle}>3. Third-Party Search Engines</Text>
            <Text style={styles.termsText}>
              To perform the search, the application forwards the selected image/text queries directly to third-party search providers (Google, Bing, Yandex). These external services operate under their own independent privacy policies. We do not control and are not responsible for their data collection practices.
            </Text>

            <Text style={styles.termsSectionTitle}>4. Device Permissions</Text>
            <Text style={styles.termsText}>
              To provide the key functionalities, our application requires permissions to access:
              {"\n\n"}
              • Camera: To take new photos for image search.
              {"\n"}
              • Storage/Photos: To select existing images from your device gallery.
              {"\n"}
              • Microphone: For voice-activated speech recognition.
              {"\n\n"}
              These permissions are used locally on your device and are never sold or shared with any third parties.
            </Text>

            <Text style={styles.termsSectionTitle}>5. Contact Us</Text>
            <Text style={styles.termsText}>
              If you have any questions or feedback regarding our privacy practices, please contact us at support@viberay.com.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Customer Support Modal */}
      <Modal
        visible={isSupportVisible}
        animationType="slide"
        onRequestClose={() => setIsSupportVisible(false)}
      >
        <SafeAreaView style={styles.supportContainer}>
          {/* Header */}
          <View style={styles.supportHeader}>
            <View style={styles.headerSafeAreaSpacer} />
            <View style={styles.supportHeaderContentRow}>
              <View style={styles.supportHeaderLeft}>
                <TouchableOpacity style={styles.supportBackBtn} onPress={() => setIsSupportVisible(false)}>
                  <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.supportHeaderTitle}>Customer Support</Text>
              </View>
              <TouchableOpacity
                disabled={supportText.trim().length < 20}
                onPress={handleSendEmail}
                style={[styles.supportSendBtn, supportText.trim().length < 20 && styles.supportSendBtnDisabled]}
              >
                <Send size={24} color={supportText.trim().length < 20 ? "#CCC" : "#007AFF"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Text Input area */}
          <View style={styles.supportInputContainer}>
            <TextInput
              style={styles.supportInput}
              placeholder="Describe the issue (at least 20 characters)"
              placeholderTextColor="#999"
              multiline={true}
              autoFocus={true}
              textAlignVertical="top"
              value={supportText}
              onChangeText={setSupportText}
            />
            {supportText.trim().length < 20 && (
              <Text style={styles.charCountText}>
                {20 - supportText.trim().length} characters remaining to enable send
              </Text>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Rate Us Modal */}
      <Modal
        visible={isRateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsRateModalVisible(false)}
      >
        <View style={styles.rateModalOverlay}>
          <View style={styles.rateDialog}>
            {/* Close Button */}
            <TouchableOpacity style={styles.rateCloseBtn} onPress={() => { setIsRateModalVisible(false); handleClose(); }}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.rateTitle}>Do you like{"\n"}Search Image ?</Text>

            {/* Subtitle */}
            <Text style={styles.rateSubtitle}>
              We are working hard for a better user experience.{"\n"}We'd greatly appreciate if you can rate us
            </Text>

            {/* Stars Row */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((starValue) => (
                <TouchableOpacity
                  key={starValue}
                  onPress={() => setSelectedRating(starValue)}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                >
                  <Star
                    size={38}
                    color={starValue <= selectedRating ? "#FFC107" : "#CCC"}
                    fill={starValue <= selectedRating ? "#FFC107" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>



            {/* Rate Button */}
            <TouchableOpacity
              disabled={selectedRating === 0}
              onPress={handleRateApp}
              style={[
                styles.rateSubmitBtn,
                selectedRating === 0 ? styles.rateSubmitBtnDisabled : styles.rateSubmitBtnEnabled
              ]}
            >
              <Text style={styles.rateSubmitText}>Rate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function AppDrawer(props) {
  return (
    <DrawerErrorBoundary>
      <AppDrawerInner {...props} />
    </DrawerErrorBoundary>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#191919',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    width: DRAWER_WIDTH,
    height: 428 * scale + (Platform.OS === 'android' ? StatusBar.currentHeight : 44),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    backgroundColor: '#131313',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  drawerHeaderLogo: {
    width: Platform.OS === 'ios' ? Math.round(215 * scale) : 215 * scale,
    height: Platform.OS === 'ios' ? Math.round(195.9 * scale) : 195.9 * scale,
    resizeMode: 'contain',
  },
  drawerHeaderSubtitle: {
    fontFamily: 'Inter',
    fontSize: 34.8 * scale,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 50.36 * scale,
    textAlign: 'center',
    width: 588 * scale,
  },
  drawerMenuScroll: {
    flex: 1,
    paddingTop: 16,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 78 * scale,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuIconSlot: {
    width: 47 * scale,
    height: 47 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 48 * scale,
  },
  menuPngIcon: {
    width: Platform.OS === 'ios' ? Math.round(47 * scale) : '100%',
    height: Platform.OS === 'ios' ? Math.round(47 * scale) : '100%',
    resizeMode: 'contain',
  },
  menuPngIconRateUs: {
    width: Platform.OS === 'ios' ? Math.round(54 * scale) : 54 * scale,
    height: Platform.OS === 'ios' ? Math.round(51 * scale) : 51 * scale,
    resizeMode: 'contain',
  },
  drawerMenuText: {
    fontSize: 38.98 * scale,
    color: '#FFF',
    fontWeight: '500',
  },
  drawerMenuDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 16,
    marginHorizontal: 20,
  },
  absoluteCloseBtn: {
    position: 'absolute',
    left: 399 * scale,
    top: 2044 * scale,
    width: 112 * scale,
    height: 112 * scale,
  },
  ellipseImage: {
    width: Platform.OS === 'ios' ? Math.round(112 * scale) : '100%',
    height: Platform.OS === 'ios' ? Math.round(112 * scale) : '100%',
    position: 'absolute',
    resizeMode: 'contain',
  },
  absoluteIconImage: {
    position: 'absolute',
    left: 33 * scale,
    top: 34 * scale,
    width: Platform.OS === 'ios' ? Math.round(45 * scale) : 45 * scale,
    height: Platform.OS === 'ios' ? Math.round(45 * scale) : 45 * scale,
    resizeMode: 'contain',
  },


  termsContainer: {
    flex: 1,
    backgroundColor: '#191919',
    paddingTop: 0,
  },
  termsHeader: {
    backgroundColor: '#131313',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerSafeAreaSpacer: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  headerContentRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  termsBackBtn: {
    padding: 4,
  },
  termsHeaderTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  termsContentScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  termsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  termsLastUpdated: {
    fontSize: 13,
    color: '#A0A3BD',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 12,
  },
  termsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 18,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#E2E2E8',
    lineHeight: 22,
    textAlign: 'justify',
  },

  supportContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 0,
  },
  supportHeader: {
    backgroundColor: '#FFF',
  },
  supportHeaderContentRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  supportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportBackBtn: {
    padding: 4,
    marginRight: 16,
  },
  supportHeaderTitle: {
    color: '#111',
    fontSize: 20,
    fontWeight: 'bold',
  },
  supportSendBtn: {
    padding: 8,
  },
  supportSendBtnDisabled: {
    opacity: 0.5,
  },
  supportInputContainer: {
    flex: 1,
    padding: 20,
  },
  supportInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  charCountText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
    textAlign: 'right',
  },

  // Rate Us Modal Styles
  rateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateDialog: {
    width: '85%',
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  rateCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  rateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
    lineHeight: 28,
  },
  rateSubtitle: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'justify',
    lineHeight: 20,
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starTouch: {
    padding: 6,
  },
  rateLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 24,
    height: 20,
  },
  rateSubmitBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateSubmitBtnDisabled: {
    backgroundColor: '#E5E5EA',
  },
  rateSubmitBtnEnabled: {
    backgroundColor: '#ADC7FF',
  },
  rateSubmitText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
