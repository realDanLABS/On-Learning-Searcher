import { beforeEach, describe, expect, it } from 'vitest'

import { clearDiagnosisDraft, hasDiagnosisDraft, loadDiagnosisDraft, saveDiagnosisDraft } from './draftStorage'

describe('diagnosis draft storage', () => {
  beforeEach(() => {
    clearDiagnosisDraft()
  })

  it('saves and loads draft answers', () => {
    saveDiagnosisDraft({ q1: 2, q2: 1 })
    expect(loadDiagnosisDraft()).toEqual({ q1: 2, q2: 1 })
    expect(hasDiagnosisDraft()).toBe(true)
  })

  it('clears invalid JSON gracefully', () => {
    localStorage.setItem('on-learning-diagnosis-answers-v1', '{broken')
    expect(loadDiagnosisDraft()).toEqual({})
    expect(hasDiagnosisDraft()).toBe(false)
  })
})
