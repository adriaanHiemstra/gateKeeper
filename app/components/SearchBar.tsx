import React, { useRef, useState, useEffect } from 'react';
import {
  TextInput,
  Animated,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';

import SearchIcon from './icons/searchIcon';
import { textStyles } from '../styles/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { fireGradient } from '../styles/colours';

const filterOptions = [
  { label: 'Music', color: '#94D22E' },
  { label: 'Shows', color: '#000077' },
  { label: 'Sports', color: '#FF0000' },
  { label: 'Outdoors', color: '#3ACA73' },
  { label: 'Activities', color: '#FF1C89' },
  { label: 'Festials', color: '#FF0000' },
  { label: 'Live Music', color: '#FF1C89' },
  { label: 'Techno', color: '#000077' },
  { label: 'R&B', color: '#000077' },
  
  
  
];
const secondaryFilters = [
  'Today', 'Tomorrow', 'This Week', '2 Weeks', 'This month', 'Custom'
];



type Props = {
  value: string;
  onChange: (text: string) => void;
  dummyText: string;
  selectedFilters: string[];
  onFilterSelect?: (filters: string[]) => void; // ← updated
};

const SearchBar = ({ value, onChange, dummyText, selectedFilters, onFilterSelect }: Props) => {


const [localFilters, setLocalFilters] = useState<string[]>(selectedFilters);

useEffect(() => {
  setLocalFilters(selectedFilters);
}, [selectedFilters]);



  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const heightAnim = useRef(new Animated.Value(70)).current;
const [dropdownVisible, setDropdownVisible] = useState(false);
  const handleFocus = () => {
    setExpanded(true);
    Animated.timing(heightAnim, {
      toValue: 460, // adjust height for filters
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const collapseSearchBar = () => {
  setExpanded(false);
  Keyboard.dismiss(); // closes keyboard too
  Animated.timing(heightAnim, {
    toValue: 70, // collapse back to original height
    duration: 300,
    useNativeDriver: false,
  }).start();
};

const handleDone = () => {
  collapseSearchBar();
};

const toggleFilter = (filter: string) => {
  const newFilters = localFilters.includes(filter)
    ? localFilters.filter(f => f !== filter)
    : [...localFilters, filter];

  setLocalFilters(newFilters);
  onFilterSelect?.(newFilters);
};

  return (
    <TouchableWithoutFeedback onPress={collapseSearchBar}>
    <Animated.View className="px-0"
      style={[
        styles.container,
        {
          height: heightAnim,
        },
      ]}
    >
      <View style={styles.searchRow}>
        <SearchIcon width={28} height={28} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={handleFocus}
          placeholder={dummyText}
          placeholderTextColor="#888"
          style={[textStyles.paragraph3, styles.input]}
        />
      </View>

{expanded && (
  <>
    <View style={styles.filterContainer}>
        <View className = "flex-row w-full flex-wrap items-center justify-center mx-0 px-0">
{filterOptions.map((option) => {
  const isSelected = localFilters.includes(option.label);
  return (
    <TouchableOpacity
      key={option.label}
      onPress={() => toggleFilter(option.label)}
      style={[
        styles.bubble,
        {
          borderColor: option.color,
          backgroundColor: isSelected ? option.color : 'transparent',
        },
      ]}
    >
      <Text
        style={{
          color: isSelected ? 'white' : option.color,
          fontWeight: '600',
        }}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );
})}

      </View>
    </View>

    {/* SECOND GRID HERE */}
    <View style={styles.filterContainer2}>
{secondaryFilters.map((label) => {
  const isSelected = localFilters.includes(label);
  return (
    <TouchableOpacity
      key={label}
      onPress={() => toggleFilter(label)}
      style={[
        styles.bubble,
        {
          borderColor: '#888',
          backgroundColor: isSelected ? '#888' : 'transparent',
        },
      ]}
    >
      <Text
        style={{
          color: isSelected ? 'white' : '#888',
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
})}

    </View>
    {/* DONE Button */}
<TouchableOpacity
  onPress={() => {
    if (onFilterSelect) {
      onFilterSelect(localFilters);
    }
    collapseSearchBar(); // ✅ collapse the search bar
  }}
  activeOpacity={0.8}
>
  <LinearGradient {...fireGradient} style={styles.doneButton}>
    <Text style={styles.doneButtonText}>DONE</Text>
  </LinearGradient>
</TouchableOpacity>

  </>
)}

    </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
    marginHorizontal: 5,
    paddingHorizontal: 0,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
  },
  doneButton: {
  marginTop: 24,
  alignSelf: 'center',

  paddingVertical: 16,
  paddingHorizontal: 40,
  borderRadius: 999,
},

doneButtonText: {
  color: 'white',
  fontSize: 26,
  fontWeight: 'bold',
},
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 22,
    marginBottom: 12,
    justifyContent: 'center',
  },
    filterContainer2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 12,
     marginLeft: 16,
    marginRight: 0,
    justifyContent: 'center',
  },
  bubble: {
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    margin: 6
 
  },
});

export default SearchBar;


