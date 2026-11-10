import type { Repo } from '../../../../../shared/repo-types'
import type { JiraProjectReference } from '../../../../../shared/jira/jira-project-reference'
import type { RepoTaskIntegration } from '../../../../../shared/repo-task-integration'
import { RepositoryJiraProjectSection } from './RepositoryJiraProjectSection'
import { RepositoryTaskIntegrationSection } from './RepositoryTaskIntegrationSection'

export { getRepositoryTaskIntegrationTitle } from './RepositoryTaskIntegrationSection'

export function RepositoryTaskSections({
  repo,
  updateRepo,
  forceVisible
}: {
  repo: Repo
  updateRepo: (
    id: string,
    updates:
      | { taskIntegration: RepoTaskIntegration | null }
      | { defaultJiraProject: JiraProjectReference | null }
  ) => unknown
  forceVisible?: boolean
}): React.JSX.Element {
  return (
    <>
      <RepositoryTaskIntegrationSection
        repo={repo}
        updateRepo={updateRepo}
        forceVisible={forceVisible}
      />
      <RepositoryJiraProjectSection
        repo={repo}
        updateRepo={updateRepo}
        forceVisible={forceVisible}
      />
    </>
  )
}
