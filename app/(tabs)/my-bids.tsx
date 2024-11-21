import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { useRouter } from 'expo-router';

interface Bid {
  id: string;
  targetProductId: string;
  offeredProducts: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export default function MyBidsScreen() {
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [products, setProducts] = useState<{[key: string]: any}>({});
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert('Error', 'Please login to view your bids');
      return;
    }

    const db = getDatabase();
    
    // Load all bids
    const bidsRef = ref(db, `userBids/${user.uid}`);
    const productsRef = ref(db, 'products');

    // First load all products for reference
    onValue(productsRef, (snapshot) => {
      const productsData = snapshot.val() || {};
      setProducts(productsData);
    });

    // Then load bids
    onValue(bidsRef, (snapshot) => {
      const bidsData = snapshot.val();
      if (bidsData) {
        const bidsArray = Object.entries(bidsData).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setMyBids(bidsArray.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setMyBids([]);
      }
    });
  }, []);

  const handleCancelBid = async (bidId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      const bidRef = ref(db, `userBids/${user.uid}/${bidId}`);
      
      await remove(bidRef);
      Alert.alert('Success', 'Bid cancelled successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel bid');
    }
  };

  const renderBidStatus = (status: string) => {
    const statusStyles: { [key: string]: any } = {
      pending: { container: styles.statusPending, text: styles.statusPendingText },
      accepted: { container: styles.statusAccepted, text: styles.statusAcceptedText },
      rejected: { container: styles.statusRejected, text: styles.statusRejectedText },
    };

    return (
      <View style={statusStyles[status].container}>
        <Text style={statusStyles[status].text}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Bids</Text>

      {myBids.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't made any bids yet</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        myBids.map(bid => {
          const targetProduct = products[bid.targetProductId];
          if (!targetProduct) return null;

          return (
            <View key={bid.id} style={styles.bidCard}>
              {/* Target Product */}
              <View style={styles.targetProduct}>
                <Text style={styles.sectionLabel}>Product You Want</Text>
                <View style={styles.productInfo}>
                  <Image
                    source={{ uri: targetProduct.images[0] }}
                    style={styles.productImage}
                  />
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{targetProduct.name}</Text>
                    <Text style={styles.productPrice}>
                      ${targetProduct.priceStart} - ${targetProduct.priceEnd}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Offered Products */}
              <View style={styles.offeredProducts}>
                <Text style={styles.sectionLabel}>Your Offer</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {bid.offeredProducts.map(productId => {
                    const product = products[productId];
                    if (!product) return null;

                    return (
                      <View key={productId} style={styles.offeredProductCard}>
                        <Image
                          source={{ uri: product.images[0] }}
                          style={styles.offeredProductImage}
                        />
                        <Text style={styles.offeredProductName} numberOfLines={1}>
                          {product.name}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Bid Status and Actions */}
              <View style={styles.bidFooter}>
                {renderBidStatus(bid.status)}
                {bid.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelBid(bid.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Bid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  bidCard: {
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  targetProduct: {
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  offeredProducts: {
    marginBottom: 16,
  },
  offeredProductCard: {
    width: 100,
    marginRight: 12,
  },
  offeredProductImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 4,
  },
  offeredProductName: {
    fontSize: 12,
    textAlign: 'center',
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
    padding: 6,
    borderRadius: 4,
  },
  statusPendingText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: '600',
  },
  statusAccepted: {
    backgroundColor: '#E8F5E9',
    padding: 6,
    borderRadius: 4,
  },
  statusAcceptedText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRejected: {
    backgroundColor: '#FFEBEE',
    padding: 6,
    borderRadius: 4,
  },
  statusRejectedText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
