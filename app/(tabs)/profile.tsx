import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface UserProfile {
  nickname: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  photoUrl: string;
  coins: number;
  rating: number;
  joinDate: number;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'No user logged in');
      router.replace('/(auth)/sign-in');
      return;
    }

    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}/profile`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfile(data);
        setEditedProfile(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}/profile`);

    try {
      await update(userRef, editedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = async () => {
    const auth = getAuth();
    try {
      await auth.signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: profile?.photoUrl || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
        <View style={styles.coinsContainer}>
          <Ionicons name="ios-trophy" size={24} color="#FFD700" />
          <Text style={styles.coinsText}>{profile?.coins || 0} Coins</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        {isEditing ? (
          // Edit Mode
          <>
            <TextInput
              style={styles.input}
              value={editedProfile.nickname}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, nickname: text }))}
              placeholder="Nickname"
            />
            <TextInput
              style={styles.input}
              value={editedProfile.fullName}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, fullName: text }))}
              placeholder="Full Name"
            />
            <TextInput
              style={styles.input}
              value={editedProfile.phoneNumber}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phoneNumber: text }))}
              placeholder="Phone Number"
            />
            <TextInput
              style={styles.input}
              value={editedProfile.address}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, address: text }))}
              placeholder="Address"
              multiline
            />
          </>
        ) : (
          // View Mode
          <>
            <InfoRow icon="person" label="Nickname" value={profile?.nickname} />
            <InfoRow icon="person-circle" label="Full Name" value={profile?.fullName} />
            <InfoRow icon="mail" label="Email" value={profile?.email} />
            <InfoRow icon="call" label="Phone" value={profile?.phoneNumber} />
            <InfoRow icon="location" label="Address" value={profile?.address} />
            <InfoRow icon="star" label="Rating" value={`${profile?.rating || 0}/5`} />
            <InfoRow
              icon="calendar"
              label="Join Date"
              value={profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A'}
            />
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.signOutButton]}
              onPress={handleSignOut}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const InfoRow = ({ icon, label, value }: { icon: any, label: string, value: string | undefined }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={24} color="#007AFF" style={styles.icon} />
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'Not set'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinsText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  icon: {
    marginRight: 15,
    width: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  buttonContainer: {
    padding: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
