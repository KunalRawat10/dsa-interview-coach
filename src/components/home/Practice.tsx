export default function Practice() {
  return (
    <section id="practice" className="relative py-20 sm:py-24 lg:py-32">
      <div className="absolute inset-0 grid-bg-fine opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mb-12 text-center">
          <div className="section-label mb-4">Practice</div>
          <h2 className="mx-auto max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-paper-50">
            Guided reasoning,
            <br />
            <span className="text-accent-300">not revealed answers.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-paper-300">
            PatternOS walks you toward the solution through observation and
            structure — so you arrive at it yourself.
          </p>
        </div>

        <div className="reveal">
          <div className="product-frame overflow-hidden">
            {/* Window bar */}
            <div className="product-bar">
              <span className="product-dot bg-error-500/70" />
              <span className="product-dot bg-warning-500/70" />
              <span className="product-dot bg-success-500/70" />
              <span className="ml-3 font-mono text-xs text-paper-400 truncate">
                patternos — practice / session #042
              </span>
              <span className="ml-auto flex items-center gap-2 shrink-0">
                <span className="h-2 w-2 rounded-full bg-gold-400" />
                <span className="font-mono text-xs text-gold-300">Medium</span>
              </span>
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr]">
              {/* Left: problem + reasoning steps */}
              <div className="border-b border-ink-600 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                {/* Problem */}
                <div className="mb-5">
                  <div className="mb-2 font-mono text-xs text-paper-400">PROBLEM</div>
                  <h3 className="font-display text-xl font-semibold text-paper-50">
                    Container With Most Water
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-paper-300">
                    Given an integer array <code className="rounded bg-ink-700 px-1.5 py-0.5 font-mono text-xs text-accent-300">height</code> of length n,
                    find two lines that together with the x-axis form a container
                    holding the most water.
                  </p>
                </div>

                {/* Array visualization */}
                <div className="mb-6 rounded-lg border border-ink-600 bg-ink-900 p-4 overflow-x-auto">
                  <div className="mb-2 font-mono text-xs text-paper-400">INPUT</div>
                  <div className="flex items-end gap-1.5 min-w-[280px]">
                    {[1, 8, 6, 2, 5, 4, 8, 3, 7].map((h, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div
                          className={`w-6 sm:w-7 rounded-t ${
                            i === 1 || i === 8 ? 'bg-accent-500' : 'bg-ink-600'
                          }`}
                          style={{ height: h * 8 }}
                        />
                        <span className="mt-1 font-mono text-[9px] text-paper-500">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reasoning steps */}
                <div className="space-y-3">
                  <ReasoningStep
                    num="01"
                    label="OBSERVE"
                    text="We need two vertical lines. The water is limited by the shorter line and the distance between them."
                  />
                  <ReasoningStep
                    num="02"
                    label="STRUCTURE"
                    text="Ordered array. We're optimizing over pairs. A brute force would check all O(n²) pairs."
                    tag="O(n²) brute force"
                    tagClass="text-error-400"
                  />
                  <ReasoningStep
                    num="03"
                    label="PATTERN"
                    text="Two Pointers — start at both ends and narrow inward."
                    tag="Two Pointers"
                    tagClass="text-accent-300"
                    highlight
                  />
                  <ReasoningStep
                    num="04"
                    label="INVARIANT"
                    text="Moving the shorter boundary is the only move that can potentially improve the result. Moving the taller one can only shrink or keep the same."
                    tag="Invariant"
                    tagClass="text-gold-300"
                  />
                </div>
              </div>

              {/* Right: code editor */}
              <div className="bg-ink-900 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-mono text-xs text-paper-400">SOLUTION</div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success-500" />
                      <span className="font-mono text-xs text-success-400">Accepted</span>
                    </div>
                  </div>

                  <pre className="overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed p-2 bg-ink-950 rounded border border-ink-700">
                    <code>
<span className="code-keyword">function</span> <span className="code-fn">maxArea</span><span className="code-punct">(</span><span className="code-type">height</span><span className="code-punct">)</span> <span className="code-punct">{'{'}</span>{'\n'}
{'  '}<span className="code-keyword">let</span> left <span className="code-punct">=</span> <span className="code-num">0</span><span className="code-punct">;</span>{'\n'}
{'  '}<span className="code-keyword">let</span> right <span className="code-punct">=</span> height.length <span className="code-punct">-</span> <span className="code-num">1</span><span className="code-punct">;</span>{'\n'}
{'  '}<span className="code-keyword">let</span> max <span className="code-punct">=</span> <span className="code-num">0</span><span className="code-punct">;</span>{'\n'}
{'\n'}
{'  '}<span className="code-keyword">while</span> <span className="code-punct">(</span>left <span className="code-punct">{'<'} </span>right<span className="code-punct">) {'{'}</span>{'\n'}
{'    '}<span className="code-keyword">const</span> w <span className="code-punct">=</span> right <span className="code-punct">-</span> left<span className="code-punct">;</span>{'\n'}
{'    '}<span className="code-keyword">const</span> h <span className="code-punct">=</span> <span className="code-fn">Math</span><span className="code-punct">.</span><span className="code-fn">min</span><span className="code-punct">(</span>height<span className="code-punct">[</span>left<span className="code-punct">],</span> height<span className="code-punct">[</span>right<span className="code-punct">]);</span>{'\n'}
{'    '}max <span className="code-punct">=</span> <span className="code-fn">Math</span><span className="code-punct">.</span><span className="code-fn">max</span><span className="code-punct">(</span>max<span className="code-punct">,</span> w <span className="code-punct">*</span> h<span className="code-punct">);</span>{'\n'}
{'\n'}
{'    '}<span className="code-comment">// Move the shorter boundary</span>{'\n'}
{'    '}<span className="code-keyword">if</span> <span className="code-punct">(</span>height<span className="code-punct">[</span>left<span className="code-punct">] {'<'} </span>height<span className="code-punct">[</span>right<span className="code-punct">])</span>{'\n'}
{'      '}left<span className="code-punct">++;</span>{'\n'}
{'    '}<span className="code-keyword">else</span>{'\n'}
{'      '}right<span className="code-punct">--;</span>{'\n'}
{'  '}<span className="code-punct">{'}'}</span>{'\n'}
{'  '}<span className="code-keyword">return</span> max<span className="code-punct">;</span>{'\n'}
<span className="code-punct">{'}'}</span>
                    </code>
                  </pre>
                </div>

                {/* Complexity badge */}
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-ink-600 bg-ink-800 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-paper-400">TIME</span>
                    <span className="font-mono text-sm font-medium text-success-400">O(n)</span>
                  </div>
                  <div className="h-4 w-px bg-ink-600" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-paper-400">SPACE</span>
                    <span className="font-mono text-sm font-medium text-success-400">O(1)</span>
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

function ReasoningStep({
  num,
  label,
  text,
  tag,
  tagClass,
  highlight,
}: {
  num: string
  label: string
  text: string
  tag?: string
  tagClass?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3.5 sm:p-4 transition-colors ${
        highlight
          ? 'border-accent-500/30 bg-accent-500/5'
          : 'border-ink-600 bg-ink-850'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-paper-500">{num}</span>
        <span className="font-mono text-xs font-medium text-paper-300">{label}</span>
        {tag && (
          <span className={`ml-auto font-mono text-xs ${tagClass}`}>{tag}</span>
        )}
      </div>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-paper-200">{text}</p>
    </div>
  )
}
