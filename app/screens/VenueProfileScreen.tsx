import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Info,
  Car,
  Wine,
  Wifi,
  Globe,
  X,
  Star, // 👈 Added Star
  ChevronRight, // 👈 Added Chevron
} from "lucide-react-native";

// Components
import BottomNav from "../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width / 2;

// Mock Data
const VENUE_IMAGES = [
  require("../assets/event-placeholder.png"),
  require("../assets/image-placeholder-2.png"),
  require("../assets/profile-pic-1.png"),
];

const VENUE_EVENTS = [
  {
    id: "1",
    title: "Neon Jungle",
    image: require("../assets/imagePlaceHolder1.png"),
    category: "Techno",
    date: "Fri, 28 Oct",
  },
  {
    id: "2",
    title: "Deep House Sunday",
    image: require("../assets/imagePlaceHolder2.png"),
    category: "House",
    date: "Sun, 30 Oct",
  },
  {
    id: "3",
    title: "Comedy Night",
    image: require("../assets/imagePlaceHolder3.png"),
    category: "Comedy",
    date: "Wed, 2 Nov",
  },
  {
    id: "4",
    title: "Student Night",
    image: require("../assets/imagePlaceHolder4.png"),
    category: "Party",
    date: "Thu, 3 Nov",
  },
];

const AMENITIES = [
  { label: "Parking", icon: <Car color="#999" size={16} /> },
  { label: "Full Bar", icon: <Wine color="#999" size={16} /> },
  { label: "Free WiFi", icon: <Wifi color="#999" size={16} /> },
];

type VenueProfileRouteProp = RouteProp<RootStackParamList, "VenueProfile">;

const VenueProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<VenueProfileRouteProp>();
  // We default to '1' for ID if missing, just for the mock demo
  const { venueName = "The Power Station", venueId = "1" } = route.params || {};

  const [activeSlide, setActiveSlide] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  const handleScroll = (event: any) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activeSlide) {
      setActiveSlide(slide);
    }
  };

  const handleGetDirections = () => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${-33.9249},${18.4241}`;
    const label = venueName;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="bg-black relative mb-1"
      style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.25 }}
      onPress={() =>
        navigation.navigate("EventProfile", {
          eventName: item.title,
          attendees: 100,
          logo: item.image,
          banner: item.image,
          time: item.date,
          location: venueName,
        })
      }
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
          className="text-white font-bold text-xl shadow-black leading-tight"
          style={{ fontFamily: "Jost-Medium" }}
        >
          {item.title}
        </Text>
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
          {item.date}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 1. IMAGE CAROUSEL */}
        <View className="relative h-72 w-full">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {VENUE_IMAGES.map((img, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => setShowFullGallery(true)}
                style={{ width: width, height: 288 }}
              >
                <Image
                  source={img}
                  style={{ width: width, height: 288 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
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

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="absolute top-12 left-6 bg-black/50 p-2 rounded-full border border-white/10"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity className="absolute top-12 right-6 bg-black/50 p-2 rounded-full border border-white/10">
            <Info color="white" size={24} />
          </TouchableOpacity>

          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {VENUE_IMAGES.map((_, i) => (
              <View
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === activeSlide ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </View>
        </View>

        {/* 2. VENUE DETAILS */}
        <View className="px-6 mb-6 mt-8">
          <Text
            className="text-white text-4xl font-bold mb-2"
            style={{ fontFamily: "Jost-Medium" }}
          >
            {venueName}
          </Text>

          {/* ⭐ STARS & REVIEWS (Restored!) */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("VenueReviews", { venueName, venueId })
            }
            className="flex-row items-center mb-4 bg-white/5 self-start px-3 py-2 rounded-lg border border-white/5"
          >
            <Star color="#FACC15" size={16} fill="#FACC15" className="mr-2" />
            <Text className="text-white font-bold text-sm mr-1">4.8</Text>
            <Text className="text-gray-400 text-xs mr-2">(120 Reviews)</Text>
            <ChevronRight color="#666" size={14} />
          </TouchableOpacity>

          <View className="flex-row items-center mb-6">
            <MapPin color="#FA8900" size={16} className="mr-2" />
            <Text className="text-gray-300 text-base">
              100 Strand St, Cape Town City Centre
            </Text>
          </View>

          {/* Action Row */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={handleGetDirections}
              className="flex-1 shadow-lg shadow-orange-500/20"
            >
              <LinearGradient
                {...fireGradient}
                className="py-3 rounded-xl items-center justify-center flex-row"
              >
                <Navigation color="white" size={18} className="mr-2" />
                <Text className="text-white font-bold">Get Directions</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white/10 py-3 px-6 rounded-xl items-center justify-center border border-white/10 flex-row">
              <Globe color="white" size={18} className="mr-2" />
              <Text className="text-white font-bold">Website</Text>
            </TouchableOpacity>
          </View>

          {/* Amenities */}
          <View className="flex-row flex-wrap gap-2 mb-2">
            {AMENITIES.map((a, i) => (
              <View
                key={i}
                className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
              >
                {a.icon}
                <Text className="text-gray-400 text-xs font-bold ml-2">
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. EVENTS GRID */}
        <Text
          className="text-white text-xl font-bold px-6 mb-4 mt-2"
          style={{ fontFamily: "Jost-Medium" }}
        >
          Upcoming Events
        </Text>
        <FlatList
          data={VENUE_EVENTS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderEventItem}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* FULL SCREEN GALLERY MODAL */}
      <Modal
        visible={showFullGallery}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowFullGallery(false)}
      >
        <View className="flex-1 bg-black">
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
            {VENUE_IMAGES.map((img, index) => (
              <View
                key={index}
                style={{
                  width: width,
                  height: height,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={img}
                  style={{ width: width, height: width * 1.2 }}
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

      <BottomNav />
    </View>
  );
};

export default VenueProfileScreen;
