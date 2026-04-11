import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  ShieldAlert,
  Search,
  X,
  UserCheck,
} from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";
import { bannerGradient } from "../../styles/colours";

const BlockedAccountsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rawBlocked, setRawBlocked] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blocked_users")
      .select(
        "blocked_id, profiles!blocked_users_blocked_id_fkey(id, full_name, username, avatar_url)",
      )
      .eq("blocker_id", user?.id);

    // Flatten the Supabase join result
    setRawBlocked(data?.map((item) => item.profiles) || []);
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return rawBlocked.filter(
      (u) =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, rawBlocked]);

  const handleUnblock = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Unblock", `Allow ${name} to see your profile again?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        onPress: async () => {
          // Optimistic UI
          setRawBlocked((prev) => prev.filter((u) => u.id !== id));
          await supabase
            .from("blocked_users")
            .delete()
            .match({ blocker_id: user?.id, blocked_id: id });
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} className="absolute inset-0" />
      <TopBanner />
      <SafeAreaView className="flex-1 px-6">
        <View className="pt-24 flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
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
                Blocked
              </Text>
            </View>
            <Text className="text-gray-500 font-bold">{rawBlocked.length}</Text>
          </View>

          {/* Search Input */}
          <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-12 mb-6">
            <Search color="#666" size={18} className="mr-2" />
            <TextInput
              placeholder="Search blocked users..."
              placeholderTextColor="#666"
              className="flex-1 text-white"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <ActivityIndicator color="#FA8900" size="large" />
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="flex-row items-center justify-between bg-white/5 p-4 rounded-2xl mb-3 border border-white/5">
                  <View className="flex-row items-center flex-1">
                    <Image
                      source={
                        item.avatar_url
                          ? { uri: item.avatar_url }
                          : require("../../assets/profile-pic-1.png")
                      }
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <View className="flex-1">
                      <Text
                        className="text-white font-bold"
                        style={{ fontFamily: "Jost-Medium" }}
                      >
                        {item.full_name}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        @{item.username}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleUnblock(item.id, item.full_name)}
                    className="bg-white/10 px-4 py-2 rounded-full"
                  >
                    <Text className="text-white font-bold text-xs">
                      Unblock
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View className="items-center mt-20">
                  <ShieldAlert color="#333" size={60} />
                  <Text className="text-gray-500 mt-4 text-center">
                    No blocked users found.
                  </Text>
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

export default BlockedAccountsScreen;
