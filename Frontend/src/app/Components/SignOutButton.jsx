"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../../lib/firebaseClient";
import { LogOut } from "lucide-react";

export default function SignOutButton({
  label = "Sign Out",
  redirectTo = "/",
  confirm = true,
  className = "",
  onSignedOut,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (confirm) setOpen(true);
    else doSignOut();
  };

  const doSignOut = async () => {
    setBusy(true);
    try {
      await signOut(auth);
      if (typeof onSignedOut === "function") onSignedOut();
      router.push(redirectTo);
    } catch (e) {
      console.error("Sign out failed", e);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy}
        className={`bg-red-500 hover:neon-btn-red px-4 py-2 rounded text-sm font-bold flex items-center ${className}`}
      >
        <LogOut className="w-4 h-4 mr-2" />
        {busy ? "Signing out..." : label}
      </button>

      {open && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#1C1633] text-white p-6 rounded-xl shadow-2xl w-[350px] text-center">
            <p className="text-lg font-bold mb-4">Are you sure you want to sign out?</p>
            <div className="flex w-full space-x-2">
              <button
                onClick={doSignOut}
                disabled={busy}
                className="w-1/2 bg-red-500 hover:neon-btn-red px-4 py-2 rounded text-sm"
              >
                {busy ? "Signing out..." : "Yes"}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="w-1/2 bg-gray-500 hover:neon-btn-gray px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
