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
    <div className="overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
            {columns.map((column) => (
              <TableHead key={column.key} className="font-semibold text-[12px] uppercase tracking-wide text-white/60">
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
              className="border-white/[0.06] transition-all duration-200 hover:bg-white/[0.04] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              {columns.map((column) => (
                <TableCell key={column.key} className="text-white/80 text-[14px] font-normal tracking-[-0.01em]">
                  {column.render ? column.render(item) : String(item[column.key as keyof T])}
                </TableCell>
              ))}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-white/[0.08] hover:backdrop-blur-md text-white/50 hover:text-white/90 transition-all"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-white/[0.12] bg-black/90 backdrop-blur-xl text-white shadow-[0_8px_32px_rgba(0,0,0,0.9)] rounded-xl"
                  >
                    <DropdownMenuLabel className="text-white/60 text-[11px] uppercase tracking-wide font-semibold">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/[0.08]" />
                    {onView && (
                      <DropdownMenuItem
                        onClick={() => onView(item)}
                        className="text-white/80 text-[13px] focus:bg-white/[0.08] focus:text-white/95 rounded-lg"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(item)}
                        className="text-white/80 text-[13px] focus:bg-white/[0.08] focus:text-white/95 rounded-lg"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="text-white/80 text-[13px] focus:bg-white/[0.08] focus:text-white/95 rounded-lg"
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
