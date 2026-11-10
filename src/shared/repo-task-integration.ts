import { TASK_PROVIDERS, isTaskProvider, type TaskProvider } from './task-providers'

/** Project-owned Tasks setup; absent means the project follows the global Tasks providers. */
export type RepoTaskIntegration = {
  providers: TaskProvider[]
  defaultProvider: TaskProvider
  /** Connected Jira site this project reads; absent follows the site selected in Tasks. */
  jiraSiteId?: string
}

/** What Tasks shows for the selected repos; jiraSiteId 'all' means they use different sites. */
export type ResolvedTaskIntegration = {
  providers: TaskProvider[]
  defaultProvider: TaskProvider
  jiraSiteId?: string
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
  const rawSiteId = 'jiraSiteId' in value ? value.jiraSiteId : undefined
  // 'all' is a Tasks view choice, not a site, so a project can never pin it.
  const jiraSiteId =
    typeof rawSiteId === 'string' && rawSiteId.trim() && rawSiteId.trim() !== 'all'
      ? rawSiteId.trim()
      : undefined
  return { providers, defaultProvider, ...(jiraSiteId ? { jiraSiteId } : {}) }
}

/** Selected repos all carry their own setup: show their combined providers; otherwise fall back to global. */
export function resolveTaskIntegrationForRepos(
  repos: readonly { taskIntegration?: RepoTaskIntegration | null }[]
): ResolvedTaskIntegration | null {
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
  const jiraSiteId = resolveJiraSiteId(integrations)
  return {
    providers,
    defaultProvider: integrations[0].defaultProvider,
    ...(jiraSiteId ? { jiraSiteId } : {})
  }
}

function resolveJiraSiteId(integrations: readonly RepoTaskIntegration[]): string | undefined {
  const jiraIntegrations = integrations.filter((integration) =>
    integration.providers.includes('jira')
  )
  const siteIds = new Set(jiraIntegrations.map((integration) => integration.jiraSiteId))
  if (!siteIds.size || (siteIds.size === 1 && siteIds.has(undefined))) {
    return undefined
  }
  // Repos that read different sites (or mix a pinned site with the Tasks selection) show all sites.
  return siteIds.size === 1 ? [...siteIds][0] : 'all'
}
