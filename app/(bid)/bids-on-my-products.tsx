import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';

interface Bid {
  id: string;
  targetProductId: string;
  offeredProducts: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  userId: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  priceStart: number;
  priceEnd: number;
  userId: string;
}

export default function BidsOnMyProductsScreen() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const userProductsRef = ref(db, `products/${user.uid}`);

    // Fetch user's products
    const unsubscribeUserProducts = onValue(userProductsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.keys(data).map((productId) => ({
          ...data[productId],
          id: productId,
          userId: user.uid,
        }));
        setUserProducts(productsArray);
        console.log('User products:', productsArray); // Debug log
      }
    });

    return () => {
      unsubscribeUserProducts();
    };
  }, [user]);

  useEffect(() => {
    if (!user || userProducts.length === 0) return;

    const db = getDatabase();
    const bidsRef = ref(db, 'bids');

    // Fetch bids
    const unsubscribeBids = onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allBids: Bid[] = Object.keys(data).map((bidId) => ({
          ...data[bidId],
          id: bidId,
        }));

        // Filter bids to show only those relevant to the user's products
        const filteredBids = allBids.filter((bid) =>
          userProducts.some((product) => product.id === bid.targetProductId)
        );

        setBids(filteredBids);
        console.log('Filtered bids:', filteredBids); // Debug log
      }
      setLoading(false);
    });

    return () => {
      unsubscribeBids();
    };
  }, [user, userProducts]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView>
      {bids.map((bid) => (
        <View key={bid.id} style={styles.bidContainer}>
          <Text style={styles.bidText}>Bid ID: {bid.id}</Text>
          <Text style={styles.bidText}>Target Product ID: {bid.targetProductId}</Text>
          <Text style={styles.bidText}>Status: {bid.status}</Text>
          <Text style={styles.bidText}>Created At: {new Date(bid.createdAt).toLocaleString()}</Text>
          <Text style={styles.bidText}>Offered Products: {bid.offeredProducts.join(', ')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bidContainer: {
    padding: 10,
    margin: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  bidText: {
    fontSize: 16,
    marginBottom: 5,
  },
});