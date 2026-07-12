import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
apiKey: "AIzaSyDNljDNMNtgTLaqwPbAz8YaNYxQG2Sr1uE",
  authDomain: "congo-unity-platform.firebaseapp.com",
  projectId: "congo-unity-platform",
  storageBucket: "congo-unity-platform.firebasestorage.app",
  messagingSenderId: "335406147258",
  appId: "1:335406147258:web:41f5d6d8f5639c0d614483",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);