'use client'

import { useState } from 'react'
import {
  WorkflowConnectionsTable,
  type WorkflowConnection,
} from '@/components/workflow-connections-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Available options
const DOMAIN_OPTIONS = ['logs', 'metrics']
const TYPE_OPTIONS = ['api', 'mcp']

// Initial mock data
const INITIAL_CONNECTIONS: WorkflowConnection[] = [
  {
    domain: 'logs',
    server_name: 'grafana',
    type: 'api',
    status: 'enabled',
    workflow_connection_id: 'conn-456',
  },
  {
    domain: 'logs',
    server_name: 'datadog',
    type: 'mcp',
    status: 'enabled',
    workflow_connection_id: 'conn-567',
  },
  {
    domain: 'metrics',
    server_name: 'observe',
    type: 'api',
    status: 'disabled',
    workflow_connection_id: 'conn-678',
  },
]

export default function WorkflowConnectionsPage() {
  const [connections, setConnections] =
    useState<WorkflowConnection[]>(INITIAL_CONNECTIONS)

  const handleConnectionUpdate = (
    connectionId: string,
    updates: Partial<Pick<WorkflowConnection, 'domain' | 'type' | 'status'>>
  ) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.workflow_connection_id === connectionId
          ? { ...conn, ...updates }
          : conn
      )
    )
  }

  // Calculate currently used domain:type combinations for display
  const usedCombinations = connections.map(
    (c) => `${c.domain}:${c.type}`
  )

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Workflow Connections
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your workflow connections. Each domain + type combination can
            only be assigned to one server.
          </p>
        </div>

        {/* Info card showing the constraint */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <svg
                className="h-4 w-4 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Uniqueness Constraint
            </CardTitle>
            <CardDescription>
              Each <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">domain:type</code> combination must be unique. 
              Options that would create conflicts are disabled in the dropdowns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Currently allocated:</span>
              {usedCombinations.map((combo) => (
                <Badge key={combo} variant="outline" className="font-mono text-xs">
                  {combo}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main table */}
        <WorkflowConnectionsTable
          connections={connections}
          onConnectionUpdate={handleConnectionUpdate}
          domainOptions={DOMAIN_OPTIONS}
          typeOptions={TYPE_OPTIONS}
        />

        {/* Debug: Current state */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current State (for debugging)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(connections, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
