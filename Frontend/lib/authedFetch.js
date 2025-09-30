import { auth } from "./firebaseClient";

export async function authedFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("No Firebase session");

  const isFormData = options?.body instanceof FormData;

  const doFetch = async (forceRefresh) => {
    const token = await user.getIdToken(forceRefresh);
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      // Only set JSON when caller didn't set it AND it's not FormData
      ...(!isFormData && !("Content-Type" in (options.headers || {}))
        ? { "Content-Type": "application/json" }
        : {}),
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let res = await doFetch(false);
  if (res.status === 401) res = await doFetch(true);
  return res;
}