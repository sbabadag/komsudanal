import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  TextInput,
  AppState,
} from 'react-native';
import { getDatabase, ref, onValue, push, set, get, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Modal from 'react-native-modal';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { Checkbox } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';

// Define the Product type
interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  priceStart: number;
  priceEnd: number;
  userId: string;
  status: 'draft' | 'published';
  createdAt: number;
}

interface Bid {
  id: string;
  targetProductId: string;
  offeredProducts: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  userId: string;
  targetProductOwnerId: string; // Add target product owner ID
}

const screenWidth = Dimensions.get('window').width;
const cardWidth = Platform.select({
  web: '13%', // 7 cards per row on web
  default: '48%', // 2 cards per row on other platforms
});

const MyProductsScreen = ({ selectedProducts, setSelectedProducts }: { selectedProducts: string[], setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>> }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const productsRef = ref(db, `products/${user.uid}`);
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const productsData = snapshot.val() || {};
      const productsArray = Object.entries(productsData).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }));
      setProducts(productsArray);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.drawerContainer}>
      <Text style={styles.title}>Select Products to Offer</Text>
      <View style={styles.cardsWrapper}>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[
              styles.card,
              selectedProducts.includes(product.id) && styles.selectedProduct
            ]}
            onPress={() => {
              setSelectedProducts(prev => {
                const updatedSelectedProducts = prev.includes(product.id)
                  ? prev.filter(id => id !== product.id)
                  : [...prev, product.id];
                return updatedSelectedProducts;
              });
            }}
          >
            <Image
              source={{ uri: product.images[0] }}
              style={styles.cardImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>${product.priceStart} - ${product.priceEnd}</Text>
              <Text style={styles.productStatus}>Status: {product.status}</Text>
              <Text style={styles.productCreatedAt}>Created At: {new Date(product.createdAt).toLocaleDateString()}</Text>
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={selectedProducts.includes(product.id) ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setSelectedProducts(prev => {
                      const updatedSelectedProducts = prev.includes(product.id)
                        ? prev.filter(id => id !== product.id)
                        : [...prev, product.id];
                      return updatedSelectedProducts;
                    });
                  }}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [ownerPhotos, setOwnerPhotos] = useState<{ [key: string]: { photoUrl: string, nickname: string } }>({});
  const [bidCounts, setBidCounts] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [unresultedBidsCount, setUnresultedBidsCount] = useState(0);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);

  // Fetch all products except user's own
  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, 'products');
    const auth = getAuth();
    const user = auth.currentUser;

    console.log('Current user:', user?.uid);

    const unsubscribe = onValue(productsRef, (snapshot) => {
      setLoading(true);
      const data = snapshot.val();
      if (!data) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const allProducts: Product[] = [];

      // Iterate through each user's products
      Object.keys(data).forEach((userId) => {
        const userProducts = data[userId];

        if (userProducts && typeof userProducts === 'object') {
          Object.keys(userProducts).forEach((productId) => {
            const product = userProducts[productId];

            // Only include if:
            // 1. Product exists
            // 2. Not current user's product
            if (product && (!user || userId !== user.uid)) {
              allProducts.push({
                ...product,
                id: productId,
                userId: userId
              });
            }
          });
        }
      });

      console.log('Filtered products:', allProducts);
      setProducts(allProducts);
      setLoading(false);
    }, (error) => {
      console.error('Database error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array to run only once

  // Fetch user's products for bidding
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userProductsRef = ref(db, `products/${user.uid}`);

    const unsubscribe = onValue(userProductsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userProductsArray = Object.keys(data).map((productId) => ({
          ...data[productId],
          id: productId,
          userId: user.uid,
        }));
        setUserProducts(userProductsArray);
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const photos: { [key: string]: { photoUrl: string, nickname: string } } = {};
        Object.keys(data).forEach((userId) => {
          if (data[userId].profile && data[userId].profile.photoUrl && data[userId].profile.nickname) {
            photos[userId] = {
              photoUrl: data[userId].profile.photoUrl,
              nickname: data[userId].profile.nickname,
            };
          }
        });
        setOwnerPhotos(photos);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const bidsRef = ref(db, 'bids');
    
    const unsubscribe = onValue(bidsRef, (snapshot) => {
      const bids = snapshot.val() || {};
      const counts: { [key: string]: number } = {};
      let unresultedBidsCount = 0;
      
      Object.values(bids).forEach((bid: any) => {
        if (counts[bid.targetProductId]) {
          counts[bid.targetProductId]++;
        } else {
          counts[bid.targetProductId] = 1;
        }
        if (bid.status === 'pending') {
          unresultedBidsCount++;
        }
      });
      
      setBidCounts(counts);
      setUnresultedBidsCount(unresultedBidsCount);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Refresh the counter when the app becomes active
        const db = getDatabase();
        const bidsRef = ref(db, 'bids');
        
        onValue(bidsRef, (snapshot) => {
          const bids: { [key: string]: Bid } = snapshot.val() || {};
          let unresultedBidsCount = 0;
          
          Object.values(bids).forEach((bid: Bid) => {
            if (bid.status === 'pending') {
              unresultedBidsCount++;
            }
          });
          
          setUnresultedBidsCount(unresultedBidsCount);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const sendPushNotification = async (expoPushToken: string, message: string) => {
    const messageBody = {
      to: expoPushToken,
      sound: 'default',
      title: 'New Bid Received',
      body: message,
      data: { message },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });
  };

  const handleBidSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log('Selected products:', selectedProducts);
    console.log('Target product ID:', targetProductId);
    if (!user || !targetProductId || selectedProducts.length === 0) {
      Alert.alert('Error', 'Please select a product to bid on and offer at least one product.');
      return;
    }

    const targetProduct = products.find(product => product.id === targetProductId);
    if (!targetProduct) {
      console.error('Target product not found for bid', targetProductId);
      Alert.alert('Error', 'Target product not found.');
      return;
    }

    const offeredProductsExist = selectedProducts.every(productId =>
      userProducts.some(product => product.id === productId)
    );
    if (!offeredProductsExist) {
      console.error('One or more offered products not found', selectedProducts);
      Alert.alert('Error', 'One or more offered products not found.');
      return;
    }

    const db = getDatabase();
    const bidsRef = ref(db, 'bids');
    const newBidRef = push(bidsRef);

    const newBid: Bid = {
      id: newBidRef.key!,
      targetProductId,
      offeredProducts: selectedProducts,
      status: 'pending',
      createdAt: Date.now(),
      userId: user.uid,
      targetProductOwnerId: targetProduct.userId, // Add target product owner ID
    };

    try {
      await set(newBidRef, newBid);
      // Send notification to the target product owner
      const notificationRef = ref(db, `notifications/${targetProduct.userId}`);
      const newNotificationRef = push(notificationRef);
      await set(newNotificationRef, {
        message: `You have received a new bid on your product: ${targetProduct.name}`,
        createdAt: Date.now(),
        read: false,
      });

      // Fetch the target user's Expo push token
      const userTokenRef = ref(db, `expoPushTokens/${targetProduct.userId}`);
      const tokenSnapshot = await get(userTokenRef);
      const expoPushToken = tokenSnapshot.val();

      if (expoPushToken) {
        await sendPushNotification(expoPushToken, `You have received a new bid on your product: ${targetProduct.name}`);
      }

      Alert.alert('Success', 'Your bid has been submitted.');
      setSelectedProducts([]);
      setTargetProductId(null);
      setModalVisible(false);
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert('Error', 'There was an error submitting your bid. Please try again.');
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

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.cardsWrapper}>
          {filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.card,
                selectedProducts.includes(product.id) && styles.selectedProduct
              ]}
              onPress={() => {
                setTargetProductId(product.id);
                setModalVisible(true);
              }}
            >
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
              <Image
                source={{ uri: product.images[0] }}
                style={styles.cardImage}
              />
              <View style={styles.cardContent}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
                <Text style={styles.productPrice}>${product.priceStart} - ${product.priceEnd}</Text>
                <Text style={styles.productCreatedAt}>
                  Created: {new Date(product.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.bidCount}>
                  Bids: {bidCounts[product.id] || 0}
                </Text>
                <View style={styles.ownerInfo}>
                  <Image
                    source={{ uri: ownerPhotos[product.userId]?.photoUrl || 'https://placeholder.com/user' }}
                    style={styles.ownerPhoto}
                  />
                  <Text style={styles.ownerNickname}>
                    {ownerPhotos[product.userId]?.nickname || 'NoName'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.bidButton, { marginTop: 8 }]}
                  onPress={() => {
                    setTargetProductId(product.id);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>Place Bid</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => {
          setModalVisible(false);
          Alert.alert("Close", "Are you sure you want to close this window?"); // Add alert text
        }}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <MyProductsScreen selectedProducts={selectedProducts} setSelectedProducts={setSelectedProducts} />
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleBidSubmit}
            >
              <Text style={styles.buttonText}>Submit Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Remove the logo container */}
      {unresultedBidsCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unresultedBidsCount}</Text>
        </View>
      )}
    </View> 
  );
}

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Adjust to space between cards
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: Platform.select({
      web: '13%', // 7 cards per row on web
      default: '48%', // 2 cards per row on other platforms
    }),
    marginBottom: 16,
    marginHorizontal: '0.5%',
  },
  productImage: {
    width: '100%',
    height: 140,
    marginBottom: 10, // Add gap between image and name text
  },
  productInfo: {
    alignItems: 'center', // Center elements horizontally inside the product info
    justifyContent: 'center', // Center elements vertically
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4, // Decrease gap between name and price text
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the top
    justifyContent: 'flex-start', // Align items to the left
    marginBottom: 10,
    marginTop: 24, // Adjust margin to move it downwards
  },
  ownerPhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  ownerNickname: {
    fontSize: 16,
    color: '#007AFF',
  },
  bidButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  cancelButton: {
    padding: 10,
    backgroundColor: '#FF6347',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  drawerContainer: {
    maxHeight: 400, // Adjust the height to fit the drawer
  },
  selectedProduct: {
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    padding: 12,
  },
  checkboxContainer: {
    marginTop: 10,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  productStatus: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  productCreatedAt: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  productDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  bidCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    padding: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});