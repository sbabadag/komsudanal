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
} from 'react-native';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Ionicons from '@expo/vector-icons/Ionicons';

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

export default function BidScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, 'products');

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
  }, [user]); // Empty dependency array to run only once

  const handleBidSubmit = async () => {
    if (!user || !targetProductId || selectedProducts.length === 0) {
      Alert.alert('Error', 'Please select a product to bid on and offer at least one product.');
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
    };

    try {
      await set(newBidRef, newBid);
      Alert.alert('Success', 'Your bid has been submitted.');
      setSelectedProducts([]);
      setTargetProductId(null);
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
      <ScrollView>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[
              styles.selectableProduct,
              selectedProducts.includes(product.id) && styles.selectedProduct
            ]}
            onPress={() => {
              setSelectedProducts(prev => 
                prev.includes(product.id)
                  ? prev.filter(id => id !== product.id)
                  : [...prev, product.id]
              );
            }}
          >
            <Image
              source={{ uri: product.images[0] }}
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
      <TouchableOpacity
        style={styles.bidButton}
        onPress={() => setTargetProductId('some-product-id')} // Replace with actual product selection logic
      >
        <Text style={styles.bidButtonText}>Select Product to Bid On</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.publishButton}
        onPress={handleBidSubmit}
      >
        <Text style={styles.publishButtonText}>Submit Bid</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 50,
    height: 50,
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 14,
    color: '#888',
  },
  checkbox: {
    marginLeft: 10,
  },
  bidButton: {
    padding: 15,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  publishButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  publishButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
