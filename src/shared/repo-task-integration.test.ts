import { describe, expect, it } from 'vitest'
import {
  normalizeRepoTaskIntegration,
  resolveTaskIntegrationForRepos
} from './repo-task-integration'

describe('resolveTaskIntegrationForRepos', () => {
  it('falls back to global when any selected repo has no project setup', () => {
    expect(
      resolveTaskIntegrationForRepos([
        { taskIntegration: { providers: ['jira'], defaultProvider: 'jira' } },
        {}
      ])
    ).toBeNull()
  })

  it('combines providers and keeps the first repo default', () => {
    expect(
      resolveTaskIntegrationForRepos([
        { taskIntegration: { providers: ['jira'], defaultProvider: 'jira' } },
        { taskIntegration: { providers: ['linear', 'github'], defaultProvider: 'linear' } }
      ])
    ).toEqual({ providers: ['github', 'linear', 'jira'], defaultProvider: 'jira' })
  })
})

describe('normalizeRepoTaskIntegration', () => {
  it('repairs a default that is not among the providers', () => {
    expect(
      normalizeRepoTaskIntegration({ providers: ['linear'], defaultProvider: 'github' })
    ).toEqual({ providers: ['linear'], defaultProvider: 'linear' })
  })

  it('rejects an empty provider list', () => {
    expect(
      normalizeRepoTaskIntegration({ providers: [], defaultProvider: 'github' })
    ).toBeUndefined()
  })
})
