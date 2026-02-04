const SETTINGS_KEY = 'caltrack_settings'

const defaultSettings = {
  apiKey: '',
  targetCalories: 2000
}

export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return defaultSettings
}

export function saveSettings(settings) {
  try {
    const current = getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error('Failed to save settings:', e)
    throw e
  }
}

export function getApiKey() {
  return getSettings().apiKey
}

export function setApiKey(apiKey) {
  return saveSettings({ apiKey })
}

export function hasApiKey() {
  const key = getApiKey()
  return key && key.length > 0
}
