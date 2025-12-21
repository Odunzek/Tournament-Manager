import React from 'react';
import { Tournament } from '../../../lib/tournamentUtils';
import { formatDate } from '../TournamentManager';

interface TournamentOverviewProps {
  tournament: Tournament;
  isLoading: boolean;
  onGenerateGroups: () => Promise<void>;
  onGenerateKnockout: () => Promise<void>;
  areGroupMatchesComplete: (tournament: Tournament) => boolean;
}

export default function TournamentOverview({
  tournament,
  isLoading,
  onGenerateGroups,
  onGenerateKnockout,
  areGroupMatchesComplete
}: TournamentOverviewProps) {

  const totalMatchesPlayed = 
    (tournament.groups?.reduce((total, group) => 
      total + group.matches.filter(m => m.played).length, 0) || 0) +
    (tournament.knockoutBracket?.reduce((total, tie) => 
      total + (tie.firstLeg?.played ? 1 : 0) + (tie.secondLeg?.played ? 1 : 0), 0) || 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Tournament Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="text-blue-600 text-xs sm:text-sm font-medium">Total Teams</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-800">
            {tournament.currentTeams}/{tournament.maxTeams}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="text-green-600 text-xs sm:text-sm font-medium">Groups</div>
          <div className="text-xl sm:text-2xl font-bold text-green-800">
            {tournament.groups?.length || 0}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="text-orange-600 text-xs sm:text-sm font-medium">Knockout Ties</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-800">
            {tournament.knockoutBracket?.length || 0}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <div className="text-purple-600 text-xs sm:text-sm font-medium">Matches Played</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-800">
            {totalMatchesPlayed}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-600">Tournament Progress</span>
          <span className="text-xs sm:text-sm text-gray-500">
            {Math.round(Math.min(tournament.currentTeams / tournament.maxTeams, 1) * 100)}% Teams Added
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
          <div
            className="bg-blue-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(tournament.currentTeams / tournament.maxTeams, 1) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
        <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-3">Tournament Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">Current Phase:</span>
            <span className="font-semibold text-gray-800 text-sm sm:text-base capitalize">
              {tournament.status.replace('_', ' ')}
            </span>
          </div>
          {tournament.startDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Start Date:</span>
              <span className="font-semibold text-gray-800 text-sm sm:text-base">
                {formatDate(tournament.startDate)}
              </span>
            </div>
          )}
          {tournament.endDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">End Date:</span>
              <span className="font-semibold text-gray-800 text-sm sm:text-base">
                {formatDate(tournament.endDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 sm:space-y-4">
        <h4 className="text-base sm:text-lg font-bold text-gray-800">Available Actions</h4>

        {/* Setup Phase Actions */}
        {tournament.status === 'setup' && (
          <div className="space-y-3 sm:space-y-4">
            {tournament.currentTeams >= 8 ? (
              <button
                onClick={onGenerateGroups}
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-5 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🎲</span>
                  <span>Generate Groups ({tournament.currentTeams} teams)</span>
                </span>
              </button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <p className="text-yellow-800 font-medium text-sm sm:text-base">Need more teams</p>
                    <p className="text-yellow-700 text-xs sm:text-sm">
                      Add at least {Math.max(0, 8 - tournament.currentTeams)} more teams to generate groups
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Group Stage Actions */}
        {tournament.status === 'group_stage' && (
          <div className="space-y-3 sm:space-y-4">
            {areGroupMatchesComplete(tournament) ? (
              <button
                onClick={onGenerateKnockout}
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-5 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🏅</span>
                  <span>Generate Knockout Stage</span>
                </span>
              </button>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-blue-600">ℹ️</span>
                  <div>
                    <p className="text-blue-800 font-medium text-sm sm:text-base">Group stage in progress</p>
                    <p className="text-blue-700 text-xs sm:text-sm">
                      Complete all group matches to proceed to knockout stage
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Knockout Stage Status */}
        {tournament.status === 'knockout' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start sm:items-center gap-2">
              <span className="text-orange-600">🥊</span>
              <div>
                <p className="text-orange-800 font-medium text-sm sm:text-base">Knockout stage active</p>
                <p className="text-orange-700 text-xs sm:text-sm">
                  Record match results to progress through the rounds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completed Status */}
        {tournament.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start sm:items-center gap-2">
              <span className="text-green-600">🏆</span>
              <div>
                <p className="text-green-800 font-medium text-sm sm:text-base">Tournament completed!</p>
                <p className="text-green-700 text-xs sm:text-sm">
                  Check the Results tab to see the final standings
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
