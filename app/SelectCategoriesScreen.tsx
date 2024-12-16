import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';

interface SelectCategoriesScreenProps {
  selectedCategories: string[];
  onClose: (selectedCategories: string[]) => void;
}

const categories = [
  { name: 'Any', icon: 'asterisk' },
  { name: 'Electronics', icon: 'tv' },
  { name: 'Fashion', icon: 'tshirt' },
  { name: 'Home & Garden', icon: 'home' },
  { name: 'Health & Beauty', icon: 'heartbeat' },
  { name: 'Sports & Outdoors', icon: 'futbol' },
  { name: 'Toys & Hobbies', icon: 'puzzle-piece' },
  { name: 'Automotive', icon: 'car' },
  { name: 'Books & Media', icon: 'book' },
  { name: 'Groceries', icon: 'shopping-basket' },
  { name: 'Jewelry & Watches', icon: 'gem' },
  { name: 'Office Supplies', icon: 'briefcase' },
  { name: 'Pet Supplies', icon: 'paw' },
  { name: 'Baby Products', icon: 'baby' },
  { name: 'Music & Instruments', icon: 'music' },
  { name: 'Collectibles & Art', icon: 'paint-brush' },
  { name: 'Computers & Accessories', icon: 'laptop' },
  { name: 'Video Games', icon: 'gamepad' },
  { name: 'Appliances', icon: 'plug' },
  { name: 'Food & Beverages', icon: 'utensils' },
  { name: 'Travel & Luggage', icon: 'suitcase' },
  { name: 'Real Estate', icon: 'building' },
  { name: 'Services', icon: 'servicestack' },
];

const SelectCategoriesScreen: React.FC<SelectCategoriesScreenProps> = ({ selectedCategories, onClose }) => {
  const [selected, setSelected] = useState<string[]>(selectedCategories);

  const handleCategorySelect = (category: string) => {
    if (category === 'Any') {
      if (selected.includes('Any')) {
        setSelected([]);
      } else {
        setSelected(categories.map(c => c.name));
      }
    } else {
      setSelected(prev => {
        let updatedSelected;
        if (prev.includes(category)) {
          updatedSelected = prev.filter(cat => cat !== category);
        } else {
          updatedSelected = [...prev, category];
        }
        if (updatedSelected.length === categories.length - 1) {
          updatedSelected = [...updatedSelected, 'Any'];
        } else {
          updatedSelected = updatedSelected.filter(cat => cat !== 'Any');
        }
        return updatedSelected;
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Categories</Text>
      <View style={styles.categoriesContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.name}
            style={styles.categoryItem}
            onPress={() => handleCategorySelect(category.name)}
          >
            <FontAwesome
              name={selected.includes(category.name) ? 'check-square' : 'square-o'}
              size={24}
              color="black"
            />
            <FontAwesome6 name={category.icon as any} size={24} color="black" style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onClose(selected)}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  categoryIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    marginLeft: 8,
  },
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default SelectCategoriesScreen;