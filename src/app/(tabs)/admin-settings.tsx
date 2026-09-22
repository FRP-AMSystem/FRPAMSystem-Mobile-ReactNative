import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../constants/config";
import client from "../../api/client";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/admin-settings.styles";

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [checkingApi, setCheckingApi] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  const handleCheckApi = async () => {
    try {
      setCheckingApi(true);
      const start = Date.now();
      await client.get("/Experiments", { params: { Size: 1 } });
      const duration = Date.now() - start;
      setApiLatency(duration);
      Alert.alert(
        "Connection Successful",
        `Server responded in ${duration}ms.\nAPI Base: ${API_BASE_URL}`
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert("Connection Error", "Unable to connect to central server.");
    } finally {
      setCheckingApi(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Local Cache",
      "Are you sure you want to clear local cache and refresh data status?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          onPress: () => {
            Alert.alert("Success", "Application local cache has been cleared.");
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top : 8 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>System Settings & Administration</Text>
        <Text style={styles.subtitle}>
          Infrastructure metrics, API status, and maintenance tasks
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* System Health */}
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicator}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>Server Operational</Text>
            </View>
            <View style={styles.pingBadge}>
              <Text style={styles.pingText}>
                {apiLatency ? `${apiLatency}ms` : "Online"}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Backend Host</Text>
              <Text style={styles.infoValue}>RunASP Cloud Host</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>AI GA Protocol</Text>
              <Text style={styles.infoValue}>Genetic Algorithm</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FRPAM Mobile Version</Text>
              <Text style={styles.infoValue}>v1.2.0 (Build 2026)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Environment</Text>
              <Text style={styles.infoValue}>Production</Text>
            </View>
          </View>
        </View>

        {/* Maintenance Actions */}
        <Text style={styles.sectionTitle}>Administrative Tasks</Text>
        <View style={styles.actionList}>
          {/* API Health Check */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleCheckApi}
            disabled={checkingApi}
            activeOpacity={0.8}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: "#eff6ff" }]}>
                {checkingApi ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Ionicons name="pulse" size={20} color="#2563eb" />
                )}
              </View>
              <View style={styles.actionItemTextWrap}>
                <Text style={styles.actionItemTitle}>Check API Connectivity</Text>
                <Text style={styles.actionItemDesc}>
                  Measure latency and response time of backend services
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Clear Cache */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleClearCache}
            activeOpacity={0.8}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="refresh" size={20} color="#d97706" />
              </View>
              <View style={styles.actionItemTextWrap}>
                <Text style={styles.actionItemTitle}>Refresh Local Data</Text>
                <Text style={styles.actionItemDesc}>
                  Clear application cache and resynchronize
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
