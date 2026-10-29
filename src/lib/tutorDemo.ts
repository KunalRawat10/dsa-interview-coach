export const TUTOR_ACTIONS = [
  { label:'One small step', prompt:'Use my current workshop example and state. Show just the next small action and why it is needed. Do not finish the algorithm or give code.' },
  { label:'Another analogy', prompt:'Explain the idea I am working on using a simple everyday analogy. Connect it back to my current example, then ask one short question. Do not give the full solution.' },
  { label:'Check my understanding', prompt:'Ask me one prediction about my current workshop step, without revealing the answer. Wait for my response before explaining it. Do not claim that I have mastered the topic.' },
  { label:'Compare approaches', prompt:'Help me compare two approaches to the current problem. Explain one trade-off at a time, starting with what information the required output needs. No code yet.' },
] as const
export function exportTutorTranscript(title:string,messages:readonly {role:string;content:string}[]) {
  return `# PatternOS tutor session\n\nProblem: ${title}\n\nThis transcript records a conversation, not verified mastery or code execution.\n\n`+messages.map(m=>`## ${m.role==='user'?'Student':'Tutor'}\n\n${m.content.replace(/<!--(?:lite|lesson):[\s\S]*?-->/g,'').trim()}`).join('\n\n')+'\n'
}
