import { useState, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import debounce from 'lodash/debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SearchConfig {
  fields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: { label: string; value: string }[];
  }[];
  sortOptions: {
    label: string;
    value: string;
  }[];
}

interface SearchProps {
  config: SearchConfig;
  onSearch: (params: SearchParams) => void | Promise<void>;
  initialParams?: Partial<SearchParams>;
  isLoading?: boolean;
}

interface SearchParams {
  query: string;
  filters: Record<string, any>;
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export function AdvancedSearch({
  config,
  onSearch,
  initialParams,
  isLoading
}: SearchProps) {
  const [isPending, startTransition] = useTransition();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: initialParams?.query || '',
    filters: initialParams?.filters || {},
    sort: initialParams?.sort || { field: '', direction: 'asc' }
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const debouncedSearch = useCallback(
    debounce((params: SearchParams) => {
      startTransition(() => {
        onSearch(params);
      });
    }, 300),
    [onSearch]
  );

  const handleQueryChange = (value: string) => {
    const newParams = { ...searchParams, query: value };
    setSearchParams(newParams);
    debouncedSearch(newParams);
  };

  const handleFilterChange = (field: string, value: any) => {
    const newFilters = { ...searchParams.filters };
    
    if (value === undefined || value === '') {
      delete newFilters[field];
      setActiveFilters(activeFilters.filter(f => f !== field));
    } else {
      newFilters[field] = value;
      if (!activeFilters.includes(field)) {
        setActiveFilters([...activeFilters, field]);
      }
    }

    const newParams = { ...searchParams, filters: newFilters };
    setSearchParams(newParams);
    debouncedSearch(newParams);
  };

  const handleSortChange = (field: string) => {
    const direction = 
      searchParams.sort.field === field && searchParams.sort.direction === 'asc'
        ? 'desc'
        : 'asc';

    const newParams = {
      ...searchParams,
      sort: { field, direction }
    };
    setSearchParams(newParams);
    debouncedSearch(newParams);
  };

  const clearFilter = (field: string) => {
    handleFilterChange(field, undefined);
  };

  const clearAllFilters = () => {
    const newParams = { ...searchParams, filters: {} };
    setSearchParams(newParams);
    setActiveFilters([]);
    debouncedSearch(newParams);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchParams.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="ابحث..."
            className="pl-10"
          />
          {searchParams.query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => handleQueryChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>فلترة البحث</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {config.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <Select
                      value={searchParams.filters[field.name] || ''}
                      onValueChange={(value) => handleFilterChange(field.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      value={searchParams.filters[field.name] || ''}
                      onChange={(e) => handleFilterChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}

              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={clearAllFilters}
                >
                  مسح جميع الفلاتر
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* عرض الفلاتر النشطة */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2"
          >
            {activeFilters.map((field) => {
              const fieldConfig = config.fields.find(f => f.name === field);
              const value = searchParams.filters[field];
              const label = fieldConfig?.options?.find(
                opt => opt.value === value
              )?.label || value;

              return (
                <Badge
                  key={field}
                  variant="secondary"
                  className="pl-2 pr-1 py-1"
                >
                  <span className="ml-1">
                    {fieldConfig?.label}: {label}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={() => clearFilter(field)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* خيارات الترتيب */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {config.sortOptions.map((option) => (
          <Button
            key={option.value}
            variant={searchParams.sort.field === option.value ? "default" : "outline"}
            size="sm"
            className="min-w-max"
            onClick={() => handleSortChange(option.value)}
          >
            {option.label}
            {searchParams.sort.field === option.value && (
              searchParams.sort.direction === 'asc' ? (
                <SortAsc className="ml-2 h-4 w-4" />
              ) : (
                <SortDesc className="ml-2 h-4 w-4" />
              )
            )}
          </Button>
        ))}
      </div>

      {/* حالة التحميل */}
      {(isLoading || isPending) && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}