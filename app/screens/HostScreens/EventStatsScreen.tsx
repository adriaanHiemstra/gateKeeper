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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allEvents, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("host_id", user.id);

      if (eventError) throw eventError;

      // Info-only events never sell tickets, so they have nothing for this
      // screen to report on — leave them out entirely.
      const events = (allEvents || []).filter((e) => e.requires_tickets ?? true);
      if (events.length === 0) {
        setEventsDB([]);
        return;
      }

      const eventIds = events.map((e) => e.id);

      // 🚨 UPDATED FETCH: We join the profiles table to get gender & dob!
      const [ticketsRes, tiersRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("event_id, tier_id, status, purchased_at, profiles(gender, dob)")
          .in("event_id", eventIds)
          .in("status", ["valid", "scanned"]),
        supabase
          .from("ticket_tiers")
          .select("id, price, event_id")
          .in("event_id", eventIds),
      ]);

      const allTickets = ticketsRes.data || [];
      const allTiers = tiersRes.data || [];

      let totalGlobalRevenue = 0;
      let totalGlobalTickets = 0;
      let totalGlobalVisits = 0;
      let globalRevenueArray = [0, 0, 0, 0, 0, 0, 0];
      let globalGender = { m: 0, f: 0 };
      let globalAgeBuckets: any = { "18-20": 0, "21-25": 0, "26-30": 0, "31-40": 0, "40+": 0 };

      // Helper to calculate age from DOB
      const calculateAge = (dob: string) => {
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      };

      const formattedEvents = events.map(event => {
        const eventTickets = allTickets.filter(t => t.event_id === event.id);
        
        let revenueArray = [0, 0, 0, 0, 0, 0, 0]; // Mon - Sun
        let maleCount = 0; let femaleCount = 0;
        let ageBuckets: any = { "18-20": 0, "21-25": 0, "26-30": 0, "31-40": 0, "40+": 0 };
        
        const visitsCount = eventTickets.filter(t => t.status === 'scanned').length;

        const eventRevenue = eventTickets.reduce((sum, ticket) => {
          const tier = allTiers.find((t) => t.id === ticket.tier_id);
          const price = Number(tier?.price) || 0;
          
          // 📊 TREND LOGIC: Map purchase date to Mon-Sun index (0-6)
          if (ticket.purchased_at) {
             const date = new Date(ticket.purchased_at);
             const dayIndex = (date.getDay() + 6) % 7; 
             revenueArray[dayIndex] += price;
             globalRevenueArray[dayIndex] += price;
          }

          // 🧑‍🤝‍🧑 DEMOGRAPHICS LOGIC
          const profile: any = ticket.profiles;
          if (profile) {
             // Gender
             if (profile.gender?.toLowerCase() === 'male' || profile.gender?.toLowerCase() === 'm') { maleCount++; globalGender.m++; }
             else if (profile.gender?.toLowerCase() === 'female' || profile.gender?.toLowerCase() === 'f') { femaleCount++; globalGender.f++; }
             
             // Age
             if (profile.dob) {
                const age = calculateAge(profile.dob);
                let bucket = "40+";
                if (age <= 20) bucket = "18-20";
                else if (age <= 25) bucket = "21-25";
                else if (age <= 30) bucket = "26-30";
                else if (age <= 40) bucket = "31-40";
                
                ageBuckets[bucket]++;
                globalAgeBuckets[bucket]++;
             }
          }

          return sum + price;
        }, 0);

        totalGlobalRevenue += eventRevenue;
        totalGlobalTickets += eventTickets.length;
        totalGlobalVisits += visitsCount;

        // Calculate highest age bucket and percentages
        let topAge = "N/A"; let topAgeCount = 0;
        for (const [b, c] of Object.entries(ageBuckets)) { if ((c as number) > topAgeCount) { topAgeCount = c as number; topAge = b; } }
        
        const totalGender = maleCount + femaleCount;
        const fPct = totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 50;

        return {
          id: event.id,
          name: event.title,
          type: new Date(event.date) >= new Date() ? "upcoming" : "past",
          revenue: revenueArray, 
          total: `R ${eventRevenue.toLocaleString()}`,
          ticketsSold: eventTickets.length,
          visits: visitsCount,
          gender: { f: fPct, m: 100 - fPct },
          topAge: topAge,
          topAgePct: eventTickets.length > 0 ? Math.round((topAgeCount / eventTickets.length) * 100) : 0
        };
      });

      // Calculate Global Aggregates for "All Events" Tab
      let gTopAge = "N/A"; let gTopAgeCount = 0;
      for (const [b, c] of Object.entries(globalAgeBuckets)) { if ((c as number) > gTopAgeCount) { gTopAgeCount = c as number; gTopAge = b; } }
      const gTotalGender = globalGender.m + globalGender.f;
      const gFPct = gTotalGender > 0 ? Math.round((globalGender.f / gTotalGender) * 100) : 50;

      const allEventsObj = {
        id: "all",
        name: "All Events",
        type: "business",
        revenue: globalRevenueArray,
        total: `R ${totalGlobalRevenue.toLocaleString()}`,
        ticketsSold: totalGlobalTickets,
        visits: totalGlobalVisits,
        gender: { f: gFPct, m: 100 - gFPct },
        topAge: gTopAge,
        topAgePct: totalGlobalTickets > 0 ? Math.round((gTopAgeCount / totalGlobalTickets) * 100) : 0
      };

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
// 1. UPDATE THE BAR CHART COMPONENT
  const BarChart = () => {
    // Find the highest revenue day so we can scale the chart bars proportionately to 100% height
    const maxRev = Math.max(...(selectedEvent?.revenue || [1]), 1); 
    const maxCompareRev = compareEvent ? Math.max(...(compareEvent.revenue || [1]), 1) : 1;

    return (
      <View className="h-56 flex-row items-end justify-between px-2 mb-4 mt-4">
        {LABELS.map((label, index) => {
          const raw1 = selectedEvent?.revenue ? selectedEvent.revenue[index] : 0;
          const raw2 = compareEvent?.revenue ? compareEvent.revenue[index] : 0;
          
          // Calculate percentage height based on the max day
          const h1 = (raw1 / maxRev) * 100;
          const h2 = (raw2 / maxCompareRev) * 100;

          return (
            <View key={index} className="items-center flex-1 h-full justify-end">
              <View className="flex-row items-end justify-center gap-1 w-full">
                <View className="w-3 bg-purple-900/30 rounded-t-full relative h-40">
                  <LinearGradient
                    colors={["#D087FF", "#6500B0"]}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${h1}%`, borderRadius: 99 }}
                  />
                </View>
                {compareEvent && (
                  <View className="w-3 bg-blue-900/30 rounded-t-full relative h-40">
                    <LinearGradient
                      colors={["#60A5FA", "#2563EB"]}
                      style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${h2}%`, borderRadius: 99 }}
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
  };

  const StatCard = ({ label, value, change, icon }: any) => (
    <View className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl mr-4 min-w-[150px]">
      <View className="flex-row justify-between items-start mb-3">
        <View className="bg-white/10 p-2 rounded-full">{icon}</View>
        {/*<View className="flex-row items-center bg-green-500/20 px-2 py-1 rounded-md">
          <ArrowUpRight color="#4ade80" size={12} className="mr-1" />
          <Text className="text-green-400 text-xs font-bold">{change}</Text>
        </View>*/}
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
                label="Checked In"
                value={`${selectedEvent.visits ?? 0} / ${selectedEvent.ticketsSold ?? 0}`}
                change="0%"
                icon={<Users color="#60A5FA" size={20} />}
              />
            </ScrollView>

            <Text className="text-white text-xl font-bold mb-4">Performance Trend</Text>
            <View className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-400 text-sm">Revenue over time</Text>
                <View className="flex-row bg-white/10 rounded-lg p-1">
                  {["week"].map((t) => (
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

{/* AUDIENCE SECTION */}
            <Text className="text-white text-xl font-bold mb-4">Audience</Text>
            <View className="flex-row gap-4 mb-10">
              <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 items-center">
                <Text className="text-gray-400 text-sm mb-3 self-start">Gender Split</Text>
                
                {/* 🚨 Changed || to ?? for the width calculations */}
                <View className="flex-row h-4 w-full rounded-full overflow-hidden mb-2 bg-gray-800">
                  <View className="bg-purple-500" style={{ width: `${selectedEvent?.gender?.f ?? 50}%` }} />
                  <View className="bg-blue-500" style={{ width: `${selectedEvent?.gender?.m ?? 50}%` }} />
                </View>
                
                {/* 🚨 Changed || to ?? for the text displays */}
                <View className="flex-row justify-between w-full px-1">
                  <Text className="text-purple-400 text-xs font-bold">{selectedEvent?.gender?.f ?? 50}% F</Text>
                  <Text className="text-blue-400 text-xs font-bold">{selectedEvent?.gender?.m ?? 50}% M</Text>
                </View>
              </View>
              
              <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                <Text className="text-gray-400 text-sm mb-1">Top Age</Text>
                <Text className="text-white text-3xl font-bold">{selectedEvent?.topAge || "N/A"}</Text>
                <Text className="text-gray-500 text-xs mt-1">{selectedEvent?.topAgePct || 0}% of attendees</Text>
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