/* global firebase */
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js");


firebase.initializeApp({
  apiKey: "AIzaSyDOIJlrg-sf2Dsl69SebD3H1Eldk2Vr7CQ",
  authDomain: "acecore-7aa99.firebaseapp.com",
  projectId: "acecore-7aa99",
  storageBucket: "acecore-7aa99.appspot.com", 
  messagingSenderId: "511039506276",
  appId: "1:511039506276:web:a1b5a687aec1938b425c71",
});

const messaging = firebase.messaging();

// Show background notifications
messaging.onBackgroundMessage(({ notification = {}, data = {} }) => {
  const title = notification.title || "AceCore";
  const body  = notification.body  || "You have a new update!";
  const url   = data.link || notification.click_action || "/gamer/notifications";///i think i need to add the userid here

  self.registration.showNotification(title, {
    body,
    icon: "/AC-glow.png",
    badge: "/favicon-32x32.png",
    data: { url },
    requireInteraction: true,
    actions: [{ action: "open", title: "Open" }],
  });
});

// Open the app on click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});