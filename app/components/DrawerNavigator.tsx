import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';

interface DrawerContentProps {
    [key: string]: any;  // For spreading props
}

export default function DrawerContent(props: DrawerContentProps) {
    const router = useRouter();

    return (
        <DrawerContentScrollView {...props}>
            <DrawerItem
                label="Home"
                onPress={() => router.push('/(tabs)')}
            />
            <DrawerItem
                label="My Bids"
                onPress={() => router.push('/(bid)/my-bids')}
            />
            <DrawerItem
                label="My Products"
                onPress={() => router.push('/(tabs)/my-products')}
            />
            <DrawerItem
                label="Profile"
                onPress={() => router.push('/(tabs)/profile')}
            />
        </DrawerContentScrollView>
    );
}
