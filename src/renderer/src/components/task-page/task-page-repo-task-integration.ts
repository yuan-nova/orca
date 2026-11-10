import type { Repo } from '../../../../shared/repo-types'
import type { TaskProvider } from '../../../../shared/task-providers'
import { normalizeRepoTaskIntegration } from '../../../../shared/repo-task-integration'
import { getRepoExecutionHostId } from '../../../../shared/execution-host'
import { useAppStore } from '@/store/index'

/** Removes a provider from each repo's own Tasks setup; false when any save failed. */
export async function hideProviderInRepoTaskIntegrations(
  repos: readonly Repo[],
  provider: TaskProvider
): Promise<boolean> {
  const { updateRepo } = useAppStore.getState()
  const results = await Promise.all(
    repos.map(async (repo) => {
      const current = normalizeRepoTaskIntegration(repo.taskIntegration)
      const next = current
        ? normalizeRepoTaskIntegration({
            providers: current.providers.filter((entry) => entry !== provider),
            defaultProvider: current.defaultProvider
          })
        : null
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
