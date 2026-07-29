import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const METADATA_PATH = `${FileSystem.documentDirectory}downloads_metadata.json`;
const ASYNC_STORAGE_KEY = 'user_downloads';

export const formatFileUri = (path) => {
  if (!path) return path;
  let cleanPath = path;
  try {
    cleanPath = decodeURI(path);
  } catch (_) {
    cleanPath = path;
  }

  // Reconstruct current Sandbox Document Directory path if UUID changed on iOS rebuild
  if (Platform.OS === 'ios') {
    if (cleanPath.includes('/Documents/')) {
      const filename = cleanPath.split('/Documents/').pop();
      const currentDocDir = FileSystem.documentDirectory.endsWith('/')
        ? FileSystem.documentDirectory
        : `${FileSystem.documentDirectory}/`;
      cleanPath = `${currentDocDir}${filename}`;
    }
  }

  if (typeof cleanPath === 'string' && cleanPath.startsWith('/') && !cleanPath.startsWith('file://')) {
    return `file://${cleanPath}`;
  }
  return cleanPath;
};

export const formatIOSUri = formatFileUri;

export async function getSavedDownloads() {
  try {
    let list = [];
    const asyncData = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    if (asyncData) {
      try {
        list = JSON.parse(asyncData);
      } catch (_) {
        list = [];
      }
    }

    // Fallback to FileSystem metadata file if AsyncStorage is empty
    if (!Array.isArray(list) || list.length === 0) {
      const info = await FileSystem.getInfoAsync(METADATA_PATH);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(METADATA_PATH);
        list = JSON.parse(content);
      }
    }

    if (!Array.isArray(list)) {
      list = [];
    }

    // Preserve valid records without aggressive filtering
    const verifiedList = [];
    for (const item of list) {
      if (!item || (!item.uri && !item.id)) continue;
      let targetUri = formatFileUri(item.uri || item.localUri || '');

      let shouldKeep = true;
      if (targetUri && (targetUri.startsWith('file://') || targetUri.startsWith('/'))) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetUri);
          if (!fileInfo.exists) {
            const filename = targetUri.split('/').pop();
            if (filename) {
              const currentDocUri = `${FileSystem.documentDirectory}${filename}`;
              const docInfo = await FileSystem.getInfoAsync(currentDocUri);
              if (docInfo.exists) {
                targetUri = currentDocUri;
                shouldKeep = true;
              } else if (!item.galleryAssetId && (!item.timestamp || Date.now() - item.timestamp > 86400000)) {
                shouldKeep = false;
              }
            }
          }
        } catch (_) {
          shouldKeep = true;
        }
      }

      if (shouldKeep) {
        verifiedList.push({
          ...item,
          uri: targetUri || item.uri,
        });
      }
    }

    // Save updated list back to AsyncStorage and FileSystem
    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(verifiedList));
    try {
      await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(verifiedList));
    } catch (_) {}

    return verifiedList;
  } catch (err) {
    console.error("Error reading downloads metadata:", err);
    return [];
  }
}

export async function addSavedDownload(localUri, galleryAssetId = null, isAI = false, originalName = null, source = 'browser') {
  try {
    const formattedUri = formatFileUri(localUri);
    const filename = originalName || (formattedUri || localUri).split('/').pop();

    const newRecord = {
      id: String(Date.now()),
      title: filename,
      filename: filename,
      originalName: filename,
      timestamp: Date.now(),
      source: source || (isAI ? 'ai' : 'browser'),
      uri: formattedUri || localUri,
      galleryAssetId,
      isAI: !!isAI,
    };

    let list = [];
    const asyncData = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    if (asyncData) {
      try {
        list = JSON.parse(asyncData);
      } catch (_) {
        list = [];
      }
    }
    if (!Array.isArray(list)) list = [];

    // Prevent duplicate entries
    if (!list.some(item => item.uri === formattedUri || item.uri === localUri)) {
      list = [newRecord, ...list];
    }

    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(list));
    try {
      await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(list));
    } catch (_) {}

    return newRecord;
  } catch (err) {
    console.error("Error adding download record:", err);
  }
}

export async function deleteSavedDownload(id, localUri, galleryAssetId = null) {
  try {
    // 1. Delete local file from app document directory if possible
    if (localUri) {
      try {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
      } catch (fileErr) {
        console.warn("Could not delete local file:", localUri, fileErr);
      }
    }

    // 2. Remove from metadata list in AsyncStorage and FileSystem
    let list = [];
    const asyncData = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    if (asyncData) {
      try {
        list = JSON.parse(asyncData);
      } catch (_) {}
    }
    if (!Array.isArray(list) || list.length === 0) {
      list = await getSavedDownloads();
    }

    const updatedList = list.filter(item => item.id !== id && item.uri !== localUri);
    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedList));
    try {
      await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(updatedList));
    } catch (_) {}

    return true;
  } catch (err) {
    console.error("Error deleting download record:", err);
    throw err;
  }
}

export async function deleteMultipleSavedDownloads(assets) {
  try {
    for (const asset of assets) {
      if (asset.uri) {
        try {
          await FileSystem.deleteAsync(asset.uri, { idempotent: true });
        } catch (fileErr) {
          console.warn("Could not delete local file:", asset.uri, fileErr);
        }
      }
    }

    let list = [];
    const asyncData = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    if (asyncData) {
      try {
        list = JSON.parse(asyncData);
      } catch (_) {}
    }
    if (!Array.isArray(list) || list.length === 0) {
      list = await getSavedDownloads();
    }

    const idsToRemove = assets.map(a => a.id);
    const urisToRemove = assets.map(a => a.uri);
    const updatedList = list.filter(item => !idsToRemove.includes(item.id) && !urisToRemove.includes(item.uri));

    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedList));
    try {
      await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(updatedList));
    } catch (_) {}

    return true;
  } catch (err) {
    console.error("Error in bulk delete manager:", err);
    throw err;
  }
}
