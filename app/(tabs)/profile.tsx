import { getDatabase, onValue, ref, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Alert, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome6 } from '@expo/vector-icons'; // Add this import

interface UserProfile {
  fullName: string;
  phone: string;
  address: string;
  photoUrl?: string;
  nickname?: string; // Add nickname field
  coins?: number; // Add coins field
}

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    phone: '',
    address: '',
    photoUrl: '',
    nickname: '', // Initialize nickname
    coins: 10, // Initialize coins with startup value
  });

  // Load existing profile data
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const db = getDatabase();
      const userProfileRef = ref(db, `users/${user.uid}/profile`);
      
      onValue(userProfileRef, (snapshot: any) => {
        const data = snapshot.val();
        if (data) {
          setProfile(data);
        }
      });
    }
  }, []);

  const handleSaveProfile = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Validate fields
      if (!profile.fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }

      const db = getDatabase();
      const userProfileRef = ref(db, `users/${user.uid}/profile`);
      
      await set(userProfileRef, {
        ...profile,
        updatedAt: Date.now(),
      });

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const photoUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfile(prev => ({
          ...prev,
          photoUrl,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const handleBuyCoins = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userProfileRef = ref(db, `users/${user.uid}/profile`);

    try {
      await set(userProfileRef, {
        ...profile,
        coins: (profile.coins || 0) + 10, // Add 10 coins
      });
      setProfile(prev => ({
        ...prev,
        coins: (prev.coins || 0) + 10, // Update local state
      }));
      Alert.alert('Success', 'You have bought 10 coins.');
    } catch (error) {
      Alert.alert('Error', 'Failed to buy coins');
      console.error('Buy coins error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage}>
            {profile.photoUrl ? (
              <Image
                source={{ uri: profile.photoUrl }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={pickImage}
          >
            <Text style={styles.changePhotoText}>
              {profile.photoUrl ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={profile.fullName}
          onChangeText={(text) => setProfile(prev => ({ ...prev, fullName: text }))}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Nickname" // Add nickname input
          value={profile.nickname}
          onChangeText={(text) => setProfile(prev => ({ ...prev, nickname: text }))}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={profile.phone}
          onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Address"
          value={profile.address}
          onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity 
          style={[
            styles.saveButton,
            isLoading && styles.disabledButton
          ]}
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.coinsSection}>
        <View style={styles.coinsContainer}>
          <Text style={styles.coinsText}>Coins: {profile.coins}</Text>
          <FontAwesome6 name="coins" size={16} color="#FFD700" />
        </View>

        <TouchableOpacity 
          style={styles.buyCoinsButton}
          onPress={handleBuyCoins}
        >
          <Text style={styles.buyCoinsButtonText}>Buy 10 Coins</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: '#666',
    fontSize: 14,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  coinsSection: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinsText: {
    fontSize: 16,
    color: '#888',
    marginRight: 8,
  },
  buyCoinsButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyCoinsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
