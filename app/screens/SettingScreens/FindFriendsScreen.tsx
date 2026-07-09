import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Search, UserPlus, Check, Users } from "lucide-react-native";

// Backend & Auth
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient } from "../../styles/colours";

const FindFriendsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Keep track of who we are already friends with
  const [existingFriendIds, setExistingFriendIds] = useState<Set<string>>(
    new Set(),
  );
  // Keep track of who we just added in this session
  const [justAddedIds, setJustAddedIds] = useState<Set<string>>(new Set());

  // 1. Fetch our current friends so we don't show an "Add" button for people we already know
  useFocusEffect(
    useCallback(() => {
      fetchExistingFriends();
    }, [user]),
  );

  const fetchExistingFriends = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      if (data && !error) {
        const friendIds = data.map((link) =>
          link.user_id_1 === user.id ? link.user_id_2 : link.user_id_1,
        );
        setExistingFriendIds(new Set(friendIds));
      }
    } catch (err) {
      console.error("Error fetching existing friends:", err);
    }
  };

  // 2. Search the Profiles table dynamically
  const handleSearch = async (text: string) => {
    setQuery(text);

    if (text.trim() === "") {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Search for usernames or full names that match the query, excluding ourselves
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .neq("id", user?.id)
        .or(`username.ilike.%${text}%,full_name.ilike.%${text}%`)
        .limit(20);

      if (error) throw error;
      if (data) setResults(data);
    } catch (error: any) {
      console.error("Error searching users:", error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Add Friend to the database
  const handleAddFriend = async (friendId: string) => {
    if (!user) return;

    // Optimistic UI update
    setJustAddedIds((prev) => new Set(prev).add(friendId));

    try {
      const { error } = await supabase.from("friendships").insert({
        user_id_1: user.id,
        user_id_2: friendId,
      });

      if (error) {
        // If it violates a unique constraint, it means they are already friends
        if (error.code !== "23505") throw error;
      }
    } catch (error: any) {
      console.error("Error adding friend:", error.message);
      Alert.alert("Error", "Could not add friend. Please try again.");

      // Rollback optimistic update
      setJustAddedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const isAlreadyFriend = existingFriendIds.has(item.id);
    const isJustAdded = justAddedIds.has(item.id);

    const avatarImg = item.avatar_url
      ? { uri: item.avatar_url }
      : require("../../assets/profile-pic-1.png");

    return (
      <View className="flex-row items-center justify-between bg-white/5 border border-white/10 p-4 mb-3 rounded-2xl">
        <View className="flex-row items-center flex-1">
          <Image
            source={avatarImg}
            className="w-12 h-12 rounded-full mr-4 border border-white/20 bg-[#1E1E1E]"
          />
          <View className="flex-1 pr-2">
            <Text
              className="text-white font-bold text-lg"
              style={{ fontFamily: "Jost-Medium" }}
              numberOfLines={1}
            >
              {item.full_name || "Unknown User"}
            </Text>
            <Text className="text-gray-400 text-sm" numberOfLines={1}>
              @{item.username || "user"}
            </Text>
          </View>
        </View>

        {isAlreadyFriend ? (
          <View className="bg-white/10 px-4 py-2 rounded-full border border-white/5">
            <Text className="text-gray-400 font-bold text-xs">Friends</Text>
          </View>
        ) : isJustAdded ? (
          <View className="bg-orange-500/20 border border-orange-500/50 px-4 py-2 rounded-full flex-row items-center">
            <Check color="#FA8900" size={14} className="mr-1" />
            <Text className="text-orange-500 font-bold text-xs">Added</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => handleAddFriend(item.id)}
            className="bg-white px-4 py-2 rounded-full flex-row items-center active:scale-95 transition-transform"
          >
            <UserPlus color="black" size={16} className="mr-1" />
            <Text className="text-black font-bold text-xs">Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-32 px-6">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 bg-white/10 p-2 rounded-full border border-white/10"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text
              className="text-white text-3xl font-bold"
              style={{ fontFamily: "Jost-Medium" }}
            >
              Find Friends
            </Text>
          </View>

          {/* Search Input */}
          <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-14 mb-6 shadow-sm shadow-black/50">
            <Search color="#FA8900" size={20} className="mr-3" />
            <TextInput
              placeholder="Search username or name..."
              placeholderTextColor="#666"
              value={query}
              onChangeText={handleSearch}
              className="flex-1 text-white text-lg font-medium h-full"
              style={{ fontFamily: "Jost-Medium" }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator color="#FA8900" size="small" />}
          </View>

          {/* Results List */}
          <FlatList
            data={results}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center mt-20 px-4">
                <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-4 border border-white/10">
                  <Users color="#666" size={32} />
                </View>
                {query.length > 0 ? (
                  <>
                    <Text
                      className="text-white font-bold text-xl mb-2 text-center"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      No users found
                    </Text>
                    <Text className="text-gray-500 font-medium text-center">
                      We couldn't find anyone matching "{query}".
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      className="text-white font-bold text-xl mb-2 text-center"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      Search the community
                    </Text>
                    <Text className="text-gray-500 font-medium text-center">
                      Type a name or @handle to find people and add them to your
                      crew.
                    </Text>
                  </>
                )}
              </View>
            }
          />
        </View>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default FindFriendsScreen;
