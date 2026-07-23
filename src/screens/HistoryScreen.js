import React, { useState, useEffect } from 'react';
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
  Alert,
  Platform,
  BackHandler,
} from 'react-native';
import { ArrowLeft, Trash2, X, Check, Search, QrCode } from 'lucide-react-native';
import { getSearchHistory, deleteHistoryEntry, clearAllHistory } from '../utils/historyManager';
import AppDrawer from '../components/AppDrawer';
import * as FileSystem from 'expo-file-system/legacy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;

export default function HistoryScreen({ route, navigation, isTab, onOpenDrawer }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fetchHistory = async () => {
    try {
      const list = await getSearchHistory();
      setHistoryItems(list);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Back handler for Android: exit selection mode first, then go to Home
  useEffect(() => {
    const backAction = () => {
      if (isSelectionMode) {
        setSelectedIds([]);
        setIsSelectionMode(false);
        return true;
      }
      if (navigation) {
        navigation.navigate('Home');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [isSelectionMode, navigation]);

  const getHistoryImageUri = (storedPath) => {
    if (!storedPath) return null;
    if (storedPath.startsWith('http://') || storedPath.startsWith('https://') || storedPath.startsWith('data:')) {
      return storedPath;
    }
    if (Platform.OS === 'ios' && typeof storedPath === 'string') {
      const filename = storedPath.split('/').pop();
      const docDir = FileSystem.documentDirectory.endsWith('/')
        ? FileSystem.documentDirectory
        : `${FileSystem.documentDirectory}/`;
      let dynamicPath = `${docDir}history_images/${filename}`;
      if (!dynamicPath.startsWith('file://')) {
        dynamicPath = `file://${dynamicPath}`;
      }
      return dynamicPath;
    }
    return storedPath;
  };

  const handlePress = (item) => {
    if (isSelectionMode) {
      toggleSelect(item.id);
    } else {
      // Re-trigger search based on history type
      if (item.type === 'image') {
        const validUri = getHistoryImageUri(item.query);
        navigation.navigate('Result', { searchQuery: '', imageUri: validUri });
      } else if (item.type === 'qr') {
        navigation.navigate('Result', { searchQuery: item.query, imageUri: null, fromQR: true });
      } else {
        navigation.navigate('Result', { searchQuery: item.query, imageUri: null });
      }
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

  const handleDeleteItem = (id) => {
    Alert.alert(
      'Delete History',
      'Are you sure you want to delete this search history entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteHistoryEntry(id);
            setHistoryItems(updated);
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Delete Selected',
      `Are you sure you want to delete the ${selectedIds.length} selected history entries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            let currentHistory = historyItems;
            for (const id of selectedIds) {
              currentHistory = await deleteHistoryEntry(id);
            }
            setHistoryItems(currentHistory);
            setSelectedIds([]);
            setIsSelectionMode(false);
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (historyItems.length === 0) return;
    Alert.alert(
      'Clear All History',
      'Are you sure you want to permanently delete all search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const updated = await clearAllHistory();
            setHistoryItems(updated);
            setLoading(false);
          },
        },
      ]
    );
  };

  const formatTimestamp = (time) => {
    const date = new Date(time);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);

    // Dynamic icon/thumbnail rendering
    let leftComponent;
    if (item.type === 'image') {
      const formattedUri = getHistoryImageUri(item.query);
      leftComponent = (
        <View style={styles.itemImageWrapper}>
          <Image
            source={
              Platform.OS === 'ios' && formattedUri
                ? { uri: formattedUri }
                : { uri: item.query }
            }
            style={[
              styles.itemImageThumbnail,
              Platform.OS === 'ios' && { width: 50, height: 50, borderRadius: 8 }
            ]}
            resizeMode="cover"
          />
        </View>
      );
    } else if (item.type === 'qr') {
      leftComponent = (
        <View style={styles.iconContainer}>
          <QrCode size={24} color="#007AFF" />
        </View>
      );
    } else {
      leftComponent = (
        <View style={styles.iconContainer}>
          <Search size={24} color="#34C759" />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.historyRow, isSelected && styles.historyRowSelected]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      >
        {leftComponent}

        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.type === 'image'
              ? 'Visual Search'
              : item.type === 'qr'
                ? `QR: ${item.query}`
                : item.query}
          </Text>
          <Text style={styles.itemTime}>{formatTimestamp(item.timestamp)}</Text>
        </View>

        {isSelectionMode ? (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Trash2 size={24} color="#f7f7f7ff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E10" translucent={true} />

      {/* Header */}
      {isSelectionMode ? (
        <View style={[styles.header, styles.headerSelection]}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity
              style={styles.selectionCloseBtn}
              onPress={() => {
                setSelectedIds([]);
                setIsSelectionMode(false);
              }}
            >
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedIds.length} Selected</Text>
          </View>
          <TouchableOpacity style={styles.selectionDeleteBtn} onPress={handleBulkDelete}>
            <Trash2 size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.headerLeftContainer}>
            {!isTab && (
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>History</Text>
          </View>
          
          <View style={styles.headerRightContainer}>
            {historyItems.length > 0 && (
              <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.contentArea}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.infoText}>Loading search history...</Text>
          </View>
        ) : historyItems.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconContainer}>
              <Search size={48} color="#A0A3BD" />
            </View>
            <Text style={styles.emptyTitle}>No Search History</Text>
            <Text style={styles.emptySubtitle}>
              Searches made via text, image capture, or QR scanner will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={historyItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      {!isTab && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('Home')}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/si_ai-search-fill.png'))
                  : require('../components/si_ai-search-fill.png')
              }
              style={[
                styles.bottomTabIcon,
                { tintColor: '#A0A3BD' },
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) }
              ]}
            />
            <Text style={styles.bottomTabText}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('AIArtDashboard')}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/mingcute_ai-fill.png'))
                  : require('../components/mingcute_ai-fill.png')
              }
              style={[
                styles.bottomTabIcon,
                { tintColor: '#A0A3BD' },
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) }
              ]}
            />
            <Text style={styles.bottomTabText}>Generate AI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => { }}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/material-symbols_history-rounded.png'))
                  : require('../components/material-symbols_history-rounded.png')
              }
              style={[
                styles.bottomTabIcon,
                { tintColor: '#007AFF' },
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) }
              ]}
            />
            <Text style={[styles.bottomTabText, styles.bottomTabActiveText]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('Downloads')}>
            <Image
              source={
                Platform.OS === 'ios'
                  ? Image.resolveAssetSource(require('../components/material-symbols_download-rounded.png'))
                  : require('../components/material-symbols_download-rounded.png')
              }
              style={[
                styles.bottomTabIcon,
                { tintColor: '#A0A3BD' },
                Platform.OS === 'ios' && { width: Math.round(50 * scale), height: Math.round(50 * scale) }
              ]}
            />
            <Text style={styles.bottomTabText}>Downloads</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isTab && <AppDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} navigation={navigation} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
  },
  header: {
    height: Platform.OS === 'android' ? 56 + StatusBar.currentHeight : 56,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#0E0E10',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerSelection: {
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontFamily: 'Inter',
    fontSize: 48.68 * scale,
    fontWeight: 'bold',
    marginLeft: 16 * scale,
  },
  clearAllBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllText: {
    color: '#fafafaff',
    fontSize: 38 * scale,
    fontWeight: '600',
    fontFamily: 'Inter',
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
  contentArea: {
    flex: 1,
    backgroundColor: '#0E0E10',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 181 * scale,
  },
  infoText: {
    marginTop: 12,
    fontSize: 15,
    color: '#A0A3BD',
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
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A0A3BD',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 220 * scale,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  historyRowSelected: {
    backgroundColor: '#2C2C2E',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemTime: {
    color: '#A0A3BD',
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#A0A3BD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
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
  bottomTabIcon: {
    width: 50 * scale,
    height: 50 * scale,
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
});
