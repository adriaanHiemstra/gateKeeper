import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";
import { RootStackParamList } from "../../types/types";

const TicketsPaymentsSettings = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Mock Saved Cards
  const [cards, setCards] = useState([
    { id: "1", type: "Visa", last4: "4242", expiry: "12/25" },
    { id: "2", type: "MasterCard", last4: "8839", expiry: "09/26" },
  ]);

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          {/* Header */}
          <View className="flex-row items-center mb-8">
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
              Payment Methods
            </Text>
          </View>

          <Text className="text-gray-400 text-sm font-bold uppercase mb-4 ml-1">
            Saved Cards
          </Text>

          {/* Cards List */}
          {cards.map((card) => (
            <View
              key={card.id}
              className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-4 flex-row justify-between items-center"
            >
              <View className="flex-row items-center">
                <View className="bg-white/10 p-3 rounded-xl mr-4">
                  <CreditCard color="#FA8900" size={24} />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    {card.type} •••• {card.last4}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Expires {card.expiry}
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="p-2">
                <Trash2 color="#666" size={20} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add New Card Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddCardScreen")}
            className="w-full mt-4 shadow-lg shadow-orange-500/20"
          >
            <LinearGradient
              {...fireGradient}
              className="w-full py-4 rounded-2xl flex-row items-center justify-center border-2 border-white/10"
            >
              <Plus color="white" size={24} className="mr-2" />
              <Text
                className="text-white text-xl font-bold tracking-wide"
                style={{ fontFamily: "Jost-Medium" }}
              >
                ADD NEW CARD
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Transaction History Teaser */}
          <Text className="text-gray-400 text-sm font-bold uppercase mb-4 mt-10 ml-1">
            Recent Transactions
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-4 border-b border-white/5 pb-4">
              <View>
                <Text className="text-white font-bold text-base">
                  Summer Slam Ticket
                </Text>
                <Text className="text-gray-500 text-xs">
                  24 Oct • Visa 4242
                </Text>
              </View>
              <Text className="text-white font-bold text-lg">R 350.00</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white font-bold text-base">
                  Neon Jungle VIP
                </Text>
                <Text className="text-gray-500 text-xs">
                  12 Sept • Visa 4242
                </Text>
              </View>
              <Text className="text-white font-bold text-lg">R 850.00</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default TicketsPaymentsSettings;
