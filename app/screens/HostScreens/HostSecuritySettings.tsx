import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Smartphone, Key, Fingerprint, ChevronRight } from 'lucide-react-native';

import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';
import { bannerGradient } from '../../styles/colours';

const HostSecuritySettings = () => {
  const navigation = useNavigation();
  const [biometrics, setBiometrics] = React.useState(true);

  const SecurityItem = ({ label, icon, onPress }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-3"
    >
      <View className="flex-row items-center">
        <View className="bg-white/10 p-3 rounded-full mr-4">
            {icon}
        </View>
        <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Jost-Medium' }}>{label}</Text>
      </View>
      <ChevronRight color="#666" size={20} />
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
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Security</Text>
          </View>

          <View className="items-center mb-8">
             <View className="bg-green-500/10 p-4 rounded-full border border-green-500/30 mb-3">
                <Shield color="#4ade80" size={48} />
             </View>
             <Text className="text-white font-bold text-xl">Account Protected</Text>
             <Text className="text-gray-400 text-sm">Your security score is 98%</Text>
          </View>

          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2">Login Methods</Text>
          
          <SecurityItem 
            label="Change Password" 
            icon={<Key color="white" size={20} />} 
            onPress={() => console.log('Change PW')} 
          />

          <View className="flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-3">
            <View className="flex-row items-center">
                <View className="bg-white/10 p-3 rounded-full mr-4">
                    <Fingerprint color="white" size={20} />
                </View>
                <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Jost-Medium' }}>FaceID / Biometrics</Text>
            </View>
            <Switch 
                value={biometrics} 
                onValueChange={setBiometrics}
                trackColor={{ false: '#333', true: '#D087FF' }}
                thumbColor={'#fff'}
            />
          </View>

          <Text className="text-gray-500 font-bold text-xs uppercase mb-3 ml-2 mt-4">Device Management</Text>

          <SecurityItem 
            label="Two-Factor Auth" 
            icon={<Smartphone color="white" size={20} />} 
            onPress={() => console.log('2FA')} 
          />

          <TouchableOpacity className="mt-4 self-center">
             <Text className="text-red-500 font-bold">Sign out of all other devices</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default HostSecuritySettings;
