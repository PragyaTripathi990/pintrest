"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RiShareForwardLine } from "react-icons/ri";
import { FiSliders } from "react-icons/fi";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import { Board, UserProfile } from "@/lib/types";
import Avatar from "./Avatar";
import Spinner from "./Spinner";
import BoardCard from "./BoardCard";
import PinFeed from "./PinFeed";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Profile({ username }: { username: string }) {
  const { user } = useAuth();
  const { openAuth } = useModal();
  const { show } = useToast();
  const router = useRouter();
  const qc = useQueryClient();

  const [ownTab, setOwnTab] = useState<"pins" | "boards" | "collages">("boards");
  const [pubTab, setPubTab] = useState<"created" | "saved">("saved");
  const [createMenu, setCreateMenu] = useState(false);
  const [boardModal, setBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.get<UserProfile>(`/api/users/${username}`),
  });
  const { data: boards } = useQuery({
    queryKey: ["profile", username, "boards"],
    queryFn: () => api.get<Board[]>(`/api/users/${username}/boards`),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner size={40} />
      </div>
    );
  if (!profile) return <div className="text-center py-24 text-muted">User not found</div>;

  const isMe = user?.username === profile.username;

  function shareProfile() {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(`${window.location.origin}/${profile!.username}`);
      show("Link copied to clipboard");
    }
  }

  async function toggleFollow() {
    if (!user) {
      openAuth("signup");
      return;
    }
    try {
      if (profile!.is_following) await api.del(`/api/users/${username}/follow`);
      else await api.post(`/api/users/${username}/follow`);
      qc.invalidateQueries({ queryKey: ["profile", username] });
    } catch (e) {
      console.error(e);
    }
  }

  async function createBoard() {
    if (!newBoardName.trim()) return;
    try {
      await api.post("/api/boards", { name: newBoardName.trim() });
      setNewBoardName("");
      setBoardModal(false);
      qc.invalidateQueries({ queryKey: ["profile", username, "boards"] });
    } catch (e) {
      console.error(e);
    }
  }

  // -------------------- OWN PROFILE ("Your saved ideas") --------------------
  if (isMe) {
    const tabClass = (active: boolean) =>
      `pb-2 font-medium text-base transition-colors ${active ? "border-b-2 border-ink" : "text-muted hover:text-ink"}`;
    return (
      <div className="max-w-[1200px] mx-auto px-4 pb-20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-5 pb-1">
          <h1 className="text-[36px] font-bold tracking-[-0.5px]">Your saved ideas</h1>
          <div className="flex items-center gap-3 rounded-3xl p-2">
            <Avatar src={profile.avatar} name={profile.full_name || profile.username} size={60} />
            <div className="mr-4">
              <div className="text-xl font-bold leading-tight">
                {profile.full_name || profile.username}
              </div>
              <div className="text-sm">
                {profile.followers_count} followers · {profile.following_count} following
              </div>
            </div>
            <button onClick={shareProfile} className="btn-secondary btn-md">
              Share profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-8 mt-2">
          <button onClick={() => setOwnTab("pins")} className={tabClass(ownTab === "pins")}>
            Pins
          </button>
          <button onClick={() => setOwnTab("boards")} className={tabClass(ownTab === "boards")}>
            Boards
          </button>
          <button onClick={() => setOwnTab("collages")} className={tabClass(ownTab === "collages")}>
            Collages
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 mb-5">
          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center"
              title="Filter"
            >
              <FiSliders size={20} />
            </button>
            <button className="h-9 px-4 rounded-full bg-pingray-200 hover:bg-pingray-300 text-sm font-semibold">
              Group
            </button>
          </div>
          <div className="relative">
            <button onClick={() => setCreateMenu((o) => !o)} className="btn-primary btn-md">
              Create
            </button>
            {createMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] p-2 z-50 text-sm">
                <button
                  onClick={() => {
                    setCreateMenu(false);
                    router.push("/create");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 font-medium"
                >
                  Create Pin
                </button>
                <button
                  onClick={() => {
                    setCreateMenu(false);
                    setBoardModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 font-medium"
                >
                  Create board
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {ownTab === "boards" &&
          (boards && boards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {boards.map((b) => (
                <BoardCard key={b.id} board={b} />
              ))}
              <button
                onClick={() => setBoardModal(true)}
                className="h-[150px] rounded-2xl bg-pingray-200 hover:bg-pingray-300 flex items-center justify-center"
              >
                <span className="bg-white rounded-full px-4 py-2 font-semibold shadow-sm">Create</span>
              </button>
            </div>
          ) : (
            <EmptyBoards onCreate={() => setBoardModal(true)} />
          ))}

        {ownTab === "pins" && (
          <PinFeed
            endpoint={`/api/users/${username}/pins`}
            queryKey={["profile", username, "pins"]}
            emptyMessage="No Pins created yet"
          />
        )}

        {ownTab === "collages" && (
          <div className="text-center text-muted py-16">You haven&apos;t made any collages yet.</div>
        )}

        {boardModal && (
          <CreateBoardModal
            name={newBoardName}
            setName={setNewBoardName}
            onClose={() => setBoardModal(false)}
            onCreate={createBoard}
          />
        )}
      </div>
    );
  }

  // -------------------- PUBLIC PROFILE (other users) --------------------
  return (
    <div className="pb-16">
      <div className="flex flex-col items-center pt-8 pb-4 max-w-2xl mx-auto text-center px-4">
        <Avatar src={profile.avatar} name={profile.full_name || profile.username} size={120} />
        <h1 className="text-4xl font-bold mt-4">{profile.full_name || profile.username}</h1>
        <div className="text-muted mt-1">@{profile.username}</div>
        {profile.bio && <p className="mt-2 max-w-md">{profile.bio}</p>}
        <div className="flex gap-1 mt-2 text-sm">
          <span>
            <b>{profile.followers_count}</b> followers
          </span>
          <span>·</span>
          <span>
            <b>{profile.following_count}</b> following
          </span>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={shareProfile} className="btn-secondary btn-md w-10 px-0" title="Share">
            <RiShareForwardLine size={18} />
          </button>
          <button
            onClick={toggleFollow}
            className={profile.is_following ? "btn-secondary btn-md px-5" : "btn-dark btn-md px-5"}
          >
            {profile.is_following ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-8 mb-5">
        <button
          onClick={() => setPubTab("created")}
          className={`pb-2 font-semibold ${pubTab === "created" ? "border-b-2 border-ink" : "text-muted hover:text-ink"}`}
        >
          Created
        </button>
        <button
          onClick={() => setPubTab("saved")}
          className={`pb-2 font-semibold ${pubTab === "saved" ? "border-b-2 border-ink" : "text-muted hover:text-ink"}`}
        >
          Saved
        </button>
      </div>

      {pubTab === "saved" ? (
        <div className="px-4 max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {boards?.map((b) => (
            <BoardCard key={b.id} board={b} />
          ))}
          {boards && boards.length === 0 && (
            <div className="col-span-full text-center text-muted py-12">No boards yet</div>
          )}
        </div>
      ) : (
        <PinFeed
          endpoint={`/api/users/${username}/pins`}
          queryKey={["profile", username, "pins"]}
          emptyMessage="No Pins created yet"
        />
      )}
    </div>
  );
}

function EmptyBoards({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-12">
      <div className="text-5xl mb-4">📌</div>
      <h2 className="text-xl font-bold">Organize your ideas</h2>
      <p className="text-ink mt-1 max-w-sm">
        Pins are sparks of inspiration. Boards are where they live. Create boards to organize your
        Pins your way.
      </p>
      <button onClick={onCreate} className="btn-primary btn-lg mt-5">
        Create a board
      </button>
    </div>
  );
}

function CreateBoardModal({
  name,
  setName,
  onClose,
  onCreate,
}: {
  name: string;
  setName: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[400px] bg-white rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center mb-4">Create board</h2>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Like "Places to go" or "Recipes"'
          className="w-full h-12 px-4 rounded-2xl border border-gray-300 focus:border-ink outline-none"
        />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary btn-md">
            Cancel
          </button>
          <button onClick={onCreate} disabled={!name.trim()} className="btn-primary btn-md">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
