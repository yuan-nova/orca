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

  it('uses the Jira site the selected projects share', () => {
    expect(
      resolveTaskIntegrationForRepos([
        { taskIntegration: { providers: ['jira'], defaultProvider: 'jira', jiraSiteId: 'a' } },
        { taskIntegration: { providers: ['jira'], defaultProvider: 'jira', jiraSiteId: 'a' } }
      ])?.jiraSiteId
    ).toBe('a')
  })

  it('shows all Jira sites when the selected projects read different ones', () => {
    expect(
      resolveTaskIntegrationForRepos([
        { taskIntegration: { providers: ['jira'], defaultProvider: 'jira', jiraSiteId: 'a' } },
        { taskIntegration: { providers: ['jira'], defaultProvider: 'jira' } }
      ])?.jiraSiteId
    ).toBe('all')
  })

  it('ignores the Jira site of a project that does not show Jira', () => {
    expect(
      resolveTaskIntegrationForRepos([
        { taskIntegration: { providers: ['jira'], defaultProvider: 'jira', jiraSiteId: 'a' } },
        { taskIntegration: { providers: ['github'], defaultProvider: 'github', jiraSiteId: 'b' } }
      ])?.jiraSiteId
    ).toBe('a')
  })
})

describe('normalizeRepoTaskIntegration', () => {
  it('repairs a default that is not among the providers', () => {
    expect(
      normalizeRepoTaskIntegration({ providers: ['linear'], defaultProvider: 'github' })
    ).toEqual({ providers: ['linear'], defaultProvider: 'linear' })
  })

  it('never pins the all-sites view as a project Jira site', () => {
    expect(
      normalizeRepoTaskIntegration({
        providers: ['jira'],
        defaultProvider: 'jira',
        jiraSiteId: 'all'
      })
    ).toEqual({ providers: ['jira'], defaultProvider: 'jira' })
  })

  it('rejects an empty provider list', () => {
    expect(
      normalizeRepoTaskIntegration({ providers: [], defaultProvider: 'github' })
    ).toBeUndefined()
  })
})
