import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Configuration Firebase pour la démo
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-auth-domain",
  projectId: "demo-project",
  storageBucket: "demo-storage",
  messagingSenderId: "demo-sender",
  appId: "demo-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// En mode développement, utiliser l'émulateur Firebase
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}