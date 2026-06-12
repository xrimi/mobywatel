import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnRiQrdboAfjAFoBLj37A8QoIIezqrbVk",
  authDomain: "bobywatelkody.firebaseapp.com",
  projectId: "bobywatelkody",
  storageBucket: "bobywatelkody.firebasestorage.app",
  messagingSenderId: "941487075648",
  appId: "1:941487075648:web:40d8a374d293c16d56caa5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// 🔥 jeśli już aktywowany → NIE wracaj do activate
if (localStorage.getItem("activated") === "true") {
  window.location.href = "login.html";
}


// 🔥 zapis aktywacji
function saveAuth() {
  const request = indexedDB.open("obywatel_auth", 1);

  request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("auth_state")) {
      db.createObjectStore("auth_state");
    }
  };

  request.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction("auth_state", "readwrite");
    const store = tx.objectStore("auth_state");

    store.put({
      refreshToken: "OK",
      activated: true
    }, "auth_state");

    tx.oncomplete = function () {
      localStorage.setItem("activated", "true");

      // 🔥 TO JEST KLUCZOWE — zapobiega pętli po restarcie
      sessionStorage.setItem("auth_validated", "true");

      window.location.href = "login.html";
    };
  };
}


// 🔑 sprawdzanie kodu
document.getElementById("activateForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const key = document.getElementById("adminKeyInput").value.trim();
  const nick = document.getElementById("deviceLabelInput").value.trim();

  if (!key || !nick) {
    alert("Uzupełnij dane");
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "codes"));
    let found = false;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // ✅ ZMIANA — kod NIE jest jednorazowy
      if (data.code === key) {
        found = true;

        // 🔥 NIE BLOKUJEMY kodu
        // (czyli brak used: true)

        // ✔ opcjonalnie zapis nicku (nie wpływa na działanie)
        await updateDoc(doc(db, "codes", docSnap.id), {
          nick: nick
        });

        alert("✅ Aktywacja OK");

        saveAuth();
        break;
      }
    }

    if (!found) {
      alert("❌ Zły kod");
    }

  } catch (err) {
    console.error(err);
    alert("Błąd Firebase");
  }
});
