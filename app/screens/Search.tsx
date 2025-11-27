import React, { useState } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CalendarList, DateData } from "react-native-calendars";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";
import EventFeedCard from "../components/EventFeedCard";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2;

// --- DATA ---
const ALL_EVENTS = [
  {
    id: "1",
    title: "Neon Jungle",
    category: "Techno",
    image: require("../assets/imagePlaceHolder1.png"),
    host: "Underground SA",
    hostImg: require("../assets/profile-pic-2.png"),
    attendees: 42,
  },
  {
    id: "2",
    title: "Rugby Finals",
    category: "Rugby",
    image: require("../assets/imagePlaceHolder2.png"),
    host: "Stormers",
    hostImg: require("../assets/profile-pic-1.png"),
    attendees: 1200,
  },
  {
    id: "3",
    title: "Forest Run",
    category: "Hikes",
    image: require("../assets/imagePlaceHolder3.png"),
    host: "Trail Blazrs",
    hostImg: require("../assets/profile-pic-2.png"),
    attendees: 15,
  },
  {
    id: "4",
    title: "Comedy Night",
    category: "Comedy",
    image: require("../assets/imagePlaceHolder4.png"),
    host: "Cape Town Comedy",
    hostImg: require("../assets/profile-pic-1.png"),
    attendees: 80,
  },
  {
    id: "5",
    title: "Summer Slam",
    category: "Beach",
    image: require("../assets/imagePlaceHolder5.png"),
    host: "Rockstar Events",
    hostImg: require("../assets/profile-pic-1.png"),
    attendees: 350,
  },
  {
    id: "6",
    title: "Jazz Cafe",
    category: "Live Music",
    image: require("../assets/imagePlaceHolder6.png"),
    host: "The Blue Note",
    hostImg: require("../assets/profile-pic-2.png"),
    attendees: 45,
  },
];

const GET_CATEGORY_COLOR = (category: string) => {
  const cat = category.toLowerCase();
  if (
    ["techno", "house", "edm", "trance", "dnb", "electronic"].some((x) =>
      cat.includes(x)
    )
  )
    return "#A855F7";
  if (
    ["live music", "rock", "jazz", "bands", "metal", "music"].some((x) =>
      cat.includes(x)
    )
  )
    return "#F43F5E";
  if (
    ["rugby", "soccer", "football", "cricket", "tennis", "sports", "ball"].some(
      (x) => cat.includes(x)
    )
  )
    return "#F97316";
  if (
    ["hikes", "beach", "run", "trail", "outdoors", "nature", "walk"].some((x) =>
      cat.includes(x)
    )
  )
    return "#10B981";
  if (
    ["comedy", "theater", "magic", "shows", "standup", "play"].some((x) =>
      cat.includes(x)
    )
  )
    return "#3B82F6";
  return "#ffffff";
};

const ALL_INTERESTS = [
  "Techno",
  "House",
  "Live Music",
  "Jazz",
  "Rugby",
  "Soccer",
  "Hikes",
  "Beach",
  "Comedy",
  "Theater",
  "Magic",
];
const TIME_FILTERS = ["Today", "Tomorrow", "This Weekend", "This Month"];

const SearchScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- STATE ---
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTimeFilters, setActiveTimeFilters] = useState<string[]>([]);
  const [results, setResults] = useState(ALL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [isCustomDateActive, setIsCustomDateActive] = useState(false);

  // --- ACTIONS ---

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
    setActiveTimeFilters((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
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

  const handleSearch = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
    let filtered = ALL_EVENTS;
    const lowerQuery = query.toLowerCase();
    if (activeFilters.length > 0)
      filtered = filtered.filter((e) => activeFilters.includes(e.category));
    if (query.trim().length > 0)
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(lowerQuery) ||
          e.category.toLowerCase().includes(lowerQuery) ||
          e.host.toLowerCase().includes(lowerQuery)
      );
    setResults(filtered);
  };

  const handleClear = () => {
    setQuery("");
    setActiveFilters([]);
    setActiveTimeFilters([]);
    setIsCustomDateActive(false);
    setStartDate(null);
    setEndDate(null);
    setMarkedDates({});
    setResults(ALL_EVENTS);
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
        if (index === 0)
          newMarked[date] = {
            selected: true,
            startingDay: true,
            color: "#FA8900",
            textColor: "white",
          };
        else if (index === range.length - 1)
          newMarked[date] = {
            selected: true,
            endingDay: true,
            color: "#FA8900",
            textColor: "white",
          };
        else
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

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d
      .getFullYear()
      .toString()
      .slice(-2)}`;
  };

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

  // 👇 DEFINED INSIDE THE COMPONENT, BEFORE RETURN
  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="bg-black relative mb-1"
      style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.25 }}
      onPress={() => setSelectedEvent(item)}
    >
      <Image
        source={item.image}
        className="w-full h-full opacity-80"
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.9)"]}
        className="absolute bottom-0 left-0 right-0 p-4"
      >
        <Text
          className="text-white font-bold text-xl shadow-black"
          style={{ fontFamily: "Jost-Medium" }}
        >
          {item.title}
        </Text>
        <Text
          className="text-xs font-bold uppercase tracking-wider mt-1"
          style={{ color: GET_CATEGORY_COLOR(item.category) }}
        >
          {item.category}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  // --- MAIN RENDER ---
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
                      <ArrowRight color="white" size={24} strokeWidth={3} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* CONTENT */}
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
                    {query.length > 0 && (
                      <TouchableOpacity className="px-5 py-3 rounded-full mr-3 mb-3 bg-white/20 border border-white/40 flex-row items-center">
                        <Search color="white" size={16} className="mr-2" />
                        <Text className="text-white font-bold italic text-base">
                          "{query}"
                        </Text>
                      </TouchableOpacity>
                    )}

                    {ALL_INTERESTS.filter((cat) =>
                      cat.toLowerCase().includes(query.toLowerCase())
                    ).map((cat) => (
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
                    {TIME_FILTERS.map((time) => {
                      const isSelected = activeTimeFilters.includes(time);
                      return (
                        <TouchableOpacity
                          key={time}
                          onPress={() => toggleTimeFilter(time)}
                          className={`px-5 py-3 rounded-full mr-3 mb-3 border-2 ${
                            isSelected
                              ? "bg-white border-white"
                              : "border-gray-600 bg-transparent"
                          }`}
                        >
                          <Text
                            className={`font-bold text-base ${
                              isSelected ? "text-black" : "text-gray-400"
                            }`}
                          >
                            {time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Custom Date Bubble */}
                    <TouchableOpacity
                      onPress={handleCustomDatePress}
                      className={`px-5 py-3 rounded-full mr-3 mb-3 border-2 flex-row items-center ${
                        isCustomDateActive
                          ? "bg-white border-white flex-1"
                          : "border-gray-600 bg-transparent"
                      }`}
                      style={isCustomDateActive ? { minWidth: "48%" } : {}}
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
                        {isCustomDateActive && startDate && endDate
                          ? `${formatDate(startDate)} - ${formatDate(endDate)}`
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
                    {results.length > 0 ? "Events for you" : ""}
                  </Text>
                }
                ListEmptyComponent={
                  <View className="items-center justify-center mt-20 px-10">
                    <Search color="#333" size={64} className="mb-4" />
                    <Text className="text-white text-xl font-bold text-center mb-2">
                      No events found
                    </Text>
                    <Text className="text-gray-500 text-center">
                      Sorry we couldn't find any events for you, try searching
                      something else.
                    </Text>
                  </View>
                }
                renderItem={renderEventItem}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Calendar Modal */}
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
                textSectionTitleColor: "#b6c1cd",
                selectedDayBackgroundColor: "#FA8900",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#FA8900",
                dayTextColor: "#ffffff",
                textDisabledColor: "#444",
                dotColor: "#FA8900",
                selectedDotColor: "#ffffff",
                arrowColor: "#FA8900",
                disabledArrowColor: "#d9e1e8",
                monthTextColor: "white",
                indicatorColor: "white",
                textDayFontFamily: "Jost-Medium",
                textMonthFontFamily: "Jost-Medium",
                textDayHeaderFontFamily: "Jost-Medium",
                textDayFontWeight: "300",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "300",
                textDayFontSize: 16,
                textMonthFontSize: 20,
                textDayHeaderFontSize: 14,
              }}
              pastScrollRange={0}
              futureScrollRange={12}
              scrollEnabled={true}
              showScrollIndicator={true}
            />
            <TouchableOpacity
              onPress={() => setShowCalendar(false)}
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

      {/* Full Screen Event Modal */}
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
                hostName={selectedEvent.host}
                hostAvatar={selectedEvent.hostImg}
                image={selectedEvent.image}
                attendeesCount={selectedEvent.attendees}
                showSocial={false}
                disableTap={true}
                onOpenSocial={() => {}}
                onPressHost={() => {
                  setSelectedEvent(null);
                  navigation.navigate("EventHostProfile");
                }}
                onViewEvent={() => {}}
              />
              <View className="w-full px-6 mt-6">
                <TouchableOpacity
                  onPress={() => {
                    setSelectedEvent(null);
                    navigation.navigate("EventProfile", {
                      eventName: selectedEvent.title,
                      attendees: selectedEvent.attendees,
                      logo: selectedEvent.hostImg,
                      banner: selectedEvent.image,
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
