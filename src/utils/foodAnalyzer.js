/**
 * Analyze a food image using Claude API
 * @param {string} base64Image - Base64 encoded image (without data URL prefix)
 * @param {string} mediaType - Image media type (e.g., 'image/jpeg', 'image/png')
 * @param {string} apiKey - The Claude API key
 * @returns {Promise<object>} - Analyzed food data
 */
export async function analyzeFoodImage(base64Image, mediaType = 'image/jpeg', apiKey) {
  if (!apiKey) {
    throw new Error('API key not configured. Please add your Claude API key in settings.')
  }

  const prompt = `Analyze this food image and estimate the nutritional content. Return ONLY a valid JSON object with no additional text or markdown formatting.

The JSON should have this exact structure:
{
  "foods": [
    {
      "name": "food item name",
      "portion": "estimated portion size (e.g., '1 cup', '200g', '1 medium')",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams)
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "confidence": "high" | "medium" | "low",
  "notes": "any relevant notes about the estimation"
}

Be as accurate as possible with your estimates. If you cannot identify a food item clearly, still provide your best estimate and set confidence to "low".`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      throw new Error('No response from API')
    }

    // Parse the JSON response
    try {
      // Try to extract JSON from the response (in case there's any extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse API response:', content)
      throw new Error('Failed to parse food analysis response')
    }
  } catch (error) {
    console.error('Food analysis error:', error)
    throw error
  }
}

/**
 * Convert a File to base64
 * @param {File} file - The image file
 * @returns {Promise<{base64: string, mediaType: string}>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      // Extract base64 data without the data URL prefix
      const base64 = dataUrl.split(',')[1]
      resolve({
        base64,
        mediaType: file.type || 'image/jpeg'
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
