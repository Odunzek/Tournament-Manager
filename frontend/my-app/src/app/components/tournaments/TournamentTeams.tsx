import React, { useState } from 'react';
import { Tournament, TournamentParticipant } from '../../../lib/tournamentUtils';
import { GroupMember } from '../../../lib/membershipUtils';

interface TournamentTeamsProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
  members: GroupMember[];
  isLoading: boolean;
  isAuthenticated: boolean;
  onAddMember: (selectedMemberId: string) => Promise<void>;
  onRemoveMember: (member: TournamentParticipant) => Promise<void>;
}

export default function TournamentTeams({
  tournament,
  tournamentMembers,
  members,
  isLoading,
  isAuthenticated,
  onAddMember,
  onRemoveMember
}: TournamentTeamsProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    await onAddMember(selectedMemberId);
    setSelectedMemberId('');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg sm:text-xl font-bold text-gray-800">
          Tournament Teams ({tournamentMembers.length})
        </h4>
      </div>

      {/* Add Team Form (only in setup phase) */}
      {tournament.status === 'setup' && tournament.currentTeams < tournament.maxTeams && (
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h5 className="font-bold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">Add New Team</h5>
          <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors duration-200 text-black text-sm sm:text-base"
                disabled={isLoading}
              >
                <option value="">Select a member...</option>
                {members
                  .filter(member => !tournamentMembers.some(tm => tm.name === member.name))
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.psnId ? `(${member.psnId})` : ''}
                    </option>
                  ))
                }
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

      {/* Teams List */}
      {tournamentMembers.length > 0 ? (
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
                    <h6 className="font-bold text-gray-900 text-base sm:text-lg">{team.name}</h6>
                    {team.country && (
                      <p className="text-sm text-gray-600">{team.country}</p>
                    )}
                    {team.groupId && (
                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {team.groupId.replace('group_', 'Group ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button - keep behavior; always visible on mobile, hover-reveal on md+ */}
                {tournament.status === 'setup' && isAuthenticated && (
                  <button
                    onClick={() => onRemoveMember(team)}
                    disabled={isLoading}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 self-start sm:self-auto"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Teams Added</h3>
          <p className="text-gray-500">Add teams to get started with your tournament.</p>
        </div>
      )}
    </div>
  );
}
