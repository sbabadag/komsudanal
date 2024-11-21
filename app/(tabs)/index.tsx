import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { getDatabase, ref, onValue, get, push, set } from 'firebase/database';
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
  status: 'draft' | 'published';
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const windowWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';
  const router = useRouter();
  const [userProducts, setUserProducts] = useState<Product[]>([]);

  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, 'products');
    const auth = getAuth();
    const user = auth.currentUser;
    
    console.log('Current user:', user?.uid);
    
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('All products data:', data);
      
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]: [string, any]) => ({
          id,
          ...product,
        }))
        // Filter out the current user's products
        .filter(product => {
          if (!user) return true; // If no user is logged in, show all products
          return product.userId !== user.uid; // Only show products that don't belong to current user
        });
        
        console.log('Products array:', productsArray);
        
        setAllProducts(productsArray);
        setProducts(productsArray);
      }
    });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setProducts(allProducts);
      return;
    }

    const filteredProducts = allProducts.filter(product => {
      const searchLower = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    });
    setProducts(filteredProducts);
  }, [searchQuery, allProducts]);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user && products.length > 0) {
      // Filter products owned by the current user
      const userOwnedProducts = products.filter(product => product.userId === user.uid);
      setUserProducts(userOwnedProducts);
    }
  }, [products]); // Depend on products array changes

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const productsRef = ref(db, 'products');
    
    console.log('Main Page - Current User ID:', user.uid); // Debug log
    
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userProductsArray = Object.entries(data)
          .map(([id, product]: [string, any]) => ({
            id,
            ...product,
          }))
          .filter(product => {
            console.log('Product userId:', product.userId); // Debug log
            console.log('Current userId:', user.uid); // Debug log
            console.log('Match?:', product.userId === user.uid); // Debug log
            return product.userId === user.uid;
          });
        
        console.log('Main Page - User Products:', userProductsArray); // Debug log
        setUserProducts(userProductsArray);
      }
    });
  }, []);

  const handleBid = async (productId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert('Error', 'Please login to place a bid');
      return;
    }

    console.log('Bid Handler - Current User ID:', user.uid); // Debug log
    console.log('Bid Handler - User Products:', userProducts); // Debug log

    console.log('Current user ID:', user.uid);
    console.log('All Products:', allProducts);

    // Query the database directly to check for user's products
    const db = getDatabase();
    const productsRef = ref(db, 'products');
    
    get(productsRef).then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userProducts = Object.entries(data)
          .map(([id, product]: [string, any]) => ({
            id,
            ...product,
          }))
          .filter(product => product.userId === user.uid);

        console.log('User products found:', userProducts);

        if (userProducts.length === 0) {
          Alert.alert('Error', 'You need to add products first before placing a bid');
          return;
        }

        // If we get here, user has products
        setTargetProductId(productId);
        setModalVisible(true);
      }
    }).catch((error) => {
      console.error('Error checking products:', error);
      Alert.alert('Error', 'Failed to check products');
    });
  };

  const submitBid = async () => {
    if (!selectedProducts.length) {
      Alert.alert('Error', 'Please select at least one product to offer');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !targetProductId) return;

      const db = getDatabase();
      const newBidRef = ref(db, `userBids/${user.uid}`);
      
      await push(newBidRef, {
        targetProductId,
        offeredProducts: selectedProducts,
        status: 'pending',
        createdAt: Date.now()
      });

      setModalVisible(false);
      setSelectedProducts([]);
      setTargetProductId(null);
      Alert.alert('Success', 'Bid placed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to place bid');
      console.error(error);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {products.map((product) => (
          <View
            key={product.id}
            style={[
              styles.card,
              Platform.select({
                web: {
                  width: '13.5%',
                  margin: '0.35%',
                },
                default: {
                  width: '46%',
                  marginHorizontal: '2%',
                  marginBottom: 16,
                }
              })
            ]}
          >
            <Image
              source={{ uri: product.images?.[0] }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.cardContent}>
              <Text style={styles.title} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {product.description}
              </Text>
              <Text style={styles.priceRange}>
                ${(product.priceStart || 0).toLocaleString()} - ${(product.priceEnd || 0).toLocaleString()}
              </Text>
              <TouchableOpacity 
                style={styles.bidButton}
                onPress={() => handleBid(product.id)}
              >
                <Text style={styles.bidButtonText}>Place Bid</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Products to Offer</Text>
          <ScrollView style={styles.productList}>
            {userProducts.length > 0 ? (
              userProducts.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.selectableProduct,
                    selectedProducts.includes(product.id) && styles.selectedProduct
                  ]}
                  onPress={() => toggleProductSelection(product.id)}
                >
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={styles.checkbox}>
                    {selectedProducts.includes(product.id) && (
                      <Ionicons name="checkmark" size={24} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noProductsText}>No products available to offer</Text>
            )}
          </ScrollView>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedProducts([]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitBid}
              disabled={selectedProducts.length === 0}
            >
              <Text style={styles.submitButtonText}>Submit Bid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: Platform.OS === 'web' ? 120 : 160,
  },
  cardContent: {
    padding: Platform.OS === 'web' ? 8 : 12,
    height: Platform.OS === 'web' ? 140 : 160,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    flex: 1,
  },
  priceRange: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 8,
  },
  bidButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 'auto',
  },
  bidButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  productList: {
    maxHeight: 400,
  },
  selectableProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedProduct: {
    backgroundColor: '#f0f0f0',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  productName: {
    flex: 1,
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  submitButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noProductsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
});
