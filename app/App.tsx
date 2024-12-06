import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// ...existing code...

const registerForPushNotificationsAsync = async () => {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (token) {
    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const tokenRef = ref(db, `expoPushTokens/${user.uid}`);
      await set(tokenRef, token);
    }
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};

export default function App() {
  const [notificationCount, setNotificationCount] = useState(0);

  interface Notification {
    request: {
      content: {
        title: string | null;
        subtitle: string | null;
        body: string | null;
        data: Record<string, any>;
        sound: "default" | "defaultCritical" | "custom" | null;
      };
    };
  }

  const handleNotification = (notification: Notification) => {
    setNotificationCount(prevCount => prevCount + 1);
  };

  useEffect(() => {
    registerForPushNotificationsAsync();
    const subscription = Notifications.addNotificationReceivedListener(handleNotification);
    return () => subscription.remove();
    // ...existing code...
  }, []);

  // ...existing code...
}