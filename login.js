
const firebaseConfig = {
  apiKey: "AIzaSyDhwQEzzvntZljPn9L4G47ZnSaDysbU400",
  authDomain: "galeriavt-66369.firebaseapp.com",
  projectId: "galeriavt-66369",
  storageBucket: "galeriavt-66369.firebasestorage.app",
  messagingSenderId: "153916747029",
  appId: "1:153916747029:web:3427ccfccdbbf4dcb9cd1c",
  measurementId: "G-ND3JPYNMHS"
};


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

////Correos de administradores

const adminEmails = [
  "moisespare009@gmail.com",
  "juandiegoaimar7932@gmail.com",
  "wyllv31@gmail.com"
];


const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');
const msgEl = document.getElementById('auth-msg');

function showMsg(text, color = '#6b7280') {
  msgEl.textContent = text;
  msgEl.style.color = color;
}

function switchTab(name){
  tabs.forEach(t => {
    const is = t.dataset.tab === name;
    t.classList.toggle('active', is);
    t.setAttribute('aria-selected', is ? 'true' : 'false');
  });
  panels.forEach(p => {
    const id = p.id.replace('tab-','');
    p.classList.toggle('active', id === name);
    p.setAttribute('aria-hidden', id === name ? 'false' : 'true');
  });
  showMsg('');
}


tabs.forEach(t => {
  t.addEventListener('click', () => {
    const tab = t.dataset.tab;
    switchTab(tab);
  });
});


const loginEmail = document.getElementById('login-email');
const loginPass = document.getElementById('login-pass');
const btnLogin = document.getElementById('btn-login');
const btnGoogleLogin = document.getElementById('btn-google-login');


const regName = document.getElementById('reg-name');
const regLast = document.getElementById('reg-last');
const regDni = document.getElementById('reg-dni');
const regEmail = document.getElementById('reg-email');
const regPass = document.getElementById('reg-pass');
const regPass2 = document.getElementById('reg-pass2');
const btnRegister = document.getElementById('btn-register');
const btnGoogleRegister = document.getElementById('btn-google-register');


btnLogin.addEventListener('click', async () => {
  const email = loginEmail.value.trim();
  const pass = loginPass.value;

  if(!email || !pass) return showMsg('Completa email y contraseña', '#ef4444');

  try {
    await auth.signInWithEmailAndPassword(email, pass);
    showMsg('Inicio de sesión correcto — redirigiendo...', '#10b981');
  
  } catch (err) {
    showMsg('Error: ' + err.message, '#ef4444');
  }
});


btnRegister.addEventListener('click', async () => {
  const name = regName.value.trim();
  const last = regLast.value.trim();
  const dni = regDni.value.trim();
  const email = regEmail.value.trim();
  const p1 = regPass.value;
  const p2 = regPass2.value;

  if(!name || !last || !dni || !email || !p1 || !p2) return showMsg('Completa todos los campos', '#ef4444');
  if(p1.length < 6) return showMsg('La contraseña debe tener al menos 6 caracteres', '#ef4444');
  if(p1 !== p2) return showMsg('Las contraseñas no coinciden', '#ef4444');

  try {
    const res = await auth.createUserWithEmailAndPassword(email, p1);
   
    if(res.user) {
      await res.user.updateProfile({ displayName: `${name} ${last}` });
    }
    showMsg('Cuenta creada — redirigiendo...', '#10b981');
   
  } catch (err) {
    showMsg('Error: ' + err.message, '#ef4444');
  }
});


async function signInWithGoogle(){
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
    showMsg('Bienvenido — autenticando...', '#10b981');
  
  } catch (err) {
    showMsg('Error (Google): ' + err.message, '#ef4444');
  }
}
btnGoogleLogin.addEventListener('click', signInWithGoogle);
btnGoogleRegister.addEventListener('click', signInWithGoogle);


auth.onAuthStateChanged(user => {
  if(user){
    const email = user.email;


    localStorage.setItem('usuarioActual', JSON.stringify({
      nombre: user.displayName,
      correo: user.email,
      foto: user.photoURL
    }));

   
    const destino = adminEmails.includes(email)
      ? 'admin.html'
      : 'index.html';

    showMsg('Inicio de sesión correcto — redirigiendo...', '#10b981');
    
    setTimeout(() => {
      window.location.href = destino;
    }, 800);
  } else {
    console.log('No hay usuario autenticado');
  }
});



switchTab('login');
