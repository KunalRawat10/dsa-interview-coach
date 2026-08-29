export default function Complexity() {
  return (
    <section id="complexity" className="relative py-20 sm:py-24 lg:py-32">
      <div className="absolute inset-0 grid-bg-fine opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mb-12 text-center">
          <div className="section-label mb-4">Complexity</div>
          <h2 className="mx-auto max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-paper-50">
            Not just the answer.
            <br />
            <span className="text-accent-300">The why behind it.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-paper-300">
            Paste your code. PatternOS breaks down the operations, bottlenecks,
            and reasoning — so you understand why it&apos;s O(n²), not just that it is.
          </p>
        </div>

        <div className="reveal">
          <div className="product-frame overflow-hidden">
            <div className="product-bar">
              <span className="product-dot bg-accent-400/70" />
              <span className="product-dot bg-accent-400/50" />
              <span className="product-dot bg-accent-400/30" />
              <span className="ml-3 font-mono text-xs text-paper-400 truncate">
                patternos — complexity analyzer
              </span>
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr]">
              {/* Left: code input + operations */}
              <div className="border-b border-ink-600 bg-ink-900 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-xs text-paper-400">YOUR CODE</span>
                  <span className="rounded border border-ink-600 px-2 py-0.5 font-mono text-[10px] text-paper-500">JavaScript</span>
                </div>
                <pre className="overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed p-2 bg-ink-950 rounded border border-ink-700">
                  <code>
<span className="code-keyword">function</span> <span className="code-fn">pairSum</span><span className="code-punct">(</span><span className="code-type">arr</span><span className="code-punct">,</span> <span className="code-type">target</span><span className="code-punct">) {'{'}</span>{'\n'}
{'  '}<span className="code-keyword">for</span> <span className="code-punct">(</span><span className="code-keyword">let</span> i <span className="code-punct">=</span> <span className="code-num">0</span><span className="code-punct">;</span> i <span className="code-punct">{'<'} </span>arr<span className="code-punct">.</span>length<span className="code-punct">;</span> i<span className="code-punct">++) {'{'}</span>{'\n'}
{'    '}<span className="code-keyword">for</span> <span className="code-punct">(</span><span className="code-keyword">let</span> j <span className="code-punct">=</span> i <span className="code-punct">+</span> <span className="code-num">1</span><span className="code-punct">;</span> j <span className="code-punct">{'<'} </span>arr<span className="code-punct">.</span>length<span className="code-punct">;</span> j<span className="code-punct">++) {'{'}</span>{'\n'}
{'      '}<span className="code-keyword">if</span> <span className="code-punct">(</span>arr<span className="code-punct">[</span>i<span className="code-punct">] +</span> arr<span className="code-punct">[</span>j<span className="code-punct">] ===</span> target<span className="code-punct">)</span>{'\n'}
{'        '}<span className="code-keyword">return</span> <span className="code-punct">[</span>i<span className="code-punct">,</span> j<span className="code-punct">];</span>{'\n'}
{'    '}<span className="code-punct">{'}'}</span>{'\n'}
{'  '}<span className="code-punct">{'}'}</span>{'\n'}
{'  '}<span className="code-keyword">return</span> <span className="code-punct">[];</span>{'\n'}
<span className="code-punct">{'}'}</span>
                  </code>
                </pre>

                {/* Operation visualization */}
                <div className="mt-5 rounded-lg border border-ink-600 bg-ink-850 p-4">
                  <div className="mb-3 font-mono text-xs text-paper-400">OPERATIONS (n = 5)</div>
                  <div className="space-y-1.5">
                    {[
                      { i: 0, ops: 4 },
                      { i: 1, ops: 3 },
                      { i: 2, ops: 2 },
                      { i: 3, ops: 1 },
                      { i: 4, ops: 0 },
                    ].map((row) => (
                      <div key={row.i} className="flex items-center gap-2">
                        <span className="w-8 font-mono text-[10px] text-paper-500">i={row.i}</span>
                        <div className="flex flex-1 gap-0.5">
                          {Array.from({ length: row.ops }).map((_, j) => (
                            <div
                              key={j}
                              className="h-3 flex-1 rounded-sm bg-accent-500/40"
                              style={{ maxWidth: 20 }}
                            />
                          ))}
                        </div>
                        <span className="w-8 text-right font-mono text-[10px] text-paper-500">{row.ops}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-ink-600 pt-2 text-center font-mono text-xs text-paper-300">
                    Total: 4 + 3 + 2 + 1 + 0 = <span className="text-gold-300 font-bold">10</span> = n(n-1)/2
                  </div>
                </div>
              </div>

              {/* Right: analysis breakdown */}
              <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg border border-error-500/20 bg-error-500/5 px-4 py-2">
                      <div className="font-mono text-xs text-paper-400">TIME</div>
                      <div className="font-display text-2xl font-bold text-error-400">O(n²)</div>
                    </div>
                    <div className="rounded-lg border border-success-500/20 bg-success-500/5 px-4 py-2">
                      <div className="font-mono text-xs text-paper-400">SPACE</div>
                      <div className="font-display text-2xl font-bold text-success-400">O(1)</div>
                    </div>
                  </div>

                  {/* Analysis breakdown */}
                  <div className="space-y-2.5">
                    <AnalysisRow
                      label="Outer loop"
                      detail="Iterates n times — once per element"
                      complexity="O(n)"
                    />
                    <AnalysisRow
                      label="Inner loop"
                      detail="Iterates up to n - i times for each i"
                      complexity="O(n)"
                    />
                    <AnalysisRow
                      label="Combined"
                      detail="n × n comparisons in the worst case"
                      complexity="O(n²)"
                      highlight
                    />
                    <AnalysisRow
                      label="Space"
                      detail="Only loop counters — no extra data structures"
                      complexity="O(1)"
                    />
                  </div>
                </div>

                <div>
                  {/* Bottleneck */}
                  <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-3.5 sm:p-4 mb-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#C9A961" strokeWidth="1.5">
                        <path d="M7 2v6M7 10v2" strokeLinecap="round" />
                        <circle cx="7" cy="7" r="5.5" />
                      </svg>
                      <span className="font-mono text-xs text-gold-300 font-semibold">BOTTLENECK</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-paper-200">
                      The nested loop checks every pair. For n = 100, that&apos;s ~5,000
                      comparisons. A hash map would reduce this to O(n) by trading
                      space for time.
                    </p>
                  </div>

                  {/* Suggestion */}
                  <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3.5 sm:p-4">
                    <div className="mb-1.5 font-mono text-xs text-accent-300 font-semibold">PATTERN MATCH</div>
                    <p className="text-xs sm:text-sm leading-relaxed text-paper-200">
                      This structure matches the <span className="text-accent-300 font-medium">Hash Map Lookup</span> pattern.
                      Store complements as you iterate — one pass, O(n) time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AnalysisRow({
  label,
  detail,
  complexity,
  highlight,
}: {
  label: string
  detail: string
  complexity: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        highlight
          ? 'border-error-500/20 bg-error-500/5'
          : 'border-ink-600 bg-ink-850'
      }`}
    >
      <div>
        <div className="font-mono text-xs text-paper-300 font-medium">{label}</div>
        <div className="mt-0.5 text-xs text-paper-500">{detail}</div>
      </div>
      <span
        className={`font-mono text-xs sm:text-sm font-semibold ${
          highlight ? 'text-error-400' : 'text-paper-200'
        }`}
      >
        {complexity}
      </span>
    </div>
  )
}
