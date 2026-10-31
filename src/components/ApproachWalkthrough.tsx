import { useEffect, useState } from 'react'
import { compareApproaches, comparisonInput } from '../lib/duplicateWorkshop'

export default function ApproachWalkthrough({repeats,onFinish}:{repeats:boolean;onFinish:()=>void}) {
  const [selected,setSelected]=useState(0),[hovered,setHovered]=useState<number|null>(null)
  const step=hovered??selected
  const values=comparisonInput(5,repeats),before=values.slice(0,Math.max(0,step-1)),current=values[step-1]
  const checked=values.slice(0,step),counts=compareApproaches(checked),found=step>0&&before.includes(current)
  const comparisons=found?before.slice(0,before.indexOf(current)+1):before
  useEffect(()=>{if(step===5)onFinish()},[step,onFinish])
  const finished=step===5
  return <div className="approach-demo" aria-label="Five-number comparison walkthrough">
    <h5>Hover over a number to explore it.</h5><p>Both methods ask: “Have I seen this number before?” A normal list checks its saved numbers one by one. A <strong>Set</strong> is a collection that lets us ask that question directly.</p>
    <p>Move your pointer over any number to see its checks. Move away to end the preview. Click or tap a number to keep it selected; keyboard users can focus a number too.</p>
    <div className="demo-number-row" aria-label="Numbers to check">{values.map((n,i)=><button type="button" aria-label={`Explore number ${n} at position ${i+1}`} aria-pressed={selected===i+1} className={i===step-1?'is-active':i<step?'is-done':''} key={i} onPointerEnter={e=>{if(e.pointerType!=='touch')setHovered(i+1)}} onPointerLeave={()=>setHovered(null)} onFocus={()=>setHovered(i+1)} onBlur={()=>setHovered(null)} onClick={()=>setSelected(i+1)}>{n}</button>)}</div>
    <div className="lab-actions"><button onClick={()=>{setSelected(0);setHovered(null)}}>Clear selection</button></div>
    <div className="lab-comparison" key={step}>
      <article><p>METHOD 1 · SAVED LIST</p><h5>Compare one by one</h5><p>Saved before this number: [{before.join(', ')}]</p><div className="demo-pairs">{step===0?'Hover over a number above to start.':comparisons.length?comparisons.map((n,i)=><span key={i}>{current} = {n}? {current===n?'Yes':'No'}</span>):'Nothing saved yet. No pair to compare.'}</div><strong>{counts.listComparisons}</strong><span>number pairs compared so far</span></article>
      <article><p>METHOD 2 · SET</p><h5>Ask if it is already saved</h5><p>A Set remembers which numbers appeared earlier.</p><div className="demo-pairs">{step===0?'No question asked yet.':<span>Have we saved {current} before? {found?'Yes — a repeat!':'No — save it now.'}</span>}</div><strong>{counts.setMembershipCalls}</strong><span>“already saved?” questions so far</span></article>
    </div>
    <p className="lab-feedback" role="status">{!step?'Start with an empty collection.':found?`${current} appeared earlier. Both methods find a repeat and stop.`:`${current} is new. Save it before checking the next number.`}{finished&&!found?' All five were different, so the answer is false (no repeat).':''}</p>
    <p className="lab-caption">Nothing plays automatically. These counters explain different activities, not a speed race. A Set question still involves work inside the computer.</p>
  </div>
}
