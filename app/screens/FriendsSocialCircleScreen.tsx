import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
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
  Check,
  Clock,
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

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Accepted friends
  const [friends, setFriends] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  // Incoming pending requests (people who asked to be my friend)
  const [requests, setRequests] = useState<any[]>([]);
  // Outgoing pending requests I've sent (to show "Requested")
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Search State
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // --- 1. CURRENT USER PROFILE ---
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

  // --- 2. BLOCKED USERS ---
  const fetchBlockedUsers = async () => {
    if (!user) return new Set<string>();
    try {
      const { data } = await supabase
        .from("blocked_users")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
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

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        const blocks = await fetchBlockedUsers();
        await loadSocial(blocks);
      };
      run();
    }, [user]),
  );

  // --- 3. LOAD FRIENDS + REQUESTS in one pass ---
  const loadSocial = async (currentBlocks: Set<string>) => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const { data: links, error } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2, status, requester_id")
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
      if (error) throw error;

      const acceptedIds: string[] = [];
      const incomingIds: string[] = [];
      const sent = new Set<string>();

      (links || []).forEach((l) => {
        const other = l.user_id_1 === user.id ? l.user_id_2 : l.user_id_1;
        if (currentBlocks.has(other)) return;
        if (l.status === "accepted") acceptedIds.push(other);
        else if (l.status === "pending") {
          if (l.requester_id === user.id) sent.add(other);
          else incomingIds.push(other);
        }
      });

      const allIds = Array.from(new Set([...acceptedIds, ...incomingIds]));
      const byId: Record<string, any> = {};
      if (allIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", allIds);
        (profs || []).forEach((p) => (byId[p.id] = p));
      }

      setFriends(
        acceptedIds
          .map((id) => byId[id])
          .filter(Boolean)
          .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")),
      );
      setFriendIds(new Set(acceptedIds));
      setRequests(incomingIds.map((id) => byId[id]).filter(Boolean));
      setSentIds(sent);
    } catch (err) {
      console.error("Error loading social:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  // --- 4. SEARCH (name / username / phone number) ---
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
        query = query.not("id", "in", `(${Array.from(blockedIds).join(",")})`);
      }

      // Match name/username, and phone number when the query looks numeric.
      const digits = text.replace(/\D/g, "");
      let orClause = `username.ilike.%${text}%,full_name.ilike.%${text}%`;
      if (digits.length >= 4) orClause += `,phone_number.ilike.%${digits}%`;

      const { data, error } = await query.or(orClause).limit(15);
      if (!error && data) setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearchingDb(false);
    }
  };

  const toggleSearchMode = (active: boolean) => {
    setIsSearchMode(active);
    if (!active) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // --- 5. REQUEST / ACCEPT / DECLINE / REMOVE ---
  const handleAddFriend = async (friendId: string, name: string) => {
    if (!user) return;
    setSentIds((prev) => new Set(prev).add(friendId)); // optimistic
    const { data: result, error } = await supabase.rpc("request_friend", {
      target: friendId,
    });
    if (error) {
      setSentIds((prev) => {
        const n = new Set(prev);
        n.delete(friendId);
        return n;
      });
      Alert.alert("Error", `Could not send a request to ${name}.`);
      return;
    }
    if (result === "not_allowed") {
      setSentIds((prev) => {
        const n = new Set(prev);
        n.delete(friendId);
        return n;
      });
      Alert.alert("Can't request", `${name} isn't accepting friend requests.`);
    } else if (result === "accepted" || result === "already_friends") {
      // They'd already requested us, or you're already friends → refresh.
      await loadSocial(blockedIds);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id)); // optimistic
    await supabase.rpc("accept_friend", { other: id });
    await loadSocial(blockedIds);
  };

  const handleDeclineRequest = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    await supabase.rpc("remove_friend", { other: id });
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    Alert.alert("Remove Friend", `Are you sure you want to remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!user) return;
          setFriends((prev) => prev.filter((f) => f.id !== friendId));
          setFriendIds((prev) => {
            const n = new Set(prev);
            n.delete(friendId);
            return n;
          });
          await supabase.rpc("remove_friend", { other: friendId });
        },
      },
    ]);
  };

  // --- 6. BLOCK ---
  const handleBlockUser = (targetId: string, targetName: string) => {
    Alert.alert(
      "Block User",
      `Block ${targetName}? They won't be able to see your activity, and they'll be removed from your friends.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            setFriends((prev) => prev.filter((f) => f.id !== targetId));
            setRequests((prev) => prev.filter((f) => f.id !== targetId));
            setSearchResults((prev) => prev.filter((f) => f.id !== targetId));
            setFriendIds((prev) => {
              const n = new Set(prev);
              n.delete(targetId);
              return n;
            });
            setBlockedIds((prev) => new Set(prev).add(targetId));
            try {
              await supabase
                .from("blocked_users")
                .insert({ blocker_id: user.id, blocked_id: targetId });
              // Friendship is also severed by a DB trigger; this covers pre-migration.
              await supabase.rpc("remove_friend", { other: targetId });
            } catch (error) {
              console.error("Error blocking user:", error);
              Alert.alert("Error", "Could not block user.");
            }
          },
        },
      ],
    );
  };

  // --- 7. RENDER: a person (friend or search result) ---
  const renderPersonItem = ({ item }: { item: any }) => {
    const isFriend = friendIds.has(item.id);
    const isSent = sentIds.has(item.id);
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
        ) : isSent ? (
          <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-full border border-white/10">
            <Clock color="#999" size={14} className="mr-1" />
            <Text className="text-gray-300 font-bold text-xs">Requested</Text>
          </View>
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

  // Requests inbox — shown above the friends list (not while searching).
  const renderRequestsHeader = () => {
    if (isSearchMode || searchQuery.length > 0 || requests.length === 0)
      return null;
    return (
      <View className="mb-6">
        <Text
          className="text-white text-lg font-bold mb-3"
          style={{ fontFamily: "Jost-Medium" }}
        >
          Friend Requests ({requests.length})
        </Text>
        {requests.map((r) => (
          <View
            key={r.id}
            className="flex-row items-center justify-between mb-3 bg-orange-500/5 p-3 rounded-2xl border border-orange-500/20"
          >
            <View className="flex-row items-center flex-1 pr-2">
              <Image
                source={r.avatar_url ? { uri: r.avatar_url } : PLACEHOLDER_IMG}
                className="w-12 h-12 rounded-full mr-4 border border-white/20 bg-[#1E1E1E]"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text
                  className="text-white text-base font-bold"
                  numberOfLines={1}
                >
                  {r.full_name || "Unknown"}
                </Text>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                  @{r.username || "user"}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => handleDeclineRequest(r.id)}
                className="bg-white/10 p-2.5 rounded-full border border-white/5 mr-2"
              >
                <X color="#999" size={18} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAcceptRequest(r.id)}>
                <LinearGradient
                  {...fireGradient}
                  className="p-2.5 rounded-full items-center justify-center"
                >
                  <Check color="white" size={18} strokeWidth={3} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const displayData = searchQuery.length > 0 ? searchResults : friends;

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 pt-24 px-6">
          {/* HEADER (User Profile) */}
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

          {/* HEADER & SEARCH BAR */}
          <View className="mb-4 h-14 justify-center z-10">
            {!isSearchMode ? (
              <View className="flex-row items-center justify-between">
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
              <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 h-full w-full shadow-lg shadow-black/50">
                <Search color="#FA8900" size={20} className="mr-3" />
                <TextInput
                  placeholder="Search by name, @username or number..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={handleSearch}
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
              ListHeaderComponent={renderRequestsHeader()}
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
                  ) : requests.length > 0 ? null : (
                    <>
                      <Text
                        className="text-white font-bold text-xl mb-2 text-center"
                        style={{ fontFamily: "Jost-Medium" }}
                      >
                        Your crew is empty
                      </Text>
                      <Text className="text-gray-500 text-center">
                        Tap the search icon above to find people and send friend
                        requests!
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
