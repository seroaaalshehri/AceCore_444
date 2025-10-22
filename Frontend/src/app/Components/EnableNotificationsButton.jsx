"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getToken, deleteToken, onMessage } from "firebase/messaging";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db, getMessagingIfSupported } from "../../../lib/firebaseClient";

export default function EnableNotificationsButton() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [lastMsg, setLastMsg] = useState(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Keep state sticky if a token already exists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) { setEnabled(false); return; }

      const messaging = await getMessagingIfSupported();
      if (!messaging || Notification.permission !== "granted") {
        setEnabled(false);
        return;
      }

      try {
        const swReg =
          (await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js")) ||
          (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (!cancelled && token) {
          // If a token doc exists, consider this device “enabled”
          const tokenDoc = await getDoc(doc(db, "users", user.uid, "fcmTokens", token));
          setEnabled(tokenDoc.exists());
        }
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  async function enable() {
    try {
      setBusy(true);
      const messaging = await getMessagingIfSupported();
      if (!messaging) return alert("This browser doesn’t support push notifications.");

      const perm = await Notification.requestPermission();
      if (perm !== "granted") return alert("Permission denied.");

      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });
      if (!token) return alert("Couldn’t get a device token.");

      await setDoc(
        doc(db, "users", user.uid, "fcmTokens", token),
        { token, createdAt: new Date() },
        { merge: true }
      );

     onMessage(messaging, (payload) => {
  console.log("Foreground FCM:", payload);
  const { title, body } = payload.notification || {};

  if (title && body && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/AC-glow.png", 
    });
  }

  setLastMsg(payload.notification || null);
});


      setEnabled(true);
    } catch (e) {
      console.error(e);
      alert("Failed to enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    try {
      setBusy(true);
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;

      // Try to resolve current token (if any), then delete it in both places
      const swReg =
        (await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js")) ||
        (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (token && user?.uid) {
        await deleteDoc(doc(db, "users", user.uid, "fcmTokens", token));
        await deleteToken(messaging); // unregister with FCM
      }

      setEnabled(false);
    } catch (e) {
      console.error(e);
      alert("Failed to disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {enabled ? (
        <button
          onClick={disable}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-[#FCCC22] text-black font-semibold disabled:opacity-50"
        >
          {busy ? "Turning Off…" : "Notifications On"}
        </button>
      ) : (
        <button
          onClick={enable}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-[#2b2142] text-white hover:bg-[#3a2b57] font-semibold disabled:opacity-50"
        >
          {busy ? "Turning On" : "Notifications Off"}
        </button>
      )}

      {lastMsg && (
        <div className="px-3 py-2 rounded-lg bg-[#1C1633] text-[#dee1e6] text-sm">
          <div className="font-semibold">{lastMsg.title}</div>
          <div>{lastMsg.body}</div>
        </div>
      )}
    </div>
  );
}