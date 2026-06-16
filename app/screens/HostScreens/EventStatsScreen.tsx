import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native"; // Added for fetching when screen opens
import {
  ArrowUpRight,
  Users,
  DollarSign,
  TrendingUp,
  Lock,
  Map,
  Share2,
  X,
  ArrowRightLeft,
} from "lucide-react-native";

// Components
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";
import { supabase } from "../../lib/supabase"; // Added to talk to our database

// Styles
import { bannerGradient } from "../../styles/colours";

const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EventStatsScreen = () => {
  // --- STATE MANAGEMENT ---
  const [eventsDB, setEventsDB] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [compareEventId, setCompareEventId] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // --- FETCHING REAL DATA ---
  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // 1. Find out who is currently logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Fetch all events belonging to this host
      const { data: events, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("host_id", user.id);

      if (eventError) throw eventError;

      // If they have no events, stop here
      if (!events || events.length === 0) {
        setEventsDB([]);
        return;
      }

      const eventIds = events.map((e) => e.id);

      // 3. Fetch all valid tickets and their pricing tiers for these events
      const [ticketsRes, tiersRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("event_id, tier_id")
          .in("event_id", eventIds)
          .eq("status", "valid"),
        supabase
          .from("ticket_tiers")
          .select("id, price, event_id")
          .in("event_id", eventIds),
      ]);

      const allTickets = ticketsRes.data || [];
      const allTiers = tiersRes.data || [];

      let totalGlobalRevenue = 0;
      let totalGlobalTickets = 0;

      // 4. Calculate stats for each individual event
      const formattedEvents = events.map(event => {
        const eventTickets = allTickets.filter(t => t.event_id === event.id);
        
        // Calculate revenue by matching each ticket to its tier price
        const eventRevenue = eventTickets.reduce((sum, ticket) => {
          const tier = allTiers.find((t) => t.id === ticket.tier_id);
          return sum + (Number(tier?.price) || 0);
        }, 0);

        // Add to our global totals for the "All Events" view
        totalGlobalRevenue += eventRevenue;
        totalGlobalTickets += eventTickets.length;

        return {
          id: event.id,
          name: event.title,
          type: new Date(event.date) >= new Date() ? "upcoming" : "past",
          // Note: Chart data is mocked here until we track purchase dates!
          revenue: [10, 20, 30, 40, 50, 60, 70], 
          total: `R ${eventRevenue.toLocaleString()}`,
          ticketsSold: eventTickets.length
        };
      });

      // 5. Create the master "All Events" option
      const allEventsObj = {
        id: "all",
        name: "All Events",
        type: "business",
        revenue: [40, 65, 30, 85, 55, 90, 45],
        total: `R ${totalGlobalRevenue.toLocaleString()}`,
        ticketsSold: totalGlobalTickets
      };

      // 6. Save it all to our React State!
      setEventsDB([allEventsObj, ...formattedEvents]);
    } catch (error) {
      console.log("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Provide fallbacks while loading or if selecting a missing event
  const selectedEvent = eventsDB.find((e) => e.id === selectedEventId) || eventsDB[0] || {};
  const compareEvent = eventsDB.find((e) => e.id === compareEventId);

  // --- UI COMPONENTS ---
  const BarChart = () => (
    <View className="h-56 flex-row items-end justify-between px-2 mb-4 mt-4">
      {LABELS.map((label, index) => {
        const h1 = selectedEvent?.revenue ? selectedEvent.revenue[index] : 0;
        const h2 = compareEvent?.revenue ? compareEvent.revenue[index] : 0;

        return (
          <View key={index} className="items-center flex-1 h-full justify-end">
            <View className="flex-row items-end justify-center gap-1 w-full">
              <View className="w-3 bg-purple-900/30 rounded-t-full relative h-40">
                <LinearGradient
                  colors={["#D087FF", "#6500B0"]}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${h1}%`,
                    borderRadius: 99,
                  }}
                />
              </View>
              {compareEvent && (
                <View className="w-3 bg-blue-900/30 rounded-t-full relative h-40">
                  <LinearGradient
                    colors={["#60A5FA", "#2563EB"]}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${h2}%`,
                      borderRadius: 99,
                    }}
                  />
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-xs mt-2">{label}</Text>
          </View>
        );
      })}
    </View>
  );

  const StatCard = ({ label, value, change, icon }: any) => (
    <View className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl mr-4 min-w-[150px]">
      <View className="flex-row justify-between items-start mb-3">
        <View className="bg-white/10 p-2 rounded-full">{icon}</View>
        <View className="flex-row items-center bg-green-500/20 px-2 py-1 rounded-md">
          <ArrowUpRight color="#4ade80" size={12} className="mr-1" />
          <Text className="text-green-400 text-xs font-bold">{change}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-sm font-medium mb-1">{label}</Text>
      <Text className="text-white text-2xl font-bold">{value || "0"}</Text>
    </View>
  );

  const ProFeatureCard = ({ title, subtitle, icon }: any) => (
    <View className="flex-row items-center bg-white/5 p-4 rounded-xl mb-3 opacity-60">
      <View className="bg-white/5 p-3 rounded-full mr-4">{icon}</View>
      <View className="flex-1">
        <Text className="text-white font-bold text-lg">{title}</Text>
        <Text className="text-gray-400 text-xs">{subtitle}</Text>
      </View>
      <Lock color="#D087FF" size={20} />
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {loading ? (
          <View className="flex-1 justify-center items-center">
             <ActivityIndicator size="large" color="#D087FF" />
          </View>
        ) : eventsDB.length === 0 ? (
          <View className="flex-1 justify-center items-center px-10">
             <Text className="text-white text-xl font-bold mb-2">No Analytics Yet</Text>
             <Text className="text-gray-400 text-center">Create an event and sell some tickets to see your stats here!</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          >
            <Text className="text-white text-3xl font-bold mb-6" style={{ fontFamily: "Jost-Medium" }}>
              Analytics
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-6 px-6">
              {eventsDB.map((event) => {
                const isSelected = selectedEventId === event.id;
                return (
                  <TouchableOpacity
                    key={event.id}
                    onPress={() => {
                      setSelectedEventId(event.id);
                      setCompareEventId(null);
                    }}
                    className={`mr-3 px-4 py-2 rounded-full border ${
                      isSelected ? "bg-purple-500 border-purple-500" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <Text className={`font-bold ${isSelected ? "text-white" : "text-gray-400"}`}>
                      {event.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedEventId !== "all" && (
              <View className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                <View className="flex-row items-center flex-wrap mb-4">
                  <View className="flex-row items-center mr-2">
                    <View className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                    <Text className="text-white font-bold text-lg">{selectedEvent.name}</Text>
                  </View>
                  <Text className="text-gray-500 text-xs font-bold mr-2">VS</Text>
                  {compareEvent ? (
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      <Text className="text-white font-bold text-lg">{compareEvent.name}</Text>
                    </View>
                  ) : (
                    <Text className="text-gray-500 italic">Select event...</Text>
                  )}
                </View>

                {compareEvent ? (
                  <TouchableOpacity
                    onPress={() => setCompareEventId(null)}
                    className="w-full bg-white/10 py-3 rounded-lg flex-row items-center justify-center"
                  >
                    <X color="#ccc" size={16} className="mr-2" />
                    <Text className="text-gray-300 font-bold">Clear Comparison</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowCompareModal(true)}
                    className="w-full bg-white/10 py-3 rounded-lg flex-row items-center justify-center border border-white/10"
                  >
                    <ArrowRightLeft color="#D087FF" size={16} className="mr-2" />
                    <Text className="text-purple-300 font-bold">Compare with another event</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 -mx-6 px-6">
              <StatCard
                label="Revenue"
                value={selectedEvent.total}
                change="+12%"
                icon={<DollarSign color="#D087FF" size={20} />}
              />
              <StatCard
                label="Tickets"
                value={selectedEvent.ticketsSold}
                change="+8%"
                icon={<TrendingUp color="#FACC15" size={20} />}
              />
              <StatCard
                label="Visits"
                value="N/A"
                change="0%"
                icon={<Users color="#60A5FA" size={20} />}
              />
            </ScrollView>

            <Text className="text-white text-xl font-bold mb-4">Performance Trend</Text>
            <View className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-400 text-sm">Revenue over time</Text>
                <View className="flex-row bg-white/10 rounded-lg p-1">
                  {["week", "month"].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setTimeRange(t as any)}
                      className={`px-3 py-1 rounded-md ${timeRange === t ? "bg-white/20" : ""}`}
                    >
                      <Text className={`text-xs font-bold capitalize ${timeRange === t ? "text-white" : "text-gray-400"}`}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <BarChart />
            </View>

            <Text className="text-white text-xl font-bold mb-4">Audience</Text>
            <View className="flex-row gap-4 mb-10">
              <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 items-center">
                <Text className="text-gray-400 text-sm mb-3 self-start">Gender Split</Text>
                <View className="flex-row h-4 w-full rounded-full overflow-hidden mb-2">
                  <View className="bg-purple-500 w-[55%]" />
                  <View className="bg-blue-500 w-[45%]" />
                </View>
                <View className="flex-row justify-between w-full px-1">
                  <Text className="text-purple-400 text-xs font-bold">55% F</Text>
                  <Text className="text-blue-400 text-xs font-bold">45% M</Text>
                </View>
              </View>
              <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                <Text className="text-gray-400 text-sm mb-1">Top Age</Text>
                <Text className="text-white text-3xl font-bold">21 - 25</Text>
                <Text className="text-gray-500 text-xs mt-1">42% of attendees</Text>
              </View>
            </View>

            <View className="border-t border-white/10 pt-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-xl font-bold">Pro Insights</Text>
                <View className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                  <Text className="text-purple-300 text-xs font-bold uppercase">Upgrade</Text>
                </View>
              </View>
              <ProFeatureCard title="Buyer Location Heatmap" subtitle="See exactly where your tickets are selling." icon={<Map color="#aaa" size={24} />} />
              <ProFeatureCard title="Marketing Attribution" subtitle="Track sales from Instagram vs TikTok." icon={<Share2 color="#aaa" size={24} />} />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal visible={showCompareModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1E1E1E] rounded-t-3xl p-6 border-t border-white/10 h-[50%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Compare with...</Text>
              <TouchableOpacity onPress={() => setShowCompareModal(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={eventsDB.filter((e) => e.id !== "all" && e.id !== selectedEventId)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCompareEventId(item.id);
                    setShowCompareModal(false);
                  }}
                  className="flex-row items-center p-4 bg-white/5 mb-3 rounded-xl border border-white/10"
                >
                  <View className="bg-blue-500/20 p-2 rounded-full mr-4">
                    <TrendingUp color="#60A5FA" size={20} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">{item.name}</Text>
                    <Text className="text-gray-400 text-sm capitalize">{item.type} Event</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <HostBottomNav />
    </View>
  );
};

export default EventStatsScreen;