
import { auth } from "./firebaseClient";

export async function authedFetch(input, init = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
  
    throw new Error("Not authenticated");
  }

  const idToken = await currentUser.getIdToken(true);

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${idToken}`);

  return fetch(input, {
    ...init,
    headers,
   
  });
}
