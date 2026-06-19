import React, { useRef, useState, useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import MapView, { PROVIDER_GOOGLE, Region, Marker } from "react-native-maps";
import { useClusterer } from "react-native-clusterer";
import { Layers } from "lucide-react-native";
import { mapStyle } from "../styles/mapStyle";
import EventMarker from "./EventMarker";
import VenueMarker from "./VenueMarker";

const { width, height } = Dimensions.get("window");

// We pull the map dimensions outside the component so it stays exactly the same in memory
const mapDimensions = { width, height };

// ─── Types ────────────────────────────────────────────────────────────────────

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
  name?: string;
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
  onRegionChange?: (region: Region) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

const EventMap = ({
  events,
  venues,
  onSelectEvent,
  onSelectVenue,
  selectedEvent,
  onRegionChange,
}: Props) => {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>({
    latitude: -33.9249,
    longitude: 18.4241,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [showLabels, setShowLabels] = useState(false);

  // We wrap the points calculation in useMemo so the app 'memorizes' the array
  // It will only run this heavy calculation if the 'events' list actually changes!
  const points = useMemo(() => {
    return events.map((event: EventType) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [event.lng, event.lat],
      },
      properties: { event },
    }));
  }, [events]);

  // useClusterer runs the supercluster algorithm natively
  const [clusters, supercluster] = useClusterer(points, mapDimensions, region);

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    setShowLabels(newRegion.latitudeDelta < 0.045);
    onRegionChange?.(newRegion);
  };

  return (
    <View className="flex-1 w-full h-full">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        onRegionChangeComplete={handleRegionChange}
        initialRegion={region}
      >
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const isCluster = (cluster.properties as any)?.cluster;

          if (isCluster) {
            const clusterProps = cluster.properties as any;
            const count = clusterProps.point_count;
            return (
              <Marker
                key={`cluster-${clusterProps.cluster_id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: region.latitudeDelta / 5,
                      longitudeDelta: region.longitudeDelta / 5,
                    },
                    600,
                  );
                }}
                tracksViewChanges={false}
              >
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 24,
                    backgroundColor: "#FA8900",
                    borderWidth: 2,
                    borderColor: "white",
                    alignItems: "center",
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
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
                  >
                    {count}
                  </Text>
                </View>
              </Marker>
            );
          }

          // Individual event marker
          const event: EventType = cluster.properties.event;
          return (
            <EventMarker
              key={`event-${event.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              event={event}
              icon={event.markerIcon}
              color={event.markerColor}
              isSelected={selectedEvent?.id === event.id}
              showLabels={selectedEvent?.id === event.id || showLabels}
              onSelect={onSelectEvent}
            />
          );
        })}

        {venues.map((venue: VenueType) => (
          <VenueMarker
            key={`venue-${venue.id}`}
            coordinate={{ latitude: venue.lat, longitude: venue.lng }}
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
