import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MessageCircle, FileText, ExternalLink, Bug } from 'lucide-react-native';

import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';
import { bannerGradient, electricGradient } from '../../styles/colours';

const HostSupportSettings = () => {
  const navigation = useNavigation();

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
          
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
               <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Support</Text>
          </View>

          <Text className="text-gray-300 text-lg mb-8 leading-6">
            Need help with your event? Our team is here for you 24/7.
          </Text>

          <SupportOption 
            label="Chat with Support" 
            icon={<MessageCircle color="#D087FF" size={24} />}
            onPress={() => console.log("Open Chat")}
          />

          <SupportOption 
            label="Host Help Center" 
            icon={<FileText color="#D087FF" size={24} />}
            onPress={() => console.log("Open FAQ")}
          />

          <SupportOption 
            label="Report a Bug" 
            icon={<Bug color="#D087FF" size={24} />}
            onPress={() => console.log("Open Bug Report")}
          />

          <View className="mt-8 bg-white/5 p-6 rounded-2xl items-center">
             <Text className="text-white font-bold text-lg mb-2">Urgent Issue?</Text>
             <Text className="text-gray-400 text-center mb-4">
                Call our emergency host line for issues happening during a live event.
             </Text>
             <TouchableOpacity className="bg-red-500/20 px-6 py-3 rounded-full border border-red-500/50">
                <Text className="text-red-400 font-bold">Call Emergency Support</Text>
             </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default HostSupportSettings;
