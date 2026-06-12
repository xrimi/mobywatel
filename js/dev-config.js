/**
 * Konfiguracja deweloperska
 * Ustaw DEV_MODE = true aby wyłączyć zabezpieczenia podczas testowania
 */

window.DEV_CONFIG = {
  // UWAGA: NIGDY nie wdrażaj z DEV_MODE = true na produkcję!
  DEV_MODE: false,

  // Opcje deweloperskie
  SKIP_AUTH_CHECK: false, // Pomija sprawdzanie autentykacji
  SKIP_PWA_CHECK: false, // Pomija sprawdzanie trybu PWA
  SKIP_MOBILE_CHECK: false, // Pomija sprawdzanie urządzenia mobilnego
  ALLOW_DESKTOP: false, // Pozwala na dostęp z desktopa
  LOG_VERBOSE: false, // Szczegółowe logi w konsoli
  DISABLE_KEYBOARD_PROTECTION: false, // Wyłącza blokadę skrótów klawiszowych
};

// Auto-wykrywanie file:// protokołu
if (window.location.protocol === "file:") {
  console.warn("🔧 Wykryto file:// protokół - AUTO-DEV_MODE");
  console.warn(
    "⚠️ Funkcje PWA (Service Worker, niektóre fonty) nie działają z file://"
  );
  console.info(
    "💡 Użyj local server (np. Live Server w VS Code) dla pełnej funkcjonalności"
  );

  window.DEV_CONFIG.DEV_MODE = true;
  window.DEV_CONFIG.SKIP_AUTH_CHECK = true;
  window.DEV_CONFIG.SKIP_PWA_CHECK = true;
  window.DEV_CONFIG.SKIP_MOBILE_CHECK = true;
  window.DEV_CONFIG.ALLOW_DESKTOP = true;
  window.DEV_CONFIG.LOG_VERBOSE = true;
  window.DEV_CONFIG.DISABLE_KEYBOARD_PROTECTION = true;
}

// Auto-konfiguracja dla DEV_MODE
if (window.DEV_CONFIG.DEV_MODE) {
  console.warn("🔧 DEV_MODE AKTYWNY - Wszystkie zabezpieczenia WYŁĄCZONE!");
  console.warn("⚠️ NIE WDRAŻAJ na produkcję w tym trybie!");

  window.DEV_CONFIG.SKIP_AUTH_CHECK = true;
  window.DEV_CONFIG.SKIP_PWA_CHECK = true;
  window.DEV_CONFIG.SKIP_MOBILE_CHECK = true;
  window.DEV_CONFIG.ALLOW_DESKTOP = true;
  window.DEV_CONFIG.LOG_VERBOSE = true;
  window.DEV_CONFIG.DISABLE_KEYBOARD_PROTECTION = true;
}

console.log("[Dev Config] Loaded:", window.DEV_CONFIG);
