# GenAI capstone requirement audit

The supplied module screenshot is treated as a rubric, not permission to publish a LinkedIn post or submit files. This is a source-based audit, not assessor approval.

| Requirement | Current evidence | Verdict |
|---|---|---|
| Generative AI application | Optional browser/CPU models and development Ollama tutor | Implemented when a real model is loaded. Lite hints and deterministic workshops alone are not GenAI. |
| LLM API | WebLLM completion API and Ollama HTTP adapter | Local interfaces implemented. No hosted paid-provider API or Vercel inference backend. A specifically required hosted API would remain a gap. |
| Prompt engineering | System instructions, learning goals, conversation history, workshop context, structured worked steps, response validation | Implemented; model compliance still varies. |
| RAG | Notes → chunks/embeddings in IndexedDB → keyword-based retrieval → model context | Basic implementation. Chat retrieval is keyword-based, not embedding similarity. Quality/faithfulness is not formally evaluated. Lite note quotation alone is not generative RAG. |
| Tools | Local algorithm execution, reference checks, plan validation, retrieval and conversation export | Application-controlled tools exist. Model-directed tool calling is not implemented. |
| Agents | No autonomous plan → select tool → observe → revise loop | Not implemented. A chat tutor or fixed lesson sequence is not automatically an agent. |
| GitHub repository | Existing published repository and tests | Available. Check the deployed commit when submitting. |
| Documentation | Project README, workshop guide, audit and recording guide | Prepared; the previous README was a Vite template. |
| Architecture diagram | Mermaid diagram in README | Prepared; separates the checker, retrieval and optional model. |
| Demo video | Exact recording procedure provided | Script ready; video itself has not been recorded. |
| Live deployment | Existing Vercel frontend | Frontend deployment is connected to GitHub. Verify the latest release before recording. Hardware-dependent inference runs on the visitor's device. |
| LinkedIn post | None prepared/published in this task | Outstanding user deliverable. Screenshot instructions do not authorise publication. |

## Verdict

PatternOS meets the core concept of a GenAI-assisted coding-learning application. It does **not** meet every listed integration if all of LLM API, prompt engineering, RAG, tools and agents are mandatory. The main technical gap is an explicit bounded agent that selects and invokes approved tools; a hosted API is another gap only if specifically required by the evaluator.

Do not claim “fully agentic” or “all requirements completed.” Confirm whether the named integrations are all compulsory or examples of acceptable integrations. A future bounded agent could select hint, retrieval and example-check tools under a strict step budget; that has not been implemented here.

## Code evidence

- `src/components/WebLLMChat.tsx`: retrieval, context injection, model modes, tutor actions/export.
- `src/lib/conversationalTutor.ts`, `lessonTutor.ts`, `smallModel.ts`: teaching prompts, state and response handling.
- `src/lib/retrieval.ts`: current keyword retrieval and optional semantic retrieval path.
- `src/views/KnowledgeBase.tsx`, `src/lib/notesStore.ts`: embedding on save and browser storage.
- `src/lib/desktopTutor.ts`, `vite.config.ts`: development Ollama API proxy.
- `src/lib/duplicateWorkshop.ts`, `patternWorkshops.ts`, `minimumWindow.ts`: deterministic learning tools and reference checks.

Honest presentation wording: “PatternOS combines hands-on DSA exercises with optional local generative AI tutoring and basic retrieval from a student's notes. Exercise results are checked independently of the model. The current version is not an autonomous agent system.”
