"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiSearch, FiLock } from "react-icons/fi";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Board } from "@/lib/types";

interface Props {
  pinId: number;
  onClose: () => void;
  onSaved?: (board: Board) => void;
}

export default function BoardPickerModal({ pinId, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { show } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get<Board[]>(`/api/users/${user.username}/boards`)
      .then((b) => setBoards(b))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function saveTo(board: Board) {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/api/pins/${pinId}/save`, { board_id: board.id });
      show(`Saved to ${board.name}`);
      onSaved?.(board);
      onClose();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  }

  async function createAndSave() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      const board = await api.post<Board>("/api/boards", { name: newName.trim() });
      await api.post(`/api/pins/${pinId}/save`, { board_id: board.id });
      show(`Saved to ${board.name}`);
      onSaved?.(board);
      onClose();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  }

  const filtered = boards.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] bg-white rounded-2xl shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-4 py-3 border-b border-gray-100">
          <h2 className="text-center font-semibold text-lg">
            {creating ? "Create board" : "Save"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3.5 hover:bg-black/5 rounded-full p-0.5"
          >
            <IoClose size={20} />
          </button>
        </div>

        {!creating ? (
          <>
            <div className="px-4 py-2">
              <div className="flex items-center h-10 rounded-full bg-pingray-200 px-3">
                <FiSearch className="text-gray-600" size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  className="flex-1 bg-transparent outline-none px-2 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-[120px]">
              <div className="px-2 py-1 text-xs font-semibold text-muted">All boards</div>
              {loading ? (
                <div className="p-4 text-center text-muted text-sm">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-muted text-sm">No boards yet</div>
              ) : (
                filtered.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => saveTo(b)}
                    disabled={busy}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-lg bg-pingray overflow-hidden shrink-0">
                      {b.cover_images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover_images[0]} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                    <span className="flex-1 text-left font-medium truncate">{b.name}</span>
                    {b.is_secret && <FiLock className="text-gray-500" size={14} />}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-black/5"
              >
                <div className="w-12 h-12 rounded-lg bg-pingray-200 flex items-center justify-center text-2xl text-gray-700">
                  +
                </div>
                <span className="font-semibold">Create board</span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Like "Places to go" or "Recipes"'
              className="w-full h-11 px-3 rounded-2xl border border-gray-300 focus:border-ink outline-none"
            />
            <div className="flex justify-between mt-4">
              <button onClick={() => setCreating(false)} className="btn-secondary btn-md">
                Back
              </button>
              <button
                onClick={createAndSave}
                disabled={!newName.trim() || busy}
                className="btn-primary btn-md"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
