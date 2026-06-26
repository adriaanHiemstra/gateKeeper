import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Key,
  Users,
  UserX,
  ChevronRight,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Backend
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// Styles
import { bannerGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const PrivacySecuritySettings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [showActivity, setShowActivity] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load the user's real privacy flags from their profile.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("show_activity, allow_friend_requests")
          .eq("id", user.id)
          .single();
        if (active && data) {
          setShowActivity(data.show_activity ?? true);
          setAllowFriendRequests(data.allow_friend_requests ?? true);
        }
        if (active) setLoading(false);
      };
      load();
      return () => {
        active = false;
      };
    }, [user]),
  );

  // Optimistically flip the switch, then persist the single column. Revert on error.
  const updateSetting = async (
    column: "show_activity" | "allow_friend_requests",
    value: boolean,
    setter: (v: boolean) => void,
    previous: boolean,
  ) => {
    if (!user) return;
    setter(value);
    const { error } = await supabase
      .from("profiles")
      .update({ [column]: value })
      .eq("id", user.id);
    if (error) {
      setter(previous);
      Alert.alert("Couldn't save", "Please try again.");
    }
  };

  const OptionRow = ({
    label,
    icon,
    value,
    onValueChange,
    type = "toggle",
    onPress,
  }: any) => (
    <TouchableOpacity
      activeOpacity={type === "link" ? 0.7 : 1}
      onPress={type === "link" ? onPress : undefined}
      className="flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-3"
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View className="bg-white/10 p-3 rounded-full mr-4">{icon}</View>
        <Text
          className="text-white font-bold text-lg"
          style={{ fontFamily: "Jost-Medium" }}
        >
          {label}
        </Text>
      </View>

      {type === "toggle" ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#333", true: "#FA8900" }}
          thumbColor={"#fff"}
        />
      ) : (
        <ChevronRight color="#666" size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
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
                Privacy & Security
              </Text>
              <Text className="text-gray-400 text-sm">
                Control who sees your activity
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="pt-20 items-center">
              <ActivityIndicator size="large" color="#FA8900" />
            </View>
          ) : (
            <>
              {/* 1. VISIBILITY */}
              <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
                Visibility
              </Text>

              <OptionRow
                label="Activity Status"
                icon={
                  showActivity ? (
                    <Eye color="#FA8900" size={20} />
                  ) : (
                    <EyeOff color="#666" size={20} />
                  )
                }
                value={showActivity}
                onValueChange={(v: boolean) =>
                  updateSetting("show_activity", v, setShowActivity, showActivity)
                }
              />
              <Text className="text-gray-400 text-xs ml-4 mb-6 leading-5">
                When on, friends can see the events you've saved and are going to.
              </Text>

              <OptionRow
                label="Allow Friend Requests"
                icon={<Users color="#FA8900" size={20} />}
                value={allowFriendRequests}
                onValueChange={(v: boolean) =>
                  updateSetting(
                    "allow_friend_requests",
                    v,
                    setAllowFriendRequests,
                    allowFriendRequests,
                  )
                }
              />
              <Text className="text-gray-400 text-xs ml-4 mb-6 leading-5">
                Turn this off to stop new people from adding you as a friend.
              </Text>

              {/* 2. LOGIN & SECURITY */}
              <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
                Login & Security
              </Text>

              <OptionRow
                type="link"
                label="Change Password"
                icon={<Key color="#FA8900" size={20} />}
                onPress={() => navigation.navigate("ChangePassword")}
              />

              <OptionRow
                type="link"
                label="Blocked Accounts"
                icon={<UserX color="#FA8900" size={20} />}
                onPress={() => navigation.navigate("BlockedAccounts")}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default PrivacySecuritySettings;
