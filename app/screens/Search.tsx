// app/screens/SearchScreen.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  Animated,
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
import { CalendarList } from "react-native-calendars";
import * as Haptics from "expo-haptics";

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

// --- 1. DATA & COLORS ---
const RAINBOW_MESH: [string, string, ...string[]] = [
  "#A855F7",
  "#F43F5E",
  "#F97316",
  "#10B981",
  "#3B82F6",
];

const TIME_FILTERS = ["Today", "Tomorrow", "This Weekend", "This Month"];

// 🔥 STRICT SUPER-CATEGORY COLOR ENGINE
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

const getDateRangeForFilter = (filter: string) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

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
    const day = now.getDay();
    const dist = 5 - day + (day >= 5 ? 7 : 0);
    start.setDate(now.getDate() + dist);
    end.setDate(start.getDate() + 2);
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

// --- ANIMATED BUBBLE COMPONENT ---
const AnimatedFilterBubble = ({
  label,
  color = "#fff",
  isSelected,
  onPress,
}: any) => {
  const wobbleAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
    wobbleAnim.setValue(0);
    Animated.timing(wobbleAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const spin = wobbleAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ["0deg", "-10deg", "10deg", "-4deg", "4deg", "0deg"],
  });

  return (
    <Animated.View
      style={{ transform: [{ rotate: spin }], overflow: "visible", zIndex: 10 }}
    >
      <TouchableOpacity
        onPress={handlePress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
        style={{
          backgroundColor: isSelected ? color : "transparent",
          borderColor: color,
          borderWidth: 1.5,
          marginRight: 10,
          marginBottom: 12,
          paddingVertical: 12,
          paddingHorizontal: 22,
          borderRadius: 999,
        }}
      >
        <Text
          className="font-bold text-base"
          style={{
            fontFamily: "Jost-Medium",
            color: isSelected ? "#000" : "#fff",
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SearchScreen = () => {
  const navigation = useNavigation<any>();

  // --- STATE ---
  const [query, setQuery] = useState("");
  const [isQueryActive, setIsQueryActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter State
  const [availableTags, setAvailableTags] = useState<Record<string, string[]>>(
    {},
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("name, group_name")
          .order("name", { ascending: true });

        if (error) throw error;

        if (data) {
          const grouped = data.reduce((acc: any, item: any) => {
            const group = item.group_name || "Other";
            if (!acc[group]) acc[group] = [];
            acc[group].push(item.name);
            return acc;
          }, {});
          setAvailableTags(grouped);
        }
      } catch (err) {
        console.log("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- 1. SEARCH FUNCTION ---
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      let dbQuery = supabase
        .from("events")
        .select(
          `*, profiles:host_id ( username, avatar_url ), venues:venue_id ( name, address )`,
        )
        .gte("date", now)
        .eq("is_public", true);

      // A. TEXT SEARCH
      if (query.trim() && isQueryActive) {
        const text = query.trim();
        const searchTerms = text.split(" ");
        const conditions = searchTerms
          .filter((word) => word.length > 2)
          .map((word) => `title.ilike.%${word}%,description.ilike.%${word}%`)
          .join(",");

        if (conditions.length > 0) {
          dbQuery = dbQuery.or(conditions);
        } else {
          dbQuery = dbQuery.or(
            `title.ilike.%${text}%,description.ilike.%${text}%`,
          );
        }
      }

      // B. DATE SEARCH
      let earliestStart: Date | null = null;
      let latestEnd: Date | null = null;

      if (activeTimeFilters.length > 0) {
        activeTimeFilters.forEach((filter) => {
          const range = getDateRangeForFilter(filter);
          if (range) {
            const s = new Date(range.start);
            const e = new Date(range.end);
            if (!earliestStart || s < earliestStart) earliestStart = s;
            if (!latestEnd || e > latestEnd) latestEnd = e;
          }
        });
      } else if (isCustomDateActive && startDate) {
        earliestStart = new Date(startDate);
        latestEnd = new Date(endDate || startDate);
        latestEnd.setHours(23, 59, 59, 999);
      }

      if (earliestStart)
        dbQuery = dbQuery.gte("date", earliestStart.toISOString());
      if (latestEnd) dbQuery = dbQuery.lte("date", latestEnd.toISOString());

      dbQuery = dbQuery.order("date", { ascending: true });

      const { data, error } = await dbQuery;

      if (error) throw error;

      // 🔥 C. STRICT TAG SEARCH (Client-Side to bypass Database Array Errors!)
      let finalResults = data || [];

      if (selectedTags.length > 0) {
        finalResults = finalResults.filter((event) => {
          // 1. Safely extract all tags into a bulletproof array
          let safeCategories: string[] = [];

          if (Array.isArray(event.categories)) {
            safeCategories = [...event.categories];
          } else if (typeof event.categories === "string") {
            try {
              safeCategories = JSON.parse(event.categories);
            } catch {
              safeCategories = [event.categories];
            }
          }

          if (event.category) {
            safeCategories.push(event.category);
          }

          const lowerSafeCats = safeCategories.map((c) => c.toLowerCase());

          // 2. Strict Filter: If the selected tag exists in their array, keep them!
          return selectedTags.some((tag) => {
            const lowerTag = tag.toLowerCase();
            return lowerSafeCats.some((c) => c.includes(lowerTag));
          });
        });
      }

      setResults(finalResults);
    } catch (err) {
      console.log("Search Error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    query,
    isQueryActive,
    selectedTags,
    activeTimeFilters,
    startDate,
    endDate,
    isCustomDateActive,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- ACTIONS ---
  const checkActiveFilters = (
    tags: string[],
    times: string[],
    customDate: boolean,
  ) => {
    return tags.length > 0 || times.length > 0 || customDate;
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (!isExpanded) setIsExpanded(true);

    const hasFilters = checkActiveFilters(
      selectedTags,
      activeTimeFilters,
      isCustomDateActive,
    );
    if (hasFilters) {
      setIsQueryActive(false);
    } else {
      setIsQueryActive(true);
    }
  };

  const toggleQueryActive = () => {
    setIsQueryActive(!isQueryActive);
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
  };

  const handleClear = () => {
    setQuery("");
    setIsQueryActive(false);
    setSelectedTags([]);
    setActiveTimeFilters([]);
    setIsCustomDateActive(false);
    setStartDate(null);
    setEndDate(null);
    setMarkedDates({});
  };

  const removeQuery = () => {
    setQuery("");
    setIsQueryActive(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];

      const hasFilters = checkActiveFilters(
        newTags,
        activeTimeFilters,
        isCustomDateActive,
      );

      if (hasFilters) {
        setIsQueryActive(false);
      } else if (query.trim().length > 0) {
        setIsQueryActive(true);
      }

      return newTags;
    });
  };

  const toggleTimeFilter = (time: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCustomDateActive(false);
    setActiveTimeFilters((prev) => {
      const newFilters = prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time];

      const hasFilters = checkActiveFilters(selectedTags, newFilters, false);
      if (hasFilters) {
        setIsQueryActive(false);
      } else if (query.trim().length > 0) {
        setIsQueryActive(true);
      }

      return newFilters;
    });
  };

  const handleCustomDatePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isCustomDateActive) {
      setIsCustomDateActive(false);
      setStartDate(null);
      setEndDate(null);

      const hasFilters = checkActiveFilters(
        selectedTags,
        activeTimeFilters,
        false,
      );
      if (!hasFilters && query.trim().length > 0) setIsQueryActive(true);
    } else {
      setIsCustomDateActive(true);
      setShowCalendar(true);
      setActiveTimeFilters([]);
      setIsQueryActive(false);
    }
  };

  const visibleGroups = useMemo(() => {
    if (!query.trim()) return availableTags;

    const filtered: Record<string, string[]> = {};
    Object.keys(availableTags).forEach((group) => {
      const matchingTags = availableTags[group].filter((tag) =>
        tag.toLowerCase().includes(query.toLowerCase()),
      );
      if (matchingTags.length > 0) {
        filtered[group] = matchingTags;
      }
    });
    return filtered;
  }, [availableTags, query]);

  const renderEventItem = ({ item }: { item: any }) => {
    let primaryCat = item.category;
    if (!primaryCat && item.categories) {
      try {
        primaryCat = Array.isArray(item.categories)
          ? item.categories[0]
          : JSON.parse(item.categories)[0];
      } catch {
        primaryCat = "Event";
      }
    }

    return (
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
            style={{ color: GET_CATEGORY_COLOR(primaryCat, availableTags) }}
          >
            {primaryCat || "Event"}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

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
                  placeholder="Start typing..."
                  placeholderTextColor="#999"
                  value={query}
                  onChangeText={handleTextChange}
                  onFocus={() => setIsExpanded(true)}
                  className="flex-1 text-white text-xl font-medium h-full mx-2"
                  style={{ fontFamily: "Jost-Medium" }}
                  onSubmitEditing={handleSearch}
                />
                <View className="flex-row items-center gap-2">
                  {(query.length > 0 ||
                    selectedTags.length > 0 ||
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
              <View className="flex-1">
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingBottom: 160,
                    paddingTop: 10,
                    paddingHorizontal: 16,
                  }}
                  keyboardShouldPersistTaps="always"
                >
                  <Text className="text-gray-400 text-sm font-bold uppercase mb-4 ml-1">
                    Explore Interests
                  </Text>

                  {/* 1. DYNAMIC SEARCH BUBBLE */}
                  {query.length > 0 && (
                    <View className="mb-6 flex-row">
                      <TouchableOpacity onPress={toggleQueryActive}>
                        {isQueryActive ? (
                          <LinearGradient
                            colors={RAINBOW_MESH}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              borderRadius: 999,
                              paddingVertical: 14,
                              paddingHorizontal: 24,
                            }}
                          >
                            <Text
                              className="font-bold text-base text-white"
                              style={{ fontFamily: "Jost-Medium" }}
                            >
                              "{query}"
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View
                            style={{
                              borderRadius: 999,
                              paddingVertical: 12,
                              paddingHorizontal: 22,
                              borderWidth: 1.5,
                              borderColor: "#666",
                              backgroundColor: "rgba(255,255,255,0.05)",
                            }}
                          >
                            <Text
                              className="font-bold text-base text-gray-400"
                              style={{ fontFamily: "Jost-Medium" }}
                            >
                              "{query}"
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 2. CATEGORIZED STRIPS */}
                  {Object.keys(visibleGroups).length > 0 ? (
                    Object.keys(visibleGroups).map((group) => (
                      <View key={group} className="mb-3">
                        <Text className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1 tracking-widest">
                          {group}
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          keyboardShouldPersistTaps="always"
                          contentContainerStyle={{
                            paddingVertical: 5,
                            paddingHorizontal: 4,
                          }}
                        >
                          {visibleGroups[group].map((tag) => (
                            <AnimatedFilterBubble
                              key={tag}
                              label={tag}
                              isSelected={selectedTags.includes(tag)}
                              color={GET_CATEGORY_COLOR(tag, availableTags)}
                              onPress={() => toggleTag(tag)}
                            />
                          ))}
                        </ScrollView>
                      </View>
                    ))
                  ) : (
                    <View className="mb-6">
                      {query.length > 0 && (
                        <Text className="text-gray-500 italic mt-2 ml-2">
                          No category matches.
                        </Text>
                      )}
                    </View>
                  )}

                  {/* 3. TIME FILTERS */}
                  <Text className="text-gray-400 text-sm font-bold uppercase mb-3 mt-4 ml-1">
                    When
                  </Text>
                  <View className="flex-row flex-wrap">
                    {TIME_FILTERS.map((time) => (
                      <AnimatedFilterBubble
                        key={time}
                        label={time}
                        color="#fff"
                        isSelected={activeTimeFilters.includes(time)}
                        onPress={() => toggleTimeFilter(time)}
                      />
                    ))}
                    <TouchableOpacity
                      onPress={handleCustomDatePress}
                      className={`px-6 py-3.5 rounded-full mr-3 mb-3 border-[1.5px] flex-row items-center ${
                        isCustomDateActive
                          ? "bg-white border-white"
                          : "border-[#444] bg-transparent"
                      }`}
                    >
                      <CalendarIcon
                        color={isCustomDateActive ? "black" : "#ccc"}
                        size={16}
                        className="mr-2"
                      />
                      <Text
                        className={`font-bold ml-1 text-base ${
                          isCustomDateActive ? "text-black" : "text-[#ccc]"
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
              // RESULT LIST
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                ListHeaderComponent={
                  <View className="px-4 mb-4">
                    <Text
                      className="text-white text-2xl font-bold mb-3"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      {results.length > 0 ? "Upcoming Events" : ""}
                    </Text>

                    <View className="flex-row flex-wrap">
                      {query.length > 0 && isQueryActive && (
                        <TouchableOpacity
                          onPress={removeQuery}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={RAINBOW_MESH}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 20,
                              paddingVertical: 10,
                              marginRight: 8,
                              marginBottom: 8,
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              className="text-white text-base font-bold mr-2"
                              style={{ fontFamily: "Jost-Medium" }}
                            >
                              "{query}"
                            </Text>
                            <View className="bg-white/30 rounded-full p-0.5">
                              <X size={14} color="white" strokeWidth={3} />
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}

                      {selectedTags.map((tag) => {
                        const color = GET_CATEGORY_COLOR(tag, availableTags);
                        return (
                          <TouchableOpacity
                            key={tag}
                            onPress={() => toggleTag(tag)}
                            style={{
                              borderColor: color,
                              borderWidth: 1.5,
                              backgroundColor: "rgba(0,0,0,0.4)",
                            }}
                            className="px-5 py-2.5 rounded-full mr-2 mb-2 flex-row items-center"
                          >
                            <Text
                              style={{
                                color: color,
                                fontFamily: "Jost-Medium",
                              }}
                              className="text-base font-bold mr-2"
                            >
                              {tag}
                            </Text>
                            <X size={16} color={color} strokeWidth={2.5} />
                          </TouchableOpacity>
                        );
                      })}

                      {activeTimeFilters.map((time) => (
                        <TouchableOpacity
                          key={time}
                          onPress={() => toggleTimeFilter(time)}
                          className="border border-white/80 bg-black/40 px-5 py-2.5 rounded-full mr-2 mb-2 flex-row items-center"
                        >
                          <Text
                            style={{ fontFamily: "Jost-Medium" }}
                            className="text-white text-base font-bold mr-2"
                          >
                            {time}
                          </Text>
                          <X size={16} color="white" strokeWidth={2.5} />
                        </TouchableOpacity>
                      ))}

                      {isCustomDateActive && startDate && (
                        <TouchableOpacity
                          onPress={() => {
                            setIsCustomDateActive(false);
                            setStartDate(null);
                            setEndDate(null);
                          }}
                          className="border border-white/80 bg-black/40 px-5 py-2.5 rounded-full mr-2 mb-2 flex-row items-center"
                        >
                          <Text
                            style={{ fontFamily: "Jost-Medium" }}
                            className="text-white text-base font-bold mr-2"
                          >
                            Custom Date
                          </Text>
                          <X size={16} color="white" strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
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

      {/* MODALS */}
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
              onDayPress={(day: any) => {
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
                  let d1 = new Date(startDate);
                  let d2 = new Date(day.dateString);
                  if (d1 > d2) {
                    setEndDate(startDate);
                    setStartDate(day.dateString);
                  } else {
                    setEndDate(day.dateString);
                  }
                  setMarkedDates({
                    [startDate]: {
                      selected: true,
                      startingDay: true,
                      color: "#FA8900",
                      textColor: "white",
                    },
                    [day.dateString]: {
                      selected: true,
                      endingDay: true,
                      color: "#FA8900",
                      textColor: "white",
                    },
                  });
                }
              }}
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
                hostName={selectedEvent.profiles?.username || ""}
                hostAvatar={selectedEvent.profiles?.avatar_url}
                image={selectedEvent.banner_url}
                attendeesCount={100}
                showSocial={false}
                disableTap={false}
                tags={selectedEvent.categories || [selectedEvent.category]}
                onOpenSocial={() => {}}
                onPressHost={() => {
                  if (selectedEvent.host_id) {
                    setSelectedEvent(null);
                    navigation.navigate("EventHostProfile", {
                      hostId: selectedEvent.host_id,
                    });
                  }
                }}
                onViewEvent={() => {
                  setSelectedEvent(null);
                  navigation.navigate("EventProfile", {
                    eventId: selectedEvent.id,
                    eventTitle: selectedEvent.title,
                  });
                }}
                onOpenDiscussion={() => {}}
              />
            </View>
          </View>
        )}
      </Modal>
      <BottomNav />
    </View>
  );
};

export default SearchScreen;
