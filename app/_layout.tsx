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
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { useNavigation, NavigationProp } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;

function TabNavigator() {
  const [userProfile, setUserProfile] = useState<{ photoUrl: string, fullName: string, nickname: string } | null>(null);
  const [unansweredBidsOnMyProductsCount, setUnansweredBidsOnMyProductsCount] = useState(0);
  const [myUnresultedBidsCount, setMyUnresultedBidsCount] = useState(0);
  const [drawerAnimation] = useState(new Animated.Value(-screenWidth));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userProfileRef = ref(db, `users/${user.uid}/profile`);
    const unansweredBidsOnMyProductsRef = ref(db, `users/${user.uid}/unansweredBidsOnMyProductsCount`);
    const myUnresultedBidsRef = ref(db, `users/${user.uid}/unresultedBidsCount`);

    const unsubscribeProfile = onValue(userProfileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserProfile(data);
      }
    });

    const unsubscribeBidsOnMyProducts = onValue(unansweredBidsOnMyProductsRef, (snapshot) => {
      const count = snapshot.val();
      if (count !== null) {
        setUnansweredBidsOnMyProductsCount(count);
      }
    });

    const unsubscribeMyBids = onValue(myUnresultedBidsRef, (snapshot) => {
      const count = snapshot.val();
      if (count !== null) {
        setMyUnresultedBidsCount(count);
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeBidsOnMyProducts();
      unsubscribeMyBids();
    };
  }, []);

  const updateUnansweredBidsCount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const unansweredBidsOnMyProductsRef = ref(db, `users/${user.uid}/unansweredBidsOnMyProductsCount`);
    const myUnresultedBidsRef = ref(db, `users/${user.uid}/unresultedBidsCount`);
    const bidsRef = ref(db, 'bids');

    onValue(bidsRef, (snapshot) => {
      const bidsData = snapshot.val() || {};
      const pendingBidsOnMyProducts = Object.values(bidsData).filter((bid: any) => bid.targetProductOwnerId === user.uid && bid.status === 'pending');
      const myPendingBids = Object.values(bidsData).filter((bid: any) => bid.userId === user.uid && bid.status === 'pending');
      set(unansweredBidsOnMyProductsRef, pendingBidsOnMyProducts.length);
      set(myUnresultedBidsRef, myPendingBids.length);
    });
  };

  useEffect(() => {
    updateUnansweredBidsCount();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      updateUnansweredBidsCount();
    });

    return unsubscribe;
  }, [navigation]);

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
          {unansweredBidsOnMyProductsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unansweredBidsOnMyProductsCount}</Text>
            </View>
          )}
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
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen 
          name="My Bids" 
          component={MyBidsScreen}
          options={{
            tabBarBadge: myUnresultedBidsCount > 0 ? myUnresultedBidsCount : undefined,
            tabBarBadgeStyle: { backgroundColor: 'green' },
          }}
          listeners={{
            tabPress: () => setMyUnresultedBidsCount(0), // Clear badge count when tab is pressed
          }}
        />
        <Tab.Screen 
          name="My Products" 
          component={MyProductsScreen}
        />
        <Tab.Screen 
          name="Bids On My Products" 
          component={BidsOnMyProductsScreen}
          options={{
            tabBarBadge: unansweredBidsOnMyProductsCount > 0 ? unansweredBidsOnMyProductsCount : undefined,
            tabBarBadgeStyle: { backgroundColor: 'red' },
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
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
    width: 40,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
});

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation<NavigationProp<any>>();

  const updateUnresultedBidsCount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const unresultedBidsRef = ref(db, `users/${user.uid}/unresultedBidsCount`);
    const bidsRef = ref(db, 'bids');

    onValue(bidsRef, (snapshot) => {
      const bidsData = snapshot.val() || {};
      const userBids = Object.values(bidsData).filter((bid: any) => bid.targetProductOwnerId === user.uid && bid.status === 'pending');
      set(unresultedBidsRef, userBids.length);
    });
  };

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        updateUnresultedBidsCount();
      }
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
        <>
          <Stack.Screen 
            name="Main" 
            component={TabNavigator}
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="My Bids" 
            component={MyBidsScreen}
            options={{
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back-outline" size={24} color="black" />
                </TouchableOpacity>
              ),
            }} 
          />
          <Stack.Screen 
            name="My Products" 
            component={MyProductsScreen}
            options={{
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back-outline" size={24} color="black" />
                </TouchableOpacity>
              ),
            }} 
          />
          <Stack.Screen 
            name="Bids On My Products" 
            component={BidsOnMyProductsScreen}
            options={{
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back-outline" size={24} color="black" />
                </TouchableOpacity>
              ),
            }} 
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back-outline" size={24} color="black" />
                </TouchableOpacity>
              ),
            }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}