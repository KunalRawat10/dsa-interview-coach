// Keep prerequisite questions local to their clause: acknowledging a term is
// different from asking to learn it, even when another clause says "no idea".
export function asksAboutPrerequisite(text: string, term: 'array' | 'loop' | 'set'): boolean {
  const word = new RegExp(`\\b${term}s?\\b`, 'i')
  return text.toLowerCase().split(/[.!?;]|\bbut\b/).some(clause => {
    if (!word.test(clause)) return false
    if (/\bi\s+(?:(?:now|already)\s+)?(?:understand|know|get)\b/.test(clause)) return false
    return /\b(?:what|define|meaning|means|explain|teach|dont know|don't know|dont understand|don't understand|not understand|no idea|unfamiliar|never (?:used|heard))\b/.test(clause)
  })
}
