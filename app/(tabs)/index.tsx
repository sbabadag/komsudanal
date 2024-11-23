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
import { getDatabase, ref, onValue, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Modal from 'react-native-modal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

// Define the Product type
interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  priceStart: number;
  priceEnd: number;
  userId: string;
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
const cardWidth = isMobile ? screenWidth / 2 - 20 : screenWidth / 3 - 20;

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

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
          {products.map((product) => (
            <View key={product.id} style={[styles.card, { width: cardWidth }]}>
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
                keyExtractor={(item, index) => index.toString()}
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
                <Text style={styles.bidButtonText}>Place a Bid</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Products to Offer</Text>
          <ScrollView style={styles.modalScrollView}>
            {userProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.selectableProduct,
                  selectedProducts.includes(product.id) && styles.selectedProduct
                ]}
                onPress={() => {
                  setSelectedProducts(prev => {
                    const updatedSelectedProducts = prev.includes(product.id)
                      ? prev.filter(id => id !== product.id)
                      : [...prev, product.id];
                    console.log('Updated selected products:', updatedSelectedProducts);
                    return updatedSelectedProducts;
                  });
                }}
              >
                <Image
                  source={
                    { uri: product.images[0] }
                  }
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>
                    ${product.priceStart} - ${product.priceEnd}
                  </Text>
                </View>
                <View style={styles.checkbox}>
                  {selectedProducts.includes(product.id) && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleBidSubmit}
            >
              <Text style={styles.modalButtonText}>Submit Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  selectableProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    margin: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  selectedProduct: {
    backgroundColor: '#e0e0e0',
  },
  productImage: {
    width: 100,
    height: 100,
    marginRight: 10,
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
  checkbox: {
    marginLeft: 10,
  },
  bidButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalScrollView: {
    maxHeight: 300, // Limit the height of the scroll view
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});