import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  ImagePlus, 
  Clock,
  Type,
  Plus
} from 'lucide-react-native';

// Components
import HostTopBanner from '../../components/HostTopBanner'; 

// Styles
import { bannerGradient, electricGradient } from '../../styles/colours';

const CreateEventScreen = () => {
  const navigation = useNavigation();

  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Reusable Input Component
  const InputField = ({ icon, placeholder, value, onChange, multiline = false }: any) => (
    <View className={`flex-row items-start bg-white/5 border border-white/10 rounded-xl px-4 mb-4 ${multiline ? 'h-32 py-3' : 'h-14 items-center'}`}>
      <View className={`mr-3 opacity-70 ${multiline ? 'mt-1' : ''}`}>
        {icon}
      </View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className="flex-1 text-white text-lg font-medium h-full"
        style={{ fontFamily: 'Jost-Medium' }}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      {/* ✅ FIX 1: Added the Host Top Banner */}
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          // ✅ FIX 2: Increased paddingTop to 120 to clear the banner & bezel
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 120 }}
        >
          
          {/* HEADER (Now sits safely below the banner) */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
               <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Create Event</Text>
          </View>

          {/* SECTION 1: VISUALS */}
          <Text className="text-white text-xl font-bold mb-4">Event Visuals</Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            className="w-full h-48 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl items-center justify-center mb-8"
          >
            <View className="bg-purple-500/20 p-4 rounded-full mb-2">
                <ImagePlus color="#D087FF" size={32} />
            </View>
            <Text className="text-gray-400 font-medium">Tap to upload Banner Image</Text>
          </TouchableOpacity>

          {/* SECTION 2: DETAILS */}
          <Text className="text-white text-xl font-bold mb-4">Basic Info</Text>
          
          <InputField 
            icon={<Type color="white" size={20} />} 
            placeholder="Event Title (e.g. Summer Slam)" 
            value={title}
            onChange={setTitle}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
                 <InputField 
                    icon={<Calendar color="white" size={20} />} 
                    placeholder="Date" 
                    value={date}
                    onChange={setDate}
                />
            </View>
            <View className="flex-1">
                <InputField 
                    icon={<Clock color="white" size={20} />} 
                    placeholder="Time" 
                    value={time}
                    onChange={setTime}
                />
            </View>
          </View>

          <InputField 
            icon={<MapPin color="white" size={20} />} 
            placeholder="Location / Venue" 
            value={location}
            onChange={setLocation}
          />

          <InputField 
            icon={<Type color="white" size={20} />} 
            placeholder="Description..." 
            value={description}
            onChange={setDescription}
            multiline={true}
          />

          {/* SECTION 3: TICKETS */}
          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-white text-xl font-bold">Ticket Tiers</Text>
            <TouchableOpacity className="flex-row items-center">
                <Plus color="#D087FF" size={20} className="mr-1" />
                <Text className="text-purple-300 font-bold">Add Tier</Text>
            </TouchableOpacity>
          </View>

          {/* Ticket Tier Card (Mockup of one added tier) */}
          <View className="bg-white/5 border border-white/10 p-4 rounded-xl mb-4 flex-row justify-between items-center">
            <View>
                <Text className="text-white font-bold text-lg">General Access</Text>
                <Text className="text-gray-400 text-sm">1000 Available</Text>
            </View>
            <Text className="text-green-400 font-bold text-xl">R 150</Text>
          </View>

           {/* Toggle: Public/Private */}
           <View className="flex-row justify-between items-center bg-white/5 p-4 rounded-xl mb-8">
              <Text className="text-white font-bold text-lg">Public Event</Text>
              <Switch 
                value={isPublic} 
                onValueChange={setIsPublic}
                trackColor={{ false: '#767577', true: '#D087FF' }}
                thumbColor={'#f4f3f4'}
              />
           </View>

        </ScrollView>

        {/* PUBLISH BUTTON (Fixed at bottom) */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
            <TouchableOpacity 
                activeOpacity={0.8}
                className="w-full shadow-lg shadow-purple-500/30"
                onPress={() => navigation.goBack()} 
            >
                <LinearGradient
                    {...electricGradient}
                    className="w-full py-4 rounded-full items-center justify-center"
                >
                    <Text className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Jost-Medium' }}>
                        PUBLISH EVENT
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

export default CreateEventScreen;