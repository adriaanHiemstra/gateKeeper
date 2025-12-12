// app/screens/MyTicketsScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Search,
  QrCode,
  Calendar,
  MapPin,
} from "lucide-react-native";

import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";
import { bannerGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";
import { supabase } from "../lib/supabase";

const MyTicketsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [])
  );

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          id,
          event_id, 
          qr_code,
          status,
          purchased_at,
          events (
            title,
            date,
            location_text, 
            banner_url
          ),
          ticket_tiers (
            name,
            price
          )
        `
        ) // ✅ Added event_id to selection
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.log("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderTicket = ({ item }: { item: any }) => {
    const event = item.events || {};
    const tier = item.ticket_tiers || {};

    const eventTitle = event.title || "Unknown Event";
    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString()
      : "Date TBA";
    const eventTime = event.date
      ? new Date(event.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const eventLoc = event.location_text || "TBA";
    const tierName = tier.name || "General Access";
    const imageSource = event.banner_url
      ? { uri: event.banner_url }
      : require("../assets/event-placeholder.png");

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("TicketDisplay", {
            eventId: item.event_id, // ✅ FIX: Added this so the button works
            eventTitle: eventTitle,
            ticketId: `#${item.qr_code}`,
            eventImage: imageSource,
            eventLocation: eventLoc,
            eventTime: `${eventDate} • ${eventTime}`,
            ticketTierName: tierName,
            ticketPrice: tier.price,
          })
        }
        className="mb-4 bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
      >
        <View className="flex-row p-4">
          <Image
            source={imageSource}
            className="w-24 h-24 rounded-2xl mr-4"
            resizeMode="cover"
          />

          <View className="flex-1 justify-center">
            <Text
              className="text-white text-xl font-bold mb-1"
              style={{ fontFamily: "Jost-Medium" }}
              numberOfLines={1}
            >
              {eventTitle}
            </Text>

            <View className="flex-row items-center mb-1">
              <Calendar color="#FA8900" size={14} className="mr-1" />
              <Text className="text-gray-300 text-xs">
                {eventDate} • {eventTime}
              </Text>
            </View>

            <View className="flex-row items-center">
              <MapPin color="#666" size={14} className="mr-1" />
              <Text className="text-gray-400 text-xs" numberOfLines={1}>
                {eventLoc}
              </Text>
            </View>
          </View>

          <View className="justify-center pl-2 border-l border-white/10 ml-2">
            <View className="bg-white/10 p-2 rounded-xl">
              <QrCode color="white" size={24} />
            </View>
          </View>
        </View>

        <View className="bg-white/5 px-4 py-2 flex-row justify-between items-center">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">
            {tierName}
          </Text>
          <Text className="text-orange-500 text-xs font-bold">Tap to View</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredTickets = tickets.filter((t) => {
    const title = t.events?.title || "";
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-32 px-6">
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

          <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14 mb-8">
            <Search color="#FA8900" size={24} className="mr-3" />
            <TextInput
              placeholder="Search..."
              placeholderTextColor="#666"
              className="flex-1 text-white text-lg font-medium h-full"
              style={{ fontFamily: "Jost-Medium" }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <ActivityIndicator color="#FA8900" size="large" className="mt-10" />
          ) : (
            <FlatList
              data={filteredTickets}
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
          )}
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default MyTicketsScreen;
