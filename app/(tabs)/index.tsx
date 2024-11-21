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
} from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';

// Define the Product type
interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  priceStart: number;
  priceEnd: number;
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const windowWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, 'products');
    
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]: [string, any]) => ({
          id,
          ...product,
        }));
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={[
        styles.gridContainer,
        { gap: 16 }
      ]}>
        {products.map((product) => (
          <View
            key={product.id}
            style={[
              styles.card,
              {
                width: isWeb 
                  ? `${(100/7)}%` // 7 columns for web
                  : `${(100/3)}%` // 3 columns for mobile
              }
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
                onPress={() => {/* Handle bid */}}
              >
                <Text style={styles.bidButtonText}>Bid Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
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
    padding: 16,
    justifyContent: 'center',
    gap: 16,
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
    margin: 0,
  },
  image: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 12,
    height: 160,
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
});
