/* ================================================
   FIREBASE-INIT.JS — Inicialização ÚNICA do Firebase
   Compartilhado entre links.js e produtos.js
   ================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmeQRWvfia5U1JZOZPDwM_0apdPo09cpc",
  authDomain: "mya-oficial.firebaseapp.com",
  databaseURL: "https://mya-oficial-default-rtdb.firebaseio.com",
  projectId: "mya-oficial",
  storageBucket: "mya-oficial.firebasestorage.app",
  messagingSenderId: "322566791231",
  appId: "1:322566791231:web:94492e5af7866ca8bf588a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, get, onValue };
