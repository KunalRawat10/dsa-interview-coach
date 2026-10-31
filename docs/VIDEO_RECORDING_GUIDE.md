# PatternOS recording guide

Target length: 7–9 minutes. Record real behaviour; model wording and latency vary. The script below supplies narration and **student messages**, not fabricated AI replies. Pause or trim waiting time transparently; do not splice unrelated responses into an exchange.

## Before recording

1. Use the latest successfully deployed build, or run a local build for recording. Run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4180` and keep that terminal running. Open the printed address and Practice. Confirm that Choose how the tutor helps and conversation download are visible before recording.
2. Keep the problem list collapsed. Use 100% browser zoom, a readable window size and your screen recorder. Hide notifications and private tabs. Check microphone and record a ten-second sample.
3. Use a separate demo profile if you want clean checkpoint records; preload its selected model and notes first. Otherwise say that you are replaying previously completed activities. Do not present old ticks as newly earned progress or clear your main browser's data just for the video.
4. To demonstrate **generative AI**, load an actual supported model before filming and verify its active model label. Lite hints are not generative AI. CPU Light avoids WebGPU but can be slower and less capable. Browser Advanced 7B is hardware-intensive. Do not download a large model during the main recording.
5. For the stronger installed desktop model, use the **development server** (`npm run dev`, open its printed port), start Ollama and have `qwen2.5:7b` installed. In tutor settings choose **Use installed desktop AI (Ollama, local preview)**. This option is development-only; do not imply the public Vercel site hosts Ollama or that it is present in production preview.
6. Preload a note through **Notes**: title `Minimum Window — Count Rule`; paste the note below and click **Save notes**. Saving currently downloads/uses the embedding model on first use; wait for the saved status. Confirm both note and model work in the same browser profile and origin you will record. If either fails, omit that segment and describe it as unverified rather than inventing success.

```text
For Minimum Window Substring, a target such as AAB requires two As and one B. Presence in a Set is insufficient. Track required and current character counts. Expand right when a requirement is missing. While every required count is satisfied, record a shorter valid window and shrink left. For CABBA and AAB, the shortest valid window is ABBA. Count target construction plus total boundary moves: O(n + m) time. The demo uses a fixed uppercase alphabet.
```

## Recording sequence

### 0:00–0:35 — Purpose and navigation

Show Home briefly, then Practice and the four journey buttons.

Say: “PatternOS helps students move from understanding a question to choosing and testing an algorithm. The student predicts and experiments; AI is optional. I will demonstrate a difficult problem through small, checkable actions.”

Show the current deployment/local address honestly. Core workshop availability without a model is not evidence that AI inference needs no hardware.

### 0:35–1:25 — A changing requirement changes the structure

Choose **Membership & Maps**, scroll to **Changing requirements**, select the requirement “Return how many times each number occurs.” Choose **Set of values**, then **Test my choice**. Read the corrective feedback. Choose **Map: value → count**, test again and show `[[4,3],[7,2]]`.

Say: “A Set answers whether a value exists. Counting needs additional information. The activity teaches why a structure fits, rather than asking the learner to memorise its name. This result is computed by the application.”

### 1:25–2:10 — Make the hard problem understandable

Choose **Minimum Window · Hard**, then **Count the letters you need**.

Say: “We need the shortest continuous section containing all required letters. Here AAB needs two As and one B; order does not matter, but quantities do.”

Enter A = `1`, B = `1`, click **Check the shopping list** to show feedback. Change A to `2`, check again. Do not call corrected completion an independent pass.

### 2:10–3:10 — Predict and execute

Choose **Move the window**, teaching example **Start small: CABBA / AAB**. Restart the trace if necessary.

Click **Add the next letter** five times, pausing after each to show the count table. Then click **Remove the first letter** twice.

Narrate:

- “First we collect letters until the required quantities are satisfied.”
- “CABBA is valid, but we try to make it shorter.”
- “Removing C leaves ABBA valid.”
- “Removing the first A leaves only one A. That window is invalid, so the best recorded answer remains ABBA.”

Optional cutaway: switch to the full ADOBECODEBANC / ABC example. At every step, expand when the displayed window is invalid and shrink when valid. The complete trace ends at BANC. It has 23 actions; use a brief labelled cutaway rather than spending the entire video clicking it.

### 3:10–3:55 — Investigate a real mistake

Choose **Fix a mistake**, click **Run the presence-only bug**. Show suspect result AB versus correct result ABBA. Choose **We have at least as many of each letter as we need**. For the scan choose **Each boundary advances at most n times; build target counts in m steps**. Run the repair.

Say: “The buggy rule treats AAB as just A and B. The counterexample makes its failure visible. The repaired scan tracks quantities. Each boundary advances at most n times, so the nested shrinking loop does not automatically make it quadratic.”

### 3:55–4:40 — Build and validate a plan

Choose **Put the steps in order**. If using a fresh draft, run it once to show the ordering feedback. Click **Move instruction 3 up** once, placing the validity loop before recording/shrinking. Click **Try my steps on 6 examples**. Show repeated requirements, BANC, an impossible target, a tie and empty source.

Say: “These are known plan cards. The application validates their order and executes the accepted algorithm against reference cases. This checks conceptual planning; it does not claim to have executed arbitrary student code.”

### 4:40–5:35 — Apply independently

Choose **Try it yourself**. With a clean demo record, case 1 is `s = CABAAC`, `t = AAC`. Enter `AAC`, choose **Required and current character counts**, **While we still have enough of every required letter**, and **O(n + m)**. Submit.

Say: “The result is checked against an exhaustive reference on this small input. An unassisted pass is distinguished from one completed with hints or corrections. It is evidence for this activity, not proof of general mastery.”

If your stored case number differs, solve that displayed input; do not copy an answer from a different case. For a clean record, the next two cases are:

| Case | Source / target | Correct answer |
|---|---|---|
| 2 | BACAB / AAB | BACA — earliest shortest tie |
| 3 | ABC / AABC | Select **No valid window exists** |

Optional alternative: deliberately submit AC on case 1, then correct it to AAC to demonstrate assisted labelling. Use a new case for an independent attempt; never cut away the correction history and describe it as a clean pass.

### 5:35–6:45 — Optional generative tutor and new controls

Return to **Move the window**, restart the small example and make the first expansion. Open **Ask about this exercise ↗**. Show the actual active model label. If it says Basic/Lite or Load, do not describe the next response as LLM-generated.

Expand **Choose how the tutor helps** and click **One small step**. The message appears as an editable draft; it has not been sent. Send it, then wait for the actual response. It should refer to the current workshop example. If it changes the example or finishes the entire solution, show that as a limitation and do not claim the check passed.

Next click **Another analogy**, or enter this exact student message:

```text
Explain why AAB needs counts rather than just a Set, using a shopping-list analogy. Use CABBA and show only one small step. Do not give code yet.
```

For a prediction check, choose **Check my understanding**. Answer the actual question it asks. For trade-offs, choose **Compare approaches**. Use one or two controls in the final cut; showing all four is optional.

Click **Download this tutor conversation** to demonstrate user-controlled export. The file is an ordinary Markdown conversation, not an assessment certificate.

### 6:45–7:45 — Notes retrieval and honest architecture

With the preloaded note and a real model active, send:

```text
According to my saved Minimum Window Count Rule notes, why is a Set insufficient for target AAB? Explain only the required quantities, without code.
```

Show the saved note alongside the generated explanation if convenient. Say: “The application retrieves matching note chunks and supplies them to the model with the current exercise context. The current chat retrieval uses keyword overlap. It is not semantic retrieval or a guarantee that the model follows its sources.”

A correct answer alone does not prove retrieval occurred: use the source implementation/architecture as evidence for the data path. If demonstrating the Lite note quotation instead, explicitly call it retrieval plus rule-based hints, not generative RAG.

Open the README architecture diagram and repository. Say: “The workshop engines verify activities; the model explains. This version does not implement an autonomous agent or model-directed tool calling.”

### 7:45–8:15 — Close

Say: “PatternOS combines hands-on algorithm reasoning, mistake repair and optional AI guidance. The core workshops work without a model. Current limitations include a small authored curriculum, hardware-dependent local AI and no autonomous agent. The repository includes tests, documentation and deployment instructions.”

Show the public frontend only if its displayed version includes the features you claim. New local shortcuts/export need a push and successful deployment before being described as live.

## Submission checklist

- Record and review the actual video; check readable text/audio and truthful model labels.
- Include GitHub repository, live frontend, README architecture diagram and documentation links.
- Check `CAPSTONE_AUDIT.md` before saying every rubric integration is complete. Agents/model-directed tool calling are missing.
- Prepare the requested LinkedIn post separately; review it before publishing. This guide does not publish or submit anything.
