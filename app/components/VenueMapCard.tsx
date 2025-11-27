import React, { useEffect } from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { X, MapPin, ArrowRight, Star } from 'lucide-react-native';

import { fireGradient } from '../styles/colours';

const { height } = Dimensions.get('window');

type VenueMapCardProps = {
  venue: any;
  onClose: () => void;
  onViewVenue: () => void;
};

const VenueMapCard = ({ venue, onClose, onViewVenue }: VenueMapCardProps) => {
  const translateY = useSharedValue(height);

  useEffect(() => {
    translateY.value = withTiming(0, { 
        duration: 350, 
        easing: Easing.out(Easing.exp) 
    });
  }, [venue]);

  const closeCard = () => {
    translateY.value = withTiming(height, { 
        duration: 300,
        easing: Easing.in(Easing.quad)
    }, () => {
      runOnJS(onClose)();
    });
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100) runOnJS(closeCard)();
      else translateY.value = withTiming(0, { duration: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!venue) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View 
        style={[animatedStyle]}
        className="absolute bottom-0 left-0 right-0 bg-[#121212] rounded-t-3xl shadow-2xl shadow-black border-t border-white/10 z-50 pb-8"
      >
        <View className="w-full items-center pt-3 pb-2">
            <View className="w-12 h-1.5 bg-white/20 rounded-full" />
        </View>

        <TouchableOpacity 
            onPress={closeCard} 
            className="absolute top-4 right-4 bg-white/10 p-1.5 rounded-full"
        >
            <X color="#ccc" size={20} />
        </TouchableOpacity>

        <View className="px-6 pt-2">
            <View className="flex-row items-center mb-4">
                {/* Placeholder Image for Venue (or specific if available) */}
                <View className="w-20 h-20 rounded-xl mr-4 bg-purple-900/30 items-center justify-center border border-white/10">
                    <MapPin color="#D087FF" size={32} />
                </View>
                
                <View className="flex-1">
                    <Text className="text-white text-2xl font-bold leading-tight mb-1" style={{ fontFamily: 'Jost-Medium' }}>
                        {venue.title}
                    </Text>
                    <View className="flex-row items-center">
                        <MapPin color="#D087FF" size={14} className="mr-1" />
                        <Text className="text-gray-400 text-sm">{venue.address}</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                        <Star color="#FACC15" size={14} fill="#FACC15" className="mr-1" />
                        <Text className="text-white font-bold text-xs">4.8 <Text className="text-gray-500 font-normal">(120 Reviews)</Text></Text>
                    </View>
                </View>
            </View>

            <Text className="text-gray-300 text-sm mb-6 leading-5">
                Top-rated venue for techno and live music events. Tap to see upcoming schedule.
            </Text>

            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={onViewVenue}
                className="w-full shadow-lg shadow-purple-500/20"
            >
                <LinearGradient
                    colors={['#B92BFF', '#6500B0']} // Electric Gradient for Venues
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full py-4 rounded-xl flex-row items-center justify-center"
                >
                    <Text className="text-white font-bold text-lg mr-2" style={{ fontFamily: 'Jost-Medium' }}>
                        VIEW VENUE
                    </Text>
                    <ArrowRight color="white" size={20} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
        
        <View className="h-20" /> 
      </Animated.View>
    </GestureDetector>
  );
};

export default VenueMapCard;
