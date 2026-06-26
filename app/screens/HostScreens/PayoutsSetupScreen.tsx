import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Building,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  X,
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import HostTopBanner from "../../components/HostTopBanner";
import HostBottomNav from "../../components/HostBottomNav";
import { bannerGradient, electricGradient } from "../../styles/colours";

// Paystack South-Africa `settlement_bank` codes (SA universal branch codes).
// Covers the major banks; pull the rest from Paystack's /bank?currency=ZAR list
// if a host's bank is missing.
const SA_BANKS = [
  { name: "Absa Bank", code: "632005" },
  { name: "African Bank", code: "430000" },
  { name: "Capitec Bank", code: "470010" },
  { name: "Discovery Bank", code: "679000" },
  { name: "First National Bank (FNB)", code: "250655" },
  { name: "Investec Bank", code: "580105" },
  { name: "Nedbank", code: "198765" },
  { name: "Standard Bank", code: "051001" },
  { name: "TymeBank", code: "678910" },
];

const PayoutsSetupScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [subaccountCode, setSubaccountCode] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [selectedBank, setSelectedBank] = useState<{
    name: string;
    code: string;
  } | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);

  // Load the host's profile to see if they've already linked a payout account.
  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");

        const { data } = await supabase
          .from("profiles")
          .select("full_name, paystack_subaccount_code")
          .eq("id", user.id)
          .single();

        if (data) {
          setSubaccountCode(data.paystack_subaccount_code ?? null);
          setBusinessName(data.full_name ?? "");
        }
      } catch {
        // Fall through to the un-connected state.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleConnect = async () => {
    if (!businessName.trim() || !selectedBank || !accountNumber.trim()) {
      Alert.alert(
        "Missing details",
        "Enter your business name, pick your bank, and add your account number."
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-subaccount",
        {
          body: {
            business_name: businessName.trim(),
            settlement_bank: selectedBank.code,
            account_number: accountNumber.trim(),
          },
        }
      );

      if (error) {
        Alert.alert(
          "Connection failed",
          "Couldn't reach the server. Please try again."
        );
        return;
      }
      if (!data?.ok) {
        Alert.alert(
          "Couldn't link account",
          data?.error ?? "Please check your details and try again."
        );
        return;
      }

      setSubaccountCode(data.subaccount_code);
      setShowForm(false);
      Alert.alert(
        "Payouts active",
        "Your bank account is linked. Ticket sales now settle to it automatically."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#D087FF" />
      </View>
    );
  }

  const connected = !!subaccountCode;

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient {...bannerGradient} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/40" />
      <HostTopBanner />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
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

          {/* STATUS HERO */}
          <LinearGradient
            {...electricGradient}
            className="w-full rounded-3xl p-6 mb-8 shadow-lg shadow-purple-900/50"
          >
            <Text className="text-white/80 font-medium text-lg mb-1">
              Payout Status
            </Text>
            <Text className="text-white text-4xl font-bold mb-4">
              {connected ? "Active" : "Setup Needed"}
            </Text>

            {connected ? (
              <View className="flex-row items-center bg-white/20 self-start px-3 py-1 rounded-full">
                <CheckCircle color="#4ade80" size={14} />
                <Text className="text-white font-bold text-sm ml-2">
                  Linked & ready
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

          {/* BANKING DETAILS */}
          <Text className="text-white text-xl font-bold mb-4">
            Banking Details
          </Text>

          {connected && !showForm ? (
            // CONNECTED CARD
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-green-500/10 p-3 rounded-full mr-4">
                  <Building color="#4ade80" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">
                    Account Linked
                  </Text>
                  <Text className="text-gray-400 text-xs" numberOfLines={1}>
                    {subaccountCode}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setAccountNumber("");
                  setSelectedBank(null);
                  setShowForm(true);
                }}
                className="bg-white/5 px-3 py-2 rounded-lg"
              >
                <Text className="text-white text-xs font-bold">Update</Text>
              </TouchableOpacity>
            </View>
          ) : showForm ? (
            // FORM VIEW
            <View className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <View className="flex-row items-center mb-6">
                <CreditCard color="#D087FF" size={24} />
                <Text className="text-white text-lg font-bold ml-3">
                  {connected ? "Update Bank Account" : "Link Bank Account"}
                </Text>
              </View>

              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Business / Account Name
              </Text>
              <TextInput
                placeholder="e.g. Rockstar Events"
                placeholderTextColor="#666"
                value={businessName}
                onChangeText={setBusinessName}
                className="bg-black/40 border border-white/10 rounded-xl px-4 h-12 text-white font-medium mb-4"
                style={{ fontFamily: "Jost-Medium" }}
              />

              <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">
                Bank
              </Text>
              <TouchableOpacity
                onPress={() => setBankPickerOpen(true)}
                className="bg-black/40 border border-white/10 rounded-xl px-4 h-12 mb-4 flex-row items-center justify-between"
              >
                <Text
                  className={selectedBank ? "text-white" : "text-gray-500"}
                  style={{ fontFamily: "Jost-Medium" }}
                >
                  {selectedBank ? selectedBank.name : "Select your bank"}
                </Text>
                <ChevronDown color="#888" size={20} />
              </TouchableOpacity>

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
                style={{ fontFamily: "Jost-Medium" }}
              />

              <TouchableOpacity
                onPress={handleConnect}
                disabled={submitting}
                className="w-full shadow-lg shadow-purple-500/30"
              >
                <LinearGradient
                  {...electricGradient}
                  className={`w-full py-3 rounded-xl items-center justify-center ${
                    submitting ? "opacity-70" : ""
                  }`}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      Save & Connect
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {connected && (
                <TouchableOpacity
                  onPress={() => setShowForm(false)}
                  className="items-center mt-4"
                  disabled={submitting}
                >
                  <Text className="text-gray-500 text-sm font-bold">Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // WELCOME / NEW-USER VIEW
            <View className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 items-center">
              <View className="bg-white/10 p-4 rounded-full mb-4 border border-white/10">
                <ShieldCheck color="#D087FF" size={40} />
              </View>
              <Text className="text-white text-xl font-bold mb-2 text-center">
                Get Paid Securely
              </Text>
              <Text className="text-gray-400 text-center mb-6 leading-6">
                Link your South African bank account to receive your ticket
                revenue. We use Paystack to split each sale and settle your share
                straight to your bank.
              </Text>

              <TouchableOpacity
                onPress={() => setShowForm(true)}
                className="w-full shadow-lg shadow-purple-500/30"
              >
                <LinearGradient
                  {...electricGradient}
                  className="w-full py-3 rounded-xl items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg">
                    Link Bank Account
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* HOW IT WORKS */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-row">
            <ShieldCheck color="#888" size={20} />
            <Text className="text-gray-400 text-sm ml-3 flex-1 leading-5">
              Your share of every ticket sale is split to your account at
              checkout and settled by Paystack on a rolling basis. The platform
              fee is deducted automatically — there's nothing to invoice.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* BANK PICKER */}
      <Modal
        visible={bankPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBankPickerOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#1E1E1E] rounded-t-3xl max-h-[70%] pb-8">
            <View className="flex-row items-center justify-between p-5 border-b border-white/10">
              <Text
                className="text-white text-xl font-bold"
                style={{ fontFamily: "Jost-Medium" }}
              >
                Choose your bank
              </Text>
              <TouchableOpacity
                onPress={() => setBankPickerOpen(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color="white" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SA_BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  onPress={() => {
                    setSelectedBank(bank);
                    setBankPickerOpen(false);
                  }}
                  className="flex-row items-center justify-between px-5 py-4 border-b border-white/5"
                >
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: "Jost-Medium" }}
                  >
                    {bank.name}
                  </Text>
                  {selectedBank?.code === bank.code && (
                    <CheckCircle color="#4ade80" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <HostBottomNav />
    </View>
  );
};

export default PayoutsSetupScreen;
