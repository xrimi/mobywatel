import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 FIREBASE CONFIG */
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

/* 🔐 PIN */
const pin = prompt("Podaj PIN");

if(pin !== "7392"){
  document.body.innerHTML = "Brak dostępu";
  throw new Error("blokada");
}

/* 🔑 GENERATOR KODU */
function randomCode(){
  return "XXXX-XXXX-XXXX-XXXX".replace(/X/g, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random()*36)]
  );
}

/* 🚀 GENEROWANIE */
async function generate(){
  const nick = document.getElementById("nick").value;

  if(!nick){
    alert("Podaj nick");
    return;
  }

  const code = randomCode();

  console.log("GENERUJE:", code);

  await addDoc(collection(db,"codes"),{
    code: code,
    nick: nick,
    used: false
  });

  console.log("ZAPISANO");

  loadCodes();
}

/* 📥 WCZYTYWANIE KODÓW */
async function loadCodes(){
  const snap = await getDocs(collection(db,"codes"));
  const container = document.getElementById("codes");

  container.innerHTML = "";

  snap.forEach(d=>{
    const data = d.data();

    const div = document.createElement("div");
    div.style.background = "#111";
    div.style.padding = "12px";
    div.style.marginBottom = "10px";
    div.style.borderRadius = "10px";

    div.innerHTML = `
      <div>
        <b>${data.code}</b><br>
        👤 ${data.nick}<br>
        ${data.used ? "❌ UŻYTY" : "✅ AKTYWNY"}
      </div>

      <div style="margin-top:10px;">
        <button onclick="del('${d.id}')">Usuń</button>
        <button onclick="edit('${d.id}')">Edytuj</button>
      </div>
    `;

    container.appendChild(div);
  });
}

/* ❌ USUWANIE */
window.del = async (id)=>{
  await deleteDoc(doc(db,"codes",id));
  loadCodes();
};

/* ✏️ EDYCJA */
window.edit = async (id)=>{
  const nick = prompt("Nowy nick:");
  if(!nick) return;

  await updateDoc(doc(db,"codes",id),{
    nick: nick
  });

  loadCodes();
};

/* 🔘 PODPIĘCIE PRZYCISKU */
document.getElementById("genBtn").addEventListener("click", generate);

/* 🚀 START */
loadCodes();
