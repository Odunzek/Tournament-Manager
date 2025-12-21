/**
 * Migration Utility: Sync Group Members to Players Collection
 *
 * This utility syncs your existing group_members data with the new players system
 * and calculates achievements automatically.
 */

import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { calculateTier } from '@/types/player';

interface GroupMember {
  id?: string;
  name: string;
  psnId?: string;
  isActive: boolean;
  joinedDate: any;
  totalCompetitions: number;
  totalWins: number;
  notes?: string;
}

/**
 * Migrate all group members to the players collection
 * This will create player records with achievements calculated from totalWins
 */
export async function migrateGroupMembersToPlayers() {
  try {
    console.log('🔄 Starting migration from group_members to players...');

    // Get all group members
    const membersSnapshot = await getDocs(collection(db, 'group_members'));
    const members = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GroupMember[];

    console.log(`Found ${members.length} group members to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const member of members) {
      if (!member.id) {
        console.warn(`⚠️ Skipping member without ID: ${member.name}`);
        skippedCount++;
        continue;
      }

      // Calculate achievements
      // For now, we'll split totalWins between leagues and tournaments
      // You can adjust this logic based on your actual data
      const totalTitles = member.totalWins || 0;
      const leagueWins = Math.floor(totalTitles / 2); // Half as league wins
      const tournamentWins = totalTitles - leagueWins; // Rest as tournament wins

      const tier = calculateTier(totalTitles);
      const isHallOfFame = totalTitles >= 3;

      // Determine induction date (use joinedDate if they're already in HOF)
      let inductionDate: string | undefined;
      if (isHallOfFame && member.joinedDate) {
        try {
          inductionDate = member.joinedDate.toDate ?
            member.joinedDate.toDate().toISOString() :
            new Date(member.joinedDate).toISOString();
        } catch (e) {
          inductionDate = new Date().toISOString();
        }
      }

      // Create player document
      // Build achievements object without undefined values
      const achievements: any = {
        leagueWins,
        tournamentWins,
        totalTitles,
        tier
      };

      // Only add inductionDate if it exists (Firebase doesn't allow undefined)
      if (inductionDate) {
        achievements.inductionDate = inductionDate;
      }

      const playerData = {
        name: member.name,
        psnId: (member.psnId || '').toLowerCase(),
        avatar: null,
        achievements,
        createdAt: member.joinedDate?.toDate ?
          member.joinedDate.toDate() :
          new Date(member.joinedDate || new Date()),
        updatedAt: new Date()
      };

      // Use the same ID from group_members to maintain consistency
      await setDoc(doc(db, 'players', member.id), playerData);

      console.log(`✅ Migrated: ${member.name} (${totalTitles} titles, ${tier || 'no tier'})`);
      migratedCount++;
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Migrated: ${migratedCount} players`);
    console.log(`⚠️ Skipped: ${skippedCount} players`);

    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      total: members.length
    };

  } catch (error) {
    console.error('❌ Error migrating players:', error);
    throw error;
  }
}

/**
 * Sync a single group member to players collection
 */
export async function syncSingleMemberToPlayer(memberId: string) {
  try {
    const memberSnapshot = await getDocs(collection(db, 'group_members'));
    const member = memberSnapshot.docs
      .find(doc => doc.id === memberId)
      ?.data() as GroupMember | undefined;

    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    const totalTitles = member.totalWins || 0;
    const leagueWins = Math.floor(totalTitles / 2);
    const tournamentWins = totalTitles - leagueWins;
    const tier = calculateTier(totalTitles);
    const isHallOfFame = totalTitles >= 3;

    let inductionDate: string | undefined;
    if (isHallOfFame && member.joinedDate) {
      try {
        inductionDate = member.joinedDate.toDate ?
          member.joinedDate.toDate().toISOString() :
          new Date(member.joinedDate).toISOString();
      } catch (e) {
        inductionDate = new Date().toISOString();
      }
    }

    // Build achievements object without undefined values
    const achievements: any = {
      leagueWins,
      tournamentWins,
      totalTitles,
      tier
    };

    // Only add inductionDate if it exists (Firebase doesn't allow undefined)
    if (inductionDate) {
      achievements.inductionDate = inductionDate;
    }

    const playerData = {
      name: member.name,
      psnId: (member.psnId || '').toLowerCase(),
      avatar: null,
      achievements,
      createdAt: member.joinedDate?.toDate ?
        member.joinedDate.toDate() :
        new Date(member.joinedDate || new Date()),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'players', memberId), playerData);
    console.log(`✅ Synced player: ${member.name}`);

    return playerData;

  } catch (error) {
    console.error('❌ Error syncing player:', error);
    throw error;
  }
}
