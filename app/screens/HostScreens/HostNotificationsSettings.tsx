import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, DollarSign, Ticket, Zap } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';
import { bannerGradient } from '../../styles/colours';

const HostNotificationsSettings = () => {
  const navigation = useNavigation();

  // Mock State
  const [salesAlerts, setSalesAlerts] = useState(true);
  const [payouts, setPayouts] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [guestArrivals, setGuestArrivals] = useState(false);

  const NotificationRow = ({ label, subtext, icon, value, onValueChange }: any) => (
    <View className="flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-3">
      <View className="flex-row items-center flex-1 mr-4">
        <View className="bg-white/10 p-3 rounded-full mr-4">
            {icon}
        </View>
        <View className="flex-1">
            <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Jost-Medium' }}>{label}</Text>
            <Text className="text-gray-400 text-xs leading-4 mt-1">{subtext}</Text>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: '#D087FF' }} // Neon Purple for Host
        thumbColor={'#fff'}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}>
          
          {/* Header */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
               <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Notifications</Text>
          </View>

          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">Business Alerts</Text>
          
          <NotificationRow 
            label="New Ticket Sales" 
            subtext="Get notified immediately when someone buys a ticket."
            icon={<Ticket color="#D087FF" size={20} />}
            value={salesAlerts}
            onValueChange={setSalesAlerts}
          />

          <NotificationRow 
            label="Payouts & Finance" 
            subtext="Weekly settlement alerts and bank transfer confirmations."
            icon={<DollarSign color="#4ade80" size={20} />}
            value={payouts}
            onValueChange={setPayouts}
          />

          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2 mt-4">Event Updates</Text>

          <NotificationRow 
            label="Guest Arrivals" 
            subtext="Notify me when VIPs or first 100 guests arrive."
            icon={<Bell color="#FACC15" size={20} />}
            value={guestArrivals}
            onValueChange={setGuestArrivals}
          />

          <NotificationRow 
            label="Tips & Growth" 
            subtext="Weekly tips on how to sell more tickets."
            icon={<Zap color="#60A5FA" size={20} />}
            value={marketing}
            onValueChange={setMarketing}
          />

        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default HostNotificationsSettings;
