import { initializeApp ,getApps ,getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import dotenv from "dotenv";
dotenv.config(); 


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGE_SENDERID,
  appId: prcoess.env.FIREBASE_APP_ID
};

//Initialise Firebase
const app = !getApps().length? initializeApp(firebaseConfig):getApp();
const auth = getAuth(app);

export {app,auth}