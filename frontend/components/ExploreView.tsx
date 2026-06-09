"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Topic } from "@/lib/types";
import Spinner from "./Spinner";
import PinFeed from "./PinFeed";

function SeeMore() {
  return (
    <div className="flex justify-center mt-6">
      <button className="h-12 px-4 rounded-2xl bg-pingray-200 hover:bg-pingray-300 font-medium text-base">
        See more
      </button>
    </div>
  );
}

export default function ExploreView() {
  const { data: topics, isLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: () => api.get<Topic[]>(`/api/topics`),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner size={40} />
      </div>
    );

  const list = topics ?? [];
  const featured = list.slice(0, 3);
  const categories = list;

  return (
    <div className="pb-12">
      <div className="max-w-[1280px] mx-auto px-4">
      <h1 className="text-[36px] font-bold tracking-[-0.5px] mt-8 mb-8">
        Explore the best of Pinterest
      </h1>

      {/* Featured hero cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featured.map((t, i) => (
          <Link
            key={t.id}
            href={`/search?q=${encodeURIComponent(t.name)}`}
            className="relative block h-[302px] rounded-[32px] overflow-hidden shadow-[0_3px_12px_rgba(0,0,0,0.2)] group"
            style={{ backgroundColor: "#767676" }}
          >
            {t.cover_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.cover_image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <span className="text-white text-base">
                {["Cool casuals", "Season special", "Festive cool"][i] || t.category}
              </span>
              <span className="text-white text-[28px] font-bold leading-tight tracking-[-0.5px]">
                {t.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <SeeMore />

      {/* Browse by category */}
      <h2 className="text-[28px] font-bold tracking-[-0.5px] mt-16 mb-4">Browse by category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {categories.map((t) => (
          <Link
            key={t.id}
            href={`/search?q=${encodeURIComponent(t.name)}`}
            className="relative block h-[120px] rounded-2xl overflow-hidden group"
            style={{ backgroundColor: "#767676" }}
          >
            {t.cover_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.cover_image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-3">
              <span className="text-white text-xl font-bold text-center leading-tight">
                {t.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <SeeMore />
      </div>

      {/* Pin masonry below the curated sections (like the real /ideas page) */}
      <div className="mt-10">
        <PinFeed endpoint="/api/pins/feed" queryKey={["explore-feed"]} />
      </div>
    </div>
  );
}
