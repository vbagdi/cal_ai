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
 *   workouts: [
 *     {
 *       id: string,            // Unique ID
 *       type: string,          // Workout type (e.g., "Running", "Weights")
 *       duration: number,      // Duration in minutes
 *       notes: string          // Additional notes
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
    workouts: [],
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
}
