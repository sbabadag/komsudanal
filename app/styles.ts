import { StyleSheet, Platform, Dimensions } from "react-native";

// Define and export categoryIcons

export const categoryIcons: { [key: string]: string } = {
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

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    paddingBottom: 20, // Add padding to prevent overlap
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
      default: "48%",   // 2 cards per row on mobile
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
    borderWidth: 1, // Added border width
    borderColor: "#007AFF", // Added border color
    borderRadius: 8, // Added border radius for rounded corners
    shadowColor: "#000", // Added shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3, // For Android shadow
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#ffffff", // Changed background color for contrast
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1, // Added border width
    borderColor: "#ccc", // Added border color
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
    width: Platform.OS === "windows" ? "60%" : "80%", // Adjust width for Windows
    maxHeight: "90%", // Prevent overflow on smaller screens
    flexGrow: 1, // Ensure content can expand
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
  categoryButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8, // Added margin for spacing
  },
  categoryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomDrawer: {
    justifyContent: "flex-end",
    margin: 0,
  },
  drawerContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get("window").height * 0.5, // Adjust height as needed
  },
  bottomSheetContent: {
    backgroundColor: 'white',
    padding: 16,
    height: 450,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: Dimensions.get('window').height * 0.75, // Increased height from 0.6 to 0.75
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1, // Set lower zIndex
  },
  buttonsContainer: {
    // New style for buttons container
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 2, // Ensure buttons are above the drawer
    alignItems: 'center',
  },
  submitButton: {
    // Style for the submit button
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
  },
  selectedCategoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  selectedCategory: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryIcon: {
    marginRight: 4,
  },
  selectedCategoryText: {
    fontSize: 14,
    color: "#333",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  categoriesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%', // Ensure container takes full width
  },
  categoryItem: {
    width: '32%', // Set exact width for 3 columns with small gap
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    margin: '0.5%', // Small margin for spacing
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: 'flex-start', // Align items to start
  },
  selectedCategoryItem: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  icon: {
    marginRight: 4,
    width: 20, // Fixed width for icon
  },
  categoryItemText: {
    fontSize: 16,
    color: "#333",
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  applyButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
    columnWrapper: {

    justifyContent: 'space-between',

    paddingHorizontal: 8,

  }
});