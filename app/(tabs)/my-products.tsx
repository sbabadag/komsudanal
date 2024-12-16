import React, { useState, useEffect } from "react";
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
} from "react-native";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove,
} from "firebase/database";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker"; // Add this import
import { Checkbox } from "react-native-paper"; // Add this import
import SelectCategoriesScreen from "../SelectCategoriesScreen"; // Add this import
import Modal from "react-native-modal"; // Add this import
import Icon from "react-native-vector-icons/FontAwesome"; // Add this import

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
  categories: string[]; // Ensure 'categories' is always an array
  reviews: Review[]; // Add reviews array to store user reviews
  averageRating?: number; // Add averageRating if needed
}

interface Review {
  id: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
}

const categories = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Books",
  "Toys",
  "Home Appliances",
  "Garden",
  "Sports",
  "Beauty",
  "Automotive",
  "Health",
  "Music",
  "Movies",
  "Games",
  "Jewelry",
  "Pet Supplies",
  "Office Supplies",
  "Baby Products",
  "Groceries",
  "Art",
  "Tools",
  "Software",
  "Photography",
  "Wearables",
  "Accessories",
]; // Define expanded categories list

// Define the category to icon mapping (reuse from SelectCategoriesScreen.tsx)
const categoryIcons: { [key: string]: string } = {
  Electronics: "tv",
  Furniture: "home",
  Clothing: "tshirt",
  // ...other categories...
};

export default function MyProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    images: [] as string[],
    priceStart: 0,
    priceEnd: 0,
    status: "published" as "draft" | "published",
    categories: [] as string[], // Initialize categories as an empty array
  });
  const [isEditing, setIsEditing] = useState(false);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false); // Add this state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Add this state
  const [searchTerm, setSearchTerm] = useState(""); // Add this state
  const [reviews, setReviews] = useState<{ [key: string]: Review[] }>({}); // Add this state
  const [averageRatings, setAverageRatings] = useState<{ [key: string]: number }>({}); // Add this state

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
        console.log("Fetched products:", productsArray);
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

  useEffect(() => {
    const calculateAverageRatings = () => {
      const avgRatings: { [key: string]: number } = {};
      for (const productId in reviews) {
        const productReviews = reviews[productId];
        if (productReviews.length > 0) {
          const total = productReviews.reduce((sum, review) => sum + review.rating, 0);
          avgRatings[productId] = total / productReviews.length;
        }
      }
      setAverageRatings(avgRatings);
    };

    calculateAverageRatings();
  }, [reviews]);

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
          console.error("Error handling image:", error);
          Alert.alert("Error", "Failed to add image");
        } finally {
          setPublishing(false);
        }
      }
    }
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

  const handlePublish = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    if (!newProduct.name.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }

    if (!newProduct.description.trim()) {
      Alert.alert("Error", "Product description is required");
      return;
    }

    if (newProduct.priceStart <= 0 || newProduct.priceEnd <= 0) {
      Alert.alert("Error", "Product price must be greater than zero");
      return;
    }

    if (newProduct.priceStart > newProduct.priceEnd) {
      Alert.alert(
        "Error",
        "Starting price cannot be greater than ending price"
      );
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
        status: "published", // Make sure status is set
        createdAt: Date.now(),
        categories: newProduct.categories || [], // Ensure categories are saved as an array
      });

      console.log("Published product:", {
        ...newProduct,
        id: newProductRef.key,
        userId: user.uid,
      });

      setNewProduct({
        name: "",
        description: "",
        images: [],
        priceStart: 0,
        priceEnd: 0,
        status: "published",
        categories: [], // Reset categories to an empty array
      });
      Alert.alert("Success", "Product published successfully");
    } catch (error) {
      console.error("Error publishing product:", error);
      Alert.alert("Error", "Failed to publish product");
    } finally {
      setPublishing(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      images: product.images,
      priceStart: product.priceStart,
      priceEnd: product.priceEnd,
      status: product.status || "draft", // Ensure status is defined
      categories: product.categories || [], // Ensure categories is an array
    });
    setIsEditing(true);
  };

  const handleUpdateProduct = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !editingProduct) return;

    if (!newProduct.name.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }

    if (!newProduct.description.trim()) {
      Alert.alert("Error", "Product description is required");
      return;
    }

    if (newProduct.priceStart <= 0 || newProduct.priceEnd <= 0) {
      Alert.alert("Error", "Product price must be greater than zero");
      return;
    }

    if (newProduct.priceStart > newProduct.priceEnd) {
      Alert.alert(
        "Error",
        "Starting price cannot be greater than ending price"
      );
      return;
    }

    setPublishing(true);
    try {
      const db = getDatabase();
      const productRef = ref(db, `products/${user.uid}/${editingProduct.id}`);

      await set(productRef, {
        ...newProduct,
        id: editingProduct.id,
        userId: user.uid,
        createdAt: editingProduct.createdAt,
        status: newProduct.status || "draft", // Ensure status is defined
        categories: newProduct.categories || [], // Ensure categories are updated as an array
      });

      console.log("Updated product:", {
        ...newProduct,
        id: editingProduct.id,
        userId: user.uid,
      });

      setNewProduct({
        name: "",
        description: "",
        images: [],
        priceStart: 0,
        priceEnd: 0,
        status: "published",
        categories: [], // Reset categories to an empty array
      });
      setEditingProduct(null);
      setIsEditing(false);
      Alert.alert("Success", "Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert("Error", "Failed to update product");
    } finally {
      setPublishing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProduct({
      name: "",
      description: "",
      images: [],
      priceStart: 0,
      priceEnd: 0,
      status: "published",
      categories: [], // Reset categories to an empty array
    });
    setIsEditing(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = getDatabase();
              const productRef = ref(db, `products/${user.uid}/${productId}`);
              await remove(productRef);
              Alert.alert("Success", "Product deleted successfully");
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
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

  // Update the filtering logic to handle 'Any'
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
          (product.categories &&
            product.categories.some((category) =>
              selectedCategories.includes(category)
            ));

        return matchesSearchTerm && matchesCategory;
      })
    : [];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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

      <ScrollView style={styles.container}>
        <Text style={styles.title}>My Products</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={newProduct.name}
            onChangeText={(text) =>
              setNewProduct((prev) => ({ ...prev, name: text }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            multiline
            numberOfLines={3}
            value={newProduct.description}
            onChangeText={(text) =>
              setNewProduct((prev) => ({ ...prev, description: text }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Price Start"
            keyboardType="numeric"
            value={newProduct.priceStart.toString()}
            onChangeText={(text) =>
              setNewProduct((prev) => ({
                ...prev,
                priceStart: parseFloat(text) || 0,
              }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Price End"
            keyboardType="numeric"
            value={newProduct.priceEnd.toString()}
            onChangeText={(text) =>
              setNewProduct((prev) => ({
                ...prev,
                priceEnd: parseFloat(text) || 0,
              }))
            }
          />
          <TouchableOpacity
            style={[
              styles.selectCategoriesButton,
              selectedCategories.includes("Any") && styles.disabledButton,
            ]}
            onPress={() => setCategoryModalVisible(true)}
            disabled={selectedCategories.includes("Any")}
          >
            <Icon
              name="tags"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.buttonText}>Select Categories</Text>
          </TouchableOpacity>
          <View style={styles.selectedCategories}>
            {newProduct.categories.map((category) => (
              <View key={category} style={styles.categoryBadge}>
                <Icon
                  name={categoryIcons[category] || "circle"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.categoryBadgeText}>{category}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handleImagePick}
          >
            <Text style={styles.imagePickerText}>Pick an Image</Text>
          </TouchableOpacity>
          <ScrollView horizontal style={styles.imagePreview}>
            {newProduct.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.publishButton, publishing && styles.disabledButton]}
            onPress={editingProduct ? handleUpdateProduct : handlePublish}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {editingProduct ? "Update" : "Publish"}
              </Text>
            )}
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity
              style={[styles.cancelButton, publishing && styles.disabledButton]}
              onPress={handleCancelEdit}
              disabled={publishing}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gridContainer}>
          {filteredProducts.length > 0 ? (
            <View style={styles.cardsWrapper}>
              {filteredProducts.map((product, index) => (
                <View
                  key={product.id}
                  style={[
                    styles.card,
                    Platform.select({
                      web: { width: "13%", margin: "1%" },
                      default: {
                        width: "48%",
                        marginHorizontal: "1%",
                        marginBottom: 16,
                      }, // Ensure two cards fit in one row on mobile
                    }),
                  ]}
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
                  <Image
                    source={{
                      uri:
                        product.images?.[0] ||
                        "https://via.placeholder.com/150",
                    }}
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
                      ${product.priceStart.toLocaleString()} - $
                      {product.priceEnd.toLocaleString()}
                    </Text>
                    <Text style={styles.productCategory}>
                      Categories: {product.categories?.join(", ") || "None"}
                    </Text>
                    <View style={styles.ratingContainer}>
                      {averageRatings[product.id] ? (
                        <View style={styles.stars}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <FontAwesome
                              key={index}
                              name={
                                averageRatings[product.id] >= index + 1
                                  ? "star"
                                  : "star-o"
                              }
                              size={16}
                              color="#FFD700"
                            />
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noReviewsText}>No ratings yet.</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditProduct(product)}
                    >
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id)}
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noProductsText}>
              No products available in this category
            </Text>
          )}
        </View>

        <Modal
          isVisible={isCategoryModalVisible}
          onBackdropPress={() => setCategoryModalVisible(false)}
          style={styles.modal}
        >
          <View style={styles.modalContent}>
            <SelectCategoriesScreen
              selectedCategories={newProduct.categories}
              onSelectCategories={handleCategorySelect}
              onClose={() => setCategoryModalVisible(false)}
            />
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
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
  form: {
    marginBottom: 32,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePicker: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  imagePickerText: {
    color: "white",
    fontWeight: "600",
  },
  imagePreview: {
    marginBottom: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  publishButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#FF6347",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  gridContainer: {
    alignItems: "center",
  },
  cardsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Adjust to space between cards
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
    width: "48%", // Ensure two cards fit in one row
    marginBottom: 16,
    alignItems: "center", // Center elements horizontally
    justifyContent: "center", // Center elements vertically
    padding: 16, // Add padding to ensure content fits well
    height: 400, // Set a taller fixed height to accommodate extra buttons
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  cardContent: {
    padding: 12,
    alignItems: "center", // Center elements horizontally inside the card content
    justifyContent: "center", // Center elements vertically
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center", // Center text horizontally
    width: "100%", // Ensure the text fits within the card width
  },
  productDescription: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center", // Center text horizontally
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center", // Center text horizontally
  },
  editButton: {
    backgroundColor: "#FFA500",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  likeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  noProductsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 32,
  },
  picker: {
    height: 50,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  selectCategoriesButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginTop: 10,
  },
  selectedCategoryText: {
    marginTop: 10,
    fontSize: 16,
  },
  productCategory: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
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
  selectedCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    padding: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  stars: {
    flexDirection: "row",
  },
  noReviewsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
