import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Ticket, 
  MoreVertical 
} from 'lucide-react-native';

// 👇 FIX 1: Import the types needed for navigation
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/types';

// Components
import HostTopBanner from '../../components/HostTopBanner';
import HostBottomNav from '../../components/HostBottomNav';

// Styles
import { bannerGradient, electricGradient } from '../../styles/colours';

const HEADER_HEIGHT = 100;

// Using imagePlaceHolder assets
const EVENTS_DATA = {
  upcoming: [
    { id: '1', title: 'Summer Slam 2025', date: '28 Oct 2025', location: 'Clifton 4th', sold: 1240, revenue: 'R 45k', image: require('../../assets/imagePlaceHolder1.png') },
    { id: '2', title: 'Techno Tunnel', date: '15 Nov 2025', location: 'The Power Station', sold: 450, revenue: 'R 12k', image: require('../../assets/imagePlaceHolder2.png') },
  ],
  past: [
    { id: '3', title: 'Winter Warmer', date: '12 June 2024', location: 'City Hall', sold: 2100, revenue: 'R 85k', image: require('../../assets/imagePlaceHolder3.png') },
    { id: '4', title: 'Deep House Dive', date: '05 May 2024', location: 'Truth Nightclub', sold: 800, revenue: 'R 32k', image: require('../../assets/imagePlaceHolder4.png') },
  ],
  drafts: [
    { id: '5', title: 'Secret Sunset', date: 'TBA', location: 'TBA', status: 'Draft - 40% Complete', image: require('../../assets/imagePlaceHolder5.png') },
    { id: '6', title: 'Beach Bar Opening', date: 'TBA', location: 'Camps Bay', status: 'Draft - 10% Complete', image: require('../../assets/imagePlaceHolder6.png') },
  ]
};

const MyEventsList = () => {
  // 👇 FIX 2: Apply the RootStackParamList to useNavigation
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'drafts'>('upcoming');

  // --- Scroll Animation Logic ---
  const translateY = useSharedValue(0);
  const lastContentOffset = useSharedValue(0);
  const isHidden = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastContentOffset.value;

      if (diff > 5 && currentY > 50 && !isHidden.value) {
        isHidden.value = true;
        translateY.value = withTiming(-HEADER_HEIGHT, { duration: 300, easing: Easing.inOut(Easing.ease) });
      } else if (diff < -5 && isHidden.value) {
        isHidden.value = false;
        translateY.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) });
      }
      lastContentOffset.value = currentY;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  // --------------------------------------------------

  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      className="mb-6 bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      // 👇 FIX 3: Now navigation works because Typescript knows 'ManageEvent' accepts an 'eventId'
      onPress={() => navigation.navigate('ManageEvent', { eventId: item.id })}
    >
      {/* Event Image Banner */}
      <View className="h-32 w-full relative">
        <Image 
          source={item.image} 
          className="w-full h-full opacity-80" 
          resizeMode="cover" 
        />
        {/* Status Badge / Options */}
        <View className="absolute top-3 right-3 flex-row gap-2">
            {activeTab === 'drafts' && (
                <View className="bg-yellow-500/80 px-2 py-1 rounded-md">
                    <Text className="text-black text-xs font-bold">DRAFT</Text>
                </View>
            )}
            <TouchableOpacity className="bg-black/40 p-2 rounded-full">
                <MoreVertical color="white" size={16} />
            </TouchableOpacity>
        </View>
      </View>

      {/* Event Details */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
            {/* Title */}
            <Text 
                className="text-white text-2xl font-bold flex-1 mr-2" 
                style={{ fontFamily: 'Jost-Medium' }}
                numberOfLines={1}
            >
                {item.title}
            </Text>

            {/* Revenue Label */}
            {activeTab !== 'drafts' && (
                <View className="items-end">
                    <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">Revenue</Text>
                    <Text className="text-green-400 font-bold text-xl leading-6">{item.revenue}</Text>
                </View>
            )}
        </View>

        <View className="flex-row items-center mb-2">
            <Calendar color="#ccc" size={14} className="mr-4" />
            <Text className="text-gray-400 text-sm ml-1">{item.date}</Text>
        </View>
        
        <View className="flex-row items-center mb-4">
            <MapPin color="#ccc" size={14} className="mr-4" />
            <Text className="text-gray-400 text-sm ml-1">{item.location}</Text>
        </View>

        {/* Business Stats Footer */}
        {activeTab !== 'drafts' ? (
             <View className="flex-row gap-3 pt-3 border-t border-white/10">
                <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-lg">
                    <Ticket color="#D087FF" size={14} className="mr-3" />
                    <Text className="text-white font-medium text-xs ml-2">{item.sold} Sold</Text>
                </View>
                <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-lg">
                    <Text className="text-purple-300 font-medium text-xs">Manage Event →</Text>
                </View>
            </View>
        ) : (
            <View className="pt-3 border-t border-white/10">
                 <Text className="text-yellow-500 font-medium text-sm">{item.status}</Text>
            </View>
        )}
       
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      {/* Background */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />

      {/* Animated Header */}
      <HostTopBanner style={headerAnimatedStyle} />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <View className="flex-1 pt-[120px]"> 
            
            {/* TABS SEGMENTED CONTROL */}
            <View className="flex-row bg-white/10 p-1 rounded-xl mx-6 mb-6">
                {['upcoming', 'past', 'drafts'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <TouchableOpacity 
                            key={tab}
                            onPress={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 rounded-lg items-center justify-center ${isActive ? 'bg-white/20' : 'bg-transparent'}`}
                        >
                            <Text 
                                className={`text-sm font-bold capitalize ${isActive ? 'text-white' : 'text-gray-400'}`}
                                style={{ fontFamily: 'Jost-Medium' }}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* EVENTS LIST */}
            <Animated.FlatList
                data={EVENTS_DATA[activeTab]}
                renderItem={renderEventCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-10">
                        <Text className="text-gray-500 text-lg">No events found.</Text>
                    </View>
                }
            />
        </View>

        {/* FLOATING CREATE BUTTON */}
        <TouchableOpacity 
            activeOpacity={0.9}
            className="absolute bottom-28 right-6 shadow-lg shadow-purple-500/50"
            onPress={() => navigation.navigate('CreateEvent')}
        >
            <LinearGradient
                {...electricGradient}
                className="w-14 h-14 rounded-full items-center justify-center"
            >
                <Plus color="white" size={32} />
            </LinearGradient>
        </TouchableOpacity>

      </SafeAreaView>

      <HostBottomNav />
    </View>
  );
};

export default MyEventsList;