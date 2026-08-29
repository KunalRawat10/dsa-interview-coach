const steps = [
  { label: 'Learn', desc: 'Study a pattern and its structure' },
  { label: 'Practice', desc: 'Apply the pattern to real problems' },
  { label: 'Understand', desc: 'Find the invariant — the why' },
  { label: 'Connect', desc: 'Link it to related patterns in Constellation' },
  { label: 'Remember', desc: 'Save insights to your Knowledge Base' },
  { label: 'Apply', desc: 'Recognize the same structure in a new problem' },
]

const loopNodes = [
  { label: 'Learn', desc: 'Study patterns', color: '#4B8FE7' },
  { label: 'Practice', desc: 'Solve problems', color: '#71A8F6' },
  { label: 'Understand', desc: 'Find invariants', color: '#C9A961' },
  { label: 'Connect', desc: 'Link patterns', color: '#D4BC85' },
  { label: 'Remember', desc: 'Save knowledge', color: '#22C55E' },
  { label: 'Apply', desc: 'New problems', color: '#4ADE80' },
]

export default function Loop() {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center">
          <div className="section-label mb-4">The Complete Loop</div>
          <h2 className="mx-auto max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-paper-50">
            One system.
            <br />
            <span className="text-accent-300">Not five disconnected tools.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-paper-300">
            Every area of PatternOS feeds into the next. You learn, practice,
            understand, connect, remember — and then apply it all to a problem
            you&apos;ve never seen before.
          </p>
        </div>

        {/* Circular loop diagram */}
        <div className="reveal mt-14 sm:mt-16">
          <div className="mx-auto max-w-3xl">
            {/* Desktop: circular SVG */}
            <div className="hidden md:block">
              <svg viewBox="0 0 600 420" className="w-full">
                {/* Circle path */}
                <circle cx="300" cy="210" r="160" fill="none" stroke="#1A1D24" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Center label */}
                <text x="300" y="205" textAnchor="middle" className="font-display" fontSize="16" fontWeight="700" fill="#F5F6F8">PatternOS</text>
                <text x="300" y="225" textAnchor="middle" className="font-mono" fontSize="10" fill="#6B7280">core loop</text>

                {/* Nodes */}
                {loopNodes.map((node, i) => {
                  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
                  const x = 300 + Math.cos(angle) * 160
                  const y = 210 + Math.sin(angle) * 160
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="28" fill="#0E1014" stroke={node.color} strokeWidth="1.5" />
                      <text x={x} y={y + 4} textAnchor="middle" className="font-display" fontSize="11" fontWeight="600" fill={node.color}>
                        {String(i + 1).padStart(2, '0')}
                      </text>
                      <text x={x} y={y - 38} textAnchor="middle" className="font-display" fontSize="13" fontWeight="600" fill="#E8EAED">
                        {node.label}
                      </text>
                      <text x={x} y={y + 48} textAnchor="middle" className="font-sans" fontSize="9" fill="#6B7280">
                        {node.desc}
                      </text>
                    </g>
                  )
                })}

                {/* Arrows between nodes */}
                {loopNodes.map((_, i) => {
                  const angle1 = (i / 6) * Math.PI * 2 - Math.PI / 2
                  const angle2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2
                  const r1 = 132
                  const r2 = 132
                  const x1 = 300 + Math.cos(angle1) * r1
                  const y1 = 210 + Math.sin(angle1) * r1
                  const x2 = 300 + Math.cos(angle2) * r2
                  const y2 = 210 + Math.sin(angle2) * r2
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#2C313A"
                      strokeWidth="1"
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })}

                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#2C313A" />
                  </marker>
                </defs>
              </svg>
            </div>

            {/* Mobile: vertical list */}
            <div className="space-y-3 md:hidden">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-4 p-3 rounded-xl bg-ink-900 border border-ink-700">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-850">
                    <span className="font-display text-sm font-bold text-accent-300">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold text-paper-100">
                      {step.label}
                    </div>
                    <div className="text-xs text-paper-400">{step.desc}</div>
                  </div>
                  {i < steps.length - 1 && (
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="ml-auto opacity-50">
                      <path d="M6 2v10M2 9l4 4 4-4" stroke="#2C313A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
