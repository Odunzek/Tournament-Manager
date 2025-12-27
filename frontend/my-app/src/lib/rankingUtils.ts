// ✅ rankingUtils.ts — cleaned and corrected

import {
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { getGroupMembers } from "./membershipUtils";
import { getPlayers } from "./playerUtils";

// TYPES
export type RankingEntry = {
  memberId: string;
  name: string;
  rank: number;
  coolOff?: string;
  wildCard?: string;
  updatedAt?: any;
};

// COLLECTION REFERENCES
const rankingsCol = collection(db, "rankings");
const rulesDocRef = doc(db, "rules", "globalRules");

// FETCH ALL RANKINGS
export async function getAllRankings(): Promise<RankingEntry[]> {
  const q = query(rankingsCol, orderBy("rank", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => doc.data() as RankingEntry);
}

// LIVE SUBSCRIPTION
export function subscribeToRankings(
  onChange: (rows: RankingEntry[]) => void
): () => void {
  const q = query(rankingsCol, orderBy("rank", "asc"));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => d.data() as RankingEntry);
    onChange(rows);
  });
}

// ENSURE RANKINGS FOR ALL MEMBERS (Legacy - uses group_members)
export async function ensureRankingsForAllMembers(): Promise<RankingEntry[]> {
  const members = await getGroupMembers();
  const existing = await getAllRankings();

  const existingIds = new Set(existing.map((r) => r.memberId));
  const currentMaxRank = existing.length
    ? Math.max(...existing.map((r) => r.rank))
    : 0;
  let nextRank = currentMaxRank + 1;

  const batch = writeBatch(db);
  const newEntries: RankingEntry[] = [];

  for (const m of members) {
    if (!existingIds.has(m.id)) {
      const entry: RankingEntry = {
        memberId: m.id,
        name: m.name,
        rank: nextRank++,
        coolOff: "",
        wildCard: "",
        updatedAt: serverTimestamp(),
      };
      batch.set(doc(rankingsCol, m.id), entry);
      newEntries.push(entry);
    }
  }

  if (newEntries.length > 0) {
    await batch.commit();
  }

  return [...existing, ...newEntries].sort((a, b) => a.rank - b.rank);
}

// ENSURE RANKINGS FOR ALL PLAYERS (New - uses players collection)
export async function ensureRankingsForAllPlayers(): Promise<RankingEntry[]> {
  const players = await getPlayers();
  const existing = await getAllRankings();

  // Create a set of valid player IDs
  const validPlayerIds = new Set(players.map((p) => p.id).filter(Boolean));
  const existingIds = new Set(existing.map((r) => r.memberId));

  const batch = writeBatch(db);
  let cleanupCount = 0;
  let addCount = 0;

  // 1. CLEANUP: Remove rankings for players that no longer exist
  for (const ranking of existing) {
    if (!validPlayerIds.has(ranking.memberId)) {
      batch.delete(doc(rankingsCol, ranking.memberId));
      cleanupCount++;
    }
  }

  // 2. ADD: Add missing players to rankings
  const currentMaxRank = existing.length
    ? Math.max(...existing.map((r) => r.rank))
    : 0;
  let nextRank = currentMaxRank + 1;

  const newEntries: RankingEntry[] = [];

  for (const player of players) {
    if (player.id && !existingIds.has(player.id)) {
      const entry: RankingEntry = {
        memberId: player.id,
        name: player.name,
        rank: nextRank++,
        coolOff: "",
        wildCard: "",
        updatedAt: serverTimestamp(),
      };
      batch.set(doc(rankingsCol, player.id), entry);
      newEntries.push(entry);
      addCount++;
    }
  }

  // Commit all changes
  if (cleanupCount > 0 || addCount > 0) {
    await batch.commit();
    if (cleanupCount > 0) {
      console.log(`🧹 Removed ${cleanupCount} orphaned rankings`);
    }
    if (addCount > 0) {
      console.log(`✅ Added ${addCount} players to P4P rankings`);
    }
  }

  // Return cleaned up rankings
  const validRankings = existing.filter((r) => validPlayerIds.has(r.memberId));
  const allRankings = [...validRankings, ...newEntries].sort((a, b) => a.rank - b.rank);

  // 3. RENUMBER: Fix gaps in ranking numbers (always check, not just after cleanup)
  const renumberBatch = writeBatch(db);
  let hasGaps = false;

  allRankings.forEach((ranking, index) => {
    const correctRank = index + 1;
    if (ranking.rank !== correctRank) {
      hasGaps = true;
      renumberBatch.update(doc(rankingsCol, ranking.memberId), {
        rank: correctRank,
        updatedAt: serverTimestamp(),
      });
      ranking.rank = correctRank; // Update in-memory
    }
  });

  if (hasGaps) {
    await renumberBatch.commit();
    console.log(`🔢 Renumbered rankings to fix gaps (fixed ${allRankings.length} ranks)`);
  }

  return allRankings;
}

// UPDATE SINGLE ENTRY FIELDS
export async function updateRankingFields(
  memberId: string,
  updates: Partial<Pick<RankingEntry, "coolOff" | "wildCard" | "name">>
) {
  const ref = doc(rankingsCol, memberId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

// SAVE NEW ORDER (DRAG/DROP)
export async function saveRankingOrder(newOrder: string[]) {
  const batch = writeBatch(db);
  newOrder.forEach((memberId, idx) => {
    const rank = idx + 1;
    batch.update(doc(rankingsCol, memberId), {
      rank,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

// MOVE UP / DOWN HELPERS
export async function moveUp(currentOrder: RankingEntry[], memberId: string) {
  const idx = currentOrder.findIndex((r) => r.memberId === memberId);
  if (idx <= 0) return;
  const swapped = [...currentOrder];
  [swapped[idx - 1], swapped[idx]] = [swapped[idx], swapped[idx - 1]];
  await saveRankingOrder(swapped.map((r) => r.memberId));
}

export async function moveDown(currentOrder: RankingEntry[], memberId: string) {
  const idx = currentOrder.findIndex((r) => r.memberId === memberId);
  if (idx === -1 || idx >= currentOrder.length - 1) return;
  const swapped = [...currentOrder];
  [swapped[idx], swapped[idx + 1]] = [swapped[idx + 1], swapped[idx]];
  await saveRankingOrder(swapped.map((r) => r.memberId));
}

// RULES MANAGEMENT
export async function getRules(): Promise<string> {
  const snap = await getDoc(rulesDocRef);
  if (snap.exists()) return snap.data().text || "";
  return "";
}

export async function saveRules(text: string) {
  await setDoc(rulesDocRef, { text, updatedAt: serverTimestamp() });
}
