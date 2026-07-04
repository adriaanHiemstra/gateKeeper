import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  findNodeHandle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Lock,
  User,
} from "lucide-react-native";

import TopBanner from "../../components/TopBanner";
import BottomNav from "../../components/BottomNav";
import { bannerGradient, fireGradient } from "../../styles/colours";

const AddCardScreen = () => {
  const navigation = useNavigation();

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // KeyboardAwareScrollView only auto-scrolls when the keyboard first opens —
  // tapping a different field while it's already up doesn't fire that event,
  // so each field's onFocus below nudges the scroll view manually.
  const scrollRef = useRef<any>(null);
  const handleFocus = (event: any) => {
    scrollRef.current?.scrollToFocusedInput(findNodeHandle(event.target));
  };

  const handleSave = () => {
    if (!cardNumber || !expiry || !cvv) {
      Alert.alert("Missing Details", "Please fill in all card details.");
      return;
    }
    Alert.alert("Card Added", "Your payment method has been securely saved.");
    navigation.goBack();
  };

  const InputField = ({
    label,
    icon,
    value,
    onChange,
    placeholder,
    keyboardType = "default",
    onFocus,
  }: any) => (
    <View className="mb-6">
      <Text className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
        {label}
      </Text>
      <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-4 h-14">
        <View className="mr-3 opacity-70">{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#666"
          keyboardType={keyboardType}
          onFocus={onFocus}
          className="flex-1 text-white text-lg font-medium h-full"
          style={{ fontFamily: "Jost-Medium" }}
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <TopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
          enableOnAndroid={true}
          extraScrollHeight={120}
          enableAutomaticScroll={true}
        >
            <View className="flex-row items-center mb-8">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4 bg-white/10 p-2 rounded-full"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Add Card
              </Text>
            </View>

            <InputField
              label="Name on Card"
              icon={<User color="white" size={20} />}
              value={cardName}
              onChange={setCardName}
              placeholder="e.g. John Doe"
              onFocus={handleFocus}
            />
            <InputField
              label="Card Number"
              icon={<CreditCard color="white" size={20} />}
              value={cardNumber}
              onChange={setCardNumber}
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
              onFocus={handleFocus}
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <InputField
                  label="Expiry Date"
                  icon={<Calendar color="white" size={20} />}
                  value={expiry}
                  onChange={setExpiry}
                  placeholder="MM/YY"
                  keyboardType="numeric"
                  onFocus={handleFocus}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="CVV"
                  icon={<Lock color="white" size={20} />}
                  value={cvv}
                  onChange={setCvv}
                  placeholder="123"
                  keyboardType="numeric"
                  onFocus={handleFocus}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.9}
              className="w-full mt-6 shadow-lg shadow-orange-500/30"
            >
              <LinearGradient
                {...fireGradient}
                className="w-full py-4 rounded-2xl items-center justify-center"
              >
                <Text
                  className="text-white text-xl font-bold tracking-wide"
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  SAVE CARD
                </Text>
              </LinearGradient>
            </TouchableOpacity>
        </KeyboardAwareScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
};

export default AddCardScreen;
