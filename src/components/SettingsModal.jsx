import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function SettingsModal({ isOpen, onClose }) {
  const {
    authData,
    decryptedApiKey,
    hasApiKey,
    saveApiKey,
    enableBiometric,
    disableBiometric,
    checkBiometricAvailable,
    deleteAll
  } = useAuth()

  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [togglingBiometric, setTogglingBiometric] = useState(false)

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Show the decrypted API key if available, otherwise empty
      setApiKey(decryptedApiKey || '')
      setSaved(false)
      setError('')
      setShowDeleteConfirm(false)
      setDeletePassword('')
      setDeleteError('')

      // Check biometric availability
      checkBiometricAvailable().then(setBiometricAvailable)
    }
  }, [isOpen, decryptedApiKey, checkBiometricAvailable])

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    setSaving(true)
    setError('')

    const result = await saveApiKey(apiKey)

    setSaving(false)

    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error || 'Failed to save API key')
    }
  }

  const handleToggleBiometric = async () => {
    setTogglingBiometric(true)

    if (authData?.biometricEnabled) {
      const result = await disableBiometric()
      if (!result.success) {
        setError(result.error)
      }
    } else {
      const result = await enableBiometric()
      if (!result.success) {
        setError(result.error)
      }
    }

    setTogglingBiometric(false)
  }

  const handleDeleteAll = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password')
      return
    }

    setDeleting(true)
    setDeleteError('')

    const result = await deleteAll(deletePassword)

    setDeleting(false)

    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete data')
    }
    // If successful, the auth state will change and this modal will close
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>

        {!showDeleteConfirm ? (
          <div className="space-y-6">
            {/* API Key Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Claude API Key
                </label>
                {hasApiKey && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Encrypted
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={hasApiKey ? '••••••••••••••••' : 'sk-ant-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Required for AI food scanning. Get your key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 underline"
                >
                  console.anthropic.com
                </a>
              </p>

              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleSaveApiKey}
                disabled={saving || !apiKey.trim()}
                className={`mt-3 w-full py-2.5 font-semibold rounded-xl transition-all ${
                  saved
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50'
                }`}
              >
                {saving ? 'Encrypting...' : saved ? '✓ Saved & Encrypted!' : hasApiKey ? 'Update API Key' : 'Save API Key'}
              </button>
            </div>

            {/* Biometric Section */}
            {biometricAvailable && (
              <div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Biometric Login</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Face ID / Fingerprint</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleBiometric}
                    disabled={togglingBiometric}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      authData?.biometricEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        authData?.biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Security Info */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your API key is encrypted with AES-256-GCM using a key derived from your password. It's stored locally and never sent anywhere except to Anthropic's API.
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Danger Zone</h3>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete All Data
              </button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                This will permanently delete all your data including meals, workouts, and settings.
              </p>
            </div>
          </div>
        ) : (
          /* Delete Confirmation */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Delete All Data?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone. All your meals, workouts, notes, and encrypted API key will be permanently deleted.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enter your password to confirm
              </label>
              <input
                type="password"
                placeholder="Your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {deleteError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletePassword('')
                  setDeleteError('')
                }}
                className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting || !deletePassword}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsModal
