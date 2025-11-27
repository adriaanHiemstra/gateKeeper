import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Search,
  Clock,
  X,
  Check,
  MapPin,
  ChevronRight,
} from "lucide-react-native";

// Components
import EventMap from "../components/EventMap";
import MapCard from "../components/MapCard";
import VenueMapCard from "../components/VenueMapCard";
import BottomNav from "../components/BottomNav";

// Types
import { RootStackParamList } from "../types/types";

const ALL_EVENTS = [
  {
    id: "1",
    title: "Neon Jungle",
    category: "Techno",
    lat: -33.9249,
    lng: 18.4241,
    image: require("../assets/imagePlaceHolder1.png"),
    time: "Tonight, 20:00",
    location: "Clifton 4th",
    description: "The biggest techno party of the summer.",
  },
  {
    id: "2",
    title: "Rugby Finals",
    category: "Sports",
    lat: -33.902,
    lng: 18.4133,
    image: require("../assets/imagePlaceHolder2.png"),
    time: "Sat, 14:00",
    location: "Green Point Stadium",
    description: "Stormers vs Bulls. The final showdown.",
  },
  {
    id: "3",
    title: "Forest Run",
    category: "Outdoors",
    lat: -33.97,
    lng: 18.45,
    image: require("../assets/imagePlaceHolder3.png"),
    time: "Sun, 06:00",
    location: "Newlands Forest",
    description: "5km and 10km trail run through the forest.",
  },
  {
    id: "4",
    title: "Comedy Night",
    category: "Shows",
    lat: -33.926,
    lng: 18.41,
    image: require("../assets/imagePlaceHolder4.png"),
    time: "Fri, 19:00",
    location: "Cape Town Comedy Club",
    description: "Laugh until you cry with SA top comics.",
  },
];

const ALL_VENUES = [
  {
    id: "v1",
    title: "Green Point Stadium",
    lat: -33.903,
    lng: 18.411,
    address: "Fritz Sonnenberg Rd",
  },
  {
    id: "v2",
    title: "The Power Station",
    lat: -33.928,
    lng: 18.424,
    address: "100 Strand St",
  },
  {
    id: "v3",
    title: "Shimmy Beach Club",
    lat: -33.9,
    lng: 18.42,
    address: "12 S Arm Rd",
  },
];

const CATEGORIES = [
  "Techno",
  "Sports",
  "Outdoors",
  "Shows",
  "Live Music",
  "Markets",
];
const TIME_OPTIONS = ["Any Time", "Tonight", "Tomorrow", "This Weekend"];

const GET_CATEGORY_COLOR = (category: string) => {
  const cat = category.toLowerCase();
  if (["techno", "house", "music"].some((x) => cat.includes(x)))
    return "#A855F7";
  if (["sports", "rugby"].some((x) => cat.includes(x))) return "#F97316";
  if (["outdoors", "hikes"].some((x) => cat.includes(x))) return "#10B981";
  if (["shows", "comedy"].some((x) => cat.includes(x))) return "#3B82F6";
  return "#FA8900";
};

const MapScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("Any Time");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const filteredEvents = useMemo(() => {
    return ALL_EVENTS.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? event.category === selectedCategory
        : true;
      const matchesTime = selectedTime === "Any Time" ? true : true;
      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [searchQuery, selectedCategory, selectedTime]);

  const filteredVenues = useMemo(() => {
    if (!searchQuery) return ALL_VENUES;
    return ALL_VENUES.filter((venue) =>
      venue.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectResult = (item: any) => {
    setSearchQuery(item.title);
    Keyboard.dismiss();
    setIsSearching(false);
    if (item.category) {
      setSelectedVenue(null);
      setSelectedEvent(item);
    } else {
      setSelectedEvent(null);
      setSelectedVenue(item);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <EventMap
        events={filteredEvents}
        venues={filteredVenues}
        onSelectEvent={(ev) => {
          setSelectedVenue(null);
          setSelectedEvent(ev);
          setIsSearching(false);
          Keyboard.dismiss();
        }}
        onSelectVenue={(venue) => {
          setSelectedEvent(null);
          setSelectedVenue(venue);
        }}
        selectedEvent={selectedEvent}
      />

      <SafeAreaView
        className="absolute top-0 left-0 right-0 z-20"
        edges={["top"]}
      >
        <View className="px-4 pt-2">
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 flex-row items-center bg-[#1E1E1E]/95 border border-white/10 rounded-2xl px-4 h-12 shadow-lg">
              <Search color="#FA8900" size={20} className="mr-3" />
              <TextInput
                placeholder="Search map..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.length > 0) setIsSearching(true);
                  else setIsSearching(false);
                }}
                onFocus={() => {
                  setSelectedEvent(null);
                  setSelectedVenue(null);
                  if (searchQuery.length > 0) setIsSearching(true);
                }}
                className="flex-1 text-white font-medium text-base h-full"
                style={{ fontFamily: "Jost-Medium" }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setIsSearching(false);
                    Keyboard.dismiss();
                  }}
                >
                  <X color="#666" size={18} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowTimeDropdown(!showTimeDropdown)}
              className={`w-12 h-12 items-center justify-center rounded-2xl shadow-lg border ${
                showTimeDropdown
                  ? "bg-white border-white"
                  : "bg-[#1E1E1E]/95 border-white/10"
              }`}
            >
              <Clock color={showTimeDropdown ? "black" : "#FA8900"} size={22} />
            </TouchableOpacity>
          </View>

          {isSearching && (
            <View className="absolute top-[60px] left-4 right-16 bg-[#1E1E1E] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
              {filteredEvents.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectResult(item)}
                  className="flex-row items-center p-3 border-b border-white/5"
                >
                  <View className="bg-white/10 p-2 rounded-full mr-3">
                    <MapPin color="#FA8900" size={16} />
                  </View>
                  <Text className="text-white font-bold text-base flex-1">
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
              {filteredVenues.slice(0, 2).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectResult(item)}
                  className="flex-row items-center p-3 border-b border-white/5 bg-purple-500/10"
                >
                  <View className="bg-purple-500/20 p-2 rounded-full mr-3">
                    <MapPin color="#D087FF" size={16} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">
                      {item.title}
                    </Text>
                    <Text className="text-gray-400 text-xs">Venue</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showTimeDropdown && (
            <View className="absolute top-16 right-4 bg-[#1E1E1E] border border-white/10 rounded-2xl p-2 shadow-xl w-40 z-50">
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => {
                    setSelectedTime(time);
                    setShowTimeDropdown(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-row justify-between items-center p-3 rounded-xl active:bg-white/5"
                >
                  <Text
                    className={`font-bold ${
                      selectedTime === time ? "text-[#FA8900]" : "text-white"
                    }`}
                  >
                    {time}
                  </Text>
                  {selectedTime === time && <Check color="#FA8900" size={16} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isSearching && (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategory(null);
                    setSelectedEvent(null);
                  }}
                  className={`mr-2 px-4 py-2 rounded-full border ${
                    !selectedCategory
                      ? "bg-white border-white"
                      : "bg-[#1E1E1E]/80 border-white/20"
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      !selectedCategory ? "text-black" : "text-white"
                    }`}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const color = GET_CATEGORY_COLOR(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setSelectedCategory(isSelected ? null : cat);
                        setSelectedEvent(null);
                      }}
                      style={{
                        backgroundColor: isSelected ? color : "#1E1E1E95",
                        borderColor: isSelected
                          ? color
                          : "rgba(255,255,255,0.2)",
                        borderWidth: 1,
                      }}
                      className="mr-2 px-4 py-2 rounded-full"
                    >
                      <Text
                        className={`font-bold text-sm ${
                          isSelected ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>

      {selectedEvent && !isSearching && (
        <MapCard
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onViewEvent={() => {
            navigation.navigate("EventProfile", {
              eventName: selectedEvent.title,
              attendees: 42,
              logo: selectedEvent.image,
              banner: selectedEvent.image,
              location: selectedEvent.location,
              time: selectedEvent.time,
              description: selectedEvent.description,
            });
          }}
        />
      )}

      {selectedVenue && !isSearching && (
        <VenueMapCard
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onViewVenue={() => {
            navigation.navigate("VenueProfile", {
              venueId: selectedVenue.id,
              venueName: selectedVenue.title,
            });
          }}
        />
      )}

      <BottomNav />
    </View>
  );
};

export default MapScreen;
