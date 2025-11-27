import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  Plus,
} from "lucide-react-native";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2;

// Mock Data
const HOST_DATA = {
  name: "Rockstar Events",
  handle: "@rockstarevents_sa",
  image: require("../assets/profile-pic-1.png"),
  bio: "Curating the wildest summer vibes in Cape Town. From rooftop parties to beach festivals, we bring the heat. 🔥",
  followers: "12.4k",
  following: "240",
  events: "48",
};

const HOST_EVENTS = [
  {
    id: "1",
    title: "Neon Jungle",
    image: require("../assets/imagePlaceHolder1.png"),
    category: "Techno",
  },
  {
    id: "2",
    title: "Rugby Finals",
    image: require("../assets/imagePlaceHolder2.png"),
    category: "Sports",
  },
  {
    id: "3",
    title: "Forest Run",
    image: require("../assets/imagePlaceHolder3.png"),
    category: "Outdoors",
  },
  {
    id: "4",
    title: "Comedy Night",
    image: require("../assets/imagePlaceHolder4.png"),
    category: "Comedy",
  },
  {
    id: "5",
    title: "Summer Slam",
    image: require("../assets/imagePlaceHolder5.png"),
    category: "Beach",
  },
  {
    id: "6",
    title: "Jazz Cafe",
    image: require("../assets/imagePlaceHolder6.png"),
    category: "Live Music",
  },
];

const EventHostProfileScreen = () => {
  const navigation = useNavigation();
  const [isFollowing, setIsFollowing] = useState(false);

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="bg-black relative mb-1"
      style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.25 }}
      // In a real app, navigate to EventProfile
      // onPress={() => navigation.navigate('EventProfile', { ... })}
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
          {item.category}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-32">
          {/* HEADER: Profile Info */}
          <View className="px-6 mb-6">
            {/* Top Row: Back + Profile Pic */}
            <View className="flex-row justify-between items-start mb-4">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-white/10 p-2 rounded-full"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>

              <View className="items-center mt-[-20px]">
                <Image
                  source={HOST_DATA.image}
                  className="w-28 h-28 rounded-full border-4 border-[#121212]"
                />
                <View className="flex-row items-center mt-2">
                  <Text
                    className="text-white text-2xl font-bold mr-2"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {HOST_DATA.name}
                  </Text>
                  <CheckCircle color="#FA8900" size={20} fill="#FA8900" />
                </View>
                <Text className="text-gray-400 text-sm">
                  {HOST_DATA.handle}
                </Text>
              </View>

              {/* Spacer to balance Back button */}
              <View className="w-10" />
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-center gap-8 mb-6 border-b border-white/10 pb-6">
              <View className="items-center">
                <Text className="text-white font-bold text-xl">
                  {HOST_DATA.events}
                </Text>
                <Text className="text-gray-500 text-xs uppercase">Events</Text>
              </View>
              <View className="items-center">
                <Text className="text-white font-bold text-xl">
                  {HOST_DATA.followers}
                </Text>
                <Text className="text-gray-500 text-xs uppercase">
                  Followers
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-white font-bold text-xl">4.9</Text>
                <Text className="text-gray-500 text-xs uppercase">Rating</Text>
              </View>
            </View>

            {/* Bio */}
            <Text className="text-gray-300 text-center leading-5 mb-6 px-4">
              {HOST_DATA.bio}
            </Text>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsFollowing(!isFollowing)}
                className="flex-1"
              >
                <LinearGradient
                  {...fireGradient}
                  colors={
                    isFollowing ? ["#333", "#222"] : ["#FA8900", "#942C00"]
                  }
                  className="py-3 rounded-xl items-center justify-center flex-row border border-white/10"
                >
                  {isFollowing ? (
                    <Text className="text-white font-bold">Following</Text>
                  ) : (
                    <>
                      <Plus color="white" size={18} className="mr-2" />
                      <Text className="text-white font-bold">Follow</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 bg-white/10 py-3 rounded-xl items-center justify-center border border-white/10 flex-row">
                <MessageCircle color="white" size={18} className="mr-2" />
                <Text className="text-white font-bold">Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* EVENTS GRID */}
          <FlatList
            data={HOST_EVENTS}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={renderEventItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListHeaderComponent={
              <Text
                className="text-white text-xl font-bold px-6 mb-4"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Upcoming Events
              </Text>
            }
          />
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default EventHostProfileScreen;
