// app/components/EventMarker.tsx
import React, { memo, useState, useEffect } from "react";
import { View, Text, Image } from "react-native";
import { Marker } from "react-native-maps";

const EventMarker = ({
  event,
  icon,
  isSelected,
  showLabels,
  onSelect,
  coordinate,
}: any) => {
  const [trackChanges, setTrackChanges] = useState(true);

  // Only trigger the expensive rendering engine if tapped or labels show
  useEffect(() => {
    if (isSelected || showLabels) {
      setTrackChanges(true);
      const timer = setTimeout(() => setTrackChanges(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isSelected, showLabels]);

  const pinSize = isSelected ? 54 : 42;

  return (
    <Marker
      coordinate={coordinate || { latitude: event.lat, longitude: event.lng }}
      onPress={() => onSelect(event)}
      zIndex={isSelected ? 20 : 10}
      tracksViewChanges={trackChanges}
    >
      <View className="items-center justify-center">
        <Image
          source={icon || require("../assets/icons/activity-location.png")}
          style={{
            width: pinSize,
            height: pinSize,
            resizeMode: "contain",
          }}
          // 🔥 CRITICAL FIX: Don't stop rendering until the image actually loads!
          onLoad={() => setTrackChanges(false)}
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
};

// 🔥 THE ARMOR SHIELD:
// This tells React Native: "Do NOT re-draw this pin unless it was tapped!"
export default memo(EventMarker, (prevProps, nextProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showLabels === nextProps.showLabels
  );
});
