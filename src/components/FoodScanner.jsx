import { useState, useRef } from 'react'
import { analyzeFoodImage, fileToBase64 } from '../utils/foodAnalyzer'
import { hasApiKey } from '../utils/settings'

export function FoodScanner({ isOpen, onClose, onAddMeal }) {
  const [step, setStep] = useState('capture') // 'capture' | 'analyzing' | 'results' | 'error'
  const [imagePreview, setImagePreview] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const resetState = () => {
    setStep('capture')
    setImagePreview(null)
    setAnalysisResult(null)
    setError(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleImageSelect = async (file) => {
    if (!file) return

    // Check for API key first
    if (!hasApiKey()) {
      setError('Please add your Claude API key in Settings first.')
      setStep('error')
      return
    }

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setStep('analyzing')

      // Convert to base64 and analyze
      const { base64, mediaType } = await fileToBase64(file)
      const result = await analyzeFoodImage(base64, mediaType)

      setAnalysisResult(result)
      setStep('results')
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze image')
      setStep('error')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleAddAllToMeal = () => {
    if (!analysisResult) return

    // Create a meal with all the food items
    const mealName = analysisResult.foods.length === 1
      ? analysisResult.foods[0].name
      : `Scanned Meal (${analysisResult.foods.length} items)`

    const items = analysisResult.foods.map(f => `${f.name} (${f.portion})`).join(', ')

    onAddMeal({
      name: mealName,
      items: items,
      totalCal: analysisResult.totalCalories,
      // Store extra nutrition data
      protein: analysisResult.totalProtein,
      carbs: analysisResult.totalCarbs,
      fat: analysisResult.totalFat
    })

    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {/* Capture Step */}
        {step === 'capture' && (
          <>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Scan Food</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Take a photo or choose an image of your food to automatically detect calories and nutrition.
            </p>

            <div className="space-y-3">
              {/* Camera Button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 dark:text-white">Take Photo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use your camera</p>
                </div>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Gallery Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 dark:text-white">Choose Photo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">From your gallery</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {!hasApiKey() && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ API key required. Add your Claude API key in Settings to use food scanning.
                </p>
              </div>
            )}
          </>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="text-center py-8">
            {imagePreview && (
              <div className="mb-6">
                <img
                  src={imagePreview}
                  alt="Food being analyzed"
                  className="w-32 h-32 object-cover rounded-2xl mx-auto shadow-lg"
                />
              </div>
            )}
            <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Analyzing your food...
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI is identifying items and calculating nutrition
            </p>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && analysisResult && (
          <>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Analysis Results</h2>

            {imagePreview && (
              <div className="mb-4">
                <img
                  src={imagePreview}
                  alt="Analyzed food"
                  className="w-full h-40 object-cover rounded-2xl"
                />
              </div>
            )}

            {/* Confidence Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                analysisResult.confidence === 'high'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : analysisResult.confidence === 'medium'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {analysisResult.confidence} confidence
              </span>
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white mb-4">
              <p className="text-purple-100 text-sm mb-1">Total Calories</p>
              <p className="text-3xl font-bold">{analysisResult.totalCalories} cal</p>
              <div className="flex gap-4 mt-3 text-sm">
                <div>
                  <p className="text-purple-200">Protein</p>
                  <p className="font-semibold">{analysisResult.totalProtein}g</p>
                </div>
                <div>
                  <p className="text-purple-200">Carbs</p>
                  <p className="font-semibold">{analysisResult.totalCarbs}g</p>
                </div>
                <div>
                  <p className="text-purple-200">Fat</p>
                  <p className="font-semibold">{analysisResult.totalFat}g</p>
                </div>
              </div>
            </div>

            {/* Food Items List */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Detected Items</h3>
              <ul className="space-y-2">
                {analysisResult.foods.map((food, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{food.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{food.portion}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600 dark:text-purple-400">{food.calories} cal</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Notes */}
            {analysisResult.notes && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Note:</span> {analysisResult.notes}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetState}
                className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Scan Again
              </button>
              <button
                onClick={handleAddAllToMeal}
                className="flex-1 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all"
              >
                Add to Log
              </button>
            </div>
          </>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Analysis Failed
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={resetState}
              className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodScanner
