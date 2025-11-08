"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Particles from "../../../Components/Particles";
import LeftSidebar from "../../../Components/LeftSidebar";
import EnableNotificationsButton from "../../../Components/EnableNotificationsButton";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../../../lib/firebaseClient";
import { authedFetch } from "../../../../../lib/authedFetch";
import Link from "next/link";

const API_BASE =  "http://localhost:4000/api";

export default function NotificationsPage() {
  const router = useRouter();
  const params = useParams();

  // This is the *gamer id* from the URL
  const gamerIdParam = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [me, setMe] = useState(null);
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

  // Keep auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        router.replace(`/Signin?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      try {
        const res = await authedFetch(`${API_BASE}/users/me`);
        if (!res.ok) {
          router.replace(`/Signin?next=${encodeURIComponent(location.pathname)}`);
          return;
        }
        const data = await res.json();
        setMe(data?.user || null);
      } catch {
        router.replace("/Signin");
      }
    });
    return () => unsub();
  }, [router]);

  // Fetch list of notifications for me.id
  useEffect(() => {
    (async () => {
      if (!me?.id) return;

      // if someone typed a different id in the URL, normalize it
      if (gamerIdParam && gamerIdParam !== me.id) {
        router.replace(`/gamer/notifications/${me.id}`);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await authedFetch(`${API_BASE}/gamer/${me.id}/notifications`);
        if (!res.ok) {
          setError(`Failed to load notifications (HTTP ${res.status})`);
          setItems([]);
          return;
        }
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          setError("Unexpected response from server (not JSON).");
          setItems([]);
          return;
        }

        const data = await res.json();
        const list = data.notifications || data.items || [];
        setItems(Array.isArray(list) ? list : []);
        // ✅ Mark all unread notifications as read
try {
  const toMark = (Array.isArray(list) ? list : []).filter(n => !n.read && n.id);
  await Promise.all(
    toMark.map(n =>
      authedFetch(`${API_BASE}/gamer/${me.id}/notifications/${n.id}/read`, {
        method: "POST",
      })
    )
  );
} catch (err) {
  console.warn("Failed to mark notifications as read:", err);
}

      } catch (e) {
        console.error("Error loading notifications:", e);
        setError("Could not load notifications.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [me?.id, gamerIdParam, router]);

  if (!me) return null;



  return (
    <div className="flex min-h-screen bg-[#0C0817] text-white">
        <div className="absolute inset-2 z-0 pointer-events-none">
          <Particles particleColors={["#ffffff"]} particleCount={160} particleSpread={10} speed={0.1} particleBaseSize={100} />
        </div >
              <div className="w-[250px] relative">

        <LeftSidebar role="gamer" active="notifications" userId={me.id} />
      </div>

      <main className="flex-1 p-8 font-barlow">
        <div className="flex items-center justify-between mb-8">
          <h1 className="ml-20 text-5xl font-bold text-[#FCCC22]">NOTIFICATIONS</h1>
          <EnableNotificationsButton />
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400 ml-20 text-3xl">you have no notifications yet.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((n) => (
              <li key={n.id} className="ml-20 mr-16 rounded-xl p-5 bg-[#1C1633] border-l-4 border-[#FCCC22]">
  <p className="text-3xl font-semibold">{n.title || "Notification"}</p>
  <p className="text-gray-300 text-2xl ">{n.body || n.message || ""}</p>

  {(() => {
  const relativePath =
    typeof n.link === "string" && n.link.startsWith("/")
      ? n.link
      : "canceled";

  return (
    <Link
      href={relativePath}
      className="text-[#FCCC22] underline text-xl mt-2 inline-block hover:text-[#ffd84d] transition"
      prefetch={false}
    >
    {relativePath !== "canceled" ? "View →" : ""}
    </Link>
  );
})()}

</li>

            ))}
          </ul>
        )}
      </main>
    </div>
  );
}