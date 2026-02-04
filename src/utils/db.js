import Dexie from 'dexie'

export const db = new Dexie('CalTrackDB')

// Database schema
db.version(1).stores({
  // Daily entries indexed by date (YYYY-MM-DD format)
  dailyEntries: 'date'
})

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
export function createEmptyEntry(date) {
  return {
    date,
    meals: [],
    workouts: [],
    dailyNotes: '',
    targetCalories: 2000
  }
}

// Generate a unique ID for meals/workouts
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
