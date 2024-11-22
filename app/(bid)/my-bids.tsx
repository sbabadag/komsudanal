import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { useRouter } from 'expo-router';

interface Bid {
  id: string;
  targetProductId: string;
  offeredProducts: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export default function MyBidsScreen() {
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [products, setProducts] = useState<{[key: string]: any}>({});
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert('Error', 'Please login to view your bids');
      return;
    }

    const db = getDatabase();
    
    // Load all bids
    const bidsRef = ref(db, `userBids/${user.uid}`);
    const productsRef = ref(db, 'products');

    // First load all products for reference
    onValue(productsRef, (snapshot) => {
      const productsData = snapshot.val() || {};
      setProducts(productsData);
    }, (error) => {
      console.error('Error fetching products:', error);
    });

    // Then load bids
    onValue(bidsRef, (snapshot) => {
      const bidsData = snapshot.val();
      if (bidsData) {
        const bidsArray = Object.entries(bidsData).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setMyBids(bidsArray.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        console.log('No bids found');
        setMyBids([]);
      }
    }, (error) => {
      console.error('Error fetching bids:', error);
    });
  }, []); // Empty dependency array to run only once

  const handleCancelBid = async (bidId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      const bidRef = ref(db, `userBids/${user.uid}/${bidId}`);
      
      await remove(bidRef);
      Alert.alert('Success', 'Bid cancelled successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel bid');
    }
  };

  const renderBidStatus = (status: string) => {
    const statusStyles: { [key: string]: any } = {
      pending: { container: styles.statusPending, text: styles.statusPendingText },
      accepted: { container: styles.statusAccepted, text: styles.statusAcceptedText },
      rejected: { container: styles.statusRejected, text: styles.statusRejectedText },
    };

    return (
      <View style={statusStyles[status].container}>
        <Text style={statusStyles[status].text}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  const renderBidItem = (bid: Bid) => {
    const targetProduct = products[bid.targetProductId];
    if (!targetProduct) {
      console.log(`Target product not found for bid ${bid.id}`);
      return null;
    }
  
    const offeredProducts = bid.offeredProducts.map(id => products[id]).filter(Boolean);
  
    return (
      <View key={bid.id} style={styles.bidCard}>
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => router.push({
            pathname: "/(bid)/bid-details",
            params: { id: bid.targetProductId }
          })}
        >
          {targetProduct.images && targetProduct.images.length > 0 ? (
            <Image
              source={{ uri: targetProduct.images[0] }}
              style={styles.mainImage}
            />
          ) : (
            <View style={styles.mainImagePlaceholder}>
              <Text>No Image</Text>
            </View>
          )}
          
          <View style={styles.cardBody}>
            <Text style={styles.productName} numberOfLines={1}>
              {targetProduct.name}
            </Text>
            
            <Text style={styles.priceText}>
              ${targetProduct.priceStart} - ${targetProduct.priceEnd}
            </Text>
  
            <View style={styles.offeredProductsRow}>
              <Text style={styles.offeredLabel}>Offered:</Text>
              <View style={styles.offeredThumbnails}>
                {offeredProducts.slice(0, 3).map(product => (
                  product.images && product.images.length > 0 ? (
                    <Image
                      key={product.id}
                      source={{ uri: product.images[0] }}
                      style={styles.thumbnailImage}
                    />
                  ) : (
                    <View key={product.id} style={styles.thumbnailImagePlaceholder}>
                      <Text>No Image</Text>
                    </View>
                  )
                ))}
                {offeredProducts.length > 3 && (
                  <View style={styles.moreIndicator}>
                    <Text style={styles.moreIndicatorText}>
                      +{offeredProducts.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            </View>
  
            <View style={styles.cardFooter}>
              {renderBidStatus(bid.status)}
              {bid.status === 'pending' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelBid(bid.id)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Bids</Text>

      {myBids.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't made any bids yet</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {myBids.map(bid => renderBidItem(bid))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    padding: 8,
  },
  bidCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  mainImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  mainImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 8,
  },
  offeredProductsRow: {
    marginBottom: 8,
  },
  offeredLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  offeredThumbnails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 4,
  },
  thumbnailImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  moreIndicator: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIndicatorText: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
    padding: 6,
    borderRadius: 4,
  },
  statusPendingText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: '600',
  },
  statusAccepted: {
    backgroundColor: '#E8F5E9',
    padding: 6,
    borderRadius: 4,
  },
  statusAcceptedText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRejected: {
    backgroundColor: '#FFEBEE',
    padding: 6,
    borderRadius: 4,
  },
  statusRejectedText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
