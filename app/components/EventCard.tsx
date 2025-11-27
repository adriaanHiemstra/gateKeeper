import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { bannerGradient, fireGradient } from '../styles/colours';
import { textStyles } from '../styles/typography';
import UsersIcon from '../components/icons/groupIcon';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

type EventCardProps = {
  eventName: string;
  attendees: number;
  logo: ImageSourcePropType;
  banner: ImageSourcePropType;
  description?: string;
  time?: string;
  location?: string;
  onPressOrangeButton?: () => void;
};

const EventCard = ({
  eventName,
  attendees,
  logo,
  banner,
  description,
  time,
  location,
}: EventCardProps) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const navigation = useNavigation<NavigationProp<any>>();

  const togglePanel = () => {
    const opening = !panelOpen;
    setPanelOpen(opening);

    Animated.timing(slideAnim, {
      toValue: opening ? screenWidth - 300 : screenWidth,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const goToProfile = () => {
    navigation.navigate('EventProfile', {
      eventName,
      attendees,
      logo,
      banner,
      description,
      time,
      location,
    });
  };

  return (
    <View className="bg-white overflow-hidden shadow-md">
      {/* Header - now tappable */}
      <TouchableOpacity activeOpacity={0.8} onPress={goToProfile}>
        <LinearGradient
          {...bannerGradient}
          className="flex-row justify-between items-center px-4 py-5 bg-blue-900"
        >
          <View className="flex-row items-center space-x-2">
            <Image source={logo} className="w-8 h-8 rounded-full" />
            <Text style={[textStyles.paragraph1, { color: 'white' }]}>
              {eventName}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Orange button for social circle panel */}
      <TouchableOpacity
        onPress={togglePanel}
        className="absolute right-4 z-10"
        style={{ top: screenHeight * 0.043 }}
      >
        <LinearGradient
          {...fireGradient}
          className="w-16 h-16 rounded-full items-center justify-center shadow-md p-1 flex-col"
        >
          <View className="w-7 h-7">
            <UsersIcon width="100%" height="100%" fill="#fff" />
          </View>
          <Text
            className="mt-1"
            style={[textStyles.paragraph3, { color: 'white' }]}
          >
            {attendees}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Banner image - tapping title area will navigate */}
      <TouchableOpacity activeOpacity={0.9} onPress={goToProfile}>
        <Image
          source={banner}
          style={{ width: '100%', height: screenHeight * 0.45 }}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Sliding social panel stays the same */}
      {panelOpen && (
        <Animated.View
          style={[
            styles.panel,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View className="items-center bg-transparent">
            <Text
              className="text-lg font-semibold mb-4 text-center z-50 pt-1"
              style={[textStyles.paragraph1, { color: 'black' }]}
            >
              Your Social Circle
            </Text>
          </View>
          {[...Array(4)].map((_, i) => (
            <View
              key={i}
              className="flex-row items-center justify-left gap-4 mb-3"
            >
              <View className="w-10 h-10 rounded-full bg-gray-300 flex-row" />
              <Text
                className="font-medium pl-8"
                style={[textStyles.paragraph3, { color: 'black' }]}
              >
                Casey_Frey
              </Text>
              <Text className="text-orange-500">❤️</Text>
            </View>
          ))}
          <Text className="text-sm text-gray-500">7 More...</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    width: 300,
    backgroundColor: 'white',
    paddingVertical: 30,
    paddingHorizontal: 16,
    zIndex: 10,
  },
});

export default EventCard;




