import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Search,
  Clock,
  X,
  Check,
  MapPin,
  Calendar as CalendarIcon,
  Grid2X2,
} from "lucide-react-native";
import { Calendar as RNCalendar } from "react-native-calendars";

// Components
import EventMap from "../components/EventMap";
import MapCard from "../components/MapCard";
import VenueMapCard from "../components/VenueMapCard";
import BottomNav from "../components/BottomNav";

// Database
import { supabase } from "../lib/supabase";

// Types
import { RootStackParamList } from "../types/types";

// ✅ QUICK FILTERS (Shown on the map)
const QUICK_CATEGORIES = [
  "Music",
  "Sports",
  "Markets",
  "Shows",
  "Restaurants",
  "Outdoors",
];

const TIME_OPTIONS = [
  "Any Time",
  "Today",
  "Tomorrow",
  "This Week",
  "This Month",
  "Custom",
];

const GET_CATEGORY_COLOR = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (
    ["techno", "house", "music", "live music", "clubbing", "hip hop"].some(
      (x) => cat.includes(x)
    )
  )
    return "#A855F7";
  if (["sports", "rugby", "running", "yoga"].some((x) => cat.includes(x)))
    return "#F97316";
  if (["shows", "comedy", "theater"].some((x) => cat.includes(x)))
    return "#3B82F6";
  if (["outdoors", "hikes"].some((x) => cat.includes(x))) return "#10B981";
  if (["restaurants", "food", "dining", "bars"].some((x) => cat.includes(x)))
    return "#EF4444";
  if (["markets"].some((x) => cat.includes(x))) return "#EAB308";
  return "#FA8900";
};

// ==========================================
// MAIN COMPONENT STARTS HERE
// ==========================================
const MapScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ✅ 1. ALL HOOKS MUST LIVE INSIDE THE COMPONENT
  const [groupedCategories, setGroupedCategories] = useState<
    Record<string, string[]>
  >({});

  const [events, setEvents] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [selectedTime, setSelectedTime] = useState("Any Time");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [activeDateModal, setActiveDateModal] = useState<
    "start" | "end" | null
  >(null);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ 2. TRIGGER THE FETCH WHEN THE SCREEN LOADS
  useFocusEffect(
    useCallback(() => {
      fetchMapData();
      fetchCategories(); // MUST CALL IT HERE!
    }, [])
  );

  // ✅ 3. FETCH CATEGORIES FUNCTION
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("name, group_name")
        .order("name", { ascending: true });

      if (data) {
        const grouped = data.reduce((acc: Record<string, string[]>, curr) => {
          const group = curr.group_name || "Other";
          if (!acc[group]) acc[group] = [];
          acc[group].push(curr.name);
          return acc;
        }, {});
        setGroupedCategories(grouped);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { data: venuesData } = await supabase.from("venues").select("*");
      if (venuesData) setVenues(venuesData);

      const { data: eventsData, error } = await supabase
        .from("events")
        .select(`*, venues ( id, name, lat, lng )`)
        .gte("date", now)
        .eq("is_public", true);

      if (eventsData) {
        const formattedEvents = eventsData.map((event) => {
          const latitude = event.lat || event.venues?.lat || 0;
          const longitude = event.lng || event.venues?.lng || 0;
          return {
            ...event,
            id: event.id,
            title: event.title,
            category: event.category || "Other",
            description: event.description,
            lat: latitude,
            lng: longitude,
            location: event.venues?.name || event.location_text || "Unknown",
            time: new Date(event.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            image: event.banner_url
              ? { uri: event.banner_url }
              : require("../assets/imagePlaceHolder1.png"),
          };
        });
        const validEvents = formattedEvents.filter(
          (e) => e.lat !== 0 && e.lng !== 0
        );
        setEvents(validEvents);
      }
    } catch (err) {
      console.error("Map Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ... (Keep your filteredEvents and the rest of the file exactly the same)

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        (event.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory
        ? (event.category || "") === selectedCategory
        : true;

      let matchesTime = true;
      const eventDate = new Date(event.date);
      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (selectedTime === "Today") {
        const endOfToday = new Date(
          startOfToday.getTime() + 24 * 60 * 60 * 1000
        );
        matchesTime = eventDate >= startOfToday && eventDate < endOfToday;
      } else if (selectedTime === "Tomorrow") {
        const startOfTomorrow = new Date(
          startOfToday.getTime() + 24 * 60 * 60 * 1000
        );
        const endOfTomorrow = new Date(
          startOfTomorrow.getTime() + 24 * 60 * 60 * 1000
        );
        matchesTime = eventDate >= startOfTomorrow && eventDate < endOfTomorrow;
      } else if (selectedTime === "This Week") {
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(
          startOfToday.getDate() + (7 - (startOfToday.getDay() || 7))
        );
        endOfWeek.setHours(23, 59, 59, 999);
        matchesTime = eventDate >= startOfToday && eventDate <= endOfWeek;
      } else if (selectedTime === "This Month") {
        const endOfMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        matchesTime = eventDate >= startOfToday && eventDate <= endOfMonth;
      } else if (selectedTime === "Custom" && customStartDate) {
        const start = new Date(customStartDate);
        const end = customEndDate
          ? new Date(customEndDate)
          : new Date(customStartDate);
        end.setHours(23, 59, 59, 999);
        matchesTime = eventDate >= start && eventDate <= end;
      }

      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedTime,
    customStartDate,
    customEndDate,
    events,
  ]);

  const filteredVenues = useMemo(() => {
    if (!searchQuery) return venues;
    return venues.filter((venue) =>
      (venue.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, venues]);

  const handleSelectResult = (item: any) => {
    setSearchQuery(item.title || item.name);
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

  const handleTimeSelect = (time: string) => {
    setShowTimeDropdown(false);
    setSelectedEvent(null);
    if (time === "Custom") {
      setActiveDateModal("start");
      setCustomStartDate(null);
      setCustomEndDate(null);
    } else {
      setSelectedTime(time);
    }
  };

  const todayDateString = new Date().toISOString().split("T")[0];

  return (
    <View className="flex-1 bg-black">
      {loading && (
        <View className="absolute inset-0 bg-black/50 z-50 justify-center items-center">
          <ActivityIndicator size="large" color="#FA8900" />
        </View>
      )}

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
                  setIsSearching(text.length > 0);
                }}
                onFocus={() => {
                  setSelectedEvent(null);
                  setSelectedVenue(null);
                  if (searchQuery.length > 0) setIsSearching(true);
                }}
                className="flex-1 text-white font-medium text-base h-full ml-1"
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
                showTimeDropdown || selectedTime !== "Any Time"
                  ? "bg-white border-white"
                  : "bg-[#1E1E1E]/95 border-white/10"
              }`}
            >
              <Clock
                color={
                  showTimeDropdown || selectedTime !== "Any Time"
                    ? "black"
                    : "#FA8900"
                }
                size={22}
              />
            </TouchableOpacity>
          </View>

          {selectedTime === "Custom" && customStartDate && !isSearching && (
            <View className="flex-row items-center bg-orange-500/20 border border-orange-500/50 rounded-full self-start px-3 py-1.5 mb-3 ml-1">
              <CalendarIcon color="#FA8900" size={14} className="mr-2" />
              <Text className="text-orange-400 font-bold text-xs">
                {customStartDate}{" "}
                {customEndDate && customEndDate !== customStartDate
                  ? `- ${customEndDate}`
                  : ""}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedTime("Any Time")}
                className="ml-2"
              >
                <X color="#FA8900" size={14} />
              </TouchableOpacity>
            </View>
          )}

          {isSearching && (
            <View className="absolute top-[60px] left-4 right-16 bg-[#1E1E1E] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
              {filteredEvents.slice(0, 3).map((item) => (
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
              {filteredVenues.slice(0, 2).map((item) => (
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
                      {item.name || item.title}
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
                  onPress={() => handleTimeSelect(time)}
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

          {/* ✅ UPDATED CATEGORY CHIPS (Includes "More") */}
          {!isSearching && (
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

              {QUICK_CATEGORIES.map((cat) => {
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
                      borderColor: isSelected ? color : "rgba(255,255,255,0.2)",
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

              {/* THE "MORE" BUTTON */}
              <TouchableOpacity
                onPress={() => setShowCategoryModal(true)}
                className="mr-4 px-4 py-2 rounded-full border border-dashed border-white/40 bg-[#1E1E1E]/60 flex-row items-center"
              >
                <Grid2X2 color="#ccc" size={14} className="mr-2" />
                <Text className="font-bold text-sm text-gray-300 ml-1">
                  More Categories
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* --- ALL CATEGORIES MODAL (BOTTOM SHEET) --- */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-[#121212] h-[85%] rounded-t-[30px] border-t border-white/10 shadow-2xl">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-5 border-b border-white/10 bg-[#1E1E1E] rounded-t-[30px]">
              <Text
                className="text-white text-2xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Explore
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={20} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Categories List */}
            <ScrollView
              className="flex-1 px-6 pt-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              {Object.entries(groupedCategories).map(
                ([superCategory, subCategories]) => (
                  <View
                    key={superCategory}
                    className="mb-6 border-b border-white/5 pb-4"
                  >
                    {/* Prints: "ACTIVE", "FOOD", etc. */}
                    <Text className="text-gray-400 font-bold mb-3 uppercase tracking-wider text-xs">
                      {superCategory}
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                      {/* Prints the buttons for Padel, Yoga, etc. */}
                      {subCategories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        const color = GET_CATEGORY_COLOR(cat);

                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => {
                              setSelectedCategory(isSelected ? null : cat);
                              setSelectedEvent(null);
                              setShowCategoryModal(false);
                            }}
                            style={{
                              backgroundColor: isSelected ? color : "#1E1E1E",
                              borderColor: isSelected
                                ? color
                                : "rgba(255,255,255,0.1)",
                              borderWidth: 1,
                            }}
                            className="px-4 py-2.5 rounded-xl flex-row items-center"
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
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- CUSTOM DATE CALENDAR MODAL --- */}
      <Modal visible={!!activeDateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 h-[70%]">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <View>
                <Text className="text-white text-2xl font-bold">
                  {activeDateModal === "start"
                    ? "Select Start Date"
                    : "Select End Date (Optional)"}
                </Text>
                {activeDateModal === "end" && (
                  <Text className="text-gray-400 text-sm mt-1">
                    Tap the same date for a single day event.
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setActiveDateModal(null);
                  if (activeDateModal === "start") setSelectedTime("Any Time");
                }}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <RNCalendar
              minDate={
                activeDateModal === "end" && customStartDate
                  ? customStartDate
                  : todayDateString
              }
              onDayPress={(day: any) => {
                if (activeDateModal === "start") {
                  setCustomStartDate(day.dateString);
                  setActiveDateModal("end");
                } else {
                  setCustomEndDate(day.dateString);
                  setSelectedTime("Custom");
                  setActiveDateModal(null);
                }
              }}
              theme={{
                backgroundColor: "#1E1E1E",
                calendarBackground: "#1E1E1E",
                dayTextColor: "#ffffff",
                todayTextColor: "#FA8900",
                selectedDayBackgroundColor: "#FA8900",
                selectedDayTextColor: "#ffffff",
                monthTextColor: "white",
                arrowColor: "#FA8900",
                textDisabledColor: "#444",
              }}
            />
          </View>
        </View>
      </Modal>

      {selectedEvent && !isSearching && (
        <MapCard
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onViewEvent={() => {
            navigation.navigate("EventProfile", {
              eventId: selectedEvent.id,
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
              venueName: selectedVenue.name || selectedVenue.title,
            });
          }}
        />
      )}

      <BottomNav />
    </View>
  );
};

export default MapScreen;
