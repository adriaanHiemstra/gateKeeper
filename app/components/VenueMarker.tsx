import React, { useState, useEffect, memo } from "react";
import { View, Text, Platform } from "react-native";
import { Marker } from "react-native-maps";
import { Building2 } from "lucide-react-native";

const VenueMarker = memo(({ venue, showLabels, onSelect }: any) => {
  const [trackChanges, setTrackChanges] = useState(true);

  useEffect(() => {
    setTrackChanges(true);
    const timer = setTimeout(() => setTrackChanges(false), 500);
    return () => clearTimeout(timer);
  }, [showLabels]);

  return (
    <Marker
      coordinate={{ latitude: venue.lat, longitude: venue.lng }}
      onPress={() => onSelect(venue)}
      zIndex={5}
      tracksViewChanges={Platform.OS === "ios" ? trackChanges : false}
    >
      <View className="items-center">
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: "#D087FF",
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "white",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 3,
          }}
        >
          <Building2 color="white" size={20} strokeWidth={2.5} />
        </View>

        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 4,
            borderLeftColor: "transparent",
            borderRightWidth: 4,
            borderRightColor: "transparent",
            borderTopWidth: 5,
            borderTopColor: "#D087FF",
            marginTop: -1,
          }}
        />

        {showLabels && (
          <View className="mt-1 bg-[#1E1E1E]/80 px-2 py-0.5 rounded-md border border-white/10">
            <Text
              className="text-purple-200 text-[9px] font-bold"
              numberOfLines={1}
            >
              {venue.title}
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
});

export default VenueMarker;
