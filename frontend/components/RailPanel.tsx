"use client";

import { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { FiExternalLink, FiEdit, FiUserPlus } from "react-icons/fi";
import { useToast } from "@/lib/toast";

export type RailPanelKind = "updates" | "messages" | "settings";

const RAIL_W = 72;

const TITLES: Record<RailPanelKind, string> = {
  updates: "Updates",
  messages: "Messages",
  settings: "Settings & Support",
};

export default function RailPanel({
  kind,
  onClose,
}: {
  kind: RailPanelKind;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onDown(e: MouseEvent) {
      // Content is pushed to the right of the panel, so a click in that area
      // (past the rail) closes the panel. Clicks on the rail keep it open so
      // the rail buttons can switch between panels.
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        e.clientX > RAIL_W
      ) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="fixed top-0 left-[72px] z-[45] h-screen w-[368px] bg-white border-r border-gray-200 shadow-[2px_0_18px_rgba(0,0,0,0.08)] flex flex-col animate-[slidein-left_0.28s_cubic-bezier(0.4,0,0.2,1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pl-6 pr-3 pt-3 pb-2 shrink-0">
        <h1 className="text-xl font-bold">{TITLES[kind]}</h1>
        <button
          onClick={onClose}
          aria-label={`Close ${TITLES[kind]}`}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5"
        >
          <IoClose size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {kind === "updates" && <UpdatesContent />}
        {kind === "messages" && <MessagesContent />}
        {kind === "settings" && <SettingsContent onClose={onClose} />}
      </div>
    </div>
  );
}

function EmptyState({
  illustration,
  heading,
  description,
}: {
  illustration: React.ReactNode;
  heading: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-7 mt-12">
      {illustration}
      <h2 className="text-xl font-bold mt-2">{heading}</h2>
      <p className="text-sm text-ink mt-1 leading-relaxed max-w-[320px]">
        {description}
      </p>
    </div>
  );
}

function UpdatesContent() {
  return (
    <EmptyState
      illustration={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="https://s.pinimg.com/gestalt/illustrations/v1/ill.sunglasses.spot.light.svg.webp"
          alt=""
          className="w-[186px] h-[186px]"
        />
      }
      heading="Updates are on their way"
      description="Use updates to see activity on your Pins and boards and get tips on topics to explore. They’ll be here soon."
    />
  );
}

function MessageRow({
  icon,
  title,
  subtitle,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
}) {
  const { show } = useToast();
  return (
    <button
      onClick={() => show("This isn't available in the demo")}
      className="flex items-center gap-3 px-4 py-2 mx-2 rounded-xl hover:bg-black/5 text-left"
      style={{ width: "calc(100% - 16px)" }}
    >
      <span
        className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold leading-tight">{title}</span>
        {subtitle && (
          <span className="block text-base text-[#62625b] leading-tight">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}

function MessagesContent() {
  return (
    <div className="flex flex-col">
      <MessageRow
        icon={<FiEdit size={20} />}
        title="New message"
        iconBg="#e60023"
        iconColor="#ffffff"
      />
      <MessageRow
        icon={<FiUserPlus size={20} />}
        title="Invite your friends"
        subtitle="Connect to start chatting"
        iconBg="#e5e5e0"
        iconColor="#211922"
      />
      <EmptyState
        illustration={
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="https://s.pinimg.com/gestalt/illustrations/v1/ill.messagebottle.spot.light.svg.webp"
            alt=""
            className="w-[186px] h-[186px]"
          />
        }
        heading="Start a conversation"
        description="Use messages to chat with friends, share Pins and boards, and plan ideas together. Your conversations will appear here."
      />
    </div>
  );
}

function SettingsItem({
  label,
  external,
  onClick,
}: {
  label: string;
  external?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 text-[15px] font-medium"
    >
      <span>{label}</span>
      {external && <FiExternalLink size={15} className="text-ink shrink-0" />}
    </button>
  );
}

function SettingsContent({ onClose }: { onClose: () => void }) {
  const { show } = useToast();
  function act() {
    show("This isn't available in the demo");
    onClose();
  }
  return (
    <div className="px-3 pb-4">
      <SettingsItem label="Settings" onClick={act} />
      <SettingsItem label="Refine your recommendations" onClick={act} />
      <SettingsItem label="Link to Pinterest" onClick={act} />
      <SettingsItem label="Reports and violations center" onClick={act} />
      <SettingsItem label="Be a beta tester" external onClick={act} />

      <div className="px-3 pt-3 pb-1 text-xs font-bold text-[#62625b]">Support</div>
      <SettingsItem label="Help center" external onClick={act} />
      <SettingsItem label="Create widget" external onClick={act} />
      <SettingsItem label="Removals" external onClick={act} />
      <SettingsItem label="Personalized Ads" external onClick={act} />
      <SettingsItem label="Your privacy rights" onClick={act} />
      <SettingsItem label="Privacy policy" external onClick={act} />
      <SettingsItem label="Terms of service" external onClick={act} />

      <div className="px-3 pt-3 pb-1 text-xs font-bold text-[#62625b]">Resources</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 pb-2 text-sm text-[#2b48d4]">
        {["About", "Blog", "Businesses", "Careers", "Developers", "Help"].map((r) => (
          <button key={r} onClick={act} className="hover:underline font-medium">
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
