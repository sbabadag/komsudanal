import * as Notifications from 'expo-notifications';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export const setupBidNotifications = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) return;

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Listen for bid updates
  const db = getDatabase();
  const bidsRef = ref(db, `userBids/${user.uid}`);
  
  onValue(bidsRef, (snapshot) => {
    const bids = snapshot.val();
    if (!bids) return;

    Object.entries(bids).forEach(([bidId, bid]: [string, any]) => {
      if (bid.status === 'accepted' && !bid.notified) {
        // Send notification
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bid Accepted! 🎉',
            body: `Your bid for ${bid.targetProductName} has been accepted!`,
            data: { bidId, targetProductId: bid.targetProductId },
          },
          trigger: null,
        });

        // Mark as notified
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
};