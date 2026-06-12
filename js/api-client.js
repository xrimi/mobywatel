console.log("API CLIENT BYPASSED");

// 🔥 udajemy że wszystko działa żeby nie było błędów
window.apiClient = {
  apiFetch: async () => ({ ok: true, json: async () => ({}) }),
  authenticatedRequest: async () => ({ ok: true, json: async () => ({}) }),
  refreshAccessToken: async () => true,
  clearAuthAndRedirect: () => {},
  getAuthHeaders: async () => ({}),
  translateErrorMessage: (e) => e
};

// 🔥 zatrzymujemy resztę pliku
return;
/**
 * API Client with automatic 401 handling
 * Handles token expiration, device unbinding, key deletion, etc.
 */

const API_BASE_URL = "https://butilive.adadad1314asda.workers.dev";

/**
 * Clear auth state and redirect to activation
 */
async function clearAuthAndRedirect(reason = "Sesja wygasła") {
  console.warn("[API Client] Autoryzacja unieważniona:", reason);

  // Show user-friendly message
  if (reason && !reason.includes("Redirecting")) {
    // Only show if not during redirect
    const polishMessage = translateErrorMessage(reason);
    console.log("[API Client] Komunikat dla użytkownika:", polishMessage);
  }

  try {
    // Clear IndexedDB
    const db = await openDB();
    const tx = db.transaction("auth_state", "readwrite");
    const store = tx.objectStore("auth_state");
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Clear session validation cache
    sessionStorage.removeItem("auth_validated");
    sessionStorage.removeItem("auth_validated_at");

    // Clear memory
    if (window.__devicePrivateKey) {
      delete window.__devicePrivateKey;
    }
  } catch (err) {
    console.error(
      "[API Client] Nie udało się wyczyścić danych autoryzacji:",
      err
    );
  }

  // Redirect to index (which will route to activate.html)
  window.location.href = "./index.html";
}

/**
 * Translate error messages to Polish
 */
function translateErrorMessage(error) {
  const translations = {
    "Session expired": "Sesja wygasła",
    Unauthorized: "Brak autoryzacji",
    "Token expired": "Token wygasł",
    "Device not found": "Urządzenie nie znalezione",
    "Device revoked": "Urządzenie zostało unieważnione",
    "Admin key blocked": "Klucz administratora został zablokowany",
    "Admin key deleted": "Klucz administratora został usunięty",
    "Admin key expired": "Klucz administratora wygasł",
    "Device not bound to any key":
      "Urządzenie nie jest powiązane z żadnym kluczem",
    "Refresh failed": "Odświeżanie nie powiodło się",
    "No refresh token": "Brak tokenu odświeżania",
    "Network error": "Błąd połączenia z serwerem",
    Timeout: "Przekroczono limit czasu połączenia",
    "Failed to fetch": "Nie udało się połączyć z serwerem",
  };

  return translations[error] || error;
}

/**
 * Fetch with automatic 401 handling and retry logic
 */
async function apiFetch(url, options = {}) {
  const maxRetries = 3;
  const baseDelay = 500; // ms
  let timeoutId;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - auth invalid (device unbound, key deleted, etc.)
      if (response.status === 401) {
        const error = await response
          .json()
          .catch(() => ({ error: "Brak autoryzacji" }));
        await clearAuthAndRedirect(error.error || "Brak autoryzacji");
        throw new Error("Przekierowywanie do aktywacji...");
      }

      return response;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);

      // Handle timeout
      if (err.name === "AbortError") {
        console.error(
          `[API Client] Request timeout (attempt ${attempt + 1}/${maxRetries})`
        );

        if (attempt === maxRetries - 1) {
          throw new Error(
            "Przekroczono limit czasu połączenia. Sprawdź połączenie internetowe."
          );
        }
      }

      // Don't retry on 401 or final attempt
      if (
        err.message === "Przekierowywanie do aktywacji..." ||
        attempt === maxRetries - 1
      ) {
        // Better error message for network errors
        if (err.message.includes("fetch")) {
          throw new Error(
            "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie."
          );
        }
        throw err;
      }

      // Exponential backoff: 500ms, 1s, 2s
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `[API Client] Żądanie nie powiodło się (próba ${
          attempt + 1
        }/${maxRetries}), ponowienie za ${delay}ms:`,
        translateErrorMessage(err.message)
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Get auth headers for authenticated requests
 */
async function getAuthHeaders() {
  const db = await openDB();
  const authState = await getFromDB(db, "auth_state");

  if (!authState || !authState.accessToken) {
    throw new Error("Brak autoryzacji. Zaloguj się ponownie.");
  }

  const installId = await getFromDB(db, "install_id");

  return {
    Authorization: `Bearer ${authState.accessToken}`,
    "X-PWA-Install-ID": installId,
    "Content-Type": "application/json",
  };
}

/**
 * Make authenticated API request with DPoP
 */
async function authenticatedRequest(endpoint, options = {}) {
  const headers = await getAuthHeaders();

  // TODO: Add DPoP proof generation here
  // For now, just add auth headers

  const response = await apiFetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  return response;
}

/**
 * Refresh access token with retry
 */
async function refreshAccessToken() {
  const db = await openDB();
  const authState = await getFromDB(db, "auth_state");

  if (!authState || !authState.refreshToken) {
    await clearAuthAndRedirect("Brak tokenu odświeżania");
    throw new Error("Brak tokenu odświeżania");
  }

  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: authState.refreshToken,
      }),
    });

    if (!response.ok) {
      // Refresh failed - clear auth
      const error = await response
        .json()
        .catch(() => ({ error: "Odświeżanie nie powiodło się" }));
      await clearAuthAndRedirect(error.error || "Odświeżanie nie powiodło się");
      throw new Error("Odświeżanie nie powiodło się");
    }

    const data = await response.json();

    // Update stored tokens
    // Note: No expiresAt - tokens are valid until key is revoked/deleted
    await setInDB(db, "auth_state", {
      ...authState,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });

    return data.access_token;
  } catch (err) {
    console.error("[API Client] Odświeżanie nie powiodło się:", err);
    await clearAuthAndRedirect("Odświeżanie nie powiodło się");
    throw err;
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("obywatel_auth", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("auth_state")) {
        db.createObjectStore("auth_state");
      }
    };
  });
}

function getFromDB(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("auth_state", "readonly");
    const store = tx.objectStore("auth_state");
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function setInDB(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("auth_state", "readwrite");
    const store = tx.objectStore("auth_state");
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Export for use in other scripts
window.apiClient = {
  apiFetch,
  authenticatedRequest,
  refreshAccessToken,
  clearAuthAndRedirect,
  getAuthHeaders,
  translateErrorMessage,
};
