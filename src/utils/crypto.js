/**
 * Cryptographic utilities using Web Crypto API
 * - Password hashing with PBKDF2
 * - AES-256-GCM encryption/decryption
 * - Key derivation for API key encryption
 */

const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12

/**
 * Generate a random salt
 */
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * Generate a random IV for AES-GCM
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Derive a key from password using PBKDF2
 * @param {string} password - The password
 * @param {Uint8Array} salt - The salt
 * @param {string} usage - Key usage ('hash' for password hashing, 'encrypt' for encryption)
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt, usage) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    usage === 'encrypt'
      ? { name: 'AES-GCM', length: 256 }
      : { name: 'HMAC', hash: 'SHA-256' },
    true,
    usage === 'encrypt' ? ['encrypt', 'decrypt'] : ['sign']
  )

  return key
}

/**
 * Hash a password using PBKDF2
 * @param {string} password - The password to hash
 * @param {Uint8Array} [existingSalt] - Optional existing salt (for verification)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || generateSalt()
  const key = await deriveKey(password, salt, 'hash')

  // Export the key to get the hash
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  const hashBuffer = new Uint8Array(exportedKey)

  return {
    hash: bufferToBase64(hashBuffer),
    salt: bufferToBase64(salt)
  }
}

/**
 * Verify a password against a stored hash
 * @param {string} password - The password to verify
 * @param {string} storedHash - The stored hash (base64)
 * @param {string} storedSalt - The stored salt (base64)
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash, storedSalt) {
  const salt = new Uint8Array(base64ToBuffer(storedSalt))
  const { hash } = await hashPassword(password, salt)
  return hash === storedHash
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - The data to encrypt
 * @param {string} password - The password to derive encryption key from
 * @param {string} salt - The salt (base64) used for key derivation
 * @returns {Promise<{encrypted: string, iv: string}>}
 */
export async function encryptData(plaintext, password, salt) {
  const saltBuffer = new Uint8Array(base64ToBuffer(salt))
  const key = await deriveKey(password, saltBuffer, 'encrypt')
  const iv = generateIV()

  const encoder = new TextEncoder()
  const plaintextBuffer = encoder.encode(plaintext)

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBuffer
  )

  return {
    encrypted: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv)
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encrypted - The encrypted data (base64)
 * @param {string} iv - The IV (base64)
 * @param {string} password - The password to derive decryption key from
 * @param {string} salt - The salt (base64) used for key derivation
 * @returns {Promise<string>}
 */
export async function decryptData(encrypted, iv, password, salt) {
  const saltBuffer = new Uint8Array(base64ToBuffer(salt))
  const key = await deriveKey(password, saltBuffer, 'encrypt')
  const ivBuffer = new Uint8Array(base64ToBuffer(iv))
  const encryptedBuffer = base64ToBuffer(encrypted)

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    encryptedBuffer
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported() {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  )
}

/**
 * Check if platform authenticator (biometrics) is available
 */
export async function isBiometricAvailable() {
  if (!isWebAuthnSupported()) return false

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch {
    return false
  }
}

/**
 * Register a biometric credential
 * @param {string} userId - Unique user identifier
 * @returns {Promise<{credentialId: string, publicKey: string}>}
 */
export async function registerBiometric(userId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const publicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'CalTrack',
      id: window.location.hostname
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: 'caltrack-user',
      displayName: 'CalTrack User'
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256
      { alg: -257, type: 'public-key' }  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred'
    },
    timeout: 60000,
    attestation: 'none'
  }

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions
  })

  return {
    credentialId: bufferToBase64(credential.rawId),
    publicKey: bufferToBase64(credential.response.getPublicKey?.() || new ArrayBuffer(0))
  }
}

/**
 * Authenticate using biometric credential
 * @param {string} credentialId - The stored credential ID (base64)
 * @returns {Promise<boolean>}
 */
export async function authenticateBiometric(credentialId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const publicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [{
      id: base64ToBuffer(credentialId),
      type: 'public-key',
      transports: ['internal']
    }],
    userVerification: 'required',
    timeout: 60000
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    })

    return !!assertion
  } catch {
    return false
  }
}
