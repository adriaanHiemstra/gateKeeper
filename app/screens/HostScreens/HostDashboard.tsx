import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/types";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Plus,
  QrCode,
  BarChart3,
  Settings,
  Ticket,
  Bell,
  CreditCard,
} from "lucide-react-native";

// Backend
import { supabase } from "../../lib/supabase";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";

// Styles
import { bannerGradient, electricGradient } from "../../styles/colours";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 100;

const HostDashboard = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- Real Data States ---
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState("R 0");
  const [ticketsSold, setTicketsSold] = useState(0);
  const [revenueChange, setRevenueChange] = useState("+0% this week");
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // --- Animation Logic ---
  const translateY = useSharedValue(0);
  const lastContentOffset = useSharedValue(0);
  const isHidden = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastContentOffset.value;

      if (diff > 5 && currentY > 50 && !isHidden.value) {
        isHidden.value = true;
        translateY.value = withTiming(-HEADER_HEIGHT, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      } else if (diff < -5 && isHidden.value) {
        isHidden.value = false;
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }

      lastContentOffset.value = currentY;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // --- Auto-refresh Dashboard on Screen Focus ---
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Get authenticated host context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Fetch all events belonging to this host
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title")
        .eq("host_id", user.id);

      const eventIds = eventsData?.map((e) => e.id) || [];

      // If they have no events, reset the dashboard safely
      if (eventIds.length === 0) {
        setTotalRevenue("R 0");
        setTicketsSold(0);
        setRevenueChange("+0% this week");
        setRecentActivity([]);
        return;
      }

// 3 & 4. Fetch ALL Tickets ever sold for this host's events to calculate totals
      const { data: allTickets } = await supabase
        .from("tickets")
        .select("purchased_at, ticket_tiers(price)")
        .in("event_id", eventIds);

      let totalRevSum = 0;
      let totalTicketsSum = 0;
      let weeklyRevSum = 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      if (allTickets) {
        allTickets.forEach((t: any) => {
          // Every row in the tickets table counts as 1 ticket sold
          totalTicketsSum += 1; 

          // Grab the price from the linked ticket_tier
          const price = parseFloat(t.ticket_tiers?.price) || 0;
          totalRevSum += price;

          // Check if this ticket was bought in the last 7 days for the growth metric
          if (new Date(t.purchased_at) >= oneWeekAgo) {
            weeklyRevSum += price;
          }
        });
      }

      setTotalRevenue(`R ${totalRevSum.toLocaleString()}`);
      setTicketsSold(totalTicketsSum);

      const pctChange =
        totalRevSum > 0 ? Math.round((weeklyRevSum / totalRevSum) * 100) : 0;
      setRevenueChange(`+${pctChange}% this week`);
      
      // 5. FETCH LIVE FEED (Derived Approach)
      const activities: any[] = [];

      // A. Recent Ticket Sales
      const { data: recentSales } = await supabase
        .from("tickets")
        .select(`
          id, 
          purchased_at, 
          ticket_tiers ( name ), 
          events ( title ),
          profiles:user_id ( username )
        `)
        .in("event_id", eventIds)
        .order("purchased_at", { ascending: false })
        .limit(5);

      if (recentSales) {
        recentSales.forEach((sale: any) => {
          activities.push({
            id: `sale-${sale.id}`,
            action: "Ticket Sold 🎟️",
            details: `${sale.profiles?.username || "Someone"} bought a ${
              sale.ticket_tiers?.name || "ticket"
            } for ${sale.events?.title || "your event"}`,
            sortTime: new Date(sale.purchased_at).getTime(),
            created_at: sale.purchased_at,
          });
        });
      }

      // B. Recent Followers
      const { data: recentFollows } = await supabase
        .from("follows")
        .select(`
          follower_id, 
          created_at, 
          profiles:follows_follower_id_fkey ( username )
        `)
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentFollows) {
        recentFollows.forEach((follow: any) => {
          activities.push({
            id: `follow-${follow.follower_id}-${follow.created_at}`,
            action: "New Follower 👤",
            details: `${
              follow.profiles?.username || "Someone"
            } started following you`,
            sortTime: new Date(follow.created_at).getTime(),
            created_at: follow.created_at,
          });
        });
      }

      // C. Recent Event Community Posts
      const { data: recentPosts } = await supabase
        .from("event_community_posts")
        .select(`
          id, 
          content, 
          created_at, 
          events ( title ),
          profiles:user_id ( username )
        `)
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentPosts) {
        recentPosts.forEach((post: any) => {
          activities.push({
            id: `post-${post.id}`,
            action: "New Post 💬",
            details: `${post.profiles?.username || "User"} posted in ${
              post.events?.title
            }: "${post.content}"`,
            sortTime: new Date(post.created_at).getTime(),
            created_at: post.created_at,
          });
        });
      }

      // Sort the combined feed chronologically (Newest first)
      activities.sort((a, b) => b.sortTime - a.sortTime);
      setRecentActivity(activities.slice(0, 15));

    } catch (error: any) {
      console.log("Dashboard Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Timestamp formatting helper
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const ActionButton = ({ icon, label, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white/10 border border-white/5 rounded-2xl p-4 items-center justify-center mb-4"
      style={{ width: (width - 64) / 2, height: 110 }}
    >
      <View className="bg-white/10 p-3 rounded-full mb-3">{icon}</View>
      <Text
        className="text-white font-bold text-base"
        style={{ fontFamily: "Jost-Medium" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      {/* Background */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      {/* ANIMATED TOP BANNER */}
      <HostTopBanner style={headerAnimatedStyle} />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {loading ? (
          <View className="flex-1 justify-center items-center pt-20">
            <ActivityIndicator size="large" color="#D087FF" />
          </View>
        ) : (
          <Animated.ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: HEADER_HEIGHT + 20,
              paddingBottom: 120,
            }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            {/* DASHBOARD HEADER */}
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text
                  className="text-gray-400 text-lg font-medium"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  Overview
                </Text>
                <Text
                  className="text-white text-3xl font-bold"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  Performance
                </Text>
              </View>
              <TouchableOpacity
                className="bg-white/10 p-3 rounded-full"
                onPress={() => navigation.navigate("HostSettings")}
              >
                <Settings color="white" size={24} />
              </TouchableOpacity>
            </View>

            {/* MAIN STATS CARD */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("EventStats")}
            >
              <LinearGradient
                {...electricGradient}
                className="w-full rounded-3xl p-6 mb-8 shadow-lg shadow-purple-900/50"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-white/80 font-medium text-lg">
                    Total Revenue
                  </Text>
                  <BarChart3 color="white" size={24} opacity={0.8} />
                </View>
                <Text className="text-white text-5xl font-bold mb-4">
                  {totalRevenue}
                </Text>

                <View className="flex-row gap-4">
                  <View className="bg-black/20 rounded-lg px-3 py-2">
                    <Text className="text-white font-bold">
                      {ticketsSold} Tickets Sold
                    </Text>
                  </View>
                  <View className="bg-black/20 rounded-lg px-3 py-2">
                    <Text className="text-green-300 font-bold">
                      {revenueChange}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* QUICK ACTIONS GRID */}
            <Text className="text-white text-xl font-bold mb-4">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap justify-between">
              <ActionButton
                icon={<Plus color="#D087FF" size={28} />}
                label="Create Event"
                onPress={() => navigation.navigate("CreateEvent")}
              />
              <ActionButton
                icon={<QrCode color="#D087FF" size={28} />}
                label="Scan Tickets"
                onPress={() => console.log("Scan Tickets")}
              />
              <ActionButton
                icon={<Ticket color="#D087FF" size={28} />}
                label="My Events"
                onPress={() => navigation.navigate("MyEventsList")}
              />
              <ActionButton
                icon={<CreditCard color="#D087FF" size={28} />}
                label="Payouts"
                onPress={() => navigation.navigate("PayoutsSetup")}
              />
            </View>

            {/* RECENT ACTIVITY FEED */}
            <Text className="text-white text-xl font-bold mb-4 mt-4">
              Live Feed
            </Text>
            <View className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-8">
              {recentActivity.length === 0 ? (
                <Text className="text-gray-400 text-center py-6">
                  No active events or notifications yet
                </Text>
              ) : (
                recentActivity.map((item, index) => (
                  <View
                    key={item.id}
                    className={`flex-row items-center py-3 ${
                      index !== recentActivity.length - 1
                        ? "border-b border-white/10"
                        : ""
                    }`}
                  >
                    <View className="bg-purple-500/20 p-2 rounded-full mr-4">
                      <Bell color="#D087FF" size={16} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">
                        {item.action}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {item.details}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs">
                      {formatTimeAgo(item.created_at)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </Animated.ScrollView>
        )}
      </SafeAreaView>

      <HostBottomNav />
    </View>
  );
};

export default HostDashboard;