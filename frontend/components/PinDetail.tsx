"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiChevronUp } from "react-icons/fi";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import { Pin, PinPage } from "@/lib/types";
import Avatar from "./Avatar";
import Spinner from "./Spinner";
import Comments from "./Comments";
import BoardPickerModal from "./BoardPickerModal";
import PinCard from "./PinCard";
import MasonryGrid from "./MasonryGrid";
import PinActionsMenu from "./PinActionsMenu";
import { SpeechIcon, ShareIcon, ExpandIcon } from "./icons";

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function PinDetail({ pinId }: { pinId: number }) {
  const { user } = useAuth();
  const { openAuth } = useModal();
  const { show } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const { data: pin, isLoading } = useQuery({
    queryKey: ["pin", pinId],
    queryFn: () => api.get<Pin>(`/api/pins/${pinId}`),
  });
  const { data: related } = useQuery({
    queryKey: ["pin", pinId, "related"],
    queryFn: () => api.get<PinPage>(`/api/pins/${pinId}/related?limit=20`),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner size={40} />
      </div>
    );
  if (!pin) return <div className="text-center py-24 text-muted">Pin not found</div>;

  const reacted = !!pin.viewer_reaction;

  async function toggleReact() {
    if (!user) {
      openAuth("signup");
      return;
    }
    try {
      if (reacted) await api.del(`/api/pins/${pinId}/react`);
      else await api.post(`/api/pins/${pinId}/react`, { type: "like" });
      qc.invalidateQueries({ queryKey: ["pin", pinId] });
    } catch (e) {
      console.error(e);
    }
  }

  function handleSave() {
    if (!user) {
      openAuth("signup");
      return;
    }
    setPickerOpen(true);
  }

  function share() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      show("Link copied to clipboard");
    }
  }

  const iconBtn =
    "w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-ink";

  return (
    <div className="px-2 sm:px-4 pb-16">
      <div className="max-w-[1016px] mx-auto my-4">
        <div className="bg-white rounded-[32px] shadow-[0_1px_20px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col md:flex-row md:max-h-[90vh]">
          {/* Left: image */}
          <div className="md:w-1/2 relative flex items-center justify-center shrink-0 bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pin.image || ""}
              alt={pin.alt_text || pin.title}
              className="w-full h-auto object-contain md:max-h-[90vh]"
              style={{ backgroundColor: pin.dominant_color }}
            />
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold text-ink">
              AI modified
            </div>
            <button
              onClick={() => window.open(pin.image || "", "_blank")}
              className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-ink hover:bg-white"
              title="View image"
            >
              <ExpandIcon size={16} />
            </button>
          </div>

          {/* Right: panel */}
          <div className="md:w-1/2 p-5 sm:p-7 flex flex-col min-h-0 overflow-y-auto">
            {/* Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <button onClick={toggleReact} className="flex items-center gap-1 px-2 h-10 rounded-full hover:bg-black/5" title="React">
                  {reacted ? <AiFillHeart className="text-pinred" size={22} /> : <AiOutlineHeart size={22} />}
                  {pin.reaction_count > 0 && <span className="font-medium text-sm">{pin.reaction_count}</span>}
                </button>
                <button className={iconBtn} title="Comment"><SpeechIcon size={20} /></button>
                <button onClick={share} className={iconBtn} title="Share"><ShareIcon size={20} /></button>
                <PinActionsMenu pin={pin} buttonClass={iconBtn} />
              </div>
              <button
                onClick={handleSave}
                className="btn-primary btn-lg"
                style={pin.viewer_has_saved ? { backgroundColor: "#111111" } : undefined}
              >
                {pin.viewer_has_saved ? "Saved" : "Save"}
              </button>
            </div>

            {/* Account */}
            <Link href={`/${pin.uploader.username}`} className="flex items-center gap-2 mb-3 w-fit hover:opacity-80">
              <Avatar src={pin.uploader.avatar} name={pin.uploader.full_name || pin.uploader.username} size={32} />
              <span className="font-semibold text-sm">{pin.uploader.full_name || pin.uploader.username}</span>
            </Link>

            {/* Title */}
            {pin.title && <h1 className="text-2xl font-semibold leading-snug mb-3">{pin.title}</h1>}

            {/* Visit site */}
            {pin.link && (
              <a
                href={pin.link}
                target="_blank"
                rel="noreferrer"
                className="block text-center w-full h-12 leading-[3rem] rounded-full bg-pingray-200 hover:bg-pingray-300 font-semibold mb-4"
              >
                Visit site
              </a>
            )}

            {/* Description */}
            {pin.description && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Description</h3>
                <p className={`text-ink whitespace-pre-line ${descExpanded ? "" : "line-clamp-3"}`}>
                  {pin.description}
                </p>
                {pin.description.length > 120 && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="font-semibold mt-1 hover:underline"
                  >
                    {descExpanded ? "See less" : "See more"}
                  </button>
                )}
              </div>
            )}

            <Comments pinId={pin.id} count={pin.comment_count} />
          </div>
        </div>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mx-auto mt-8 mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md hover:bg-gray-50"
          aria-label="Back to top"
        >
          <FiChevronUp size={22} />
        </button>
      </div>

      {related && related.items.length > 0 && (
        <>
          <h2 className="text-center font-semibold text-base text-muted my-4">More to explore</h2>
          <MasonryGrid>
            {related.items.map((p) => (
              <PinCard key={p.id} pin={p} />
            ))}
          </MasonryGrid>
        </>
      )}

      {pickerOpen && (
        <BoardPickerModal
          pinId={pin.id}
          onClose={() => setPickerOpen(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["pin", pinId] })}
        />
      )}
    </div>
  );
}
