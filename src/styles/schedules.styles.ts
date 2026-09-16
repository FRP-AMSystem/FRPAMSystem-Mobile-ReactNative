import { StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

export const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 28,
  },
  // 0. Scope Switcher
  scopeContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  scopeBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scopeIcon: {
    marginRight: 6,
  },
  scopeBtnText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  scopeBtnTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  // 1. Toolbar Card
  toolbarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    minWidth: 140,
    textAlign: "center",
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginLeft: 6,
  },
  todayBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  // Quick Jump Banner
  quickJumpBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  quickJumpContent: {
    flex: 1,
  },
  quickJumpText: {
    fontSize: 12,
    color: "#0369a1",
  },
  quickJumpLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284c7",
    marginTop: 2,
  },
  // Filter Pills
  filterPillsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statusChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  // Calendar Card
  calendarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  weekdayHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 6,
    marginBottom: 6,
  },
  weekdayCol: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    minHeight: 52,
    borderRadius: 8,
    padding: 3,
    marginBottom: 4,
    alignItems: "center",
  },
  dayTopRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
  },
  outsideDayNumberText: {
    color: "#cbd5e1",
  },
  selectedDayNumberText: {
    color: Colors.primary,
    fontWeight: "800",
  },
  todayBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  eventSnippetsContainer: {
    width: "100%",
    gap: 2,
  },
  eventSnippetPill: {
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderWidth: 1,
  },
  eventSnippetText: {
    fontSize: 8.5,
    fontWeight: "700",
  },
  moreEventsText: {
    fontSize: 8,
    color: Colors.textMuted,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // Selected Day Task Details
  selectedDaySection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectedDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectedDateTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0f172a",
  },
  taskCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  taskCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  emptyDayBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 6,
  },
  emptyDayText: {
    fontSize: 12.5,
    color: Colors.textMuted,
    textAlign: "center",
  },
  dayEventList: {
    gap: 8,
  },
  eventCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  eventCardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoIcon: {
    marginRight: 6,
  },
  eventInfoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  descContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  eventDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  viewDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  viewDetailText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.primary,
  },
});
