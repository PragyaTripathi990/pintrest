"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Pin, PinPage } from "@/lib/types";
import MasonryGrid from "./MasonryGrid";
import PinCard from "./PinCard";
import Spinner from "./Spinner";

interface PinFeedProps {
  endpoint: string;
  queryKey: unknown[];
  emptyMessage?: string;
}

export default function PinFeed({ endpoint, queryKey, emptyMessage }: PinFeedProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => {
        const sep = endpoint.includes("?") ? "&" : "?";
        const cursor = pageParam ? `&cursor=${pageParam}` : "";
        return api.get<PinPage>(`${endpoint}${sep}limit=25${cursor}`);
      },
      initialPageParam: 0 as number,
      getNextPageParam: (last) => last.next_cursor ?? undefined,
    });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "1000px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const pins: Pin[] = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={40} />
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="flex justify-center py-20 text-muted">
        {emptyMessage || "Nothing here yet."}
      </div>
    );
  }

  return (
    <div>
      <MasonryGrid>
        {pins.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </MasonryGrid>
      <div ref={sentinelRef} className="h-10" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Spinner size={32} />
        </div>
      )}
    </div>
  );
}
