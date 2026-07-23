import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  Share,
  Platform,
  BackHandler,
} from 'react-native';
import { Trash2, X, Download, Check, ArrowLeft } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { getSavedDownloads, deleteSavedDownload, deleteMultipleSavedDownloads } from '../utils/downloadManager';
import { useFocusEffect } from '@react-navigation/native';
import AppDrawer from '../components/AppDrawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 3;

const getFilenameFromUri = (uri) => {
  if (!uri) return '';
  const parts = uri.split('/');
  return parts[parts.length - 1];
};

const formatIOSUri = (path) => {
  if (!path) return path;
  if (Platform.OS === 'ios' && typeof path === 'string') {
    let cleanPath = path;
    try {
      cleanPath = decodeURI(path);
    } catch (_) {
      cleanPath = path;
    }
    if (cleanPath.startsWith('/') && !cleanPath.startsWith('file://')) {
      return `file://${cleanPath}`;
    }
    return cleanPath;
  }
  return path;
};

export default function DownloadsScreen({ route, navigation, isTab, onOpenDrawer }) {
  const insets = useSafeAreaInsets();
  const isAIOnly = route?.params?.isAIOnly ?? false;
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const headerHeight = Platform.OS === 'ios' ? 56 + insets.top : (Platform.OS === 'android' ? 56 + (StatusBar.currentHeight || 0) : 56);
  const headerPaddingTop = Platform.OS === 'ios' ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const listPaddingTop = Platform.OS === 'ios' ? 56 + insets.top + (20 * scale) : (Platform.OS === 'android' ? 56 + (StatusBar.currentHeight || 0) + (20 * scale) : 56 + (20 * scale));

  // Multiple selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fetchDownloads = async () => {
    try {
      const list = await getSavedDownloads();
      if (isAIOnly) {
        setImages(list.filter((item) => item.isAI === true));
      } else {
        setImages(list.filter((item) => item.isAI !== true));
      }
    } catch (err) {
      console.error('Error fetching downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  // ── Hardware back: only active while this screen is focused ──
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        // Priority 1: close image preview
        if (previewImage) {
          setPreviewImage(null);
          setSelectedAsset(null);
          return true;
        }
        // Priority 2: exit multi-select mode
        if (isSelectionMode) {
          setSelectedIds([]);
          setIsSelectionMode(false);
          return true;
        }
        // Priority 3: if opened from Generate AI tab, go back there
        if (isAIOnly) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('AIArtDashboard');
          }
          return true;
        }
        // Default: let the stack handle it
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => subscription.remove();
    }, [previewImage, isSelectionMode, isAIOnly, navigation])
  );

  const handleShare = async (asset) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return;
      }
      await Sharing.shareAsync(asset.uri, {
        dialogTitle: 'Share Image',
        mimeType: 'image/jpeg',
      });
    } catch (err) {
      Alert.alert('Share Failed', 'Unable to share the selected image.');
    }
  };

  const handleDelete = async (asset) => {
    try {
      await deleteSavedDownload(asset.id, asset.uri, asset.galleryAssetId);
      setImages((prev) => prev.filter((img) => img.id !== asset.id));
      setPreviewImage(null);
      setSelectedAsset(null);
    } catch (err) {
      console.log('Delete canceled or failed:', err);
    }
  };

  // Bulk Delete implementation
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setLoading(true);
    try {
      const assetsToDelete = images.filter((img) => selectedIds.includes(img.id));
      await deleteMultipleSavedDownloads(assetsToDelete);
      setImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.log('Bulk delete canceled or failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (item) => {
    if (isSelectionMode) {
      toggleSelect(item.id);
    } else {
      setPreviewImage(item.uri);
      setSelectedAsset(item);
    }
  };

  const handleLongPress = (item) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([item.id]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        if (next.length === 0) {
          setIsSelectionMode(false);
        }
        return next;
      } else {
        return [...prev, id];
      }
    });
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    const itemUri = formatIOSUri(item.uri);
    return (
      <TouchableOpacity
        style={[styles.gridItem, isSelected && styles.gridItemSelected]}
        activeOpacity={0.8}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      >
        <Image
          source={{ uri: itemUri }}
          style={[
            styles.gridImage,
            isSelected && styles.gridImageSelected,
            Platform.OS === 'ios' && {
              width: Math.round(463 * scale),
              height: Math.round(808 * scale),
            },
          ]}
          resizeMode="cover"
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.checkboxContainer}>
              <Check size={14} color="#FFF" strokeWidth={3} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Header */}
      {isSelectionMode ? (
        <View style={[styles.header, { height: headerHeight, paddingTop: headerPaddingTop }, styles.headerSelection]}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity style={styles.selectionCloseBtn} onPress={() => { setSelectedIds([]); setIsSelectionMode(false); }}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedIds.length} Selected</Text>
          </View>
          <TouchableOpacity style={styles.selectionDeleteBtn} onPress={handleBulkDelete}>
            <Trash2 size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.header, { height: headerHeight, paddingTop: headerPaddingTop }]}>
          <View style={styles.headerLeftContainer}>
            {previewImage ? (
              <TouchableOpacity style={styles.backBtn} onPress={() => { setPreviewImage(null); setSelectedAsset(null); }}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
            ) : !isTab ? (
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {previewImage && selectedAsset
                ? (selectedAsset.originalName || getFilenameFromUri(selectedAsset.uri))
                : 'Downloads'}
            </Text>
          </View>

          {previewImage && selectedAsset ? (
            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.headerActionBtn} onPress={() => handleShare(selectedAsset)}>
                <Image source={require('../components/mdi_share.png')} style={styles.headerActionIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionBtn} onPress={() => handleDelete(selectedAsset)}>
                <Image source={require('../components/material-symbols-light_delete.png')} style={styles.headerActionIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9AA0A6" />
          <Text style={styles.loadingText}>Loading saved images...</Text>
        </View>
      ) : images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Download size={48} color="#9AA0A6" />
          </View>
          <Text style={styles.emptyTitle}>{isAIOnly ? 'No Saved AI Art' : 'No Saved Images'}</Text>
          <Text style={styles.emptySubtitle}>
            {isAIOnly
              ? 'Generate AI Art and download it to see your creations saved here.'
              : 'Long press on any image in the browser search results to save it here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.listContainer, { paddingTop: listPaddingTop }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Image Preview Overlay */}
      {!!previewImage && (
        <View style={styles.modalOverlay}>
          {previewImage && (
            <Image
              source={{ uri: formatIOSUri(previewImage) }}
              style={[
                styles.modalPreviewImage,
                Platform.OS === 'ios' && {
                  width: Math.round(991 * scale),
                  height: Math.round(1787 * scale),
                },
              ]}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* Bottom Navigation Bar */}
      {!isTab && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomTab} onPress={() => navigation?.navigate('Home')}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/si_ai-search-fill.png'))
                  : require('../components/si_ai-search-fill.png')
              }
              style={[
                styles.exploreIcon,
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) },
              ]}
            />
            <Text style={styles.bottomTabText}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => navigation?.navigate('AIArtDashboard')}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/mingcute_ai-fill.png'))
                  : require('../components/mingcute_ai-fill.png')
              }
              style={[
                styles.generateAiIcon,
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) },
              ]}
            />
            <Text style={styles.bottomTabText}>Generate AI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => navigation?.navigate('History')}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/material-symbols_history-rounded.png'))
                  : require('../components/material-symbols_history-rounded.png')
              }
              style={[
                styles.historyIcon,
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) },
              ]}
            />
            <Text style={styles.bottomTabText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => { }}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/material-symbols_download-rounded.png'))
                  : require('../components/material-symbols_download-rounded.png')
              }
              style={[
                styles.downloadIcon,
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) },
              ]}
            />
            <Text style={[styles.bottomTabText, styles.bottomTabActiveText]}>Downloads</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isTab && <AppDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} navigation={navigation} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 56 + StatusBar.currentHeight : 56,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 35,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerSelection: {
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 48.68 * scale,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    fontFamily: 'Inter',
    flex: 1,
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionIcon: {
    width: 70 * scale,
    height: 70 * scale,
    tintColor: '#FFFFFF',
  },
  selectionCloseBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionDeleteBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9AA0A6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9AA0A6',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 61 * scale,
    paddingTop: Platform.OS === 'android' ? 56 + StatusBar.currentHeight + 20 * scale : 56 + 20 * scale,
    paddingBottom: 220 * scale,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 32 * scale,
  },
  gridItem: {
    width: 463 * scale,
    height: 808 * scale,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    borderWidth: 1.5,
    borderColor: '#2C2C2E',
  },
  exploreIcon: {
    width: 50 * scale,
    height: 50 * scale,
    tintColor: '#A0A3BD',
  },
  generateAiIcon: {
    width: 50 * scale,
    height: 50 * scale,
    tintColor: '#A0A3BD',
  },
  historyIcon: {
    width: 50 * scale,
    height: 50 * scale,
    tintColor: '#A0A3BD',
  },
  downloadIcon: {
    width: 50 * scale,
    height: 50 * scale,
    tintColor: '#007AFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 181 * scale,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 30 * scale : 10 * scale,
    zIndex: 30,
  },
  bottomTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  bottomTabText: {
    fontFamily: 'Geist',
    fontSize: 35 * scale,
    color: '#A0A3BD',
    marginTop: 10 * scale,
  },
  bottomTabActiveText: {
    color: '#007AFF',
  },
  gridItemSelected: {
    borderColor: '#1A73E8',
    borderWidth: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridImageSelected: {
    opacity: 0.8,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
  },
  checkboxContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 6,
    right: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  shareBtn: {
    position: 'absolute',
    left: 960 * scale,
    top: 195 * scale,
    width: 70 * scale,
    height: 70 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 36,
  },
  shareBtnIcon: {
    width: 70 * scale,
    height: 70 * scale,
    tintColor: '#FFFFFF',
  },
  deletePreviewBtn: {
    position: 'absolute',
    left: 854 * scale,
    top: 195 * scale,
    width: 70 * scale,
    height: 70 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 36,
  },
  deleteBtnIcon: {
    width: 70 * scale,
    height: 70 * scale,
    tintColor: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalPreviewImage: {
    position: 'absolute',
    left: 41 * scale,
    top: 326 * scale,
    width: 991 * scale,
    height: 1787 * scale,
    borderRadius: 53 * scale,
    overflow: 'hidden',
  },
  modalActionRow: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  modalActionText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  deleteBtn: {
    // Styling for visual separation if needed
  },
});
