import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
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
  status: 'draft' | 'published';
}

export default function MyProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    images: [] as string[],
    priceStart: 0,
    priceEnd: 0,
    status: 'published' as 'draft' | 'published',
  });

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
      console.log('Fetched products:', productsArray);
      setProducts(productsArray);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (uri) {
        setPublishing(true);
        try {
          setNewProduct((prev) => ({
            ...prev,
            images: [...prev.images, uri],
          }));
        } catch (error) {
          console.error('Error handling image:', error);
          Alert.alert('Error', 'Failed to add image');
        } finally {
          setPublishing(false);
        }
      }
    }
  };

  const handlePublish = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    if (!newProduct.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }

    if (!newProduct.description.trim()) {
      Alert.alert('Error', 'Product description is required');
      return;
    }

    if (newProduct.priceStart <= 0 || newProduct.priceEnd <= 0) {
      Alert.alert('Error', 'Product price must be greater than zero');
      return;
    }

    if (newProduct.priceStart > newProduct.priceEnd) {
      Alert.alert('Error', 'Starting price cannot be greater than ending price');
      return;
    }

    setPublishing(true);
    try {
      const db = getDatabase();
      const productsRef = ref(db, `products/${user.uid}`);
      const newProductRef = push(productsRef);
      
      await set(newProductRef, {
        ...newProduct,
        id: newProductRef.key,
        userId: user.uid,
        status: 'published', // Make sure status is set
        createdAt: Date.now(),
      });

      console.log('Published product:', {
        ...newProduct,
        id: newProductRef.key,
        userId: user.uid,
      });

      setNewProduct({
        name: '',
        description: '',
        images: [],
        priceStart: 0,
        priceEnd: 0,
        status: 'published',
      });
      Alert.alert('Success', 'Product published successfully');
    } catch (error) {
      console.error('Error publishing product:', error);
      Alert.alert('Error', 'Failed to publish product');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              const productRef = ref(db, `products/${user.uid}/${productId}`);
              await remove(productRef);
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Products</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Product Name"
          value={newProduct.name}
          onChangeText={(text) => setNewProduct((prev) => ({ ...prev, name: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          multiline
          numberOfLines={3}
          value={newProduct.description}
          onChangeText={(text) => setNewProduct((prev) => ({ ...prev, description: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Price Start"
          keyboardType="numeric"
          value={newProduct.priceStart.toString()}
          onChangeText={(text) => setNewProduct((prev) => ({ ...prev, priceStart: parseFloat(text) || 0 }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Price End"
          keyboardType="numeric"
          value={newProduct.priceEnd.toString()}
          onChangeText={(text) => setNewProduct((prev) => ({ ...prev, priceEnd: parseFloat(text) || 0 }))}
        />
        <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
          <Text style={styles.imagePickerText}>Pick an Image</Text>
        </TouchableOpacity>
        <ScrollView horizontal style={styles.imagePreview}>
          {newProduct.images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.image} />
          ))}
        </ScrollView>
        <TouchableOpacity
          style={[styles.publishButton, publishing && styles.disabledButton]}
          onPress={handlePublish}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        {products.length > 0 ? (
          products.map((product) => (
            <View
              key={product.id}
              style={[
                styles.card,
                Platform.select({
                  web: { width: '23%', margin: '1%' },
                  default: { width: '46%', marginHorizontal: '2%', marginBottom: 16 }
                })
              ]}
            >
              <Image
                source={{ uri: product.images?.[0] || 'https://via.placeholder.com/150' }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                  {product.description}
                </Text>
                <Text style={styles.productPrice}>
                  ${product.priceStart.toLocaleString()} - ${product.priceEnd.toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduct(product.id)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noProductsText}>No products available</Text>
        )}
      </View>
    </ScrollView>
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
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
  },
  cardImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 120 : 160,
  },
  cardContent: {
    padding: Platform.OS === 'web' ? 8 : 12,
    height: Platform.OS === 'web' ? 140 : 160,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 12,
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
});