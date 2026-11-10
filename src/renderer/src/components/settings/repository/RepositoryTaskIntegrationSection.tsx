import { useMemo, useState } from 'react'
import type { Repo } from '../../../../../shared/repo-types'
import { getRepoExecutionHostId } from '../../../../../shared/execution-host'
import {
  normalizeRepoTaskIntegration,
  type RepoTaskIntegration
} from '../../../../../shared/repo-task-integration'
import { TASK_PROVIDERS, type TaskProvider } from '../../../../../shared/task-providers'
import { getSourceOptions } from '@/components/task-page/task-page-localized-options'
import { taskSourceRuntimeTarget } from '@/lib/task-source-runtime-target'
import { useJiraProjectInventory } from '../../use-jira-project-inventory'
import { useAppStore } from '@/store/index'
import { Checkbox } from '../../ui/checkbox'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { SettingsSwitchRow } from '../form-controls/SettingsFormControls'
import { SearchableSetting } from '../section-layout/SearchableSetting'
import { translate } from '@/i18n/i18n'
import { translateSearchKeyword } from '../search/settings-search-keywords'

export function getRepositoryTaskIntegrationTitle(): string {
  return translate('components.RepositoryTaskIntegrationSection.title', 'Task integrations')
}

export function getRepositoryTaskIntegrationDescription(): string {
  return translate(
    'components.RepositoryTaskIntegrationSection.description',
    'Choose which task sources Tasks shows for this project. Off follows the global Tasks settings.'
  )
}

export function getRepositoryTaskIntegrationKeywords(repo: Pick<Repo, 'displayName'>): string[] {
  return [
    repo.displayName,
    ...translateSearchKeyword('components.RepositoryTaskIntegrationSection.keywordTasks', 'tasks', {
      aliases: ['github', 'gitlab', 'linear', 'jira']
    }),
    ...translateSearchKeyword(
      'components.RepositoryTaskIntegrationSection.keywordTaskSource',
      'task source'
    )
  ]
}

// Select items need a non-empty value; this one stands for "no pinned site".
const FOLLOW_TASKS_JIRA_SITE = '__follow-tasks-site__'

export function RepositoryTaskIntegrationSection({
  repo,
  updateRepo,
  forceVisible
}: {
  repo: Repo
  updateRepo: (id: string, updates: { taskIntegration: RepoTaskIntegration | null }) => unknown
  forceVisible?: boolean
}): React.JSX.Element {
  const hostId = getRepoExecutionHostId(repo)
  const [error, setError] = useState<string | null>(null)
  const globalVisibleProviders = useAppStore((state) => state.settings?.visibleTaskProviders)
  const globalDefaultProvider = useAppStore((state) => state.settings?.defaultTaskSource)
  const integration = normalizeRepoTaskIntegration(repo.taskIntegration) ?? null
  const sourceOptions = getSourceOptions()
  const showsJira = integration?.providers.includes('jira') === true
  const jiraSource = useMemo(() => taskSourceRuntimeTarget({ hostId }), [hostId])
  const jiraInventory = useJiraProjectInventory(jiraSource, showsJira)
  // Keep a pinned site listed even when this runtime no longer reports it, so the choice stays visible.
  const pinnedSiteMissing =
    integration?.jiraSiteId !== undefined &&
    !jiraInventory.sites.some((site) => site.id === integration.jiraSiteId)

  const save = async (next: RepoTaskIntegration | null) => {
    setError(null)
    const result = await updateRepo(repo.id, { taskIntegration: next })
    const echoed = useAppStore
      .getState()
      .repos.find(
        (entry) => entry.id === repo.id && getRepoExecutionHostId(entry) === hostId
      )?.taskIntegration
    if (result === false || (next !== null && !echoed)) {
      setError(
        translate(
          'components.RepositoryTaskIntegrationSection.saveFailed',
          'Could not save task integrations. Update this runtime and try again.'
        )
      )
    }
  }

  const enable = (enabled: boolean) => {
    if (!enabled) {
      void save(null)
      return
    }
    // Seed from the global setup so turning this on does not change what Tasks shows yet.
    void save(
      normalizeRepoTaskIntegration({
        providers: globalVisibleProviders ?? TASK_PROVIDERS,
        defaultProvider: globalDefaultProvider
      }) ?? { providers: [...TASK_PROVIDERS], defaultProvider: 'github' }
    )
  }

  const toggleProvider = (provider: TaskProvider, checked: boolean) => {
    if (!integration) {
      return
    }
    const providers = checked
      ? [...integration.providers, provider]
      : integration.providers.filter((entry) => entry !== provider)
    const next = normalizeRepoTaskIntegration({ ...integration, providers })
    if (next) {
      void save(next)
    }
  }

  const title = getRepositoryTaskIntegrationTitle()
  return (
    <SearchableSetting
      title={title}
      description={getRepositoryTaskIntegrationDescription()}
      keywords={getRepositoryTaskIntegrationKeywords(repo)}
      forceVisible={forceVisible}
      className="space-y-2"
    >
      <SettingsSwitchRow
        label={title}
        description={getRepositoryTaskIntegrationDescription()}
        checked={integration !== null}
        onChange={() => enable(integration === null)}
      />
      {integration ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4">
            {sourceOptions.map((source) => {
              const checked = integration.providers.includes(source.id)
              const id = `repo-task-provider-${repo.id}-${source.id}`
              return (
                <div key={source.id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    // Keep at least one source so Tasks always has something to open.
                    disabled={checked && integration.providers.length === 1}
                    onCheckedChange={(value) => toggleProvider(source.id, value === true)}
                  />
                  <Label htmlFor={id}>
                    <span className="flex items-center gap-1.5">
                      <source.Icon className="size-3.5" />
                      {source.label}
                    </span>
                  </Label>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>
              {translate(
                'components.RepositoryTaskIntegrationSection.defaultSource',
                'Default task source'
              )}
            </Label>
            <Select
              value={integration.defaultProvider}
              onValueChange={(value) =>
                void save(
                  normalizeRepoTaskIntegration({ ...integration, defaultProvider: value }) ??
                    integration
                )
              }
            >
              <SelectTrigger size="sm" className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions
                  .filter((source) => integration.providers.includes(source.id))
                  .map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {showsJira ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <Label>
                  {translate('components.RepositoryTaskIntegrationSection.jiraSite', 'Jira site')}
                </Label>
                <Select
                  value={integration.jiraSiteId ?? FOLLOW_TASKS_JIRA_SITE}
                  disabled={jiraInventory.loading}
                  onValueChange={(value) => {
                    const { jiraSiteId: _previous, ...rest } = integration
                    void save(
                      normalizeRepoTaskIntegration(
                        value === FOLLOW_TASKS_JIRA_SITE ? rest : { ...rest, jiraSiteId: value }
                      ) ?? integration
                    )
                  }}
                >
                  <SelectTrigger size="sm" className="min-w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FOLLOW_TASKS_JIRA_SITE}>
                      {translate(
                        'components.RepositoryTaskIntegrationSection.jiraSiteFollow',
                        'Site selected in Tasks'
                      )}
                    </SelectItem>
                    {jiraInventory.sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.displayName || site.siteUrl}
                      </SelectItem>
                    ))}
                    {pinnedSiteMissing && integration.jiraSiteId ? (
                      <SelectItem value={integration.jiraSiteId}>
                        {translate(
                          'components.RepositoryTaskIntegrationSection.jiraSiteMissing',
                          'Disconnected Jira site'
                        )}
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {pinnedSiteMissing
                  ? translate(
                      'components.RepositoryTaskIntegrationSection.jiraSiteMissingHint',
                      'This Jira site is no longer connected, so Tasks uses the site selected there. Reconnect it in Integrations or pick another site.'
                    )
                  : translate(
                      'components.RepositoryTaskIntegrationSection.jiraSiteHint',
                      'Each Jira site has its own URL and token. Add sites in Integrations, then pick the one this project uses.'
                    )}
              </p>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {translate(
              'components.RepositoryTaskIntegrationSection.accountsHint',
              'Accounts are connected in Integrations. Linear uses the workspace selected there.'
            )}
          </p>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </SearchableSetting>
  )
}
