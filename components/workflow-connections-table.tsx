'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Types
export type ConnectionHealth = 'healthy' | 'not setup' | 'unhealthy'

export interface WorkflowConnection {
  domain: string
  server_name: string
  workflow_integration_id: string
  type: string
  status: 'enabled' | 'disabled'
  health: ConnectionHealth
  workflow_connection_id: string | null // null = supported but not configured
}

// Integration that may or may not have connections
export interface WorkflowIntegration {
  server_name: string
  workflow_integration_id: string
  supported_domains: string[] // domains this integration supports
  supported_types: string[] // types this integration supports
}

interface WorkflowConnectionsTableProps {
  connections: WorkflowConnection[]
  integrations: WorkflowIntegration[] // All integrations (including those with no connections)
  onConnectionUpdate: (
    connectionId: string,
    updates: Partial<Pick<WorkflowConnection, 'domain' | 'type' | 'status'>>
  ) => void
  domainOptions: string[]
  typeOptions: string[]
}

// Group connections by workflow_integration_id (server), including integrations with no connections
function groupConnectionsByServer(
  connections: WorkflowConnection[],
  integrations: WorkflowIntegration[]
): Map<string, { integration: WorkflowIntegration; connections: WorkflowConnection[] }> {
  const grouped = new Map<string, { integration: WorkflowIntegration; connections: WorkflowConnection[] }>()
  
  // Initialize with all integrations (including those with no connections)
  integrations.forEach((integration) => {
    grouped.set(integration.workflow_integration_id, {
      integration,
      connections: [],
    })
  })
  
  // Sort connections by server_name, then domain, then type for consistent display
  const sorted = [...connections].sort((a, b) => {
    if (a.server_name !== b.server_name) return a.server_name.localeCompare(b.server_name)
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain)
    return a.type.localeCompare(b.type)
  })
  
  sorted.forEach((conn) => {
    const existing = grouped.get(conn.workflow_integration_id)
    if (existing) {
      existing.connections.push(conn)
    }
  })
  
  return grouped
}

// Check if a specific domain+type combination would conflict WITHIN THE SAME SERVER
// Only conflicts if there's another row with an actual connection (non-null workflow_connection_id)
function wouldConflictWithinServer(
  connections: WorkflowConnection[],
  currentConnection: WorkflowConnection,
  domain: string,
  type: string
): { conflicts: boolean; connectionId?: string } {
  // Only check connections from the same server (workflow_integration_id)
  // AND that have an actual connection set up (non-null workflow_connection_id)
  const conflicting = connections.find(
    (conn) =>
      conn.workflow_connection_id !== currentConnection.workflow_connection_id &&
      conn.workflow_connection_id !== null && // Must have an actual connection
      conn.workflow_integration_id === currentConnection.workflow_integration_id &&
      conn.domain === domain &&
      conn.type === type
  )
  return {
    conflicts: !!conflicting,
    connectionId: conflicting?.workflow_connection_id ?? undefined,
  }
}

// Check if a domain is supported by the integration
function isDomainSupported(
  integration: WorkflowIntegration,
  domain: string
): boolean {
  return integration.supported_domains.includes(domain)
}

// Check if a type is supported by the integration
function isTypeSupported(
  integration: WorkflowIntegration,
  type: string
): boolean {
  return integration.supported_types.includes(type)
}

// External link icon component
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  )
}

// Health badge component
function HealthBadge({
  health,
  connectionId,
}: {
  health: ConnectionHealth
  connectionId: string
}) {
  const config = {
    healthy: {
      label: 'Healthy',
      className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
      linkClassName: 'text-emerald-600',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    'not setup': {
      label: 'Not Setup',
      className: 'bg-amber-500/15 text-amber-600 border-amber-500/20',
      linkClassName: 'text-amber-600',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    unhealthy: {
      label: 'Unhealthy',
      className: 'bg-red-500/15 text-red-600 border-red-500/20',
      linkClassName: 'text-red-600',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  }

  const { label, className, linkClassName, icon } = config[health]

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={cn('gap-1', className)}>
        {icon}
        {label}
      </Badge>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`/connections/${connectionId}/details`}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors',
              linkClassName
            )}
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </TooltipTrigger>
        <TooltipContent>View connection details</TooltipContent>
      </Tooltip>
    </div>
  )
}

// Disabled select item with tooltip
function DisabledSelectOption({
  label,
  reason,
}: {
  label: string
  reason: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative flex w-full cursor-not-allowed items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm',
            'opacity-50 select-none'
          )}
        >
          {label}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        {reason}
      </TooltipContent>
    </Tooltip>
  )
}

// Domain selector with conflict detection (scoped to same server) and support check
function DomainSelector({
  connection,
  connections,
  integration,
  domainOptions,
  onUpdate,
}: {
  connection: WorkflowConnection
  connections: WorkflowConnection[]
  integration: WorkflowIntegration
  domainOptions: string[]
  onUpdate: (domain: string) => void
}) {
  return (
    <Select value={connection.domain} onValueChange={onUpdate}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {domainOptions.map((domain) => {
          // First check if domain is supported by this integration
          if (!isDomainSupported(integration, domain)) {
            return (
              <DisabledSelectOption
                key={domain}
                label={domain}
                reason={`${connection.server_name} does not support ${domain}`}
              />
            )
          }

          // Then check for conflicts
          const conflict = wouldConflictWithinServer(
            connections,
            connection,
            domain,
            connection.type
          )

          if (conflict.conflicts) {
            return (
              <DisabledSelectOption
                key={domain}
                label={domain}
                reason={`${connection.server_name} already has a "${domain}:${connection.type}" connection`}
              />
            )
          }

          return (
            <SelectItem key={domain} value={domain}>
              {domain}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// Type selector with conflict detection (scoped to same server) and support check
function TypeSelector({
  connection,
  connections,
  integration,
  typeOptions,
  onUpdate,
}: {
  connection: WorkflowConnection
  connections: WorkflowConnection[]
  integration: WorkflowIntegration
  typeOptions: string[]
  onUpdate: (type: string) => void
}) {
  return (
    <Select value={connection.type} onValueChange={onUpdate}>
      <SelectTrigger className="w-[100px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {typeOptions.map((type) => {
          // First check if type is supported by this integration
          if (!isTypeSupported(integration, type)) {
            return (
              <DisabledSelectOption
                key={type}
                label={type}
                reason={`${connection.server_name} does not support ${type}`}
              />
            )
          }

          // Then check for conflicts
          const conflict = wouldConflictWithinServer(
            connections,
            connection,
            connection.domain,
            type
          )

          if (conflict.conflicts) {
            return (
              <DisabledSelectOption
                key={type}
                label={type}
                reason={`${connection.server_name} already has a "${connection.domain}:${type}" connection`}
              />
            )
          }

          return (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// Server group header row
function ServerGroupHeader({ 
  serverName, 
  integrationId,
  connectionCount 
}: { 
  serverName: string
  integrationId: string
  connectionCount: number 
}) {
  return (
    <TableRow className="bg-muted/50 hover:bg-muted/50">
      <TableCell colSpan={5} className="py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary uppercase">
                {serverName.charAt(0)}
              </span>
            </div>
            <span className="font-semibold text-sm">{serverName}</span>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {integrationId}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
          </span>
        </div>
      </TableCell>
    </TableRow>
  )
}

// Row for integration with no connections
function NoConnectionRow({ 
  integrationId 
}: { 
  integrationId: string 
}) {
  return (
    <TableRow className="border-l-2 border-l-muted-foreground/20">
      <TableCell colSpan={4} className="pl-10 text-muted-foreground text-sm">
        No connections configured
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={`/integrations/${encodeURIComponent(integrationId)}/setup`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Set up connection
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent>Configure a new connection for this integration</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

export function WorkflowConnectionsTable({
  connections,
  integrations,
  onConnectionUpdate,
  domainOptions,
  typeOptions,
}: WorkflowConnectionsTableProps) {
  const groupedConnections = groupConnectionsByServer(connections, integrations)

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px] text-muted-foreground text-xs">
              Connection ID
            </TableHead>
            <TableHead className="w-[140px]">Domain</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[120px]">Health</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(groupedConnections.entries()).map(([integrationId, { integration, connections: serverConnections }]) => {
            // Filter to only show connections with actual connection IDs (not null)
            const displayConnections = serverConnections.filter(c => c.workflow_connection_id !== null)
            
            return (
              <React.Fragment key={integrationId}>
                {/* Server group header */}
                <ServerGroupHeader
                  serverName={integration.server_name}
                  integrationId={integrationId}
                  connectionCount={displayConnections.length}
                />
                
                {/* Show "no connections" row if integration has no configured connections */}
                {displayConnections.length === 0 && (
                  <NoConnectionRow integrationId={integrationId} />
                )}
                
                {/* Connection rows for this server (only those with actual connections) */}
                {displayConnections.map((connection) => (
                  <TableRow 
                    key={connection.workflow_connection_id}
                    className="border-l-2 border-l-primary/20"
                  >
                    <TableCell className="pl-10 text-muted-foreground text-xs font-mono">
                      {connection.workflow_connection_id ?? (
                        <span className="italic text-muted-foreground/60">not configured</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DomainSelector
                        connection={connection}
                        connections={connections}
                        integration={integration}
                        domainOptions={domainOptions}
                        onUpdate={(domain) =>
                          onConnectionUpdate(connection.workflow_connection_id!, {
                            domain,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TypeSelector
                        connection={connection}
                        connections={connections}
                        integration={integration}
                        typeOptions={typeOptions}
                        onUpdate={(type) =>
                          onConnectionUpdate(connection.workflow_connection_id!, {
                            type,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {connection.health === 'healthy' && connection.workflow_connection_id ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={connection.status === 'enabled'}
                            onCheckedChange={(checked) =>
                              onConnectionUpdate(connection.workflow_connection_id!, {
                                status: checked ? 'enabled' : 'disabled',
                              })
                            }
                          />
                          <Badge
                            variant={
                              connection.status === 'enabled' ? 'default' : 'secondary'
                            }
                            className={cn(
                              connection.status === 'enabled'
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {connection.status}
                          </Badge>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-not-allowed">
                              <Switch
                                checked={connection.status === 'enabled'}
                                disabled
                                className="opacity-50"
                              />
                              <Badge
                                variant="secondary"
                                className="bg-muted text-muted-foreground opacity-50"
                              >
                                {connection.status}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {!connection.workflow_connection_id
                              ? 'Set up connection first'
                              : connection.health === 'not setup'
                              ? 'Complete setup before enabling'
                              : 'Fix connection health before enabling'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {connection.workflow_connection_id ? (
                        <HealthBadge
                          health={connection.health}
                          connectionId={connection.workflow_connection_id}
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`/integrations/${encodeURIComponent(connection.workflow_integration_id)}/setup?domain=${connection.domain}&type=${connection.type}`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                            >
                              Set up
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Configure this connection</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
