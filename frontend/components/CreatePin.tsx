"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiArrowUp, FiChevronDown } from "react-icons/fi";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import { Board, Pin } from "@/lib/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#cdcdc7] bg-white px-4 pt-2 pb-1 focus-within:border-ink">
      <label className="block text-xs text-[#767676]">{label}</label>
      {children}
    </div>
  );
}

export default function CreatePin() {
  const { user, loading } = useAuth();
  const { openAuth } = useModal();
  const { show } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [boardId, setBoardId] = useState("");
  const [aiModified, setAiModified] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) openAuth("login");
  }, [loading, user, openAuth]);

  useEffect(() => {
    if (user) api.get<Board[]>(`/api/users/${user.username}/boards`).then(setBoards);
  }, [user]);

  function onSelect(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUrlMode(false);
    setError("");
  }

  async function publish() {
    if (!file && !imageUrl.trim()) {
      setError("Choose a file or paste an image URL.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      else fd.append("image_url", imageUrl.trim());
      fd.append("title", title);
      fd.append("description", description);
      fd.append("link", link);
      if (boardId) fd.append("board_id", boardId);
      const pin = await api.post<Pin>("/api/pins", fd);
      show("Your Pin was published!");
      router.push(`/pin/${pin.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
    }
  }

  if (!loading && !user)
    return <div className="text-center py-24 text-muted">Please log in to create a Pin.</div>;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold">Create Pin</h1>
        <button onClick={publish} disabled={busy} className="btn-primary btn-md">
          {busy ? "Publishing…" : "Publish"}
        </button>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: upload */}
        <div className="flex flex-col items-center">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onSelect(e.dataTransfer.files[0]);
            }}
            className="relative w-full max-w-[380px] aspect-[5/7] rounded-[32px] bg-[#e9e9e9] border border-[#cdcdc7] flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-[#e2e2dd] transition-colors"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="w-11 h-11 rounded-full border-2 border-ink flex items-center justify-center mb-3">
                  <FiArrowUp size={20} />
                </div>
                <p className="text-center text-ink px-8">Choose a file or drag and drop it here</p>
                <p className="absolute bottom-8 left-0 right-0 text-center text-sm text-[#767676] px-8">
                  We recommend using high quality .jpg files less than 20 MB or .mp4 files less than 200 MB.
                </p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onSelect(e.target.files?.[0])}
          />

          <div className="w-full max-w-[380px] mt-4">
            <div className="border-t border-gray-200 mb-4" />
            {!urlMode ? (
              <button
                onClick={() => setUrlMode(true)}
                className="w-full h-12 rounded-2xl bg-[#e9e9e9] hover:bg-pingray-300 font-medium"
              >
                Save from URL
              </button>
            ) : (
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste an image URL…"
                className="w-full h-12 px-4 rounded-2xl border border-[#cdcdc7] outline-none focus:border-ink"
              />
            )}
          </div>
        </div>

        {/* Right: form */}
        <div className="space-y-4 max-w-[440px]">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tell everyone what your Pin is about"
              className="w-full bg-transparent outline-none text-base py-1 placeholder:text-[#767676]"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your Pin"
              rows={4}
              className="w-full bg-transparent outline-none text-base py-1 resize-none placeholder:text-[#767676]"
            />
          </Field>

          <Field label="Link">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Add a link"
              className="w-full bg-transparent outline-none text-base py-1 placeholder:text-[#767676]"
            />
          </Field>

          {/* Board select */}
          <div className="relative">
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full h-14 rounded-2xl border border-[#cdcdc7] bg-white px-4 outline-none focus:border-ink appearance-none text-base"
            >
              <option value="">Choose a board</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink" size={20} />
          </div>

          <Field label="Tagged topics (0)">
            <input
              placeholder="Search for a tag"
              className="w-full bg-transparent outline-none text-base py-1 placeholder:text-[#767676]"
            />
          </Field>

          {/* Tag products */}
          <div>
            <div className="text-sm font-medium mb-1">Tag Products</div>
            <button
              disabled
              className="h-10 px-4 rounded-full bg-[#e9e9e9] text-[#767676] font-semibold cursor-not-allowed"
            >
              Add products
            </button>
          </div>

          {/* AI modified toggle */}
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAiModified((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative ${aiModified ? "bg-ink" : "bg-gray-300"}`}
                aria-label="Mark as AI-Modified"
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${aiModified ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
              <span className="font-medium">Mark as AI-Modified</span>
            </div>
            <p className="text-sm text-[#767676] ml-14">Content that was made completely or partly with AI</p>
            <label className="flex items-center gap-2 ml-14 mt-2 text-sm">
              <input type="checkbox" className="w-4 h-4" />
              This Pin includes an AI-generated person
            </label>
          </div>

          <button className="flex items-center gap-1 font-semibold pt-2">
            More options <FiChevronDown size={18} />
          </button>

          {error && <p className="text-pinred text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
