import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  Search,
  X,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react-native";

// Backend & Auth
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Components
import TopBanner from "../components/TopBanner";
import BottomNav from "../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../styles/colours";

const PLACEHOLDER_IMG = require("../assets/profile-pic-1.png");

const FriendsSocialCircleScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Profile State
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Friend Data State
  const [friends, setFriends] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Block State
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  // Search State
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // --- 1. FETCH CURRENT USER PROFILE ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setCurrentUserProfile(data);
    };
    fetchProfile();
  }, [user]);

  // --- 2. FETCH BLOCKED USERS ---
  const fetchBlockedUsers = async () => {
    if (!user) return new Set<string>();
    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

      if (error) throw error;

      const ids = new Set<string>();
      data?.forEach((row) => {
        if (row.blocker_id !== user.id) ids.add(row.blocker_id);
        if (row.blocked_id !== user.id) ids.add(row.blocked_id);
      });

      setBlockedIds(ids);
      return ids;
    } catch (err) {
      console.error("Error fetching blocks:", err);
      return new Set<string>();
    }
  };

  // --- UPDATE THE FOCUS EFFECT ---
  useFocusEffect(
    useCallback(() => {
      const loadAllData = async () => {
        const currentBlocks = await fetchBlockedUsers();
        await fetchFriends(currentBlocks);
      };
      loadAllData();
    }, [user]),
  );

  const fetchFriends = async (currentBlocks: Set<string>) => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const { data: links, error: linkError } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      if (linkError) throw linkError;

      if (!links || links.length === 0) {
        setFriends([]);
        setFriendIds(new Set());
        return;
      }

      // Extract IDs and defensively filter out anyone who is blocked
      const extractedIds = links
        .map((link) =>
          link.user_id_1 === user.id ? link.user_id_2 : link.user_id_1,
        )
        .filter((id) => !currentBlocks.has(id));

      if (extractedIds.length === 0) {
        setFriends([]);
        setFriendIds(new Set());
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", extractedIds);

      if (profileError) throw profileError;

      const sorted = (profiles || []).sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || ""),
      );

      setFriends(sorted);
      setFriendIds(new Set(extractedIds));
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  };

  // --- 3. HANDLE UNIFIED SEARCH ---
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setSearchResults([]);
      return;
    }

    setIsSearchingDb(true);
    try {
      let query = supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .neq("id", user?.id);

      if (blockedIds.size > 0) {
        const blockedArray = Array.from(blockedIds);
        query = query.not("id", "in", `(${blockedArray.join(",")})`);
      }

      const { data, error } = await query
        .or(`username.ilike.%${text}%,full_name.ilike.%${text}%`)
        .limit(15);

      if (!error && data) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearchingDb(false);
    }
  };

  const toggleSearchMode = (active: boolean) => {
    // 🛑 REMOVED LayoutAnimation config here to stop the native thread crash
    setIsSearchMode(active);
    if (!active) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // --- 4. ADD / REMOVE LOGIC ---
  const handleAddFriend = async (friendId: string, name: string) => {
    if (!user) return;
    try {
      await supabase
        .from("friendships")
        .insert({ user_id_1: user.id, user_id_2: friendId });
      setFriendIds((prev) => new Set(prev).add(friendId));
      fetchFriends(blockedIds);
    } catch (error) {
      Alert.alert("Error", `Could not add ${name}`);
    }
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    Alert.alert("Remove Friend", `Are you sure you want to remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!user) return;
          setFriendIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(friendId);
            return newSet;
          });
          setFriends((prev) => prev.filter((f) => f.id !== friendId));

          await supabase
            .from("friendships")
            .delete()
            .match({ user_id_1: user.id, user_id_2: friendId });
          await supabase
            .from("friendships")
            .delete()
            .match({ user_id_1: friendId, user_id_2: user.id });
        },
      },
    ]);
  };

  // --- 5. BLOCK USER LOGIC ---
  const handleBlockUser = (targetId: string, targetName: string) => {
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${targetName}? They won't be able to see your activity, and they will be removed from your friends list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            if (!user) return;

            // Optimistic UI updates
            setFriends((prev) => prev.filter((f) => f.id !== targetId));
            setSearchResults((prev) => prev.filter((f) => f.id !== targetId));
            setFriendIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(targetId);
              return newSet;
            });
            // ✅ CRITICAL FIX: Add them to the local block list instantly so they are filtered out of searches
            setBlockedIds((prev) => new Set(prev).add(targetId));

            try {
              await supabase.from("blocked_users").insert({
                blocker_id: user.id,
                blocked_id: targetId,
              });

              await supabase
                .from("friendships")
                .delete()
                .match({ user_id_1: user.id, user_id_2: targetId });
              await supabase
                .from("friendships")
                .delete()
                .match({ user_id_1: targetId, user_id_2: user.id });

              Alert.alert("Blocked", `${targetName} has been blocked.`);
            } catch (error) {
              console.error("Error blocking user:", error);
              Alert.alert("Error", "Could not block user.");
            }
          },
        },
      ],
    );
  };

  // --- 6. RENDER ITEM ---
  const renderPersonItem = ({ item }: { item: any }) => {
    const isFriend = friendIds.has(item.id);
    const avatarImg = item.avatar_url
      ? { uri: item.avatar_url }
      : PLACEHOLDER_IMG;

    return (
      <TouchableOpacity
        onLongPress={() => handleBlockUser(item.id, item.full_name)}
        delayLongPress={500}
        activeOpacity={0.8}
        className="flex-row items-center justify-between mb-3 bg-white/5 p-3 rounded-2xl border border-white/10"
      >
        <View className="flex-row items-center flex-1 pr-2">
          <Image
            source={avatarImg}
            className="w-12 h-12 rounded-full mr-4 border border-white/20 bg-[#1E1E1E]"
            resizeMode="cover"
          />
          <View className="flex-1">
            <Text
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Jost-Medium" }}
              numberOfLines={1}
            >
              {item.full_name || "Unknown"}
            </Text>
            <Text className="text-gray-400 text-sm" numberOfLines={1}>
              @{item.username || "user"}
            </Text>
          </View>
        </View>

        {isFriend ? (
          <TouchableOpacity
            onPress={() => handleRemoveFriend(item.id, item.full_name)}
            className="bg-white/10 p-2.5 rounded-full border border-white/5"
          >
            <UserMinus color="#ef4444" size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => handleAddFriend(item.id, item.full_name)}
            className="bg-white px-4 py-2 rounded-full flex-row items-center active:scale-95"
          >
            <UserPlus color="black" size={16} className="mr-1" />
            <Text className="text-black font-bold text-xs">Add</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const displayData = searchQuery.length > 0 ? searchResults : friends;

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-32 px-6">
          {/* HEADER SECTION (User Profile) */}
          <View className="mb-8">
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

            <View className="flex-row items-center">
              <View className="shadow-lg shadow-black/50 mr-5">
                <Image
                  source={
                    currentUserProfile?.avatar_url
                      ? { uri: currentUserProfile.avatar_url }
                      : PLACEHOLDER_IMG
                  }
                  className="w-20 h-20 rounded-full border-2 border-orange-500/50 bg-[#1E1E1E]"
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text
                  className="text-white text-3xl font-bold"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {currentUserProfile?.full_name || "Loading..."}
                </Text>
                <Text className="text-orange-500 text-base font-medium mt-1">
                  @{currentUserProfile?.username || "user"}
                </Text>
              </View>
            </View>
          </View>

          {/* DYNAMIC HEADER & SEARCH BAR */}
          <View className="mb-4 h-14 justify-center z-10">
            {!isSearchMode ? (
              <View key="crew-header" className="flex-row items-center justify-between">
                <Text
                  className="text-white text-2xl font-bold"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  Your Crew ({friends.length})
                </Text>
                <TouchableOpacity
                  onPress={() => toggleSearchMode(true)}
                  className="bg-white/10 p-3 rounded-full border border-white/10"
                >
                  <Search color="#FA8900" size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View key="search-bar" className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 h-full w-full shadow-lg shadow-black/50">
                <Search color="#FA8900" size={20} className="mr-3" />
                <TextInput
                  placeholder="Find new friends or search crew..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  // 🛑 REMOVED autoFocus={true} to stop aggressive keyboard popping
                  autoCapitalize="none"
                  className="flex-1 text-white text-lg font-medium h-full"
                  style={{ fontFamily: "Jost-Medium" }}
                />
                <TouchableOpacity
                  onPress={() => toggleSearchMode(false)}
                  className="p-2 ml-1 bg-white/5 rounded-full"
                >
                  <X color="white" size={16} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* LIST SECTION */}
          {loadingFriends && !isSearchMode ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#FA8900" />
            </View>
          ) : (
            <FlatList
              data={displayData}
              renderItem={renderPersonItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={
                <View className="items-center mt-16 px-4">
                  <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-4 border border-white/10">
                    <Users color="#666" size={32} />
                  </View>
                  {searchQuery.length > 0 ? (
                    <>
                      <Text
                        className="text-white font-bold text-xl mb-2 text-center"
                        style={{ fontFamily: "Jost-Medium" }}
                      >
                        {isSearchingDb ? "Searching..." : "No users found"}
                      </Text>
                      {!isSearchingDb && (
                        <Text className="text-gray-500 text-center">
                          We couldn't find anyone matching "{searchQuery}".
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text
                        className="text-white font-bold text-xl mb-2 text-center"
                        style={{ fontFamily: "Jost-Medium" }}
                      >
                        Your crew is empty
                      </Text>
                      <Text className="text-gray-500 text-center">
                        Tap the search icon above to find people and build your
                        social circle!
                      </Text>
                    </>
                  )}
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

export default FriendsSocialCircleScreen;
