import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

export default function RootLayout() {
    const { isAuthenticated, setIsAuthenticated } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            const isLoggedIn = !!user;
            setIsAuthenticated(isLoggedIn);

            if (!isLoggedIn) {
                // Always redirect to sign-in if not logged in
                router.replace('/(auth)/sign-in');
            } else if (isLoggedIn && segments[0] === '(auth)') {
                // Only redirect to tabs if user is logged in and trying to access auth screens
                router.replace('/(tabs)/');
            }
        });

        return unsubscribe;
    }, [segments]);

    return <Slot />;
}
