import React, { useRef, useEffect, useState } from "react";
import { View, Text } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import { PROVIDER_GOOGLE, Region, Marker } from "react-native-maps";
import { Layers } from "lucide-react-native"; // 👈 Your cluster icon
import { mapStyle } from "../styles/mapStyle";

import EventMarker from "./EventMarker";
import VenueMarker from "./VenueMarker";

type EventType = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  categories: string[];
  markerColor?: string;
  markerIcon?: any;
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
  const mapRef = useRef<any>(null);
  const [showLabels, setShowLabels] = useState(false);

  // 👇 1. Track the EXACT rectangular aspect ratio of the user's current zoom
  const [currentZoom, setCurrentZoom] = useState({
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  useEffect(() => {
    if (selectedEvent) {
      // 👇 2. SMART PANNING
      if (currentZoom.latitudeDelta > 0.02) {
        // If they are far away, zoom them in!
        mapRef.current?.animateToRegion(
          {
            latitude: selectedEvent.lat,
            longitude: selectedEvent.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          500,
        );
      } else {
        // If they are already zoomed in, KEEP their exact zoom and just slide the camera!
        mapRef.current?.animateToRegion(
          {
            latitude: selectedEvent.lat,
            longitude: selectedEvent.lng,
            latitudeDelta: currentZoom.latitudeDelta,
            longitudeDelta: currentZoom.longitudeDelta,
          },
          500,
        );
      }
    }
  }, [selectedEvent]);

  const handleRegionChange = (region: Region) => {
    // 👇 3. Save the exact dimensions every time they stop moving the map
    setCurrentZoom({
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });

    if (region.latitudeDelta < 0.045) {
      if (!showLabels) setShowLabels(true);
    } else {
      if (showLabels) setShowLabels(false);
    }
  };

  // 🔥 CUSTOM PILL CLUSTER UI
  const renderCluster = (cluster: any) => {
    const { id, geometry, onPress, properties } = cluster;
    const points = properties.point_count;

    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={{
          longitude: geometry.coordinates[0],
          latitude: geometry.coordinates[1],
        }}
        onPress={onPress}
        tracksViewChanges={false}
        zIndex={99}
      >
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 24,
            backgroundColor: "#FA8900", // GateKeeper Orange
            borderWidth: 2,
            borderColor: "white",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 5,
          }}
        >
          <Layers
            color="white"
            size={16}
            strokeWidth={2.5}
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            {points}
          </Text>
        </View>
      </Marker>
    );
  };

  return (
    <View className="flex-1 w-full h-full">
      <MapViewCluster
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        showsUserLocation={false}
        onRegionChangeComplete={handleRegionChange}
        renderCluster={renderCluster}
        // 👇 Performance tweaks applied here
        animationEnabled={false}
        radius={40} // Smaller radius means they break apart easier
        maxZoom={14} // Forces all clusters to break apart when zoomed in close
        initialRegion={{
          latitude: -33.9249,
          longitude: 18.4241,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {events.map((event) => (
          <EventMarker
            key={`event-${event.id}`}
            coordinate={{ latitude: event.lat, longitude: event.lng }}
            event={event}
            icon={event.markerIcon} // 👈 ADD THIS PROP
            color={event.markerColor}
            isSelected={selectedEvent?.id === event.id}
            showLabels={selectedEvent?.id === event.id || showLabels}
            onSelect={onSelectEvent}
          />
        ))}

        {venues.map((venue) => (
          <VenueMarker
            key={`venue-${venue.id}`}
            // 👇 CRITICAL FIX: Explicit coordinate prop
            coordinate={{ latitude: venue.lat, longitude: venue.lng }}
            venue={venue}
            showLabels={showLabels}
            onSelect={onSelectVenue}
          />
        ))}
      </MapViewCluster>
    </View>
  );
};

export default EventMap;
