import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  TextInput,
  AppState,
} from "react-native";
import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  get,
  remove,
} from "firebase/database";
import { getAuth } from "firebase/auth";
import Modal from "react-native-modal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Checkbox } from "react-native-paper";
import { FontAwesome, FontAwesome6, FontAwesome5 } from "@expo/vector-icons";
import SelectCategoriesScreen from "../SelectCategoriesScreen";
import Icon from "react-native-vector-icons/FontAwesome"; // Add this import
import ImagePicker from "expo-image-picker"; // Import ImagePicker if used
import ReviewsScreen from "./reviews"; // Import ReviewsScreen

// Move categoryIcons definition to the top level, before any components
const categoryIcons: { [key: string]: string } = {
  Any: "th-large",
  Electronics: "tv",
  Furniture: "home",
  Clothing: "tshirt",
  Books: "book",
  Toys: "puzzle-piece",
  "Home Appliances": "blender",
  Garden: "tree",
  Sports: "futbol-o",
  Beauty: "heartbeat",
  Automotive: "car",
  Health: "medkit",
  Music: "music",
  Movies: "film",
  Games: "gamepad",
  Jewelry: "diamond",
  "Pet Supplies": "paw",
  "Office Supplies": "pencil",
  "Baby Products": "child",
  Groceries: "shopping-cart",
  Art: "paint-brush",
  Tools: "wrench",
  Software: "desktop",
  Photography: "camera",
  Wearables: "watch",
  Accessories: "tags",
};

// Define the Product type
interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  priceStart: number;
  priceEnd: number;
  userId: string;
  status: "draft" | "published";
  createdAt: number;
  categories: string[]; // Use categories as an array
}

interface Bid {
  id: string;
  targetProductId: string;
  offeredProducts: string[];
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
  userId: string;
  targetProductOwnerId: string; // Add target product owner ID
}

// Define Review interface if not already defined
interface Review {
  id: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
}

const screenWidth = Dimensions.get("window").width;
const cardWidth = Platform.select({
  web: "13%", // 7 cards per row on web
  default: "48%", // 2 cards per row on other platforms
});

interface MyProductsScreenProps {
  selectedProducts: string[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>>;
}

// Define MyProductsScreen as a proper function component
const MyProductsScreen: React.FC<MyProductsScreenProps> = ({
  selectedProducts,
  setSelectedProducts,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const productsRef = ref(db, `products/${user.uid}`);

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const productsData = snapshot.val() || {};
        const productsArray = Object.entries(productsData).map(
          ([id, data]: [string, any]) => ({
            id,
            ...data,
            categories: Array.isArray(data.categories) ? data.categories : [], // Ensure categories is an array
            images: Array.isArray(data.images) ? data.images : [], // Ensure images is an array
          })
        );
        setProducts(productsArray);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prev) => {
      const updatedSelectedProducts = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      return updatedSelectedProducts;
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.drawerContainer}>
      <Text style={styles.title}>Select Products to Offer</Text>
      <View style={styles.cardsWrapper}>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[
              styles.card,
              selectedProducts.includes(product.id) && styles.selectedProduct,
            ]}
            onPress={() => handleProductSelect(product.id)}
          >
            {product.images && product.images.length > 0 ? (
              <Image
                source={{ uri: product.images[0] }}
                style={styles.cardImage}
              />
            ) : (
              <Image
                source={{ uri: "https://placeholder.com/placeholder.png" }} // Add a placeholder image URL
                style={styles.cardImage}
              />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                {product.priceStart} TL - {product.priceEnd} TL
              </Text>
              <Text style={styles.productStatus}>Status: {product.status}</Text>
              <Text style={styles.productCreatedAt}>
                Created At: {new Date(product.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.productCategory}>
                Category: {product.categories.join(", ")}
              </Text>
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={
                    selectedProducts.includes(product.id)
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() => handleProductSelect(product.id)}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const ProductsScreen: React.FC = () => {
  // Move all hooks to the top level
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [ownerPhotos, setOwnerPhotos] = useState<{
    [key: string]: { photoUrl: string; nickname: string };
  }>({});
  const [bidCounts, setBidCounts] = useState<{ [key: string]: number }>({});
  const [reviews, setReviews] = useState<{ [key: string]: Review[] }>({});
  const [newReview, setNewReview] = useState({
    productId: "",
    rating: 0,
    comment: "",
  });
  const [unresultedBidsCount, setUnresultedBidsCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  // Define callbacks using useCallback
  const updateUnresultedBidsCount = useCallback((snapshot: any) => {
    const bids = snapshot.val() || {};
    const counts: { [key: string]: number } = {};
    let unresolvedCount = 0;

    Object.values(bids).forEach((bid: any) => {
      if (counts[bid.targetProductId]) {
        counts[bid.targetProductId]++;
      } else {
        counts[bid.targetProductId] = 1;
      }
      if (bid.status === "pending") {
        unresolvedCount++;
      }
    });

    setBidCounts(counts);
    setUnresultedBidsCount(unresolvedCount);
  }, []);

  // Move useEffects after all state definitions
  useEffect(() => {
    const db = getDatabase();
    const productsRef = ref(db, "products");
    const auth = getAuth();
    const user = auth.currentUser;

    console.log("Current user:", user?.uid);

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
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

          if (userProducts && typeof userProducts === "object") {
            Object.keys(userProducts).forEach((productId) => {
              const product = userProducts[productId];

              // Only include if:
              // 1. Product exists
              // 2. Not current user's product
              if (product && (!user || userId !== user.uid)) {
                allProducts.push({
                  ...product,
                  id: productId,
                  userId: userId,
                });
              }
            });
          }
        });

        console.log("Filtered products:", allProducts);
        setProducts(allProducts);
        setLoading(false);
      },
      (error) => {
        console.error("Database error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []); // Empty dependency array to run only once

  // Fetch user's products for bidding
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
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
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const photos: {
          [key: string]: { photoUrl: string; nickname: string };
        } = {};
        Object.keys(data).forEach((userId) => {
          if (
            data[userId].profile &&
            data[userId].profile.photoUrl &&
            data[userId].profile.nickname
          ) {
            photos[userId] = {
              photoUrl: data[userId].profile.photoUrl,
              nickname: data[userId].profile.nickname,
            };
          }
        });
        setOwnerPhotos(photos);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const bidsRef = ref(db, "bids");

    const unsubscribe = onValue(bidsRef, updateUnresultedBidsCount);

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        onValue(bidsRef, updateUnresultedBidsCount);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [updateUnresultedBidsCount]);

  // Fetch reviews for products
  useEffect(() => {
    const db = getDatabase();
    const reviewsRef = ref(db, "reviews");

    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setReviews(data);
    });

    return () => unsubscribe();
  }, []);

  const sendPushNotification = async (
    expoPushToken: string,
    message: string
  ) => {
    const messageBody = {
      to: expoPushToken,
      sound: "default",
      title: "New Bid Received",
      body: message,
      data: { message },
    };

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageBody),
      });

      if (!response.ok) {
        throw new Error("Failed to send push notification");
      }

      const responseData = await response.json();
      console.log("Push notification response:", responseData);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  };

  const handleBidSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log("Selected products:", selectedProducts);
    console.log("Target product ID:", targetProductId);
    if (!user || !targetProductId || selectedProducts.length === 0) {
      Alert.alert(
        "Error",
        "Please select a product to bid on and offer at least one product."
      );
      return;
    }

    const targetProduct = products.find(
      (product) => product.id === targetProductId
    );
    if (!targetProduct) {
      console.error("Target product not found for bid", targetProductId);
      Alert.alert("Error", "Target product not found.");
      return;
    }

    const offeredProductsExist = selectedProducts.every((productId) =>
      userProducts.some((product) => product.id === productId)
    );
    if (!offeredProductsExist) {
      console.error("One or more offered products not found", selectedProducts);
      Alert.alert("Error", "One or more offered products not found.");
      return;
    }

    const db = getDatabase();
    const bidsRef = ref(db, "bids");
    const newBidRef = push(bidsRef);

    const newBid: Bid = {
      id: newBidRef.key!,
      targetProductId,
      offeredProducts: selectedProducts,
      status: "pending",
      createdAt: Date.now(),
      userId: user.uid,
      targetProductOwnerId: targetProduct.userId, // Add target product owner ID
    };

    try {
      await set(newBidRef, newBid);
      // Send notification to the target product owner
      const notificationRef = ref(db, `notifications/${targetProduct.userId}`);
      const newNotificationRef = push(notificationRef);
      await set(newNotificationRef, {
        message: `You have received a new bid on your product: ${targetProduct.name}`,
        createdAt: Date.now(),
        read: false,
      });

      // Fetch the target user's Expo push token
      const userTokenRef = ref(db, `expoPushTokens/${targetProduct.userId}`);
      const tokenSnapshot = await get(userTokenRef);
      const expoPushToken = tokenSnapshot.val();

      if (expoPushToken) {
        await sendPushNotification(
          expoPushToken,
          `You have received a new bid on your product: ${targetProduct.name}`
        );
      }

      Alert.alert("Success", "Your bid has been submitted.");
      setSelectedProducts([]);
      setTargetProductId(null);
      setModalVisible(false);
    } catch (error) {
      console.error("Error submitting bid:", error);
      Alert.alert(
        "Error",
        "There was an error submitting your bid. Please try again."
      );
    }
  };

  const handleLikeProduct = async (productId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const likesRef = ref(db, `likes/${user.uid}/${productId}`);

    try {
      if (likedProducts.includes(productId)) {
        await remove(likesRef);
        setLikedProducts((prev) => prev.filter((id) => id !== productId));
      } else {
        await set(likesRef, true);
        setLikedProducts((prev) => [...prev, productId]);
      }
    } catch (error) {
      console.error("Error updating likes:", error);
      Alert.alert("Error", "Failed to update likes");
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const likesRef = ref(db, `likes/${user.uid}`);

    const unsubscribe = onValue(likesRef, (snapshot) => {
      const likesData = snapshot.val() || {};
      setLikedProducts(Object.keys(likesData));
    });

    return () => unsubscribe();
  }, []);

  const calculateCoins = (priceStart: number, priceEnd: number) => {
    const averagePrice = (priceStart + priceEnd) / 2;
    return Math.floor(averagePrice / 100);
  };

  // Update the handleCategorySelect to manage 'Any' selection
  const handleCategorySelect = (selectedCategories: string[]) => {
    if (selectedCategories.includes("Any")) {
      setSelectedCategories(["Any"]);
    } else {
      setSelectedCategories(selectedCategories);
    }
    setCategoryModalVisible(false);
  };

  // Add a console log to debug 'products' and 'selectedCategories'
  useEffect(() => {
    console.log("Products:", products);
    console.log("Selected Categories:", selectedCategories);
  }, [products, selectedCategories]);

  // Ensure 'filteredProducts' is always an array
  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        if (selectedCategories.includes("Any")) {
          return true; // Disable filtering
        }
        const matchesSearchTerm =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategories.length === 0 ||
          (Array.isArray(product.categories) &&
            product.categories.some((category) =>
              selectedCategories.includes(category)
            ));

        return matchesSearchTerm && matchesCategory;
      })
    : [];

  const handleSubmitReview = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !newReview.productId) return;

    const db = getDatabase();
    const reviewRef = push(ref(db, `reviews/${newReview.productId}`));

    const review: Review = {
      id: reviewRef.key!,
      userId: user.uid,
      username: user.displayName || "Anonymous",
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: Date.now(),
    };

    try {
      await set(reviewRef, review);
      Alert.alert("Success", "Your review has been submitted.");
      setNewReview({ productId: "", rating: 0, comment: "" });
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Failed to submit review.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Update the rendering to handle empty or undefined 'filteredProducts'
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity
          style={[
            styles.selectCategoriesButton,
            selectedCategories.includes("Any") && styles.disabledButton,
          ]}
          onPress={() => setCategoryModalVisible(true)}
          disabled={selectedCategories.includes("Any")}
        >
          <Text style={styles.buttonText}>Select Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Remove the inline categories selection */}
      {/* ...existing code... */}

      <ScrollView style={styles.container}>
        <View style={styles.cardsWrapper}>
          {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.card,
                  selectedProducts.includes(product.id) &&
                    styles.selectedProduct,
                ]}
                // Removed onPress from the card
              >
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={() => handleLikeProduct(product.id)}
                >
                  <FontAwesome
                    name={
                      likedProducts.includes(product.id) ? "heart" : "heart-o"
                    }
                    size={24}
                    color="red"
                  />
                </TouchableOpacity>
                {Array.isArray(product.images) && product.images.length > 0 ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.cardImage}
                  />
                ) : (
                  <Image
                    source={{ uri: "https://placeholder.com/placeholder.png" }} // Add a placeholder image URL
                    style={styles.cardImage}
                  />
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDescription}>
                    {product.description}
                  </Text>
                  <Text style={styles.productPrice}>
                    {product.priceStart} TL - {product.priceEnd} TL
                  </Text>
                  <View style={styles.coinContainer}>
                    <Text style={styles.productCoins}>
                      Coins to bid:{" "}
                      {calculateCoins(product.priceStart, product.priceEnd)}
                    </Text>
                    <FontAwesome6 name="coins" size={16} color="#FFD700" />
                  </View>
                  <Text style={styles.productCreatedAt}>
                    Created: {new Date(product.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.bidCount}>
                    Bids: {bidCounts[product.id] || 0}
                  </Text>
                  <View style={styles.ownerInfo}>
                    <Image
                      source={{
                        uri:
                          ownerPhotos[product.userId]?.photoUrl ||
                          "https://placeholder.com/user",
                      }}
                      style={styles.ownerPhoto}
                    />
                    <Text style={styles.ownerNickname}>
                      {ownerPhotos[product.userId]?.nickname || "NoName"}
                    </Text>
                  </View>
                  <View style={styles.productCategories}>
                    {Array.isArray(product.categories) &&
                      product.categories.map((category) => (
                        <View key={category} style={styles.categoryIcon}>
                          <Icon
                            name={categoryIcons[category] || "circle"}
                            size={16}
                            color="#555"
                          />
                          <Text style={styles.categoryText}>{category}</Text>
                        </View>
                      ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.bidButton, { marginTop: 8 }]}
                    onPress={() => {
                      setTargetProductId(product.id);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.buttonText}>Place Bid</Text>
                  </TouchableOpacity>

                  {/* Reviews Section */}
                  <View style={styles.reviewsContainer}>
                    <Text style={styles.reviewsTitle}>Reviews:</Text>
                    {Array.isArray(reviews[product.id]) &&
                    reviews[product.id].length > 0 ? (
                      reviews[product.id].map((review) => (
                        <View key={review.id} style={styles.reviewItem}>
                          <Text style={styles.reviewUsername}>
                            {review.username}
                          </Text>
                          <View style={styles.reviewRating}>
                            {Array.from({ length: 5 }, (_, index) => (
                              <FontAwesome
                                key={index}
                                name={
                                  index < review.rating ? "star" : "star-o"
                                }
                                size={16}
                                color="#FFD700"
                              />
                            ))}
                          </View>
                          <Text style={styles.reviewComment}>
                            {review.comment}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noReviewsText}>No reviews yet.</Text>
                    )}
                    {/* Add Review Form */}
                    <View style={styles.addReviewContainer}>
                      <View style={styles.starRatingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => {
                              setNewReview((prev) =>
                                prev.productId === product.id
                                  ? { ...prev, rating: star }
                                  : prev
                              );
                            }}
                          >
                            <FontAwesome
                              name={
                                star <= newReview.rating ? "star" : "star-o"
                              }
                              size={24}
                              color="#FFD700"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        style={styles.reviewInput}
                        placeholder="Your Comment"
                        value={
                          newReview.productId === product.id
                            ? newReview.comment
                            : ""
                        }
                        onChangeText={(text) =>
                          setNewReview((prev) =>
                            prev.productId === product.id
                              ? { ...prev, comment: text }
                              : prev
                          )
                        }
                      />
                      <TouchableOpacity
                        style={styles.submitReviewButton}
                        onPress={() =>
                          setNewReview((prev) => ({
                            ...prev,
                            productId: product.id,
                          }))
                        }
                      >
                        <Text style={styles.buttonText}>Add Review</Text>
                      </TouchableOpacity>
                      {newReview.productId === product.id && (
                        <TouchableOpacity
                          style={styles.submitReviewButton}
                          onPress={handleSubmitReview}
                        >
                          <Text style={styles.buttonText}>Submit Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <View style={styles.reviewsContainer}>
                    {reviews[product.id] && reviews[product.id].length > 0 ? (
                      <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FontAwesome
                            key={star}
                            name={
                              reviews[product.id][0].rating >= star
                                ? "star"
                                : "star-o"
                            }
                            size={16}
                            color="#FFD700"
                            // Make stars non-interactive
                            // Remove onPress handlers
                          />
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noReviewsText}>No ratings yet.</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noProductsText}>
              No products available in this category
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Add Modal for category selection */}
      <Modal
        isVisible={isCategoryModalVisible}
        onBackdropPress={() => setCategoryModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <SelectCategoriesScreen
            selectedCategories={selectedCategories}
            onSelectCategories={handleCategorySelect} // Updated prop name
            onClose={() => setCategoryModalVisible(false)} // Add onClose prop
          />
        </View>
      </Modal>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => {
          setModalVisible(false);
          Alert.alert("Close", "Are you sure you want to close this window?"); // Add alert text
        }}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <MyProductsScreen
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
          />
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={handleBidSubmit}>
              <Text style={styles.buttonText}>Submit Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Remove the logo container */}
    </View>
  );
};

// Fix the styles object by removing duplicate keys and correcting syntax
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  cardsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: Platform.select({
      web: "13%",
      default: "48%",
    }),
    marginBottom: 16,
    marginHorizontal: "0.5%",
  },
  selectedProduct: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  cardImage: {
    width: "100%",
    height: 140,
    marginBottom: 10,
  },
  productImage: {
    width: "100%",
    height: 140,
    marginBottom: 10,
  },
  productInfo: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginBottom: 10,
    marginTop: 24,
  },
  ownerPhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  ownerNickname: {
    fontSize: 16,
    color: "#007AFF",
  },
  bidButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  noProductsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 32,
  },
  likeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  disabledButton: {
    backgroundColor: "#d3d3d3",
  },
  productCategory: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  productStatus: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  productCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  categoryIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
  },
  reviewsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  reviewItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
  },
  reviewDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  reviewUsername: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewRating: {
    flexDirection: "row",
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    marginTop: 2,
  },
  noReviewsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  addReviewContainer: {
    marginTop: 10,
  },
  reviewInput: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  submitReviewButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 5,
  },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  productCoins: {
    fontSize: 14,
    color: "#888",
    marginRight: 4,
  },
  productCreatedAt: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  selectCategoriesButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
  },
  modal: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  bidCount: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  button: {
    padding: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  cancelButton: {
    padding: 10,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  drawerContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  stars: {
    flexDirection: "row",
    marginTop: 4,
  },
  starRatingContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
});

export default ProductsScreen;

