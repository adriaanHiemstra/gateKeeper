import React, { useState, useEffect, memo } from "react";
import { View, Text, Platform } from "react-native";
import { Marker } from "react-native-maps";
import { MapPin } from "lucide-react-native";

// Helper to determine color
const getMarkerColor = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (["techno", "house", "music"].some((x) => cat.includes(x))) return "#A855F7";
  if (["rugby", "soccer", "sport"].some((x) => cat.includes(x))) return "#F97316";
  if (["hikes", "nature", "outdoors"].some((x) => cat.includes(x))) return "#10B981";
  return "#FA8900";
};

const EventMarker = memo(({ event, isSelected, showLabels, onSelect }: any) => {
  const [trackChanges, setTrackChanges] = useState(true);

  // Briefly track view changes to render the icon, then freeze it for performance
  useEffect(() => {
    setTrackChanges(true);
    const timer = setTimeout(() => setTrackChanges(false), 500);
    return () => clearTimeout(timer);
  }, [isSelected, showLabels]);

  const color = getMarkerColor(event.category);

  return (
    <Marker
      coordinate={{ latitude: event.lat, longitude: event.lng }}
      onPress={() => onSelect(event)}
      zIndex={isSelected ? 20 : 10}
      tracksViewChanges={Platform.OS === "ios" ? trackChanges : false}
    >
      <View className="items-center justify-center">
        <MapPin
          size={isSelected ? 54 : 42}
          color="white"
          fill={color}
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
});

export default EventMarker;
