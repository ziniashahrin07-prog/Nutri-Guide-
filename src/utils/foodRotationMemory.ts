/**
 * NutriGuide - Food Rotation Memory & Diversity Engine
 * 
 * Provides a lightweight, decaying rotation memory that tracks recently selected
 * food items for an active profile. Prevents the planner from repeatedly picking
 * the exact same foods across regenerated days while preserving nutritional suitability.
 */

import { FoodItem } from '../types';
import { getCanonicalFoodId } from '../data/bangladeshFoodDatabase';

interface RotationRecord {
  timestamp: number;
  foodIds: string[];
  foodGroups?: string[];
}

const memoryStore: Map<string, RotationRecord[]> = new Map();
const MAX_HISTORY_DAYS = 7; // Keep up to 7 recent generation records per profile

/**
 * Normalizes profile fingerprint or key.
 */
function getStorageKey(profileFingerprint: string): string {
  return `nutriguide_rotation_${profileFingerprint}`;
}

/**
 * Loads rotation history for a profile from memory or localStorage.
 */
export function getRotationHistory(profileFingerprint: string): RotationRecord[] {
  if (!profileFingerprint) return [];

  // 1. Check in-memory store
  const mem = memoryStore.get(profileFingerprint);
  if (mem && mem.length > 0) {
    return mem;
  }

  // 2. Check localStorage if in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(getStorageKey(profileFingerprint));
      if (raw) {
        const parsed: RotationRecord[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Normalize legacy IDs in loaded history
          const normalized = parsed.map(rec => ({
            ...rec,
            foodIds: Array.from(new Set(rec.foodIds.map(getCanonicalFoodId))),
          }));
          memoryStore.set(profileFingerprint, normalized);
          return normalized;
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }

  return [];
}

/**
 * Records newly selected food items/IDs for a profile into rotation memory.
 */
export function recordUsedFoods(
  profileFingerprint: string, 
  foodsOrIds: (string | FoodItem)[]
): void {
  if (!profileFingerprint || !foodsOrIds || foodsOrIds.length === 0) return;

  const canonicalIds: string[] = [];
  const groups: string[] = [];

  for (const item of foodsOrIds) {
    if (typeof item === 'string') {
      const cId = getCanonicalFoodId(item);
      canonicalIds.push(cId);
    } else if (item && item.id) {
      const cId = getCanonicalFoodId(item.id);
      canonicalIds.push(cId);
      const grp = item.foodGroup || item.semanticGroup;
      if (grp) groups.push(grp);
    }
  }

  const current = getRotationHistory(profileFingerprint);
  const newRecord: RotationRecord = {
    timestamp: Date.now(),
    foodIds: Array.from(new Set(canonicalIds)),
    foodGroups: Array.from(new Set(groups)),
  };

  // Prepend and limit to MAX_HISTORY_DAYS
  const updated = [newRecord, ...current].slice(0, MAX_HISTORY_DAYS);
  memoryStore.set(profileFingerprint, updated);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(getStorageKey(profileFingerprint), JSON.stringify(updated));
    } catch {
      // Storage quota or sandboxing
    }
  }
}

/**
 * Computes frequency counts of each food ID and foodGroup across recent history with exponential recency decay.
 * More recent plans contribute higher penalty weights.
 */
export function getRecentFoodFrequencies(profileFingerprint: string): {
  idFrequencies: Record<string, number>;
  groupFrequencies: Record<string, number>;
} {
  const history = getRotationHistory(profileFingerprint);
  const idFrequencies: Record<string, number> = {};
  const groupFrequencies: Record<string, number> = {};

  history.forEach((record, index) => {
    // Recency weight: latest plan = 1.0, 2nd latest = 0.7, 3rd = 0.49, etc.
    const weight = Math.pow(0.70, index);
    for (const rawId of record.foodIds) {
      const canonicalId = getCanonicalFoodId(rawId);
      idFrequencies[canonicalId] = (idFrequencies[canonicalId] || 0) + weight;
    }
    if (record.foodGroups) {
      for (const grp of record.foodGroups) {
        groupFrequencies[grp] = (groupFrequencies[grp] || 0) + weight;
      }
    }
  });

  return { idFrequencies, groupFrequencies };
}

/**
 * Returns a diversity score modifier for a candidate food item:
 * - Foods not seen recently receive a positive opportunity bonus (+10 to +25)
 * - Recently used foods receive a proportional rotation penalty (-15 to -40)
 * - Foods in recently used semantic groups receive group rotation penalties
 */
export function getFoodDiversityScore(
  foodOrId: string | FoodItem, 
  profileFingerprint: string,
  intraDayUsedIds: Set<string>,
  intraDayUsedGroups?: Set<string>
): number {
  const foodId = typeof foodOrId === 'string' ? foodOrId : foodOrId.id;
  const canonicalId = getCanonicalFoodId(foodId);
  const foodGroup = typeof foodOrId === 'object' ? (foodOrId.foodGroup || foodOrId.semanticGroup) : undefined;

  // 1. Hard intra-day penalty (avoid repeating same item in multiple slots on the same day)
  if (intraDayUsedIds.has(canonicalId) || intraDayUsedIds.has(foodId)) {
    return -60;
  }

  // 2. Intra-day semantic group penalty (e.g. avoid multiple yogurt entries in one day)
  if (foodGroup && intraDayUsedGroups && intraDayUsedGroups.has(foodGroup)) {
    return -45;
  }

  if (!profileFingerprint) return 0;

  const { idFrequencies, groupFrequencies } = getRecentFoodFrequencies(profileFingerprint);
  const recencyWeight = idFrequencies[canonicalId] || 0;
  const groupRecency = foodGroup ? (groupFrequencies[foodGroup] || 0) : 0;
  const effectiveRecency = Math.max(recencyWeight, groupRecency * 0.85);

  if (effectiveRecency === 0) {
    // Novel food / group opportunity boost
    return 20;
  } else if (effectiveRecency > 1.5) {
    // Heavily used in recent generations
    return -35;
  } else if (effectiveRecency > 0.8) {
    // Moderately used
    return -20;
  } else {
    // Minor recency
    return -10;
  }
}

/**
 * Computes the similarity (Jaccard index) between two sets of food IDs to penalize excessive plan overlap.
 */
export function calculatePlanFoodOverlap(planAIds: string[], planBIds: string[]): number {
  if (!planAIds.length || !planBIds.length) return 0;
  const setA = new Set(planAIds);
  const setB = new Set(planBIds);
  let intersection = 0;
  for (const id of setA) {
    if (setB.has(id)) intersection++;
  }
  const union = new Set([...planAIds, ...planBIds]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Clears rotation memory (useful for testing or profile resets).
 */
export function clearRotationMemory(profileFingerprint?: string): void {
  if (profileFingerprint) {
    memoryStore.delete(profileFingerprint);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(getStorageKey(profileFingerprint));
      } catch {
        // Ignore
      }
    }
  } else {
    memoryStore.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keys = Object.keys(window.localStorage);
        for (const k of keys) {
          if (k.startsWith('nutriguide_rotation_')) {
            window.localStorage.removeItem(k);
          }
        }
      } catch {
        // Ignore
      }
    }
  }
}
