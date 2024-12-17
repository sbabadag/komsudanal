import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { getDatabase, ref, onValue, push, set } from "firebase/database";
import { getAuth } from "firebase/auth";

interface Review {
  id: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
}

const ReviewsScreen = ({ productId }: { productId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const db = getDatabase();
    const reviewsRef = ref(db, `reviews/${productId}`);

    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const reviewsArray: Review[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setReviews(reviewsArray);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleBid = () => {
    Alert.alert("Bid placed!");
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Reviews</Text>
        <View style={styles.reviewsContainer}>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <Text style={styles.username}>{review.username}</Text>
                <Text style={styles.rating}>Rating: {review.rating}/5</Text>
                <Text style={styles.comment}>{review.comment}</Text>
                <Text style={styles.date}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>No reviews yet.</Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.bidButton} onPress={handleBid}>
        <Text style={styles.buttonText}>Place Bid</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  reviewsContainer: {
    maxHeight: 200, // Limit height
    overflow: 'scroll',
  },
  reviewItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
  },
  rating: {
    fontSize: 14,
    color: "#FFD700",
  },
  comment: {
    fontSize: 14,
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  noReviews: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
  },
  bidButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -75 }], // Adjust based on button width
    width: 150,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ReviewsScreen;
