import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAnNm5JAbx7yE9ZtID8R9eSRLAR4dozre8",
    authDomain: "mentalserenity-ff95d.firebaseapp.com",
    databaseURL: "https://mentalserenity-ff95d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mentalserenity-ff95d",
    storageBucket: "mentalserenity-ff95d.firebasestorage.app",
    messagingSenderId: "116708146548",
    appId: "1:116708146548:web:b9bb4861110fc1f60cc021"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth }; 