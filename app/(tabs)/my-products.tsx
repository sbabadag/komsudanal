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
} from 'react-native';
import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';

interface DraftProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  priceStart: number;
  priceEnd: number;
  isPublished?: boolean;
}

export default function MyProductsScreen() {
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([]);
  const [newProduct, setNewProduct] = useState<DraftProduct>({
    id: Date.now().toString(),
    name: '',
    description: '',
    images: [],
    priceStart: 0,
    priceEnd: 0,
  });
  const [editingProduct, setEditingProduct] = useState<DraftProduct | null>(null);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const auth = getAuth();
    
    // Add auth state listener
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed. User:', user?.uid);
      
      if (!user) {
        console.log('No user logged in');
        setDraftProducts([]);
        return;
      }

      const db = getDatabase();
      const draftsRef = ref(db, `userDrafts/${user.uid}`);
      
      const unsubscribeDB = onValue(draftsRef, (snapshot) => {
        const data = snapshot.val();
        console.log('Loaded drafts data:', data);
        
        if (data) {
          const draftsArray = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }));
          console.log('Processed drafts array:', draftsArray);
          setDraftProducts(draftsArray);
        } else {
          console.log('No drafts found');
          setDraftProducts([]);
        }
      }, (error) => {
        console.error('Error loading drafts:', error);
      });

      // Cleanup database listener when auth state changes
      return () => unsubscribeDB();
    });

    // Cleanup auth listener on unmount
    return () => unsubscribeAuth();
  }, []); // Empty dependency array to run only once on mount

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, `data:image/jpeg;base64,${result.assets[0].base64}`]
      }));
    }
  };

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
      const draftsRef = ref(db, `userDrafts/${user.uid}`);
      const newDraftRef = push(draftsRef);
      
      const draftData = {
        name: newProduct.name,
        description: newProduct.description,
        images: newProduct.images,
        priceStart: newProduct.priceStart,
        priceEnd: newProduct.priceEnd,
        createdAt: Date.now(),
      };

      await set(newDraftRef, draftData);

      // Update local state with new draft
      setDraftProducts(prev => [...prev, {
        id: newDraftRef.key || Date.now().toString(),
        ...draftData
      }]);

      // Reset form
      setNewProduct({
        id: Date.now().toString(),
        name: '',
        description: '',
        images: [],
        priceStart: 0,
        priceEnd: 0,
      });

      Alert.alert('Success', 'Product saved to drafts');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft product');
    }
  };

  const publishProduct = async (product: DraftProduct) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const db = getDatabase();
      const productsRef = ref(db, 'products');
      const newProductRef = push(productsRef);
      
      await set(newProductRef, {
        name: product.name,
        description: product.description,
        images: product.images,
        priceStart: product.priceStart,
        priceEnd: product.priceEnd,
        userId: user.uid,
        createdAt: Date.now(),
      });

      // Remove from draft products in database
      const draftRef = ref(db, `userDrafts/${user.uid}/${product.id}`);
      await remove(draftRef);

      Alert.alert('Success', 'Product published successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to publish product');
    }
  };

  const handleEdit = async (product: DraftProduct) => {
    if (!editingProduct) {
      // Start editing
      setEditingProduct(product);
    } else {
      // Save changes
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getDatabase();
        const draftRef = ref(db, `userDrafts/${user.uid}/${editingProduct.id}`);
        
        await set(draftRef, {
          ...editingProduct,
          updatedAt: Date.now(),
        });

        setEditingProduct(null);
        Alert.alert('Success', 'Draft updated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to update draft');
      }
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      const draftRef = ref(db, `userDrafts/${user.uid}/${editingProduct.id}`);
      
      await set(draftRef, {
        ...editingProduct,
        updatedAt: Date.now(),
      });
      
      setEditingProduct(null);
      Alert.alert('Success', 'Draft updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update draft');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.addProductSection}>
        <Text style={styles.sectionTitle}>Add New Product</Text>
        
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
          <Text style={styles.addButtonText}>Add to Drafts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.draftsSection}>
        <Text style={styles.sectionTitle}>My Draft Products</Text>
        
        <View style={[
          styles.gridContainer,
          { gap: 16 }
        ]}>
          {draftProducts.map((product) => (
            <View
              key={product.id}
              style={[
                styles.card,
                {
                  width: isWeb 
                    ? `${100/7}%` // 7 columns for web
                    : `${100/3}%` // 3 columns for mobile
                }
              ]}
            >
              <Image
                source={{ uri: product.images[0] }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                {editingProduct?.id === product.id ? (
                  // Edit mode
                  <>
                    <TextInput
                      style={[styles.input, styles.editInput]}
                      value={editingProduct.name}
                      onChangeText={(text) => setEditingProduct(prev => ({ ...prev!, name: text }))}
                    />
                    <TextInput
                      style={[styles.input, styles.editInput]}
                      value={editingProduct.description}
                      multiline
                      numberOfLines={2}
                      onChangeText={(text) => setEditingProduct(prev => ({ ...prev!, description: text }))}
                    />
                    <View style={styles.priceContainer}>
                      <TextInput
                        style={[styles.input, styles.priceInput]}
                        value={editingProduct.priceStart.toString()}
                        keyboardType="numeric"
                        placeholder="Min"
                        onChangeText={(text) => setEditingProduct(prev => ({ 
                          ...prev!, 
                          priceStart: parseFloat(text) || 0 
                        }))}
                      />
                      <TextInput
                        style={[styles.input, styles.priceInput]}
                        value={editingProduct.priceEnd.toString()}
                        keyboardType="numeric"
                        placeholder="Max"
                        onChangeText={(text) => setEditingProduct(prev => ({ 
                          ...prev!, 
                          priceEnd: parseFloat(text) || 0 
                        }))}
                      />
                    </View>
                  </>
                ) : (
                  // View mode
                  <>
                    <Text style={styles.title} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.description} numberOfLines={2}>
                      {product.description}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceRange}>
                        ${product.priceStart.toLocaleString()} - ${product.priceEnd.toLocaleString()}
                      </Text>
                    </View>
                  </>
                )}
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.editButton]}
                    onPress={() => handleEdit(product)}
                  >
                    <Text style={styles.buttonText}>
                      {editingProduct?.id === product.id ? 'Save' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.publishButton]}
                    onPress={() => publishProduct(product)}
                  >
                    <Text style={styles.publishButtonText}>Publish</Text>
                  </TouchableOpacity>
                </View>
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
  sectionTitle: {
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
  draftsSection: {
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
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
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  publishButton: {
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  publishButtonText: {
    color: 'white',
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
    marginHorizontal: 4,
    height: 32,
    padding: 4,
    fontSize: 11,
    minWidth: 50,
  },
  editInput: {
    height: 100,
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
});