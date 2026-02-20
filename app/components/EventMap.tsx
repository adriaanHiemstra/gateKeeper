import React, { useRef, useEffect, useState } from "react";
import { View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { mapStyle } from "../styles/mapStyle";

// Import your newly separated components
import EventMarker from "./EventMarker";
import VenueMarker from "./VenueMarker";

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
        {events.map((event) => (
          <EventMarker
            key={`event-${event.id}`}
            event={event}
            isSelected={selectedEvent?.id === event.id}
            showLabels={selectedEvent?.id === event.id || showLabels}
            onSelect={onSelectEvent}
          />
        ))}

        {venues.map((venue) => (
          <VenueMarker
            key={`venue-${venue.id}`}
            venue={venue}
            showLabels={showLabels}
            onSelect={onSelectVenue}
          />
        ))}
      </MapView>
    </View>
  );
};

export default EventMap;
