import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, push, set, onValue, get } from 'firebase/database';

interface Offer {
  userId: string;
  productId: string;
  offeredProductId: string;
  createdAt: number;
  userFullName: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface BidPackage {
  targetProductId: string;
  offeredProducts: string[];  // Array of product IDs
  status: 'pending' | 'accepted' | 'rejected';
}

export default function BidScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isOffering, setIsOffering] = useState(false);
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [myPublishedProducts, setMyPublishedProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert('Login Required', 'Please login to make a bid');
      router.back();
      return;
    }

    // Load target product
    const db = getDatabase();
    const productRef = ref(db, `products/${params.productId}`);
    
    onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTargetProduct({ id: params.productId, ...data });
      }
    });

    // Load user's published products from main products collection
    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const publishedProducts = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }))
          .filter(product => product.userId === user.uid); // Only user's products
        
        setMyPublishedProducts(publishedProducts);
      }
    });
  }, [params.productId]);

  const handleExchange = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleCreateBid = async () => {
    if (selectedProducts.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Login Required', 'Please login to make a bid');
        return;
      }

      const db = getDatabase();
      const bidsRef = ref(db, `userBids/${user.uid}`);
      const newBidRef = push(bidsRef);
      
      const bidPackage: BidPackage = {
        targetProductId: params.productId as string,
        offeredProducts: selectedProducts,
        status: 'pending'
      };

      await set(newBidRef, bidPackage);
      Alert.alert('Success', 'Bid package created successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create bid package');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Target Product Card */}
        <View style={styles.targetSection}>
          <Text style={styles.sectionTitle}>Product You Want</Text>
          {targetProduct && (
            <View style={styles.targetCard}>
              <Image
                source={{ uri: targetProduct.images[0] }}
                style={styles.targetImage}
              />
              <View style={styles.targetInfo}>
                <Text style={styles.targetName}>{targetProduct.name}</Text>
                <Text style={styles.targetDescription} numberOfLines={2}>
                  {targetProduct.description}
                </Text>
                <Text style={styles.targetPrice}>
                  ${targetProduct.priceStart} - ${targetProduct.priceEnd}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Selected Products for Bid */}
        {selectedProducts.length > 0 && (
          <>
            <View style={styles.divider}>
              <Text style={styles.dividerText}>Selected for Exchange</Text>
            </View>
            <View style={styles.selectedProductsSection}>
              {selectedProducts.map(productId => {
                const product = myPublishedProducts.find(p => p.id === productId);
                return (
                  <View key={productId} style={styles.selectedProductCard}>
                    <Image
                      source={{ uri: product.images[0] }}
                      style={styles.selectedProductImage}
                    />
                    <View style={styles.selectedProductInfo}>
                      <Text style={styles.selectedProductName}>{product.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleExchange(productId)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Available Published Products */}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>Your Published Products</Text>
        </View>
        
        <View style={styles.productsGrid}>
          {myPublishedProducts.length > 0 ? (
            myPublishedProducts.map(product => (
              <View key={product.id} style={styles.productCard}>
                <Image
                  source={{ uri: product.images[0] }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                  <Text style={styles.productPrice}>
                    ${product.priceStart} - ${product.priceEnd}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.exchangeButton,
                      selectedProducts.includes(product.id) && styles.selectedButton
                    ]}
                    onPress={() => handleExchange(product.id)}
                  >
                    <Text style={[
                      styles.exchangeButtonText,
                      selectedProducts.includes(product.id) && styles.selectedButtonText
                    ]}>
                      {selectedProducts.includes(product.id) ? 'Selected' : 'Exchange'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noProductsContainer}>
              <Text style={styles.noProductsText}>
                You don't have any published products yet
              </Text>
              <TouchableOpacity
                style={styles.publishButton}
                onPress={() => router.push('/(tabs)/my-products')}
              >
                <Text style={styles.publishButtonText}>
                  Go to My Products
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Bid Button */}
        {selectedProducts.length > 0 && (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleCreateBid}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Creating Bid...' : 'Submit Exchange Offer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  targetSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  targetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  targetImage: {
    width: '100%',
    height: 200,
  },
  targetInfo: {
    padding: 16,
  },
  targetName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  targetDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  targetPrice: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedProductsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  selectedProductCard: {
    width: '46%',  // 2 cards per row with spacing
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedProductImage: {
    width: '100%',
    height: 120,
  },
  selectedProductInfo: {
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  removeButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  productCard: {
    width: '46%',  // 2 cards per row with spacing
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productInfo: {
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exchangeButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  exchangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedButtonText: {
    color: 'white',
  },
  noProductsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
