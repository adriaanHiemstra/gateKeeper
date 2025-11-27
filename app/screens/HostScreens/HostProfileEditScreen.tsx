import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { 
  Camera, 
  User, 
  AtSign, 
  Link, 
  AlignLeft,
  Save
} from 'lucide-react-native';

// Components
import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';

// Styles
import { bannerGradient, electricGradient } from '../../styles/colours';

const HostProfileEditScreen = () => {
  const navigation = useNavigation();

  // State (Mock Data)
  const [name, setName] = useState('Rockstar Events');
  const [handle, setHandle] = useState('rockstarevents_sa');
  const [bio, setBio] = useState('Curating the wildest summer vibes in Cape Town. From rooftop parties to beach festivals, we bring the heat. 🔥');
  const [website, setWebsite] = useState('www.rockstarevents.co.za');
  const [profilePic, setProfilePic] = useState<any>(require('../../assets/profile-pic-1.png'));

  const handleSave = () => {
    Alert.alert("Profile Updated", "Your host profile has been saved successfully.");
  };

  const handleChangePhoto = () => {
    // Mock photo change
    Alert.alert("Change Photo", "Opens Image Picker library...");
  };

  // Input Helper
  const ProfileInput = ({ label, icon, value, onChange, multiline = false, placeholder }: any) => (
    <View className="mb-6">
      <Text className="text-gray-400 text-sm font-bold mb-2 ml-1 uppercase tracking-wider">
        {label}
      </Text>
      <View className={`flex-row items-start bg-white/5 border border-white/10 rounded-xl px-4 ${multiline ? 'h-32 py-3' : 'h-14 items-center'}`}>
        <View className={`mr-3 opacity-70 ${multiline ? 'mt-1' : ''}`}>
          {icon}
        </View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#666"
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          className="flex-1 text-white text-lg font-medium h-full"
          style={{ fontFamily: 'Jost-Medium' }}
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          
          {/* HEADER */}
          <View className="mb-8">
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>
              Edit Profile
            </Text>
            <Text className="text-gray-400 text-base">
              Update your public host details
            </Text>
          </View>

          {/* 1. PROFILE PHOTO UPLOADER */}
          <View className="items-center mb-10">
            <View className="relative">
                <View className="w-32 h-32 rounded-full border-4 border-purple-500/30 shadow-lg shadow-purple-500/50 overflow-hidden">
                    <Image 
                        source={profilePic} 
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
                <TouchableOpacity 
                    onPress={handleChangePhoto}
                    activeOpacity={0.8}
                    className="absolute bottom-0 right-0 bg-white p-3 rounded-full border-4 border-[#121212]"
                >
                    <Camera color="#D087FF" size={20} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
            <Text className="text-purple-300 font-bold mt-3">Change Profile Photo</Text>
          </View>

          {/* 2. FORM FIELDS */}
          <ProfileInput 
            label="Display Name"
            icon={<User color="white" size={20} />}
            value={name}
            onChange={setName}
          />

          <ProfileInput 
            label="Handle (Username)"
            icon={<AtSign color="white" size={20} />}
            value={handle}
            onChange={setHandle}
          />

          <ProfileInput 
            label="Bio / Description"
            icon={<AlignLeft color="white" size={20} />}
            value={bio}
            onChange={setBio}
            multiline={true}
          />

          <ProfileInput 
            label="Website / LinkTree"
            icon={<Link color="white" size={20} />}
            value={website}
            onChange={setWebsite}
            placeholder="https://..."
          />

        </ScrollView>

        {/* SAVE BUTTON */}
        <View className="absolute bottom-24 left-0 right-0 p-6">
            <TouchableOpacity 
                activeOpacity={0.8}
                className="w-full shadow-lg shadow-purple-500/40"
                onPress={handleSave}
            >
                <LinearGradient
                    {...electricGradient}
                    className="w-full py-4 rounded-full flex-row items-center justify-center"
                >
                    <Save color="white" size={20} className="mr-2" />
                    <Text className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Jost-Medium' }}>
                        SAVE PROFILE
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </SafeAreaView>

      <HostBottomNav />
    </View>
  );
};

export default HostProfileEditScreen;
