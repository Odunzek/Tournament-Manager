import React from 'react';
import { Tournament, KnockoutTie } from '../../../lib/tournamentUtils';

interface TournamentKnockoutProps {
  tournament: Tournament;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordKnockoutMatch: (tieId: string, leg: 'first' | 'second', homeTeam: string, awayTeam: string) => void;
}

export default function TournamentKnockout({
  tournament,
  isLoading,
  isAuthenticated,
  onRecordKnockoutMatch
}: TournamentKnockoutProps) {

  if (!tournament.knockoutBracket || tournament.knockoutBracket.length === 0) {
    return (
      <div className="text-center py-10 sm:py-12">
        <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🥊</div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">No Knockout Stage</h3>
        <p className="text-gray-500 text-sm sm:text-base">Knockout bracket will appear here once generated from the Overview tab.</p>
      </div>
    );
  }

  // Group ties by round
  const tiesByRound = tournament.knockoutBracket.reduce((acc, tie) => {
    const round = tie.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(tie);
    return acc;
  }, {} as Record<string, KnockoutTie[]>);

  // Order rounds logically
  const roundOrder = ['round_16', 'quarter_final', 'semi_final', 'final'];
  const availableRounds = roundOrder.filter(round => tiesByRound[round]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h4 className="text-lg sm:text-xl font-bold text-gray-800">Knockout Stage</h4>
        <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium">
          {tournament.knockoutBracket.filter(tie => tie.completed).length} / {tournament.knockoutBracket.length} ties completed
        </div>
      </div>

      {/* Render each round separately */}
      {availableRounds.map((roundKey) => (
        <RoundSection
          key={roundKey}
          roundKey={roundKey}
          ties={tiesByRound[roundKey]}
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
          onRecordKnockoutMatch={onRecordKnockoutMatch}
        />
      ))}

    </div>
  );
}

// Component for each round section
function RoundSection({
  roundKey,
  ties,
  isLoading,
  isAuthenticated,
  onRecordKnockoutMatch
}: {
  roundKey: string;
  ties: KnockoutTie[];
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordKnockoutMatch: (tieId: string, leg: 'first' | 'second', homeTeam: string, awayTeam: string) => void;
}) {
  
  const roundNames = {
    'round_16': 'Round of 16',
    'quarter_final': 'Quarter Finals',
    'semi_final': 'Semi Finals',
    'final': 'Final'
  };

  // Static vibrant colors with light backgrounds
  const roundColors = {
    'round_16': {
      primary: '#00D9FF',
      bg: 'bg-white',
      border: 'border-cyan-300',
      header: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      accent: 'text-cyan-600',
      button: 'bg-cyan-500 hover:bg-cyan-600'
    },
    'quarter_final': {
      primary: '#FF3366',
      bg: 'bg-white',
      border: 'border-pink-300', 
      header: 'bg-gradient-to-r from-pink-500 to-red-500',
      accent: 'text-pink-600',
      button: 'bg-pink-500 hover:bg-pink-600'
    },
    'semi_final': {
      primary: '#0066FF',
      bg: 'bg-white',
      border: 'border-blue-300',
      header: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      accent: 'text-blue-600',
      button: 'bg-blue-500 hover:bg-blue-600'
    },
    'final': {
      primary: '#FFD700',
      bg: 'bg-white',
      border: 'border-yellow-300',
      header: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      accent: 'text-yellow-600',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    }
  };

  const colors = roundColors[roundKey as keyof typeof roundColors] || {
    primary: '#6B7280',
    bg: 'bg-white',
    border: 'border-gray-300',
    header: 'bg-gradient-to-r from-gray-500 to-gray-600',
    accent: 'text-gray-600',
    button: 'bg-gray-500 hover:bg-gray-600'
  };

  const completedTies = ties.filter(tie => tie.completed).length;
  const totalTies = ties.length;
  const progressPercentage = totalTies > 0 ? (completedTies / totalTies) * 100 : 0;

  return (
    <div className={`rounded-xl border-2 ${colors.bg} ${colors.border} overflow-hidden shadow-lg`}>
      {/* Round Header */}
      <div className={`${colors.header} text-white px-4 sm:px-6 py-4 sm:py-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h5 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
            {roundNames[roundKey as keyof typeof roundNames] || roundKey.replace('_', ' ')}
          </h5>
          <div className="sm:text-right">
            <div className="text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">
              {completedTies}/{totalTies} completed ({Math.round(progressPercentage)}%)
            </div>
            <div className="w-40 sm:w-48 bg-black/30 rounded-full h-2 sm:h-3">
              <div 
                className="bg-white h-2 sm:h-3 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Ties in this round */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50">
        {ties.map((tie) => (
          <TieCard
            key={tie.id}
            tie={tie}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            onRecordKnockoutMatch={onRecordKnockoutMatch}
            roundColors={colors}
          />
        ))}
      </div>
    </div>
  );
}

// Component for each tie card
function TieCard({
  tie,
  isLoading,
  isAuthenticated,
  onRecordKnockoutMatch,
  roundColors
}: {
  tie: KnockoutTie;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordKnockoutMatch: (tieId: string, leg: 'first' | 'second', homeTeam: string, awayTeam: string) => void;
  roundColors: any;
}) {
  
  return (
    <div className="border-2 rounded-xl overflow-hidden shadow-lg bg-gray-50 border-gray-300">
      {/* Main Match Header */}
      <div className={`${roundColors.header} text-white px-4 sm:px-6 py-3 sm:py-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xl sm:text-2xl font-bold flex items-center gap-3 sm:gap-4">
            <span className="truncate max-w-[40vw] sm:max-w-none">{tie.team1}</span>
            <span className="font-normal text-base sm:text-lg opacity-75">vs</span>
            <span className="truncate max-w-[40vw] sm:max-w-none">{tie.team2}</span>
          </div>
          {tie.completed && tie.winner && (
            <div className="bg-black/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🏆</span>
              <span className="font-bold text-white text-sm sm:text-base truncate">{tie.winner}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 sm:p-6 ${roundColors.header}`}>
        {/* Aggregate Score */}
        {tie.aggregateScore && (
          <div className="text-center mb-3 sm:mb-4">
            <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-3 sm:p-4">
              <div className={`${roundColors.accent} text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 uppercase tracking-wider`}>
                Aggregate Score
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
                <span className={tie.aggregateScore.team1Goals > tie.aggregateScore.team2Goals ? 'text-green-600' : 'text-gray-600'}>
                  {tie.aggregateScore.team1Goals}
                </span>
                <span className="text-gray-400">-</span>
                <span className={tie.aggregateScore.team2Goals > tie.aggregateScore.team1Goals ? 'text-green-600' : 'text-gray-600'}>
                  {tie.aggregateScore.team2Goals}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Two Legs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <LegCard
            leg={tie.firstLeg}
            legName="First Leg"
            tieId={tie.id!}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            onRecordKnockoutMatch={onRecordKnockoutMatch}
            roundColors={roundColors}
            legType="first"
          />

          <LegCard
            leg={tie.secondLeg}
            legName="Second Leg"
            tieId={tie.id!}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            onRecordKnockoutMatch={onRecordKnockoutMatch}
            firstLegPlayed={tie.firstLeg?.played}
            roundColors={roundColors}
            legType="second"
          />
        </div>
      </div>
    </div>
  );
}

// Component for each leg
function LegCard({
  leg,
  legName,
  tieId,
  isLoading,
  isAuthenticated,
  onRecordKnockoutMatch,
  firstLegPlayed = true,
  roundColors,
  legType
}: {
  leg: any;
  legName: string;
  tieId: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordKnockoutMatch: (tieId: string, leg: 'first' | 'second', homeTeam: string, awayTeam: string) => void;
  firstLegPlayed?: boolean;
  roundColors: any;
  legType: 'first' | 'second';
}) {
  
  const canRecord = legName === 'Second Leg' ? firstLegPlayed : true;
  
  const legGradients = {
    first: 'bg-gradient-to-br from-blue-500 to-purple-600',
    second: 'bg-gradient-to-br from-pink-500 to-orange-500'
  };
  const legGradient = legGradients[legType];

  return (
    <div className={`rounded-lg overflow-hidden ${legGradient} shadow-lg`}>
      {/* Leg Header */}
      <div className="bg-gradient-to-r from-black/30 to-black/10 px-3 py-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs sm:text-sm text-white drop-shadow-lg">{legName}</h4>
          {leg?.played && (
            <span className="text-[10px] sm:text-xs bg-black/30 px-2 py-0.5 sm:py-1 rounded-full font-bold text-white">
              ✓ FINAL
            </span>
          )}
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        {/* Teams + Score */}
        <div className="text-center py-2.5 sm:py-3 mb-2.5 sm:mb-3">
          {leg?.played ? (
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-white">
              <span className="font-bold text-xs sm:text-sm drop-shadow-md truncate max-w-[38vw] sm:max-w-none">{leg?.homeTeam}</span>
              <div className="bg-black/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20">
                <span className="text-base sm:text-lg font-bold text-white drop-shadow-lg">
                  {leg?.homeScore} - {leg?.awayScore}
                </span>
              </div>
              <span className="font-bold text-xs sm:text-sm drop-shadow-md truncate max-w-[38vw] sm:max-w-none">{leg?.awayTeam}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-white">
              <span className="font-bold text-xs sm:text-sm drop-shadow-md truncate max-w-[38vw] sm:max-w-none">{leg?.homeTeam}</span>
              <div className="bg-black/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20">
                <span className="text-xs sm:text-sm font-bold text-white drop-shadow-lg">VS</span>
              </div>
              <span className="font-bold text-xs sm:text-sm drop-shadow-md truncate max-w-[38vw] sm:max-w-none">{leg?.awayTeam}</span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        {!leg?.played && (
          <div className="pt-1.5 sm:pt-2">
            {canRecord && isAuthenticated ? (
              <button
                onClick={() => onRecordKnockoutMatch(
                  tieId,
                  leg?.leg,
                  leg?.homeTeam,
                  leg?.awayTeam
                )}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 bg-black/30 hover:bg-black/40 text-white text-xs sm:text-sm border border-white/20 drop-shadow-md"
              >
                {isLoading ? 'Recording...' : 'Record Result'}
              </button>
            ) : !firstLegPlayed ? (
              <div className="text-center text-white text-xs sm:text-sm py-2 bg-black/20 rounded-lg border border-white/10 drop-shadow-md">
                Complete first leg first
              </div>
            ) : (
              <div className="text-center text-white text-xs sm:text-sm py-2 bg-black/30 rounded-lg font-semibold border border-white/20 drop-shadow-md">
                ⏳ Awaiting result
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
