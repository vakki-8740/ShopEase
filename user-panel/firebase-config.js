const firebaseConfig = {
    apiKey: "AIzaSyCfMTBYHGrziyxgagp3sVA_haMMiVi-I4s",
    authDomain: "khan-bit.firebaseapp.com",
    databaseURL: "https://khan-bit-default-rtdb.firebaseio.com",
    projectId: "khan-bit",
    storageBucket: "khan-bit.firebasestorage.app",
    messagingSenderId: "760387907653",
    appId: "1:760387907653:web:2160dfa5314de65c80f32c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Admin email - change this to your email
const ADMIN_EMAIL = "shopadmin@gmail.com";
