import { isLlmConfigured } from '@/lib/llm'

export type VisionMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

export function isVisionConfigured(): boolean {
  return isLlmConfigured()
}

export function mediaTypeFromMime(mime: string): VisionMediaType | null {
  if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp') {
    return mime
  }
  return null
}

export async function analyzeImage(params: {
  imageBase64: string
  mediaType: VisionMediaType
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    const text = await callAnthropicVision(anthropicKey, params)
    if (text) return text
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    return callOpenAIVision(openaiKey, params)
  }

  return null
}

async function callAnthropicVision(
  apiKey: string,
  params: {
    imageBase64: string
    mediaType: VisionMediaType
    systemPrompt: string
    userPrompt: string
    maxTokens?: number
  },
): Promise<string | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_VISION_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: params.maxTokens ?? 500,
        temperature: 0.1,
        system: params.systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: params.mediaType,
                data: params.imageBase64,
              },
            },
            { type: 'text', text: params.userPrompt },
          ],
        }],
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    return json.content?.[0]?.text?.trim() ?? null
  } catch {
    return null
  }
}

async function callOpenAIVision(
  apiKey: string,
  params: {
    imageBase64: string
    mediaType: VisionMediaType
    systemPrompt: string
    userPrompt: string
    maxTokens?: number
  },
): Promise<string | null> {
  try {
    const dataUrl = `data:${params.mediaType};base64,${params.imageBase64}`
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        max_tokens: params.maxTokens ?? 500,
        temperature: 0.1,
        messages: [
          { role: 'system', content: params.systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text', text: params.userPrompt },
            ],
          },
        ],
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}
