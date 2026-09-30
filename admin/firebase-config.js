// ================= FIREBASE CONFIG =================
// Shared config — admin panel reads & writes, bonus form writes submissions.
const firebaseConfig = {
  apiKey: "AIzaSyCltbl2Mwr3DbybD8GxqX7uS0fn_SsnpUc",
  authDomain: "dds96-a70b4.firebaseapp.com",
  databaseURL: "https://dds96-a70b4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dds96-a70b4",
  storageBucket: "dds96-a70b4.firebasestorage.app",
  messagingSenderId: "966026483307",
  appId: "1:966026483307:web:18ecc0b748d503cdee432e"
};

const SITE_ID = "lucky_star";

const CDN = [
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"
];

function loadFirebaseScripts() {
  if (window.firebase && window.firebase.firestore) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let loaded = 0;

    CDN.forEach((src) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => {
        loaded++;
        if (loaded === CDN.length) resolve();
      };
      s.onerror = () => reject(new Error("Failed to load: " + src));
      document.head.appendChild(s);
    });
  });
}

async function initFirebase() {
  await loadFirebaseScripts();

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  return {
    db: firebase.firestore()
  };
}
