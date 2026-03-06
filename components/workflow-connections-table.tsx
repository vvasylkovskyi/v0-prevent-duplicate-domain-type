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

// Helper to get which domain+type combinations are taken (excluding current row)
function getTakenCombinations(
  connections: WorkflowConnection[],
  excludeConnectionId: string
): Set<string> {
  const taken = new Set<string>()
  connections.forEach((conn) => {
    if (conn.workflow_connection_id !== excludeConnectionId) {
      taken.add(`${conn.domain}:${conn.type}`)
    }
  })
  return taken
}

// Check if a specific domain+type combination would conflict
function wouldConflict(
  connections: WorkflowConnection[],
  excludeConnectionId: string,
  domain: string,
  type: string
): { conflicts: boolean; usedBy?: string } {
  const conflicting = connections.find(
    (conn) =>
      conn.workflow_connection_id !== excludeConnectionId &&
      conn.domain === domain &&
      conn.type === type
  )
  return {
    conflicts: !!conflicting,
    usedBy: conflicting?.server_name,
  }
}

// Disabled select item with tooltip
function DisabledSelectOption({
  value,
  label,
  reason,
}: {
  value: string
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
      <TooltipContent side="right" className="max-w-[200px]">
        {reason}
      </TooltipContent>
    </Tooltip>
  )
}

// Domain selector with conflict detection
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
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {domainOptions.map((domain) => {
          const conflict = wouldConflict(
            connections,
            connection.workflow_connection_id,
            domain,
            connection.type
          )

          if (conflict.conflicts) {
            return (
              <DisabledSelectOption
                key={domain}
                value={domain}
                label={domain}
                reason={`Already used by ${conflict.usedBy} with type "${connection.type}"`}
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

// Type selector with conflict detection
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
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {typeOptions.map((type) => {
          const conflict = wouldConflict(
            connections,
            connection.workflow_connection_id,
            connection.domain,
            type
          )

          if (conflict.conflicts) {
            return (
              <DisabledSelectOption
                key={type}
                value={type}
                label={type}
                reason={`Already used by ${conflict.usedBy} with domain "${connection.domain}"`}
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

export function WorkflowConnectionsTable({
  connections,
  onConnectionUpdate,
  domainOptions,
  typeOptions,
}: WorkflowConnectionsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Server</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-muted-foreground text-xs">
              Connection ID
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map((connection) => (
            <TableRow key={connection.workflow_connection_id}>
              <TableCell className="font-medium">
                {connection.server_name}
              </TableCell>
              <TableCell>
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
        </TableBody>
      </Table>
    </div>
  )
}
