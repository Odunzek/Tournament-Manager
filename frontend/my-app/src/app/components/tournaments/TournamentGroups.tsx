import React from 'react';
import { Tournament, TournamentGroup, GroupMatch } from '../../../lib/tournamentUtils';

interface TournamentGroupsProps {
  tournament: Tournament;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordMatch: (groupId: string, homeTeam: string, awayTeam: string) => void;
}

export default function TournamentGroups({
  tournament,
  isLoading,
  isAuthenticated,
  onRecordMatch
}: TournamentGroupsProps) {

  if (!tournament.groups || tournament.groups.length === 0) {
    return (
      <div className="text-center py-10 sm:py-12">
        <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🏆</div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">No Groups Generated</h3>
        <p className="text-gray-500 text-sm sm:text-base">Groups will appear here once generated from the Overview tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h4 className="text-lg sm:text-xl font-bold text-gray-800">
          Group Stage ({tournament.groups.length} Groups)
        </h4>
        <div className="text-xs sm:text-sm text-gray-600">
          {tournament.groups.reduce((total, group) => 
            total + group.matches.filter(m => m.played).length, 0
          )} / {tournament.groups.reduce((total, group) => 
            total + group.matches.length, 0
          )} matches played
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {tournament.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            onRecordMatch={onRecordMatch}
          />
        ))}
      </div>
    </div>
  );
}

// Separate component for each group
function GroupCard({
  group,
  isLoading,
  isAuthenticated,
  onRecordMatch
}: {
  group: TournamentGroup;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordMatch: (groupId: string, homeTeam: string, awayTeam: string) => void;
}) {
  
  // Calculate group completion percentage
  const playedMatches = group.matches.filter(m => m.played).length;
  const totalMatches = group.matches.length;
  const completionPercentage = totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0;
  
  // Sort standings for display
  const sortedStandings = [...group.standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
      {/* Group Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <h5 className="text-base sm:text-lg font-bold text-gray-800">{group.name}</h5>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-blue-600 font-medium">
            {playedMatches}/{totalMatches} matches
          </div>
          <div className="w-20 sm:w-24 bg-blue-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Group Standings */}
      <div className="space-y-2 mb-5 sm:mb-6">
        <h6 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Standings</h6>

        {/* horizontal scroll safety on very narrow screens */}
        <div className="-mx-2 sm:mx-0 overflow-x-auto">
          <div className="min-w-[320px] sm:min-w-0 px-2 sm:px-0 space-y-2">
            {sortedStandings.map((standing, index) => (
              <div key={standing.teamName} className="flex items-center justify-between bg-white rounded-lg p-2.5 sm:p-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index < 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{standing.teamName}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-sm">
                  <span className="font-bold text-gray-900 min-w-[28px] sm:min-w-[30px] text-right">{standing.points}pts</span>
                  <span className="text-gray-600">{standing.played}P</span>
                  <span className="text-green-600">{standing.won}W</span>
                  <span className="text-yellow-600">{standing.drawn}D</span>
                  <span className="text-red-600">{standing.lost}L</span>
                  <span className="text-gray-600">{standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Group Matches */}
      <div className="space-y-2">
        <h6 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Matches</h6>
        {group.matches.map((match, matchIndex) => (
          <MatchRow
            key={`${match.homeTeam}-${match.awayTeam}-${matchIndex}`}
            match={match}
            groupId={group.id}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            onRecordMatch={onRecordMatch}
          />
        ))}
      </div>
    </div>
  );
}

// Separate component for each match row
function MatchRow({
  match,
  groupId,
  isLoading,
  isAuthenticated,
  onRecordMatch
}: {
  match: GroupMatch;
  groupId: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordMatch: (groupId: string, homeTeam: string, awayTeam: string) => void;
}) {
  const played = match.played;

  // Abbreviate to first 3 letters (uppercase). Remove spaces before slicing.
  const abbr = (s: string) => (s || '').replace(/\s+/g, '').slice(0, 3).toUpperCase();
  const homeAbbr = abbr(match.homeTeam);
  const awayAbbr = abbr(match.awayTeam);

  return (
    <div
      className={`rounded-xl border transition-colors duration-200 p-3 sm:p-4
        ${played ? 'bg-white border-emerald-200' : 'bg-white border-amber-200'}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Home Team (abbrev) */}
        <div className="flex-1 min-w-0 text-right">
          <div
            className="truncate font-semibold text-gray-900 text-sm sm:text-base"
            title={match.homeTeam}
          >
            {homeAbbr}
          </div>
          {!played && (
            <div className="hidden sm:block text-[11px] text-gray-400">HOME</div>
          )}
        </div>

        {/* Score / Status pill */}
        <div
          className={[
            'flex items-center justify-center rounded-lg border px-3 sm:px-4 py-1.5 sm:py-2',
            'min-w-[72px] sm:min-w-[92px]',
            played
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          ].join(' ')}
        >
          {played ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-2xl font-extrabold text-emerald-700 leading-none">
                {match.homeScore}
              </span>
              <span className="text-gray-400 font-bold">-</span>
              <span className="text-lg sm:text-2xl font-extrabold text-emerald-700 leading-none">
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-[12px] sm:text-sm font-medium text-amber-700">
              Not&nbsp;played
            </span>
          )}
        </div>

        {/* Away Team (abbrev) */}
        <div className="flex-1 min-w-0 text-left">
          <div
            className="truncate font-semibold text-gray-900 text-sm sm:text-base"
            title={match.awayTeam}
          >
            {awayAbbr}
          </div>
          {!played && (
            <div className="hidden sm:block text-[11px] text-gray-400">AWAY</div>
          )}
        </div>

        {/* Action / Final chip */}
        <div className="ml-1 sm:ml-2">
          {played ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] sm:text-xs font-semibold px-2 py-1">
              ✓&nbsp;
            </span>
          ) : (
            isAuthenticated && (
              <button
                onClick={() =>
                  onRecordMatch(groupId, match.homeTeam, match.awayTeam)
                }
                disabled={isLoading}
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Record
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
