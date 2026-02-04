import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function LoginScreen() {
  const { authData, loginWithPassword, loginWithBiometric } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  const biometricEnabled = authData?.biometricEnabled

  // Check lockout status on mount and update countdown
  useEffect(() => {
    if (authData?.lockoutUntil && authData.lockoutUntil > Date.now()) {
      const updateLockout = () => {
        const remaining = Math.max(0, Math.ceil((authData.lockoutUntil - Date.now()) / 1000))
        setLockoutRemaining(remaining)

        if (remaining <= 0) {
          setLockoutRemaining(0)
          setError('')
        }
      }

      updateLockout()
      const interval = setInterval(updateLockout, 1000)
      return () => clearInterval(interval)
    }
  }, [authData?.lockoutUntil])

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    if (!password || lockoutRemaining > 0) return

    setError('')
    setLoading(true)

    const result = await loginWithPassword(password)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      if (result.locked) {
        setLockoutRemaining(30)
      }
      setPassword('')
    }
  }

  const handleBiometricLogin = async () => {
    setError('')
    setLoading(true)

    const result = await loginWithBiometric()

    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Biometric authentication failed')
    }
  }

  // Try biometric on mount if enabled
  useEffect(() => {
    if (biometricEnabled && !loading) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleBiometricLogin()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-emerald-600 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🍎</span>
          </div>
          <h1 className="text-3xl font-bold text-white">CalTrack</h1>
          <p className="text-emerald-100 mt-2">Welcome back</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            Unlock Your Data
          </h2>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={lockoutRemaining > 0}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {lockoutRemaining > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Too many failed attempts. Try again in {lockoutRemaining} seconds.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || lockoutRemaining > 0 || !password}
              className="w-full py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </form>

          {biometricEnabled && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full py-3.5 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Use Face ID / Fingerprint
              </button>
            </>
          )}

          {/* Security Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Your data is encrypted and stored locally on this device only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
