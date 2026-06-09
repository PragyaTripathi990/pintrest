"use client";

import { useEffect, useRef, useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { API_URL } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Pin } from "@/lib/types";

export default function PinActionsMenu({
  pin,
  buttonClass,
  align = "right",
}: {
  pin: Pin;
  buttonClass?: string;
  align?: "left" | "right";
}) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function downloadImage() {
    setOpen(false);
    // Backend sets Content-Disposition: attachment, so this downloads
    // even cross-origin (no fetch/CORS needed).
    const a = document.createElement("a");
    a.href = `${API_URL}/api/pins/${pin.id}/download`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    show("Downloading image…");
  }

  function getEmbedCode() {
    setOpen(false);
    const code = `<iframe src="${API_URL.replace(":8000", ":3000")}/pin/${pin.id}" height="560" width="345" frameborder="0" scrolling="no"></iframe>`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      show("Embed code copied to clipboard");
    }
  }

  const item =
    "w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 font-medium text-[15px] whitespace-nowrap";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={buttonClass}
        title="More options"
        aria-label="More options"
      >
        <FiMoreHorizontal size={22} />
      </button>
      {open && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1 w-[223px] bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] p-3 z-50`}
        >
          <button onClick={downloadImage} className={item}>
            Download image
          </button>
          <button onClick={() => { setOpen(false); show("Collages aren't available in this demo"); }} className={item}>
            Add to collage
          </button>
          <button onClick={() => { setOpen(false); show("Showing more like this"); }} className={item}>
            See more like this
          </button>
          <button onClick={() => { setOpen(false); show("We'll show less like this"); }} className={item}>
            See less like this
          </button>
          <button onClick={() => { setOpen(false); show("Thanks for reporting — we'll review it"); }} className={item}>
            Report Pin
          </button>
          <button onClick={getEmbedCode} className={item}>
            Get Pin embed code
          </button>
        </div>
      )}
    </div>
  );
}
