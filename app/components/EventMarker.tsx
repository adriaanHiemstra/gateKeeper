import React, { useState, useEffect, memo } from "react";
import { View, Text, Platform } from "react-native";
import { Marker } from "react-native-maps";
import { MapPin } from "lucide-react-native";

const EventMarker = memo(
  ({ event, color, isSelected, showLabels, onSelect }: any) => {
    const [trackChanges, setTrackChanges] = useState(true);

    // Briefly track view changes to render the icon, then freeze it for performance
    useEffect(() => {
      setTrackChanges(true);
      const timer = setTimeout(() => setTrackChanges(false), 500);
      return () => clearTimeout(timer);
    }, [isSelected, showLabels]);

    return (
      <Marker
        coordinate={{ latitude: event.lat, longitude: event.lng }}
        onPress={() => onSelect(event)}
        zIndex={isSelected ? 20 : 10}
        tracksViewChanges={false}
      >
        <View className="items-center justify-center">
          <MapPin
            size={isSelected ? 54 : 42}
            color="white"
            fill={color || "#FA8900"} // 👈 Uses the calculated color!
            strokeWidth={1.5}
          />
          {showLabels && (
            <View className="mt-0 bg-[#1E1E1E]/90 px-2 py-1 rounded-md border border-white/20 shadow-sm">
              <Text
                className="text-white text-[10px] font-bold"
                numberOfLines={1}
              >
                {event.title}
              </Text>
            </View>
          )}
        </View>
      </Marker>
    );
  },
);

export default EventMarker;
