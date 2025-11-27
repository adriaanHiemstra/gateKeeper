import React from 'react';
import { FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const numColumns = 2;
const imageSize = screenWidth / numColumns;
type Event = {
  id: string;
  title: string;
  image: any; // Or ImageSourcePropType if you're being strict
};

type Props = {
  events: Event[];
  onEventPress?: (event: Event) => void;
};


const EventGrid = ({ events, onEventPress = () => {} }: Props) => {
  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={{ padding: 0 }}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onEventPress(item)}>
          <Image
            source={item.image}
            style={{
              width: imageSize,
              height: imageSize,
              marginBottom: 0,
              borderRadius: 0,
            }}
          />
        </TouchableOpacity>
      )}
    />
  );
};

export default EventGrid;
