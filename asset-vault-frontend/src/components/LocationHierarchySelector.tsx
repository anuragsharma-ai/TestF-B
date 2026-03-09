import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LOCATION_LEVELS, LOCATION_LEVEL_LABELS, LocationLevel, LocationPath } from '@/types';
import { getChildrenOf, buildBreadcrumb, flattenHierarchy, mockLocationHierarchy } from '@/data/mockData';
import { Search, ChevronRight, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  value: LocationPath;
  onChange: (path: LocationPath) => void;
  showBreadcrumb?: boolean;
}

export default function LocationHierarchySelector({ value, onChange, showBreadcrumb = true }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const allNodes = useMemo(() => flattenHierarchy(mockLocationHierarchy), []);

  const handleSelect = (level: LocationLevel, nodeId: string) => {
    const levelIndex = LOCATION_LEVELS.indexOf(level);
    const newPath: LocationPath = {};
    // Keep selections up to and including this level
    for (let i = 0; i <= levelIndex; i++) {
      const lvl = LOCATION_LEVELS[i];
      if (lvl === level) {
        newPath[lvl] = nodeId;
      } else if (value[lvl]) {
        newPath[lvl] = value[lvl];
      }
    }
    onChange(newPath);
  };

  // Determine which levels to show (show next level after last selected)
  const activeLevels: { level: LocationLevel; options: { id: string; name: string }[] }[] = [];

  // First level always shows
  const rootChildren = getChildrenOf(null);
  activeLevels.push({
    level: 'company',
    options: rootChildren.map((n) => ({ id: n.id, name: n.name })),
  });

  // For each subsequent level, show if parent is selected
  for (let i = 1; i < LOCATION_LEVELS.length; i++) {
    const parentLevel = LOCATION_LEVELS[i - 1];
    const currentLevel = LOCATION_LEVELS[i];
    const parentId = value[parentLevel];
    if (!parentId) break;

    const children = getChildrenOf(parentId);
    if (children.length === 0) break;

    activeLevels.push({
      level: currentLevel,
      options: children.map((n) => ({ id: n.id, name: n.name })),
    });
  }

  const breadcrumb = buildBreadcrumb(value);

  // Filter options by search
  const filterOptions = (options: { id: string; name: string }[]) => {
    if (!searchTerm) return options;
    const q = searchTerm.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  };

  if (isMobile) {
    // Mobile: cascading step-by-step dropdowns
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {activeLevels.map(({ level, options }) => {
          const filtered = filterOptions(options);
          return (
            <div key={level} className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {LOCATION_LEVEL_LABELS[level]}
              </Label>
              <Select
                value={value[level] || ''}
                onValueChange={(v) => handleSelect(level, v)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={`Select ${LOCATION_LEVEL_LABELS[level]}`} />
                </SelectTrigger>
                <SelectContent>
                  {filtered.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          );
        })}

        {showBreadcrumb && breadcrumb && (
          <div className="rounded-lg bg-muted p-3 text-xs">
            <p className="text-muted-foreground mb-1 font-medium">Selected Location:</p>
            <p className="font-medium text-foreground leading-relaxed">{breadcrumb}</p>
          </div>
        )}
      </div>
    );
  }

  // Desktop: multi-column structured selection
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {activeLevels.map(({ level, options }) => {
          const filtered = filterOptions(options);
          return (
            <div key={level} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{LOCATION_LEVEL_LABELS[level]}</Label>
              <Select
                value={value[level] || ''}
                onValueChange={(v) => handleSelect(level, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${LOCATION_LEVEL_LABELS[level]}`} />
                </SelectTrigger>
                <SelectContent>
                  {filtered.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {showBreadcrumb && breadcrumb && (
        <div className="rounded-lg bg-muted p-3 text-sm flex items-start gap-2">
          <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{breadcrumb}</p>
        </div>
      )}
    </div>
  );
}
