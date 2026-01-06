// app/screens/TeamAccessScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  Shield,
  Plus,
  Trash2,
  Copy,
  Users,
  RefreshCw,
} from "lucide-react-native";

// Backend
import { supabase } from "../../lib/supabase";

// Components & Styles
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";
import { bannerGradient, electricGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

type TeamAccessRouteProp = RouteProp<RootStackParamList, "TeamAccess">;

const TeamAccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<TeamAccessRouteProp>();
  // ✅ Retrieve the specific event ID passed from the previous screen
  const { eventId } = route.params || { eventId: null };

  const [activeCodes, setActiveCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // --- 1. FETCH CODES (From 'staff_codes') ---
  const fetchCodes = useCallback(async () => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase
        .from("staff_codes") // ✅ Using your schema table
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActiveCodes(data || []);
    } catch (err) {
      console.log("Error fetching codes:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  // --- 2. GENERATE CODE ---
  const handleGenerateCode = async () => {
    if (!eventId) {
      Alert.alert("Error", "No event selected.");
      return;
    }
    setGenerating(true);
    try {
      // Generate format: "123-456"
      const randomCode =
        Math.floor(100000 + Math.random() * 900000)
          .toString()
          .match(/.{1,3}/g)
          ?.join("-") || "123-456";

      const { error } = await supabase.from("staff_codes").insert({
        event_id: eventId,
        code: randomCode,
        role: "door", // ✅ Matching your schema default
        is_active: true,
      });

      if (error) throw error;

      Alert.alert("Success", `Code ${randomCode} created!`);
      fetchCodes();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setGenerating(false);
    }
  };

  // --- 3. REVOKE CODE ---
  const handleRevoke = (id: string) => {
    Alert.alert(
      "Revoke Access",
      "Staff using this code will be logged out immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            // We soft-delete by setting is_active = false (or you can delete row)
            const { error } = await supabase
              .from("staff_codes")
              .delete() // Deleting row to keep it clean
              .eq("id", id);

            if (!error) fetchCodes();
          },
        },
      ]
    );
  };

  // --- 4. SHARE CODE ---
  const handleShare = async (code: string) => {
    try {
      await Share.share({
        message: `Staff Access Code: ${code}. Use this to log in to the scanner app.`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

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
            <View>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Team Access
              </Text>
              <Text className="text-gray-400 text-sm">
                Manage staff for this event
              </Text>
            </View>
          </View>

          {/* EXPLANATION CARD */}
          <View className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 mb-8 flex-row items-start">
            <Shield color="#D087FF" size={24} className="mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-white font-bold text-lg mb-1 ml-2">
                How this works
              </Text>
              <Text className="text-gray-300 text-sm leading-5 ml-2">
                Generate a code for your door staff. They can use this code to
                log in and scan tickets for{" "}
                <Text className="font-bold text-white">this event only</Text>.
              </Text>
            </View>
          </View>

          {/* GENERATE BUTTON */}
          <TouchableOpacity
            onPress={handleGenerateCode}
            activeOpacity={0.8}
            disabled={generating}
            className="w-full mb-8 shadow-lg shadow-purple-500/30"
          >
            <LinearGradient
              {...electricGradient}
              className="w-full py-4 rounded-xl flex-row items-center justify-center"
            >
              {generating ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Plus color="white" size={24} className="mr-2" />
                  <Text
                    className="text-white text-xl font-bold tracking-wide ml-2"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    GENERATE NEW CODE
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* ACTIVE CODES LIST */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Active Codes</Text>
            <TouchableOpacity onPress={fetchCodes}>
              <RefreshCw color="#666" size={18} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#D087FF" className="mt-10" />
          ) : activeCodes.length === 0 ? (
            <Text className="text-gray-500 italic mt-4 text-center">
              No active codes for this event.
            </Text>
          ) : (
            activeCodes.map((item) => (
              <View
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4"
              >
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center">
                    <View className="bg-white/10 p-2 rounded-lg mr-3">
                      <Users color="white" size={20} />
                    </View>
                    <View>
                      <Text className="text-white font-bold text-lg capitalize">
                        {item.role} Staff
                      </Text>
                      <Text className="text-green-400 text-xs font-bold uppercase">
                        • Active
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRevoke(item.id)}
                    className="bg-red-500/10 p-2 rounded-full"
                  >
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>

                {/* THE CODE BOX */}
                <View className="flex-row items-center bg-black/40 rounded-xl border border-dashed border-white/20 p-3 justify-between">
                  <View>
                    <Text className="text-gray-500 text-xs uppercase mb-1">
                      Access Code
                    </Text>
                    <Text
                      className="text-white text-3xl font-bold tracking-widest"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      {item.code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleShare(item.code)}
                    className="bg-white/10 p-3 rounded-lg"
                  >
                    <Copy color="white" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default TeamAccessScreen;
