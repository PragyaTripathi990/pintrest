import { ReactNode } from "react";

export default function MasonryGrid({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-2 sm:px-4"
      style={{ columnWidth: "216px", columnGap: "16px" }}
    >
      {children}
    </div>
  );
}
