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

// Initial mock data showing the constraint scenarios
const INITIAL_CONNECTIONS: WorkflowConnection[] = [
  // Grafana has 2 connections: logs:api and logs:mcp
  {
    domain: 'logs',
    server_name: 'grafana',
    workflow_integration_id: 'pagerduty.com:grafana:1',
    type: 'api',
    status: 'enabled',
    health: 'healthy',
    workflow_connection_id: 'conn-001',
  },
  {
    domain: 'logs',
    server_name: 'grafana',
    workflow_integration_id: 'pagerduty.com:grafana:1',
    type: 'mcp',
    status: 'enabled',
    health: 'not setup',
    workflow_connection_id: 'conn-002',
  },
  // Datadog has 1 connection: metrics:mcp
  {
    domain: 'metrics',
    server_name: 'datadog',
    workflow_integration_id: 'pagerduty.com:datadog:1',
    type: 'mcp',
    status: 'enabled',
    health: 'healthy',
    workflow_connection_id: 'conn-003',
  },
  // Observe has 2 connections: metrics:api and logs:api
  {
    domain: 'metrics',
    server_name: 'observe',
    workflow_integration_id: 'pagerduty.com:observe:1',
    type: 'api',
    status: 'disabled',
    health: 'unhealthy',
    workflow_connection_id: 'conn-004',
  },
  {
    domain: 'logs',
    server_name: 'observe',
    workflow_integration_id: 'pagerduty.com:observe:1',
    type: 'api',
    status: 'enabled',
    health: 'healthy',
    workflow_connection_id: 'conn-005',
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

  // Group by server for summary display
  const serverSummary = connections.reduce((acc, conn) => {
    const key = conn.server_name
    if (!acc[key]) acc[key] = []
    acc[key].push(`${conn.domain}:${conn.type}`)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Workflow Connections
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your workflow connections. Each server can have multiple connections, 
            but cannot have duplicate domain + type combinations.
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
              Uniqueness Constraint (per server)
            </CardTitle>
            <CardDescription>
              Within each server, each <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">domain:type</code> combination must be unique.
              Different servers can have the same combination (e.g., both grafana and datadog can have <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">logs:api</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(serverSummary).map(([server, combos]) => (
                <div key={server} className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium w-20">{server}:</span>
                  {combos.map((combo) => (
                    <Badge key={combo} variant="outline" className="font-mono text-xs">
                      {combo}
                    </Badge>
                  ))}
                </div>
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
