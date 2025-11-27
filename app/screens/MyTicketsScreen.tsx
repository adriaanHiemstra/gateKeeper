import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Search,
  QrCode,
  Calendar,
  MapPin,
} from "lucide-react-native";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Styles
import { bannerGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const MyTicketsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock Data
  const initialTickets = [
    {
      id: "1",
      title: "Just Between Us",
      date: "28 Oct 2025",
      time: "20:00",
      location: "Clifton 4th",
      image: require("../assets/event-placeholder.png"),
    },
    {
      id: "2",
      title: "Secrets of Summer",
      date: "15 Nov 2025",
      time: "14:00",
      location: "Val de Vie",
      image: require("../assets/image-placeholder-2.png"),
    },
    {
      id: "3",
      title: "Techno Tunnel",
      date: "01 Dec 2025",
      time: "22:00",
      location: "The Power Station",
      image: require("../assets/profile-pic-1.png"),
    },
  ];

  const [tickets, setTickets] = useState(initialTickets);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = initialTickets.filter((item) =>
        item.title.toLowerCase().includes(text.toLowerCase())
      );
      setTickets(filtered);
    } else {
      setTickets(initialTickets);
    }
  };

  const renderTicket = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate("TicketDisplay", {
          eventTitle: item.title,
          ticketId: `#GK-${item.id}8842`,
          eventImage: item.image,
          eventLocation: item.location,
          eventTime: `${item.date} • ${item.time}`,
        })
      }
      className="mb-4 bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
    >
      <View className="flex-row p-4">
        {/* Event Image */}
        <Image
          source={item.image}
          className="w-24 h-24 rounded-2xl mr-4"
          resizeMode="cover"
        />

        {/* Info Column */}
        <View className="flex-1 justify-center">
          <Text
            className="text-white text-xl font-bold mb-1"
            style={{ fontFamily: "Jost-Medium" }}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <View className="flex-row items-center mb-1">
            <Calendar color="#FA8900" size={14} className="mr-1" />
            <Text className="text-gray-300 text-xs">
              {item.date} • {item.time}
            </Text>
          </View>

          <View className="flex-row items-center">
            <MapPin color="#666" size={14} className="mr-1" />
            <Text className="text-gray-400 text-xs">{item.location}</Text>
          </View>
        </View>

        {/* QR Code Action Area */}
        <View className="justify-center pl-2 border-l border-white/10 ml-2">
          <View className="bg-white/10 p-2 rounded-xl">
            <QrCode color="white" size={24} />
          </View>
        </View>
      </View>

      {/* Footer Strip */}
      <View className="bg-white/5 px-4 py-2 flex-row justify-between items-center">
        <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">
          General Access
        </Text>
        <Text className="text-orange-500 text-xs font-bold">Tap to View</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-32 px-6">
          {/* Header */}
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
              Your Tickets
            </Text>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14 mb-8">
            <Search color="#FA8900" size={24} className="mr-3" />
            <TextInput
              placeholder="Search your tickets..."
              placeholderTextColor="#666"
              className="flex-1 text-white text-lg font-medium h-full"
              style={{ fontFamily: "Jost-Medium" }}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* List */}
          <FlatList
            data={tickets}
            renderItem={renderTicket}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center mt-10">
                <Text className="text-gray-500">No tickets found.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default MyTicketsScreen;
