/**
 * Gemini-powered expense category classifier.
 * Groups raw expense purposes into meaningful categories like
 * Food, Transport, Shopping, Health, etc.
 *
 * Falls back to a fast keyword-based classifier when the API
 * is unavailable or rate-limited.
 */

// ─── Category definitions ─────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'food',          label: 'Food & Dining',      emoji: '🍽️',  color: '#f59e0b' },
  { id: 'transport',     label: 'Transport',           emoji: '🚌',  color: '#3b82f6' },
  { id: 'shopping',      label: 'Shopping',            emoji: '🛍️',  color: '#ec4899' },
  { id: 'health',        label: 'Health & Medical',    emoji: '🏥',  color: '#10b981' },
  { id: 'entertainment', label: 'Entertainment',       emoji: '🎬',  color: '#8b5cf6' },
  { id: 'education',     label: 'Education',           emoji: '📚',  color: '#06b6d4' },
  { id: 'utilities',     label: 'Utilities & Bills',   emoji: '💡',  color: '#64748b' },
  { id: 'groceries',     label: 'Groceries',           emoji: '🛒',  color: '#84cc16' },
  { id: 'personal',      label: 'Personal Care',       emoji: '💆',  color: '#f97316' },
  { id: 'travel',        label: 'Travel',              emoji: '✈️',  color: '#0ea5e9' },
  { id: 'rent',          label: 'Rent & Housing',      emoji: '🏠',  color: '#6366f1' },
  { id: 'investment',    label: 'Investment & Savings', emoji: '💰', color: '#22c55e' },
  { id: 'other',         label: 'Other',               emoji: '📦',  color: '#94a3b8' },
] as const

export type CategoryId = typeof CATEGORIES[number]['id']

export interface CategoryInfo {
  id:    CategoryId
  label: string
  emoji: string
  color: string
}

export function getCategoryInfo(id: CategoryId): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

// ─── Keyword fallback ─────────────────────────────────────────────────────────

const KEYWORD_MAP: Record<CategoryId, string[]> = {
  food:          ['lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'cafe', 'coffee', 'tea', 'snack', 'meal', 'eat', 'biryani', 'pizza', 'burger', 'hotel', 'canteen', 'tiffin', 'swiggy', 'zomato', 'dine'],
  transport:     ['bus', 'train', 'auto', 'cab', 'taxi', 'uber', 'ola', 'metro', 'fare', 'petrol', 'diesel', 'fuel', 'bike', 'car', 'vehicle', 'transport', 'travel', 'ticket', 'railway', 'flight', 'rapido'],
  shopping:      ['shop', 'buy', 'purchase', 'cloth', 'shirt', 'pant', 'dress', 'shoes', 'amazon', 'flipkart', 'myntra', 'mall', 'market', 'store', 'fashion', 'accessories'],
  health:        ['medicine', 'doctor', 'hospital', 'clinic', 'pharmacy', 'medical', 'health', 'tablet', 'injection', 'test', 'lab', 'dental', 'eye', 'consultation'],
  entertainment: ['movie', 'cinema', 'theatre', 'game', 'netflix', 'spotify', 'youtube', 'concert', 'show', 'event', 'party', 'fun', 'entertainment', 'outing'],
  education:     ['book', 'course', 'class', 'tuition', 'school', 'college', 'fee', 'exam', 'study', 'education', 'coaching', 'udemy', 'coursera'],
  utilities:     ['electricity', 'water', 'gas', 'internet', 'wifi', 'mobile', 'recharge', 'bill', 'utility', 'broadband', 'dth', 'subscription'],
  groceries:     ['grocery', 'vegetable', 'fruit', 'milk', 'egg', 'rice', 'dal', 'oil', 'supermarket', 'bigbasket', 'blinkit', 'zepto', 'instamart'],
  personal:      ['haircut', 'salon', 'spa', 'gym', 'fitness', 'cosmetic', 'beauty', 'personal', 'hygiene', 'soap', 'shampoo'],
  travel:        ['hotel', 'resort', 'trip', 'tour', 'holiday', 'vacation', 'stay', 'airbnb', 'booking', 'oyo'],
  rent:          ['rent', 'house', 'flat', 'apartment', 'maintenance', 'society', 'pg', 'hostel'],
  investment:    ['investment', 'mutual fund', 'sip', 'stock', 'share', 'saving', 'fd', 'rd', 'insurance', 'premium'],
  other:         [],
}

function classifyByKeyword(purpose: string): CategoryId {
  const lower = purpose.toLowerCase()
  for (const [catId, keywords] of Object.entries(KEYWORD_MAP) as [CategoryId, string[]][]) {
    if (catId === 'other') continue
    if (keywords.some((kw) => lower.includes(kw))) return catId
  }
  return 'other'
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, CategoryId>()

// ─── Gemini batch classifier ──────────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const CATEGORY_IDS = CATEGORIES.map((c) => c.id).join(', ')

/**
 * Classify a batch of expense purposes using Gemini.
 * Returns a map of purpose → categoryId.
 * Falls back to keyword matching on any error.
 */
export async function classifyExpenses(
  purposes: string[],
): Promise<Map<string, CategoryId>> {
  const result = new Map<string, CategoryId>()
  const toClassify: string[] = []

  // Use cache first
  for (const p of purposes) {
    const cached = cache.get(p.toLowerCase())
    if (cached) result.set(p, cached)
    else toClassify.push(p)
  }

  if (toClassify.length === 0) return result

  // Try Gemini
  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are an expense categorizer. Given a list of expense descriptions, classify each one into exactly one of these categories: ${CATEGORY_IDS}.

Rules:
- "bus fare", "train ticket", "auto", "cab", "petrol" → transport
- "lunch", "dinner", "restaurant", "coffee", "swiggy" → food
- "grocery", "vegetables", "milk", "supermarket" → groceries
- "medicine", "doctor", "hospital" → health
- "movie", "netflix", "game" → entertainment
- "book", "course", "tuition" → education
- "electricity", "internet", "recharge", "bill" → utilities
- "haircut", "gym", "salon" → personal
- "hotel", "trip", "vacation" → travel
- "rent", "flat", "pg" → rent
- "mutual fund", "sip", "insurance" → investment
- anything else → other

Respond ONLY with a JSON object mapping each description to its category id. No explanation.

Descriptions:
${toClassify.map((p, i) => `${i + 1}. "${p}"`).join('\n')}`

      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 512 },
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        // Extract JSON from response (may be wrapped in ```json ... ```)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>
          // Map by index (Gemini returns "1": "food", "2": "transport", etc.)
          // or by the description text itself
          toClassify.forEach((purpose, idx) => {
            const key = String(idx + 1)
            const raw = (parsed[key] ?? parsed[purpose] ?? '').toLowerCase().trim() as CategoryId
            const catId = CATEGORIES.find((c) => c.id === raw)?.id ?? classifyByKeyword(purpose)
            cache.set(purpose.toLowerCase(), catId)
            result.set(purpose, catId)
          })
          return result
        }
      }
    } catch {
      // Fall through to keyword fallback
    }
  }

  // Keyword fallback
  for (const purpose of toClassify) {
    const catId = classifyByKeyword(purpose)
    cache.set(purpose.toLowerCase(), catId)
    result.set(purpose, catId)
  }

  return result
}
