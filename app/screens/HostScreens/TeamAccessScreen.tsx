import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Plus, Trash2, Copy, Users, Eye } from 'lucide-react-native';

// Components
import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';

// Styles
import { bannerGradient, electricGradient } from '../../styles/colours';

const TeamAccessScreen = () => {
  const navigation = useNavigation();

  // Mock Data: Active Codes
  const [activeCodes, setActiveCodes] = useState([
    { id: '1', code: '882-901', role: 'Door Staff', status: 'Active', uses: 42 },
    { id: '2', code: '441-229', role: 'Bar Manager', status: 'Active', uses: 0 },
  ]);

  const handleGenerateCode = () => {
    // In real app: Call API to generate unique token
    const newCode = {
        id: Math.random().toString(),
        code: Math.floor(100000 + Math.random() * 900000).toString().match(/.{1,3}/g)?.join('-') || '123-456',
        role: 'Door Staff',
        status: 'Active',
        uses: 0
    };
    setActiveCodes([...activeCodes, newCode]);
    Alert.alert("Code Generated", `Share code ${newCode.code} with your staff.`);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Revoke Access", "This will immediately log out anyone using this code.", [
        { text: "Cancel", style: "cancel" },
        { text: "Revoke", style: "destructive", onPress: () => {
            setActiveCodes(activeCodes.filter(c => c.id !== id));
        }}
    ]);
  };

  const copyToClipboard = (code: string) => {
    // Clipboard.setString(code); // Requires expo-clipboard
    Alert.alert("Copied", `${code} copied to clipboard`);
  };

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
            <View>
                <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Team Access</Text>
                <Text className="text-gray-400 text-sm">Manage staff permissions</Text>
            </View>
          </View>

          {/* EXPLANATION CARD */}
          <View className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 mb-8 flex-row items-start">
            <Shield color="#D087FF" size={24} className="mt-1 mr-3" />
            <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">How this works</Text>
                <Text className="text-gray-300 text-sm leading-5">
                    Generate a temporary access code for your staff. They can use this code to log in to the "Staff Mode" which <Text className="font-bold text-white">only allows scanning tickets</Text>. They cannot see your revenue or edit event details.
                </Text>
            </View>
          </View>

          {/* GENERATE BUTTON */}
          <TouchableOpacity 
            onPress={handleGenerateCode}
            activeOpacity={0.8}
            className="w-full mb-8 shadow-lg shadow-purple-500/30"
          >
            <LinearGradient
                {...electricGradient}
                className="w-full py-4 rounded-xl flex-row items-center justify-center"
            >
                <Plus color="white" size={24} className="mr-2" />
                <Text className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Jost-Medium' }}>
                    GENERATE NEW CODE
                </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ACTIVE CODES LIST */}
          <Text className="text-white text-xl font-bold mb-4">Active Access Codes</Text>
          
          {activeCodes.map((item) => (
            <View key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <View className="bg-white/10 p-2 rounded-lg mr-3">
                            <Users color="white" size={20} />
                        </View>
                        <View>
                            <Text className="text-white font-bold text-lg">{item.role}</Text>
                            <Text className="text-green-400 text-xs font-bold uppercase">• {item.status}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} className="bg-red-500/10 p-2 rounded-full">
                        <Trash2 color="#ef4444" size={20} />
                    </TouchableOpacity>
                </View>

                {/* THE CODE BOX */}
                <View className="flex-row items-center bg-black/40 rounded-xl border border-dashed border-white/20 p-3 justify-between">
                    <View>
                        <Text className="text-gray-500 text-xs uppercase mb-1">Access Code</Text>
                        <Text className="text-white text-3xl font-bold tracking-widest" style={{ fontFamily: 'Jost-Medium' }}>
                            {item.code}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => copyToClipboard(item.code)} className="bg-white/10 p-3 rounded-lg">
                        <Copy color="white" size={20} />
                    </TouchableOpacity>
                </View>

                <Text className="text-gray-500 text-xs mt-3 text-right">
                    Used {item.uses} times today
                </Text>
            </View>
          ))}

        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default TeamAccessScreen;
