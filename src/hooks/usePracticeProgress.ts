// Practice-only progress store — completely independent from useProgress.ts
// (which tracks Constellation pattern progress).
// Storage key is different; data model is different; no shared state.

import { useState, useCallback } from 'react'

export interface ProblemState {
  attempted: boolean
  solved: boolean
  attemptCount: number
}

export interface PracticeProgressData {
  currentProblemId: number
  problems: Record<number, ProblemState>
}

const PRACTICE_STORAGE_KEY = 'dsa-coach:practice-progress'

const DEFAULT_PROBLEM_STATE: ProblemState = {
  attempted: false,
  solved: false,
  attemptCount: 0,
}

function loadPracticeProgress(): PracticeProgressData {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PracticeProgressData>
      return {
        currentProblemId: parsed.currentProblemId ?? 1,
        problems: parsed.problems ?? {},
      }
    }
  } catch {
    // ignore — fall through to default
  }
  return { currentProblemId: 1, problems: {} }
}

function savePracticeProgress(p: PracticeProgressData): void {
  try {
    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(p))
  } catch {
    // localStorage unavailable — in-memory state still works for the session
  }
}

export function usePracticeProgress() {
  const [progress, setProgress] = useState<PracticeProgressData>(loadPracticeProgress)

  const setCurrentProblem = useCallback((id: number) => {
    setProgress((p) => {
      const next = { ...p, currentProblemId: id }
      savePracticeProgress(next)
      return next
    })
  }, [])

  const recordAttempt = useCallback((id: number) => {
    setProgress((p) => {
      const cur = p.problems[id] ?? { ...DEFAULT_PROBLEM_STATE }
      const next: PracticeProgressData = {
        ...p,
        problems: {
          ...p.problems,
          [id]: { ...cur, attempted: true, attemptCount: cur.attemptCount + 1 },
        },
      }
      savePracticeProgress(next)
      return next
    })
  }, [])

  const recordSolved = useCallback((id: number) => {
    setProgress((p) => {
      const cur = p.problems[id] ?? { ...DEFAULT_PROBLEM_STATE }
      const next: PracticeProgressData = {
        ...p,
        problems: {
          ...p.problems,
          [id]: { ...cur, attempted: true, solved: true },
        },
      }
      savePracticeProgress(next)
      return next
    })
  }, [])

  const totalAttempted = Object.values(progress.problems).filter((s) => s.attempted).length
  const totalSolved = Object.values(progress.problems).filter((s) => s.solved).length

  // Precompute sets so consumers can do O(1) lookups without recomputing
  const solvedIds = new Set(
    Object.entries(progress.problems)
      .filter(([, s]) => s.solved)
      .map(([id]) => Number(id))
  )

  const attemptedIds = new Set(
    Object.entries(progress.problems)
      .filter(([, s]) => s.attempted)
      .map(([id]) => Number(id))
  )

  return {
    progress,
    totalAttempted,
    totalSolved,
    solvedIds,
    attemptedIds,
    setCurrentProblem,
    recordAttempt,
    recordSolved,
  }
}
