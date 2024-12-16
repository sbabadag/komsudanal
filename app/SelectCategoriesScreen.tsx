import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome"; // Add this import
import { Checkbox } from "react-native-paper";

// Define the SelectCategoriesScreenProps interface
interface SelectCategoriesScreenProps {
  selectedCategories: string[];
  onSelectCategories: (selected: string[]) => void;
  onClose: () => void;
}

// Define the expanded list of available categories
const availableCategories = [
  "Any",
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
  "Books",
  "Wearables",
  "Accessories",
];

// Export categoryIcons so it can be imported elsewhere
export const categoryIcons: { [key: string]: string } = {
  Any: "th-large", // Icon for 'Any' category
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

const SelectCategoriesScreen: React.FC<SelectCategoriesScreenProps> = ({
  selectedCategories,
  onSelectCategories,
  onClose,
}) => {
  const allCategories = [
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
    "Any",
  ];

  const [localSelectedCategories, setLocalSelectedCategories] =
    useState<string[]>(selectedCategories);

  const toggleCategory = (category: string) => {
    if (category === "Any") {
      setLocalSelectedCategories(["Any"]);
    } else {
      let updatedCategories = [...localSelectedCategories];
      if (updatedCategories.includes(category)) {
        updatedCategories = updatedCategories.filter((c) => c !== category);
      } else {
        updatedCategories.push(category);
      }
      if (updatedCategories.includes("Any")) {
        updatedCategories = ["Any"];
      }
      setLocalSelectedCategories(updatedCategories);
    }
  };

  const handleSave = () => {
    onSelectCategories(localSelectedCategories);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Categories</Text>
      <ScrollView contentContainerStyle={styles.container}>
        {Array.isArray(allCategories) &&
          allCategories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => toggleCategory(category)}
              style={styles.categoryItem}
            >
              <Checkbox
                status={
                  localSelectedCategories.includes(category)
                    ? "checked"
                    : "unchecked"
                }
                onPress={() => toggleCategory(category)}
              />
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

// Ensure no rating edit features are present
// Remove any rating input fields or edit handlers if previously added

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  categoryItem: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedCategory: {
    backgroundColor: "#007AFF",
  },
  icon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    color: "#333",
  },
  applyButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  applyButtonText: {
    color: "white",
    fontWeight: "600",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
});

export default SelectCategoriesScreen;
