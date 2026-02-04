import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function SetupScreen() {
  const { setupAccount, checkBiometricAvailable, enableBiometric } = useAuth()
  const [step, setStep] = useState('password') // 'password' | 'biometric' | 'complete'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [targetCalories, setTargetCalories] = useState(2000)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  const validatePassword = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleCreateAccount = async () => {
    setError('')

    if (!validatePassword()) return

    setLoading(true)
    const result = await setupAccount(password, targetCalories)
    setLoading(false)

    if (result.success) {
      // Check for biometric availability
      const bioAvailable = await checkBiometricAvailable()
      setBiometricAvailable(bioAvailable)

      if (bioAvailable) {
        setStep('biometric')
      } else {
        setStep('complete')
      }
    } else {
      setError(result.error || 'Failed to create account')
    }
  }

  const handleEnableBiometric = async () => {
    setLoading(true)
    const result = await enableBiometric()
    setLoading(false)

    if (result.success) {
      setStep('complete')
    } else {
      setError(result.error || 'Failed to enable biometric')
    }
  }

  const handleSkipBiometric = () => {
    setStep('complete')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-emerald-600 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🍎</span>
          </div>
          <h1 className="text-3xl font-bold text-white">CalTrack</h1>
          <p className="text-emerald-100 mt-2">Your personal calorie tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
          {step === 'password' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Create Your Password
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This password protects your data and encrypts your API key. Make sure to remember it.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Daily Calorie Goal
                  </label>
                  <input
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(parseInt(e.target.value) || 2000)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleCreateAccount}
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Your data stays private</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      All data is stored locally on your device. Your password is never stored—only a secure hash.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'biometric' && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Enable Face ID / Fingerprint
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Use biometric authentication for faster, secure login.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleEnableBiometric}
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Enable Biometric Login'}
                </button>
                <button
                  onClick={handleSkipBiometric}
                  className="w-full py-3.5 text-gray-600 dark:text-gray-400 font-medium"
                >
                  Skip for now
                </button>
              </div>
            </>
          )}

          {step === 'complete' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                You're all set!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your account is ready. Start tracking your calories!
              </p>
              <div className="text-4xl animate-bounce">🎉</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetupScreen
