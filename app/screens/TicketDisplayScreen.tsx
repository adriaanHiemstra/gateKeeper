// app/screens/TicketDisplayScreen.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Styles & Types
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const { width } = Dimensions.get("window");
const QR_SIZE = width * 0.7;

const TicketDisplayScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();

  const {
    eventId,
    eventTitle = "Event Name",
    ticketId = "#GK-882910",
    eventImage,
    eventLocation,
    eventTime,
    ticketTierName = "General Access",
    ticketPrice,
  } = route.params || {};

  const handleViewEvent = () => {
    if (!eventId) {
      Alert.alert(
        "Notice",
        "Event details are not linked to this ticket preview."
      );
      return;
    }

    navigation.navigate("EventProfile", {
      eventId: eventId,
      eventName: eventTitle,
      attendees: 120,
      logo: eventImage || require("../assets/event-placeholder.png"),
      banner: eventImage || require("../assets/event-placeholder.png"),
      location: eventLocation || "Unknown Location",
      time: eventTime || "Date TBA",
    });
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {/* ✅ CHANGED: Increased pt-24 to pt-32 and added mt-4 to push content down */}
        <View className="flex-1 pt-32 mt-4 px-6 items-center">
          {/* Header */}
          <View className="w-full flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              className="mr-4 bg-white/10 p-2 rounded-full"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            <Text
              className="text-white text-3xl font-bold flex-1"
              style={{ fontFamily: "Jost-Medium" }}
            >
              Your Ticket
            </Text>
          </View>

          {/* Ticket Type Badge */}
          <View className="bg-orange-500/20 px-4 py-1 rounded-full mb-4 border border-orange-500/50">
            <Text className="text-orange-400 font-bold uppercase tracking-widest text-xs">
              {ticketTierName}
            </Text>
          </View>

          {/* Event Title */}
          <Text
            className="text-white text-3xl font-bold text-center mb-2 leading-tight"
            style={{ fontFamily: "Jost-Medium" }}
          >
            {eventTitle}
          </Text>

          <Text className="text-gray-400 text-base mb-8 font-medium tracking-wider">
            ID: {ticketId} • {ticketPrice ? `R${ticketPrice}` : ""}
          </Text>

          {/* QR Code Card */}
          <View
            className="bg-white rounded-3xl items-center justify-center shadow-2xl shadow-black/80 mb-8"
            style={{ width: QR_SIZE, height: QR_SIZE }}
          >
            <Image
              source={{
                uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`,
              }}
              className="w-full h-full p-4"
              resizeMode="contain"
              style={{ width: QR_SIZE - 40, height: QR_SIZE - 40 }}
            />
          </View>

          <Text
            className="text-white/60 text-base text-center font-medium mb-8"
            style={{ fontFamily: "Jost-Medium" }}
          >
            Show this at the door
          </Text>

          {/* EVENT INFO BUTTON */}
          <TouchableOpacity
            onPress={handleViewEvent}
            activeOpacity={0.9}
            className="w-full shadow-lg shadow-orange-500/20"
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-2xl flex-row items-center justify-center border-t border-white/10"
            >
              <Text
                className="text-white text-xl font-bold tracking-wide ml-2"
                style={{ fontFamily: "Jost-Medium" }}
              >
                EVENT INFO
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BottomNav />
    </View>
  );
};

export default TicketDisplayScreen;
