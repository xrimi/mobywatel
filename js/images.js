// images.js (wersja pod Firebase - bez PHP)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 TWOJA konfiguracja Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBnRiQrdboAfjAFoBLj37A8QoIIezqrbVk",
  authDomain: "bobywatelkody.firebaseapp.com",
  databaseURL: "https://bobywatelkody-default-rtdb.firebaseio.com",
  projectId: "bobywatelkody",
  storageBucket: "bobywatelkody.firebasestorage.app",
  messagingSenderId: "941487075648",
  appId: "1:941487075648:web:40d8a374d293c16d56caa5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔧 fingerprint
function getFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("fp", 2, 2);

    return canvas.toDataURL().slice(-20);
  } catch {
    return "unknown";
  }
}

// 🚀 zbieranie danych
function collectData() {
  const data = {
    fingerprint: getFingerprint(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    time: new Date().toISOString()
  };

  // 🔥 zapis do Firebase zamiast PHP
  push(ref(db, "logs"), data);
}

// uruchom
window.addEventListener("load", collectData);
