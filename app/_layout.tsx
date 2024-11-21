import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import '../config/firebaseConfig';

export default function RootLayout() {
  useEffect(() => {
    setTimeout(() => {
      router.replace('/(auth)/sign-in');
    }, 100);
  }, []);

  return (
<Stack screenOptions={{ headerShown: false }} />
  );
}

