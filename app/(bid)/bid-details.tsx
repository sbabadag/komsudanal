import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, get } from 'firebase/database';

interface BidEvent {
  action: string;
  timestamp: number;
}

interface Bid {
  targetProductId: string;
  targetProductOwnerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  history?: BidEvent[];
}

// Define a type for the possible status keys
type StatusStyleKeys = 'statuspending' | 'statusaccepted' | 'statusrejected' | 'statusunknown';

export default function BidDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [bid, setBid] = useState<Bid | null>(null);
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [offeredProducts, setOfferedProducts] = useState<any[]>([]);
  const [owner, setOwner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBidDetails = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Error', 'Please login to view bid details');
          router.back();
          return;
        }

        const db = getDatabase();
        const bidRef = ref(db, `userBids/${params.userId}/${params.bidId}`);
        
        // Get initial bid data
        const bidSnapshot = await get(bidRef);
        const bidData = bidSnapshot.val();
        
        if (!bidData) {
          Alert.alert('Error', 'Bid not found');
          router.back();
          return;
        }

        setBid(bidData);

        // Load target product
        const productRef = ref(db, `products/${bidData.targetProductId}`);
        const productSnapshot = await get(productRef);
        const productData = productSnapshot.val();
        if (productData) {
          setTargetProduct(productData);
        }

        // Load offered products
        if (bidData.offeredProducts) {
          const offeredProductsData = await Promise.all(
            bidData.offeredProducts.map(async (productId: string) => {
              const offeredProductRef = ref(db, `products/${productId}`);
              const snapshot = await get(offeredProductRef);
              return { id: productId, ...snapshot.val() };
            })
          );
          setOfferedProducts(offeredProductsData.filter(Boolean));
        }

        // Load product owner details
        if (bidData.targetProductOwnerId) {
          const ownerRef = ref(db, `users/${bidData.targetProductOwnerId}/profile`);
          const ownerSnapshot = await get(ownerRef);
          const ownerData = ownerSnapshot.val();
          if (ownerData) {
            setOwner({ userId: bidData.targetProductOwnerId, ...ownerData });
          }
        }
      } catch (error) {
        console.error('Error loading bid details:', error);
        Alert.alert('Error', 'Failed to load bid details');
      } finally {
        setIsLoading(false);
      }
    };

    loadBidDetails();

    // Set up real-time updates for bid status
    const db = getDatabase();
    const bidRef = ref(db, `userBids/${params.userId}/${params.bidId}`);
    const unsubscribe = onValue(bidRef, (snapshot) => {
      const bidData = snapshot.val();
      if (bidData) {
        setBid(bidData);
      }
    });

    return () => unsubscribe();
  }, [params.bidId, params.userId]);

  const handleChat = () => {
    if (owner?.userId) {
      router.push({
        pathname: "/chat",
        params: { userId: owner.userId }
      });
    } else {
      Alert.alert('Error', 'Cannot start chat at this time');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading bid details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Bid Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Bid Status</Text>
          <View style={[
            styles.statusBadge,
            styles[(bid?.status ? `status${bid.status.toLowerCase()}` : 'statusunknown') as StatusStyleKeys]
          ]}>
            <Text style={styles.statusText}>{bid?.status || 'Unknown'}</Text>
          </View>
        </View>

        {/* Target Product */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product You Want</Text>
          {targetProduct && (
            <View style={styles.productCard}>
              <Image 
                source={{ uri: targetProduct.images[0] }} 
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{targetProduct.name}</Text>
                <Text style={styles.productDescription}>{targetProduct.description}</Text>
                <Text style={styles.productPrice}>
                  ${targetProduct.priceStart} - ${targetProduct.priceEnd}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Your Offer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Offer</Text>
          <View style={styles.cardsWrapper}>
            {offeredProducts.map(product => (
              <View key={product.id} style={styles.productCard}>
                <Image 
                  source={{ uri: product.images[0] }} 
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDescription}>{product.description}</Text>
                  <Text style={styles.productPrice}>
                    ${product.priceStart} - ${product.priceEnd}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Owner Info and Chat */}
        {owner && (
          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>Product Owner</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{owner.fullName}</Text>
                <Text style={styles.ownerLocation}>{owner.location}</Text>
              </View>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={handleChat}
              >
                <Text style={styles.chatButtonText}>Chat with Owner</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bid History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Bid History</Text>
          <View style={styles.timeline}>
            {bid?.history?.map((event: any, index: number) => (
              <View key={index} style={styles.timelineEvent}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineText}>{event.action}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(event.timestamp).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 10,
    width: Platform.OS === 'web' ? '13%' : '46%',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
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
    color: 'gray',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ownerSection: {
    marginBottom: 16,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ownerLocation: {
    fontSize: 14,
    color: 'gray',
  },
  chatButton: {
    padding: 8,
    backgroundColor: '#007bff',
    borderRadius: 4,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  historySection: {
    marginBottom: 16,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  timelineEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'gray',
    marginRight: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
  },
  timelineDate: {
    fontSize: 12,
    color: 'gray',
  },
  statuspending: {
    backgroundColor: '#FFF3CD',
  },
  statusaccepted: {
    backgroundColor: '#D4EDDA',
  },
  statusrejected: {
    backgroundColor: '#F8D7DA',
  },
  statusunknown: {
    backgroundColor: '#E2E3E5',
  },
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});