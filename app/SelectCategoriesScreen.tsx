import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { styles } from './styles';

// Define the SelectCategoriesScreenProps interface
interface SelectCategoriesScreenProps {
  selectedCategories: string[];
  onSelectCategories: (selectedCategories: string[]) => void;
  onSave: (selectedCategories: string[]) => void;
  onClose: () => void;
}

// Remove duplicate "Books" from availableCategories
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

// Memoized CategoryItem component to prevent unnecessary re-renders
const CategoryItem = React.memo(({ category, isSelected, onToggle }: { category: string; isSelected: boolean; onToggle: (category: string) => void }) => (
  <TouchableOpacity
    style={[
      styles.categoryItem,
      isSelected && styles.selectedCategoryItem,
    ]}
    onPress={() => onToggle(category)}
  >
    <Icon
      name={categoryIcons[category]}
      size={20}
      style={styles.icon}
    />
    <Text style={styles.categoryText}>{category}</Text>
  </TouchableOpacity>
));

const SelectCategoriesScreen: React.FC<SelectCategoriesScreenProps> = ({
  selectedCategories,
  onSelectCategories,
  onSave,
  onClose,
}) => {
  const toggleCategory = useCallback((category: string) => {
    if (category === "Any") {
      onSelectCategories(["Any"]);
    } else {
      let updatedCategories = [...selectedCategories];
      if (updatedCategories.includes("Any")) {
        updatedCategories = [];
      }
      if (updatedCategories.includes(category)) {
        updatedCategories = updatedCategories.filter((c) => c !== category);
      } else {
        updatedCategories.push(category);
      }
      onSelectCategories(updatedCategories);
    }
  }, [selectedCategories, onSelectCategories]);

  const renderItem = useCallback(({ item }: { item: string }) => (
    <CategoryItem
      category={item}
      isSelected={selectedCategories.includes(item)}
      onToggle={toggleCategory}
    />
  ), [selectedCategories, toggleCategory]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Categories</Text>
        <TouchableOpacity style={styles.applyButton} onPress={() => onSave(selectedCategories)}>
          <Text style={styles.buttonText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={availableCategories}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper} // Add this line
        contentContainerStyle={styles.categoriesContainer}
        initialNumToRender={9}
        maxToRenderPerBatch={9}
        windowSize={5}
      />
    </View>
  );
};

// Ensure no rating edit features are present
// Remove any rating input fields or edit handlers if previously added

export default SelectCategoriesScreen;
