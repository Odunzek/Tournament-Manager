"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  addGroupMember,
  getGroupMembers,
  updateGroupMember,
  deactivateGroupMember,
  deleteGroupMember,
  subscribeToGroupMembers,
  searchMembers,
  GroupMember,
} from "../../lib/membershipUtils";
import { useAuth } from "../../lib/AuthContext";

// Toast notification component (mobile-friendly width/position)
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 left-4 right-4 sm:right-6 sm:left-auto z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl transform transition-all duration-500 backdrop-blur-sm
    ${
      type === "success"
        ? "bg-green-500/90 text-white"
        : type === "error"
        ? "bg-red-500/90 text-white"
        : "bg-blue-500/90 text-white"
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="text-lg sm:text-xl">
        {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
      </span>
      <span className="font-medium text-sm sm:text-base flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 sm:ml-4 text-white/95 hover:text-white text-lg leading-none"
      >
        ×
      </button>
    </div>
  </div>
);

interface MemberFormData {
  name: string;
  psnId: string;
  notes: string;
  isActive: boolean;
}

export default function WhatsAppMemberManager() {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState<GroupMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    psnId: "",
    notes: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<MemberFormData>>({});

  const showToast = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setIsLoaded(true);
    const unsubscribe = subscribeToGroupMembers((updatedMembers) => {
      setMembers(updatedMembers);
    });
    return () => unsubscribe();
  }, []);

  const requireAuth = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      const timer = setTimeout(() => setFormErrors({}), 3000);
      return () => clearTimeout(timer);
    }
  }, [formErrors]);

  const validateForm = (): boolean => {
    const errors: Partial<MemberFormData> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (formData.psnId.trim() && formData.psnId.trim().length < 3) {
      errors.psnId = "PSN ID must be at least 3 characters";
    }

    const duplicateMember = members.find(
      (member) =>
        member.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        member.id !== editingMember?.id
    );
    if (duplicateMember) {
      errors.name = "A member with this name already exists";
    }

    if (formData.psnId.trim()) {
      const duplicatePSN = members.find(
        (member) =>
          member.psnId &&
          member.psnId.toLowerCase() === formData.psnId.trim().toLowerCase() &&
          member.id !== editingMember?.id
      );
      if (duplicatePSN) {
        errors.psnId = "A member with this PSN ID already exists";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requireAuth()) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (editingMember) {
        await updateGroupMember(editingMember.id!, {
          name: formData.name.trim(),
          psnId: formData.psnId.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive,
        });
        showToast(`${formData.name} updated successfully!`, "success");
        setEditingMember(null);
      } else {
        await addGroupMember({
          name: formData.name.trim(),
          psnId: formData.psnId.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          isActive: true,
        });
        showToast(`${formData.name} added to the group!`, "success");
        setShowAddForm(false);
      }

      setFormData({
        name: "",
        psnId: "",
        notes: "",
        isActive: true,
      });
      setFormErrors({});
    } catch (error) {
      console.error("Error saving member:", error);
      showToast("Failed to save member", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMember = (member: GroupMember) => {
    if (!requireAuth()) return;

    setEditingMember(member);
    setFormData({
      name: member.name,
      psnId: member.psnId || "",
      notes: member.notes || "",
      isActive: member.isActive || true,
    });
    setShowAddForm(false);
    setFormErrors({});
  };

  const handleDeactivateMember = async (member: GroupMember) => {
    if (!requireAuth() || !member.id) return;

    setIsLoading(true);
    try {
      await deactivateGroupMember(member.id);
      showToast(`${member.name} has been deactivated`, "info");
    } catch (error) {
      console.error("Error deactivating member:", error);
      showToast("Failed to deactivate member", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (member: GroupMember) => {
    if (!requireAuth() || !member.id) return;

    setIsLoading(true);
    try {
      await deleteGroupMember(member.id);
      showToast(`${member.name} deleted permanently`, "success");
    } catch (error) {
      console.error("Error deleting member:", error);
      showToast("Failed to delete member", "error");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      psnId: "",
      notes: "",
      isActive: true,
    });
    setFormErrors({});
  };

  const filteredMembers = searchMembers(
    showInactive ? members : members.filter((m) => m.isActive),
    searchTerm
  );

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (!isLoaded) {
    return (
      <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
        <div className="animate-pulse">
          <div className="h-7 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3 mb-4 sm:mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 sm:h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-8 bg-white/3 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-600 px-4 sm:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0">
                <Image
                  src="/icons/addplayers.svg"
                  alt="Add Player Icon"
                  width={50}
                  height={50}
                  className="w-8 h-8 sm:w-12 sm:h-12"
                />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-snug">
                Manage your EA FC25 competition group
              </h2>
            </div>
            <div className="self-start sm:self-auto bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl">
              <span className="text-white/80 text-xs sm:text-sm font-medium">
                Active Members:
              </span>
              <span className="text-white font-bold ml-2 text-sm sm:text-base">
                {members.filter((m) => m.isActive).length}/{members.length}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members by name or PSN ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-black bg-white placeholder-gray-500 w-full px-4 py-3 pl-11 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-300 transition-all duration-300"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  🔍
                </span>
              </div>
            </div>

            {/* Toggle Inactive */}
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                showInactive
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-blue-600 hover:bg-indigo-600 text-white"
              }`}
            >
              {showInactive ? "Hide Inactive" : "Show Inactive"}
            </button>

            {/* Add Member */}
            <button
              onClick={() => {
                if (!requireAuth()) return;
                setShowAddForm(!showAddForm);
                setEditingMember(null);
                setFormData({
                  name: "",
                  psnId: "",
                  notes: "",
                  isActive: true,
                });
                setFormErrors({});
              }}
              disabled={isLoading}
              className={`px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                showAddForm
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:opacity-50`}
            >
              <span className="inline-flex items-center gap-2">
                <Image
                  src={showAddForm ? "/icons/cancel.svg" : "/icons/plus.svg"}
                  alt={showAddForm ? "Cancel" : "Add"}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span>{showAddForm ? "Cancel" : "Add Member"}</span>
              </span>
            </button>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingMember) && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg text-black font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <span className="text-lg sm:text-xl">
                  {editingMember ? "✏️" : "👤"}
                </span>
                <span>{editingMember ? "Edit Member" : "Add New Member"}</span>
              </h3>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name)
                        setFormErrors({ ...formErrors, name: undefined });
                    }}
                    className={`text-black placeholder-gray-500 w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      formErrors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    }`}
                    placeholder="Enter full name"
                    disabled={isLoading}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>❌</span>
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* PSN */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    PSN ID / Gaming ID
                  </label>
                  <input
                    type="text"
                    value={formData.psnId}
                    onChange={(e) => {
                      setFormData({ ...formData, psnId: e.target.value });
                      if (formErrors.psnId)
                        setFormErrors({ ...formErrors, psnId: undefined });
                    }}
                    className={`text-black placeholder-gray-500 w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      formErrors.psnId
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    }`}
                    placeholder="PSN ID or Gaming handle (optional)"
                    disabled={isLoading}
                  />
                  {formErrors.psnId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>❌</span>
                      <span>{formErrors.psnId}</span>
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-black mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="text-black placeholder-gray-500 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Any additional notes (optional)"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Member Status
                  </label>
                  <select
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.value === "active",
                      })
                    }
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    disabled={isLoading}
                  >
                    <option value="active">✅ Active</option>
                    <option value="inactive">⛔ Inactive</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-indigo-500 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-5 py-3 rounded-xl font-bold transition-all duration-300"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>
                          {editingMember ? "Updating..." : "Adding..."}
                        </span>
                      </div>
                    ) : (
                      <span>
                        {editingMember ? "Update Member" : "Add Member"}
                      </span>
                    )}
                  </button>

                  {editingMember && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Members Grid */}
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`group bg-white/75 shadow-sm rounded-xl p-5 sm:p-6 transition-all duration-300 border ${
                    member.isActive
                      ? "border-gray-100 hover:border-indigo-300 hover:shadow-lg"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 ${getAvatarColor(
                        member.name
                      )} rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold truncate ${
                          member.isActive ? "text-gray-900" : "text-gray-600"
                        }`}
                        title={member.name}
                      >
                        {member.name}
                      </h3>
                      {member.psnId && (
                        <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">
                          🎮 {member.psnId}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        member.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          member.isActive ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      {member.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  {/* Actions */}
                  {isAuthenticated && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        ✏️ Edit
                      </button>
                      {member.isActive ? (
                        <button
                          onClick={() => handleDeactivateMember(member)}
                          disabled={isLoading}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          ⏸️ Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(member)}
                          disabled={isLoading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {member.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-700 italic break-words">
                        {member.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🎮</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                {searchTerm ? "No members found" : "No members yet"}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                {searchTerm
                  ? `No members match "${searchTerm}". Try a different search term.`
                  : "Add your first EA FC25 group member to get started!"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    if (!requireAuth()) return;
                    setShowAddForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg font-semibold"
                >
                  Add First Member
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-red-100 rounded-full">
                <span className="text-2xl sm:text-3xl">🗑️</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2 sm:mb-3">
                Delete Member?
              </h3>
              <p className="text-gray-600 text-center mb-6 sm:mb-8 leading-relaxed px-2 sm:px-4">
                This will permanently delete{" "}
                <strong>"{showDeleteConfirm.name}"</strong> from the group.
                This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMember(showDeleteConfirm)}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    "Delete Member"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
