import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Pressable,
  FlatList,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Types
import { RootStackParamList } from "../types/types";

// Components
import EventFeedCard from "../components/EventFeedCard";
import BottomNav from "../components/BottomNav";
import TopBanner from "../components/TopBanner";

// Styles
import { bannerGradient } from "../styles/colours";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 100;
const PANEL_WIDTH = width * 0.85;

const FEED_DATA = [
  {
    id: "1",
    title: "Neon Jungle",
    host: "Rockstar Events",
    hostImg: require("../assets/profile-pic-1.png"),
    image: require("../assets/imagePlaceHolder1.png"),
    attendees: 12,
    friendsList: [
      {
        id: "f1",
        name: "Casey_Frey",
        img: require("../assets/profile-pic-1.png"),
      },
      {
        id: "f2",
        name: "Sarah_J",
        img: require("../assets/profile-pic-2.png"),
      },
      { id: "f3", name: "Mike_T", img: require("../assets/profile-pic-1.png") },
    ],
  },
  {
    id: "2",
    title: "Techno Tunnel",
    host: "Underground SA",
    hostImg: require("../assets/profile-pic-2.png"),
    image: require("../assets/imagePlaceHolder2.png"),
    attendees: 8,
    friendsList: [
      {
        id: "f4",
        name: "David_M",
        img: require("../assets/profile-pic-2.png"),
      },
      {
        id: "f5",
        name: "Amanda_C",
        img: require("../assets/profile-pic-1.png"),
      },
    ],
  },
  {
    id: "3",
    title: "Summer Slam",
    host: "Rockstar Events",
    hostImg: require("../assets/profile-pic-1.png"),
    image: require("../assets/imagePlaceHolder3.png"),
    attendees: 24,
    friendsList: [
      {
        id: "f1",
        name: "Casey_Frey",
        img: require("../assets/profile-pic-1.png"),
      },
      {
        id: "f4",
        name: "David_M",
        img: require("../assets/profile-pic-2.png"),
      },
    ],
  },
];

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- State for Side Panel ---
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  // --- Animations ---
  const translateY = useSharedValue(0);
  const lastContentOffset = useSharedValue(0);
  const isHidden = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastContentOffset.value;

      if (diff > 5 && currentY > 50 && !isHidden.value) {
        isHidden.value = true;
        translateY.value = withTiming(-HEADER_HEIGHT, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      } else if (diff < -5 && isHidden.value) {
        isHidden.value = false;
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }
      lastContentOffset.value = currentY;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Panel Animation
  const panelTranslateX = useSharedValue(width);

  const openPanel = (friends: any[], title: string) => {
    setSelectedFriends(friends);
    setSelectedEventTitle(title);
    setIsPanelOpen(true);
    panelTranslateX.value = withTiming(width - PANEL_WIDTH, {
      duration: 300,
      easing: Easing.out(Easing.exp),
    });
  };

  const closePanel = () => {
    panelTranslateX.value = withTiming(width, { duration: 300 });
    setTimeout(() => setIsPanelOpen(false), 300);
  };

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panelTranslateX.value }],
  }));

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <TopBanner style={headerAnimatedStyle} />

      <Animated.FlatList
        data={FEED_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <EventFeedCard
            id={item.id}
            title={item.title}
            hostName={item.host}
            hostAvatar={item.hostImg}
            image={item.image}
            attendeesCount={item.attendees}
            onOpenSocial={() => openPanel(item.friendsList, item.title)}
            // 👇 FIX: Added these two missing props
            onPressHost={() => navigation.navigate("EventHostProfile")}
            onViewEvent={() =>
              navigation.navigate("EventProfile", {
                eventName: item.title,
                attendees: item.attendees,
                logo: item.hostImg,
                banner: item.image,
              })
            }
          />
        )}
      />

      {/* --- SIDE PANEL OVERLAY --- */}
      {isPanelOpen && (
        <View style={StyleSheet.absoluteFill} className="z-50">
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={closePanel}
          />
          <Animated.View
            style={[
              {
                width: PANEL_WIDTH,
                height: "100%",
                position: "absolute",
                right: 0,
                top: 0,
              },
              panelAnimatedStyle,
            ]}
          >
            <LinearGradient
              {...bannerGradient}
              style={StyleSheet.absoluteFill}
            />
            <SafeAreaView className="flex-1 p-6">
              <View className="flex-row justify-between items-center mb-8 mt-10">
                <View className="flex-1 pr-4">
                  <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">
                    Who's Going?
                  </Text>
                  <Text
                    className="text-white text-2xl font-bold"
                    numberOfLines={2}
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {selectedEventTitle}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closePanel}
                  className="bg-white/10 p-2 rounded-full"
                >
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={selectedFriends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity className="flex-row items-center mb-6">
                    <Image
                      source={item.img}
                      className="w-14 h-14 rounded-full border-2 border-orange-500 mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">
                        {item.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">Going</Text>
                    </View>
                    <ChevronRight color="#666" size={20} />
                  </TouchableOpacity>
                )}
              />

              <View className="mt-4 pt-4 border-t border-white/10">
                <Text className="text-center text-gray-500 text-sm">
                  + {selectedFriends.length > 0 ? 7 : 0} others in your circle
                </Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

      <BottomNav />
    </View>
  );
};

export default HomeScreen;
