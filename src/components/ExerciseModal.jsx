import { useState, useEffect, useRef } from 'react'
import { searchExerciseHistory } from '../utils/db'

export function ExerciseModal({ isOpen, onClose, onAddExercise, onDeleteExercise, exercises = [] }) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('1')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const nameInputRef = useRef(null)

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search for exercise suggestions
  useEffect(() => {
    async function search() {
      const results = await searchExerciseHistory(name)
      setSuggestions(results)
    }
    search()
  }, [name])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!name.trim() || !weight || !reps) return

    await onAddExercise({
      name: name.trim(),
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      sets: parseInt(sets) || 1
    })

    // Clear form but keep modal open for rapid entry
    setName('')
    setWeight('')
    setReps('')
    setSets('1')
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1000)

    // Focus back on name input
    nameInputRef.current?.focus()
  }

  const selectSuggestion = (suggestion) => {
    setName(suggestion.displayName)
    setShowSuggestions(false)
    // Move focus to weight input
    document.getElementById('weight-input')?.focus()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Log Exercises</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>

        {/* Quick Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          {/* Exercise Name with Autocomplete */}
          <div className="relative">
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Exercise name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {s.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Weight, Reps, Sets Row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                id="weight-input"
                type="number"
                placeholder="Weight (lbs)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-20">
              <input
                type="number"
                placeholder="Sets"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                min="1"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            type="submit"
            disabled={!name.trim() || !weight || !reps}
            className={`w-full py-3 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${
              justAdded
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {justAdded ? '+ Added!' : '+ Add Exercise'}
          </button>
        </form>

        {/* Today's Exercises List */}
        {exercises.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              Today's Exercises ({exercises.length})
            </h3>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white truncate">
                      {ex.name}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {ex.weight} lbs x {ex.reps} reps
                      {ex.sets > 1 && ` x ${ex.sets} sets`}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteExercise(ex.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty State */}
        {exercises.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              No exercises logged yet. Start adding above!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExerciseModal
