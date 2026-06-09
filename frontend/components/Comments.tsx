"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { BsEmojiSmile, BsStickies, BsImage } from "react-icons/bs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import { Comment } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import Avatar from "./Avatar";

export default function Comments({ pinId, count }: { pinId: number; count: number }) {
  const { user } = useAuth();
  const { openAuth } = useModal();
  const { show } = useToast();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data: comments } = useQuery({
    queryKey: ["comments", pinId],
    queryFn: () => api.get<Comment[]>(`/api/pins/${pinId}/comments`),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      openAuth("signup");
      return;
    }
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await api.post(`/api/pins/${pinId}/comments`, { text: text.trim() });
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", pinId] });
      qc.invalidateQueries({ queryKey: ["pin", pinId] });
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const inputIcon = "w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-gray-700";

  return (
    <div className="mt-2 flex-1 flex flex-col min-h-0">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between mb-3 w-full"
      >
        <h2 className="font-semibold text-base">
          {count > 0 ? `${count} ${count === 1 ? "Comment" : "Comments"}` : "Comments"}
        </h2>
        <FiChevronDown
          size={20}
          className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[320px] pr-1">
          {comments && comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Link href={`/${c.user.username}`} className="shrink-0">
                  <Avatar src={c.user.avatar} name={c.user.full_name || c.user.username} size={32} />
                </Link>
                <div>
                  <p className="text-sm leading-snug">
                    <Link href={`/${c.user.username}`} className="font-semibold mr-1 hover:underline">
                      {c.user.full_name || c.user.username}
                    </Link>
                    {c.text}
                  </p>
                  <div className="text-xs text-muted mt-1">{timeAgo(c.created_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <div>
              <p className="font-semibold">No comments yet!</p>
              <p className="text-muted text-sm">Add one to start the conversation.</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="mt-auto pt-2">
        <div className="flex items-center gap-1 border border-gray-300 rounded-3xl pl-4 pr-2 h-12 focus-within:border-ink">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment"
            className="flex-1 outline-none bg-transparent text-sm"
          />
          {text.trim() ? (
            <button type="submit" disabled={busy} className="btn-primary btn-md h-9">
              Done
            </button>
          ) : (
            <>
              <button type="button" className={inputIcon} title="Emoji" onClick={() => setText((t) => t + " 🙂")}>
                <BsEmojiSmile size={18} />
              </button>
              <button type="button" className={inputIcon} title="Sticker" onClick={() => show("Stickers aren't available in this demo")}>
                <BsStickies size={18} />
              </button>
              <button type="button" className={inputIcon} title="Photo" onClick={() => show("Photo comments aren't available in this demo")}>
                <BsImage size={18} />
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
