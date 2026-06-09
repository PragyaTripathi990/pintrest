"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaPinterest } from "react-icons/fa";
import { useAuth } from "@/lib/auth";
import {
  HomeIcon,
  CompassIcon,
  GridIcon,
  PlusIcon,
  BellIcon,
  ChatIcon,
  GearIcon,
} from "./icons";
import { RailPanelKind } from "./RailPanel";

function RailLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
        active ? "text-ink" : "text-[#767676] hover:bg-black/5 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
        active ? "text-ink bg-black/5" : "text-[#767676] hover:bg-black/5 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function LeftRail({
  panel,
  setPanel,
}: {
  panel: RailPanelKind | null;
  setPanel: (p: RailPanelKind | null) => void;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const profileHref = `/${user.username}`;
  const toggle = (p: RailPanelKind) => setPanel(panel === p ? null : p);

  return (
    <nav className="fixed top-0 left-0 z-50 h-screen w-[72px] bg-white border-r border-gray-100 flex flex-col items-center py-2">
      <div className="flex flex-col items-center gap-6 flex-1">
        <Link
          href="/"
          aria-label="Pinterest home"
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/5"
        >
          <FaPinterest className="text-pinred" size={24} />
        </Link>
        <RailLink href="/" label="Home" active={pathname === "/"}>
          <HomeIcon size={24} />
        </RailLink>
        <RailLink href="/explore" label="Explore" active={pathname === "/explore"}>
          <CompassIcon size={24} />
        </RailLink>
        <RailLink href={profileHref} label="Your boards" active={pathname === profileHref}>
          <GridIcon size={22} />
        </RailLink>
        <RailLink href="/create" label="Create" active={pathname === "/create"}>
          <PlusIcon size={22} />
        </RailLink>
        <RailButton label="Updates" active={panel === "updates"} onClick={() => toggle("updates")}>
          <BellIcon size={24} />
        </RailButton>
        <RailButton label="Messages" active={panel === "messages"} onClick={() => toggle("messages")}>
          <ChatIcon size={22} />
        </RailButton>
      </div>

      <div className="flex flex-col items-center">
        <RailButton
          label="Settings & Support"
          active={panel === "settings"}
          onClick={() => toggle("settings")}
        >
          <GearIcon size={22} />
        </RailButton>
      </div>
    </nav>
  );
}
