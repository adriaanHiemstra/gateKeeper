// app/screens/TicketDisplayScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg"; // 🚨 NEW: Client-side QR generator

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Backend
import { supabase } from "../lib/supabase";

// Styles & Types
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const { width } = Dimensions.get("window");
const QR_SIZE = width * 0.7;

type TicketPage = { qrCode: string; tierName: string; price?: string | number };

const TicketDisplayScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();

  const {
    eventId,
    eventTitle = "Event Name",
    ticketId,
    paymentReference,
    eventImage,
    eventLocation,
    eventTime,
    ticketTierName = "General Access",
    ticketPrice,
  } = route.params || {};

  // 🚨 CLEANUP: Strip the display '#' so the QR encodes the exact code stored in
  // the DB. If there's no real code, we render no QR rather than a fake one.
  const cleanTicketCode = ticketId
    ? ticketId.startsWith("#")
      ? ticketId.slice(1)
      : ticketId
    : null;

  // Multi-ticket orders (quantity > 1) mint one row per ticket, all sharing
  // the same payment_reference. When we have one, fetch every sibling so the
  // user can swipe between them instead of only ever seeing the first.
  const [siblingTickets, setSiblingTickets] = useState<TicketPage[] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const listRef = useRef<FlatList<TicketPage>>(null);

  useEffect(() => {
    if (!paymentReference) return;
    (async () => {
      const { data } = await supabase
        .from("tickets")
        .select("qr_code, ticket_tiers ( name, price )")
        .eq("payment_reference", paymentReference)
        .order("qr_code", { ascending: true });

      if (data && data.length > 1) {
        setSiblingTickets(
          data.map((t: any) => ({
            qrCode: t.qr_code,
            tierName: t.ticket_tiers?.name ?? ticketTierName,
            price: t.ticket_tiers?.price,
          }))
        );
      }
    })();
  }, [paymentReference]);

  // Single ticket (no siblings, or none found) falls back to the ticket
  // passed in via route params — unchanged behaviour, no swiping.
  const pages: TicketPage[] =
    siblingTickets ??
    (cleanTicketCode
      ? [{ qrCode: cleanTicketCode, tierName: ticketTierName, price: ticketPrice }]
      : []);

  // Land on the ticket the user actually tapped (e.g. from My Tickets),
  // not always the first page of the order.
  useEffect(() => {
    if (!siblingTickets || !cleanTicketCode) return;
    const idx = siblingTickets.findIndex((t) => t.qrCode === cleanTicketCode);
    if (idx > 0) {
      listRef.current?.scrollToOffset({ offset: idx * width, animated: false });
      setPageIndex(idx);
    }
  }, [siblingTickets]);

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

  const handlePageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== pageIndex) setPageIndex(idx);
  };

  const renderTicketPage = ({ item }: { item: TicketPage }) => (
    <View style={{ width }} className="items-center px-6">
      {/* Ticket Type Badge */}
      <View className="bg-orange-500/20 px-4 py-1 rounded-full mb-4 border border-orange-500/50">
        <Text className="text-orange-400 font-bold uppercase tracking-widest text-xs">
          {item.tierName}
        </Text>
      </View>

      <Text className="text-gray-400 text-base mb-8 font-medium tracking-wider">
        {`ID: #${item.qrCode}`}
        {item.price ? ` • R${item.price}` : ""}
      </Text>

      {/* QR Code Card */}
      <View
        className="bg-white rounded-3xl items-center justify-center shadow-2xl shadow-black/80 mb-4 p-4"
        style={{ width: QR_SIZE, height: QR_SIZE }}
      >
        <QRCode
          value={item.qrCode}
          size={QR_SIZE - 40}
          backgroundColor="white"
          color="black"
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-32 mt-4 items-center">
          {/* Header */}
          <View className="w-full flex-row items-center mb-6 px-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 bg-white/10 p-2 rounded-full"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            <Text
              className="text-white text-3xl font-bold flex-1"
              style={{ fontFamily: "Jost-Medium" }}
            >
              Your Ticket{pages.length > 1 ? "s" : ""}
            </Text>
          </View>

          {/* Event Title */}
          <Text
            className="text-white text-3xl font-bold text-center mb-2 leading-tight px-6"
            style={{ fontFamily: "Jost-Medium" }}
          >
            {eventTitle}
          </Text>

          {pages.length > 0 ? (
            <FlatList
              ref={listRef}
              data={pages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.qrCode}
              renderItem={renderTicketPage}
              onMomentumScrollEnd={handlePageScroll}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
            />
          ) : (
            <View
              className="bg-white rounded-3xl items-center justify-center shadow-2xl shadow-black/80 mb-8 p-4 mx-6"
              style={{ width: QR_SIZE, height: QR_SIZE }}
            >
              <Text className="text-gray-500 text-center px-6 font-medium">
                Ticket code unavailable.{"\n"}Find this ticket in My Tickets.
              </Text>
            </View>
          )}

          {/* Page dots — only when there's more than one ticket to swipe between */}
          {pages.length > 1 && (
            <View className="flex-row items-center mb-8">
              {pages.map((_, i) => (
                <View
                  key={i}
                  className={`h-2 rounded-full mx-1 ${
                    i === pageIndex ? "bg-orange-500 w-6" : "bg-white/20 w-2"
                  }`}
                />
              ))}
            </View>
          )}

          <Text
            className="text-white/60 text-base text-center font-medium mb-8 px-6"
            style={{ fontFamily: "Jost-Medium" }}
          >
            {pages.length > 1
              ? `Ticket ${pageIndex + 1} of ${pages.length} • Show this at the door`
              : "Show this at the door"}
          </Text>

          {/* EVENT INFO BUTTON */}
          <TouchableOpacity
            onPress={handleViewEvent}
            activeOpacity={0.9}
            className="w-full shadow-lg shadow-orange-500/20 px-6"
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
