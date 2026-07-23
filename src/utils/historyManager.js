import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const HISTORY_METADATA_PATH = `${FileSystem.documentDirectory}search_history_metadata.json`;
const HISTORY_IMAGES_DIR = `${FileSystem.documentDirectory}history_images/`;

const resolveIOSPath = (storedPath) => {
  if (!storedPath || typeof storedPath !== 'string') return storedPath;
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://') || storedPath.startsWith('data:')) {
    return storedPath;
  }
  if (Platform.OS === 'ios') {
    const filename = storedPath.split('/').pop();
    let dynamicPath = `${HISTORY_IMAGES_DIR}${filename}`;
    if (!dynamicPath.startsWith('file://')) {
      dynamicPath = `file://${dynamicPath}`;
    }
    return dynamicPath;
  }
  return storedPath;
};

// Ensure history images folder exists
async function ensureImagesDirectoryExists() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(HISTORY_IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(HISTORY_IMAGES_DIR, { intermediates: true });
    }
  } catch (err) {
    console.error('Failed to create history images directory:', err);
  }
}

export async function getSearchHistory() {
  try {
    const info = await FileSystem.getInfoAsync(HISTORY_METADATA_PATH);
    if (!info.exists) {
      return [];
    }
    const content = await FileSystem.readAsStringAsync(HISTORY_METADATA_PATH);
    const list = JSON.parse(content);

    if (Platform.OS === 'ios') {
      return list.map(item => {
        if (item.type === 'image' && item.query) {
          return {
            ...item,
            query: resolveIOSPath(item.query),
          };
        }
        return item;
      });
    }

    return list;
  } catch (err) {
    console.error('Error fetching search history:', err);
    return [];
  }
}

export async function addHistoryEntry(type, queryOrUri) {
  try {
    await ensureImagesDirectoryExists();
    const history = await getSearchHistory();
    
    let finalQuery = queryOrUri;
    
    // Copy image searches to local history storage so thumbnail stays persistent
    if (type === 'image' && queryOrUri) {
      const filename = `img_${Date.now()}.jpg`;
      const destination = `${HISTORY_IMAGES_DIR}${filename}`;
      try {
        await FileSystem.copyAsync({
          from: queryOrUri,
          to: destination,
        });
        finalQuery = destination;
      } catch (err) {
        console.error('Failed to copy history image:', err);
        finalQuery = queryOrUri;
      }
    }
    
    const newEntry = {
      id: String(Date.now()),
      type, // 'text' | 'image' | 'qr'
      query: finalQuery,
      timestamp: Date.now(),
    };
    
    // Store last 100 history items
    const updatedHistory = [newEntry, ...history].slice(0, 100);
    await FileSystem.writeAsStringAsync(HISTORY_METADATA_PATH, JSON.stringify(updatedHistory));
  } catch (err) {
    console.error('Error adding history entry:', err);
  }
}

export async function deleteHistoryEntry(id) {
  try {
    const history = await getSearchHistory();
    const entry = history.find(item => item.id === id);
    if (entry && entry.type === 'image' && entry.query) {
      try {
        const pathToDelete = Platform.OS === 'ios' ? resolveIOSPath(entry.query) : entry.query;
        await FileSystem.deleteAsync(pathToDelete, { idempotent: true });
      } catch (err) {
        console.warn('Failed to delete history image file:', entry.query, err);
      }
    }
    const updatedHistory = history.filter(item => item.id !== id);
    await FileSystem.writeAsStringAsync(HISTORY_METADATA_PATH, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (err) {
    console.error('Error deleting history entry:', err);
    return [];
  }
}

export async function clearAllHistory() {
  try {
    const history = await getSearchHistory();
    for (const entry of history) {
      if (entry.type === 'image' && entry.query) {
        try {
          const pathToDelete = Platform.OS === 'ios' ? resolveIOSPath(entry.query) : entry.query;
          await FileSystem.deleteAsync(pathToDelete, { idempotent: true });
        } catch (err) {
          // ignore
        }
      }
    }
    await FileSystem.deleteAsync(HISTORY_METADATA_PATH, { idempotent: true });
    return [];
  } catch (err) {
    console.error('Error clearing search history:', err);
    return [];
  }
}
