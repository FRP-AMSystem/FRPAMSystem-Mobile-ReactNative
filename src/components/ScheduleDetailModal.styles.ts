import { StyleSheet, Dimensions } from "react-native";
import { Colors } from "../constants/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.92,
    minHeight: SCREEN_HEIGHT * 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  headerBar: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleGroup: {
    flex: 1,
    marginRight: 10,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLoading: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  // Hero Card
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 24,
  },
  // Section Cards
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  timelineHeaderRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationPill: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  fieldItem: {
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  fieldValueBold: {
    fontSize: 14.5,
    color: "#0f172a",
    fontWeight: "700",
    lineHeight: 20,
  },
  allocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  allocationText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  // Timeline Dual Grid
  timelineDualGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeBox: {
    flex: 1,
    alignItems: "center",
  },
  timeBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  timeBoxHeaderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  timeDateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  timeHourText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },
  timeArrowBox: {
    paddingHorizontal: 8,
  },
  // Person Row
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  personInfo: {
    flex: 1,
  },
  personRoleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.3,
  },
  personName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 1,
  },
  personSub: {
    fontSize: 11.5,
    color: "#64748b",
    marginTop: 1,
  },
  // Description Box
  descBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  descContent: {
    fontSize: 13.5,
    color: "#334155",
    lineHeight: 20,
  },
  // Notes Card
  notesCard: {
    borderColor: "#fde68a",
    backgroundColor: "#fffdf7",
  },
  notesBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  notesContent: {
    fontSize: 13.5,
    color: "#78350f",
    lineHeight: 20,
    fontWeight: "500",
  },
  // Audit Card
  auditCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  auditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  auditLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  auditValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  // Footer
  footerBar: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#475569",
  },
});
