"use client";

import { useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDOIJlrg-sf2Dsl69SebD3H1Eldk2Vr7CQ",
  authDomain: "acecore-7aa99.firebaseapp.com",
  projectId: "acecore-7aa99",
  storageBucket: "acecore-7aa99.appspot.com",
  messagingSenderId: "511039506276",
  appId: "1:511039506276:web:a1b5a687aec1938b425c71",
};

function getFirebaseApp() {
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig);
}

export default function NotificationListener() {
  useEffect(() => {
    let unsubscribe = () => {};

    isSupported()
      .then(async (ok) => {
        if (!ok) return;

        const app = getFirebaseApp();
        const messaging = getMessaging(app);

        // Ask for permission if not already granted
        if (Notification.permission !== "granted") {
          await Notification.requestPermission();
        }

        unsubscribe = onMessage(messaging, async (payload) => {
          console.log("[FCM foreground message]", payload);

          const title =
            payload.notification?.title ||
            payload.data?.title ||
            "AceCore";
          const body =
            payload.notification?.body ||
            payload.data?.body ||
            "Your scrim arena starts in 2 hours!";
          const link =
            payload.data?.link || "/gamer/notifications";

          // Use the SAME channel as background: service worker notification
          const registration = await navigator.serviceWorker.ready;

          registration.showNotification(title, {
            body,
            icon: "/AC-glow.png",
            badge: "/favicon-32x32.png",
            requireInteraction: true,
            data: { url: link },
          });
        });
      })
      .catch((err) => {
        console.error("[FCM isSupported error]", err);
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // No in-page UI needed
  return null;
}
