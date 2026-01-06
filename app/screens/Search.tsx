// app/screens/SearchScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  ScrollView,
  Keyboard,
  Platform,
  LayoutAnimation,
  UIManager,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  X,
  Calendar as CalendarIcon,
  ArrowRight,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { CalendarList, DateData } from "react-native-calendars";

// Components & Config
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";
import EventFeedCard from "../components/EventFeedCard";
import { bannerGradient, fireGradient } from "../styles/colours";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- HELPERS ---

// 1. Helper for Category Colors
const GET_CATEGORY_COLOR = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (["techno", "house", "edm", "electronic"].some((x) => cat.includes(x)))
    return "#A855F7";
  if (["live", "rock", "jazz", "band"].some((x) => cat.includes(x)))
    return "#F43F5E";
  if (["sport", "rugby", "soccer"].some((x) => cat.includes(x)))
    return "#F97316";
  if (["hike", "nature", "outdoor"].some((x) => cat.includes(x)))
    return "#10B981";
  return "#3B82F6"; // Default blue
};

const ALL_INTERESTS = [
  "Techno",
  "House",
  "Live Music",
  "Jazz",
  "Rugby",
  "Soccer",
  "Hikes",
  "Comedy",
  "Theater",
];
const TIME_FILTERS = ["Today", "Tomorrow", "This Weekend", "This Month"];

// 2. Helper for Date Logic (INCORPORATED HERE)
const getDateRangeForFilter = (filter: string) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  // Set to start/end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (filter === "Today")
    return { start: start.toISOString(), end: end.toISOString() };

  if (filter === "Tomorrow") {
    start.setDate(now.getDate() + 1);
    end.setDate(now.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (filter === "This Weekend") {
    // Calculate next Friday
    const day = now.getDay();
    const dist = 5 - day + (day >= 5 ? 7 : 0);
    start.setDate(now.getDate() + dist);
    end.setDate(start.getDate() + 2); // Sunday
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (filter === "This Month") {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1);
    end.setDate(0);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  return null;
};

const SearchScreen = () => {
  const navigation = useNavigation<any>();

  // --- STATE ---
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTimeFilters, setActiveTimeFilters] = useState<string[]>([]);

  // Data State
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [isCustomDateActive, setIsCustomDateActive] = useState(false);

  // --- 1. SEARCH FUNCTION ---
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Start building the query
      const now = new Date().toISOString();

      let dbQuery = supabase
        .from("events")
        .select(
          `
          *,
          profiles:host_id ( username, avatar_url ),
          venues:venue_id ( name, address )
        `
        )
        .gte("date", now);

      // A. Text Search (Title OR Description)
      if (query.trim()) {
        const text = query.trim();
        dbQuery = dbQuery.or(
          `title.ilike.%${text}%,description.ilike.%${text}%`
        );
      }

      // B. Category Filter
      if (activeFilters.length > 0) {
        // Build a filter string: category.ilike.%Techno%,category.ilike.%House%
        const categoriesString = activeFilters
          .map((f) => `category.ilike.%${f}%`)
          .join(",");
        dbQuery = dbQuery.or(categoriesString);
      }

      // C. Date Filter logic
      let dateStart = null;
      let dateEnd = null;

      // Check Time Filters ("This Weekend" etc)
      if (activeTimeFilters.length > 0) {
        const range = getDateRangeForFilter(activeTimeFilters[0]); // ✅ USES THE HELPER HERE
        if (dateStart) dbQuery = dbQuery.gte("date", dateStart);
        if (dateEnd) dbQuery = dbQuery.lte("date", dateEnd);
      }
      // Check Custom Calendar
      else if (isCustomDateActive && startDate) {
        dateStart = startDate;
        dateEnd = endDate || startDate; // If single day selected
      }

      // Apply Date Filters
      if (dateStart) dbQuery = dbQuery.gte("date", dateStart);
      if (dateEnd) dbQuery = dbQuery.lte("date", dateEnd);

      // Order by date (soonest first)
      dbQuery = dbQuery.order("date", { ascending: true });

      const { data, error } = await dbQuery;

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.log("Search Error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    query,
    activeFilters,
    activeTimeFilters,
    startDate,
    endDate,
    isCustomDateActive,
  ]);

  // Initial Load
  useEffect(() => {
    fetchEvents();
  }, []);

  // --- ACTIONS ---
  const handleSearch = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
    fetchEvents();
  };

  const handleClear = () => {
    setQuery("");
    setActiveFilters([]);
    setActiveTimeFilters([]);
    setIsCustomDateActive(false);
    setStartDate(null);
    setEndDate(null);
    setMarkedDates({});
    // Reset to show all upcoming
    setTimeout(() => fetchEvents(), 100);
  };

  const toggleFilter = (category: string) => {
    setActiveFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleTimeFilter = (time: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCustomDateActive(false);
    // Allow only one time filter at a time for simplicity
    setActiveTimeFilters((prev) => (prev.includes(time) ? [] : [time]));
  };

  const handleCustomDatePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isCustomDateActive) {
      setIsCustomDateActive(false);
      setStartDate(null);
      setEndDate(null);
    } else {
      setIsCustomDateActive(true);
      setShowCalendar(true);
      setActiveTimeFilters([]);
    }
  };

  // --- CALENDAR LOGIC ---
  const onDayPress = (day: DateData) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
      setMarkedDates({
        [day.dateString]: {
          selected: true,
          startingDay: true,
          endingDay: true,
          color: "#FA8900",
          textColor: "white",
        },
      });
    } else {
      const range = getDaysArray(startDate, day.dateString);
      const newMarked: any = {};
      range.forEach((date, index) => {
        newMarked[date] = {
          selected: true,
          color: "#FA8900",
          textColor: "white",
        };
      });
      const d1 = new Date(startDate);
      const d2 = new Date(day.dateString);

      if (d1 > d2) {
        setStartDate(day.dateString);
        setEndDate(startDate);
      } else {
        setEndDate(day.dateString);
      }

      setMarkedDates(newMarked);
    }
  };

  const getDaysArray = (start: string, end: string) => {
    let arr = [];
    let dt = new Date(start);
    let edt = new Date(end);
    if (dt > edt) {
      const temp = dt;
      dt = edt;
      edt = temp;
    }
    while (dt <= edt) {
      arr.push(dt.toISOString().split("T")[0]);
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  };

  // --- RENDER ITEMS ---
  const FilterBubble = ({
    label,
    color = "#fff",
    isSelected,
    onPress,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderColor: color,
        borderWidth: 1.5,
        backgroundColor: isSelected ? color : "transparent",
        marginRight: 12,
        marginBottom: 14,
      }}
      className="px-5 py-3 rounded-full"
    >
      <Text
        className="font-bold text-base"
        style={{
          fontFamily: "Jost-Medium",
          color: isSelected ? "#000" : color,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="bg-black relative mb-1"
      style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.25 }}
      onPress={() => setSelectedEvent(item)}
    >
      <Image
        source={
          item.banner_url
            ? { uri: item.banner_url }
            : require("../assets/imagePlaceHolder1.png")
        }
        className="w-full h-full opacity-80"
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.9)"]}
        className="absolute bottom-0 left-0 right-0 p-4"
      >
        <Text
          className="text-white font-bold text-xl shadow-black"
          numberOfLines={2}
          style={{ fontFamily: "Jost-Medium" }}
        >
          {item.title}
        </Text>
        <Text
          className="text-xs font-bold uppercase tracking-wider mt-1"
          style={{ color: GET_CATEGORY_COLOR(item.category) }}
        >
          {item.category || "Event"}
        </Text>
        <Text className="text-gray-400 text-xs mt-1">
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 pt-32">
            {/* SEARCH BAR */}
            <View className="px-4 z-50 mb-2">
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-2 h-16">
                <Search color="#FA8900" size={28} className="ml-2 mr-3" />
                <TextInput
                  placeholder="Search events..."
                  placeholderTextColor="#999"
                  value={query}
                  onChangeText={(text) => {
                    setQuery(text);
                    if (!isExpanded) setIsExpanded(true);
                  }}
                  onFocus={() => setIsExpanded(true)}
                  className="flex-1 text-white text-xl font-medium h-full mx-2"
                  style={{ fontFamily: "Jost-Medium" }}
                  onSubmitEditing={handleSearch}
                />
                <View className="flex-row items-center gap-2">
                  {(query.length > 0 ||
                    activeFilters.length > 0 ||
                    activeTimeFilters.length > 0 ||
                    isCustomDateActive) && (
                    <TouchableOpacity
                      onPress={handleClear}
                      className="bg-white/10 p-1.5 rounded-full mr-1"
                    >
                      <X color="white" size={16} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleSearch}>
                    <LinearGradient
                      {...fireGradient}
                      className="w-10 h-10 rounded-xl items-center justify-center shadow-lg"
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <ArrowRight color="white" size={24} strokeWidth={3} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* EXPANDED FILTERS OR RESULTS */}
            {isExpanded ? (
              <View className="flex-1 px-4">
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 160 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text className="text-gray-400 text-sm font-bold uppercase mb-4 mt-2 ml-1">
                    Categories
                  </Text>
                  <View className="flex-row flex-wrap">
                    {ALL_INTERESTS.map((cat) => (
                      <FilterBubble
                        key={cat}
                        label={cat}
                        color={GET_CATEGORY_COLOR(cat)}
                        isSelected={activeFilters.includes(cat)}
                        onPress={() => toggleFilter(cat)}
                      />
                    ))}
                  </View>

                  <Text className="text-gray-400 text-sm font-bold uppercase mb-4 mt-6 ml-1">
                    Time Period
                  </Text>
                  <View className="flex-row flex-wrap">
                    {TIME_FILTERS.map((time) => (
                      <FilterBubble
                        key={time}
                        label={time}
                        color="#fff"
                        isSelected={activeTimeFilters.includes(time)}
                        onPress={() => toggleTimeFilter(time)}
                      />
                    ))}
                    <TouchableOpacity
                      onPress={handleCustomDatePress}
                      className={`px-5 py-3 rounded-full mr-3 mb-3 border-2 flex-row items-center ${
                        isCustomDateActive
                          ? "bg-white border-white"
                          : "border-gray-600 bg-transparent"
                      }`}
                    >
                      <CalendarIcon
                        color={isCustomDateActive ? "black" : "#9ca3af"}
                        size={18}
                        className="mx-2"
                      />
                      <Text
                        className={`font-bold text-base ml-2 ${
                          isCustomDateActive ? "text-black" : "text-gray-400"
                        }`}
                      >
                        {isCustomDateActive && startDate
                          ? "Selected"
                          : "Custom Date"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                ListHeaderComponent={
                  <Text
                    className="text-white text-2xl font-bold px-4 mb-4"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {results.length > 0
                      ? query
                        ? `Results for "${query}"`
                        : "Upcoming Events"
                      : ""}
                  </Text>
                }
                ListEmptyComponent={
                  !loading ? (
                    <View className="items-center justify-center mt-20 px-10">
                      <Search color="#333" size={64} className="mb-4" />
                      <Text className="text-white text-xl font-bold text-center mb-2">
                        No events found
                      </Text>
                      <Text className="text-gray-500 text-center">
                        Try adjusting your filters or search terms.
                      </Text>
                    </View>
                  ) : null
                }
                renderItem={renderEventItem}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* CALENDAR MODAL */}
      <Modal visible={showCalendar} transparent={true} animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-4 border-t border-white/10 h-[75%]">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <Text className="text-white text-2xl font-bold">
                Select Dates
              </Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <CalendarList
              markingType={"period"}
              markedDates={markedDates}
              onDayPress={onDayPress}
              theme={{
                backgroundColor: "#1E1E1E",
                calendarBackground: "#1E1E1E",
                dayTextColor: "#fff",
                monthTextColor: "#fff",
                selectedDayBackgroundColor: "#FA8900",
                selectedDayTextColor: "#fff",
                todayTextColor: "#FA8900",
                textDisabledColor: "#444",
                dotColor: "#FA8900",
                selectedDotColor: "#ffffff",
                arrowColor: "#FA8900",
                // monthTextColor: "white",
                indicatorColor: "white",
                textDayFontFamily: "Jost-Medium",
                textMonthFontFamily: "Jost-Medium",
                textDayHeaderFontFamily: "Jost-Medium",
              }}
              pastScrollRange={0}
              futureScrollRange={12}
              scrollEnabled={true}
              showScrollIndicator={true}
            />
            <TouchableOpacity
              onPress={() => {
                setShowCalendar(false);
                fetchEvents();
              }}
              className="w-full mt-4 mb-6 shadow-lg shadow-orange-500/30"
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-full items-center justify-center"
              >
                <Text className="text-white text-xl font-bold tracking-wide">
                  APPLY DATES
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EVENT PREVIEW MODAL */}
      <Modal
        visible={!!selectedEvent}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <View className="flex-1 bg-black justify-center items-center relative">
            <TouchableOpacity
              onPress={() => setSelectedEvent(null)}
              className="absolute top-12 right-6 bg-black/50 p-2 rounded-full z-50"
            >
              <X color="white" size={32} />
            </TouchableOpacity>

            <View className="w-full items-center">
              <EventFeedCard
                id={selectedEvent.id}
                title={selectedEvent.title}
                hostName={selectedEvent.profiles?.username || "Host"}
                hostAvatar={selectedEvent.profiles?.avatar_url}
                image={selectedEvent.banner_url}
                attendeesCount={100}
                showSocial={false}
                disableTap={true}
                onOpenSocial={() => {}}
                onPressHost={() => {
                  setSelectedEvent(null);
                  navigation.navigate("EventHostProfile", {
                    hostId: selectedEvent.host_id,
                  });
                }}
                onViewEvent={() => {}}
                // Added empty handler to prevent error if it's required
                onOpenDiscussion={() => {}}
              />
              <View className="w-full px-6 mt-6">
                <TouchableOpacity
                  onPress={() => {
                    setSelectedEvent(null);
                    navigation.navigate("EventProfile", {
                      eventId: selectedEvent.id,
                      eventTitle: selectedEvent.title,
                    });
                  }}
                  activeOpacity={0.9}
                  className="w-full shadow-lg shadow-orange-500/30"
                >
                  <LinearGradient
                    {...fireGradient}
                    className="w-full py-5 rounded-full items-center justify-center"
                  >
                    <Text
                      className="text-white text-2xl font-bold tracking-wide"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      VIEW EVENT
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <BottomNav />
    </View>
  );
};

export default SearchScreen;
