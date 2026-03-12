"use client";
import React, { useEffect, useState } from "react";
import { Tournament, TournamentGroup, TournamentParticipant } from "../../../lib/tournamentUtils";
import { useAuth } from "../../../lib/AuthContext";

type Props = {
  open: boolean;
  onClose: () => void;
  tournament: Tournament;
  member: TournamentParticipant | null;
  onSaveProfile: (memberId: string, updates: { name?: string; psnId?: string }) => Promise<void>;
  onMoveGroup: (member: TournamentParticipant, targetGroupId: string) => Promise<void>;
  onRemoveMember: (member: TournamentParticipant) => Promise<void>;
  isLoading: boolean;
};

export default function MemberSidePanel({
  open,
  onClose,
  tournament,
  member,
  onSaveProfile,
  onMoveGroup,
  onRemoveMember,
  isLoading,
}: Props) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [name, setName] = useState("");
  const [psnId, setPsnId] = useState("");
  const groups: TournamentGroup[] = tournament.groups || [];

  useEffect(() => {
    if (member) {
      setName(member.name || "");
      setPsnId(member.psnId || "");
    }
  }, [member]);

  useEffect(() => {
    if (open && !isAuthenticated) setShowAuthModal(true);
  }, [open, isAuthenticated, setShowAuthModal]);

  const memberGroupId = member?.groupId || null;
  const canMoveGroups = groups.length > 0;

  const handleSave = async () => {
    if (!member?.id) return;
    await onSaveProfile(member.id, {
      name: name.trim() || member.name,
      psnId: psnId.trim() || undefined,
    });
  };

  const handleMove = async (targetGroupId: string) => {
    if (!member) return;
    if (!targetGroupId || targetGroupId === memberGroupId) return;
    await onMoveGroup(member, targetGroupId);

    member.groupId = targetGroupId;
  };

  const handleRemove = async () => {
    if (!member) return;
    await onRemoveMember(member);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Edit Member</h3>
              {member?.name && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Current: <span className="font-medium text-blue-700">{member.name}</span>
                  {memberGroupId && tournament.groups?.length ? (
                    <> • Group {memberGroupId.replace("group_", "")}</>
                  ) : null}
                </p>
              )}
            </div>
            <button
              className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Profile Section */}
            <section>
              <h4 className="text-sm font-semibold text-blue-700 mb-3">Profile</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-blue-600 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="w-full border-2 border-blue-100 text-blue-900 rounded-lg px-3 py-2 text-sm placeholder:text-blue-400 focus:outline-none focus:border-blue-500"
                    placeholder="Team/Member name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-600 mb-1">
                    PSN ID (optional)
                  </label>
                  <input
                    type="text"
                    value={psnId}
                    onChange={(e) => setPsnId(e.target.value)}
                    disabled={isLoading}
                    className="w-full border-2 border-blue-100 text-blue-900 rounded-lg px-3 py-2 text-sm placeholder:text-blue-400 focus:outline-none focus:border-blue-500"
                    placeholder="PSN ID"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={isLoading || !member}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm disabled:opacity-50 transition-all duration-200"
                >
                  {isLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </section>

            {/* Group Assignment Section */}
            <section>
              <h4 className="text-sm font-semibold text-blue-700 mb-3">
                Group Assignment
              </h4>

              {canMoveGroups ? (
                <div className="space-y-3">
                  <div className="text-xs text-gray-600">
                    Moving a member between groups after fixtures are created will{" "}
                    <span className="font-semibold text-red-600">reset</span> the affected
                    groups’ fixtures and standings.
                  </div>

                  <div className="space-y-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleMove(g.id)}
                        disabled={isLoading || memberGroupId === g.id}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-colors duration-200 ${
                          memberGroupId === g.id
                            ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-100 hover:border-blue-400"
                        } disabled:opacity-60`}
                      >
                        Move to <span className="font-bold">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600">Groups not generated yet.</div>
              )}
            </section>

            {/* Danger Zone */}
            <section>
              <h4 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h4>
              <button
                onClick={handleRemove}
                disabled={isLoading || !member}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-bold shadow-sm transition-all duration-200 disabled:opacity-50"
              >
                Remove from Tournament
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
