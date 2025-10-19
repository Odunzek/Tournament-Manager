import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  Tournament,
  TournamentParticipant,
  updateTournament,
  getTournamentById,
  getTournamentMembers,
  generateMissingGroupFixtures
} from '../../../lib/tournamentUtils';
import { GroupMember } from '../../../lib/membershipUtils';
import MemberSidePanel from './MemberSidePanel';

interface TournamentTeamsProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
  members: GroupMember[];
  isLoading: boolean;
  isAuthenticated: boolean;
  onAddMember: (selectedMemberId: string) => Promise<void>;
  onRemoveMember: (member: TournamentParticipant) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void; // ✅ added
  setSelectedTournament: (t: Tournament) => void; // ✅ added
  setTournamentMembers: (m: TournamentParticipant[]) => void; // ✅ added
  setIsLoading: (state: boolean) => void; // ✅ added
}

export default function TournamentTeams({
  tournament,
  tournamentMembers,
  members,
  isLoading,
  isAuthenticated,
  onAddMember,
  onRemoveMember,
  showToast,
  setSelectedTournament,
  setTournamentMembers,
  setIsLoading,
}: TournamentTeamsProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [editingMember, setEditingMember] =
    useState<TournamentParticipant | null>(null);

  // ➕ Add a new member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    await onAddMember(selectedMemberId);
    setSelectedMemberId('');
  };

  // 💾 Save member updates
  const handleSaveProfile = async (
    memberId: string,
    updates: { name?: string; psnId?: string }
  ) => {
    try {
      const memberRef = doc(db, 'tournament_members', memberId);
      await updateDoc(memberRef, updates);
      showToast('Member updated successfully', 'success');
    } catch (error) {
      console.error('❌ Error updating member:', error);
      showToast('Failed to update member', 'error');
    }
  };

  // 🏃 Move member to new group + refresh + confirm
  const handleMoveGroup = async (
    member: TournamentParticipant,
    targetGroupId: string
  ) => {
    if (!member?.id || !tournament?.id) return;

    setIsLoading(true);
    try {
      // 1️⃣ Update Firestore
      const memberRef = doc(db, 'tournament_members', member.id);
      await updateDoc(memberRef, { groupId: targetGroupId });

      const memberName = member.name.trim().toLowerCase();

      // 2️⃣ Fetch latest tournament
      const updatedTournament = await getTournamentById(tournament.id);
      if (!updatedTournament?.groups) return;

      // 3️⃣ Remove from old group & re-add to new
      const updatedGroups = updatedTournament.groups.map((group) => {
        const filteredStandings = group.standings.filter(
          (s) => s.teamName.trim().toLowerCase() !== memberName
        );
        const filteredMatches = group.matches.filter(
          (m) =>
            m.homeTeam.trim().toLowerCase() !== memberName &&
            m.awayTeam.trim().toLowerCase() !== memberName
        );
        const filteredMembers = group.members.filter(
          (m) => m.name.trim().toLowerCase() !== memberName
        );

        if (group.id === targetGroupId) {
          const newStanding = {
            teamName: member.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            position: filteredStandings.length + 1,
          };
          return {
            ...group,
            members: [...filteredMembers, member],
            standings: [...filteredStandings, newStanding],
          };
        }

        return {
          ...group,
          members: filteredMembers,
          standings: filteredStandings,
          matches: filteredMatches,
        };
      });

      // 4️⃣ Update tournament in Firestore
      await updateTournament(tournament.id, { groups: updatedGroups });

      // 5️⃣ Generate missing fixtures for moved player
      await generateMissingGroupFixtures(
        tournament.id,
        targetGroupId,
        member.name
      );

      // 6️⃣ Refresh local tournament + member state
      const [freshTournament, freshMembers] = await Promise.all([
        getTournamentById(tournament.id),
        getTournamentMembers(tournament.id),
      ]);

      if (freshTournament) {
        // Force re-render by spreading the objects
        setSelectedTournament({ ...freshTournament });
        setTournamentMembers([...freshMembers]);
      }


      // 7️⃣ Show success message
      showToast(
        `${member.name} successfully moved to ${targetGroupId.replace(
          'group_',
          'Group '
        )}`,
        'success'
      );
      console.log(`✅ ${member.name} moved to ${targetGroupId}`);
    } catch (error) {
      console.error('❌ Error moving member:', error);
      showToast('Failed to move member', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg sm:text-xl font-bold text-gray-800">
          Tournament Teams ({tournamentMembers.length})
        </h4>
      </div>

      {/* Add Member Form */}
      {isAuthenticated &&
        ['setup', 'group_stage'].includes(tournament.status) &&
        tournament.currentTeams < tournament.maxTeams && (
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h5 className="font-bold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">
              Add New Member
            </h5>

            <form
              onSubmit={handleAddMember}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
            >
              <div>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors duration-200 text-black text-sm sm:text-base"
                  disabled={isLoading}
                >
                  <option value="">Select a member...</option>
                  {members
                    .filter(
                      (member) =>
                        !tournamentMembers.some(
                          (tm) => tm.name === member.name
                        )
                    )
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.psnId && `(${member.psnId})`}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading || !selectedMemberId}
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 text-sm sm:text-base"
              >
                Add Member
              </button>
            </form>
          </div>
        )}

      {/* Members List */}
      {tournamentMembers.length > 0 ? (
        <>
          <div className="space-y-3 sm:space-y-4">
            {tournamentMembers.map((team, index) => (
              <div
                key={team.id}
                className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h6 className="font-bold text-gray-900 text-base sm:text-lg">
                        {team.name}
                      </h6>
                      {team.groupId && (
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {team.groupId.replace('group_', 'Group ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  {isAuthenticated && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMember(team)}
                        disabled={isLoading}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-all duration-200 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      {tournament.status === 'setup' && (
                        <button
                          onClick={() => onRemoveMember(team)}
                          disabled={isLoading}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-all duration-200 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Side Panel */}
          {editingMember && (
            <MemberSidePanel
              open={!!editingMember}
              onClose={() => setEditingMember(null)}
              member={editingMember}
              tournament={tournament}
              onSaveProfile={handleSaveProfile}
              onMoveGroup={handleMoveGroup}
              onRemoveMember={onRemoveMember}
              isLoading={isLoading}
            />
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Teams Added
          </h3>
          <p className="text-gray-500">
            Add teams to get started with your tournament.
          </p>
        </div>
      )}
    </div>
  );
}
