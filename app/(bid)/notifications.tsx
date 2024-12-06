import * as Notifications from 'expo-notifications';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

interface Notification {
  message?: string;
  createdAt?: number;
  read?: boolean;
}

export const setupBidNotifications = async (): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.warn("No user is signed in.");
    return;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const db = getDatabase();
    const bidsRef = ref(db, `userBids/${user.uid}`);

    onValue(bidsRef, (snapshot) => {
      const bids = snapshot.val();
      if (!bids || typeof bids !== 'object') return;

      Object.entries(bids).forEach(([bidId, bid]: [string, any]) => {
        if (bid.status === 'accepted' && !bid.notified) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Bid Accepted! 🎉',
              body: `Your bid for ${bid.targetProductName} has been accepted!`,
              data: { bidId, targetProductId: bid.targetProductId },
            },
            trigger: null,
          });

          const bidRef = ref(db, `userBids/${user.uid}/${bidId}`);
          update(bidRef, { notified: true });
        }

        if (bid.status === 'rejected' && !bid.notified) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Bid Update',
              body: `Your bid for ${bid.targetProductName} was not accepted.`,
              data: { bidId, targetProductId: bid.targetProductId },
            },
            trigger: null,
          });

          const bidRef = ref(db, `userBids/${user.uid}/${bidId}`);
          update(bidRef, { notified: true });
        }
      });
    });
  } catch (error) {
    console.error("Error setting up bid notifications:", error);
  }
};

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const notificationsRef = ref(db, `notifications/${user.uid}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const notificationsArray = Object.values(data) as Notification[];
      setNotifications(notificationsArray);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        notifications.map((notification, index) => (
          <View key={index} style={styles.notificationCard}>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <Text style={styles.notificationDate}>
              {new Date(notification.createdAt || 0).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationMessage: {
    fontSize: 16,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 14,
    color: '#888',
  },
});

export default NotificationsScreen;
