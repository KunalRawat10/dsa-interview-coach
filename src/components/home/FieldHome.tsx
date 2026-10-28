import type { TabId } from '../../App'
import { useEffect, useRef } from 'react'

const TOOLS: { number: string; title: string; description: string; tab: TabId }[] = [
  { number: '01', title: 'The practice room', description: 'Talk through a problem. Take it one idea at a time.', tab: 'practice' },
  { number: '02', title: 'The pattern map', description: 'Connect familiar ideas to unfamiliar problems.', tab: 'constellation' },
  { number: '03', title: 'The code desk', description: 'Look closer at the time and space your code needs.', tab: 'complexity' },
  { number: '04', title: 'Your field notes', description: 'Keep the explanations that finally made sense.', tab: 'knowledge' },
]

export default function FieldHome({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const homeRef = useRef<HTMLDivElement>(null)
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
    <footer className="field-footer" data-reveal><span className="field-wordmark">PatternOS<span>.</span></span><p>A little less memorising.<br />A little more making sense.</p><button onClick={() => onNavigate('practice')}>Back to the work <span aria-hidden="true">↗</span></button></footer>
  </div>
}
