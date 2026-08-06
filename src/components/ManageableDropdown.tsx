import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronsUpDown, Check, Edit2, Trash2, Plus, X, Save } from "lucide-react"
import type { DropdownItem } from "@/store/useStore"

interface ManageableDropdownProps {
  items: DropdownItem[]
  value: string
  onChange: (value: string) => void
  onAdd: (name: string) => void
  onUpdate: (id: string, name: string) => void
  onDelete: (id: string) => void
  placeholder?: string
}

export function ManageableDropdown({
  items,
  value,
  onChange,
  onAdd,
  onUpdate,
  onDelete,
  placeholder = "Select item..."
}: ManageableDropdownProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [addValue, setAddValue] = useState("")

  const selectedItem = items.find((item) => item.name === value)

  const handleEditStart = (e: React.MouseEvent, item: DropdownItem) => {
    e.stopPropagation()
    setEditingId(item.id)
    setEditValue(item.name)
  }

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (editingId && editValue.trim()) {
      onUpdate(editingId, editValue.trim())
      if (selectedItem?.id === editingId) {
        onChange(editValue.trim())
      }
    }
    setEditingId(null)
  }

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onDelete(id)
    if (selectedItem?.id === id) {
      onChange("")
    }
  }

  const handleAddSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (addValue.trim()) {
      onAdd(addValue.trim())
      setAddValue("")
      setIsAdding(false)
      onChange(addValue.trim())
    }
  }

  const handleAddCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAddValue("")
    setIsAdding(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-white"
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <ScrollArea className="h-[200px] w-full border-b">
          <div className="flex flex-col p-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 cursor-pointer group"
                onClick={() => {
                  if (editingId !== item.id) {
                    onChange(item.name)
                    setOpen(false)
                  }
                }}
              >
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <Input 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={handleEditSave}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={handleEditCancel}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Check
                        className={`h-4 w-4 ${
                          value === item.name ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => handleEditStart(e, item)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={(e) => handleDelete(e, item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="py-4 text-center text-sm text-slate-500">No items found.</div>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 bg-slate-50 rounded-b-md">
          {isAdding ? (
            <div className="flex items-center gap-2">
              <Input 
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder="New item name"
                className="h-8 text-sm"
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={handleAddSave}>
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={handleAddCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation()
                setIsAdding(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
