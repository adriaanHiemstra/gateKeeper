import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, ShieldCheck, Receipt } from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Backend
import { supabase } from "../../lib/supabase";

// Styles
import { bannerGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  success: { label: "Paid", cls: "text-green-400" },
  refunded: { label: "Refunded", cls: "text-red-400" },
};

const TicketsPaymentsSettings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Real purchase history — only actual money movements (paid / refunded).
      const { data, error } = await supabase
        .from("transactions")
        .select("reference, amount, status, created_at, events ( title )")
        .eq("user_id", user.id)
        .in("status", ["success", "refunded"])
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.log("Error loading payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          {/* Header */}
          <View className="flex-row items-center mb-8">
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
              Payments
            </Text>
          </View>

          {/* How payments work — honest, no stored cards */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 flex-row items-start">
            <ShieldCheck color="#FA8900" size={24} className="mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-white font-bold text-lg mb-1 ml-2">
                Secured by Paystack
              </Text>
              <Text className="text-gray-400 text-sm leading-5 ml-2">
                You enter your card on Paystack's secure checkout each time you
                buy — your card details are never stored in the app.
              </Text>
            </View>
          </View>

          {/* Real purchase history */}
          <Text className="text-gray-400 text-sm font-bold uppercase mb-4 ml-1">
            Purchase History
          </Text>

          {loading ? (
            <ActivityIndicator color="#FA8900" className="mt-6" />
          ) : transactions.length === 0 ? (
            <View className="bg-white/5 border border-white/10 rounded-2xl p-6 items-center">
              <Receipt color="#666" size={28} />
              <Text className="text-gray-500 mt-2 text-center">
                No purchases yet. Tickets you buy will show up here.
              </Text>
            </View>
          ) : (
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
              {transactions.map((t, i) => {
                const meta = STATUS_STYLES[t.status] ?? {
                  label: t.status,
                  cls: "text-gray-400",
                };
                const date = t.created_at
                  ? new Date(t.created_at).toLocaleDateString()
                  : "";
                return (
                  <View
                    key={t.reference}
                    className={`flex-row justify-between items-center ${
                      i < transactions.length - 1
                        ? "mb-4 border-b border-white/5 pb-4"
                        : ""
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-white font-bold text-base"
                        numberOfLines={1}
                      >
                        {(t.events as any)?.title || "Event ticket"}
                      </Text>
                      <Text className={`text-xs font-bold ${meta.cls}`}>
                        {date} • {meta.label}
                      </Text>
                    </View>
                    <Text className="text-white font-bold text-lg">
                      R {((t.amount ?? 0) / 100).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default TicketsPaymentsSettings;
