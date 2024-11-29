import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, remove, set } from 'firebase/database';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

interface Bid {
  id: string;
  targetProductId: string;
  offeredProducts: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  userId: string;
}

export default function MyBidsScreen() {
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [products, setProducts] = useState<{[key: string]: any}>({});
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
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
    const bidsRef = ref(db, 'bids');
    const productsRef = ref(db, 'products');

    // First load all products for reference
    onValue(productsRef, (snapshot) => {
      const productsData = snapshot.val() || {};
      const allProducts: {[key: string]: any} = {};
      Object.keys(productsData).forEach(userId => {
        Object.keys(productsData[userId]).forEach(productId => {
          allProducts[productId] = productsData[userId][productId];
        });
      });
      setProducts(allProducts);
    }, (error) => {
      console.error('Error fetching products:', error);
    });

    // Then load bids
    onValue(bidsRef, (snapshot) => {
      const bidsData = snapshot.val();
      if (bidsData) {
        const userBids = Object.entries(bidsData)
          .filter(([key, value]: [string, any]) => value.userId === user.uid)
          .map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
          }));
        setMyBids(userBids.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        console.log('No bids found');
        setMyBids([]);
      }
    }, (error) => {
      console.error('Error fetching bids:', error);
    });
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const likesRef = ref(db, `likes/${user.uid}`);

    const unsubscribe = onValue(likesRef, (snapshot) => {
      const likesData = snapshot.val() || {};
      setLikedProducts(Object.keys(likesData));
    });

    return () => unsubscribe();
  }, []);

  const updateUnresultedBidsCount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const unresultedBidsRef = ref(db, `users/${user.uid}/unresultedBidsCount`);
    const bidsRef = ref(db, 'bids');

    onValue(bidsRef, (snapshot) => {
      const bidsData = snapshot.val() || {};
      const pendingBids = Object.values(bidsData).filter((bid: any) => bid.userId === user.uid && bid.status === 'pending');
      set(unresultedBidsRef, pendingBids.length);
    });
  };

  const handleCancelBid = async (bidId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      const bidRef = ref(db, `bids/${bidId}`);
      
      await remove(bidRef);
      await updateUnresultedBidsCount();
      Alert.alert('Success', 'Bid cancelled successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel bid');
    }
  };

  const handleLikeProduct = async (productId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const likesRef = ref(db, `likes/${user.uid}/${productId}`);

    try {
      if (likedProducts.includes(productId)) {
        await remove(likesRef);
        setLikedProducts((prev) => prev.filter((id) => id !== productId));
      } else {
        await set(likesRef, true);
        setLikedProducts((prev) => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      Alert.alert('Error', 'Failed to update likes');
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

  const renderBidItem = (bid: Bid) => {
    const targetProduct = products[bid.targetProductId];
    if (!targetProduct) {
      console.log(`Target product not found for bid ${bid.id}`);
      return null;
    }
  
    const offeredProducts = bid.offeredProducts.map(id => products[id]).filter(Boolean);
  
    return (
      <View key={bid.id} style={styles.bidCard}>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => handleLikeProduct(targetProduct.id)}
        >
          <FontAwesome
            name={likedProducts.includes(targetProduct.id) ? 'heart' : 'heart-o'}
            size={24}
            color="red"
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => router.push({
            pathname: "/(bid)/bid-details",
            params: { bidId: bid.id, userId: bid.userId }
          })}
        >
          <View style={styles.productRow}>
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Target Product</Text>
              {targetProduct.images && targetProduct.images.length > 0 ? (
                <Image
                  source={{ uri: targetProduct.images[0] }}
                  style={styles.mainImage}
                />
              ) : (
                <View style={styles.mainImagePlaceholder}>
                  <Text>No Image</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.productName} numberOfLines={1}>
                  {targetProduct.name}
                </Text>
                <Text style={styles.priceText}>
                  ${targetProduct.priceStart} - ${targetProduct.priceEnd}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Offered Products</Text>
              <ScrollView horizontal style={styles.offeredProductsRow}>
                <View style={styles.offeredThumbnails}>
                  {offeredProducts.map(product => (
                    <View key={product.id} style={styles.offeredProduct}>
                      {product.images && product.images.length > 0 ? (
                        <Image
                          source={{ uri: product.images[0] }}
                          style={styles.thumbnailImage}
                        />
                      ) : (
                        <View style={styles.thumbnailImagePlaceholder}>
                          <Text>No Image</Text>
                        </View>
                      )}
                      <View style={styles.cardBody}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.priceText}>
                          ${product.priceStart} - ${product.priceEnd}
                        </Text>
                        <Text style={styles.productDescription} numberOfLines={2}>
                          {product.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          {renderBidStatus(bid.status)}
          {bid.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBid(bid.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
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
        <View style={styles.cardsWrapper}>
          {myBids.map(bid => renderBidItem(bid))}
        </View>
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
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardsContainer: {
    padding: 8,
  },
  bidCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    width: '100%',
  },
  cardContent: {
    flexDirection: 'column',
    padding: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSection: {
    flex: 1,
    marginBottom: 16,
  },
  divider: {
    width: 1,
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mainImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  mainImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    marginTop: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#888',
  },
  offeredProductsRow: {
    marginBottom: 8,
  },
  offeredThumbnails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offeredProduct: {
    marginRight: 10,
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 4,
  },
  thumbnailImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  moreIndicator: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIndicatorText: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#C62828',
    fontSize: 13,
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
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});
