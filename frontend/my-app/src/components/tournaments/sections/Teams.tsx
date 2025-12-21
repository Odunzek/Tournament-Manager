/**
 * Tournament Teams Section
 *
 * Displays all teams/participants in the tournament.
 * Shows team assignments to groups (if applicable).
 *
 * @component
 * @features
 * - Team list with group assignments
 * - Search functionality
 * - Group filtering
 * - Team statistics
 * - Cyber-themed UI
 */

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Trophy, Target, UserPlus, X, Loader2 } from 'lucide-react';
import { Tournament, TournamentParticipant, addMemberToTournament, reassignMemberToGroup } from '@/lib/tournamentUtils';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/lib/AuthContext';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

interface TeamsProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
}

export default function Teams({ tournament, tournamentMembers }: TeamsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const { players, loading: playersLoading } = usePlayers();
  const { isAuthenticated } = useAuth();

  // Filter teams by search
  const filteredTeams = tournamentMembers.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter available players (not already in tournament)
  const availablePlayers = players.filter(
    (player) => !tournamentMembers.some((member) => member.name === player.name)
  );

  // Toggle player selection
  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedPlayerIds.length === availablePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(availablePlayers.map((p) => p.id));
    }
  };

  // Find smallest group for auto-assignment
  const getSmallestGroupId = (): string | null => {
    if (!tournament.groups || tournament.groups.length === 0) return null;

    const groupSizes = tournament.groups.map((group) => ({
      id: group.id,
      size: group.members.length,
    }));

    const smallest = groupSizes.reduce((min, curr) =>
      curr.size < min.size ? curr : min
    );

    return smallest.id;
  };

  const handleAddMembers = async () => {
    if (selectedPlayerIds.length === 0) {
      setAddError('Please select at least one player');
      return;
    }

    try {
      setIsAdding(true);
      setAddError('');

      // Determine group assignment
      const groupId = tournament.status === 'group_stage' ? getSmallestGroupId() : null;

      // Add all selected players
      for (const playerId of selectedPlayerIds) {
        const selectedPlayer = players.find((p) => p.id === playerId);
        if (selectedPlayer) {
          await addMemberToTournament(tournament.id!, {
            name: selectedPlayer.name,
            psnId: selectedPlayer.psnId && selectedPlayer.psnId !== 'player' ? selectedPlayer.psnId : undefined,
            tournamentId: tournament.id!,
            groupId: groupId || undefined,
          });
        }
      }

      // Reset form and close modal
      setSelectedPlayerIds([]);
      setIsAddModalOpen(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to add members');
    } finally {
      setIsAdding(false);
    }
  };

  // Group teams by group
  const teamsByGroup = filteredTeams.reduce((acc, team) => {
    const groupName = team.groupName || 'Unassigned';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(team);
    return acc;
  }, {} as Record<string, TournamentParticipant[]>);

  const groupNames = Object.keys(teamsByGroup).sort();

  // Handle group reassignment
  const handleReassignToGroup = async (memberId: string, newGroupId: string) => {
    try {
      await reassignMemberToGroup(memberId, newGroupId);
    } catch (error) {
      console.error('Error reassigning member:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Tournament Teams</h2>
          <p className="text-gray-400">
            {tournamentMembers.length} / {tournament.maxTeams} teams
          </p>
        </div>

        {/* Add Member Button - Admin Only */}
        {isAuthenticated && (tournament.status === 'setup' || tournament.status === 'group_stage') && tournamentMembers.length < tournament.maxTeams && (
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Players
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Teams by Group */}
      {groupNames.length > 0 ? (
        <div className="space-y-6">
          {groupNames.map((groupName, index) => (
            <motion.div
              key={groupName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="glass">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-tech bg-gradient-cyber flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{groupName}</h3>
                    <p className="text-sm text-gray-400">{teamsByGroup[groupName].length} teams</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teamsByGroup[groupName].map((team, teamIndex) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + teamIndex * 0.05 }}
                      className="bg-dark-100/50 backdrop-blur-sm rounded-tech p-4 border border-white/10 hover:border-cyber-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-500/20 to-electric-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-cyber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{team.name}</p>
                          {team.psnId && (
                            <p className="text-xs text-gray-400 truncate">PSN: {team.psnId}</p>
                          )}
                        </div>
                      </div>

                      {/* Admin: Change Group Dropdown */}
                      {isAuthenticated && tournament.groups && tournament.groups.length > 0 && team.id && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <select
                            value={team.groupId || ''}
                            onChange={(e) => handleReassignToGroup(team.id!, e.target.value)}
                            className="
                              w-full px-2 py-1 text-xs
                              bg-gray-800/50 border border-white/10
                              focus:border-cyber-500/50
                              rounded
                              text-gray-300
                              focus:outline-none
                              transition-colors
                            "
                          >
                            {tournament.groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                Move to {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <Users className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">
            {searchQuery ? 'No teams found' : 'No teams yet'}
          </h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Teams will appear here once added to the tournament'}
          </p>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-dark-200 border-2 border-cyber-500/30 rounded-tech-lg w-full max-w-md p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cyber-400" />
                  Add Players to Tournament
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-300">
                      Select Players <span className="text-red-400">*</span>
                    </label>
                    {availablePlayers.length > 0 && (
                      <button
                        onClick={toggleSelectAll}
                        className="text-xs text-cyber-400 hover:text-cyber-300 transition-colors"
                      >
                        {selectedPlayerIds.length === availablePlayers.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {playersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-cyber-400 animate-spin" />
                    </div>
                  ) : availablePlayers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>All players have been added to this tournament</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2 bg-gray-900/30 rounded-lg p-3 border border-white/10">
                      {availablePlayers.map((player) => (
                        <label
                          key={player.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${selectedPlayerIds.includes(player.id)
                              ? 'bg-cyber-500/20 border-2 border-cyber-500/50'
                              : 'bg-gray-800/50 border-2 border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlayerIds.includes(player.id)}
                            onChange={() => togglePlayerSelection(player.id)}
                            className="w-5 h-5 rounded border-2 border-white/20 bg-gray-900/50 text-cyber-500 focus:ring-2 focus:ring-cyber-500/50 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-xs text-gray-400">
                              {player.psnId && player.psnId !== 'player' && `@${player.psnId} • `}
                              {player.achievements.totalTitles} {player.achievements.totalTitles === 1 ? 'title' : 'titles'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPlayerIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-cyber-500/10 border border-cyber-500/30 rounded-lg p-3 text-sm text-cyber-400"
                  >
                    {selectedPlayerIds.length} player{selectedPlayerIds.length !== 1 && 's'} selected
                    {tournament.status === 'group_stage' && ' • Will be assigned to smallest group'}
                  </motion.div>
                )}

                {addError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                  >
                    {addError}
                  </motion.p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddMembers}
                    disabled={isAdding || selectedPlayerIds.length === 0 || availablePlayers.length === 0}
                    className="flex-1"
                    leftIcon={isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  >
                    {isAdding ? 'Adding...' : `Add ${selectedPlayerIds.length || ''} Player${selectedPlayerIds.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Stats Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass">
          <div className="text-center">
            <Users className="w-6 h-6 text-cyber-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Total Teams</p>
            <p className="text-2xl font-bold text-white">{tournamentMembers.length}</p>
          </div>
        </Card>

        <Card variant="glass">
          <div className="text-center">
            <Target className="w-6 h-6 text-electric-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Max Teams</p>
            <p className="text-2xl font-bold text-white">{tournament.maxTeams}</p>
          </div>
        </Card>

        <Card variant="glass">
          <div className="text-center">
            <Trophy className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Groups</p>
            <p className="text-2xl font-bold text-white">{tournament.groups?.length || 0}</p>
          </div>
        </Card>

        <Card variant="glass">
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-gradient-cyber flex items-center justify-center">
              <span className="text-xs font-bold text-white">%</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">Filled</p>
            <p className="text-2xl font-bold text-white">
              {Math.round((tournamentMembers.length / tournament.maxTeams) * 100)}%
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
