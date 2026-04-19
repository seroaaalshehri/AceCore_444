"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../../lib/firebaseClient";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try { await signOut(auth); } catch (e) { console.error(e); }
            router.replace("/Home");          
        })();
    }, [router]);

    return <div className="p-6 text-gray-300">Signing you out…</div>;
}
