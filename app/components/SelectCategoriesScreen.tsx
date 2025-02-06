import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { FontAwesome } from '@expo/vector-icons';  // Update import
import { styles } from 'C:/RN/KOMSUDANAL/komsudanal/app/styles';

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
    <FontAwesome
      name={categoryIcons[category] || 'question-circle'}
      size={20}
      color={isSelected ? '#fff' : '#333'}
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
      <ScrollView style={styles.categoriesContainer}>
        <View style={styles.grid}>
          {availableCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryItem,
                selectedCategories.includes(category) && styles.selectedCategoryItem,
              ]}
              onPress={() => toggleCategory(category)}
            >
              <View style={styles.categoryContent}>
                <FontAwesome
                  name={categoryIcons[category] || 'question-circle'}
                  size={20}
                  color={selectedCategories.includes(category) ? '#fff' : '#333'}
                  style={styles.icon}
                />
                <Text style={[
                  styles.categoryItemText,
                  selectedCategories.includes(category) && styles.selectedCategoryItemText,
                ]}>
                  {category}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => onSave(selectedCategories)}
        >
          <Text style={styles.buttonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SelectCategoriesScreen;
