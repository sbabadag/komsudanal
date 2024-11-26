import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import SignInScreen from '../app/(auth)/sign-in';
import HomeScreen from '../app/(tabs)/index';
import MyBidsScreen from '../app/(bid)/my-bids';
import MyProductsScreen from './(tabs)/my-products';
import BidsOnMyProductsScreen from '../app/(bid)/bids-on-my-products';
import ProfileScreen from '../app/(tabs)/profile';
import '../config/firebaseConfig';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const [userProfile, setUserProfile] = useState<{ photoUrl: string, fullName: string, nickname: string } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userProfileRef = ref(db, `users/${user.uid}/profile`);

    const unsubscribe = onValue(userProfileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserProfile(data);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      </View>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Home': iconName = 'home-outline'; break;
              case 'My Bids': iconName = 'list-outline'; break;
              case 'My Products': iconName = 'cube-outline'; break;
              case 'Bids On My Products': iconName = 'clipboard-outline'; break;
              case 'Profile': iconName = 'person-outline'; break; // Add icon for Profile
              default: iconName = 'ellipse-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          unmountOnBlur: true,
          lazy: false
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home'
          }}
        />
        <Tab.Screen 
          name="My Bids" 
          component={MyBidsScreen}
        />
        <Tab.Screen 
          name="My Products" 
          component={MyProductsScreen}
        />
        <Tab.Screen 
          name="Bids On My Products" 
          component={BidsOnMyProductsScreen}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} // Add Profile screen to the tab navigator
        />
      </Tab.Navigator>
      {userProfile && (
        <View style={styles.userProfileContainer}>
          <Image source={{ uri: userProfile.photoUrl }} style={styles.userPhoto} />
          <Text style={styles.userName}>{userProfile.nickname || userProfile.fullName}</Text> {/* Display nickname if available */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10, // Adjust top position for iPhone
    left: 10, // Move to the left
    zIndex: 1, // Ensure it is above other elements
  },
  logo: {
    width: 40,
    height: 40,
  },
  userProfileContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    flexDirection: 'row', // Align items in a row
    alignItems: 'center',
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    marginLeft: 10, // Add space between photo and name
    fontSize: 12,
    color: '#000',
  },
});

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen 
          name="SignIn" 
          component={SignInScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
          options={{ headerShown: false }} 
        />
      )}
    </Stack.Navigator>
  );
}