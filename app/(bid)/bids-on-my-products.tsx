import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { getDatabase, ref, onValue, update, remove, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons'; // Add this import

interface Bid {
  id: string;
  targetProductId: string;
  offeredProducts: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  userId: string;
  notification?: string;
  targetProductOwnerId : string;
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

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - 40; // Adjust card width to fit the screen with some padding

const calculateCoins = (priceStart: number, priceEnd: number) => {
  const averagePrice = (priceStart + priceEnd) / 2;
  return Math.floor(averagePrice / 100);
};

export default function BidsOnMyProductsScreen() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [products, setProducts] = useState<{ [key: string]: Product }>({});
  const [loading, setLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const bidsRef = ref(db, 'bids');
    const productsRef = ref(db, 'products');

    const unsubscribeBids = onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userBids = Object.values(data).filter((bid) => {
          const bidData = bid as Bid;
          return bidData.targetProductOwnerId === user.uid;
        }) as Bid[];
        setBids(userBids);
      }
      setLoading(false);
    });

    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allProducts: { [key: string]: Product } = {};
        Object.keys(data).forEach(userId => {
          Object.keys(data[userId]).forEach(productId => {
            allProducts[productId] = {
              ...data[userId][productId],
              id: productId,
              userId: userId,
            };
          });
        });
        setProducts(allProducts);
      }
    });

    return () => {
      unsubscribeBids();
      unsubscribeProducts();
    };
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const updateTabBadge = (count: number) => {
      navigation.setOptions({
        tabBarBadge: count > 0 ? count : null,
      });
    };

    const resultedBidsCount = bids.filter(bid => bid.status !== 'pending').length;
    updateTabBadge(resultedBidsCount);
  }, [bids, navigation]);

  const handleBidResponse = async (bidId: string, status: 'accepted' | 'rejected') => {
    const db = getDatabase();
    const bidRef = ref(db, `bids/${bidId}`);
    const bid = bids.find(b => b.id === bidId);
    if (!bid) {
      console.error('Bid not found', bidId);
      Alert.alert('Error', 'Bid not found.');
      return;
    }

    const targetProduct = products[bid.targetProductId];
    if (!targetProduct) {
      console.error('Target product not found for bid', bid.targetProductId);
      Alert.alert('Error', 'Target product not found.');
      return;
    }

    try {
      await update(bidRef, { status, notification: `Your bid has been ${status}.` });
      Alert.alert('Success', `Bid has been ${status}.`);
      // Update the tab badge number after handling the bid response
      const resultedBidsCount = bids.filter(bid => bid.status !== 'pending').length;
      navigation.setOptions({
        tabBarBadge: resultedBidsCount > 0 ? resultedBidsCount : null,
      });
    } catch (error) {
      console.error(`Error updating bid status to ${status}:`, error);
      Alert.alert('Error', `There was an error updating the bid status. Please try again.`);
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

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {bids.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bids on your products yet</Text>
        </View>
      ) : (
        <View style={styles.cardsWrapper}>
          {bids.map((bid) => {
            const product = products[bid.targetProductId];
            const offeredProducts = bid.offeredProducts.map(id => products[id]).filter(Boolean);
            return (
              <View key={bid.id} style={[styles.card, { width: cardWidth }]}>
                {product && (
                  <View style={styles.productSection}>
                    <TouchableOpacity
                      style={styles.likeButton}
                      onPress={() => handleLikeProduct(product.id)}
                    >
                      <FontAwesome
                        name={likedProducts.includes(product.id) ? 'heart' : 'heart-o'}
                        size={24}
                        color="red"
                      />
                    </TouchableOpacity>
                    <Text style={styles.sectionTitle}>Product You Want</Text>
                    <View style={styles.productCard}>
                      <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productDescription}>{product.description}</Text>
                        <Text style={styles.productPrice}>
                          {product.priceStart} TL - {product.priceEnd} TL
                        </Text>
                        <View style={styles.coinContainer}>
                          <Text style={styles.productCoins}>Coins to bid: {calculateCoins(product.priceStart, product.priceEnd)}</Text>
                          <FontAwesome6 name="coins" size={16} color="#FFD700" />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
                <View style={styles.offeredSection}>
                  <Text style={styles.sectionTitle}>Offered Products</Text>
                  {offeredProducts.map(offeredProduct => (
                    <View key={offeredProduct.id} style={styles.productCard}>
                      <Image source={{ uri: offeredProduct.images[0] }} style={styles.productImage} />
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{offeredProduct.name}</Text>
                        <Text style={styles.productDescription}>{offeredProduct.description}</Text>
                        <Text style={styles.productPrice}>
                          ${offeredProduct.priceStart} - ${offeredProduct.priceEnd}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.bidInfo}>
                  <Text style={styles.bidStatus}>Status: {bid.status}</Text>
                  <Text style={styles.bidDate}>Date: {new Date(bid.createdAt).toLocaleDateString()}</Text>
                  {bid.status === 'pending' && (
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.acceptButton]}
                        onPress={() => handleBidResponse(bid.id, 'accepted')}
                      >
                        <Text style={styles.buttonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => handleBidResponse(bid.id, 'rejected')}
                      >
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: Platform.OS === 'web' ? '13%' : '46%',
  },
  productSection: {
    marginBottom: 10,
  },
  offeredSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 14,
    color: '#888',
  },
  productPrice: {
    fontSize: 14,
    color: '#888',
  },
  productCoins: {
    fontSize: 14,
    color: '#888',
    marginRight: 4,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bidInfo: {
    marginTop: 10,
  },
  bidStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bidDate: {
    fontSize: 14,
    color: '#888',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
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
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});