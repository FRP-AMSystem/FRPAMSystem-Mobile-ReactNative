import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../constants/colors";
import { styles } from "../styles/index.styles";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isFieldStaff } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    } else if (isFieldStaff) {
      router.replace("/(tabs)/equipment");
    } else {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated, isFieldStaff]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Khởi động hệ thống FRPAM...</Text>
    </View>
  );
}
