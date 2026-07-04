import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, UserPlus, Check, Clock, Lock, Calendar } from "lucide-react-native";

import TopBanner from "../components/TopBanner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const PLACEHOLDER = require("../assets/profile-pic-1.png");
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, "UserProfile">;

// pending-sent | pending-received | accepted | none
type Rel = "accepted" | "sent" | "received" | "none";

const UserProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { userId } = route.params;
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [rel, setRel] = useState<Rel>("none");
  const [interested, setInterested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: prof }, { data: fr }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, bio, location")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("friendships")
          .select("status, requester_id")
          .or(
            `and(user_id_1.eq.${user.id},user_id_2.eq.${userId}),and(user_id_1.eq.${userId},user_id_2.eq.${user.id})`,
          )
          .maybeSingle(),
      ]);

      setProfile(prof);

      let relation: Rel = "none";
      if (fr) {
        if (fr.status === "accepted") relation = "accepted";
        else if (fr.requester_id === user.id) relation = "sent";
        else relation = "received";
      }
      setRel(relation);

      // Their activity is only readable if you're accepted friends (RLS enforces
      // this on saved_events — approve-to-see). Non-friends simply get nothing.
      if (relation === "accepted") {
        const { data: saved } = await supabase
          .from("saved_events")
          .select("event_id, events ( id, title, date, banner_url, location_text )")
          .eq("user_id", userId)
          .limit(12);
        setInterested((saved || []).map((s: any) => s.events).filter(Boolean));
      } else {
        setInterested([]);
      }
    } catch (e) {
      console.log("UserProfile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [userId, user]),
  );

  const handleRequest = async () => {
    setBusy(true);
    setRel("sent"); // optimistic
    const { data: result } = await supabase.rpc("request_friend", { target: userId });
    setBusy(false);
    if (result === "not_allowed") {
      setRel("none");
      Alert.alert("Can't request", "This person isn't accepting friend requests.");
    } else if (result === "accepted" || result === "already_friends") {
      load();
    }
  };

  const handleAccept = async () => {
    setBusy(true);
    await supabase.rpc("accept_friend", { other: userId });
    setBusy(false);
    load();
  };

  const FriendButton = () => {
    if (rel === "accepted")
      return (
        <View className="flex-row items-center bg-white/10 px-5 py-3 rounded-full border border-white/10">
          <Check color="#4ade80" size={18} strokeWidth={3} />
          <Text className="text-white font-bold ml-2">Friends</Text>
        </View>
      );
    if (rel === "sent")
      return (
        <View className="flex-row items-center bg-white/10 px-5 py-3 rounded-full border border-white/10">
          <Clock color="#999" size={16} />
          <Text className="text-gray-300 font-bold ml-2">Requested</Text>
        </View>
      );
    if (rel === "received")
      return (
        <TouchableOpacity onPress={handleAccept} disabled={busy}>
          <LinearGradient
            {...fireGradient}
            className="flex-row items-center px-6 py-3 rounded-full"
          >
            <Check color="white" size={18} strokeWidth={3} />
            <Text className="text-white font-bold ml-2">Accept request</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    return (
      <TouchableOpacity onPress={handleRequest} disabled={busy}>
        <LinearGradient
          {...fireGradient}
          className="flex-row items-center px-6 py-3 rounded-full"
        >
          <UserPlus color="white" size={18} />
          <Text className="text-white font-bold ml-2">Add friend</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 110, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-6 self-start"
          >
            <LinearGradient
              {...fireGradient}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <ArrowLeft color="white" size={20} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>

          {loading ? (
            <View className="pt-24 items-center">
              <ActivityIndicator size="large" color="#FA8900" />
            </View>
          ) : !profile ? (
            <Text className="text-gray-400 text-center mt-20">
              This profile isn't available.
            </Text>
          ) : (
            <>
              {/* Identity */}
              <View className="items-center mb-8">
                <Image
                  source={profile.avatar_url ? { uri: profile.avatar_url } : PLACEHOLDER}
                  className="w-28 h-28 rounded-full border-2 border-orange-500/50 bg-[#1E1E1E] mb-4"
                  resizeMode="cover"
                />
                <Text
                  className="text-white text-3xl font-bold"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {profile.full_name || "GateKeeper user"}
                </Text>
                <Text className="text-orange-500 text-base font-medium mt-1">
                  @{profile.username || "user"}
                </Text>
                {profile.bio ? (
                  <Text className="text-gray-300 text-center mt-3 px-4">
                    {profile.bio}
                  </Text>
                ) : null}
                <View className="mt-6">
                  <FriendButton />
                </View>
              </View>

              {/* Their activity — friends only */}
              <Text className="text-white text-xl font-bold mb-4">Interested in</Text>
              {rel !== "accepted" ? (
                <View className="bg-white/5 border border-white/10 rounded-2xl p-6 items-center">
                  <Lock color="#666" size={26} />
                  <Text className="text-gray-400 text-center mt-2">
                    Become friends to see what {profile.full_name?.split(" ")[0] || "they"}
                    's going to.
                  </Text>
                </View>
              ) : interested.length === 0 ? (
                <View className="bg-white/5 border border-white/10 rounded-2xl p-6 items-center">
                  <Text className="text-gray-500 text-center">
                    Nothing on their list right now.
                  </Text>
                </View>
              ) : (
                interested.map((ev) => (
                  <TouchableOpacity
                    key={ev.id}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("EventProfile", {
                        eventId: ev.id,
                        eventName: ev.title,
                      } as any)
                    }
                    className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl p-3 mb-3"
                  >
                    <Image
                      source={
                        ev.banner_url
                          ? { uri: ev.banner_url }
                          : require("../assets/event-placeholder.png")
                      }
                      className="w-16 h-16 rounded-xl mr-4"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base" numberOfLines={1}>
                        {ev.title}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Calendar color="#FA8900" size={13} />
                        <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                          {ev.date ? new Date(ev.date).toLocaleDateString() : "Date TBA"}
                          {ev.location_text ? ` · ${ev.location_text}` : ""}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default UserProfileScreen;
