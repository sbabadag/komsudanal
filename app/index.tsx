import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function Index() {
    const { isAuthenticated } = useAuth();
    const auth = getAuth();

    useEffect(() => {
        // Only register for notifications in development builds
        if (Constants.appOwnership === 'expo') {
            console.warn('Push notifications are not fully supported in Expo Go');
            return;
        }
        // ...rest of notification setup
    }, []);

    // Immediately check auth state
    if (!auth.currentUser) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    // Then handle based on context
    if (!isAuthenticated) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    return <Redirect href="/(tabs)/" />;
}
