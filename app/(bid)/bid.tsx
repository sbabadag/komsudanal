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
}

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;
const cardWidth = isMobile ? screenWidth / 2 - 20 : screenWidth / 7 - 20;

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
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

  useEffect(() => {
    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const bidsRef = ref(db, 'bids');

    const unsubscribe = onValue(bidsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userBids = Object.values(data).filter((bid) => {
          const bidData = bid as Bid;
          return bidData.userId === user.uid;
        }) as Bid[];
        setBids(userBids);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBidSubmit = async (productId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log('Selected products:', selectedProducts);
    if (!user || selectedProducts.length === 0) {
      Alert.alert('Error', 'Please offer at least one product.');
      return;
    }

    const targetProduct = products.find(product => product.id === productId);
    if (!targetProduct) {
      console.error('Target product not found for bid', productId);
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
      targetProductId: productId,
      offeredProducts: selectedProducts,
      status: 'pending',
      createdAt: Date.now(),
      userId: user.uid,
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
      <ScrollView contentContainerStyle={viewStyles.container}>
        {/* Add your content here */}
      </ScrollView>
      {bids.map((bid) => {
        const targetProduct = products.find(product => product.id === bid.targetProductId);
        const offeredProducts = userProducts.filter(product => bid.offeredProducts.includes(product.id));
        return (
          <View key={bid.id} style={[viewStyles.card, { width: cardWidth }]}>
            <Text style={textStyles.bidStatus}>Status: {bid.status}</Text>
            <Text style={textStyles.bidDate}>Date: {new Date(bid.createdAt).toLocaleDateString()}</Text>
            {targetProduct && (
              <View style={viewStyles.productCard}>
                <Text style={textStyles.sectionTitle}>Target Product</Text>
                <Image source={{ uri: targetProduct.images[0] }} style={imageStyles.productImage} />
                <View style={viewStyles.productInfo}>
                  <Text style={textStyles.productName}>{targetProduct.name}</Text>
                  <Text style={textStyles.productDescription}>{targetProduct.description}</Text>
                  <Text style={textStyles.productPrice}>
                    ${targetProduct.priceStart} - ${targetProduct.priceEnd}
                  </Text>
                </View>
              </View>
            )}
            {offeredProducts.length > 0 && (
              <View style={viewStyles.productCard}>
                <Text style={textStyles.sectionTitle}>Offered Products</Text>
                {offeredProducts.map(product => (
                  <View key={product.id} style={viewStyles.productCard}>
                    <Image source={{ uri: product.images[0] }} style={imageStyles.productImage} />
                    <View style={viewStyles.productInfo}>
                      <Text style={textStyles.productName}>{product.name}</Text>
                      <Text style={textStyles.productDescription}>{product.description}</Text>
                      <Text style={textStyles.productPrice}>
                        ${product.priceStart} - ${product.priceEnd}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={viewStyles.viewDetailsButton}
              onPress={() => router.push(`/bid-details?bidId=${bid.id}`)}
            >
              <Text style={textStyles.buttonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <ScrollView contentContainerStyle={viewStyles.container}>
        {products.map((product) => (
          <View key={product.id} style={[viewStyles.card, { width: cardWidth }]}>
            <FlatList
              horizontal
              data={product.images}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={imageStyles.productImage} />
              )}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
            />
            <View style={viewStyles.productInfo}>
              <Text style={textStyles.productName}>{product.name}</Text>
              <Text style={textStyles.productDescription}>{product.description}</Text>
              <Text style={textStyles.productPrice}>
                ${product.priceStart} - ${product.priceEnd}
              </Text>
            </View>
            <TouchableOpacity
              style={viewStyles.bidButton}
              onPress={() => {
                setTargetProductId(product.id);
                setModalVisible(true);
              }}
            >
              <Text style={textStyles.bidButtonText}>Place a Bid</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <Modal isVisible={isModalVisible}>
        <View style={viewStyles.modalContent}>
          <Text style={textStyles.modalTitle}>Select Products to Offer</Text>
          <ScrollView>
            {userProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  viewStyles.selectableProduct,
                  selectedProducts.includes(product.id) && viewStyles.selectedProduct
                ]}
                onPress={() => {
                  setSelectedProducts(prev => 
                    prev.includes(product.id)
                      ? prev.filter(id => id !== product.id)
                      : [...prev, product.id]
                  );
                  console.log('Updated selected products:', selectedProducts);
                }}
              >
                <Image
                  source={{ uri: product.images[0] }}
                  style={imageStyles.productImage}
                />
                <View style={viewStyles.productInfo}>
                  <Text style={textStyles.productName}>{product.name}</Text>
                  <Text style={textStyles.productPrice}>
                    ${product.priceStart} - ${product.priceEnd}
                  </Text>
                </View>
                <View style={viewStyles.checkbox}>
                  {selectedProducts.includes(product.id) && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={viewStyles.modalButtons}>
            <TouchableOpacity
              style={viewStyles.modalButton}
              onPress={() => handleBidSubmit(targetProductId!)}
            >
              <Text style={textStyles.modalButtonText}>Submit Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={viewStyles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={textStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const viewStyles = StyleSheet.create({
  productInfo: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  productCard: {
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
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
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
  viewDetailsButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
});

const textStyles = StyleSheet.create({
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
  bidStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bidDate: {
    fontSize: 14,
    color: '#888',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

const imageStyles = StyleSheet.create({
  productImage: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
});
