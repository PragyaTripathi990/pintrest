"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FiMoreHorizontal } from "react-icons/fi";
import { RiShareForwardLine } from "react-icons/ri";
import { api } from "@/lib/api";
import { Board } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import Avatar from "./Avatar";
import Spinner from "./Spinner";
import PinFeed from "./PinFeed";

export default function BoardView({ username, slug }: { username: string; slug: string }) {
  const { data: board, isLoading } = useQuery({
    queryKey: ["board", username, slug],
    queryFn: () => api.get<Board>(`/api/users/${username}/boards/${slug}`),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner size={40} />
      </div>
    );
  if (!board) return <div className="text-center py-24 text-muted">Board not found</div>;

  return (
    <div className="pb-16">
      <div className="flex flex-col items-center pt-8 pb-2 text-center px-4">
        <h1 className="text-4xl font-bold">{board.name}</h1>
        {board.description && <p className="mt-2 max-w-md text-muted">{board.description}</p>}
        <Link href={`/${board.owner.username}`} className="mt-3" title={board.owner.username}>
          <Avatar
            src={board.owner.avatar}
            name={board.owner.full_name || board.owner.username}
            size={48}
          />
        </Link>
        <div className="text-sm text-muted mt-2">
          {board.pin_count} Pins · {timeAgo(board.created_at)}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            className="w-12 h-12 rounded-full hover:bg-black/5 flex items-center justify-center"
            title="Share"
          >
            <RiShareForwardLine size={20} />
          </button>
          <button
            className="w-12 h-12 rounded-full hover:bg-black/5 flex items-center justify-center"
            title="More options"
          >
            <FiMoreHorizontal size={20} />
          </button>
        </div>
      </div>
      <PinFeed
        endpoint={`/api/boards/${board.id}/pins`}
        queryKey={["board", board.id, "pins"]}
        emptyMessage="No Pins on this board yet"
      />
    </div>
  );
}
