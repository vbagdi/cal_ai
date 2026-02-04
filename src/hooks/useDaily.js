import { useState, useEffect, useCallback } from 'react'
import { db, createEmptyEntry, generateId, getDefaultCalorieTarget, addExerciseToHistory } from '../utils/db'

/**
 * Custom hook for loading and saving daily entries
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {object} - Entry data and mutation functions
 */
export function useDaily(date) {
  const [entry, setEntry] = useState(() => createEmptyEntry(date))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load entry for the given date
  useEffect(() => {
    let cancelled = false

    async function loadEntry() {
      setLoading(true)
      setError(null)

      try {
        const existing = await db.dailyEntries.get(date)
        if (!cancelled) {
          if (existing) {
            // Ensure exercises array exists for backwards compatibility
            setEntry({
              ...existing,
              exercises: existing.exercises || []
            })
          } else {
            // Get default calorie target for new entries
            const defaultTarget = await getDefaultCalorieTarget()
            setEntry(createEmptyEntry(date, defaultTarget))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setEntry(createEmptyEntry(date))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEntry()

    return () => {
      cancelled = true
    }
  }, [date])

  // Save entry to database
  const saveEntry = useCallback(async (updatedEntry) => {
    try {
      await db.dailyEntries.put(updatedEntry)
      setEntry(updatedEntry)
    } catch (err) {
      setError(err)
      throw err
    }
  }, [])

  // Add a meal
  const addMeal = useCallback(async (meal) => {
    const newMeal = {
      id: generateId(),
      time: meal.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      name: meal.name || '',
      items: meal.items || '',
      totalCal: meal.totalCal || 0,
      image: meal.image || null
    }

    const updatedEntry = {
      ...entry,
      meals: [...entry.meals, newMeal]
    }

    await saveEntry(updatedEntry)
    return newMeal
  }, [entry, saveEntry])

  // Update a meal
  const updateMeal = useCallback(async (mealId, updates) => {
    const updatedEntry = {
      ...entry,
      meals: entry.meals.map(meal =>
        meal.id === mealId ? { ...meal, ...updates } : meal
      )
    }

    await saveEntry(updatedEntry)
  }, [entry, saveEntry])

  // Delete a meal
  const deleteMeal = useCallback(async (mealId) => {
    const updatedEntry = {
      ...entry,
      meals: entry.meals.filter(meal => meal.id !== mealId)
    }

    await saveEntry(updatedEntry)
  }, [entry, saveEntry])

  // Add a workout
  const addWorkout = useCallback(async (workout) => {
    const newWorkout = {
      id: generateId(),
      type: workout.type || '',
      duration: workout.duration || 0,
      notes: workout.notes || ''
    }

    const updatedEntry = {
      ...entry,
      workouts: [...entry.workouts, newWorkout]
    }

    await saveEntry(updatedEntry)
    return newWorkout
  }, [entry, saveEntry])

  // Update a workout
  const updateWorkout = useCallback(async (workoutId, updates) => {
    const updatedEntry = {
      ...entry,
      workouts: entry.workouts.map(workout =>
        workout.id === workoutId ? { ...workout, ...updates } : workout
      )
    }

    await saveEntry(updatedEntry)
  }, [entry, saveEntry])

  // Delete a workout
  const deleteWorkout = useCallback(async (workoutId) => {
    const updatedEntry = {
      ...entry,
      workouts: entry.workouts.filter(workout => workout.id !== workoutId)
    }

    await saveEntry(updatedEntry)
  }, [entry, saveEntry])

  // Add an exercise (new format)
  const addExercise = useCallback(async (exercise) => {
    const newExercise = {
      id: generateId(),
      name: exercise.name || '',
      weight: exercise.weight || 0,
      reps: exercise.reps || 0,
      sets: exercise.sets || 1,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    const updatedEntry = {
      ...entry,
      exercises: [...(entry.exercises || []), newExercise]
    }

    await saveEntry(updatedEntry)

    // Add to exercise history for autocomplete
    if (exercise.name) {
      await addExerciseToHistory(exercise.name)
    }

    return newExercise
  }, [entry, saveEntry])

  // Update an exercise
  const updateExercise = useCallback(async (exerciseId, updates) => {
    const updatedEntry = {
      ...entry,
      exercises: (entry.exercises || []).map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      )
    }

    await saveEntry(updatedEntry)

    // Update exercise history if name changed
    if (updates.name) {
      await addExerciseToHistory(updates.name)
    }
  }, [entry, saveEntry])

  // Delete an exercise
  const deleteExercise = useCallback(async (exerciseId) => {
    const updatedEntry = {
      ...entry,
      exercises: (entry.exercises || []).filter(ex => ex.id !== exerciseId)
    }

    await saveEntry(updatedEntry)
  }, [entry, saveEntry])

  // Update daily notes
  const updateDailyNotes = useCallback(async (notes) => {
    const updatedEntry = {
      ...entry,
      dailyNotes: notes
    }

    await saveEntry(updatedEntry)
  }, [entry, saveEntry])

  // Update target calories
  const updateTargetCalories = useCallback(async (calories) => {
    const updatedEntry = {
      ...entry,
      targetCalories: calories
    }

    await saveEntry(updatedEntry)
  }, [entry, saveEntry])

  // Computed values
  const totalCalories = entry.meals.reduce((sum, meal) => sum + (meal.totalCal || 0), 0)
  const remainingCalories = entry.targetCalories - totalCalories

  return {
    // Data
    entry,
    loading,
    error,

    // Computed
    totalCalories,
    remainingCalories,

    // Meal actions
    addMeal,
    updateMeal,
    deleteMeal,

    // Exercise actions (new format)
    addExercise,
    updateExercise,
    deleteExercise,

    // Workout actions (legacy)
    addWorkout,
    updateWorkout,
    deleteWorkout,

    // Other actions
    updateDailyNotes,
    updateTargetCalories,
    saveEntry
  }
}

export default useDaily
