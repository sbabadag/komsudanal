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
} from 'react-native';
import { getDatabase, ref, onValue, push, set, update, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Modal from 'react-native-modal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

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
const isMobile = screenWidth < 768;
const cardWidth = Platform.select({
  web: '13%', // 7 cards per row on web
  default: '48%', // 2 cards per row on other platforms
});
const cardHeight = 300; // Adjust height to fit all items

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  // const router = useRouter();

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

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardsWrapper}>
          {products.map((product, index) => (
            <View
              key={product.id}
              style={[
                styles.card,
                { width: cardWidth === '13%' ? '13%' : '48%' }
              ]}
            >
              <FlatList
                horizontal
                data={product.images}
                renderItem={({ item }) => (
                  <Image
                    source={
                      Platform.OS === 'web'
                        ? { uri: item }
                        : { uri: item }
                    }
                    style={styles.productImage}
                  />
                )}
                keyExtractor={(_, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
                <Text style={styles.productPrice}>
                  ${product.priceStart} - ${product.priceEnd}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bidButton}
                onPress={() => {
                  setTargetProductId(product.id);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.buttonText}>Place a Bid</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal isVisible={isModalVisible}>
        <View style={styles.modal}>
          <MyProductsScreen />
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
    </View>
  );
}

const MyProductsScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

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
    <ScrollView style={styles.container}>
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
              <Text style={styles.productDescription}>{product.description}</Text>
              <Text style={styles.productPrice}>${product.priceStart} - ${product.priceEnd}</Text>
              <Text style={styles.productStatus}>Status: {product.status}</Text>
              <Text style={styles.productCreatedAt}>Created At: {new Date(product.createdAt).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  form: {
    marginBottom: 32,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePicker: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    color: 'white',
    fontWeight: '600',
  },
  imagePreview: {
    marginBottom: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,

  },
  publishButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '48%', // Ensure two cards fit in one row
    marginBottom: 10,
    alignItems: 'center', // Center elements horizontally
    justifyContent: 'center', // Center elements vertically
    height: 300, // Set a fixed height based on the maximum height needed
  },
  cardImage: {
    width: '100%',
    height: 140,
    marginTop: 10, // Add gap to the top of the image
    marginBottom: -100, // Decrease gap between image and name text
  },
  cardContent: {
    padding: 12,
    alignItems: 'center', // Center elements horizontally inside the card content
    justifyContent: 'center', // Center elements vertically

  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4, // Decrease gap between image and name field more
    marginTop: -200, // Remove additional gap to the top of the name field
  },
  productDescription: {
    fontSize: 16,
    marginBottom: 25,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#FFA500',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  productStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  noProductsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
  productCreatedAt: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  // Additional styles from index.tsx
  scrollView: {
    maxHeight: 200,
  },
  selectedProduct: {
    backgroundColor: '#e0e0e0',
  },
  productImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    marginBottom: -1000,
  },
  productInfo: {
    flex: 1,
  },
  checkbox: {
    marginLeft: 10,
  },
  bidButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginTop: -400,
    marginBottom: 10,
  },
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});