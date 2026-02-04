import Dexie from 'dexie'

export const db = new Dexie('CalTrackDB')

// Database schema - version 2 adds auth table
db.version(1).stores({
  dailyEntries: 'date'
})

db.version(2).stores({
  dailyEntries: 'date',
  auth: 'id' // Single record with id='main'
})

// Version 3: Add exercise history for autocomplete
db.version(3).stores({
  dailyEntries: 'date',
  auth: 'id',
  exerciseHistory: 'name' // Unique exercise names for autocomplete
})

/**
 * Exercise History Schema:
 * {
 *   name: string,           // Exercise name (primary key, lowercase)
 *   displayName: string,    // Display name with original casing
 *   lastUsed: number,       // Timestamp of last use
 *   useCount: number        // How many times used
 * }
 */

/**
 * Auth Schema:
 * {
 *   id: 'main',                    // Always 'main' - single record
 *   passwordHash: string,          // PBKDF2 hash (base64)
 *   salt: string,                  // Salt for PBKDF2 (base64)
 *   encryptedApiKey: string|null,  // AES-256-GCM encrypted API key (base64)
 *   apiKeyIV: string|null,         // IV for API key encryption (base64)
 *   biometricEnabled: boolean,     // Whether biometric auth is enabled
 *   biometricCredentialId: string|null, // WebAuthn credential ID (base64)
 *   failedAttempts: number,        // Count of failed login attempts
 *   lockoutUntil: number|null,     // Timestamp when lockout expires
 *   createdAt: number,             // Timestamp of account creation
 *   targetCalories: number         // Default calorie goal
 * }
 */

/**
 * Daily Entry Schema:
 * {
 *   date: string,              // Primary key, format: "YYYY-MM-DD"
 *   meals: [
 *     {
 *       id: string,            // Unique ID (uuid or timestamp-based)
 *       time: string,          // Time of meal (e.g., "08:30")
 *       name: string,          // Meal name (e.g., "Breakfast", "Lunch")
 *       items: string,         // Food items description
 *       totalCal: number,      // Total calories for this meal
 *       image: string | null   // Base64 image or null
 *     }
 *   ],
 *   exercises: [
 *     {
 *       id: string,            // Unique ID
 *       name: string,          // Exercise name (e.g., "Bicep curl")
 *       weight: number,        // Weight in lbs
 *       reps: number,          // Number of reps
 *       sets: number,          // Number of sets (default 1)
 *       time: string           // Time logged
 *     }
 *   ],
 *   dailyNotes: string,        // General notes for the day
 *   targetCalories: number     // Calorie goal for the day
 * }
 */

// Helper to create a default empty entry for a date
export function createEmptyEntry(date, targetCalories = 2000) {
  return {
    date,
    meals: [],
    exercises: [], // New format for individual exercises
    workouts: [], // Keep for backwards compatibility
    dailyNotes: '',
    targetCalories
  }
}

// Generate a unique ID for meals/workouts
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Auth helper functions
export async function getAuthData() {
  return await db.auth.get('main')
}

export async function setAuthData(data) {
  return await db.auth.put({ ...data, id: 'main' })
}

export async function hasAuthSetup() {
  const auth = await getAuthData()
  return !!auth?.passwordHash
}

export async function deleteAllData() {
  await db.dailyEntries.clear()
  await db.auth.clear()
  await db.exerciseHistory.clear()
}

// Exercise history helper functions
export async function addExerciseToHistory(exerciseName) {
  const normalizedName = exerciseName.toLowerCase().trim()
  const existing = await db.exerciseHistory.get(normalizedName)

  if (existing) {
    await db.exerciseHistory.update(normalizedName, {
      lastUsed: Date.now(),
      useCount: (existing.useCount || 0) + 1
    })
  } else {
    await db.exerciseHistory.put({
      name: normalizedName,
      displayName: exerciseName.trim(),
      lastUsed: Date.now(),
      useCount: 1
    })
  }
}

export async function searchExerciseHistory(query) {
  if (!query || query.length < 1) {
    // Return most recently used exercises
    return await db.exerciseHistory
      .orderBy('lastUsed')
      .reverse()
      .limit(10)
      .toArray()
  }

  const normalizedQuery = query.toLowerCase().trim()
  const allExercises = await db.exerciseHistory.toArray()

  // Filter and sort by relevance
  return allExercises
    .filter(ex => ex.name.includes(normalizedQuery))
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 10)
}

// Get all dates that have logged data (for calendar indicators)
export async function getDatesWithData() {
  const entries = await db.dailyEntries.toArray()
  return entries
    .filter(e => e.meals?.length > 0 || e.exercises?.length > 0 || e.workouts?.length > 0)
    .map(e => e.date)
}

// Get default calorie target from auth settings
export async function getDefaultCalorieTarget() {
  const auth = await getAuthData()
  return auth?.targetCalories || 2000
}
