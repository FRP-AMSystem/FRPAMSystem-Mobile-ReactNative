import { StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingWrap: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
  },
  // KPI Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  metricLabel: {
    fontSize: 12.5,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 4,
  },
  // Urgent Items
  urgentList: {
    gap: 10,
  },
  urgentCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffdfa",
    gap: 8,
  },
  urgentCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  urgentTypePill: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#b45309",
  },
  urgentTime: {
    fontSize: 11.5,
    color: Colors.textMuted,
  },
  urgentTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0f172a",
  },
  urgentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  urgentAuthor: {
    fontSize: 12,
    color: "#475569",
  },
  urgentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  urgentActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  emptyUrgentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  emptyUrgentText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  // Resource Summary
  resourceSummaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 14,
  },
  resourceRow: {
    gap: 6,
  },
  resourceRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resourceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  resourceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
