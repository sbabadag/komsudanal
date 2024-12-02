import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ProfileScreen from './(tabs)/profile'; // Adjust the import path as necessary

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Tabs">
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}