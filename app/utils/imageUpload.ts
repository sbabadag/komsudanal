import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export const uploadImageToFirebase = async (uri: string, path: string): Promise<string> => {
  try {
    // Validate user authentication
    const storage = getStorage();
    if (!storage) {
      throw new Error('Storage not initialized');
    }

    // Create blob from URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename with timestamp and random string
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const reference = storageRef(storage, `${path}/${filename}`);

    // Upload with metadata
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        'uploaded-by': 'app-user',
        'upload-timestamp': new Date().toISOString(),
      },
    };

    await uploadBytes(reference, blob, metadata);
    const downloadURL = await getDownloadURL(reference);

    return downloadURL;
  } catch (error: any) {
    console.error('Storage Error:', error.code, error.message);
    if (error.code === 'storage/unauthorized') {
      throw new Error('User not authorized to upload images');
    }
    throw new Error('Failed to upload image');
  }
};

export default {
  uploadImageToFirebase,
};
