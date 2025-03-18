import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchFilter {
  id: string
  label: string
  options: { value: string; label: string }[]
}

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  filters?: SearchFilter[]
  suggestions?: string[]
  onFilterChange?: (filterId: string, value: string) => void
  onSearch?: (value: string) => void
  clearable?: boolean
  loading?: boolean
  rtl?: boolean
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    className,
    filters,
    suggestions,
    onFilterChange,
    onSearch,
    clearable = true,
    loading = false,
    rtl = true,
    value,
    onChange,
    ...props
  }, ref) => {
    const [searchValue, setSearchValue] = React.useState(value || "")
    const [showFilters, setShowFilters] = React.useState(false)
    const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({})

    // تحديث قيمة البحث عند تغييرها خارجياً
    React.useEffect(() => {
      if (value !== undefined) {
        setSearchValue(value)
      }
    }, [value])

    const handleSearch = (newValue: string) => {
      setSearchValue(newValue)
      onChange?.(({ target: { value: newValue } }) as any)
      onSearch?.(newValue)
    }

    const handleClear = () => {
      setSearchValue("")
      onChange?.(({ target: { value: "" } }) as any)
      onSearch?.("")
      setActiveFilters({})
    }

    const handleFilterChange = (filterId: string, value: string) => {
      const newFilters = { ...activeFilters, [filterId]: value }
      setActiveFilters(newFilters)
      onFilterChange?.(filterId, value)
    }

    return (
      <div 
        className={cn(
          "relative flex items-center gap-2",
          rtl ? "flex-row-reverse" : "flex-row",
          className
        )}
        dir={rtl ? "rtl" : "ltr"}
      >
        <div className="relative flex-1">
          <Input
            ref={ref}
            type="search"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className={cn(
              "pr-10",
              rtl ? "text-right" : "text-left"
            )}
            rtl={rtl}
            {...props}
          />
          <div className={cn(
            "absolute top-0 h-full flex items-center",
            rtl ? "left-3" : "right-3"
          )}>
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {clearable && searchValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {filters && filters.length > 0 && (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "shrink-0",
                  Object.keys(activeFilters).length > 0 && "bg-primary text-primary-foreground"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-3"
              align={rtl ? "start" : "end"}
              dir={rtl ? "rtl" : "ltr"}
            >
              <div className="space-y-4">
                <h4 className="font-medium">خيارات البحث المتقدم</h4>
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <select
                      className="w-full p-2 text-sm rounded-md border border-input bg-background"
                      value={activeFilters[filter.id] || ""}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    >
                      <option value="">الكل</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {suggestions && suggestions.length > 0 && searchValue && (
          <div
            className={cn(
              "absolute top-full mt-1 w-full bg-popover text-popover-foreground shadow-md rounded-md border border-border z-50",
              rtl ? "right-0" : "left-0"
            )}
          >
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => handleSearch(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"
