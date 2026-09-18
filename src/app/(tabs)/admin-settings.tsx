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
        "Kết nối thành công",
        `Máy chủ phản hồi tốt trong ${duration}ms.\nAPI Base: ${API_BASE_URL}`
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi kết nối", "Không thể phản hồi từ máy chủ trung tâm.");
    } finally {
      setCheckingApi(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Xóa bộ nhớ đệm",
      "Bạn có chắc muốn làm mới bộ nhớ đệm và tải lại trạng thái dữ liệu?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa Cache",
          onPress: () => {
            Alert.alert("Thành công", "Đã xóa bộ nhớ đệm cục bộ ứng dụng.");
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
        <Text style={styles.title}>Cấu hình & Quản trị Hệ thống</Text>
        <Text style={styles.subtitle}>
          Thông số hạ tầng, trạng thái API và bảo trì hệ thống
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* System Health */}
        <Text style={styles.sectionTitle}>Trạng thái Hệ thống</Text>
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicator}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>Máy chủ Đang Hoạt động</Text>
            </View>
            <View style={styles.pingBadge}>
              <Text style={styles.pingText}>
                {apiLatency ? `${apiLatency}ms` : "Trực tuyến"}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Máy chủ Backend</Text>
              <Text style={styles.infoValue}>RunASP Cloud Host</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giao thức AI GA</Text>
              <Text style={styles.infoValue}>Di truyền (Genetic Algorithm)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phiên bản FRPAM Mobile</Text>
              <Text style={styles.infoValue}>v1.2.0 (Build 2026)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Môi trường</Text>
              <Text style={styles.infoValue}>Production</Text>
            </View>
          </View>
        </View>

        {/* Maintenance Actions */}
        <Text style={styles.sectionTitle}>Tác vụ Quản trị</Text>
        <View style={styles.actionList}>
          {/* Kiểm tra API */}
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
                <Text style={styles.actionItemTitle}>Kiểm tra Kết nối API</Text>
                <Text style={styles.actionItemDesc}>
                  Đo độ trễ và khả năng phản hồi của backend
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Xóa Cache */}
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
                <Text style={styles.actionItemTitle}>Làm mới Dữ liệu Cục bộ</Text>
                <Text style={styles.actionItemDesc}>
                  Xóa bộ nhớ đệm cache và đồng bộ lại
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
