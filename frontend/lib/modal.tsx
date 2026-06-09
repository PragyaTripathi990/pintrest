"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AuthModal from "@/components/AuthModal";

export type AuthMode = "login" | "signup";

interface ModalContextValue {
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  return (
    <ModalContext.Provider
      value={{
        openAuth: (mode = "login") => setAuthMode(mode),
        closeAuth: () => setAuthMode(null),
      }}
    >
      {children}
      {authMode && (
        <AuthModal mode={authMode} onSwitch={setAuthMode} onClose={() => setAuthMode(null)} />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
