import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

interface Bid {
  id: string;
  bidderId: string;
  productId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function BidsOnMyProducts() {
  const [bids, setBids] = useState<Bid[]>([]);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const db = getDatabase();
    const bidsRef = ref(db, `bidsOnMyProducts/${user.uid}`);

    const unsubscribe = onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      const bidsList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setBids(bidsList);
    });

    return () => unsubscribe();
  }, []);

  const handleBidPress = (bidId: string) => {
    router.push({
      pathname: '/bid-details',
      params: { bidId }
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={bids}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleBidPress(item.id)} style={styles.bidItem}>
            <Text style={styles.bidText}>Bidder ID: {item.bidderId}</Text>
            <Text style={styles.bidText}>Product ID: {item.productId}</Text>
            <Text style={styles.bidStatus}>Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  bidItem: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  bidText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bidStatus: {
    fontSize: 14,
    color: 'gray',
  },
});
