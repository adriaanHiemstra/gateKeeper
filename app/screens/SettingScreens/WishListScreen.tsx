import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Search, Heart } from "lucide-react-native";

// expo-av for video support
import { Video, ResizeMode } from "expo-av";

// Backend & Auth
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2;

// Helper to check if URL is a video
const isVideoFile = (source: any) => {
  const uri = typeof source === "string" ? source : source?.uri;
  if (uri) {
    const lower = uri.toLowerCase();
    return (
      lower.endsWith(".mp4") ||
      lower.endsWith(".mov") ||
      lower.endsWith(".quicktime")
    );
  }
  return false;
};

const WishListScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [user]),
  );

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // ✅ Pull from our new event_interactions table!
      const { data, error } = await supabase
        .from("event_interactions")
        .select(
          `
          event_id,
          intent,
          events (
            id,
            title,
            banner_url,
            category,
            date
          )
        `,
        )
        .eq("user_id", user.id)
        .in("intent", ["SAVED", "GOING"]) // ✅ Pulls both Hearted and RSVP'd events
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // ✅ Deduplicate: In case they clicked "Heart" AND "Going", we only want to show the event once
        const uniqueEventsMap = new Map();

        data.forEach((item: any) => {
          const eventData = Array.isArray(item.events)
            ? item.events[0]
            : item.events;
          if (eventData && !uniqueEventsMap.has(eventData.id)) {
            uniqueEventsMap.set(eventData.id, eventData);
          }
        });

        const formattedEvents = Array.from(uniqueEventsMap.values());

        setEvents(formattedEvents);
        setFilteredEvents(formattedEvents);
      }
    } catch (error: any) {
      console.error("Error fetching wishlist:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = events.filter((item) =>
        (item.title || "").toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  };

  const handleRemove = async (eventId: string) => {
    if (!user) return;

    // Optimistic UI update (instantly remove it from the screen so it feels snappy)
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setFilteredEvents((prev) => prev.filter((e) => e.id !== eventId));

    try {
      // ✅ Delete the interactions for this specific user & event
      const { error } = await supabase
        .from("event_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .in("intent", ["SAVED", "GOING"]);

      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error", "Could not remove event from wishlist.");
      fetchWishlist(); // Re-sync if the delete failed
    }
  };

  const renderEventItem = ({ item }: { item: any }) => {
    const eventImage = item.banner_url
      ? { uri: item.banner_url }
      : require("../../assets/event-placeholder.png"); // Make sure this matches your actual placeholder asset name!

    const isVideo = isVideoFile(eventImage);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        className="bg-black relative mb-1 overflow-hidden"
        style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.25 }}
        onPress={() =>
          navigation.navigate("EventProfile", {
            eventId: item.id,
            eventName: item.title,
            attendees: 0,
            logo: eventImage,
            banner: eventImage,
          })
        }
      >
        {isVideo ? (
          <Video
            source={eventImage}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              opacity: 0.8,
            }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        ) : (
          <Image
            source={eventImage}
            className="w-full h-full absolute opacity-80"
            resizeMode="cover"
          />
        )}

        {/* The Remove Button */}
        <TouchableOpacity
          onPress={() => handleRemove(item.id)}
          className="absolute top-3 right-3 bg-black/50 p-2 rounded-full z-10 border border-white/10"
        >
          <Heart color="#FA8900" fill="#FA8900" size={20} />
        </TouchableOpacity>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]}
          className="absolute bottom-0 left-0 right-0 p-4 pt-16"
        >
          <Text
            className="text-white font-bold text-xl shadow-black leading-tight"
            style={{ fontFamily: "Jost-Medium" }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text className="text-orange-500 text-xs font-bold uppercase tracking-wider mt-1">
            {item.category || "Event"}
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
        <View className="flex-1 pt-24 px-0">
          <View className="px-6">
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 bg-white/10 p-2 rounded-full border border-white/10"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Wishlist
              </Text>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-14 mb-6 shadow-sm shadow-black/50">
              <Search color="#FA8900" size={20} className="mr-3" />
              <TextInput
                placeholder="Search saved events..."
                placeholderTextColor="#666"
                className="flex-1 text-white text-lg font-medium h-full"
                style={{ fontFamily: "Jost-Medium" }}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <Text className="text-gray-400 font-bold ml-2">Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#FA8900" />
            </View>
          ) : (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={
                <View className="items-center mt-20 px-6">
                  <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-4 border border-white/10">
                    <Heart color="#666" size={32} />
                  </View>
                  <Text
                    className="text-white font-bold text-xl mb-2"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {searchQuery
                      ? "No matching events"
                      : "Your wishlist is empty"}
                  </Text>
                  <Text className="text-gray-500 font-medium text-center">
                    {searchQuery
                      ? "Try searching for a different keyword."
                      : "Tap the heart icon on any event to save it here for later."}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default WishListScreen;
