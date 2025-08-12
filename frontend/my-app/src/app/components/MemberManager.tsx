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

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 backdrop-blur-sm ${
    type === 'success' ? 'bg-green-500/90 text-white' : 
    type === 'error' ? 'bg-red-500/90 text-white' : 
    'bg-blue-500/90 text-white'
  }`}>
    <div className="flex items-center space-x-3">
      <span className="text-xl">
        {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 font-bold">×</button>
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<GroupMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    psnId: '',
    notes: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<Partial<MemberFormData>>({});

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load members and setup real-time listener
  useEffect(() => {
    setIsLoaded(true);
    
    // Setup real-time listener for active members
    const unsubscribe = subscribeToGroupMembers((updatedMembers) => {
      setMembers(updatedMembers);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Handle authentication requirement
  const requireAuth = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // Clear form errors after 3 seconds
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      const timer = setTimeout(() => setFormErrors({}), 3000);
      return () => clearTimeout(timer);
    }
  }, [formErrors]);

  // Validate form data
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

    // Check for duplicate name (excluding current member when editing)
    const duplicateMember = members.find(member => 
      member.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      member.id !== editingMember?.id
    );
    if (duplicateMember) {
      errors.name = "A member with this name already exists";
    }

    // Check for duplicate PSN ID (excluding current member when editing)
    if (formData.psnId.trim()) {
      const duplicatePSN = members.find(member => 
        member.psnId && member.psnId.toLowerCase() === formData.psnId.trim().toLowerCase() && 
        member.id !== editingMember?.id
      );
      if (duplicatePSN) {
        errors.psnId = "A member with this PSN ID already exists";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requireAuth()) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (editingMember) {
        // Update existing member
        await updateGroupMember(editingMember.id!, {
          name: formData.name.trim(),
          psnId: formData.psnId.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive
        });
        showToast(`${formData.name} updated successfully!`, 'success');
        setEditingMember(null);
      } else {
        // Create new member
        await addGroupMember({
          name: formData.name.trim(),
          psnId: formData.psnId.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          isActive: true
        });
        showToast(`${formData.name} added to the group!`, 'success');
        setShowAddForm(false);
      }
      
      // Reset form
      setFormData({
        name: '',
        psnId: '',
        notes: '',
        isActive: true
      });
      setFormErrors({});
    } catch (error) {
      console.error('Error saving member:', error);
      showToast('Failed to save member', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit member
  const handleEditMember = (member: GroupMember) => {
    if (!requireAuth()) return;
    
    setEditingMember(member);
    setFormData({
      name: member.name,
      psnId: member.psnId || '',
      notes: member.notes || '',
      isActive: member.isActive || true
    });
    setShowAddForm(false);
    setFormErrors({});
  };

  // Handle deactivate member
  const handleDeactivateMember = async (member: GroupMember) => {
    if (!requireAuth() || !member.id) return;
    
    setIsLoading(true);
    try {
      await deactivateGroupMember(member.id);
      showToast(`${member.name} has been deactivated`, 'info');
    } catch (error) {
      console.error('Error deactivating member:', error);
      showToast('Failed to deactivate member', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete member
  const handleDeleteMember = async (member: GroupMember) => {
    if (!requireAuth() || !member.id) return;
    
    setIsLoading(true);
    try {
      await deleteGroupMember(member.id);
      showToast(`${member.name} deleted permanently`, 'success');
    } catch (error) {
      console.error('Error deleting member:', error);
      showToast('Failed to delete member', 'error');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      psnId: '',
      notes: '',
      isActive: true
    });
    setFormErrors({});
  };

  // Filter members based on search term
  const filteredMembers = searchMembers(
    showInactive ? members : members.filter(m => m.isActive),
  searchTerm
  );


  // Generate avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Show loading state while data loads
  if (!isLoaded) {
    return (
      <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-8 bg-white/30 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                  <Image
                  src="/icons/addplayers.svg"
                  alt="Add Player Icon"
                  width={50}
                  height={50}
                 />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Manage your EA FC25 competition group</h2>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <span className="text-white/80 text-sm font-medium">Active Members:</span>
              <span className="text-white font-bold ml-2">{members.filter(m => m.isActive).length}/{members.length}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Search and Add Member Section */}
          <div className=" flex flex-col md:flex-row gap-4 mb-8">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members by name or PSN ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-black bg-white placeholder-gray-500 w-full px-4 py-3 pl-12  rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-300 transition-all duration-300"
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              </div>
            </div>
            
            {/* Toggle Show Inactive */}
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                showInactive
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : 'bg-blue-600 hover:bg-indigo-600 text-white'
              }`}
            >
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </button>
            
            {/* Add Member Button */}
            <button
              onClick={() => {
                if (!requireAuth()) return;
                setShowAddForm(!showAddForm);
                setEditingMember(null);
                setFormData({
                  name: '',
                  psnId: '',
                  notes: '',
                  isActive: true
                });
                setFormErrors({});
              }}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                showAddForm
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : 'bg-green-600 hover:from-green-600 hover:to-teal-600 text-white'
              } disabled:opacity-50`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">{showAddForm ? (
                    <Image
                      src="/icons/cancel.svg"
                      alt="Cancel"
                      width={20}
                      height={20}
                    />
                    ) : (
                    <Image
                      src="/icons/plus.svg" 
                      alt="Add"
                      width={20}
                      height={20}
                    />
                  )}</span>
                <span>{showAddForm ? 'Cancel' : 'Add Member'}</span>
              </span>
            </button>
          </div>

          {/* Add/Edit Member Form */}
          {(showAddForm || editingMember) && (
            <div className="bg-white/100 rounded-xl p-6 shadow-sm mb-8">
              <h3 className="text-lg text-black font-bold mb-6 flex items-center space-x-2">
                <span className="text-xl">{editingMember ? '✏️' : '👤'}</span>
                <span>{editingMember ? 'Edit Member' : 'Add New Member'}</span>
              </h3>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                    }}
                    className={`text-black placeholder-gray-500 w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      formErrors.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                    }`}
                    placeholder="Enter full name"
                    disabled={isLoading}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <span>❌</span>
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* PSN ID */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    PSN ID / Gaming ID
                  </label>
                  <input
                    type="text"
                    value={formData.psnId}
                    onChange={(e) => {
                      setFormData({ ...formData, psnId: e.target.value });
                      if (formErrors.psnId) setFormErrors({ ...formErrors, psnId: undefined });
                    }}
                    className={`text-black placeholder-gray-500 w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      formErrors.psnId
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                    }`}
                    placeholder="PSN ID or Gaming handle (optional)"
                    disabled={isLoading}
                  />
                  {formErrors.psnId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
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
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="text-black placeholder-gray-500 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Any additional notes (optional)"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                {/* Active Status Toggle */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Member Status
                  </label>
                  <select
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === "active" })
                    }
                    className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    disabled={isLoading}
                  >
                    <option value="active">✅ Active</option>
                    <option value="inactive">⛔ Inactive</option>
                  </select>
                </div>

                {/* Form Buttons */}
                <div className="md:col-span-2 flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-indigo-500 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-5 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-101 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{editingMember ? 'Updating...' : 'Adding...'}</span>
                      </div>
                    ) : (
                      <span>{editingMember ? 'Update Member' : 'Add Member'}</span>
                    )}
                  </button>
                  
                  {editingMember && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`group bg-white/70 shadow-sm rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                    member.isActive ? 'border-gray-100 hover:border-indigo-300' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {/* Member Avatar and Info */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`w-12 h-12 ${getAvatarColor(member.name)} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${member.isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {member.name}
                      </h3>
                      {member.psnId && (
                        <p className="text-sm text-blue-600 font-medium">🎮 {member.psnId}</p>
                      )}
                    </div>
                  </div>

                  {/* Remove Favorite Team section if it's no longer needed */}

                  {/* Status */}
                  <div className="mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        member.isActive ? 'bg-green-400' : 'bg-red-400'
                      }`}></span>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {/* Action Buttons - Only show if authenticated */}
                  {isAuthenticated && (
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => handleEditMember(member)}
                        disabled={isLoading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 disabled:opacity-50"
                      >
                        ✏️ Edit
                      </button>
                      {member.isActive ? (
                        <button
                          onClick={() => handleDeactivateMember(member)}
                          disabled={isLoading}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 disabled:opacity-50"
                        >
                          ⏸️ Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(member)}
                          disabled={isLoading}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {member.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-400">
                      <p className="text-xs text-gray-700 italic">{member.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="text-8xl mb-6">🎮</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchTerm ? 'No members found' : 'No members yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No members match "${searchTerm}". Try a different search term.`
                  : 'Add your first EA FC25 group member to get started!'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    if (!requireAuth()) return;
                    setShowAddForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Delete Member?
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                This will permanently delete <strong>"{showDeleteConfirm.name}"</strong> from the group. This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMember(showDeleteConfirm)}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete Member'
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