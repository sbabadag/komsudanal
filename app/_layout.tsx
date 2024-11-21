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
import '../config/firebaseConfig';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home': iconName = 'home-outline'; break;
            case 'My Bids': iconName = 'list-outline'; break;
            case 'My Products': iconName = 'cube-outline'; break;
            case 'Bids On My Products': iconName = 'clipboard-outline'; break;
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
    </Tab.Navigator>
  );
}

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