import { TASK_PROVIDERS, isTaskProvider, type TaskProvider } from './task-providers'

/** Project-owned Tasks setup; absent means the project follows the global Tasks providers. */
export type RepoTaskIntegration = {
  providers: TaskProvider[]
  defaultProvider: TaskProvider
}

/** null clears the override; undefined means the value was malformed and must be ignored. */
export function normalizeRepoTaskIntegration(
  value: unknown
): RepoTaskIntegration | null | undefined {
  if (value === null) {
    return null
  }
  if (!value || typeof value !== 'object' || !('providers' in value)) {
    return undefined
  }
  const rawProviders = value.providers
  if (!Array.isArray(rawProviders)) {
    return undefined
  }
  // Keep canonical provider order so equal setups compare and render the same everywhere.
  const providers = TASK_PROVIDERS.filter((provider) => rawProviders.includes(provider))
  if (providers.length === 0) {
    return undefined
  }
  const rawDefault = 'defaultProvider' in value ? value.defaultProvider : undefined
  const defaultProvider =
    isTaskProvider(rawDefault) && providers.includes(rawDefault) ? rawDefault : providers[0]
  return { providers, defaultProvider }
}

/** Selected repos all carry their own setup: show their combined providers; otherwise fall back to global. */
export function resolveTaskIntegrationForRepos(
  repos: readonly { taskIntegration?: RepoTaskIntegration | null }[]
): RepoTaskIntegration | null {
  if (repos.length === 0) {
    return null
  }
  const integrations: RepoTaskIntegration[] = []
  for (const repo of repos) {
    const integration = normalizeRepoTaskIntegration(repo.taskIntegration)
    if (!integration) {
      return null
    }
    integrations.push(integration)
  }
  const providers = TASK_PROVIDERS.filter((provider) =>
    integrations.some((integration) => integration.providers.includes(provider))
  )
  return { providers, defaultProvider: integrations[0].defaultProvider }
}
