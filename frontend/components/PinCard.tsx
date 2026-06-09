"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { GoLinkExternal } from "react-icons/go";
import { useAuth } from "@/lib/auth";
import { useModal } from "@/lib/modal";
import { Pin } from "@/lib/types";
import BoardPickerModal from "./BoardPickerModal";

export default function PinCard({ pin }: { pin: Pin }) {
  const { user } = useAuth();
  const { openAuth } = useModal();
  const router = useRouter();
  const [saved, setSaved] = useState(pin.viewer_has_saved);
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuth("signup");
      return;
    }
    setPickerOpen(true);
  }

  return (
    <div className="masonry-item mb-4">
      <div className="group relative">
        <Link
          href={`/pin/${pin.id}`}
          className="block relative rounded-2xl overflow-hidden"
          aria-label={pin.title || pin.alt_text || "Pin"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pin.image || ""}
            alt={pin.alt_text || pin.title}
            loading="lazy"
            style={{
              backgroundColor: pin.dominant_color,
              aspectRatio: pin.width && pin.height ? `${pin.width} / ${pin.height}` : undefined,
            }}
            className="w-full block object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-150" />
        </Link>

        {/* Save button (hover) */}
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 h-10 px-4 rounded-full font-semibold text-white text-base opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ backgroundColor: saved ? "#111111" : "#e60023" }}
        >
          {saved ? "Saved" : "Save"}
        </button>

        {/* Bottom actions (hover) */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {pin.link && (
            <button
              onClick={(e) => {
                e.preventDefault();
                window.open(pin.link, "_blank");
              }}
              title="Visit"
              className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100"
            >
              <GoLinkExternal size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              router.push(`/pin/${pin.id}`);
            }}
            title="More options"
            className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100"
          >
            <FiMoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {pickerOpen && (
        <BoardPickerModal
          pinId={pin.id}
          onClose={() => setPickerOpen(false)}
          onSaved={() => setSaved(true)}
        />
      )}
    </div>
  );
}
