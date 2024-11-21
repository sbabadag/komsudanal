import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  GestureResponderEvent,
} from 'react-native';
import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  priceStart: number;
  priceEnd: number;
  userId: string;
}

export default function MyProductsScreen() {
  const [newProduct, setNewProduct] = useState<Product>({
    id: Date.now().toString(),
    name: '',
    description: '',
    images: [],
    priceStart: 0,
    priceEnd: 0,
    userId: ''
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [myProducts, setMyProducts] = useState<Product[]>([]);

  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, 'products');
    const auth = getAuth();
    const user = auth.currentUser;
    
    console.log('MyProducts - Current user:', user?.uid); // Debug log
    
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('MyProducts - All data:', data); // Debug log
      
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]: [string, any]) => ({
          id,
          ...product,
        }));
        
        console.log('MyProducts - Before filter:', productsArray); // Debug log
        
        const userProducts = productsArray.filter(product => {
          console.log('Comparing:', {
            productUserId: product.userId,
            currentUserId: user?.uid,
            isMatch: product.userId === user?.uid
          });
          return product.userId === user?.uid;
        });
        
        console.log('MyProducts - After filter:', userProducts); // Debug log
        setMyProducts(userProducts);
      }
    });
  }, []);

  const addNewProduct = async () => {
    if (!newProduct.name || !newProduct.description || newProduct.images.length === 0 || 
        newProduct.priceStart < 0 || newProduct.priceEnd < newProduct.priceStart) {
      Alert.alert('Error', 'Please fill all fields correctly and add at least one image');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    try {
      const db = getDatabase();
      const productsRef = ref(db, 'products');
      const newProductRef = push(productsRef);
      
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        images: newProduct.images,
        priceStart: newProduct.priceStart,
        priceEnd: newProduct.priceEnd,
        userId: user.uid,
        createdAt: Date.now(),
      };

      console.log('Publishing product with data:', productData); // Debug log
      
      await set(newProductRef, productData);

      // Reset form
      setNewProduct({
        id: Date.now().toString(),
        name: '',
        description: '',
        images: [],
        priceStart: 0,
        priceEnd: 0,
        userId: ''
      });

      Alert.alert('Success', 'Product published successfully');
    } catch (error) {
      console.error('Error publishing product:', error); // Debug error
      Alert.alert('Error', 'Failed to publish product');
    }
  };

  const handleEdit = async (product: Product) => {
    if (!editingProduct) {
      // Start editing
      setEditingProduct(product);
    } else {
      // Save changes
      if (isSaving) return;
      
      try {
        setIsSaving(true);
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getDatabase();
        const productRef = ref(db, `products/${editingProduct.id}`);
        
        await set(productRef, {
          ...editingProduct,
          updatedAt: Date.now(),
        });

        setEditingProduct(null);
        Alert.alert('Success', 'Product updated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to update product');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      // Pick the image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // Update the product images array with the new image URI
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, result.assets[0].uri]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.addProductSection}>
        <Text style={styles.formSectionTitle}>Add New Product</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Product Name"
          value={newProduct.name}
          onChangeText={(text) => setNewProduct(prev => ({ ...prev, name: text }))}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Product Description"
          multiline
          numberOfLines={4}
          value={newProduct.description}
          onChangeText={(text) => setNewProduct(prev => ({ ...prev, description: text }))}
        />

        <View style={styles.priceContainer}>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Min Price"
            value={newProduct.priceStart.toString()}
            keyboardType="numeric"
            onChangeText={(text) => setNewProduct(prev => ({ 
              ...prev, 
              priceStart: parseFloat(text) || 0 
            }))}
          />
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Max Price"
            value={newProduct.priceEnd.toString()}
            keyboardType="numeric"
            onChangeText={(text) => setNewProduct(prev => ({ 
              ...prev, 
              priceEnd: parseFloat(text) || 0 
            }))}
          />
        </View>

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Add Image</Text>
        </TouchableOpacity>

        {newProduct.images.length > 0 && (
          <ScrollView horizontal style={styles.imagePreviewContainer}>
            {newProduct.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.imagePreview}
              />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.addButton} onPress={addNewProduct}>
          <Text style={styles.addButtonText}>Publish Product</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>My Published Products</Text>
        <View style={styles.productGrid}>
          {myProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              {product.images && product.images.length > 0 && (
                <Image
                  source={{ uri: product.images[0] }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                  {product.description}
                </Text>
                <Text style={styles.productPrice}>
                  ${product.priceStart} - ${product.priceEnd}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addProductSection: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  productsSection: {
    padding: Platform.OS === 'web' ? 8 : 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  productCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    marginHorizontal: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  editDescription: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#FF9500',
  },
  priceRange: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  editingCardContent: {
    height: 'auto',  // Allow content to expand when editing
    paddingBottom: 16,
  },
  editingContainer: {
    flex: 1,
    gap: 8,
  },
});