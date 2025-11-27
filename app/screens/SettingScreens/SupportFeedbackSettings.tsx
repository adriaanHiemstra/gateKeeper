import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  MessageCircle,
  FileText,
  ExternalLink,
  Bug,
  Star,
  Mail,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient, fireGradient } from "../../styles/colours";

const SupportFeedbackSettings = () => {
  const navigation = useNavigation();

  const SupportOption = ({ label, icon, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-white/5 border border-white/10 p-5 rounded-2xl mb-4"
    >
      <View className="bg-orange-500/10 p-3 rounded-full mr-4">{icon}</View>
      <View className="flex-1">
        <Text
          className="text-white font-bold text-lg"
          style={{ fontFamily: "Jost-Medium" }}
        >
          {label}
        </Text>
      </View>
      <ExternalLink color="#666" size={20} />
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
                Help & Support
              </Text>
              <Text className="text-gray-400 text-sm">We're here to help</Text>
            </View>
          </View>

          <SupportOption
            label="Chat with Us"
            icon={<MessageCircle color="#FA8900" size={24} />}
            onPress={() => console.log("Open Chat")}
          />

          <SupportOption
            label="FAQs & Guides"
            icon={<FileText color="#FA8900" size={24} />}
            onPress={() => console.log("Open Web FAQ")}
          />

          <SupportOption
            label="Email Support"
            icon={<Mail color="#FA8900" size={24} />}
            onPress={() => Linking.openURL("mailto:support@gatekeeper.com")}
          />

          <View className="my-4 border-t border-white/10" />
          <Text className="text-gray-500 font-bold text-xs uppercase mb-4 ml-2">
            Feedback
          </Text>

          <SupportOption
            label="Report a Bug"
            icon={<Bug color="#ef4444" size={24} />}
            onPress={() => console.log("Report Bug")}
          />

          <SupportOption
            label="Rate GateKeeper"
            icon={<Star color="#FACC15" size={24} />}
            onPress={() => console.log("Open App Store")}
          />
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default SupportFeedbackSettings;
