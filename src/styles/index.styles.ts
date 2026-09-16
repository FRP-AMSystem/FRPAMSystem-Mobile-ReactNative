import { StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  text: {
    marginTop: 14,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});
