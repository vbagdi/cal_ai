import { useState } from 'react'
import { useDaily } from './hooks/useDaily'
import { useAuth } from './contexts/AuthContext'
import { FoodScanner } from './components/FoodScanner'
import { SettingsModal } from './components/SettingsModal'
import { SetupScreen } from './components/SetupScreen'
import { LoginScreen } from './components/LoginScreen'
import './App.css'

function App() {
  const { isAuthenticated, needsSetup, authLoading, lock } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const {
    entry,
    totalCalories,
    remainingCalories,
    loading,
    addMeal,
    deleteMeal,
    addWorkout,
    deleteWorkout,
    updateDailyNotes
  } = useDaily(today)

  const [activeModal, setActiveModal] = useState(null) // 'meal' | 'workout' | 'scan' | 'settings' | null
  const [mealForm, setMealForm] = useState({ name: '', items: '', totalCal: '' })
  const [workoutForm, setWorkoutForm] = useState({ type: '', duration: '', notes: '' })
  const [showFab, setShowFab] = useState(false)

  // Format today's date nicely
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const progressPercent = Math.min((totalCalories / entry.targetCalories) * 100, 100)
  const isOverBudget = totalCalories > entry.targetCalories

  const handleAddMeal = async (e) => {
    e.preventDefault()
    if (!mealForm.name || !mealForm.totalCal) return

    await addMeal({
      name: mealForm.name,
      items: mealForm.items,
      totalCal: parseInt(mealForm.totalCal, 10) || 0
    })

    setMealForm({ name: '', items: '', totalCal: '' })
    setActiveModal(null)
  }

  const handleAddWorkout = async (e) => {
    e.preventDefault()
    if (!workoutForm.type) return

    await addWorkout({
      type: workoutForm.type,
      duration: parseInt(workoutForm.duration, 10) || 0,
      notes: workoutForm.notes
    })

    setWorkoutForm({ type: '', duration: '', notes: '' })
    setActiveModal(null)
  }

  const handleNotesChange = (e) => {
    updateDailyNotes(e.target.value)
  }

  const handleScannedMeal = async (mealData) => {
    await addMeal(mealData)
  }

  // Show loading state while auth is initializing
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show setup screen for first-time users
  if (needsSetup) {
    return <SetupScreen />
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-4 pt-6 pb-20 rounded-b-3xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-emerald-100 text-sm">{formattedDate}</p>
            <h1 className="text-2xl font-bold">CalTrack</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={lock}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title="Lock app"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
            <button
              onClick={() => setActiveModal('settings')}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-14 pb-24 space-y-4">
        {/* Calorie Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Consumed</p>
              <p className={`text-3xl font-bold ${isOverBudget ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                {totalCalories}
                <span className="text-lg font-normal text-gray-400"> cal</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOverBudget ? 'Over by' : 'Remaining'}
              </p>
              <p className={`text-2xl font-semibold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                {isOverBudget ? '+' : ''}{Math.abs(remainingCalories)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0</span>
              <span className="text-xs text-gray-400">{entry.targetCalories} cal goal</span>
            </div>
          </div>
        </div>

        {/* Meals Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="text-lg">🍽️</span> Meals
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {entry.meals.length} logged
            </span>
          </div>

          {entry.meals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No meals yet today</p>
              <button
                onClick={() => setActiveModal('meal')}
                className="mt-2 text-emerald-500 text-sm font-medium"
              >
                + Add your first meal
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {entry.meals.map((meal) => (
                <li
                  key={meal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{meal.name}</p>
                      <span className="text-xs text-gray-400">{meal.time}</span>
                    </div>
                    {meal.items && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{meal.items}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {meal.totalCal} cal
                    </span>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Workouts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="text-lg">💪</span> Workouts
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {entry.workouts.length} logged
            </span>
          </div>

          {entry.workouts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No workouts yet today</p>
              <button
                onClick={() => setActiveModal('workout')}
                className="mt-2 text-emerald-500 text-sm font-medium"
              >
                + Log a workout
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {entry.workouts.map((workout) => (
                <li
                  key={workout.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-100">{workout.type}</p>
                    {workout.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{workout.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {workout.duration} min
                    </span>
                    <button
                      onClick={() => deleteWorkout(workout.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Daily Notes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
          <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
            <span className="text-lg">📝</span> Notes
          </h2>
          <textarea
            placeholder="How are you feeling today? Any thoughts about your meals..."
            value={entry.dailyNotes}
            onChange={handleNotesChange}
            rows={3}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-xl text-gray-700 dark:text-gray-200 placeholder-gray-400 resize-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col items-end gap-3 z-40">
        {showFab && (
          <>
            {/* Scan Food Button */}
            <button
              onClick={() => {
                setActiveModal('scan')
                setShowFab(false)
              }}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 pl-4 pr-5 py-3 rounded-full shadow-lg animate-fade-in"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">Scan Food</span>
            </button>

            {/* Manual Entry Button */}
            <button
              onClick={() => {
                setActiveModal('meal')
                setShowFab(false)
              }}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 pl-4 pr-5 py-3 rounded-full shadow-lg animate-fade-in"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">Manual Entry</span>
            </button>

            {/* Add Workout Button */}
            <button
              onClick={() => {
                setActiveModal('workout')
                setShowFab(false)
              }}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 pl-4 pr-5 py-3 rounded-full shadow-lg animate-fade-in"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">Add Workout</span>
            </button>
          </>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setShowFab(!showFab)}
          className={`w-14 h-14 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 ${showFab ? 'rotate-45' : ''}`}
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Backdrop for FAB menu */}
      {showFab && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowFab(false)}
        />
      )}

      {/* Add Meal Modal */}
      {activeModal === 'meal' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setActiveModal(null)}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add Meal</h2>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meal Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Breakfast, Lunch, Snack"
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Food Items
                </label>
                <input
                  type="text"
                  placeholder="e.g., Eggs, toast, orange juice"
                  value={mealForm.items}
                  onChange={(e) => setMealForm({ ...mealForm, items: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Calories *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 450"
                  value={mealForm.totalCal}
                  onChange={(e) => setMealForm({ ...mealForm, totalCal: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all"
              >
                Add Meal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Workout Modal */}
      {activeModal === 'workout' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setActiveModal(null)}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Log Workout</h2>

            <form onSubmit={handleAddWorkout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Workout Type *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Running, Weights, Yoga"
                  value={workoutForm.type}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  value={workoutForm.duration}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, duration: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Felt great, new PR!"
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all"
              >
                Log Workout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Food Scanner Modal */}
      <FoodScanner
        isOpen={activeModal === 'scan'}
        onClose={() => setActiveModal(null)}
        onAddMeal={handleScannedMeal}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  )
}

export default App
