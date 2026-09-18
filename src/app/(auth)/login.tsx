import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { login } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/login.styles";

export default function LoginScreen() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!username.trim()) {
      setError("Vui lòng nhập tên đăng nhập hoặc email.");
      return;
    }
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const res = await login({
        usernameOrEmail: username.trim(),
        password,
      });

      const result = await loginUser(res.token, res.user);
      if (!result.success) {
        setError(result.message || "Tài khoản không được phép truy cập.");
        return;
      }

      const roleName = res.user.roleName;
      if (roleName === "Admin" || roleName === "SystemAdmin") {
        router.replace("/(tabs)/admin-users");
      } else if (roleName === "Manager") {
        router.replace("/(tabs)/dashboard");
      } else if (roleName === "Researcher") {
        router.replace("/(tabs)/experiments");
      } else {
        router.replace("/(tabs)/equipment");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản & mật khẩu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="leaf" size={36} color="#ffffff" />
            </View>
            <Text style={styles.brandTitle}>FRPAM Mobile</Text>
            <Text style={styles.brandSubtitle}>
              Hệ thống Quản lý Tài nguyên Hiện trường Lâm nghiệp
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập hệ thống</Text>
            <Text style={styles.cardDesc}>
              Sử dụng tài khoản được cấp để truy cập hệ thống FRPAM
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#b91c1c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên đăng nhập / Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    if (error) setError("");
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError("");
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Đăng nhập</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            FRPAM System © 2026 - Forestry Resource Planning & Asset Management
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
