import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from "@react-navigation/native";
import { ArrowLeft, Search, CheckCircle, User, RotateCcw } from "lucide-react-native";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";

// Backend & types
import { supabase } from "../../lib/supabase";
import { RootStackParamList } from "../../types/types";

// Styles
import { bannerGradient } from "../../styles/colours";

type GuestListRouteProp = RouteProp<RootStackParamList, "GuestList">;

const GuestListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<GuestListRouteProp>();
  const { eventId, eventName } = route.params || ({} as any);

  const [searchText, setSearchText] = useState("");
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyRef, setBusyRef] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          "id, status, payment_reference, purchased_at, ticket_tiers ( name ), profiles ( full_name, username, email )"
        )
        .eq("event_id", eventId)
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (err) {
      console.log("Error fetching guests:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      fetchGuests();
    }, [fetchGuests])
  );

  // Manual check-in fallback (the scanner is the main path). Host RLS allows
  // updating tickets for their own events. Refunded tickets are locked.
  const toggleCheckIn = async (guest: any) => {
    if (guest.status === "refunded") return;
    const next = guest.status === "scanned" ? "valid" : "scanned";
    // optimistic
    setGuests((curr) =>
      curr.map((g) => (g.id === guest.id ? { ...g, status: next } : g))
    );
    const { error } = await supabase
      .from("tickets")
      .update({ status: next })
      .eq("id", guest.id);
    if (error) {
      Alert.alert("Couldn't update", error.message);
      fetchGuests(); // revert to truth
    }
  };

  // Count tickets per order so we can warn the host they're refunding the whole order.
  const orderCounts = guests.reduce((acc: Record<string, number>, g) => {
    if (g.payment_reference) acc[g.payment_reference] = (acc[g.payment_reference] || 0) + 1;
    return acc;
  }, {});

  const handleRefund = (guest: any) => {
    const reference = guest.payment_reference;
    if (!reference) {
      Alert.alert("Can't refund", "This ticket has no linked payment.");
      return;
    }
    const count = orderCounts[reference] || 1;
    Alert.alert(
      "Refund order",
      `This refunds the full order${count > 1 ? ` (${count} tickets)` : ""} through Paystack and invalidates ${
        count > 1 ? "those tickets" : "the ticket"
      }. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refund",
          style: "destructive",
          onPress: async () => {
            setBusyRef(reference);
            try {
              const { data, error } = await supabase.functions.invoke(
                "refund-transaction",
                { body: { reference } }
              );
              if (error || !data?.ok) {
                Alert.alert("Refund failed", data?.error ?? "Please try again.");
                return;
              }
              Alert.alert("Refunded", "The order has been refunded.");
              fetchGuests();
            } catch (e: any) {
              Alert.alert("Refund failed", e?.message ?? "Please try again.");
            } finally {
              setBusyRef(null);
            }
          },
        },
      ]
    );
  };

  const guestName = (g: any) =>
    g.profiles?.full_name || g.profiles?.username || g.profiles?.email || "Guest";

  const filteredGuests = guests.filter((g) => {
    const hay = `${guestName(g)} ${g.ticket_tiers?.name ?? ""}`.toLowerCase();
    return hay.includes(searchText.toLowerCase());
  });

  // Stats (refunded tickets don't count toward attendance)
  const active = guests.filter((g) => g.status !== "refunded");
  const total = active.length;
  const checkedIn = active.filter((g) => g.status === "scanned").length;
  const remaining = total - checkedIn;

  const renderGuest = ({ item }: { item: any }) => {
    const isCheckedIn = item.status === "scanned";
    const isRefunded = item.status === "refunded";
    const tierName = item.ticket_tiers?.name || "General Admission";
    const refunding = busyRef && item.payment_reference === busyRef;

    return (
      <View
        className={`flex-row items-center justify-between bg-white/5 border border-white/10 p-4 mb-3 rounded-2xl ${
          isRefunded ? "opacity-50" : ""
        }`}
      >
        <View className="flex-row items-center flex-1">
          <View className="bg-white/10 p-3 rounded-full mr-4">
            <User color={isCheckedIn ? "#4ade80" : "white"} size={20} />
          </View>
          <View className="flex-1 pr-2">
            <Text
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Jost-Medium" }}
              numberOfLines={1}
            >
              {guestName(item)}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${
                  tierName.toLowerCase().includes("vip") ? "bg-purple-500" : "bg-blue-400"
                }`}
              />
              <Text className="text-gray-400 text-sm" numberOfLines={1}>
                {tierName}
                {isRefunded ? " • Refunded" : ""}
              </Text>
            </View>
          </View>
        </View>

        {isRefunded ? (
          <View className="px-4 py-2 rounded-full border bg-red-500/10 border-red-500/30">
            <Text className="text-red-400 font-bold text-xs uppercase">Refunded</Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => handleRefund(item)}
              disabled={!!refunding}
              className="mr-2 p-2 rounded-full bg-white/10 border border-white/10"
            >
              {refunding ? (
                <ActivityIndicator color="#f87171" size="small" />
              ) : (
                <RotateCcw color="#f87171" size={16} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleCheckIn(item)}
              activeOpacity={0.8}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                isCheckedIn
                  ? "bg-green-500/20 border-green-500/50"
                  : "bg-white/10 border-white/20"
              }`}
            >
              {isCheckedIn ? (
                <>
                  <CheckCircle color="#4ade80" size={16} className="mr-2" />
                  <Text className="text-green-400 font-bold text-xs uppercase">In</Text>
                </>
              ) : (
                <Text className="text-white font-bold text-xs uppercase">Check In</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

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
            <View className="flex-1">
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Guest List
              </Text>
              {eventName ? (
                <Text className="text-gray-400 text-sm" numberOfLines={1}>
                  {eventName}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Live Stats Row */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl items-center">
              <Text className="text-gray-400 text-xs uppercase font-bold mb-1">Total</Text>
              <Text className="text-white text-2xl font-bold">{total}</Text>
            </View>
            <View className="flex-1 bg-green-500/10 border border-green-500/30 p-3 rounded-xl items-center">
              <Text className="text-green-400 text-xs uppercase font-bold mb-1">In</Text>
              <Text className="text-green-400 text-2xl font-bold">{checkedIn}</Text>
            </View>
            <View className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl items-center">
              <Text className="text-gray-400 text-xs uppercase font-bold mb-1">Pending</Text>
              <Text className="text-white text-2xl font-bold">{remaining}</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white/10 rounded-xl px-4 h-12 mb-6 border border-white/10">
            <Search color="#999" size={20} className="mr-3" />
            <TextInput
              placeholder="Search by name or ticket..."
              placeholderTextColor="#666"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 text-white font-medium h-full"
              style={{ fontFamily: "Jost-Medium" }}
            />
          </View>

          {/* The List */}
          {loading ? (
            <ActivityIndicator color="#D087FF" size="large" className="mt-10" />
          ) : (
            <FlatList
              data={filteredGuests}
              renderItem={renderGuest}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={
                <View className="items-center mt-10">
                  <Text className="text-gray-500">
                    {searchText
                      ? `No guests matching "${searchText}"`
                      : "No tickets sold yet."}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default GuestListScreen;
