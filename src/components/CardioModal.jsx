import { useState, useEffect, useRef } from 'react'
import { searchActivityHistory } from '../utils/db'

export function CardioModal({ isOpen, onClose, onAddCardio, onDeleteCardio, cardio = [] }) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
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

  // Search for activity suggestions
  useEffect(() => {
    async function search() {
      const results = await searchActivityHistory(name)
      setSuggestions(results)
    }
    search()
  }, [name])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!name.trim() || !caloriesBurned) return

    await onAddCardio({
      name: name.trim(),
      duration: parseInt(duration) || 0,
      caloriesBurned: parseInt(caloriesBurned) || 0
    })

    // Clear form but keep modal open for rapid entry
    setName('')
    setDuration('')
    setCaloriesBurned('')
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1000)

    // Focus back on name input
    nameInputRef.current?.focus()
  }

  const selectSuggestion = (suggestion) => {
    setName(suggestion.displayName)
    setShowSuggestions(false)
    document.getElementById('duration-input')?.focus()
  }

  const totalBurned = cardio.reduce((sum, c) => sum + (c.caloriesBurned || 0), 0)

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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Log Cardio</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>

        {/* Quick Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          {/* Activity Name with Autocomplete */}
          <div className="relative">
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Activity name (e.g., Running)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

          {/* Duration and Calories Row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                id="duration-input"
                type="number"
                placeholder="Duration (min)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Calories burned *"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            type="submit"
            disabled={!name.trim() || !caloriesBurned}
            className={`w-full py-3 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${
              justAdded
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {justAdded ? '+ Added!' : '+ Add Activity'}
          </button>
        </form>

        {/* Today's Cardio List */}
        {cardio.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Activities ({cardio.length})
              </h3>
              <span className="text-sm font-semibold text-orange-500">
                {totalBurned} cal burned
              </span>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {cardio.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white truncate">
                      {c.name}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {c.caloriesBurned} cal burned
                      {c.duration > 0 && ` - ${c.duration} min`}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteCardio(c.id)}
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
        {cardio.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              No cardio logged yet. Start adding above!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CardioModal
