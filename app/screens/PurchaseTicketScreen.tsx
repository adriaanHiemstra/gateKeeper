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
import { ArrowLeft, Minus, Plus, ShieldCheck } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";

import { bannerGradient, fireGradient } from "../styles/colours";
import TopBanner from "../components/TopBanner";
import { RootStackParamList } from "../types/types";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { hasEventEnded } from "../lib/eventFilters";

type PurchaseRouteProp = RouteProp<RootStackParamList, "PurchaseTicket">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PurchaseTicketScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PurchaseRouteProp>();
  const { user } = useAuth();

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

  // Live commission config so the preview total matches what the server charges.
  // pct = percent, flat = rand per ticket. Defaults mirror platform_settings.
  const [feeCfg, setFeeCfg] = useState({ pct: 6, flat: 2 });

  // 2. FETCH DATA IF MISSING
  useEffect(() => {
    if (!eventId) {
      Alert.alert("Error", "No Event ID found");
      navigation.goBack();
      return;
    }

    loadData();
    loadFeeConfig();
  }, [eventId]);

  // Pull the real fee rates: a per-event override wins, else the platform
  // default. Exactly the precedence initialize-transaction uses server-side.
  const loadFeeConfig = async () => {
    try {
      const [{ data: ev }, { data: settings }] = await Promise.all([
        supabase
          .from("events")
          .select("commission_pct, commission_flat")
          .eq("id", eventId)
          .maybeSingle(),
        supabase
          .from("platform_settings")
          .select("default_commission_pct, default_commission_flat")
          .eq("id", 1)
          .maybeSingle(),
      ]);
      const pct = Number(ev?.commission_pct ?? settings?.default_commission_pct ?? 6);
      const flatCents = Number(ev?.commission_flat ?? settings?.default_commission_flat ?? 200);
      setFeeCfg({ pct, flat: flatCents / 100 });
    } catch {
      // keep the 6% + R2 default if config can't be read
    }
  };

  const loadData = async () => {
    // Always re-verify against the DB that the event hasn't ended, even when
    // nav params already carry tier data — a card left open on a feed that
    // hasn't refreshed since the event expired shouldn't be able to reach
    // checkout just because it was tapped before the expiry.
    const { data: freshness } = await supabase
      .from("events")
      .select("date, end_date, requires_tickets, host_id")
      .eq("id", eventId)
      .maybeSingle();

    if (freshness && hasEventEnded(freshness)) {
      Alert.alert(
        "Event Ended",
        "This event has already ended, so tickets are no longer available."
      );
      navigation.goBack();
      return;
    }

    if (freshness && user && freshness.host_id === user.id) {
      Alert.alert("Your Event", "You can't buy tickets to your own event.");
      navigation.goBack();
      return;
    }

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

  // Buyer-pays booking fee: pct% + flat per ticket, read from feeCfg so it
  // mirrors the initialize-transaction Edge Function (incl. per-event overrides).
  const ticketCount = tickets.reduce((acc, t) => acc + t.quantity, 0);
  const subtotal = tickets.reduce((acc, t) => acc + t.price * t.quantity, 0);
  const fees = subtotal * (feeCfg.pct / 100) + feeCfg.flat * ticketCount;
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
    const purchasedTiers = tickets.filter((t) => t.quantity > 0);
    if (purchasedTiers.length === 0) {
      Alert.alert("Cart Empty", "Please select at least one ticket.");
      return;
    }
    if (!eventId) return;

    setIsBuying(true);
    try {
      // 1. Ask the server to price the order and start a Paystack transaction.
      //    We only send tier ids + quantities; the server sets the real prices.
      const cart = purchasedTiers.map((t) => ({
        tier_id: t.id,
        name: t.name,
        price: t.price,
        quantity: t.quantity,
      }));

      const { data: init, error: initErr } = await supabase.functions.invoke(
        "initialize-transaction",
        { body: { eventId, cart } }
      );

      if (initErr || !init?.ok) {
        Alert.alert(
          "Checkout failed",
          init?.error ?? "Couldn't start payment. Please try again."
        );
        return;
      }

      // 2. Open Paystack's hosted checkout; the user pays, then closes the tab.
      await WebBrowser.openBrowserAsync(init.authorization_url);

      // 3. Confirm the real outcome with the server (which mints the tickets).
      const { data: verify } = await supabase.functions.invoke(
        "verify-transaction",
        { body: { reference: init.reference } }
      );

      // The minted ticket is the real proof of purchase. Look for it — briefly
      // polling in case the webhook is still finishing the mint — before
      // deciding what to show, so we never flash an error on a paid order.
      const findTicket = async () =>
        (
          await supabase
            .from("tickets")
            .select("qr_code, ticket_tiers ( name )")
            .eq("payment_reference", init.reference)
            .limit(1)
            .maybeSingle()
        ).data;

      let minted = await findTicket();
      const clearlyFailed =
        verify?.status === "failed" || verify?.status === "abandoned";
      if (!minted && !clearlyFailed) {
        for (let i = 0; i < 3 && !minted; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          minted = await findTicket();
        }
      }

      if (minted) {
        navigation.navigate("TicketDisplay", {
          eventId: eventId,
          eventTitle: eventDetails.name,
          ticketId: minted.qr_code ? `#${minted.qr_code}` : undefined,
          paymentReference: init.reference,
          eventImage: eventDetails.banner,
          eventLocation: eventDetails.location,
          eventTime: eventDetails.time,
          ticketTierName:
            (minted as any)?.ticket_tiers?.name ?? purchasedTiers[0].name,
          ticketPrice: total.toFixed(2),
        });
      } else if (clearlyFailed) {
        Alert.alert(
          "Payment not completed",
          "Your payment didn't go through, so no tickets were issued — you weren't charged."
        );
      } else {
        Alert.alert(
          "Almost there",
          "We're still confirming your payment. If you were charged, your tickets will appear in My Tickets shortly."
        );
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      Alert.alert("Error", error?.message ?? "Something went wrong during checkout.");
    } finally {
      setIsBuying(false);
    }
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
                  <Text className="text-white font-bold text-lg mx-2 w-8 text-center">
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

          {/* Summary Section */}
          <View className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8 mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Subtotal</Text>
              <Text className="text-white font-bold">R {subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-4 pb-4 border-b border-white/10">
              <Text className="text-gray-400">Service Fee</Text>
              <Text className="text-white font-bold">R {fees.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-xl font-bold">Total</Text>
              <Text className="text-white text-3xl font-bold">
                R {total.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-center items-center mb-4 opacity-60">
            <ShieldCheck color="#aaa" size={14} className="mr-2" />
            <Text className="text-gray-400 text-xs">
              Payments secured by Paystack
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
                  PAY R {total.toFixed(2)}
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
