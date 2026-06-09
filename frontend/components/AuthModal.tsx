"use client";

import { useEffect, useState } from "react";
import { FaPinterest } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type Mode = "login" | "signup";

interface AuthModalProps {
  mode: Mode;
  onSwitch: (mode: Mode) => void;
  onClose: () => void;
}

export default function AuthModal({ mode, onSwitch, onClose }: AuthModalProps) {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({ email, password, birthdate: birthdate || undefined });
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] bg-white rounded-[32px] shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5"
        >
          <IoClose size={22} />
        </button>

        <div className="px-8 py-8 sm:px-12">
          <div className="flex justify-center mb-3">
            <FaPinterest className="text-pinred" size={36} />
          </div>
          <h1 className="text-[28px] font-semibold text-center text-ink leading-tight">
            {mode === "login" ? "Welcome to Pinterest" : "Welcome to Pinterest"}
          </h1>
          <p className="text-center text-ink mt-1 mb-5">
            {mode === "login" ? "" : "Find new ideas to try"}
          </p>

          <form onSubmit={handleSubmit} className="max-w-[268px] mx-auto">
            <label className="block text-sm mb-1 mt-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-10 px-4 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
            />

            <label className="block text-sm mb-1 mt-3">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full h-10 px-4 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
            />

            {mode === "signup" && (
              <>
                <label className="block text-sm mb-1 mt-3">Birthdate</label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full h-10 px-4 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
                />
              </>
            )}

            {error && <p className="text-pinred text-sm mt-3">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full h-10 mt-4 text-base"
            >
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Continue"}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm font-semibold text-ink">OR</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <button
              type="button"
              onClick={() => setError("Social login isn't enabled in this demo — use email & password.")}
              className="w-full h-10 rounded-full border border-gray-300 font-semibold flex items-center justify-center gap-2 hover:bg-black/5"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>

            {mode === "signup" && (
              <p className="text-[11px] text-muted text-center mt-4 leading-snug">
                By continuing, you agree to Pinterest&apos;s Terms of Service and acknowledge
                you&apos;ve read our Privacy Policy.
              </p>
            )}
          </form>

          <p className="text-center text-sm mt-5">
            {mode === "login" ? (
              <>
                Not on Pinterest yet?{" "}
                <button onClick={() => onSwitch("signup")} className="font-semibold hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already a member?{" "}
                <button onClick={() => onSwitch("login")} className="font-semibold hover:underline">
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
