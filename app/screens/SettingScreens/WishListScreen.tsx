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

// ✅ Added expo-av for video support
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

// ✅ Helper to check if URL is a video
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
    }, [user])
  );

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("saved_events")
        .select(
          `
          event_id,
          events (
            id,
            title,
            banner_url,
            category,
            date
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Safe formatting in case Supabase returns arrays
        const formattedEvents = data
          .map((item: any) =>
            Array.isArray(item.events) ? item.events[0] : item.events
          )
          .filter(Boolean);

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
        (item.title || "").toLowerCase().includes(text.toLowerCase())
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  };

  const handleRemove = async (eventId: string) => {
    if (!user) return;

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setFilteredEvents((prev) => prev.filter((e) => e.id !== eventId));

    try {
      const { error } = await supabase
        .from("saved_events")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId);

      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error", "Could not remove event from wishlist.");
      fetchWishlist();
    }
  };

  const renderEventItem = ({ item }: { item: any }) => {
    const eventImage = item.banner_url
      ? { uri: item.banner_url }
      : require("../../assets/imagePlaceHolder1.png");

    // ✅ Check if the current item is a video
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
        {/* ✅ Conditionally render Video or Image */}
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

        <TouchableOpacity
          onPress={() => handleRemove(item.id)}
          className="absolute top-3 right-3 bg-black/50 p-2 rounded-full"
        >
          <Heart color="#FA8900" fill="#FA8900" size={20} />
        </TouchableOpacity>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          className="absolute bottom-0 left-0 right-0 p-4 pt-10"
        >
          <Text
            className="text-white font-bold text-xl shadow-black leading-tight"
            style={{ fontFamily: "Jost-Medium" }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
            {item.category || "Other"}
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
        <View className="flex-1 pt-32 px-0">
          <View className="px-6">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 bg-white/10 p-2 rounded-full"
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

            <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14 mb-6">
              <Search color="#FA8900" size={24} className="mr-3" />
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
                <View className="items-center mt-10 px-6">
                  <Text className="text-gray-500 font-medium text-lg">
                    {searchQuery
                      ? "No events match your search."
                      : "No saved events yet."}
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
