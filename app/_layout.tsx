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
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useNavigation, NavigationProp } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;

function TabNavigator() {
  const [userProfile, setUserProfile] = useState<{ photoUrl: string, fullName: string, nickname: string } | null>(null);
  const [pendingBidsCount, setPendingBidsCount] = useState(0);
  const [resultedBidsCount, setResultedBidsCount] = useState(0);
  const [pendingBidsOnMyProductsCount, setPendingBidsOnMyProductsCount] = useState(0);
  const [drawerAnimation] = useState(new Animated.Value(-screenWidth));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userProfileRef = ref(db, `users/${user.uid}/profile`);
    const bidsRef = ref(db, 'bids');

    const unsubscribeProfile = onValue(userProfileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserProfile(data);
      }
    });

    const unsubscribeBids = onValue(bidsRef, (snapshot) => {
      const bidsData = snapshot.val() || {};
      let pendingBids = 0;
      let resultedBids = 0;
      let pendingBidsOnMyProducts = 0;

      Object.values(bidsData).forEach((bid: any) => {
        if (bid.userId === user.uid) {
          if (bid.status === 'pending') {
            pendingBids++;
          } else {
            resultedBids++;
          }
        }
        if (bid.targetProductOwnerId === user.uid && bid.status === 'pending') {
          pendingBidsOnMyProducts++;
        }
      });

      setPendingBidsCount(pendingBids);
      setResultedBidsCount(resultedBids);
      setPendingBidsOnMyProductsCount(pendingBidsOnMyProducts);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeBids();
    };
  }, []);

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(drawerAnimation, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    } else {
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(true));
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dx > 20; // Detect right swipe
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dx > 0) {
        drawerAnimation.setValue(gestureState.dx - screenWidth);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > screenWidth / 2) {
        toggleDrawer();
      } else {
        Animated.timing(drawerAnimation, {
          toValue: -screenWidth,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setIsDrawerOpen(false));
      }
    },
  });

  const navigateToScreen = (screenName: string) => {
    toggleDrawer();
    navigation.navigate(screenName);
  };

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <View style={styles.logoContainer}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        </TouchableOpacity>
      </View>
      {userProfile && (
        <View style={styles.userProfileContainer}>
          <Image source={{ uri: userProfile.photoUrl }} style={styles.userPhoto} />
          <Text style={styles.userName}>{userProfile.nickname || userProfile.fullName}</Text> {/* Display nickname if available */}
        </View>
      )}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            let badgeCount = 0;
            switch (route.name) {
              case 'Home': iconName = 'home-outline'; break;
              case 'My Bids': 
                iconName = 'list-outline'; 
                badgeCount = pendingBidsCount; // Set badge count for My Bids
                break;
              case 'My Products': iconName = 'cube-outline'; break;
              case 'Bids On My Products': 
                iconName = 'clipboard-outline'; 
                badgeCount = pendingBidsOnMyProductsCount; // Set badge count for BOM
                break;
              case 'Profile': iconName = 'person-outline'; break; // Add icon for Profile
              default: iconName = 'ellipse-outline';
            }
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                {badgeCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{badgeCount}</Text>
                  </View>
                )}
              </View>
            );
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
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnimation }] }]}>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigateToScreen('Home')}>
          <Ionicons name="home-outline" size={24} color="black" />
          <Text style={styles.drawerItemText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigateToScreen('My Bids')}>
          <Ionicons name="list-outline" size={24} color="black" />
          <Text style={styles.drawerItemText}>My Bids</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigateToScreen('My Products')}>
          <Ionicons name="cube-outline" size={24} color="black" />
          <Text style={styles.drawerItemText}>My Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigateToScreen('Bids On My Products')}>
          <Ionicons name="clipboard-outline" size={24} color="black" />
          <Text style={styles.drawerItemText}>Bids On My Products</Text>
          {pendingBidsOnMyProductsCount > 0 && ( // Set badge count for BOM
            <View style={styles.drawerBadge}>
              <Text style={styles.drawerBadgeText}>{pendingBidsOnMyProductsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => navigateToScreen('Profile')}>
          <Ionicons name="person-outline" size={24} color="black" />
          <Text style={styles.drawerItemText}>Profile</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10, // Adjust top position for iPhone
    left: 10, // Move to the left
    zIndex: 1, // Ensure it is above other elements
    flexDirection: 'row', // Align items in a row
    alignItems: 'center',
  },
  logo: {
    width: 125,
    height: 40,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Ensure it is above the logo
  },
  userProfileContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10, // Adjust top position for iPhone
    right: 10, // Move to the right
    flexDirection: 'row', // Align items in a row
    alignItems: 'center',
    zIndex: 1, // Ensure it is above other elements
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth * 0.75, // Drawer width is 75% of screen width
    height: '100%',
    backgroundColor: 'white',
    padding: 20,
    zIndex: 3, // Ensure it is above other elements
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20, // Move items down by 2 font heights
  },
  drawerItemText: {
    fontSize: 18,
    marginLeft: 10,
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  drawerBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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