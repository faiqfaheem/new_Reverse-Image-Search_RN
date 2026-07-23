import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

const METADATA_PATH = `${FileSystem.documentDirectory}downloads_metadata.json`;

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

export async function getSavedDownloads() {
  try {
    const info = await FileSystem.getInfoAsync(METADATA_PATH);
    if (!info.exists) {
      return [];
    }
    const content = await FileSystem.readAsStringAsync(METADATA_PATH);
    const list = JSON.parse(content);
    
    // Verify each file still exists locally on the disk
    const verifiedList = [];
    for (const item of list) {
      const formattedUri = formatIOSUri(item.uri);
      const fileInfo = await FileSystem.getInfoAsync(formattedUri || item.uri);
      if (fileInfo.exists) {
        verifiedList.push({
          ...item,
          uri: formattedUri || item.uri,
        });
      }
    }
    
    // If some files were deleted externally, update metadata
    if (verifiedList.length !== list.length) {
      await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(verifiedList));
    }
    
    return verifiedList;
  } catch (err) {
    console.error("Error reading downloads metadata:", err);
    return [];
  }
}

export async function addSavedDownload(localUri, galleryAssetId = null, isAI = false, originalName = null) {
  try {
    const list = await getSavedDownloads();
    const formattedUri = formatIOSUri(localUri);

    // Prevent duplicate entries
    if (list.some(item => item.uri === formattedUri || item.uri === localUri)) {
      return;
    }
    
    const newRecord = {
      id: String(Date.now()),
      uri: formattedUri || localUri,
      galleryAssetId,
      isAI,
      timestamp: Date.now(),
      originalName: originalName || (formattedUri || localUri).split('/').pop(),
    };
    
    const updatedList = [newRecord, ...list];
    await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(updatedList));
  } catch (err) {
    console.error("Error adding download record:", err);
  }
}

export async function deleteSavedDownload(id, localUri, galleryAssetId = null) {
  try {
    // 1. Delete local file from app document directory
    await FileSystem.deleteAsync(localUri, { idempotent: true });
    
    // 2. Remove from metadata list
    const list = await getSavedDownloads();
    const updatedList = list.filter(item => item.id !== id);
    await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(updatedList));
    
    return true;
  } catch (err) {
    console.error("Error deleting download record:", err);
    throw err; // Propagate error so calling screen knows deletion was aborted
  }
}

export async function deleteMultipleSavedDownloads(assets) {
  try {
    // 1. Delete local files from app document directory
    for (const asset of assets) {
      try {
        await FileSystem.deleteAsync(asset.uri, { idempotent: true });
      } catch (fileErr) {
        console.warn("Could not delete local file:", asset.uri, fileErr);
      }
    }
    
    // 2. Remove from metadata list
    const list = await getSavedDownloads();
    const idsToRemove = assets.map(a => a.id);
    const updatedList = list.filter(item => !idsToRemove.includes(item.id));
    await FileSystem.writeAsStringAsync(METADATA_PATH, JSON.stringify(updatedList));
    
    return true;
  } catch (err) {
    console.error("Error in bulk delete manager:", err);
    throw err; // Propagate error so calling screen knows deletion was aborted
  }
}
