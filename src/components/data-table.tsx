"use client"

import type React from "react"
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl neu-table border-0">
      <Table>
        <TableHeader>
          <TableRow className="neu-flat neu-hover transition-colors">
            {columns.map((column) => (
                <TableHead key={column.key} className="font-semibold text-[12px] uppercase tracking-wide text-muted-foreground">
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className="neu-table-row transition-all duration-150 border-0"
            >
              {columns.map((column) => (
                <TableCell key={column.key} className="text-foreground text-[14px] font-normal tracking-[-0.01em]">
                  {column.render ? column.render(item) : String(item[column.key as keyof T])}
                </TableCell>
              ))}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg neu-flat neu-hover neu-active text-muted-foreground hover:text-foreground transition-all"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="neu-elevated border-0 text-foreground rounded-xl"
                  >
                    <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="neu-pressed" />
                    {onView && (
                      <DropdownMenuItem
                        onClick={() => onView(item)}
                        className="text-foreground text-[13px] focus:neu-elevated rounded-lg"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(item)}
                        className="text-foreground text-[13px] focus:neu-elevated rounded-lg"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="text-foreground text-[13px] focus:neu-elevated rounded-lg"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
