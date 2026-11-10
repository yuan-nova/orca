import { useEffect, useState } from 'react'
import type { JiraProject, JiraSite } from '../../../shared/jira/jira-types'
import type { RuntimeClientTarget } from '../../../shared/runtime-client-target'
import type { TaskSourceContext } from '../../../shared/task-source-context'
import { taskSourceRuntimeTarget } from '@/lib/task-source-runtime-target'
import {
  jiraListProjectsForTarget,
  jiraStatusForTarget
} from '@/runtime/jira/runtime-jira-project-client'

type JiraProjectInventorySource = RuntimeClientTarget | TaskSourceContext

const EMPTY_PROJECTS: JiraProject[] = []
const EMPTY_SITES: JiraSite[] = []

export function useJiraProjectInventory(source: JiraProjectInventorySource, enabled: boolean) {
  const [inventory, setInventory] = useState<{
    source: JiraProjectInventorySource
    projects: JiraProject[]
    sites: JiraSite[]
    connected: boolean
    error: string | null
  } | null>(null)
  useEffect(() => {
    if (!enabled) {
      return
    }
    let cancelled = false
    const target = source.kind === 'task-source' ? taskSourceRuntimeTarget(source) : source
    void jiraStatusForTarget(target)
      .then(async (status) => ({
        source,
        connected: status.connected,
        sites: status.connected ? (status.sites ?? []) : [],
        projects: status.connected ? await jiraListProjectsForTarget(target, 'all') : [],
        error: null
      }))
      .then((next) => {
        if (!cancelled) {
          setInventory(next)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setInventory({
            source,
            connected: false,
            projects: [],
            sites: [],
            error: error instanceof Error ? error.message : String(error)
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [source, enabled])
  const current = inventory?.source === source ? inventory : null
  return {
    projects: current?.projects ?? EMPTY_PROJECTS,
    sites: current?.sites ?? EMPTY_SITES,
    connected: current?.connected ?? false,
    error: current?.error ?? null,
    loading: enabled && current === null
  }
}
