import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  ImagePlus, 
  Clock,
  Type,
  Plus,
  Trash2
} from 'lucide-react-native';

// Components
import HostTopBanner from '../../components/HostTopBanner'; 

// Styles
import { bannerGradient, electricGradient } from '../../styles/colours';
import { RootStackParamList } from '../../types/types';

type EditEventRouteProp = RouteProp<RootStackParamList, 'EditEvent'>;

const EditEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditEventRouteProp>();
  
  // In a real app, you'd fetch the event details using this ID
  const { eventId } = route.params || { eventId: '1' };

  // --- Form State (Pre-filled with Mock Data) ---
  const [title, setTitle] = useState('Summer Slam 2025');
  const [location, setLocation] = useState('Clifton 4th Beach');
  const [date, setDate] = useState('28 Oct 2025');
  const [time, setTime] = useState('14:00');
  const [description, setDescription] = useState('The biggest beach party of the year is back! join us for sun, sand, and tunes.');
  const [isPublic, setIsPublic] = useState(true);

  const handleSave = () => {
    // Logic to update the event in the backend would go here
    Alert.alert("Success", "Event details updated successfully!");
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
        "Delete Event", 
        "Are you sure? This cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => navigation.goBack() }
        ]
    );
  };

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

      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          
          {/* HEADER with Delete Option */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-white/10 p-2 rounded-full">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'Jost-Medium' }}>Edit Details</Text>
            </View>
            <TouchableOpacity onPress={handleDelete} className="bg-red-500/20 p-2 rounded-full">
                <Trash2 color="#ef4444" size={24} />
            </TouchableOpacity>
          </View>

          {/* SECTION 1: VISUALS */}
          <Text className="text-white text-xl font-bold mb-4">Event Visuals</Text>
          
          {/* Image Preview (Simulating existing image) */}
          <View className="mb-6">
            <Image 
                source={require('../../assets/imagePlaceHolder1.png')} 
                className="w-full h-48 rounded-2xl mb-3"
                resizeMode="cover"
            />
            <TouchableOpacity className="flex-row items-center justify-center bg-white/10 py-3 rounded-xl border border-white/10">
                <ImagePlus color="white" size={20} className="mr-2" />
                <Text className="text-white font-bold">Change Banner Image</Text>
            </TouchableOpacity>
          </View>

          {/* SECTION 2: DETAILS */}
          <Text className="text-white text-xl font-bold mb-4">Basic Info</Text>
          
          <InputField 
            icon={<Type color="white" size={20} />} 
            placeholder="Event Title" 
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
            placeholder="Location" 
            value={location}
            onChange={setLocation}
          />

          <InputField 
            icon={<Type color="white" size={20} />} 
            placeholder="Description" 
            value={description}
            onChange={setDescription}
            multiline={true}
          />

          {/* SECTION 3: TICKETS (Read Only / Edit) */}
          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-white text-xl font-bold">Ticket Tiers</Text>
            <TouchableOpacity className="flex-row items-center">
                <Plus color="#D087FF" size={20} className="mr-1" />
                <Text className="text-purple-300 font-bold">Add Tier</Text>
            </TouchableOpacity>
          </View>

          {/* Existing Tier 1 */}
          <View className="bg-white/5 border border-white/10 p-4 rounded-xl mb-3 flex-row justify-between items-center">
            <View>
                <Text className="text-white font-bold text-lg">General Access</Text>
                <Text className="text-gray-400 text-sm">800 / 1000 Sold</Text>
            </View>
            <View className="items-end">
                 <Text className="text-green-400 font-bold text-xl">R 150</Text>
                 <Text className="text-purple-300 text-xs font-bold">EDIT</Text>
            </View>
          </View>
          
          {/* Existing Tier 2 */}
          <View className="bg-white/5 border border-white/10 p-4 rounded-xl mb-4 flex-row justify-between items-center">
            <View>
                <Text className="text-white font-bold text-lg">VIP</Text>
                <Text className="text-gray-400 text-sm">45 / 100 Sold</Text>
            </View>
            <View className="items-end">
                 <Text className="text-green-400 font-bold text-xl">R 350</Text>
                 <Text className="text-purple-300 text-xs font-bold">EDIT</Text>
            </View>
          </View>

           {/* Toggle */}
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

        {/* SAVE BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212]/90 border-t border-white/10">
            <TouchableOpacity 
                activeOpacity={0.8}
                className="w-full shadow-lg shadow-purple-500/30"
                onPress={handleSave}
            >
                <LinearGradient
                    {...electricGradient}
                    className="w-full py-4 rounded-full items-center justify-center"
                >
                    <Text className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: 'Jost-Medium' }}>
                        SAVE CHANGES
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

export default EditEventScreen;
