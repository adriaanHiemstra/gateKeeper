import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
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
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Components
import TopBanner from "../components/TopBanner";

// Styles
import { fireGradient, bannerGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type EventProfileRouteProp = RouteProp<RootStackParamList, "EventProfile">;

const EventProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<EventProfileRouteProp>();

  // 1. EXTRACT DATA & HANDLE FALLBACKS
  const eventName = params?.eventName ?? "Event Name";
  const logo = params?.logo ?? require("../assets/profile-pic-1.png");
  const description =
    params?.description ?? "Join us for an unforgettable experience!";
  const time = params?.time ?? "Date TBA";
  const location = params?.location ?? "Location TBA";
  const ticketUrl = params?.ticketUrl;

  // Handle Images: If array exists use it, otherwise wrap single banner in array
  const rawImages = params?.images;
  const banner = params?.banner ?? require("../assets/event-placeholder.png");

  const galleryImages =
    rawImages && rawImages.length > 0
      ? rawImages.map((img) => (typeof img === "string" ? { uri: img } : img))
      : [banner];

  const tags = ["Techno", "Beach", "Live Music"];

  // 2. CAROUSEL STATE
  const [activeSlide, setActiveSlide] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  const handleScroll = (event: any) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activeSlide) setActiveSlide(slide);
  };

  const handleTicketPress = async () => {
    if (ticketUrl) {
      // 🌍 External Link (Affiliate)
      const supported = await Linking.canOpenURL(ticketUrl);
      if (supported) await Linking.openURL(ticketUrl);
      else Alert.alert("Error", "Cannot open ticket link.");
    } else {
      // 📱 Internal Checkout
      navigation.navigate("PurchaseTicket", { eventId: "1" });
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      {/* Top Banner */}
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 100, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 3. IMAGE CAROUSEL */}
          <View className="relative h-80 w-full mb-6">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {galleryImages.map((img: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => setShowFullGallery(true)}
                >
                  <Image
                    source={img}
                    style={{ width: screenWidth, height: 320 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Gradient Fade */}
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

            {/* Floating Actions (Back / Like / Share) */}
            <View className="absolute top-4 left-4 flex-row justify-between w-[92%]">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-black/50 p-3 rounded-full border border-white/10"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <View className="flex-row gap-3">
                <TouchableOpacity className="bg-black/50 p-3 rounded-full border border-white/10">
                  <Heart color="white" size={24} />
                </TouchableOpacity>
                <TouchableOpacity className="bg-black/50 p-3 rounded-full border border-white/10">
                  <Share2 color="white" size={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pagination Dots */}
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
          </View>

          {/* 4. TITLE & HOST */}
          <View className="px-6 mb-6 -mt-12">
            {/* Host Pill */}
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

            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mt-2">
              {tags.map((tag, i) => (
                <View
                  key={i}
                  className="bg-white/10 px-3 py-1 rounded-lg border border-white/5"
                >
                  <Text className="text-white text-xs font-bold">{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 5. INFO CARD (Glassmorphism) */}
          <View className="mx-6 bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 gap-5">
            {/* Date */}
            <View className="flex-row items-center">
              <View className="bg-orange-500/20 p-3 rounded-xl mr-4">
                <Calendar color="#FA8900" size={24} />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">
                  Date & Time
                </Text>
                <Text className="text-gray-400">{time}</Text>
              </View>
            </View>

            {/* Location (Clickable) */}
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
                      venueName: location,
                    })
                  }
                >
                  <Text className="text-orange-400 underline decoration-orange-400 font-medium">
                    {location}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tickets */}
            <View className="flex-row items-center">
              <View className="bg-purple-500/20 p-3 rounded-xl mr-4">
                <Ticket color="#D087FF" size={24} />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">Tickets</Text>
                <Text className="text-gray-400">Selling Fast • 85% Sold</Text>
              </View>
            </View>

            {/* Discussion Link */}
            <View className="border-t border-white/10 pt-4 mt-1">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("EventDiscussion", {
                    eventId: "1",
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

          {/* 6. DESCRIPTION */}
          <View className="px-6 mb-6">
            <Text className="text-white text-xl font-bold mb-2">About</Text>
            <Text className="text-gray-400 text-base leading-6">
              {description}
            </Text>
          </View>

          {/* 7. MAP PREVIEW */}
          <View className="px-6 mb-8">
            <Text className="text-white text-xl font-bold mb-3">Location</Text>
            <View className="h-40 w-full bg-white/10 rounded-3xl border border-white/10 overflow-hidden items-center justify-center">
              <MapPin color="white" size={32} />
              <Text className="text-white/50 text-sm mt-2">Map Preview</Text>
            </View>
          </View>
        </ScrollView>

        {/* 8. STICKY FOOTER */}
        <View className="absolute bottom-0 left-0 right-0 bg-[#121212]/95 border-t border-white/10 p-6 pb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-400 text-xs font-bold uppercase">
              Starting From
            </Text>
            <Text className="text-white text-3xl font-bold">R 150</Text>
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

      {/* 9. FULL SCREEN GALLERY MODAL */}
      <Modal
        visible={showFullGallery}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowFullGallery(false)}
      >
        <View className="flex-1 bg-black relative">
          <TouchableOpacity
            onPress={() => setShowFullGallery(false)}
            className="absolute top-12 right-6 z-50 bg-black/50 p-2 rounded-full"
          >
            <X color="white" size={32} />
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {galleryImages.map((img: any, index: number) => (
              <View
                key={index}
                style={{
                  width: screenWidth,
                  height: screenHeight,
                  justifyContent: "center",
                }}
              >
                <Image
                  source={img}
                  style={{ width: screenWidth, height: screenWidth * 1.2 }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          <View className="absolute bottom-10 w-full items-center">
            <Text className="text-white/60 font-bold">Swipe for more</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EventProfileScreen;
