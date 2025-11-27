import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Building,
  CheckCircle,
  DollarSign,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  Info,
} from "lucide-react-native";

import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";
import { bannerGradient, electricGradient } from "../../styles/colours";

const PayoutsSetupScreen = () => {
  const navigation = useNavigation();

  // Mock State: Host's Bank Details (Null = New User)
  const [bankDetails, setBankDetails] = useState<{
    bank: string;
    account: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // New State: Have they clicked "Add Account"?
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleSaveBank = () => {
    if (!bankName || !accountNumber) {
      Alert.alert(
        "Missing Details",
        "Please enter your bank name and account number."
      );
      return;
    }
    setBankDetails({ bank: bankName, account: accountNumber });
    setIsEditing(false);
    setShowForm(false); // Reset form state
    Alert.alert(
      "Success",
      "Payout details saved! You can now receive payments."
    );
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 120, paddingBottom: 140 }}
        >
          {/* Header */}
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
              Payouts & Finance
            </Text>
          </View>

          {/* AVAILABLE BALANCE CARD */}
          <LinearGradient
            {...electricGradient}
            className="w-full rounded-3xl p-6 mb-8 shadow-lg shadow-purple-900/50"
          >
            <Text className="text-white/80 font-medium text-lg mb-1">
              Available Balance
            </Text>
            <Text className="text-white text-5xl font-bold mb-4">
              R 12,450.00
            </Text>

            {bankDetails ? (
              <View className="flex-row items-center bg-white/20 self-start px-3 py-1 rounded-full">
                <CheckCircle color="#4ade80" size={14} className="mr-2" />
                <Text className="text-white font-bold text-sm">
                  Payouts Active
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-yellow-500/20 self-start px-3 py-1 rounded-full border border-yellow-500/50">
                <Text className="text-yellow-300 font-bold text-sm">
                  Action Required
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* BANK CONNECTION SECTION */}
          <Text className="text-white text-xl font-bold mb-4">
            Banking Details
          </Text>

          {/* LOGIC: 
              1. If we have details AND not editing -> Show Card 
              2. If we are editing OR (no details AND user clicked 'Add') -> Show Form
              3. If no details AND user hasn't clicked 'Add' -> Show Info/Welcome 
          */}

          {bankDetails && !isEditing ? (
            // 1. CONNECTED CARD VIEW
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-white/10 p-3 rounded-full mr-4">
                  <Building color="white" size={24} />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    {bankDetails.bank}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    **** {bankDetails.account.slice(-4)} • Verified
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-white/5 px-3 py-2 rounded-lg"
              >
                <Text className="text-white text-xs font-bold">Edit</Text>
              </TouchableOpacity>
            </View>
          ) : showForm || isEditing ? (
            // 2. FORM VIEW (Input Fields)
            <View className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <View className="flex-row items-center mb-6">
                <CreditCard color="#D087FF" size={24} className="mr-3" />
                <Text className="text-white text-lg font-bold">
                  {isEditing ? "Update Details" : "Add Local Bank Account"}
                </Text>
              </View>

              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Bank Name
              </Text>
              <TextInput
                placeholder="e.g. FNB, Capitec, Standard Bank"
                placeholderTextColor="#666"
                value={bankName}
                onChangeText={setBankName}
                className="bg-black/40 border border-white/10 rounded-xl px-4 h-12 text-white font-medium mb-4"
              />

              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Account Number
              </Text>
              <TextInput
                placeholder="Account Number"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={accountNumber}
                onChangeText={setAccountNumber}
                className="bg-black/40 border border-white/10 rounded-xl px-4 h-12 text-white font-medium mb-6"
              />

              <TouchableOpacity
                onPress={handleSaveBank}
                className="w-full shadow-lg shadow-purple-500/30"
              >
                <LinearGradient
                  {...electricGradient}
                  className="w-full py-3 rounded-xl items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg">
                    Save & Verify
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel Button */}
              {!bankDetails && (
                <TouchableOpacity
                  onPress={() => setShowForm(false)}
                  className="items-center mt-4"
                >
                  <Text className="text-gray-500 text-sm font-bold">
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // 3. INFO / WELCOME VIEW (New User State)
            <View className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 items-center">
              <View className="bg-white/10 p-4 rounded-full mb-4 border border-white/10">
                <ShieldCheck color="#D087FF" size={40} />
              </View>
              <Text className="text-white text-xl font-bold mb-2 text-center">
                Get Paid Securely
              </Text>
              <Text className="text-gray-400 text-center mb-6 leading-6">
                Link your South African bank account to receive automated
                payouts. We use Paystack to ensure your funds are transferred
                securely every week.
              </Text>

              {/* Info Row */}
              <View className="w-full flex-row justify-between mb-6 px-2">
                <View className="items-center">
                  <Text className="text-white font-bold">Weekly</Text>
                  <Text className="text-gray-500 text-xs">Settlements</Text>
                </View>
                <View className="w-[1px] bg-white/10 h-full" />
                <View className="items-center">
                  <Text className="text-white font-bold">ZAR</Text>
                  <Text className="text-gray-500 text-xs">Direct Deposit</Text>
                </View>
                <View className="w-[1px] bg-white/10 h-full" />
                <View className="items-center">
                  <Text className="text-white font-bold">1%</Text>
                  <Text className="text-gray-500 text-xs">Fee</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowForm(true)}
                className="w-full shadow-lg shadow-purple-500/30"
              >
                <LinearGradient
                  {...electricGradient}
                  className="w-full py-3 rounded-xl items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg">
                    Add Bank Account
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* HISTORY */}
          <Text className="text-white text-xl font-bold mb-4">
            Payout History
          </Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl p-1">
            {[1, 2, 3].map((i) => (
              <TouchableOpacity
                key={i}
                className="flex-row items-center justify-between p-4 border-b border-white/5"
              >
                <View className="flex-row items-center">
                  <View className="bg-green-500/10 p-2 rounded-full mr-4">
                    <DollarSign color="#4ade80" size={16} />
                  </View>
                  <View>
                    <Text className="text-white font-bold">
                      Weekly Settlement
                    </Text>
                    <Text className="text-gray-500 text-xs">12 Oct 2025</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-white font-bold mr-2">R 4,200.00</Text>
                  <ChevronRight color="#666" size={16} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <HostBottomNav />
    </View>
  );
};

export default PayoutsSetupScreen;
