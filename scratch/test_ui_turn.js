import { liteRespond, evaluateDialogueStep } from '../src/lib/liteSocratic.js'
import { PROBLEMS } from '../src/data/problems.js'

const cdProblem = PROBLEMS.find(p => p.slug === 'contains-duplicate')

const welcomeMsg = `**Contains Duplicate** (Easy · Foundations)

Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.

\`\`\`
Example 1: nums = [1,2,3,1] → true
Example 2: nums = [1,2,3,4] → false
\`\`\`

Constraints: 1 ≤ nums.length ≤ 10⁵, -10⁹ ≤ nums[i] ≤ 10⁹

---
Where would you like to start? What stands out about the inputs or what the problem is asking for?
<!--lite:{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING","returnStack":[]}-->`

console.log('=== TEST 1: User says "I\'d compare each number with the others." on Turn 1 ===')
const history1 = [{ role: 'assistant', content: welcomeMsg }]
const userMsg1 = "I'd compare each number with the others."
const nextMessages1 = [...history1, { role: 'user', content: userMsg1 }]
const res1 = liteRespond(userMsg1, cdProblem, nextMessages1)
const visible1 = res1.replace(/<!--lite:[\s\S]*?-->/, '').trim()
console.log(`Visible Response 1:\n"${visible1}"`)

if (visible1.includes('Where would you like to start')) {
  console.error('FAIL: Outputted initial message again!')
} else {
  console.log('PASS: Progressed to Socratic response!')
}

console.log('\n=== TEST 2: User says "what the problem is asking for" ===')
const history2 = [{ role: 'assistant', content: welcomeMsg }]
const userMsg2 = "what the problem is asking for"
const nextMessages2 = [...history2, { role: 'user', content: userMsg2 }]
const res2 = liteRespond(userMsg2, cdProblem, nextMessages2)
const visible2 = res2.replace(/<!--lite:[\s\S]*?-->/, '').trim()
console.log(`Visible Response 2:\n"${visible2}"`)

if (visible2.includes('Where would you like to start')) {
  console.error('FAIL: Outputted initial message again!')
} else {
  console.log('PASS: Progressed to Socratic response!')
}
