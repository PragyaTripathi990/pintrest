"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import PinFeed from "./PinFeed";

export default function SearchView({ q }: { q: string }) {
  const { data: chips } = useQuery({
    queryKey: ["suggestions", q],
    queryFn: () => api.get<string[]>(`/api/search/suggestions?q=${encodeURIComponent(q)}`),
  });

  return (
    <div className="py-3">
      {chips && chips.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
          {chips.map((c) => (
            <Link
              key={c}
              href={`/search?q=${encodeURIComponent(c)}`}
              className="shrink-0 px-4 h-9 inline-flex items-center rounded-full bg-pingray-200 hover:bg-pingray-300 text-sm font-semibold capitalize"
            >
              {c}
            </Link>
          ))}
        </div>
      )}
      <PinFeed
        endpoint={`/api/search/pins?q=${encodeURIComponent(q)}`}
        queryKey={["search", q]}
        emptyMessage={`No Pins found for "${q}". Try another search.`}
      />
    </div>
  );
}
