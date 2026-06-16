import React, { memo, useState, useEffect } from "react";
import { View, Text, Image } from "react-native"; // 👈 Import standard Image
import { Marker } from "react-native-maps";

const EventMarker = memo(
  ({ event, icon, isSelected, showLabels, onSelect, coordinate }: any) => {
    const [trackChanges, setTrackChanges] = useState(true);

    useEffect(() => {
      setTrackChanges(true);
      const timer = setTimeout(() => {
        setTrackChanges(false);
      }, 400);

      return () => clearTimeout(timer);
    }, [isSelected]);

    // Size logic: make it bigger if the user taps it
    const pinSize = isSelected ? 54 : 42;

    return (
      <Marker
        coordinate={coordinate || { latitude: event.lat, longitude: event.lng }}
        onPress={() => onSelect(event)}
        zIndex={isSelected ? 20 : 10}
        tracksViewChanges={trackChanges}
      >
        <View className="items-center justify-center">
          {/* 👇 YOUR NEW HIGH-PERFORMANCE PNG */}
          <Image
            source={icon || require("../assets/icons/activity-location.png")}
            style={{
              width: pinSize,
              height: pinSize,
              resizeMode: "contain",
            }}
          />

          {/* The Title Label */}
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
