import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getUsers, createUser, deleteUser } from "../../api/userApi";
import { UserItem, CreateUserPayload } from "../../types/user";
import { CreateUserModal } from "../../components/CreateUserModal";
import { EditUserModal } from "../../components/EditUserModal";
import { UserDetailsModal } from "../../components/UserDetailsModal";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/admin-users.styles";

const ROLE_FILTERS = [
  { key: "all", label: "All Roles" },
  { key: "Admin", label: "Admin" },
  { key: "Manager", label: "Manager" },
  { key: "Researcher", label: "Researcher" },
  { key: "Technician", label: "Technician" },
  { key: "Seasonal", label: "Seasonal" },
  { key: "Student", label: "Student" },
];

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Create User Modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit User Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserItem | null>(null);

  // View User Modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState<UserItem | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers({ Size: 100 });
      setUsers(data);
    } catch (err) {
      console.error("Load users error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleCreateUser = async (payload: CreateUserPayload) => {
    try {
      setCreating(true);
      await createUser(payload);
      setCreateModalVisible(false);
      Alert.alert("Thành công", `Đã tạo tài khoản "${payload.username}" thành công!`);
      loadUsers();
    } catch (err: any) {
      console.error("Create user error:", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể tạo tài khoản. Vui lòng kiểm tra lại dữ liệu."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = (u: UserItem) => {
    Alert.alert(
      "Xác nhận xóa tài khoản",
      `Bạn có chắc chắn muốn xóa tài khoản "${u.fullName || u.username}" (@${u.username}) không? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tài khoản",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(u.userId);
              Alert.alert("Thành công", `Đã xóa tài khoản "${u.username}" thành công!`);
              loadUsers();
            } catch (err: any) {
              console.error("Delete user error:", err);
              Alert.alert("Lỗi", "Không thể xóa tài khoản. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phoneNumber || "").toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      selectedRole === "all" ||
      String(u.roleName).toLowerCase() === selectedRole.toLowerCase() ||
      (selectedRole === "Admin" && String(u.roleName).toLowerCase().includes("admin"));

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (roleName?: string) => {
    const r = (roleName || "").toLowerCase();
    if (r.includes("admin")) {
      return { label: "ADMIN", bg: "#fdf2f8", text: "#db2777", border: "#fbcfe8" };
    }
    if (r.includes("manager")) {
      return { label: "MANAGER", bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    }
    if (r.includes("researcher")) {
      return { label: "RESEARCHER", bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
    }
    if (r.includes("tech")) {
      return { label: "TECHNICIAN", bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    }
    if (r.includes("season")) {
      return { label: "SEASONAL", bg: "#ecfeff", text: "#0891b2", border: "#a5f3fc" };
    }
    return { label: String(roleName || "USER").toUpperCase(), bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
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
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>User List</Text>
            <Text style={styles.subtitle}>
              {users.length} profiles trong hệ thống
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add" size={16} color="#ffffff" />
            <Text style={styles.createBtnText}>Thêm mới</Text>
          </TouchableOpacity>
        </View>

        {/* Role Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ROLE_FILTERS}
          keyExtractor={(item) => item.key}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterChips}
          renderItem={({ item }) => {
            const isActive = selectedRole === item.key;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedRole(item.key)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by full name or email..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách người dùng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.userId || item.id || Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Không tìm thấy tài khoản người dùng phù hợp.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const roleBadge = getRoleBadge(String(item.roleName));
            const isActive = item.isActive !== false;
            const initials = getInitials(item.fullName || item.username);

            return (
              <View style={styles.userCard}>
                {/* Header: Initials Avatar + Full Name & Email + Badges */}
                <View style={styles.userCardHeader}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.userInfoWrap}>
                    <Text style={styles.userName}>{item.fullName}</Text>
                    <Text style={styles.userEmail}>{item.email || "No email"}</Text>
                  </View>
                  <View style={styles.badgeCol}>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor: roleBadge.bg,
                          borderColor: roleBadge.border,
                        },
                      ]}
                    >
                      <Text style={[styles.roleText, { color: roleBadge.text }]}>
                        {roleBadge.label}
                      </Text>
                    </View>

                    {/* Status Pill matching Web FE */}
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isActive ? "#f0fdf4" : "#fef2f2" },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isActive ? "#16a34a" : "#dc2626" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isActive ? "#16a34a" : "#dc2626" },
                        ]}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Username</Text>
                    <Text style={styles.detailValueHandle}>{item.username}</Text>
                  </View>
                  {item.phoneNumber ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{item.phoneNumber}</Text>
                    </View>
                  ) : null}
                  {item.department ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Department</Text>
                      <Text style={styles.detailValue}>{item.department}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Actions Row: View, Edit, Delete */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnView}
                    onPress={() => {
                      setSelectedUserForView(item);
                      setViewModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={14} color="#16a34a" />
                    <Text style={styles.actionBtnTextView}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => {
                      setSelectedUserForEdit(item);
                      setEditModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pencil" size={13} color="#2563eb" />
                    <Text style={styles.actionBtnTextEdit}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnDelete}
                    onPress={() => handleDeleteUser(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={13} color="#dc2626" />
                    <Text style={styles.actionBtnTextDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        visible={createModalVisible}
        loading={creating}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateUser}
      />

      {/* Edit User Modal */}
      <EditUserModal
        visible={editModalVisible}
        user={selectedUserForEdit}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedUserForEdit(null);
        }}
        onSuccess={loadUsers}
      />

      {/* View User Details Modal */}
      <UserDetailsModal
        visible={viewModalVisible}
        user={selectedUserForView}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedUserForView(null);
        }}
        onEdit={(u) => {
          setSelectedUserForEdit(u);
          setEditModalVisible(true);
        }}
      />
    </View>
  );
}
