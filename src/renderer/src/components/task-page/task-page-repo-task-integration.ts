import type { Repo } from '../../../../shared/repo-types'
import type { TaskProvider } from '../../../../shared/task-providers'
import type { JiraSite, JiraSiteSelection } from '../../../../shared/jira/jira-types'
import {
  normalizeRepoTaskIntegration,
  resolveTaskIntegrationForRepos,
  type RepoTaskIntegration
} from '../../../../shared/repo-task-integration'
import { getRepoExecutionHostId } from '../../../../shared/execution-host'
import { useAppStore } from '@/store/index'

/** Jira site the selected projects pin; a site this runtime no longer has falls back to the Tasks selection. */
export function getProjectJiraSiteId(
  selectedRepos: readonly Repo[],
  jiraSites: readonly JiraSite[]
): JiraSiteSelection | null {
  const siteId = resolveTaskIntegrationForRepos(selectedRepos)?.jiraSiteId
  return siteId === 'all' || jiraSites.some((site) => site.id === siteId) ? (siteId ?? null) : null
}

async function updateRepoTaskIntegrations(
  repos: readonly Repo[],
  edit: (current: RepoTaskIntegration) => unknown
): Promise<boolean> {
  const { updateRepo } = useAppStore.getState()
  const results = await Promise.all(
    repos.map(async (repo) => {
      const current = normalizeRepoTaskIntegration(repo.taskIntegration)
      const next = current ? normalizeRepoTaskIntegration(edit(current)) : null
      if (!next) {
        return true
      }
      return updateRepo(
        repo.id,
        { taskIntegration: next },
        { hostId: getRepoExecutionHostId(repo) }
      )
    })
  )
  return !results.includes(false)
}

/** Removes a provider from each repo's own Tasks setup; false when any save failed. */
export function hideProviderInRepoTaskIntegrations(
  repos: readonly Repo[],
  provider: TaskProvider
): Promise<boolean> {
  return updateRepoTaskIntegrations(repos, (current) => ({
    ...current,
    providers: current.providers.filter((entry) => entry !== provider)
  }))
}

/** Points each Jira-showing repo's own Tasks setup at one site; false when any save failed. */
export function setJiraSiteInRepoTaskIntegrations(
  repos: readonly Repo[],
  siteId: string
): Promise<boolean> {
  return updateRepoTaskIntegrations(
    repos.filter((repo) => repo.taskIntegration?.providers.includes('jira')),
    (current) => ({ ...current, jiraSiteId: siteId })
  )
}
