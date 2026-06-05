"use client";

import { Badge } from "@/components/common";
import { REGIONS, type Region } from "@/lib/region";

interface RegionFilterProps {
  selected: Region;
  onChange: (region: Region) => void;
}

export function RegionFilter({ selected, onChange }: RegionFilterProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-pill bg-bg-card shadow-md max-w-[calc(100%-2rem)] overflow-x-auto">
      {REGIONS.map((region) => (
        <Badge
          key={region}
          variant="filter"
          selected={selected === region}
          onClick={() => onChange(region)}
        >
          {region}
        </Badge>
      ))}
    </div>
  );
}

export default RegionFilter;
