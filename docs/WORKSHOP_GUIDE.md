# PatternOS hands-on workshop

Open Practice and select **Contains Duplicate**. Workshop is the default view. The five checkpoints work without loading an AI model.

## Demo sequence

1. **Follow the values:** use `[4,7,4]`. Predict **No** for the first 4, then record it. Predict **No** for 7, then record it. Predict **Yes** for the final 4. Checking and recording are separate actions.
2. **Choose an approach:** select 1,000 distinct values and run the comparison. The list executes 499,500 equality comparisons; the Set makes 1,000 membership API calls. These measure different operations, not elapsed speed or internal hashing work. Compare the options and choose Set for repeated fast membership checks.
3. **Break the rule:** predict what happens if adding comes before checking. Run the broken order to see a false positive on the first value. Switch to check-before-add and step through the repaired version.
4. **Build your algorithm:** reorder the supplied blocks, run the six cases, inspect counterexamples, and repair the order. The JavaScript reference becomes available after the checks pass. This activity does not assess the learner's own code.
5. **Try it independently:** answer the six questions for a fresh input. Further cases include usernames to test transfer beyond numbers. Corrections or opening a hint/tutor mark that attempt as assisted. A fresh case is required for a clean independent attempt.

## Progress and help

Checkpoint records retain the best completed attempt in this browser. Skipping ahead does not award a checkpoint. Current guided exercise drafts restart on reload; independent case identity, correction counts and assistance flags persist. These records are exercise evidence, not a claim of general mastery.

The optional tutor receives the current exercise context when AI is enabled. Basic Lite hints are general. Model loading and failed replies do not block workshop activities; AI responses can still vary.

## Offline use

Open the tutor's **Chat settings & offline access**, then choose **Save core lessons for offline use** while connected. Wait for the saved confirmation. The saved core includes workshop activities; AI model files are separate. Keep the same browser and website origin. Clearing site data removes saved lessons and progress.

## Current scope and verification

Complete five-stage journeys now cover Contains Duplicate, Container With Most Water (Two Pointers), Longest Substring Without Repeating Characters (Sliding Window), and Minimum Window Substring (Hard). Use the four journey buttons above the workshop to switch. Other problems retain their existing learning tools. No paid service, GPU or model download is required for the workshop. Minimum hardware performance has not been benchmarked on low-spec physical devices.

Verification: 85 automated tests passed; production build and targeted lint passed. Browser checks covered all five stages, incorrect answers, counterexamples, assisted versus independent evidence, persistence, username transfer and a 390-pixel viewport. After saving the lesson pack, the production preview server was stopped: Practice reloaded and the 1,000-value comparison still executed from saved files. This was tested in the in-app Chromium browser, not separately in Opera GX or Google Chrome.

This version is local until committed and pushed to GitHub for Vercel deployment.

## Upgrade demo: choosing a solution

Below the Contains Duplicate workshop, open **Changing requirements**. Compare four outputs on `[4,7,4,4,7]`: existence, frequencies, original positions, and duplicate detection after sorting. Try Set for the frequency requirement to trigger a corrective exercise; then select a value-to-count Map and execute the result. Sorting is presented with explicit order and workspace trade-offs, not as a guaranteed constant-space JavaScript operation.

## Upgrade demo: Two Pointers and Sliding Window

Each journey has five checkpoints:

1. Predict the next boundary/window action. An incorrect move leaves the algorithm state unchanged and offers a concrete repair exercise.
2. Compare the baseline search with the executed scan. Explain why total boundary movements are linear; counts use clearly labelled units, not timing claims.
3. Run a suspect rule. Moving the taller container wall gives 8 instead of 49 on the demonstration input. Removing only once for `abba` gives 3 instead of the correct 2. Select and execute the repair.
4. Reorder five known plan cards. A template validator checks their scoped order, then executes the accepted algorithm on six cases. This does not execute arbitrary learner code.
5. Start **New independent case**, calculate the result, select the invariant and cost, then choose an approach for a different problem. Ticket prices, consecutive sales and username frequencies test transfer between patterns. Fresh numeric/string cases are generated deterministically. Answers reset on reload, while help/correction flags persist; the last completed application is retained. Guided-stage corrections conservatively count until a new case starts.

All exercises are bounded conceptual checks, not certificates of coding ability or general mastery. Core logic uses local TypeScript and adds no dependency or model. If an older offline lesson pack is already saved, save core lessons again while online to cache the upgraded build.

Upgrade verification: 95 automated tests pass, including generated algorithm/reference comparisons and changing-requirement checks. Production build and targeted lint pass. Browser walkthroughs cover requirement feedback, executed counts, boundary prediction, bug repair, plan validation and application checks. The new journeys still require separate Opera GX/Chrome and low-end physical-device testing before making hardware claims.

## Fourth journey: Minimum Window Substring (Hard)

Choose **Minimum Window · Hard** above the workshop. The problem is also available in the problem selector as number 21.

1. **Count what you need:** start with the letter-card analogy. For target AAB, enter two As and one B. Presence alone is insufficient.
2. **Move the window:** start with CABBA / AAB. Predict five expansions followed by two left shrinks. The shortest result is ABBA. The table shows required quantities beside current quantities before each move. Switch to ADOBECODEBANC / ABC for the longer BANC demonstration.
3. **Repair the rule:** run the presence-only bug, which returns AB for a requirement of AAB. Choose per-character quantities, and explain that total boundary movement is linear. The repaired result is ABBA.
4. **Build the plan:** move instruction 3 above instruction 4, then validate the scoped template and run six cases. The plan includes repeated targets, ties, impossible targets and an empty source. This validates a known plan, not arbitrary code.
5. **Try a fresh problem:** type the exact earliest shortest window, or explicitly select **No valid window exists**. Explain count storage, the shrinking condition and O(n + m) scan time. Corrected or helped attempts remain labelled as assisted after reload; choose a new case for a fresh attempt.

The lesson uses uppercase English letters. Count workspace is bounded by that fixed alphabet, while the returned substring requires space for its characters. Teaching snapshots consume additional display storage, so the linear scan is separately tested with snapshots disabled on a 100,000-character source. Automated reference checks cover 1,200 generated source/target pairs. The core journey needs no model or GPU. Save the offline lesson pack again to include this new build.
