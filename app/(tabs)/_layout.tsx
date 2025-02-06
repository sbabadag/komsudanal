import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, View, Platform, Text, StyleSheet, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userProfileRef = ref(db, `users/${user.uid}/profile`);

    // Realtime listener for user profile updates
    const unsubscribe = onValue(userProfileRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.photoUrl) {
        setUserPhoto(data.photoUrl);
      } else {
        // Only use placeholder if no photo URL exists
        setUserPhoto(null);
      }
      if (data?.nickname) {
        setUserName(data.nickname);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.topContainer, {
        marginTop: -60,
        height: insets.top + 50,
      }]}>
        <View style={[styles.contentContainer, { marginTop: insets.top }]}>
          <View style={styles.userContainer}>
            <Image
              source={{
                uri: userPhoto || 'https://via.placeholder.com/150', // Fallback image if no photo
              }}
              style={styles.userPhoto}
            />
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.logo}>
            <Image
              source={require('../../assets/images/app-logo.png')}
              style={styles.appLogo}
            />
          </View>
          <View style={styles.userContainer} />
        </View>
      </View>

      <View style={styles.mainContainer}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e5e5e5',
              height: Platform.select({
                ios: 44, // Reduced from insets.bottom + 49 to just 44
                android: 50, // Reduced from 60 to 50
                default: 50,
              }),
              bottom: 0, // Changed from matching height to 0
              left: 0,
              right: 0,
              paddingBottom: 0, // Remove bottom padding
              paddingTop: 0, // Remove top padding
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: -2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 5,
            },
            tabBarLabelStyle: {
              fontSize: 10, // Smaller font size for labels
              marginBottom: 0, // Remove bottom margin
            },
            tabBarIconStyle: {
              marginTop: 0, // Remove top margin
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="my-products"
            options={{
              title: 'My Products',
              tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="my-bids"
            options={{
              title: 'My Bids',
              tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="bids-on-my-products"
            options={{
              title: 'Received Bids',
              tabBarIcon: ({ color }) => <Ionicons name="arrow-down-circle-outline" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'column', // Changed to column to stack content
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginTop: 10, // Remove marginTop
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    width: 300,
    height: 50,
    flex: 1,
    resizeMode: 'stretch',

  },
  appLogo: {
    width: 600,
    height: 50,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    flex: 0.3,
    height: 40,
    marginVertical: 1,
    marginTop: 1,
  },
  userName: {
    marginLeft: 6, // Reduced from 8
    fontSize: 14, // Reduced from 16
    color: '#333',
  },
  userPhoto: {
    width: 24, // Reduced from 28 to match logo size
    height: 24, // Reduced from 28 to match logo size
    borderRadius: 12, // Half of width/height
    borderWidth: 1, // Thinner border
    borderColor: '#007AFF',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
});
