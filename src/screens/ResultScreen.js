import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
  Animated,
  StatusBar,
  Dimensions,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Download, X } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { addSavedDownload } from '../utils/downloadManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;

const googleXml = `
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
`;

const GoogleIcon = () => (
  <View style={styles.logoBadge}>
    <Image
      source={require('../components/google.png')}
      style={styles.googleLogo}
      resizeMode="contain"
    />
  </View>
);

const bingXml = `<svg width="106" height="106" viewBox="0 0 106 106" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="106" height="106" rx="15" fill="white"/><path d="M87.9956 46.8143C87.9784 46.3925 87.8369 45.9853 87.5891 45.6443C87.3412 45.3034 86.998 45.0441 86.6032 44.8993L45.3903 32.0769C44.6217 31.8386 44.2703 32.249 44.6085 32.9859L52.2731 49.8986C52.6113 50.6399 53.4853 51.518 54.2145 51.8533L64.7296 56.6893C65.4587 57.0246 65.4763 57.6115 64.7648 57.9909L19.9019 81.9591C19.1947 82.3386 19.1025 82.2062 19.6998 81.6635L36.9352 66.0701C37.5859 65.4108 37.9734 64.5349 38.0245 63.6079L38.042 16.3423C38.0248 15.9193 37.8828 15.511 37.6341 15.1692C37.3854 14.8275 37.0413 14.5677 36.6453 14.4229L19.3967 9.06179C18.6281 8.82352 18 9.29564 18 10.1119V81.8135C18 82.6298 18.5359 83.68 19.1947 84.1477L36.72 96.6216C37.3788 97.0893 38.4769 97.129 39.1665 96.7098L86.7438 67.9277C87.11 67.6766 87.4137 67.3442 87.6315 66.9563C87.8494 66.5684 87.9754 66.1353 88 65.6906V46.8143H87.9956Z" fill="#04912B"/></svg>`;

const BingIcon = () => (
  <View style={styles.logoBadge}>
    <SvgXml xml={bingXml} width={106 * scale} height={106 * scale} />
  </View>
);

const yandexXml = `
  <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="128" height="128" rx="64" fill="white"/>
    <rect x="1" y="1" width="126" height="126" rx="63" stroke="black" stroke-opacity="0.1" stroke-width="2"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M105.787 38.8484C105.6 38.36 105.275 37.7658 104.851 37.1228C104.005 35.8286 102.727 34.2414 101.311 32.7438V32.7357C99.7969 31.2136 98.2504 29.895 96.9969 29.0241C96.3702 28.5927 95.8004 28.2508 95.3283 28.0636C95.0923 27.966 94.8563 27.9008 94.6284 27.8846C94.4086 27.8683 94.1319 27.909 93.9202 28.1206L64.5698 56.7063C64.2442 57.0237 63.7151 57.0237 63.3895 56.7063L34.0391 28.1206C33.8274 27.9171 33.5507 27.8764 33.3309 27.8846C33.1112 27.9008 32.867 27.966 32.6309 28.0636C32.1589 28.2508 31.581 28.5927 30.9624 29.0241C29.7089 29.895 28.1624 31.2217 26.6485 32.7357V32.7438C25.2323 34.2414 23.9544 35.8286 23.1079 37.1228C22.6847 37.7658 22.3509 38.36 22.1719 38.8484C22.0823 39.0925 22.0172 39.3367 22.001 39.5565C21.9928 39.7763 22.0335 40.0611 22.2533 40.2728L55.0467 72.1874C55.3397 72.4723 55.5025 72.863 55.5025 73.27L55.47 112.307C55.47 112.6 55.6409 112.819 55.7874 112.958C55.942 113.104 56.1455 113.226 56.3734 113.332C56.8292 113.552 57.456 113.755 58.1966 113.926C59.6943 114.268 61.7373 114.512 64 114.512C66.2627 114.512 68.3057 114.268 69.8034 113.926C70.544 113.755 71.1708 113.552 71.6266 113.332C71.8545 113.226 72.058 113.096 72.2126 112.958C72.3591 112.819 72.53 112.6 72.53 112.307L72.4975 73.27C72.4975 72.863 72.6603 72.4723 72.9533 72.1874L105.747 40.2728C105.966 40.0611 106.007 39.7763 105.999 39.5565C105.991 39.3286 105.918 39.0844 105.828 38.8484H105.787Z" fill="url(#paint0_linear_14620_7509)"/>
    <defs>
      <linearGradient id="paint0_linear_14620_7509" x1="22" y1="72.834" x2="105.21" y2="65.6414" gradientUnits="userSpaceOnUse">
        <stop offset="0.3" stop-color="#FF6A16"/>
        <stop offset="0.542948" stop-color="#FF3227"/>
        <stop offset="0.89" stop-color="#FF66DD"/>
      </linearGradient>
    </defs>
  </svg>
`;

const YandexIcon = () => (
  <View style={styles.logoBadge}>
    <Image
      source={require('../components/yandex.png')}
      style={styles.yandexLogo}
      resizeMode="contain"
    />
  </View>
);

export default function ResultScreen({ searchQuery: propSearchQuery, imageUri: propImageUri, onBack, route, navigation }) {
  const insets = useSafeAreaInsets();
  const searchQuery = route?.params?.searchQuery ?? propSearchQuery;
  const imageUri = route?.params?.imageUri ?? propImageUri;

  const handleBackToHome = () => {
    if (navigation) {
      try {
        navigation.navigate('Home');
      } catch (_) {
        navigation.navigate('HomeScreen');
      }
    } else if (onBack) {
      onBack();
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate('Home');
    } else if (onBack) {
      onBack();
    }
  };

  useEffect(() => {
    const handleHardwareBack = () => {
      if (navigation?.canGoBack()) {
        navigation.goBack();
        return true;
      } else if (navigation) {
        navigation.navigate('Home');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [navigation]);

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

  const saveImageToGallery = async (targetUrl) => {
    if (!targetUrl) {
      Alert.alert("Error", "No image available to download.");
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "Media Library permission is required to save images to your gallery."
      );
      return;
    }

    try {
      let targetUrlClean = targetUrl.trim();

      // Handle protocol-relative URL (e.g. //domain.com/image.jpg)
      if (targetUrlClean.startsWith('//')) {
        targetUrlClean = 'https:' + targetUrlClean;
      }

      // Handle relative paths (e.g. /images/logo.png)
      if (targetUrlClean.startsWith('/') && !targetUrlClean.startsWith('//')) {
        let base = 'https://www.google.com';
        if (activeBrowser === 'bing') base = 'https://www.bing.com';
        else if (activeBrowser === 'yandex') base = 'https://yandex.com';
        targetUrlClean = base + targetUrlClean;
      }

      let localUri = targetUrlClean;

      if (targetUrlClean.startsWith('http://') || targetUrlClean.startsWith('https://')) {
        let filename = targetUrlClean.split('/').pop().split('?')[0];
        // Ensure filename has a valid extension
        if (!filename || !/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename)) {
          filename = `search_image_${Date.now()}.jpg`;
        }
        const tempUri = `${FileSystem.documentDirectory}${filename}`;
        const result = await FileSystem.downloadAsync(targetUrlClean, tempUri);
        localUri = result.uri;
      } else if (targetUrlClean.startsWith('data:')) {
        // Extract base64 payload and extension
        const parts = targetUrlClean.split(';base64,');
        if (parts.length === 2) {
          const mimePart = parts[0];
          const base64Data = parts[1];
          let ext = 'jpg';
          const match = mimePart.match(/data:image\/(\w+)/);
          if (match && match[1]) {
            ext = match[1];
          }
          const filename = `search_img_${Date.now()}.${ext}`;
          const tempUri = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(tempUri, base64Data, {
            encoding: 'base64',
          });
          localUri = tempUri;
        } else {
          throw new Error('Unsupported data URL base64 format');
        }
      } else {
        throw new Error('Unsupported URL protocol');
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

      // Save to custom downloads metadata to display on saved downloads screen
      // Extract a meaningful original name from the source URL
      let originalName = '';
      try {
        const rawSegment = targetUrlClean.split('/').pop().split('?')[0];
        const hasImageExt = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(rawSegment);
        if (rawSegment && hasImageExt) {
          originalName = rawSegment;
        } else {
          // Fallback: build a name from the domain + timestamp
          const domain = targetUrlClean.match(/https?:\/\/([^/]+)/)?.[1]?.replace('www.', '') || 'image';
          originalName = `${domain}_${Date.now()}.jpg`;
        }
      } catch (_) {
        originalName = `image_${Date.now()}.jpg`;
      }
      await addSavedDownload(localUri, galleryAssetId, false, originalName);

      showToast("Image saved successfully!");
    } catch (err) {
      console.error("Image download error:", err);
      Alert.alert(
        "Download Failed",
        `An error occurred while saving the image: ${err.message || err}`
      );
    }
  };

  const handleDownload = () => {
    saveImageToGallery(uploadedImageUrl || imageUri);
  };

  const [detectedImageUrl, setDetectedImageUrl] = useState(null);

  const handleImageSaveOption = (url) => {
    setDetectedImageUrl(url);
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'imageLongPress' && data.url) {
        handleImageSaveOption(data.url);
      }
    } catch (e) {
      console.log('Error parsing WebView message:', e);
    }
  };

  const [activeBrowser, setActiveBrowser] = useState('google'); // 'google', 'bing', 'yandex'
  const [activeSubTab, setActiveSubTab] = useState('images'); // 'images' is active by default
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [bingBase64, setBingBase64] = useState(null);

  useEffect(() => {
    if (imageUri) {
      // 1. Clear stale state when new image is provided
      setUploadedImageUrl(null);
      setBingBase64(null);
      setDetectedImageUrl(null);

      // 2. Dispatch normalized image pipeline
      prepareImageForSearch(imageUri);
    }
  }, [imageUri]);

  const prepareImageForSearch = async (rawUri) => {
    try {
      let targetUri = rawUri;
      if (Platform.OS === 'ios' && typeof rawUri === 'string' && !rawUri.startsWith('http') && !rawUri.startsWith('data:')) {
        const filename = rawUri.split('/').pop();
        const docDir = FileSystem.documentDirectory.endsWith('/')
          ? FileSystem.documentDirectory
          : `${FileSystem.documentDirectory}/`;
        const dynamicPath = `${docDir}history_images/${filename}`;
        const formattedPath = dynamicPath.startsWith('file://') ? dynamicPath : `file://${dynamicPath}`;
        
        try {
          const fileInfo = await FileSystem.getInfoAsync(formattedPath);
          if (fileInfo.exists) {
            targetUri = formattedPath;
          }
        } catch (_) {}
      }

      // Universal Image Normalizer: converts content://, file://, ph:// URIs into clean normalized JPEG Base64 & URI
      const manipulated = await ImageManipulator.manipulateAsync(
        targetUri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipulated.base64) {
        setBingBase64(manipulated.base64);
      }

      const cleanUri = manipulated.uri || targetUri;
      uploadImage(cleanUri);
    } catch (err) {
      console.warn('Image normalization error, falling back to raw URI upload:', err);
      uploadImage(rawUri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    let attempts = 0;
    const maxAttempts = 2;

    const performUpload = async (targetUri) => {
      let compressedUri = targetUri;
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          targetUri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        compressedUri = manipResult.uri;
      } catch (manipErr) {
        console.warn('Image compression warning, using original URI:', manipErr);
      }

      const formData = new FormData();
      let filename = compressedUri.split('/').pop() || 'search_image.jpg';
      if (!filename.endsWith('.jpg') && !filename.endsWith('.jpeg')) {
        filename = `${filename}.jpg`;
      }

      let uploadUri = compressedUri;
      if (Platform.OS === 'ios' && typeof uploadUri === 'string' && uploadUri.startsWith('/') && !uploadUri.startsWith('file://')) {
        uploadUri = `file://${uploadUri}`;
      }

      formData.append('files[]', {
        uri: uploadUri,
        name: filename,
        type: 'image/jpeg',
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch('https://uguu.se/upload?output=text', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Upload server responded with HTTP ${response.status}`);
        }

        const publicUrl = await response.text();
        if (publicUrl && publicUrl.trim().startsWith('http')) {
          return publicUrl.trim();
        } else {
          throw new Error('Invalid response received from upload gateway.');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const resultUrl = await performUpload(uri);
        setUploadedImageUrl(resultUrl);
        setUploading(false);
        return;
      } catch (err) {
        console.warn(`Upload attempt ${attempts} failed:`, err);
        if (attempts >= maxAttempts) {
          setUploading(false);
          // Only show alert if Google or Yandex is active; Bing can fallback to Base64 form post
          if (activeBrowser !== 'bing') {
            Alert.alert(
              'Search Pipeline Error',
              `Failed to upload image for reverse search after timeout (${err.message || 'Request timed out'}).`,
              [
                { text: 'Retry', onPress: () => uploadImage(uri) },
                { text: 'Cancel', onPress: handleBack, style: 'cancel' },
              ]
            );
          }
        }
      }
    }
  };

  const getBingFormHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { background-color: #0E0E10; color: #8AB4F8; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #007AFF; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <p>Searching Bing Visual Search...</p>
          <form action="https://www.bing.com/images/detail/search?iss=sbiupload&FORM=SNAPST" method="POST" enctype="multipart/form-data" style="display:none;">
            <input type="file" name="imageBin" id="fileInput" />
          </form>
          <script>
            (function() {
              const base64Data = "${bingBase64 || ''}";
              if (!base64Data) return;
              try {
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const file = new File([blob], "search.jpg", { type: "image/jpeg" });
                
                if (window.DataTransfer) {
                  const container = new DataTransfer();
                  container.items.add(file);
                  document.getElementById('fileInput').files = container.files;
                  document.forms[0].submit();
                }
              } catch (e) {
                console.error("Form prep error:", e);
              }
            })();
          </script>
        </body>
      </html>
    `;
  };

  const getSearchUrlForBrowser = (browserId) => {
    if (uploadedImageUrl) {
      if (browserId === 'google') {
        return `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(uploadedImageUrl)}`;
      } else if (browserId === 'bing') {
        return `https://www.bing.com/images/search?view=detailv2&iss=sbi&FORM=RECISS&sbisrc=UrlPaste&q=imgurl:${encodeURIComponent(uploadedImageUrl)}`;
      } else if (browserId === 'yandex') {
        return `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(uploadedImageUrl)}`;
      }
    }

    const encodedQuery = encodeURIComponent(searchQuery);

    const isImage = activeSubTab === 'images';
    const isVideo = activeSubTab === 'videos';
    const isNews = activeSubTab === 'news';

    if (browserId === 'google') {
      let tbm = '';
      if (isImage) tbm = '&tbm=isch';
      else if (isVideo) tbm = '&tbm=vid';
      else if (isNews) tbm = '&tbm=nws';
      return `https://www.google.com/search?q=${encodedQuery}${tbm}`;
    } else if (browserId === 'bing') {
      let path = 'search';
      if (isImage) path = 'images/search';
      else if (isVideo) path = 'videos/search';
      else if (isNews) path = 'news/search';
      return `https://www.bing.com/${path}?q=${encodedQuery}`;
    } else if (browserId === 'yandex') {
      let path = 'search';
      if (isImage) path = 'images/search';
      else if (isVideo) path = 'video/search';
      return `https://yandex.com/${path}?text=${encodedQuery}`;
    }

    return `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
  };

  const googleSearchUrl = React.useMemo(() => getSearchUrlForBrowser('google'), [uploadedImageUrl, searchQuery, activeSubTab]);
  const bingSearchUrl = React.useMemo(() => getSearchUrlForBrowser('bing'), [uploadedImageUrl, searchQuery, activeSubTab]);
  const yandexSearchUrl = React.useMemo(() => getSearchUrlForBrowser('yandex'), [uploadedImageUrl, searchQuery, activeSubTab]);

  const googleSource = React.useMemo(() => ({ uri: googleSearchUrl }), [googleSearchUrl]);
  const bingSource = React.useMemo(() => {
    if (imageUri) {
      return uploadedImageUrl
        ? { uri: bingSearchUrl }
        : { html: getBingFormHtml(), baseUrl: 'https://www.bing.com' };
    }
    return { uri: bingSearchUrl };
  }, [imageUri, uploadedImageUrl, bingSearchUrl]);
  const yandexSource = React.useMemo(() => ({ uri: yandexSearchUrl }), [yandexSearchUrl]);

  const getHeaderTitle = () => {
    if (imageUri) {
      return "Image Search";
    }
    return searchQuery ? searchQuery : "Search Results";
  };

  const browsers = [
    { id: 'google', name: 'Google', activeColor: '#34A853', activeBg: '#E6F4EA' },
    { id: 'bing', name: 'Bing', activeColor: '#005BFF', activeBg: '#E6F0FF' },
    { id: 'yandex', name: 'Yandex', activeColor: '#FF3333', activeBg: '#FFE5E5' },
  ];

  const subTabs = [
    { id: 'ai_mode', name: 'AI Mode' },
    { id: 'all', name: 'All' },
    { id: 'images', name: 'Images' },
    { id: 'videos', name: 'Videos' },
    { id: 'news', name: 'News' },
    { id: 'books', name: 'Books' },
  ];

  // Helper to render browser logo SVG
  const getBrowserLogo = (browserId) => {
    switch (browserId) {
      case 'google':
        return <GoogleIcon />;
      case 'bing':
        return <BingIcon />;
      case 'yandex':
        return <YandexIcon />;
      default:
        return null;
    }
  };

  const getTabLeft = (id) => {
    switch (id) {
      case 'google':
        return 84 * scale;
      case 'yandex':
        return 432 * scale;
      case 'bing':
        return 780 * scale;
      default:
        return 84 * scale;
    }
  };

  // JavaScript injected to hide extra content, logos, search forms, and navigation panels, and detect image long presses
  const injectedJS = `
    (function() {
      const css = \`
        /* Google Image Search Header Elements */
        header, #header, #navigation, .M67Ar, .tsf, .header-wrapper, #search-form-header, .q7vebd, .F7Urfe, #sbtc { display: none !important; }
        /* Bing Image Search Header Elements */
        #b_header, .header, #hdr, #hp_header, #rfPane { display: none !important; }
        /* Yandex Image Search Header Elements */
        .header2, .header, .serp-header, .mini-suggest__button, .c-image-search-bar { display: none !important; }
        /* General layout fixes */
        body { margin-top: 0 !important; padding-top: 0 !important; }
      \`;
      const style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);

      // Long press / hold image handler to save image
      var lastTriggeredTime = 0;
      function triggerImageLongPress(url) {
        var now = Date.now();
        if (now - lastTriggeredTime < 1000) return;
        lastTriggeredTime = now;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'imageLongPress',
          url: url
        }));
      }

      window.addEventListener('contextmenu', function(e) {
        var target = e.target;
        while (target && target.tagName !== 'IMG') {
          target = target.parentNode;
        }
        if (target && target.tagName === 'IMG') {
          var imageUrl = target.src || target.getAttribute('data-src') || target.getAttribute('data-actualsrc');
          if (imageUrl) {
            e.preventDefault();
            triggerImageLongPress(imageUrl);
          }
        }
      });

      var touchTimer = null;
      document.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        var target = e.target;
        while (target && target.tagName !== 'IMG') {
          target = target.parentNode;
        }
        if (target && target.tagName === 'IMG') {
          clearTimeout(touchTimer);
          touchTimer = setTimeout(function() {
            var imageUrl = target.src || target.getAttribute('data-src') || target.getAttribute('data-actualsrc');
            if (imageUrl) {
              triggerImageLongPress(imageUrl);
            }
          }, 800); // 800ms hold time
        }
      }, { passive: true });

      document.addEventListener('touchmove', function() {
        clearTimeout(touchTimer);
      }, { passive: true });

      document.addEventListener('touchend', function() {
        clearTimeout(touchTimer);
      }, { passive: true });

      document.addEventListener('touchcancel', function() {
        clearTimeout(touchTimer);
      }, { passive: true });
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={handleBackToHome}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft
            size={24}
            color="#FFFFFF"
            style={Platform.OS === 'ios' ? { width: 24, height: 24 } : null}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Image Search
        </Text>
      </View>



      {!imageUri && (
        <View style={styles.subTabsContainer}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabsScroll}>
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.subTabButton, isActive && styles.subTabButtonActive]}
                  onPress={() => setActiveSubTab(tab.id)}
                >
                  <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[
        styles.webViewContainer,
        {
          marginBottom: Platform.OS === 'ios'
            ? (166 * scale)
            : (166 * scale) + Math.max(insets.bottom, 0)
        }
      ]}>
        {imageUri && activeBrowser !== 'bing' && !uploadedImageUrl ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1A73E8" />
            <Text style={styles.loadingText}>Uploading image for visual search...</Text>
          </View>
        ) : (
          <>
            {/* Google WebView */}
            <View style={[{ flex: 1 }, activeBrowser !== 'google' && { display: 'none' }]}>
              <WebView
                source={googleSource}
                originWhitelist={['*']}
                style={styles.webView}
                startInLoadingState={true}
                injectedJavaScript={injectedJS}
                domStorageEnabled={true}
                javaScriptEnabled={true}
                incognito={false}
                userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
                onMessage={handleMessage}
                onError={(syntheticEvent) => console.warn('Google WebView load error:', syntheticEvent.nativeEvent)}
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#1A73E8" />
                    <Text style={styles.loadingText}>Loading GOOGLE Results...</Text>
                  </View>
                )}
              />
            </View>

            {/* Bing WebView */}
            <View style={[{ flex: 1 }, activeBrowser !== 'bing' && { display: 'none' }]}>
              <WebView
                source={bingSource}
                originWhitelist={['*']}
                style={styles.webView}
                startInLoadingState={true}
                injectedJavaScript={injectedJS}
                domStorageEnabled={true}
                javaScriptEnabled={true}
                incognito={false}
                userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                onMessage={handleMessage}
                onError={(syntheticEvent) => console.warn('Bing WebView load error:', syntheticEvent.nativeEvent)}
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#1A73E8" />
                    <Text style={styles.loadingText}>Loading BING Results...</Text>
                  </View>
                )}
              />
            </View>

            {/* Yandex WebView */}
            <View style={[{ flex: 1 }, activeBrowser !== 'yandex' && { display: 'none' }]}>
              <WebView
                source={yandexSource}
                originWhitelist={['*']}
                style={styles.webView}
                startInLoadingState={true}
                injectedJavaScript={injectedJS}
                domStorageEnabled={true}
                javaScriptEnabled={true}
                incognito={false}
                userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
                onMessage={handleMessage}
                onError={(syntheticEvent) => console.warn('Yandex WebView load error:', syntheticEvent.nativeEvent)}
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#1A73E8" />
                    <Text style={styles.loadingText}>Loading YANDEX Results...</Text>
                  </View>
                )}
              />
            </View>
          </>
        )}

        {detectedImageUrl && (
          <View style={styles.saveOverlayContainer}>
            <Text style={styles.saveOverlayTitle} numberOfLines={1}>Image detected</Text>
            <View style={styles.saveOverlayActions}>
              <TouchableOpacity
                style={styles.saveOverlayButton}
                onPress={() => {
                  saveImageToGallery(detectedImageUrl);
                  setDetectedImageUrl(null);
                }}
              >
                <Download size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveOverlayText}>Save Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveOverlayClose}
                onPress={() => setDetectedImageUrl(null)}
              >
                <X size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={[
        styles.bottomTabBar,
        Platform.OS === 'ios'
          ? {
              bottom: 0,
              height: (166 * scale) + Math.max(insets.bottom, 0),
              paddingBottom: Math.max(insets.bottom, 0),
              paddingTop: 8,
              backgroundColor: '#1E1E1E',
            }
          : { bottom: Math.max(insets.bottom, 0) }
      ]}>
        <Image
          source={
            Platform.OS === 'ios'
              ? Image.resolveAssetSource(require('../components/rectangle_71.png'))
              : require('../components/Rectangle 71.png')
          }
          style={[
            styles.bottomTabBarBg,
            Platform.OS === 'ios' && {
              width: Math.round(1080 * scale),
              height: Math.round(166 * scale),
            },
          ]}
          resizeMode="cover"
        />
        {browsers.map((browser) => {
          const isActive = activeBrowser === browser.id;
          return (
            <TouchableOpacity
              key={browser.id}
              style={[styles.bottomTab, { left: getTabLeft(browser.id) }]}
              onPress={() => setActiveBrowser(browser.id)}
            >
              {isActive && (
                <Image
                  source={
                    Platform.OS === 'ios'
                      ? Image.resolveAssetSource(require('../components/rectangle_108.png'))
                      : require('../components/Rectangle 108.png')
                  }
                  style={[
                    styles.activeRectangleBg,
                    Platform.OS === 'ios' && {
                      width: Math.round(216 * scale),
                      height: Math.round(166 * scale),
                    },
                  ]}
                  resizeMode="stretch"
                />
              )}
              <View style={styles.tabContent}>
                {getBrowserLogo(browser.id)}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerContainer: {
    height: Platform.OS === 'android' ? 56 + (StatusBar.currentHeight || 0) : 56,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#000000',
  },
  backButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 20,
    marginLeft: 12,
  },


  // Scrollable tabs
  subTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#000',
  },
  subTabsScroll: {
    paddingHorizontal: 8,
  },
  subTabButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  subTabButtonActive: {
    borderBottomColor: '#FFF',
  },
  subTabText: {
    fontSize: 15,
    color: '#AAA',
    fontWeight: '500',
  },
  subTabTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  // WebView container
  webViewContainer: { flex: 1, marginBottom: 166 * scale },
  webView: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#AAA' },

  // Bottom selector tabs
  bottomTabBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1080 * scale,
    height: 166 * scale,
    backgroundColor: '#1E1E1E',
    zIndex: 20,
  },
  bottomTabBarBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  bottomTab: {
    position: 'absolute',
    width: 216 * scale,
    height: 166 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRectangleBg: {
    position: 'absolute',
    width: 216 * scale,
    height: 166 * scale,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabText: { fontSize: 14 },
  logoBadge: {
    marginRight: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yandexLogo: {
    width: 106 * scale,
    height: 106 * scale,
  },
  googleLogo: {
    width: 106 * scale,
    height: 106 * scale,
  },
  saveOverlayContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DADCE0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  saveOverlayTitle: {
    fontSize: 14,
    color: '#3C4043',
    fontWeight: '500',
    maxWidth: '45%',
  },
  saveOverlayActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveOverlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  saveOverlayText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveOverlayClose: {
    padding: 8,
    backgroundColor: '#F1F3F4',
    borderRadius: 20,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: '10%',
    right: '10%',
    backgroundColor: '#323232',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
