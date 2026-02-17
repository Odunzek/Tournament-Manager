"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PageHeader from '@/components/layouts/PageHeader';
import { migrateGroupMembersToPlayers } from '@/lib/migratePlayersToNewSystem';

export default function MigratePlayersPage() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    migrated: number;
    skipped: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setError(null);
    setResult(null);

    try {
      const migrationResult = await migrateGroupMembersToPlayers();
      setResult(migrationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        <PageHeader
          title="MIGRATE PLAYERS"
          subtitle="Sync group members to new player system"
          gradient="cyber"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Info Card */}
          <div className="bg-linear-to-br from-blue-500/10 to-purple-600/10 border-2 border-blue-500/30 rounded-tech-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-400" />
              About This Migration
            </h2>
            <div className="text-gray-300 space-y-3 text-sm">
              <p>
                This tool will sync your existing <span className="font-mono text-blue-400">group_members</span> collection
                to the new <span className="font-mono text-blue-400">players</span> collection with achievements tracking.
              </p>
              <p className="font-semibold text-yellow-400">What happens:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Reads all members from <span className="font-mono">group_members</span></li>
                <li>Calculates League & Tournament wins from <span className="font-mono">totalWins</span></li>
                <li>Determines Hall of Fame tier (Legend/Champion/Veteran)</li>
                <li>Creates player records in <span className="font-mono">players</span> collection</li>
                <li>Preserves member IDs for consistency</li>
              </ul>
              <p className="text-gray-400 italic">
                This is safe to run multiple times - it will update existing records.
              </p>
            </div>
          </div>

          {/* Migration Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="
                px-8 py-4
                bg-linear-to-r from-cyber-500 to-electric-500
                hover:from-cyber-600 hover:to-electric-600
                disabled:from-gray-600 disabled:to-gray-700
                text-white font-bold text-lg
                rounded-tech-lg
                transition-all duration-300
                hover:shadow-glow
                disabled:cursor-not-allowed
                disabled:opacity-50
                flex items-center justify-center gap-3 mx-auto
              "
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Migrating Players...
                </>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6" />
                  Start Migration
                </>
              )}
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-linear-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500/30 rounded-tech-lg p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                Migration Complete!
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{result.migrated}</div>
                  <div className="text-sm text-gray-400">Migrated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{result.skipped}</div>
                  <div className="text-sm text-gray-400">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{result.total}</div>
                  <div className="text-sm text-gray-400">Total</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-green-500/30 text-center">
                <p className="text-green-300 font-semibold mb-2">✅ Your players are now synced!</p>
                <p className="text-gray-400 text-sm">
                  Go to the <a href="/players" className="text-cyber-400 hover:text-cyber-300 underline">Players page</a> to see them.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Card */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-linear-to-br from-red-500/10 to-pink-600/10 border-2 border-red-500/30 rounded-tech-lg p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-400" />
                Migration Failed
              </h3>
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {/* How Hall of Fame Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 bg-linear-to-br from-yellow-500/10 to-amber-600/10 border-2 border-yellow-500/30 rounded-tech-lg p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">👑</span>
              How Hall of Fame Auto-Populates
            </h2>
            <div className="text-gray-300 space-y-3 text-sm">
              <p>
                The Hall of Fame <span className="font-bold text-yellow-400">automatically updates</span> based on player achievements:
              </p>

              <div className="space-y-2 ml-4">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 font-bold">👑</span>
                  <div>
                    <span className="font-bold text-yellow-400">LEGEND</span> - 10+ total titles
                    <div className="text-xs text-gray-400">Appears in Legends tier section</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gray-300 font-bold">⭐</span>
                  <div>
                    <span className="font-bold text-gray-300">CHAMPION</span> - 5-9 total titles
                    <div className="text-xs text-gray-400">Appears in Champions tier section</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-orange-400 font-bold">🎖️</span>
                  <div>
                    <span className="font-bold text-orange-400">VETERAN</span> - 3-4 total titles
                    <div className="text-xs text-gray-400">Appears in Veterans tier section</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-yellow-500/30">
                <p className="font-semibold text-yellow-400 mb-2">Automatic Updates:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                  <li>When a player wins a league → <span className="font-mono text-cyan-400">leagueWins++</span></li>
                  <li>When a player wins a tournament → <span className="font-mono text-cyan-400">tournamentWins++</span></li>
                  <li>Total titles recalculated → Tier auto-updates</li>
                  <li>Reach 3 titles → Inducted to Hall of Fame automatically</li>
                  <li>Reach 5 titles → Promoted to Champion tier</li>
                  <li>Reach 10 titles → Promoted to Legend tier</li>
                </ul>
              </div>

              <p className="pt-4 text-cyan-400 italic text-xs">
                ✨ The system tracks everything automatically - players advance through tiers as they win!
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </MainLayout>
  );
}
