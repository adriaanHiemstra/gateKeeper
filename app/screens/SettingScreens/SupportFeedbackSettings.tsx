import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react-native";

// Components
import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";

// Styles
import { bannerGradient } from "../../styles/colours";

// Enable LayoutAnimation for Android to make the FAQ expand smoothly
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- GENERATED FAQs ---
const FAQS = [
  {
    question: "Where do I find my purchased tickets?",
    answer:
      "All your saved events and purchased tickets are safely stored in the 'My Tickets' section, which you can access right from your Account Settings.",
  },
  {
    question: "How do I see what events my friends are attending?",
    answer:
      "When you view an event on the home feed, you'll see a small profile cluster if anyone in your social circle has RSVP'd. Make sure to sync your contacts in settings to find your friends!",
  },
  {
    question: "How do I host my own event on GateKeeper?",
    answer:
      "Head over to your Account Settings and tap 'Switch to Host Mode'. From the Organizer Dashboard, you can create events, manage guest lists, and even scan tickets at the door.",
  },
  {
    question: "How do I block or unblock another user?",
    answer:
      "To block someone, go to your Social Circle and hold down on their name. If you ever want to unblock them, go to Account > Friends Settings > Blocked Accounts.",
  },
  {
    question: "I found a bug. How do I report it?",
    answer:
      "We love feedback! If something isn't working right or you have a cool feature idea, just tap the email or phone button above to reach out to the founder directly.",
  },
];

const SupportFeedbackSettings = () => {
  const navigation = useNavigation();
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const ContactOption = ({ label, subtext, icon, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center bg-white/5 border border-white/10 p-4 rounded-2xl mb-3"
    >
      <View className="bg-orange-500/10 p-3 rounded-full mr-4">{icon}</View>
      <View className="flex-1">
        <Text
          className="text-white font-bold text-lg"
          style={{ fontFamily: "Jost-Medium" }}
        >
          {label}
        </Text>
        <Text className="text-orange-400 text-sm font-medium mt-0.5">
          {subtext}
        </Text>
      </View>
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
              className="mr-4 bg-white/10 p-2 rounded-full border border-white/10"
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
              <Text className="text-gray-400 text-sm mt-1">
                Get in touch or find answers below
              </Text>
            </View>
          </View>

          {/* CONTACT SECTION */}
          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">
            Contact the Founder
          </Text>

          <ContactOption
            label="Email Support"
            subtext="ad.hiemstra@gmail.com"
            icon={<Mail color="#FA8900" size={24} />}
            onPress={() => Linking.openURL("mailto:ad.hiemstra@gmail.com")}
          />

          <ContactOption
            label="Call or Text"
            subtext="072 320 3629"
            icon={<Phone color="#FA8900" size={24} />}
            onPress={() => Linking.openURL("tel:0723203629")}
          />

          <View className="my-6 border-t border-white/10" />

          {/* FAQ SECTION */}
          <View className="flex-row items-center mb-4 ml-2">
            <HelpCircle color="#666" size={16} className="mr-2" />
            <Text className="text-gray-500 font-bold text-xs uppercase">
              Commonly Asked Questions
            </Text>
          </View>

          <View className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFaqIndex === index;
              const isLast = index === FAQS.length - 1;

              return (
                <View
                  key={index}
                  className={`${!isLast ? "border-b border-white/5" : ""}`}
                >
                  <TouchableOpacity
                    onPress={() => toggleFaq(index)}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between p-4"
                  >
                    <Text
                      className="text-white font-bold text-base flex-1 pr-4"
                      style={{ fontFamily: "Jost-Medium" }}
                    >
                      {faq.question}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp color="#FA8900" size={20} />
                    ) : (
                      <ChevronDown color="#666" size={20} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="px-4 pb-4">
                      <Text className="text-gray-400 leading-5">
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default SupportFeedbackSettings;
