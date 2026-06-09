"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Header from "./Header";
import LeftRail from "./LeftRail";
import RailPanel, { RailPanelKind } from "./RailPanel";

const RAIL_W = 72;
const PANEL_W = 368;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [panel, setPanel] = useState<RailPanelKind | null>(null);

  // Close the slide-in panel whenever we navigate to a new page.
  useEffect(() => {
    setPanel(null);
  }, [pathname]);

  // When a panel is open it pushes the page content to the right instead of
  // covering it — the feed re-flows into the narrower space (just like real
  // Pinterest's Updates / Messages panels).
  const padLeft = (user ? RAIL_W : 0) + (user && panel ? PANEL_W : 0);

  return (
    <>
      {user && <LeftRail panel={panel} setPanel={setPanel} />}
      <div
        style={{
          paddingLeft: padLeft,
          transition: "padding-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Header />
        <main>{children}</main>
      </div>
      {user && panel && (
        <RailPanel kind={panel} onClose={() => setPanel(null)} />
      )}
    </>
  );
}
