import type { TabId } from '../../App'
import { useEffect, useRef, useState } from 'react'

const TOOLS: { number: string; title: string; description: string; tab: TabId }[] = [
  { number: '01', title: 'The practice room', description: 'Talk through a problem. Take it one idea at a time.', tab: 'practice' },
  { number: '02', title: 'The pattern map', description: 'Connect familiar ideas to unfamiliar problems.', tab: 'constellation' },
  { number: '03', title: 'The code desk', description: 'Look closer at the time and space your code needs.', tab: 'complexity' },
  { number: '04', title: 'Your field notes', description: 'Keep the explanations that finally made sense.', tab: 'knowledge' },
]

export default function FieldHome({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const homeRef = useRef<HTMLDivElement>(null)
  const [example, setExample] = useState(0)
  const [prediction, setPrediction] = useState<boolean | null>(null)
  const examples = [[2,5,2], [2,5,8], [0,-1,0], [7]]
  const values = examples[example]
  const hasRepeat = new Set(values).size !== values.length
  useEffect(() => {
    const root = homeRef.current
    if (!root || !('IntersectionObserver' in window)) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' })
    const update = () => {
      observer.disconnect()
      if (preference.matches) { root.removeAttribute('data-motion-ready'); return }
      root.setAttribute('data-motion-ready', '')
      root.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(element => observer.observe(element))
    }
    update()
    preference.addEventListener('change', update)
    return () => { observer.disconnect(); preference.removeEventListener('change', update); root.removeAttribute('data-motion-ready') }
  }, [])
  return <div className="field-home" ref={homeRef}>
    <section className="field-hero" aria-labelledby="field-title">
      <div className="field-intro">
        <p className="field-kicker"><span>PatternOS</span> / A field guide to problem solving</p>
        <h1 id="field-title">Good thinking<br />takes <em>practice.</em></h1>
        <p className="field-description">Somewhere between reading a solution and understanding it, there’s a moment when it clicks. Let’s work towards that.</p>
        <div className="field-actions"><button className="field-primary" onClick={() => onNavigate('practice')}>Find your starting point <span aria-hidden="true">↗</span></button><a className="field-secondary" href="#inside">Take a look inside <span aria-hidden="true">↓</span></a></div>
        <p className="field-footnote">Start with an idea. The code can come later.</p>
      </div>
      <aside className="field-note" aria-label="A worked example of duplicate detection">
        <div className="field-note-header"><span>FROM THE WORKBOOK</span><span>NO. 001</span></div>
        <div className="field-note-body">
          <p className="field-note-category">Observation / Repeated values</p>
          <h2>Have we seen<br />this before?</h2>
          <div className="field-array" aria-label="The values 4, 7, and 4; the first and last match"><span className="field-match">4</span><span>7</span><span className="field-match">4</span></div>
          <p className="field-annotation">same value, different place</p>
          <p className="field-note-explanation">The last 4 matches the first. That’s all the evidence we need to know a repeat exists.</p>
          <div className="field-note-answer"><span>THE IDEA</span><strong>Check what came before.</strong></div>
        </div>
        <div className="field-note-footer">A small example. A useful pattern.</div>
      </aside>
    </section>
    <section className="field-method" aria-label="How to learn here"><div data-reveal><span>01 / NOTICE</span><p>Work with a small example.</p></div><div data-reveal><span>02 / EXPLAIN</span><p>Put the idea in your own words.</p></div><div data-reveal><span>03 / APPLY</span><p>Try it somewhere new.</p></div></section>
    <section id="inside" className="field-contents" aria-labelledby="contents-title">
      <div className="field-contents-intro" data-reveal><p className="field-kicker">Your workspace</p><h2 id="contents-title">Four ways<br />to get unstuck.</h2><p>Use what you need.<br />Leave room for your own approach.</p></div>
      <div className="field-tool-list">{TOOLS.map(tool => <button data-reveal key={tool.tab} onClick={() => onNavigate(tool.tab)} className="field-tool"><span className="field-tool-number">{tool.number}</span><span><strong>{tool.title}</strong><span className="field-tool-description">{tool.description}</span></span><span className="field-tool-arrow" aria-hidden="true">↗</span></button>)}</div>
    </section>
    <section className="field-mini-lab" aria-labelledby="mini-lab-title" data-reveal>
      <div><p className="field-kicker">A thirty-second experiment</p><h2 id="mini-lab-title">Try the idea.<br />No code needed.</h2><p>Look at the values. Does anything appear more than once?</p></div>
      <div className="field-mini-exercise">
        <div className="field-mini-values" aria-label={`Example values: ${values.join(', ')}`}>{values.map((value,index) => <span key={`${example}-${index}`}>{value}</span>)}</div>
        <div className="field-mini-actions"><button onClick={() => setPrediction(true)}>There’s a repeat</button><button onClick={() => setPrediction(false)}>All different</button></div>
        <p role="status" className="field-mini-feedback">{prediction === null ? 'Make a prediction, then see why.' : prediction === hasRepeat ? hasRepeat ? 'Exactly. Two positions contain the same value, so the answer is true.' : 'Every value is different. After checking them all, the answer is false.' : hasRepeat ? 'Look again: the first and last values match. That gives us a repeat.' : 'Check each position: none matches an earlier value. There is no repeat.'}</p>
        <button className="field-mini-next" onClick={() => { setExample((example + 1) % examples.length); setPrediction(null) }}>Try another example <span aria-hidden="true">↗</span></button>
      </div>
    </section>
    <section className="field-pace" aria-labelledby="pace-title">
      <div className="field-pace-heading" data-reveal><p className="field-kicker">Choose your depth</p><h2 id="pace-title">There’s more than one<br />way to make progress.</h2></div>
      <div className="field-pace-grid"><article data-reveal><span>01 / UNDERSTAND</span><h3>Make it click.</h3><p>Start with an analogy, an unfamiliar word, or one small example. You can learn the idea without writing code.</p></article><article data-reveal><span>02 / MAKE A PLAN</span><h3>Find your own route.</h3><p>Explain the steps in plain language. Compare approaches and work out what you need to remember.</p></article><article data-reveal><span>03 / BUILD IT</span><h3>Put it into practice.</h3><p>When you’re ready, move into coding. Conceptual understanding and coding practice stay separate.</p></article></div>
      <button className="field-secondary" onClick={() => onNavigate('practice')}>Choose a goal in Practice <span aria-hidden="true">↗</span></button>
    </section>
    <section className="field-questions" aria-labelledby="questions-title" data-reveal>
      <div><p className="field-kicker">Before you begin</p><h2 id="questions-title">A few useful answers.</h2></div>
      <div><details><summary>Do I need to know programming already?</summary><p>No. Start with the concept goal and quick explanations. The visual workshop lets you practise reasoning before coding.</p></details><details><summary>Will it work on a basic laptop?</summary><p>The core lessons and exercises need no AI model. Light uses the smallest compatible GPU model, and CPU Light is an optional processor-based model for browsers without a usable GPU. First use needs a model download; performance depends on your device.</p></details><details><summary>Where do my conversations go?</summary><p>Chats and progress are saved in this browser. Browser AI processes your messages on your device; downloaded model files are separate from your saved lessons. Clearing browser data can remove your history.</p></details></div>
    </section>
    <footer className="field-footer" data-reveal><span className="field-wordmark">PatternOS<span>.</span></span><p>A little less memorising.<br />A little more making sense.</p><button onClick={() => onNavigate('practice')}>Back to the work <span aria-hidden="true">↗</span></button></footer>
  </div>
}
