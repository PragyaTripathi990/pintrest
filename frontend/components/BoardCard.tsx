import Link from "next/link";
import { Board } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export default function BoardCard({ board }: { board: Board }) {
  const [c0, c1, c2] = board.cover_images;
  return (
    <Link href={`/${board.owner.username}/${board.slug}`} className="block group">
      <div className="flex gap-px aspect-[3/2] rounded-2xl overflow-hidden bg-white group-hover:brightness-95 transition">
        <div className="w-2/3 bg-pingray-200">
          {c0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c0} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="w-1/3 flex flex-col gap-px">
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
      <div className="mt-2 px-1 text-xl font-bold leading-6 truncate">{board.name}</div>
      <div className="mt-1 px-1 flex items-center gap-2 text-[13px] leading-[18px]">
        <span>{board.pin_count} Pins</span>
        <span className="text-muted">{timeAgo(board.created_at)}</span>
      </div>
    </Link>
  );
}
