import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  Plus,
  Globe,
} from "lucide-react-native";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Backend & Auth
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { notEndedFilter } from "../lib/eventFilters";

// Styles & Types
import { bannerGradient, fireGradient } from "../styles/colours";
import { RootStackParamList } from "../types/types";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2;

const PLACEHOLDER_IMG = require("../assets/profile-pic-1.png");

type EventHostProfileRouteProp = RouteProp<
  RootStackParamList,
  "EventHostProfile"
>;

const EventHostProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<EventHostProfileRouteProp>();
  const { hostId } = route.params || {};
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState<any>(null);
  const [hostEvents, setHostEvents] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const isOwnProfile = !!user && user.id === hostId;

  useFocusEffect(
    useCallback(() => {
      if (!hostId) return;

      const fetchHostProfile = async () => {
        try {
          const [{ data: profile }, { data: events }, { count }, followRes] =
            await Promise.all([
              supabase
                .from("profiles")
                .select(
                  "id, host_full_name, host_username, host_bio, host_avatar_url, website, full_name, username, avatar_url",
                )
                .eq("id", hostId)
                .single(),
              supabase
                .from("events")
                .select("id, title, banner_url, categories, date, end_date")
                .eq("host_id", hostId)
                .eq("is_public", true)
                .or(notEndedFilter())
                .order("date", { ascending: true }),
              supabase
                .from("follows")
                .select("follower_id", { count: "exact", head: true })
                .eq("following_id", hostId),
              user
                ? supabase
                    .from("follows")
                    .select("follower_id")
                    .eq("follower_id", user.id)
                    .eq("following_id", hostId)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
            ]);

          setHost(profile);
          setHostEvents(events || []);
          setFollowerCount(count || 0);
          setIsFollowing(!!followRes.data);
        } catch (err) {
          console.log("Error loading host profile:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchHostProfile();
    }, [hostId, user]),
  );

  const handleToggleFollow = async () => {
    if (!user || !hostId || followBusy) return;
    setFollowBusy(true);
    const wasFollowing = isFollowing;

    // Instant UI feedback, matching the pattern used elsewhere in the app.
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? Math.max(0, c - 1) : c + 1));

    try {
      if (wasFollowing) {
        await supabase
          .from("follows")
          .delete()
          .match({ follower_id: user.id, following_id: hostId });
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: hostId });
      }
    } catch (err) {
      // Roll back on failure.
      setIsFollowing(wasFollowing);
      setFollowerCount((c) => (wasFollowing ? c + 1 : Math.max(0, c - 1)));
      Alert.alert("Error", "Couldn't update follow status.");
    } finally {
      setFollowBusy(false);
    }
  };

  const hostName =
    host?.host_username || host?.host_full_name || host?.username || host?.full_name || "Unknown Host";
  const hostAvatar = host?.host_avatar_url || host?.avatar_url
    ? { uri: host.host_avatar_url || host.avatar_url }
    : PLACEHOLDER_IMG;
  const hostBio = host?.host_bio || "";
  const hostWebsite = host?.website || "";

  const handleOpenWebsite = () => {
    if (!hostWebsite) return;
    const url = /^https?:\/\//i.test(hostWebsite)
      ? hostWebsite
      : `https://${hostWebsite}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Couldn't open link", "That website address looks invalid."),
    );
  };

  const renderEventItem = ({ item }: { item: any }) => {
    let category = "";
    if (Array.isArray(item.categories) && item.categories.length > 0) {
      category = item.categories[0];
    } else if (typeof item.categories === "string") {
      try {
        const parsed = JSON.parse(item.categories);
        category = Array.isArray(parsed) ? parsed[0] : "";
      } catch {
        category = item.categories;
      }
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        className="bg-black relative mb-1"
        style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.25 }}
        onPress={() =>
          navigation.navigate("EventProfile", {
            eventId: item.id,
            eventName: item.title,
            attendees: 0,
            logo: item.banner_url
              ? { uri: item.banner_url }
              : require("../assets/event-placeholder.png"),
            banner: item.banner_url
              ? { uri: item.banner_url }
              : require("../assets/event-placeholder.png"),
          })
        }
      >
        <Image
          source={
            item.banner_url
              ? { uri: item.banner_url }
              : require("../assets/event-placeholder.png")
          }
          className="w-full h-full opacity-80"
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          className="absolute bottom-0 left-0 right-0 p-4"
        >
          <Text
            className="text-white font-bold text-xl shadow-black leading-tight"
            style={{ fontFamily: "Jost-Medium" }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!!category && (
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
              {category}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
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
        <View className="flex-1 pt-32">
          {/* HEADER: Profile Info */}
          <View className="px-6 mb-6">
            {/* Top Row: Back + Profile Pic */}
            <View className="flex-row justify-between items-start mb-4">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-white/10 p-2 rounded-full"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>

              <View className="items-center">
                <Image
                  source={hostAvatar}
                  className="w-28 h-28 rounded-full border-4 border-[#121212]"
                />
                <View className="flex-row items-center mt-2">
                  <Text
                    className="text-white text-2xl font-bold mr-2"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {hostName}
                  </Text>
                  <CheckCircle color="#FA8900" size={20} fill="#FA8900" />
                </View>
              </View>

              {/* Spacer to balance Back button */}
              <View className="w-10" />
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-center gap-8 mb-6 border-b border-white/10 pb-6">
              <View className="items-center">
                <Text className="text-white font-bold text-xl">
                  {hostEvents.length}
                </Text>
                <Text className="text-gray-500 text-xs uppercase">Events</Text>
              </View>
              <View className="items-center">
                <Text className="text-white font-bold text-xl">
                  {followerCount}
                </Text>
                <Text className="text-gray-500 text-xs uppercase">
                  Followers
                </Text>
              </View>
            </View>

            {/* Bio */}
            {!!hostBio && (
              <Text className="text-gray-300 text-center leading-5 mb-4 px-4">
                {hostBio}
              </Text>
            )}

            {/* Website */}
            {!!hostWebsite && (
              <TouchableOpacity
                onPress={handleOpenWebsite}
                activeOpacity={0.7}
                className="flex-row items-center justify-center mb-6"
              >
                <Globe color="#FA8900" size={14} className="mr-2" />
                <Text
                  className="text-orange-400 font-medium text-sm"
                  numberOfLines={1}
                >
                  {hostWebsite.replace(/^https?:\/\//i, " ")}
                </Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            {!isOwnProfile && (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleToggleFollow}
                  disabled={followBusy}
                  className="flex-1"
                >
                  <LinearGradient
                    {...fireGradient}
                    colors={
                      isFollowing ? ["#333", "#222"] : ["#FA8900", "#942C00"]
                    }
                    className="py-3 rounded-xl items-center justify-center flex-row border border-white/10"
                  >
                    {isFollowing ? (
                      <Text className="text-white font-bold">Following</Text>
                    ) : (
                      <>
                        <Plus color="white" size={18} className="mr-2" />
                        <Text className="text-white font-bold">Follow</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity className="flex-1 bg-white/10 py-3 rounded-xl items-center justify-center border border-white/10 flex-row">
                  <MessageCircle color="white" size={18} className="mr-2" />
                  <Text className="text-white font-bold">Message</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* EVENTS GRID */}
          <FlatList
            data={hostEvents}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={renderEventItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListHeaderComponent={
              <Text
                className="text-white text-xl font-bold px-6 mb-4"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Upcoming Events
              </Text>
            }
            ListEmptyComponent={
              <Text className="text-gray-500 text-center mt-4">
                No upcoming events.
              </Text>
            }
          />
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default EventHostProfileScreen;
