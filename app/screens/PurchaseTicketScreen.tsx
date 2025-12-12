import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Minus,
  Plus,
  CreditCard,
  Wallet,
  ShieldCheck,
} from "lucide-react-native";

import { bannerGradient, fireGradient } from "../styles/colours";
import TopBanner from "../components/TopBanner";
import { RootStackParamList } from "../types/types";
import { supabase } from "../lib/supabase";

type PurchaseRouteProp = RouteProp<RootStackParamList, "PurchaseTicket">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PurchaseTicketScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PurchaseRouteProp>();

  const [isBuying, setIsBuying] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // 1. EXTRACT PARAMS
  const {
    eventId,
    eventName: initialName,
    ticket_tiers: initialTiers,
    banner: initialBanner,
    time: initialTime,
    location: initialLocation,
  } = route.params || {};

  const [eventDetails, setEventDetails] = useState({
    name: initialName || "",
    time: initialTime || "",
    location: initialLocation || "",
    banner: initialBanner || require("../assets/event-placeholder.png"),
  });

  const [tickets, setTickets] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple">("card");

  // 2. FETCH DATA IF MISSING
  useEffect(() => {
    if (!eventId) {
      Alert.alert("Error", "No Event ID found");
      navigation.goBack();
      return;
    }

    loadData();
  }, [eventId]);

  const loadData = async () => {
    // A. USE PASSED DATA (If available)
    if (initialName && initialTiers && initialTiers.length > 0) {
      // ✅ FILTER LOGIC: Only show active tickets
      const activeOnly = initialTiers.filter((t: any) => t.is_active !== false); // default to true if undefined

      const formatted = activeOnly.map((tier: any, index: number) => ({
        ...tier,
        id: tier.id || index.toString(),
        quantity: 0,
      }));
      setTickets(formatted);
      return;
    }

    // B. FETCH FROM DB (If data missing)
    setLoadingData(true);
    try {
      // Fetch Event Details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;

      setEventDetails({
        name: eventData.title,
        time: new Date(eventData.date).toLocaleDateString(),
        location: eventData.location_text,
        banner: eventData.banner_url
          ? { uri: eventData.banner_url }
          : require("../assets/event-placeholder.png"),
      });

      // Fetch Ticket Tiers
      const { data: tierData, error: tierError } = await supabase
        .from("ticket_tiers")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true); // ✅ DB FILTER: Only fetch active rows

      if (tierError) throw tierError;

      if (tierData) {
        const formatted = tierData.map((tier) => ({
          ...tier,
          quantity: 0,
        }));
        setTickets(formatted);
      }
    } catch (err) {
      console.log("Error loading event data:", err);
      Alert.alert("Error", "Could not load event details.");
    } finally {
      setLoadingData(false);
    }
  };

  const subtotal = tickets.reduce((acc, t) => acc + t.price * t.quantity, 0);
  const fees = subtotal * 0.05;
  const total = subtotal + fees;

  const updateQuantity = (id: string, change: number) => {
    setTickets((curr) =>
      curr.map((t) => {
        if (t.id === id) {
          const newQty = Math.max(0, t.quantity + change);
          return { ...t, quantity: newQty };
        }
        return t;
      })
    );
  };

  const handleCheckout = async () => {
    if (total === 0) {
      Alert.alert("Cart Empty", "Please select at least one ticket.");
      return;
    }

    const purchasedTier = tickets.find((t) => t.quantity > 0);
    if (!purchasedTier) return;
    const validEventId = eventId!;

    Alert.alert(
      "Confirm Payment",
      `Charge R ${total.toFixed(0)} to your ${paymentMethod}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: async () => {
            setIsBuying(true);

            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                Alert.alert("Error", "You must be logged in to buy tickets.");
                return;
              }

              const uniqueQrCode = `GK-${validEventId.substring(
                0,
                4
              )}-${Date.now().toString().slice(-6)}`;

              const { error } = await supabase
                .from("tickets")
                .insert([
                  {
                    event_id: validEventId,
                    user_id: user.id,
                    tier_id: purchasedTier.id,
                    qr_code: uniqueQrCode,
                    status: "valid",
                    purchased_at: new Date().toISOString(),
                  },
                ])
                .select()
                .single();

              if (error) throw error;

              navigation.navigate("TicketDisplay", {
                eventId: validEventId,
                eventTitle: eventDetails.name,
                ticketId: `#${uniqueQrCode}`,
                eventImage: eventDetails.banner,
                eventLocation: eventDetails.location,
                eventTime: eventDetails.time,
                ticketTierName: purchasedTier.name,
                ticketPrice: total.toFixed(0),
              });
            } catch (error: any) {
              console.error("Purchase error:", error);
              Alert.alert(
                "Purchase Failed",
                error.message || "Could not complete purchase"
              );
            } finally {
              setIsBuying(false);
            }
          },
        },
      ]
    );
  };

  if (loadingData) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#FA8900" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          {/* Header */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4"
            >
              <LinearGradient
                {...fireGradient}
                className="w-10 h-10 rounded-full items-center justify-center"
              >
                <ArrowLeft color="white" size={24} />
              </LinearGradient>
            </TouchableOpacity>
            <View>
              <Text className="text-white/60 text-xs uppercase font-bold tracking-widest">
                Checkout
              </Text>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Secure Payment
              </Text>
            </View>
          </View>

          {/* Event Recap */}
          <View className="flex-row bg-white/10 border border-white/10 p-3 rounded-2xl mb-8">
            <Image
              source={
                typeof eventDetails.banner === "string"
                  ? { uri: eventDetails.banner }
                  : eventDetails.banner
              }
              className="w-20 h-20 rounded-xl mr-4"
              resizeMode="cover"
            />
            <View className="flex-1 justify-center">
              <Text
                className="text-white font-bold text-xl mb-1"
                numberOfLines={1}
              >
                {eventDetails.name}
              </Text>
              <Text className="text-gray-300 text-sm" numberOfLines={1}>
                {eventDetails.time} • {eventDetails.location}
              </Text>
            </View>
          </View>

          {/* Ticket Selection */}
          <Text className="text-white text-xl font-bold mb-4">
            Select Tickets
          </Text>

          {tickets.length === 0 ? (
            <View className="bg-white/5 p-6 rounded-2xl items-center mb-4">
              <Text className="text-gray-400">
                No active tickets available.
              </Text>
            </View>
          ) : (
            tickets.map((t) => (
              <View
                key={t.id}
                className="flex-row items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl mb-3"
              >
                <View>
                  <Text className="text-white font-bold text-lg">{t.name}</Text>
                  <Text className="text-orange-400 font-bold">R {t.price}</Text>
                </View>

                <View className="flex-row items-center bg-black/40 rounded-lg p-1 border border-white/10">
                  <TouchableOpacity
                    onPress={() => updateQuantity(t.id, -1)}
                    className={`p-2 rounded-md ${
                      t.quantity === 0 ? "opacity-30" : "bg-white/10"
                    }`}
                    disabled={t.quantity === 0}
                  >
                    <Minus color="white" size={16} />
                  </TouchableOpacity>
                  <Text className="text-white font-bold text-lg mx-4 w-4 text-center">
                    {t.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(t.id, 1)}
                    className="p-2 rounded-md bg-white/10"
                  >
                    <Plus color="white" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Payment Method Section (Same as before) */}
          <Text className="text-white text-xl font-bold mb-4 mt-4">
            Payment Method
          </Text>
          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity
              onPress={() => setPaymentMethod("card")}
              className={`flex-1 p-4 rounded-2xl border items-center ${
                paymentMethod === "card"
                  ? "bg-orange-500/20 border-orange-500"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <CreditCard
                color={paymentMethod === "card" ? "#FA8900" : "white"}
                size={24}
                className="mb-2"
              />
              <Text
                className={`font-bold ${
                  paymentMethod === "card" ? "text-orange-400" : "text-white"
                }`}
              >
                Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPaymentMethod("apple")}
              className={`flex-1 p-4 rounded-2xl border items-center ${
                paymentMethod === "apple"
                  ? "bg-orange-500/20 border-orange-500"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <Wallet
                color={paymentMethod === "apple" ? "#FA8900" : "white"}
                size={24}
                className="mb-2"
              />
              <Text
                className={`font-bold ${
                  paymentMethod === "apple" ? "text-orange-400" : "text-white"
                }`}
              >
                Apple Pay
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary Section (Same as before) */}
          <View className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Subtotal</Text>
              <Text className="text-white font-bold">R {subtotal}</Text>
            </View>
            <View className="flex-row justify-between mb-4 pb-4 border-b border-white/10">
              <Text className="text-gray-400">Service Fees (5%)</Text>
              <Text className="text-white font-bold">R {fees.toFixed(0)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-xl font-bold">Total</Text>
              <Text className="text-white text-3xl font-bold">
                R {total.toFixed(0)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-center items-center mb-4 opacity-60">
            <ShieldCheck color="#aaa" size={14} className="mr-2" />
            <Text className="text-gray-400 text-xs">
              Secure 256-bit SSL Encrypted Payment
            </Text>
          </View>
        </ScrollView>

        {/* PAY BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full shadow-lg shadow-orange-500/20"
            onPress={handleCheckout}
            disabled={isBuying}
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-full items-center justify-center"
            >
              {isBuying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  className="text-white text-xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  PAY R {total.toFixed(0)}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default PurchaseTicketScreen;
