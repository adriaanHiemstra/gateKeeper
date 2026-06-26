import React, { useState, useMemo, useCallback, useEffect } from "react";
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

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Category Helpers ─────────────────────────────────────────────────────────

const GET_CATEGORY_COLOR = (
  name: string,
  groupedCategories: Record<string, string[]>,
) => {
  if (!name) return "#FA8900";

  let targetGroup = name;
  if (!groupedCategories[name]) {
    for (const [group, cats] of Object.entries(groupedCategories)) {
      if (cats.includes(name)) {
        targetGroup = group;
        break;
      }
    }
  }

  const g = targetGroup.toLowerCase();
  if (g.includes("music")) return "#A855F7";
  if (g.includes("sport")) return "#F43F5E";
  if (g.includes("active")) return "#F97316";
  if (g.includes("show")) return "#10B981";
  if (g.includes("food") || g.includes("restaurant")) return "#3B82F6";
  return "#FA8900";
};

const GET_CATEGORY_ICON = (
  name: string,
  groupedCategories: Record<string, string[]>,
) => {
  let targetGroup = name || "";

  if (name && !groupedCategories[name]) {
    for (const [group, cats] of Object.entries(groupedCategories)) {
      if (cats.includes(name)) {
        targetGroup = group;
        break;
      }
    }
  }

  const g = targetGroup.toLowerCase();
  if (g.includes("music")) return require("../assets/icons/music-location.png");
  if (g.includes("sport"))
    return require("../assets/icons/sports-location.png");
  if (g.includes("show")) return require("../assets/icons/shows-location.png");
  if (g.includes("food") || g.includes("restaurant"))
    return require("../assets/icons/food-location.png");
  return require("../assets/icons/activity-location.png");
};

// ─── Component ────────────────────────────────────────────────────────────────

const MapScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ── State ──────────────────────────────────────────────────────────────────
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

  // ── Data Fetching ──────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, []),
  );

  const fetchAll = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Step 1: Fetch categories first, build grouped map as a LOCAL variable
      // so it's immediately available for icon/color calculation below —
      // we can't rely on state here since setGroupedCategories is async.
      const { data: catData } = await supabase
        .from("categories")
        .select("name, group_name")
        .order("name", { ascending: true });

      const grouped: Record<string, string[]> = {};
      if (catData) {
        catData.forEach((curr) => {
          const group = curr.group_name || "Other";
          if (!grouped[group]) grouped[group] = [];
          grouped[group].push(curr.name);
        });
        setGroupedCategories(grouped);
      }

      // Step 2: Fetch venues and events in parallel
      const [{ data: venuesData }, { data: eventsData }] = await Promise.all([
        supabase.from("venues").select("*"),
        supabase
          .from("events")
          .select(`*, venues ( id, name, lat, lng )`)
          .gte("date", now)
          .eq("is_public", true),
      ]);

      if (venuesData) setVenues(venuesData);

      // Step 3: Format events — use local `grouped`, not `groupedCategories` state
      if (eventsData) {
        const formattedEvents = eventsData.map((event) => {
          const jitterLat = (Math.random() - 0.5) * 0.0005;
          const jitterLng = (Math.random() - 0.5) * 0.0005;

          const latitude = (event.lat || event.venues?.lat || 0) + jitterLat;
          const longitude = (event.lng || event.venues?.lng || 0) + jitterLng;

          let safeCategories: string[] = [];
          if (Array.isArray(event.categories)) {
            safeCategories = event.categories;
          } else if (typeof event.categories === "string") {
            try {
              safeCategories = JSON.parse(event.categories);
            } catch {
              safeCategories = [event.categories];
            }
          } else if (event.category) {
            safeCategories = [event.category];
          }

          const primaryCat = safeCategories?.[0] || "Other";
          const markerColor = GET_CATEGORY_COLOR(primaryCat, grouped);
          const markerIcon = GET_CATEGORY_ICON(primaryCat, grouped);

          return {
            ...event,
            id: event.id,
            title: event.title,
            categories: safeCategories,
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
            markerColor,
            markerIcon,
          };
        });

        const validEvents = formattedEvents.filter(
          (e) => e.lat !== 0 && e.lng !== 0,
        );
        setEvents(validEvents);
      }
    } catch (err) {
      console.error("Map Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchesSearch =
          (event.title || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (event.description || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        let matchesCategory = true;
        if (selectedCategory) {
          const eventCats = Array.isArray(event.categories)
            ? event.categories
            : [];

          if (groupedCategories[selectedCategory]) {
            const groupCats = groupedCategories[selectedCategory];
            matchesCategory = eventCats.some((c: string) =>
              groupCats.includes(c),
            );
          } else {
            matchesCategory = eventCats.includes(selectedCategory);
          }
        }

        let matchesTime = true;
        const eventDate = new Date(event.date);
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );

        if (selectedTime === "Today") {
          const endOfToday = new Date(
            startOfToday.getTime() + 24 * 60 * 60 * 1000,
          );
          matchesTime = eventDate >= startOfToday && eventDate < endOfToday;
        } else if (selectedTime === "Tomorrow") {
          const startOfTomorrow = new Date(
            startOfToday.getTime() + 24 * 60 * 60 * 1000,
          );
          const endOfTomorrow = new Date(
            startOfTomorrow.getTime() + 24 * 60 * 60 * 1000,
          );
          matchesTime =
            eventDate >= startOfTomorrow && eventDate < endOfTomorrow;
        } else if (selectedTime === "This Week") {
          const endOfWeek = new Date(startOfToday);
          endOfWeek.setDate(
            startOfToday.getDate() + (7 - (startOfToday.getDay() || 7)),
          );
          endOfWeek.setHours(23, 59, 59, 999);
          matchesTime = eventDate >= startOfToday && eventDate <= endOfWeek;
        } else if (selectedTime === "This Month") {
          const endOf30Days = new Date(
            startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000,
          );
          endOf30Days.setHours(23, 59, 59, 999);
          matchesTime = eventDate >= startOfToday && eventDate <= endOf30Days;
        } else if (selectedTime === "Custom" && customStartDate) {
          const start = new Date(customStartDate);
          const end = customEndDate
            ? new Date(customEndDate)
            : new Date(customStartDate);
          end.setHours(23, 59, 59, 999);
          matchesTime = eventDate >= start && eventDate <= end;
        }

        return matchesSearch && matchesCategory && matchesTime;
      })
      .slice(0, 150);
  }, [
    searchQuery,
    selectedCategory,
    selectedTime,
    customStartDate,
    customEndDate,
    events,
    groupedCategories,
  ]);

  // Clear selectedEvent if the active filter hides it
  useEffect(() => {
    if (selectedEvent) {
      const stillVisible = filteredEvents.some(
        (e: any) => e.id === selectedEvent.id,
      );
      if (!stillVisible) setSelectedEvent(null);
    }
  }, [filteredEvents, selectedEvent]);

  const filteredVenues = useMemo(() => {
    if (!searchQuery) return venues;
    return venues.filter((venue) =>
      (venue.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, venues]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectResult = (item: any) => {
    setSearchQuery(item.title || item.name);
    Keyboard.dismiss();
    setIsSearching(false);
    if (item.categories) {
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

  const handleSelectEvent = useCallback((ev: any) => {
    setSelectedVenue(null);
    setSelectedEvent(ev);
    setIsSearching(false);
    Keyboard.dismiss();
  }, []);

  const handleSelectVenue = useCallback((venue: any) => {
    setSelectedEvent(null);
    setSelectedVenue(venue);
  }, []);

  const todayDateString = new Date().toISOString().split("T")[0];

  // ── Render ─────────────────────────────────────────────────────────────────

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
        onSelectEvent={handleSelectEvent}
        onSelectVenue={handleSelectVenue}
        selectedEvent={selectedEvent}
      />

      <SafeAreaView
        className="absolute top-0 left-0 right-0 z-20"
        edges={["top"]}
      >
        <View className="px-4 pt-2">
          {/* Search + Time filter row */}
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

          {/* Active custom date badge */}
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

          {/* Search results dropdown */}
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

          {/* Time dropdown */}
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

          {/* Category filter pills */}
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
                const color = GET_CATEGORY_COLOR(cat, groupedCategories);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setSelectedCategory(isSelected ? null : cat);
                      setSelectedEvent(null);
                    }}
                    style={{
                      backgroundColor: isSelected ? color : "#1E1E1E95",
                      borderColor: isSelected ? color : "rgba(255,255,255,0.5)",
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

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-[#121212] h-[85%] rounded-t-[30px] border-t border-white/10 shadow-2xl">
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
                    <Text className="text-gray-400 font-bold mb-3 uppercase tracking-wider text-xs">
                      {superCategory}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {subCategories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        const color = GET_CATEGORY_COLOR(
                          cat,
                          groupedCategories,
                        );
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
                ),
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

      {/* ── Bottom cards ───────────────────────────────────────────────────── */}

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
