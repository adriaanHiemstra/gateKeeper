// app/screens/EventProfileScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Heart,
  Share2,
  MessageCircle,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Bell,
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Video, ResizeMode, Audio } from "expo-av";

// Components & Backend
import TopBanner from "../components/TopBanner";
import { supabase } from "../lib/supabase";

// Styles
import { fireGradient, bannerGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type EventProfileRouteProp = RouteProp<RootStackParamList, "EventProfile">;

// --- HELPERS ---
const getSource = (source: any) => {
  if (typeof source === "string") return { uri: source };
  return source;
};

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

const EventProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<EventProfileRouteProp>();

  // Initial Params (Fallback)
  const eventId = params?.eventId;

  // LIVE STATE
  const [eventData, setEventData] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery State
  const [activeSlide, setActiveSlide] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // FETCH FRESH DATA ON FOCUS
  useFocusEffect(
    useCallback(() => {
      if (!eventId) return;

      const fetchData = async () => {
        try {
          const { data: event, error: eventError } = await supabase
            .from("events")
            .select(`*, ticket_tiers (*)`)
            .eq("id", eventId)
            .single();

          if (!eventError) {
            setEventData(event);
          }

          const { data: posts, error: postError } = await supabase
            .from("event_updates")
            .select("*")
            .eq("event_id", eventId)
            .order("created_at", { ascending: false });

          if (!postError) {
            setUpdates(posts || []);
          }
        } catch (err) {
          console.log("Error fetching event details:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [eventId])
  );

  // --- DERIVED DATA ---
  const displayEvent = eventData || params;
  const eventName =
    displayEvent?.title || displayEvent?.eventName || "Loading...";
  const description =
    displayEvent?.description || "Join us for an unforgettable experience!";
  const locationText =
    displayEvent?.location_text || displayEvent?.location || "Location TBA";

  const dateObj = displayEvent?.date ? new Date(displayEvent.date) : null;
  const timeText = dateObj
    ? `${dateObj.toLocaleDateString()} • ${dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : displayEvent?.time || "Date TBA";

  const rawImages = displayEvent?.images;
  const banner =
    displayEvent?.banner_url ||
    displayEvent?.banner ||
    require("../assets/event-placeholder.png");
  const galleryImages =
    rawImages && rawImages.length > 0 ? rawImages : [banner];
  const logo = require("../assets/profile-pic-1.png");

  const tiers = displayEvent?.ticket_tiers || params?.ticket_tiers || [];
  const lowestPrice =
    tiers.length > 0
      ? Math.min(...tiers.map((t: any) => parseFloat(t.price) || 0))
      : 150;

  const ticketUrl = displayEvent?.ticket_url;
  const tags = displayEvent?.tags || params?.tags || ["Music", "Event"];

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  const handleScroll = (event: any) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activeSlide) setActiveSlide(slide);
  };

  // ✅ FIXED: Missing Variable Definitions
  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setFullScreenIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const renderHeaderItem = (item: any, index: number) => {
    const source = getSource(item);
    const isVideo = isVideoFile(item);

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.9}
        onPress={() => {
          setFullScreenIndex(index);
          setShowFullGallery(true);
        }}
      >
        {isVideo ? (
          <View
            style={{
              width: screenWidth,
              height: 320,
              backgroundColor: "black",
            }}
          >
            <Video
              source={source}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-black/30 p-3 rounded-full backdrop-blur-sm">
                <VolumeX color="white" size={20} />
              </View>
            </View>
          </View>
        ) : (
          <Image
            source={source}
            style={{ width: screenWidth, height: 320 }}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderFullScreenItem = ({ item, index }: any) => {
    const source = getSource(item);
    const isVideo = isVideoFile(item);
    const isActive = index === fullScreenIndex;
    return (
      <View
        style={{
          width: screenWidth,
          height: screenHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
        }}
      >
        {isVideo ? (
          <Video
            source={source}
            style={{ width: "100%", height: "80%" }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isActive}
            isLooping
            isMuted={isMuted}
            useNativeControls={false}
          />
        ) : (
          <Image
            source={source}
            style={{ width: "100%", height: "80%" }}
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  const handleTicketPress = () => {
    if (!eventId) return;
    navigation.navigate("PurchaseTicket", {
      eventId,
      eventName,
      ticket_tiers: tiers,
      banner,
      logo,
      time: timeText,
      location: locationText,
    });
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar barStyle="light-content" />
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 100, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER GALLERY */}
          <View className="relative h-80 w-full mb-6">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {galleryImages.map((img: any, i: number) =>
                renderHeaderItem(img, i)
              )}
            </ScrollView>
            <LinearGradient
              colors={["transparent", "#121212"]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 100,
              }}
              pointerEvents="none"
            />
            {galleryImages.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                {galleryImages.map((_: any, i: number) => (
                  <View
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === activeSlide ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </View>
            )}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-4 left-4 bg-black/50 p-3 rounded-full border border-white/10"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
          </View>

          {/* TITLE & HOST */}
          <View className="px-6 mb-6 -mt-12">
            <TouchableOpacity
              onPress={() => navigation.navigate("EventHostProfile")}
              className="flex-row items-center bg-[#1E1E1E] self-start px-2 py-1 rounded-full border border-white/10 mb-4 shadow-lg"
            >
              <Image source={logo} className="w-8 h-8 rounded-full mr-2" />
              <Text className="text-gray-300 text-sm font-bold pr-2">
                Rockstar Events
              </Text>
            </TouchableOpacity>
            <Text
              className="text-white text-4xl font-bold mb-2 leading-tight"
              style={{ fontFamily: "Jost-Medium" }}
            >
              {eventName}
            </Text>
            <View className="flex-row flex-wrap gap-2 mt-2">
              {tags.map((tag: string, i: number) => (
                <View
                  key={i}
                  className="bg-white/10 px-3 py-1 rounded-lg border border-white/5"
                >
                  <Text className="text-white text-xs font-bold">{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* NEWS & UPDATES */}
          {updates.length > 0 && (
            <View className="px-6 mb-8">
              <View className="flex-row items-center mb-4">
                <Bell color="#FA8900" size={20} className="mr-2" />
                <Text className="text-white text-xl font-bold">
                  Latest Updates
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {updates.map((update, index) => (
                  <View
                    key={index}
                    className="w-72 bg-white/5 border border-white/10 rounded-2xl p-3 mr-4"
                  >
                    <View className="flex-row items-center mb-2">
                      <Image
                        source={logo}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <Text className="text-gray-400 text-xs font-bold">
                        Host Update •{" "}
                        {new Date(update.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {update.image_url && (
                      <Image
                        source={{ uri: update.image_url }}
                        className="w-full h-32 rounded-xl mb-3"
                        resizeMode="cover"
                      />
                    )}
                    <Text
                      className="text-white font-medium leading-5 mb-2"
                      numberOfLines={3}
                    >
                      {update.caption}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* DETAILS */}
          <View className="mx-6 bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 gap-5">
            <View className="flex-row items-center">
              <View className="bg-orange-500/20 p-3 rounded-xl mr-4">
                <Calendar color="#FA8900" size={24} />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">
                  Date & Time
                </Text>
                <Text className="text-gray-400">{timeText}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="bg-blue-500/20 p-3 rounded-xl mr-4">
                <MapPin color="#60A5FA" size={24} />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">Location</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("VenueProfile", {
                      venueId: "123",
                      venueName: locationText,
                    })
                  }
                >
                  <Text className="text-orange-400 underline font-medium">
                    {locationText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="bg-purple-500/20 p-3 rounded-xl mr-4">
                <Ticket color="#D087FF" size={24} />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">Tickets</Text>
                <Text className="text-gray-400">From: R {lowestPrice}</Text>
              </View>
            </View>
            <View className="border-t border-white/10 pt-4 mt-1">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("EventDiscussion", {
                    eventId: eventId!,
                    eventName: eventName,
                  })
                }
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="bg-pink-500/20 p-3 rounded-xl mr-4">
                    <MessageCircle color="#EC4899" size={24} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">
                      Discussion
                    </Text>
                    <Text className="text-gray-400">
                      Join the chat • 45 Online
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#666" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 mb-6">
            <Text className="text-white text-xl font-bold mb-2">About</Text>
            <Text className="text-gray-400 text-base leading-6">
              {description}
            </Text>
          </View>
          <View className="px-6 mb-8">
            <Text className="text-white text-xl font-bold mb-3">Location</Text>
            <View className="h-40 w-full bg-white/10 rounded-3xl border border-white/10 overflow-hidden items-center justify-center">
              <MapPin color="white" size={32} />
              <Text className="text-white/50 text-sm mt-2">Map Preview</Text>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-[#121212]/95 border-t border-white/10 p-6 pb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-400 text-xs font-bold uppercase">
              Starting From
            </Text>
            <Text className="text-white text-3xl font-bold">
              R {lowestPrice}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            className="w-[60%] shadow-lg shadow-orange-500/40"
            onPress={handleTicketPress}
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-2xl items-center justify-center"
            >
              <Text
                className="text-white text-xl font-bold tracking-wide"
                style={{ fontFamily: "Jost-Medium" }}
              >
                {ticketUrl ? "BUY ONLINE" : "BUY TICKETS"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal
        visible={showFullGallery}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowFullGallery(false)}
      >
        <View className="flex-1 bg-black relative">
          <StatusBar hidden />
          <TouchableOpacity
            onPress={() => setShowFullGallery(false)}
            className="absolute top-12 right-6 z-50 bg-black/50 p-2 rounded-full"
          >
            <X color="white" size={32} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsMuted(!isMuted)}
            className="absolute top-12 left-6 z-50 bg-black/50 p-2 rounded-full"
          >
            {isMuted ? (
              <VolumeX color="white" size={24} />
            ) : (
              <Volume2 color="white" size={24} />
            )}
          </TouchableOpacity>
          <FlatList
            data={galleryImages}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderFullScreenItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialScrollIndex={fullScreenIndex}
            onScrollToIndexFailed={() => {}}
          />
          <View className="absolute bottom-10 w-full items-center">
            <Text className="text-white/60 font-bold">Swipe for more</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EventProfileScreen;
