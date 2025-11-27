import React from 'react';
import { Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

// Styles
import { electricGradient } from '../styles/colours';

// We wrap LinearGradient in an Animated View to allow movement
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type Props = {
  style?: any; // Accepts the animated transform styles
};

const HostTopBanner = ({ style }: Props) => {
  return (
    <AnimatedGradient
      {...electricGradient}
      style={[styles.container, style]}
    >
      {/* Logo */}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Host Title */}
      <Text style={styles.text}>
        GateKeeper <Text style={{ color: '#E0AAFF' }}>Hosts</Text>
      </Text>
    </AnimatedGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Ensures it floats above everything
    height: 100, // Fixed height (h-24 approx + padding)
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24, // px-6
    paddingBottom: 12, // pb-4
    paddingTop: 40, // Space for status bar
  },
  logo: {
    width: 50, // w-12 approx
    height: 50,
    marginBottom: 4,
  },
  text: {
    color: 'white',
    fontSize: 32, // text-4xl approx
    fontFamily: 'Jost-Medium',
    fontWeight: 'bold',
    marginLeft: 12,
    marginBottom: 4,
  }
});

export default HostTopBanner;
