import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet, // We still need this for the gradient background
  Dimensions,
  SafeAreaView,
  ScrollView,
  TouchableOpacity, // We need this to make buttons tappable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../types/types';
import { fireGradient, bannerGradient } from '../styles/colours';
import { textStyles as appTextStyles } from '../styles/typography'; // Import your custom text styles

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type EventProfileRouteProp = RouteProp<RootStackParamList, 'EventProfile'>;

// Let's define our ticket data here, just like in the screenshot
const ticketTiers = [
  {
    name: 'Early Bird -',
    price: 'R250',
    description: 'This bad boy is gonna get you this and this and that as well',
  },
  {
    name: 'Medium Bird -',
    price: 'R250',
    description: 'This bad boy is gonna get you this and this and that as well',
  },
  {
    name: 'Late Bird -',
    price: 'R800',
    description: 'This bad boy is gonna get you this and this and that as well',
  },
  {
    name: 'Delux -',
    price: 'R1800',
    description: 'This bad boy is gonna get you this and this and that as well',
  },
];

const EventProfileScreen = () => {
  const { params } = useRoute<EventProfileRouteProp>();

  // Fallbacks for direct testing (from your old code)
  const eventName = params?.eventName ?? 'Just Between Us Summer Slam';
  const banner = params?.banner ?? require('../assets/event-placeholder.png');
  // I'll use a different placeholder for the logo, as imagePlaceHolder5 wasn't provided
  // but you can change this back to your '../assets/imagePlaceHolder5.png'
  const logo = params?.logo ?? require('../assets/profile-pic-1.png');

  return (
    <SafeAreaView className="flex-1">
      {/* Background Gradient */}
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Banner Image */}
        <Image
          source={banner}
          // We use the style prop for dynamic height like this
          style={{ height: screenHeight * 0.2 }}
          className="w-full"
          resizeMode="cover"
        />

        {/* Circular Logo (using absolute positioning) */}
        <View
          className="absolute items-center justify-center bg-gray-200"
          style={{
            top: screenHeight * 0.15, // Positioned 15% from top
            left: (screenWidth - screenWidth * 0.2) / 2, // Centered
            width: screenWidth * 0.2, // 20% of screen width
            height: screenWidth * 0.2, // 20% of screen width
            borderRadius: screenWidth * 0.1, // Half of width/height
            borderWidth: 4,
            borderColor: 'white',
            overflow: 'hidden', // Make sure image stays inside circle
          }}
        >
          <Image
            source={logo}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Event Info Block */}
        <View className="items-center" style={{ marginTop: screenHeight * 0.1 }}>
          <Text style={[appTextStyles.paragraph3, { color: 'white' }]}>
            Rockstar Events
          </Text>
          <Text
            style={[
              appTextStyles.header2,
              { color: 'white', textAlign: 'center', marginTop: 4 },
            ]}
          >
            {eventName}
          </Text>
        </View>

        {/* Ticket Tiers List */}
        <View className="mt-8 px-6 space-y-6">
          {/* We loop through our ticket data and create a row for each one */}
          {ticketTiers.map((tier, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between"
            >
              {/* Left Side: Info */}
              <View className="flex-1 pr-4">
                <View className="flex-row items-baseline">
                  <Text
                    style={[appTextStyles.paragraph2, { color: 'white' }]}
                  >
                    {tier.name}{' '}
                  </Text>
                  <Text
                    style={[
                      appTextStyles.paragraph2,
                      { color: 'white', fontWeight: 'bold' },
                    ]}
                  >
                    {tier.price}
                  </Text>
                </View>
                <Text
                  style={[
                    appTextStyles.paragraph3,
                    { color: 'white', opacity: 0.8, marginTop: 4 },
                  ]}
                >
                  {tier.description}
                </Text>
              </View>

              {/* Right Side: Button */}
              <TouchableOpacity>
                <LinearGradient
                  {...fireGradient} // Using your fireGradient from colours.ts
                  className="rounded-full py-3 px-6"
                >
                  <Text
                    style={[
                      appTextStyles.paragraph3,
                      { color: 'white', fontWeight: 'bold' },
                    ]}
                  >
                    Buy Now!
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// We remove the old StyleSheet.create block as we are using Nativewind now

export default EventProfileScreen;