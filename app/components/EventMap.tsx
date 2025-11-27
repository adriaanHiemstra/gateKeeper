import React, { useRef, useEffect, useState } from "react";
import { View, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { MapPin, Building2 } from "lucide-react-native"; // 👈 Icons
import { mapStyle } from "../styles/mapStyle";

type EventType = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  category: string;
};

type VenueType = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  address: string;
};

type Props = {
  events: EventType[];
  venues: VenueType[];
  onSelectEvent: (event: EventType) => void;
  onSelectVenue: (venue: VenueType) => void;
  selectedEvent: EventType | null;
};

const EventMap = ({
  events,
  venues,
  onSelectEvent,
  onSelectVenue,
  selectedEvent,
}: Props) => {
  const mapRef = useRef<MapView>(null);
  const [showLabels, setShowLabels] = useState(false);

  // Animate to selected event
  useEffect(() => {
    if (selectedEvent) {
      mapRef.current?.animateToRegion(
        {
          latitude: selectedEvent.lat,
          longitude: selectedEvent.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
    }
  }, [selectedEvent]);

  // Handle Zoom Level to Toggle Labels
  const handleRegionChange = (region: Region) => {
    if (region.latitudeDelta < 0.045) {
      if (!showLabels) setShowLabels(true);
    } else {
      if (showLabels) setShowLabels(false);
    }
  };

  const getMarkerColor = (category: string) => {
    const cat = category.toLowerCase();
    if (["techno", "house", "music"].some((x) => cat.includes(x)))
      return "#A855F7";
    if (["rugby", "soccer", "sport"].some((x) => cat.includes(x)))
      return "#F97316";
    if (["hikes", "nature", "outdoors"].some((x) => cat.includes(x)))
      return "#10B981";
    return "#FA8900";
  };

  return (
    <View className="flex-1 w-full h-full">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        showsUserLocation={false}
        onRegionChangeComplete={handleRegionChange}
        initialRegion={{
          latitude: -33.9249,
          longitude: 18.4241,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {/* 1. EVENT MARKERS (Classic Pins) */}
        {events.map((event) => {
          const isSelected = selectedEvent && selectedEvent.id === event.id;
          const color = getMarkerColor(event.category);
          const shouldShowLabel = isSelected || showLabels;

          return (
            <Marker
              key={`event-${event.id}-${shouldShowLabel}`}
              coordinate={{ latitude: event.lat, longitude: event.lng }}
              onPress={() => onSelectEvent(event)}
              zIndex={isSelected ? 20 : 10}
              tracksViewChanges={isSelected || shouldShowLabel}
            >
              <View className="items-center justify-center">
                {/* THE CLASSIC PIN ICON */}
                {/* We use the Lucide MapPin. 
                     - fill={color} makes the body colored 
                     - color="white" makes the outline white (high contrast)
                 */}
                <MapPin
                  size={isSelected ? 54 : 42}
                  color="white"
                  fill={color}
                  strokeWidth={1.5}
                />

                {/* Label (Floating below) */}
                {shouldShowLabel && (
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
        })}

        {/* 2. VENUE MARKERS (Building Icon) */}
        {venues.map((venue) => (
          <Marker
            key={`venue-${venue.id}-${showLabels}`}
            coordinate={{ latitude: venue.lat, longitude: venue.lng }}
            onPress={() => onSelectVenue(venue)}
            zIndex={5}
            tracksViewChanges={showLabels}
          >
            <View className="items-center">
              {/* BUILDING ICON CONTAINER */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#D087FF", // Neon Purple
                  borderRadius: 10, // Soft Square
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

              {/* Small Arrow at bottom to point to location */}
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

              {/* Label */}
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
        ))}
      </MapView>
    </View>
  );
};

export default EventMap;
