(function () {
  "use strict";

  const DEV_MODE = window.DEV_CONFIG && window.DEV_CONFIG.DEV_MODE;
  if (DEV_MODE) {
    console.warn("[PWA Gate] 🔧 DEV_MODE - Zabezpieczenia wyłączone");
    return;
  }

  function isMobile() {
    if (window.DEV_CONFIG && window.DEV_CONFIG.SKIP_MOBILE_CHECK) {
      return true;
    }

    const isMobileScreen =
      window.innerWidth <= 768 || window.screen.width <= 768;

    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
        ua
      );

    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    return isMobileUA || (isMobileScreen && hasTouch);
  }

  function isStandalone() {
    if (window.DEV_CONFIG && window.DEV_CONFIG.SKIP_PWA_CHECK) {
      return true;
    }

    if (window.navigator.standalone === true) return true;
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;

    return false;
  }

  // 🔥 NAPRAWIONA funkcja — BEZ konfliktu i BEZ pętli
  async function isAuthenticated() {
    try {
      // ✔ 1. localStorage (najpewniejsze po restarcie)
      if (localStorage.getItem("activated") === "true") {
        console.log("[PWA Gate] Activated via localStorage");
        return true;
      }

      // ✔ 2. session cache
      const sessionValidated = sessionStorage.getItem("auth_validated");
      if (sessionValidated === "true") {
        console.log("[PWA Gate] Session already validated");
        return true;
      }

      // ✔ 3. IndexedDB
      const db = await openDB();
      const authState = await getFromDB(db, "auth_state");

      if (!authState) {
        console.log("[PWA Gate] Brak auth_state");
        return false;
      }

      if (
        authState.refreshToken ||
        authState.accessToken ||
        authState.activated === true
      ) {
        console.log("[PWA Gate] ✅ Urządzenie aktywowane");

        sessionStorage.setItem("auth_validated", "true");

        return true;
      }

      return false;
    } catch (err) {
      console.error("Auth check failed:", err);
      return false;
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

  function showBlockPage(type) {
    const messages = {
      desktop: {
        title: "Dostęp tylko na urządzeniach mobilnych",
        subtitle: "Ta aplikacja działa wyłącznie na smartfonach i tabletach",
        icon: "📱",
      },
      install: {
        title: "Zainstaluj aplikację",
        subtitle:
          "Aby korzystać z mObywatel, dodaj aplikację do ekranu głównego",
        icon: "⬇️",
      },
      activate: {
        title: "Wymagana aktywacja",
        subtitle: "Musisz aktywować urządzenie przed pierwszym użyciem",
        icon: "🔑",
      },
    };

    const msg = messages[type] || messages.desktop;

    document.body.innerHTML = `...`;
  }

  let isAuthCheckComplete = false;
  let isAuthValid = false;

  async function checkAccess() {
    const currentPage = window.location.pathname;

    if (
      currentPage.includes("index.html") ||
      currentPage === "/" ||
      currentPage.includes("activate.html") ||
      currentPage.includes("login.html") ||
      currentPage.includes("admin.html") ||
      currentPage.includes("admin-login.html")
    ) {
      return;
    }

    if (!isMobile()) {
      window.location.href = "./index.html";
      return;
    }

    if (!isStandalone()) {
      window.location.href = "./index.html";
      return;
    }

    const authenticated = await isAuthenticated();

    if (!authenticated) {
      window.location.href = "./index.html";
      return;
    }

    console.log("[PWA Gate] ✅ Access granted");
  }

  checkAccess();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkAccess();
    }
  });

})();
