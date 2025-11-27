import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Search, Heart } from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2;

const WishListScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock Wishlist Data
  const initialEvents = [
    {
      id: "1",
      title: "Neon Jungle",
      image: require("../../assets/imagePlaceHolder1.png"),
      category: "Techno",
    },
    {
      id: "2",
      title: "Rugby Finals",
      image: require("../../assets/imagePlaceHolder2.png"),
      category: "Sports",
    },
    {
      id: "3",
      title: "Forest Run",
      image: require("../../assets/imagePlaceHolder3.png"),
      category: "Outdoors",
    },
    {
      id: "4",
      title: "Comedy Night",
      image: require("../../assets/imagePlaceHolder4.png"),
      category: "Comedy",
    },
  ];

  const [events, setEvents] = useState(initialEvents);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = initialEvents.filter((item) =>
        item.title.toLowerCase().includes(text.toLowerCase())
      );
      setEvents(filtered);
    } else {
      setEvents(initialEvents);
    }
  };

  // Remove from Wishlist
  const handleRemove = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
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
        })
      }
    >
      <Image
        source={item.image}
        className="w-full h-full opacity-80"
        resizeMode="cover"
      />

      {/* Remove Button (Heart) */}
      <TouchableOpacity
        onPress={() => handleRemove(item.id)}
        className="absolute top-3 right-3 bg-black/50 p-2 rounded-full"
      >
        <Heart color="#FA8900" fill="#FA8900" size={20} />
      </TouchableOpacity>

      {/* Text Overlay */}
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
        <View className="flex-1 pt-32 px-0">
          {/* Header Container (With Padding) */}
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

            {/* Search Bar */}
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
            </View>
          </View>

          {/* Grid (Full Width - No Padding) */}
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center mt-10 px-6">
                <Text className="text-gray-500">No saved events.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default WishListScreen;
