export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatCompletionOptions = {
  maxTokens?: number
  temperature?: number
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatCompletionOptions = {},
): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    const text = await callAnthropic(anthropicKey, messages, opts)
    if (text) return text
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    return callOpenAI(openaiKey, messages, opts)
  }

  return null
}

async function callAnthropic(
  apiKey: string,
  messages: ChatMessage[],
  opts: ChatCompletionOptions,
): Promise<string | null> {
  const system = messages.find(m => m.role === 'system')?.content
  const conversation = messages.filter(m => m.role !== 'system')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: opts.maxTokens ?? 200,
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
        ...(system ? { system } : {}),
        messages: conversation.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    return json.content?.[0]?.text?.trim() ?? null
  } catch {
    return null
  }
}

async function callOpenAI(
  apiKey: string,
  messages: ChatMessage[],
  opts: ChatCompletionOptions,
): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        max_tokens: opts.maxTokens ?? 200,
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
        messages,
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}
