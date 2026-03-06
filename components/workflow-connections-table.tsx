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
export interface WorkflowConnection {
  domain: string
  server_name: string
  workflow_integration_id: string
  type: string
  status: 'enabled' | 'disabled'
  workflow_connection_id: string
}

interface WorkflowConnectionsTableProps {
  connections: WorkflowConnection[]
  onConnectionUpdate: (
    connectionId: string,
    updates: Partial<Pick<WorkflowConnection, 'domain' | 'type' | 'status'>>
  ) => void
  domainOptions: string[]
  typeOptions: string[]
}

// Group connections by workflow_integration_id (server)
function groupConnectionsByServer(
  connections: WorkflowConnection[]
): Map<string, WorkflowConnection[]> {
  const grouped = new Map<string, WorkflowConnection[]>()
  
  // Sort connections by server_name, then domain, then type for consistent display
  const sorted = [...connections].sort((a, b) => {
    if (a.server_name !== b.server_name) return a.server_name.localeCompare(b.server_name)
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain)
    return a.type.localeCompare(b.type)
  })
  
  sorted.forEach((conn) => {
    const existing = grouped.get(conn.workflow_integration_id) || []
    grouped.set(conn.workflow_integration_id, [...existing, conn])
  })
  
  return grouped
}

// Check if a specific domain+type combination would conflict WITHIN THE SAME SERVER
function wouldConflictWithinServer(
  connections: WorkflowConnection[],
  currentConnection: WorkflowConnection,
  domain: string,
  type: string
): { conflicts: boolean; connectionId?: string } {
  // Only check connections from the same server (workflow_integration_id)
  const conflicting = connections.find(
    (conn) =>
      conn.workflow_connection_id !== currentConnection.workflow_connection_id &&
      conn.workflow_integration_id === currentConnection.workflow_integration_id &&
      conn.domain === domain &&
      conn.type === type
  )
  return {
    conflicts: !!conflicting,
    connectionId: conflicting?.workflow_connection_id,
  }
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

// Domain selector with conflict detection (scoped to same server)
function DomainSelector({
  connection,
  connections,
  domainOptions,
  onUpdate,
}: {
  connection: WorkflowConnection
  connections: WorkflowConnection[]
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

// Type selector with conflict detection (scoped to same server)
function TypeSelector({
  connection,
  connections,
  typeOptions,
  onUpdate,
}: {
  connection: WorkflowConnection
  connections: WorkflowConnection[]
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

export function WorkflowConnectionsTable({
  connections,
  onConnectionUpdate,
  domainOptions,
  typeOptions,
}: WorkflowConnectionsTableProps) {
  const groupedConnections = groupConnectionsByServer(connections)

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Domain</TableHead>
            <TableHead className="w-[140px]">Type</TableHead>
            <TableHead className="w-[160px]">Status</TableHead>
            <TableHead className="text-muted-foreground text-xs">
              Connection ID
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(groupedConnections.entries()).map(([integrationId, serverConnections]) => {
            const serverName = serverConnections[0].server_name
            return (
              <React.Fragment key={integrationId}>
                {/* Server group header */}
                <ServerGroupHeader
                  serverName={serverName}
                  integrationId={integrationId}
                  connectionCount={serverConnections.length}
                />
                
                {/* Connection rows for this server */}
                {serverConnections.map((connection) => (
                  <TableRow 
                    key={connection.workflow_connection_id}
                    className="border-l-2 border-l-primary/20"
                  >
                    <TableCell className="pl-10">
                      <DomainSelector
                        connection={connection}
                        connections={connections}
                        domainOptions={domainOptions}
                        onUpdate={(domain) =>
                          onConnectionUpdate(connection.workflow_connection_id, {
                            domain,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TypeSelector
                        connection={connection}
                        connections={connections}
                        typeOptions={typeOptions}
                        onUpdate={(type) =>
                          onConnectionUpdate(connection.workflow_connection_id, {
                            type,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={connection.status === 'enabled'}
                          onCheckedChange={(checked) =>
                            onConnectionUpdate(connection.workflow_connection_id, {
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
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {connection.workflow_connection_id}
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
