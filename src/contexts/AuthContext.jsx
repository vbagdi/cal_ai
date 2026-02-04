import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getAuthData, setAuthData, hasAuthSetup, deleteAllData } from '../utils/db'
import {
  hashPassword,
  verifyPassword,
  encryptData,
  decryptData,
  isBiometricAvailable,
  registerBiometric,
  authenticateBiometric,
  generateSalt,
  bufferToBase64
} from '../utils/crypto'

const AuthContext = createContext(null)

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const LOCKOUT_DURATION = 30 * 1000 // 30 seconds
const MAX_FAILED_ATTEMPTS = 5
const TAB_BLUR_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const SESSION_KEY = 'caltrack_session'

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    needsSetup: false,
    isAuthenticated: false,
    authData: null
  })

  // Store decrypted API key in memory only (never persisted)
  const [decryptedApiKey, setDecryptedApiKey] = useState(null)
  const [currentPassword, setCurrentPassword] = useState(null)

  // Session timeout refs
  const sessionTimeoutRef = useRef(null)
  const blurTimeoutRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        const hasSetup = await hasAuthSetup()
        const authData = await getAuthData()

        // Check for existing session
        const sessionData = sessionStorage.getItem(SESSION_KEY)
        let isAuthenticated = false

        if (sessionData && hasSetup) {
          const session = JSON.parse(sessionData)
          if (session.expiresAt > Date.now()) {
            isAuthenticated = true
            lastActivityRef.current = Date.now()
          } else {
            sessionStorage.removeItem(SESSION_KEY)
          }
        }

        setAuthState({
          isLoading: false,
          needsSetup: !hasSetup,
          isAuthenticated,
          authData
        })
      } catch (error) {
        console.error('Auth init error:', error)
        setAuthState({
          isLoading: false,
          needsSetup: true,
          isAuthenticated: false,
          authData: null
        })
      }
    }

    initAuth()
  }, [])

  // Session timeout management
  const resetSessionTimeout = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
    }

    if (authState.isAuthenticated) {
      // Update session expiry
      const session = { expiresAt: Date.now() + SESSION_TIMEOUT }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

      sessionTimeoutRef.current = setTimeout(() => {
        lock()
      }, SESSION_TIMEOUT)
    }
  }, [authState.isAuthenticated])

  // Track user activity
  useEffect(() => {
    if (!authState.isAuthenticated) return

    const handleActivity = () => {
      resetSessionTimeout()
    }

    window.addEventListener('click', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    // Initial timeout setup
    resetSessionTimeout()

    return () => {
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)

      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current)
      }
    }
  }, [authState.isAuthenticated, resetSessionTimeout])

  // Tab blur/focus handling for auto-lock
  useEffect(() => {
    if (!authState.isAuthenticated) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab lost focus - start blur timeout
        blurTimeoutRef.current = setTimeout(() => {
          lock()
        }, TAB_BLUR_TIMEOUT)
      } else {
        // Tab regained focus - clear blur timeout
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current)
          blurTimeoutRef.current = null
        }

        // Check if session is still valid
        const sessionData = sessionStorage.getItem(SESSION_KEY)
        if (sessionData) {
          const session = JSON.parse(sessionData)
          if (session.expiresAt <= Date.now()) {
            lock()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [authState.isAuthenticated])

  // Setup new account with password
  const setupAccount = useCallback(async (password, targetCalories = 2000) => {
    try {
      const { hash, salt } = await hashPassword(password)

      const authData = {
        passwordHash: hash,
        salt: salt,
        encryptedApiKey: null,
        apiKeyIV: null,
        biometricEnabled: false,
        biometricCredentialId: null,
        failedAttempts: 0,
        lockoutUntil: null,
        createdAt: Date.now(),
        targetCalories
      }

      await setAuthData(authData)

      // Create session
      const session = { expiresAt: Date.now() + SESSION_TIMEOUT }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

      setCurrentPassword(password)
      setAuthState({
        isLoading: false,
        needsSetup: false,
        isAuthenticated: true,
        authData
      })

      return { success: true }
    } catch (error) {
      console.error('Setup error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Login with password
  const loginWithPassword = useCallback(async (password) => {
    try {
      const authData = await getAuthData()

      if (!authData) {
        return { success: false, error: 'No account found' }
      }

      // Check lockout
      if (authData.lockoutUntil && authData.lockoutUntil > Date.now()) {
        const remainingSeconds = Math.ceil((authData.lockoutUntil - Date.now()) / 1000)
        return { success: false, error: `Too many attempts. Try again in ${remainingSeconds} seconds.`, locked: true }
      }

      // Verify password
      const isValid = await verifyPassword(password, authData.passwordHash, authData.salt)

      if (!isValid) {
        // Increment failed attempts
        const newFailedAttempts = (authData.failedAttempts || 0) + 1
        const updates = { failedAttempts: newFailedAttempts }

        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          updates.lockoutUntil = Date.now() + LOCKOUT_DURATION
          updates.failedAttempts = 0
        }

        await setAuthData({ ...authData, ...updates })

        if (updates.lockoutUntil) {
          return { success: false, error: `Too many attempts. Try again in 30 seconds.`, locked: true }
        }

        return { success: false, error: `Invalid password. ${MAX_FAILED_ATTEMPTS - newFailedAttempts} attempts remaining.` }
      }

      // Reset failed attempts on success
      await setAuthData({ ...authData, failedAttempts: 0, lockoutUntil: null })

      // Decrypt API key if exists
      let apiKey = null
      if (authData.encryptedApiKey && authData.apiKeyIV) {
        try {
          apiKey = await decryptData(
            authData.encryptedApiKey,
            authData.apiKeyIV,
            password,
            authData.salt
          )
        } catch (e) {
          console.error('Failed to decrypt API key:', e)
        }
      }

      // Create session
      const session = { expiresAt: Date.now() + SESSION_TIMEOUT }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

      setCurrentPassword(password)
      setDecryptedApiKey(apiKey)
      setAuthState({
        isLoading: false,
        needsSetup: false,
        isAuthenticated: true,
        authData
      })

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Login with biometrics
  const loginWithBiometric = useCallback(async () => {
    try {
      const authData = await getAuthData()

      if (!authData?.biometricEnabled || !authData?.biometricCredentialId) {
        return { success: false, error: 'Biometric not enabled' }
      }

      const authenticated = await authenticateBiometric(authData.biometricCredentialId)

      if (!authenticated) {
        return { success: false, error: 'Biometric authentication failed' }
      }

      // Create session
      const session = { expiresAt: Date.now() + SESSION_TIMEOUT }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

      // Note: We can't decrypt the API key without the password
      // The user will need to enter password once to unlock API key features
      setAuthState({
        isLoading: false,
        needsSetup: false,
        isAuthenticated: true,
        authData
      })

      return { success: true, needsPasswordForApiKey: !!authData.encryptedApiKey }
    } catch (error) {
      console.error('Biometric login error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Enable biometric authentication
  const enableBiometric = useCallback(async () => {
    try {
      const available = await isBiometricAvailable()
      if (!available) {
        return { success: false, error: 'Biometric authentication not available on this device' }
      }

      const authData = await getAuthData()
      const userId = `caltrack-${authData.createdAt}`
      const { credentialId } = await registerBiometric(userId)

      await setAuthData({
        ...authData,
        biometricEnabled: true,
        biometricCredentialId: credentialId
      })

      setAuthState(prev => ({
        ...prev,
        authData: { ...prev.authData, biometricEnabled: true, biometricCredentialId: credentialId }
      }))

      return { success: true }
    } catch (error) {
      console.error('Enable biometric error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Disable biometric authentication
  const disableBiometric = useCallback(async () => {
    try {
      const authData = await getAuthData()

      await setAuthData({
        ...authData,
        biometricEnabled: false,
        biometricCredentialId: null
      })

      setAuthState(prev => ({
        ...prev,
        authData: { ...prev.authData, biometricEnabled: false, biometricCredentialId: null }
      }))

      return { success: true }
    } catch (error) {
      console.error('Disable biometric error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Save API key (encrypt and store)
  const saveApiKey = useCallback(async (apiKey, password = currentPassword) => {
    try {
      if (!password) {
        return { success: false, error: 'Password required to encrypt API key' }
      }

      const authData = await getAuthData()
      const { encrypted, iv } = await encryptData(apiKey, password, authData.salt)

      await setAuthData({
        ...authData,
        encryptedApiKey: encrypted,
        apiKeyIV: iv
      })

      setDecryptedApiKey(apiKey)
      setAuthState(prev => ({
        ...prev,
        authData: { ...prev.authData, encryptedApiKey: encrypted, apiKeyIV: iv }
      }))

      return { success: true }
    } catch (error) {
      console.error('Save API key error:', error)
      return { success: false, error: error.message }
    }
  }, [currentPassword])

  // Unlock API key with password (for biometric login users)
  const unlockApiKey = useCallback(async (password) => {
    try {
      const authData = await getAuthData()

      if (!authData.encryptedApiKey || !authData.apiKeyIV) {
        return { success: false, error: 'No API key stored' }
      }

      // Verify password first
      const isValid = await verifyPassword(password, authData.passwordHash, authData.salt)
      if (!isValid) {
        return { success: false, error: 'Invalid password' }
      }

      const apiKey = await decryptData(
        authData.encryptedApiKey,
        authData.apiKeyIV,
        password,
        authData.salt
      )

      setCurrentPassword(password)
      setDecryptedApiKey(apiKey)

      return { success: true }
    } catch (error) {
      console.error('Unlock API key error:', error)
      return { success: false, error: 'Failed to decrypt API key' }
    }
  }, [])

  // Lock the app
  const lock = useCallback(() => {
    // Clear sensitive data from memory
    setDecryptedApiKey(null)
    setCurrentPassword(null)
    sessionStorage.removeItem(SESSION_KEY)

    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
    }

    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false
    }))
  }, [])

  // Delete all data
  const deleteAll = useCallback(async (password) => {
    try {
      const authData = await getAuthData()
      const isValid = await verifyPassword(password, authData.passwordHash, authData.salt)

      if (!isValid) {
        return { success: false, error: 'Invalid password' }
      }

      await deleteAllData()

      // Clear everything
      setDecryptedApiKey(null)
      setCurrentPassword(null)
      sessionStorage.removeItem(SESSION_KEY)

      setAuthState({
        isLoading: false,
        needsSetup: true,
        isAuthenticated: false,
        authData: null
      })

      return { success: true }
    } catch (error) {
      console.error('Delete all error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Check biometric availability
  const checkBiometricAvailable = useCallback(async () => {
    return await isBiometricAvailable()
  }, [])

  const value = {
    ...authState,
    decryptedApiKey,
    hasApiKey: !!authState.authData?.encryptedApiKey,
    needsApiKeyUnlock: authState.isAuthenticated && authState.authData?.encryptedApiKey && !decryptedApiKey,
    setupAccount,
    loginWithPassword,
    loginWithBiometric,
    enableBiometric,
    disableBiometric,
    saveApiKey,
    unlockApiKey,
    lock,
    deleteAll,
    checkBiometricAvailable
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
