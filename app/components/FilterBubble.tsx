import React from 'react';
import { Text, TouchableOpacity, ViewStyle } from 'react-native';

type Props = {
  label: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

const FilterBubble = ({ label, color, selected = false, onPress, style }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          borderWidth: 2,
          borderColor: color,
          borderRadius: 999,
          paddingVertical: 8,
          paddingHorizontal: 0,
          backgroundColor: selected ? color : 'transparent',
          margin: 0,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: selected ? '#FFFFFF' : color,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default FilterBubble;
