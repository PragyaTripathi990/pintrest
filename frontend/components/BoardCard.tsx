import Link from "next/link";
import { Board } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export default function BoardCard({ board }: { board: Board }) {
  const [c0, c1, c2] = board.cover_images;
  return (
    <Link href={`/${board.owner.username}/${board.slug}`} className="block group">
      <div className="flex gap-0.5 h-[150px] rounded-2xl overflow-hidden bg-pingray group-hover:brightness-95 transition">
        <div className="w-2/3 bg-pingray-200">
          {c0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c0} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="w-1/3 flex flex-col gap-0.5">
          <div className="flex-1 bg-pingray-200 overflow-hidden">
            {c1 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c1} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 bg-pingray-200 overflow-hidden">
            {c2 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c2} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      </div>
      <div className="font-semibold mt-2 px-1">{board.name}</div>
      <div className="text-xs text-muted px-1">
        {board.pin_count} Pins
        {board.section_count ? ` · ${board.section_count} sections` : ""} · {timeAgo(board.created_at)}
      </div>
    </Link>
  );
}
