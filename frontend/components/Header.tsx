"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaPinterest } from "react-icons/fa";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { useAuth } from "@/lib/auth";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import Avatar from "./Avatar";
import { SearchIcon, LensIcon, MicIcon } from "./icons";

function NavPill({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`hidden md:inline-flex items-center h-12 px-4 rounded-full text-base font-semibold transition-colors ${
        active ? "bg-ink text-white" : "text-ink hover:bg-black/5"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { openAuth } = useModal();
  const { show } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  const accountMenu = (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full hover:bg-black/5 p-1"
        aria-label="Account menu"
      >
        {user && <Avatar src={user.avatar} name={user.full_name || user.username} size={32} />}
        <FiChevronDown className="text-gray-600" size={16} />
      </button>
      {menuOpen && user && (
        <div className="absolute right-0 mt-2 w-[288px] bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] p-3 text-sm">
          <div className="px-3 py-1.5 text-xs font-semibold text-[#767676]">Currently in</div>
          <Link
            href={`/${user.username}`}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5"
          >
            <Avatar src={user.avatar} name={user.full_name || user.username} size={48} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base truncate">{user.full_name || user.username}</div>
              <div className="text-[#767676] truncate">{user.is_business ? "Business" : "Personal"}</div>
              <div className="text-[#767676] truncate">{user.email}</div>
            </div>
            <FiCheck size={18} className="shrink-0" />
          </Link>
          <button
            onClick={() => {
              show("Convert to business isn't available in this demo");
              setMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 font-medium"
          >
            Convert to business
          </button>

          <div className="px-3 py-1.5 mt-1 text-xs font-semibold text-[#767676]">Your accounts</div>
          <button
            onClick={() => {
              show("Adding accounts isn't available in this demo");
              setMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 font-medium"
          >
            Add Pinterest account
          </button>
          <button
            onClick={() => {
              logout();
              setMenuOpen(false);
              router.push("/");
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 font-medium"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );

  // ---------------- Logged-in: left rail handles nav; header is search-first ----------------
  if (user) {
    return (
      <header className="sticky top-0 z-30 bg-white">
        <div className="flex items-center gap-2 px-4 h-20">
          <form onSubmit={submitSearch} className="flex-1 min-w-0">
            <div className="relative flex items-center h-12 rounded-2xl bg-[#e9e9e9] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-200 focus-within:shadow-[inset_0_0_0_2px_#0084ff] transition-colors">
              <span className="absolute left-4 text-[#62625b]">
                <SearchIcon size={16} />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="w-full h-full bg-transparent rounded-2xl pl-11 pr-24 text-base outline-none placeholder:text-[#62625b]"
              />
              <div className="absolute right-2 flex items-center">
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="w-9 h-9 rounded-full hover:bg-black/10 flex items-center justify-center text-gray-700"
                    aria-label="Clear search"
                  >
                    <IoClose size={20} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => show("Visual search isn't available in this demo")}
                      className="w-9 h-9 rounded-full hover:bg-black/10 flex items-center justify-center text-ink"
                      aria-label="Visual search"
                    >
                      <LensIcon size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => show("Voice search isn't available in this demo")}
                      className="w-9 h-9 rounded-full hover:bg-black/10 flex items-center justify-center text-ink"
                      aria-label="Voice search"
                    >
                      <MicIcon size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
          {accountMenu}
        </div>
      </header>
    );
  }

  // ---------------- Logged-out: classic top header ----------------
  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="flex items-center gap-1 px-1 sm:px-4 h-[72px]">
        <Link
          href="/"
          aria-label="Pinterest home"
          className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/5"
        >
          <FaPinterest className="text-pinred" size={24} />
        </Link>
        <NavPill href="/" label="Home" />
        <NavPill href="/explore" label="Explore" />

        <form onSubmit={submitSearch} className="flex-1 min-w-0 px-1 sm:px-2">
          <div className="relative flex items-center h-12 rounded-full bg-pingray-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-200 focus-within:shadow-[inset_0_0_0_2px_#0084ff] transition-colors">
            <span className="absolute left-4 text-gray-600">
              <SearchIcon size={16} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for ideas"
              className="w-full h-full bg-transparent rounded-full pl-11 pr-9 text-base outline-none placeholder:text-gray-600"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 text-gray-600 hover:text-ink"
                aria-label="Clear search"
              >
                <IoClose size={18} />
              </button>
            )}
          </div>
        </form>

        {!loading && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => openAuth("login")} className="btn-primary btn-md">
              Log in
            </button>
            <button onClick={() => openAuth("signup")} className="btn-secondary btn-md">
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
