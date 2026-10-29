// Keep prerequisite questions local to their clause: acknowledging a term is
// different from asking to learn it, even when another clause says "no idea".
export function asksAboutPrerequisite(text: string, term: 'array' | 'loop' | 'set'): boolean {
  const word = new RegExp(`\\b${term}s?\\b`, 'i')
  return text.toLowerCase().split(/[.!?;]|\bbut\b/).some(clause => {
    if (!word.test(clause)) return false
    if (/\bi\s+(?:(?:now|already)\s+)?(?:understand|know|get)\b/.test(clause)) return false
    const definition = new RegExp(`\\b(?:what (?:is|are)|define|explain|meaning of)\\s+(?:(?:a|an|the)\\s+)?${term}s?\\b|\\bwhat\\s+(?:(?:a|an|the)\\s+)?${term}s?\\s+(?:is|are|means?)\\b`, 'i')
    return definition.test(clause) || /\b(?:dont know|don't know|dont understand|don't understand|not understand|no idea|unfamiliar|never (?:used|heard))\b/.test(clause)
  })
}

export function concreteMembershipStep(text: string): string | undefined {
  if (!/\?|\b(?:check|compare|seen|already|before)\b/i.test(text)) return undefined
  const seen = text.match(/\b(?:seen\s+(?:list|box|set)|list\s+of\s+(?:seen|earlier)\s+(?:values|numbers))\s*(?:is|contains|=|:)\s*\[\s*(-?\d+(?:\s*,\s*-?\d+)*)?\s*\]/i)
  const next = text.match(/\b(?:next|current)\s+(?:number|value|item)\s*(?:is|=|:)\s*(-?\d+)\b/i)
  if (!seen || !next) return undefined
  const values = seen[1] ? seen[1].split(',').map(Number) : []
  const value = Number(next[1])
  if (values.length > 12 || ![...values, value].every(Number.isSafeInteger)) return undefined
  const list = `[${values.join(',')}]`
  return `Check whether ${value} is already in your seen list ${list}. ${values.includes(value) ? `It is already there, so ${value} matches an earlier occurrence.` : `It is not there, so ${value} has not been seen before.`} We can stop at that check for now.`
}

export function membershipOrderExplanation(text: string): string | undefined {
  if (concreteMembershipStep(text) && !/\b(?:wrong|why|itself|instead|reverse)\b/i.test(text)) return undefined
  if (!/\b(?:add|adding|insert|inserting|put)\b/i.test(text)
    || !/\b(?:check|checking|test|membership|look|seen)\b/i.test(text)
    || !/\b(?:first|before|after|order|itself)\b/i.test(text)) return undefined
  const first = Number(text.match(/\[\s*(-?\d+)(?:\s*[,\]])/)?.[1] ?? '4')
  if (!Number.isSafeInteger(first)) return undefined
  return `Start with an empty Set. If you add the first ${first} before checking, the Set now contains ${first}, so the membership check answers yes even though no earlier ${first} existed. That falsely reports a duplicate by matching the current occurrence itself. Check membership before adding the current value.`
}

export function concreteSingleStep(text: string, fallback = false): string | undefined {
  const continuing = concreteMembershipStep(text)
  if (continuing) return continuing
  if (!fallback && !/\b(?:one|single|first)\s+(?:small\s+)?(?:action|step|comparison)\b/i.test(text)) return undefined
  const example = text.match(/\[\s*(-?\d+(?:\s*,\s*-?\d+)*)\s*\]/)
  if (!example && !fallback) return undefined
  const values = example ? example[1].split(',').map(Number) : [4, 7, 4]
  if (values.length > 12 || !values.every(Number.isSafeInteger)) return undefined
  const input = `[${values.join(',')}]`
  const first = values[0]
  if (/\bcompar(?:e|ison)\b/i.test(text) && values.length > 1) {
    return `For ${input}, compare only the first ${first} with the next value, ${values[1]}. ${first === values[1] ? 'Those two positions match, so this comparison finds a repeat.' : 'They differ, so this pair does not show a repeat.'} Leave any remaining positions for later.`
  }
  return `For ${input}, start with an empty "seen" list. Write down only the first value, ${first}; the list is now [${first}]. Leave the remaining positions for later.`
}
