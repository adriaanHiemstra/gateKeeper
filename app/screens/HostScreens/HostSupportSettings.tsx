import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MessageCircle, FileText, ExternalLink, Bug } from 'lucide-react-native';

import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';
import { bannerGradient, electricGradient } from '../../styles/colours';

const HostSupportSettings = () => {
  const navigation = useNavigation();

  // --- 1. BUG REPORT EMAIL HANDLER ---
  const handleReportBug = async () => {
    const email = "ad.hiemstra@gmail.com";
    const subject = encodeURIComponent("Bug Report - Host App");
    const body = encodeURIComponent(
      "Hi Support,\n\nI encountered the following bug:\n\n[Please describe what happened here...]\n\n"
    );

    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      // Check if the device can handle the mailto link
      const supported = await Linking.canOpenURL(mailtoUrl);
      
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Fallback if no email client is configured
        Alert.alert(
          "Email Not Available", 
          `We couldn't open an email app on your device. Please send your report directly to:\n\n${email}`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while trying to open your email app.");
    }
  };

  const SupportOption = ({ label, icon, onPress }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center bg-white/5 border border-white/10 p-5 rounded-2xl mb-4"
    >
      <View className="bg-purple-500/20 p-3 rounded-full mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Jost-Medium' }}>{label}</Text>
      </View>
      <ExternalLink color="#666" size={20} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}>
          
          <View className="flex-row items-center mb-10">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
               <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Support</Text>
          </View>

          <Text className="text-gray-300 text-lg mb-12 leading-6">
            Encountered a bug? Send us a message and we will fix it as soon as possible.
          </Text>

          {/*<SupportOption 
            label="Chat with Support" 
            icon={<MessageCircle color="#D087FF" size={24} />}
            onPress={() => console.log("Open Chat")}
          />*/}

          {/*<SupportOption 
            label="Host Help Center" 
            icon={<FileText color="#D087FF" size={24} />}
            onPress={() => console.log("Open FAQ")}
          />*/}

          {/* --- 2. UPDATED ONPRESS --- */}
          <SupportOption 
            label="Report a Bug" 
            icon={<Bug color="#D087FF" size={24} />}
            onPress={handleReportBug}
          />

          {/*<View className="mt-8 bg-white/5 p-6 rounded-2xl items-center">
             <Text className="text-white font-bold text-lg mb-2">Urgent Issue?</Text>
             <Text className="text-gray-400 text-center mb-4">
                Call our emergency host line for issues happening during a live event.
             </Text>
             <TouchableOpacity className="bg-red-500/20 px-6 py-3 rounded-full border border-red-500/50">
                <Text className="text-red-400 font-bold">Call Emergency Support</Text>
             </TouchableOpacity>
          </View>*/}

        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default HostSupportSettings;