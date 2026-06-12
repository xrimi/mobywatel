try {
  sessionStorage.removeItem("redirecting");
} catch (_) {}

(function () {
  function updateVh() {
    try {
      var h =
        (window.visualViewport && window.visualViewport.height) ||
        window.innerHeight ||
        document.documentElement.clientHeight ||
        0;
      if (h > 0) {
        var vh = h * 0.01;
        document.documentElement.style.setProperty("--vh", vh + "px");
      }
    } catch (_) {}
  }
  function rafFix() {
    requestAnimationFrame(function () {
      requestAnimationFrame(updateVh);
    });
  }
  document.addEventListener("DOMContentLoaded", rafFix, { once: true });
  window.addEventListener("pageshow", rafFix);
  window.addEventListener("resize", rafFix);
  window.addEventListener("orientationchange", rafFix);
  try {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", rafFix);
      window.visualViewport.addEventListener("scroll", rafFix);
    }
  } catch (_) {}
  setTimeout(rafFix, 300);
  setTimeout(rafFix, 1000);
})();

// ===============================
// 🔥 POPRAWIONA FUNKCJA REDIRECT
// ===============================
function redirectToDashboard() {
  try {
    if (sessionStorage.getItem("redirecting") === "1") {
      return;
    }

    sessionStorage.setItem("redirecting", "1");
    sessionStorage.setItem("from-login", "true");
  } catch (e) {}

  window.location.href = "documents.html";
}

// ===============================
// RESZTA TWOJEGO KODU — BEZ ZMIAN
// ===============================

try {
  var pi = document.getElementById("passwordInput");
  if (pi) {
    pi.addEventListener("input", function () {
      if ((this.value || "").length > 0) {
        try {
          showPwdError("");
        } catch (_) {
          try {
            var pe = document.getElementById("passwordError");
            if (pe) {
              pe.textContent = "";
              pe.style.display = "none";
              if (pe.classList) pe.classList.remove("warn");
            }
          } catch (_) {}
          if (this.classList) this.classList.remove("input-error");
        }
      }
    });
  }
} catch (_) {}

function resetLocalPassword() {
  try {
    try {
      localStorage.removeItem("userPasswordHash");
    } catch (_) {}
    try {
      sessionStorage.removeItem("userUnlocked");
    } catch (_) {}
    try {
      var pi = document.getElementById("passwordInput");
      if (pi) {
        pi.value = "";
        pi.focus();
      }
    } catch (_) {}
    try {
      showPwdError("");
    } catch (_) {}
    try {
      alert("Hasło zostało zresetowane. Ustaw nowe przy następnym logowaniu.");
    } catch (_) {}
  } catch (_) {}
}

function showPwdError(msg) {
  try {
    var el = document.getElementById("passwordError");
    if (!el) {
      var f = document.querySelector(".login__forgot");
      if (!f) {
        if (msg) alert(msg);
        return;
      }
      el = document.createElement("div");
      el.id = "passwordError";
      el.className = "login__error";
      el.style.color = "#b91c1c";
      el.style.margin = "1px 0";
      el.style.display = "none";
      f.parentNode.insertBefore(el, f);
    }
    if (msg) {
      el.textContent = msg;
      el.style.display = "";
    } else {
      el.textContent = "";
      el.style.display = "none";
    }
  } catch (_) {
    if (msg) alert(msg);
  }
}


function handleLoginSubmit(e) {
  console.log("[Login] handleLoginSubmit called");
  try {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    var input = document.getElementById("passwordInput");
    var pwd = input && input.value ? String(input.value) : "";
    if (!pwd) {
      showPwdError("Wpisz hasło.");
      return;
    }

    // Walidacja hasła
    var stored = null;
    try {
      stored = localStorage.getItem("userPasswordHash");
    } catch (_) {
      stored = null;
    }

    sha256Hex(pwd)
      .then(function (h) {
        console.log("[Login] Password validated");

        if (!stored) {
          // Pierwsze logowanie - ustaw hasło
          try {
            localStorage.setItem("userPasswordHash", h);
          } catch (_) {}
          try {
            sessionStorage.setItem("userUnlocked", "1");
          } catch (_) {}
          showPwdError("");
          console.log("[Login] First time login successful");
          
          // Najpierw sprawdź czy pokazać modal biometrii
          if (typeof window.setupBiometricAfterLogin === 'function') {
            console.log("[Login] Checking if biometric setup should be shown...");
            
            // Sprawdź asynchronicznie czy biometria jest dostępna
            if (window.BiometricAuth) {
              BiometricAuth.checkPlatformSupport().then(function(isAvailable) {
                if (isAvailable && !BiometricAuth.isRegistered()) {
                  // Pokaż modal i OPÓŹNIJ przekierowanie
                  console.log("[Login] Biometric available - showing setup modal");
                  setupBiometricAfterLogin();
                  // Nie przekierowuj jeszcze - użytkownik może chcieć skonfigurować biometrię
                  // Modal sam przekieruje po zamknięciu
                  return;
                } else {
                  // Biometria niedostępna lub już skonfigurowana - normalnie przekieruj
                  console.log("[Login] Biometric not available or already registered - redirecting");
                  redirectToDashboard();
                }
              }).catch(function(error) {
                console.error("[Login] Error checking biometric:", error);
                redirectToDashboard();
              });
            } else {
              // BiometricAuth nie załadowany - normalnie przekieruj
              console.log("[Login] BiometricAuth not loaded - redirecting");
              redirectToDashboard();
            }
          } else {
            // Funkcja niedostępna - normalnie przekieruj
            redirectToDashboard();
          }
          
          return;
        }

        if (stored && stored === h) {
          // Hasło poprawne
          try {
            sessionStorage.setItem("userUnlocked", "1");
          } catch (_) {}
          showPwdError("");
          console.log("[Login] Login successful");
          redirectToDashboard();
          return;
        }

        // Hasło niepoprawne
        showPwdError("Wpisz poprawne hasło.");
      })
      .catch(function (err) {
        console.error("[Login] Password hash error:", err);
        showPwdError("Błąd");
      });
  } catch (err) {
    console.error("[Login] Error:", err);
    showPwdError("Błąd");
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById("passwordInput");
  const btn = document.querySelector(".login__eye");
  if (!input || !btn) return;
  const icon = btn.querySelector("img");
  if (input.type === "password") {
    input.type = "text";
    if (icon) {
      icon.src = "assets/icons/hide_password.svg";
      icon.alt = "Ukryj hasło";
    } else {
      btn.innerHTML =
        "<img src='assets/icons/hide_password.svg' alt='Ukryj hasło'>";
    }
    btn.setAttribute("aria-label", "Ukryj hasło");
  } else {
    input.type = "password";
    if (icon) {
      icon.src = "assets/icons/show_password.svg";
      icon.alt = "Pokaż hasło";
    } else {
      btn.innerHTML =
        "<img src='assets/icons/show_password.svg' alt='Pokaż hasło'>";
    }
    btn.setAttribute("aria-label", "Pokaż hasło");
  }
}

window.addEventListener("load", function () {
  try {
    checkInstallation();
  } catch (e) {}
});

document.addEventListener("DOMContentLoaded", function () {
  try {
    var forgot = document.querySelector(".login__forgot");
    if (forgot) {
      forgot.addEventListener("click", function (e) {
        try {
          if (e && typeof e.preventDefault === "function") e.preventDefault();
        } catch (_) {}
        var doReset = true;
        try {
          doReset = confirm("Zresetować zapisane hasło na tym urządzeniu?");
        } catch (_) {}
        if (doReset) resetLocalPassword();
      });
    }
  } catch (_) {}
});

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const buf = await (window.crypto && crypto.subtle && crypto.subtle.digest
    ? crypto.subtle.digest("SHA-256", data)
    : Promise.resolve(new Uint8Array()));
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

(function () {
  var scheduleId = null;
  var tickId = null;

  function setGreeting() {
    var title = document.querySelector(".login__title");
    if (!title) return;
    var now = new Date();
    var hour = now.getHours();
    var isEvening = hour >= 18 || hour < 6;
    title.textContent = isEvening ? "Dobry wieczór!" : "Dzień dobry!";
  }

  function msUntilNextChange() {
    var now = new Date();
    var next = new Date(now.getTime());
    var h = now.getHours();
    if (h < 6) {
      next.setHours(6, 0, 0, 0);
    } else if (h < 18) {
      next.setHours(18, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(6, 0, 0, 0);
    }
    var diff = next.getTime() - now.getTime();
    return Math.max(0, diff) + 500;
  }

  function scheduleNext() {
    if (scheduleId) {
      clearTimeout(scheduleId);
      scheduleId = null;
    }
    scheduleId = setTimeout(function () {
      setGreeting();
      scheduleNext();
    }, msUntilNextChange());
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      setGreeting();
      scheduleNext();
      if (tickId) {
        clearInterval(tickId);
      }
      tickId = setInterval(function () {
        try {
          setGreeting();
          scheduleNext();
        } catch (_) {}
      }, 60000);
    } catch (e) {}
  });

  try {
    window.addEventListener("focus", function () {
      try {
        setGreeting();
        scheduleNext();
      } catch (_) {}
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        try {
          setGreeting();
          scheduleNext();
        } catch (_) {}
      }
    });
  } catch (_) {}
})();

// Obsługa dark mode dla KPO logo
(function () {
  function updateKPOLogo() {
    try {
      const kpoLogo = document.querySelector(".login__kpoLogo");
      if (!kpoLogo) return;

      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        kpoLogo.src = kpoLogo.getAttribute("data-dark-src");
      } else {
        kpoLogo.src = "assets/icons/coi_common_ui_kpo_logo_group.svg";
      }
    } catch (_) {}
  }

  // Uruchom przy załadowaniu
  document.addEventListener("DOMContentLoaded", updateKPOLogo);

  // Słuchaj zmian dark mode
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === "data-theme") {
        updateKPOLogo();
      }
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  });
})();

// Request motion permission przy każdym załadowaniu login.html
(function () {
  function requestMotionPermissionOnce() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      console.log(
        "[Login] iOS detected, will request motion permission on first interaction"
      );
      // iOS wymaga wywołania w call stacku user gesture, więc requestujemy przy pierwszym kliknięciu formularza
      const form = document.getElementById("loginForm");
      const passwordInput = document.getElementById("passwordInput");

      let requested = false;
      const handleFirstInteraction = function () {
        if (requested) return;
        requested = true;

        console.log("[Login] Requesting motion permission...");
        DeviceOrientationEvent.requestPermission()
          .then((permission) => {
            console.log("[Login] Motion permission response:", permission);
          })
          .catch((err) => {
            console.log("[Login] Motion permission error:", err);
          });
      };

      if (form) {
        form.addEventListener("click", handleFirstInteraction, { once: true });
      }
      if (passwordInput) {
        passwordInput.addEventListener("focus", handleFirstInteraction, {
          once: true,
        });
      }
    } else {
      console.log(
        "[Login] Non-iOS device or old iOS, no motion permission needed"
      );
    }
  }

  document.addEventListener("DOMContentLoaded", requestMotionPermissionOnce);
  window.addEventListener("pageshow", requestMotionPermissionOnce);
})();

// Attach form submit handler
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", handleLoginSubmit);
    console.log("[Login] Form submit handler attached");
  }
  
  // Inicjalizuj UI biometryczne
  initBiometricUI();
});

// ========== BIOMETRIC AUTHENTICATION INTEGRATION ==========

function initBiometricUI() {
  // Sprawdź czy biometria jest dostępna
  if (typeof window.BiometricAuth === 'undefined') {
    console.log('[Login] BiometricAuth not loaded yet, waiting...');
    // Spróbuj ponownie po krótkiej chwili
    setTimeout(initBiometricUI, 100);
    return;
  }

  BiometricAuth.checkPlatformSupport().then(function(isAvailable) {
    if (!isAvailable) {
      console.log('[Login] Biometric authentication not available on this device');
      return;
    }

    console.log('[Login] Biometric authentication available');
    
    // Sprawdź czy użytkownik ma już zarejestrowaną biometrię
    const isRegistered = BiometricAuth.isRegistered();
    
    if (isRegistered) {
      // Dodaj przycisk logowania biometrycznego
      addBiometricLoginButton();
    } else {
      // Sprawdź czy użytkownik ma ustawione hasło
      const hasPassword = localStorage.getItem('userPasswordHash');
      if (hasPassword) {
        // Pokaż przycisk konfiguracji biometrii
        showManualBiometricSetupButton();
      }
    }
  }).catch(function(error) {
    console.error('[Login] Error checking biometric support:', error);
  });
}

// Nowa funkcja: pokazuje przycisk konfiguracji
function showManualBiometricSetupButton() {
  const btn = document.getElementById('manualBiometricSetup');
  if (btn) {
    btn.style.display = 'flex';
    btn.addEventListener('click', function() {
      console.log('[Login] Manual biometric setup clicked');
      showBiometricSetupModal();
    });
    console.log('[Login] Manual biometric setup button shown');
  }
}

function addBiometricLoginButton() {
  // Użyj istniejącego przycisku manualBiometricSetup i zmień go na przycisk logowania
  const btn = document.getElementById('manualBiometricSetup');
  if (!btn) {
    console.error('[Login] Cannot find manualBiometricSetup button');
    return;
  }

  // Zmień tekst i handler
  btn.innerHTML = `
    <img src="assets/icons/aa009_fingerprint.svg" alt="Odcisk palca" class="login__biometric-setup-icon">
    <span>Zaloguj się biometrycznie</span>
  `;
  
  // Usuń stary handler i dodaj nowy
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  
  newBtn.style.display = 'flex';
  newBtn.addEventListener('click', handleBiometricLogin);
  
  console.log('[Login] Biometric login button configured');
}

function handleBiometricLogin(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  console.log('[Login] Biometric login initiated');
  
  // Pokaż loader
  const btn = document.getElementById('manualBiometricSetup');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <div class="spinner"></div>
      <span>Uwierzytelnianie...</span>
    `;
  }

  BiometricAuth.authenticate()
    .then(function(passwordHash) {
      console.log('[Login] Biometric authentication successful');
      
      // Zaloguj użytkownika
      try {
        sessionStorage.setItem('userUnlocked', '1');
      } catch (_) {}
      
      showPwdError('');
      redirectToDashboard();
    })
    .catch(function(error) {
      console.error('[Login] Biometric authentication failed:', error);
      
      // Przywróć przycisk
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <img src="assets/icons/aa009_fingerprint.svg" alt="Odcisk palca" class="login__biometric-setup-icon">
          <span>Zaloguj się biometrycznie</span>
        `;
      }
      
      // Pokaż odpowiedni komunikat błędu
      if (error.name === 'NotAllowedError') {
        showBiometricToast('Logowanie anulowane.', 'info');
      } else if (error.message.includes('not registered')) {
        showBiometricToast('Najpierw zaloguj się hasłem, aby skonfigurować biometrię.', 'error');
      } else {
        showBiometricToast('Błąd uwierzytelniania biometrycznego.', 'error');
      }
    });
}

function showBiometricSetupPrompt() {
  // Nie pokazuj promptu automatycznie, tylko dodaj opcję w ustawieniach po zalogowaniu
  console.log('[Login] Biometric setup available after password login');
}

function setupBiometricAfterLogin() {
  // Ta funkcja powinna być wywołana po pierwszym poprawnym logowaniu hasłem
  if (!BiometricAuth || !BiometricAuth.isAvailable()) {
    return;
  }

  BiometricAuth.checkPlatformSupport().then(function(isAvailable) {
    if (!isAvailable || BiometricAuth.isRegistered()) {
      return;
    }

    // Pokaż dedykowany modal zamiast confirm() który nie działa w PWA
    setTimeout(function() {
      showBiometricSetupModal();
    }, 800);
  });
}

function showBiometricSetupModal() {
  console.log("[Login] === SHOWING BIOMETRIC SETUP MODAL ===");
  
  // Utwórz modal
  const modal = document.createElement('div');
  modal.className = 'biometric-setup-modal';
  modal.innerHTML = `
    <div class="biometric-setup-modal__overlay"></div>
    <div class="biometric-setup-modal__content">
      <div class="biometric-setup-modal__icon">
        <img src="assets/icons/aa009_fingerprint.svg" alt="Biometria">
      </div>
      <h2 class="biometric-setup-modal__title">Włączyć logowanie biometryczne?</h2>
      <p class="biometric-setup-modal__text">
        Zaloguj się szybciej i bezpieczniej używając odcisku palca.
      </p>
      <div class="biometric-setup-modal__buttons">
        <button class="biometric-setup-modal__btn biometric-setup-modal__btn--secondary" id="biometricSetupCancel">
          Nie teraz
        </button>
        <button class="biometric-setup-modal__btn biometric-setup-modal__btn--primary" id="biometricSetupConfirm">
          Włącz
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Dodaj style inline (będą działać nawet jeśli CSS się nie załaduje)
  const style = document.createElement('style');
  style.textContent = `
    .biometric-setup-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: modalFadeIn 0.3s ease;
    }
    
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .biometric-setup-modal__overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    
    .biometric-setup-modal__content {
      position: relative;
      background: #fff;
      border-radius: 20px;
      padding: 32px 24px 24px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: modalSlideUp 0.3s ease;
    }
    
    @keyframes modalSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    [data-theme="dark"] .biometric-setup-modal__content {
      background: #1e1e23;
      color: #fff;
    }
    
    .biometric-setup-modal__icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #165ef8 0%, #1a4fd8 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .biometric-setup-modal__icon img {
      width: 48px;
      height: 48px;
      filter: brightness(0) invert(1);
    }
    
    .biometric-setup-modal__title {
      font-size: 1.35rem;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: #131419;
    }
    
    [data-theme="dark"] .biometric-setup-modal__title {
      color: #fff;
    }
    
    .biometric-setup-modal__text {
      font-size: 0.95rem;
      color: #5f6675;
      line-height: 1.5;
      margin: 0 0 28px 0;
    }
    
    [data-theme="dark"] .biometric-setup-modal__text {
      color: #b8c2d8;
    }
    
    .biometric-setup-modal__buttons {
      display: flex;
      gap: 12px;
    }
    
    .biometric-setup-modal__btn {
      flex: 1;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    
    .biometric-setup-modal__btn--secondary {
      background: rgba(145, 158, 187, 0.15);
      color: #5f6675;
    }
    
    .biometric-setup-modal__btn--secondary:active {
      background: rgba(145, 158, 187, 0.25);
    }
    
    .biometric-setup-modal__btn--primary {
      background: #165ef8;
      color: #fff;
    }
    
    .biometric-setup-modal__btn--primary:active {
      background: #1450d8;
    }
    
    [data-theme="dark"] .biometric-setup-modal__btn--secondary {
      background: rgba(145, 158, 187, 0.2);
      color: #b8c2d8;
    }
  `;
  document.head.appendChild(style);

  // Handlers
  const confirmBtn = document.getElementById('biometricSetupConfirm');
  const cancelBtn = document.getElementById('biometricSetupCancel');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      console.log("[Login] User confirmed biometric setup");
      // Zamknij modal
      modal.style.animation = 'modalFadeIn 0.2s ease reverse';
      setTimeout(function() {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
        if (style.parentNode) {
          document.head.removeChild(style);
        }
        
        // Pokaż prompt biometryczny
        registerBiometric();
        
        // NIE przekierowuj - użytkownik zostaje na login.html
        // Może teraz użyć przycisku "Zaloguj się biometrycznie"
      }, 200);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      console.log("[Login] User cancelled biometric setup");
      
      // Ukryj przycisk konfiguracji
      const setupBtn = document.getElementById('manualBiometricSetup');
      if (setupBtn) {
        setupBtn.style.display = 'none';
      }
      
      // Zamknij modal BEZ przekierowania - użytkownik zostaje na login
      modal.style.animation = 'modalFadeIn 0.2s ease reverse';
      setTimeout(function() {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
        if (style.parentNode) {
          document.head.removeChild(style);
        }
        console.log("[Login] Modal closed, user stays on login page");
      }, 200);
    });
  }

  // Zamknij przy kliknięciu w overlay (bez przekierowania)
  const overlay = modal.querySelector('.biometric-setup-modal__overlay');
  if (overlay) {
    overlay.addEventListener('click', function() {
      console.log("[Login] User clicked overlay - closing without redirect");
      
      // Ukryj przycisk konfiguracji
      const setupBtn = document.getElementById('manualBiometricSetup');
      if (setupBtn) {
        setupBtn.style.display = 'none';
      }
      
      modal.style.animation = 'modalFadeIn 0.2s ease reverse';
      setTimeout(function() {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
        if (style.parentNode) {
          document.head.removeChild(style);
        }
      }, 200);
    });
  }
}

function registerBiometric() {
  console.log('[Login] Starting biometric registration');
  
  // Pokaż toast z informacją
  showBiometricToast('Konfigurowanie...', 'loading');
  
  BiometricAuth.register()
    .then(function() {
      console.log('[Login] Biometric registration successful');
      showBiometricToast('✓ Logowanie biometryczne włączone!', 'success');
      
      // Ukryj przycisk konfiguracji
      const setupBtn = document.getElementById('manualBiometricSetup');
      if (setupBtn) {
        setupBtn.style.display = 'none';
      }
      
      // Pokaż przycisk logowania biometrycznego
      setTimeout(function() {
        addBiometricLoginButton();
      }, 500);
    })
    .catch(function(error) {
      console.error('[Login] Biometric registration failed:', error);
      
      if (error.name === 'NotAllowedError') {
        // Użytkownik anulował
        console.log('[Login] Biometric registration cancelled by user');
        showBiometricToast('Anulowano', 'info');
      } else {
        showBiometricToast('Nie udało się włączyć biometrii', 'error');
      }
    });
}

// Toast notifications dla feedbacku
function showBiometricToast(message, type) {
  type = type || 'info';
  
  // Usuń poprzedni toast jeśli istnieje
  const existingToast = document.querySelector('.biometric-toast');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }
  
  const toast = document.createElement('div');
  toast.className = 'biometric-toast biometric-toast--' + type;
  toast.textContent = message;
  
  // Style inline
  const style = document.createElement('style');
  style.id = 'biometric-toast-style';
  if (!document.getElementById('biometric-toast-style')) {
    style.textContent = `
      .biometric-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(19, 20, 25, 0.95);
        color: #fff;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        animation: toastSlideUp 0.3s ease;
        max-width: 90%;
        text-align: center;
      }
      
      @keyframes toastSlideUp {
        from { 
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      
      .biometric-toast--success {
        background: rgba(16, 185, 129, 0.95);
      }
      
      .biometric-toast--error {
        background: rgba(239, 68, 68, 0.95);
      }
      
      .biometric-toast--info {
        background: rgba(59, 130, 246, 0.95);
      }
      
      .biometric-toast--loading {
        background: rgba(22, 94, 248, 0.95);
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Auto remove po 3 sekundach
  setTimeout(function() {
    if (toast && toast.parentNode) {
      toast.style.animation = 'toastSlideUp 0.2s ease reverse';
      setTimeout(function() {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 200);
    }
  }, 3000);
}

// Expose funkcję do użycia po zalogowaniu
window.setupBiometricAfterLogin = setupBiometricAfterLogin;
window.registerBiometric = registerBiometric;
