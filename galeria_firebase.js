
const firebaseConfig = {
  apiKey: "AIzaSyDhwQEzzvntZljPn9L4G47ZnSaDysbU400",
  authDomain: "galeriavt-66369.firebaseapp.com",
  projectId: "galeriavt-66369",
  storageBucket: "galeriavt-66369.firebasestorage.app",
  messagingSenderId: "153916747029",
  appId: "1:153916747029:web:3427ccfccdbbf4dcb9cd1c",
  measurementId: "G-ND3JPYNMHS"
};

// Inicializar Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();


auth.onAuthStateChanged(user => {
  const btnLogout = document.getElementById("btn-logout");

  if (!user) {
    console.log("Modo visitante");
    window.userEmail = null; 
    
    if(btnLogout) {
      btnLogout.textContent = "Iniciar sesión";
      btnLogout.style.background = "#66c0f4"; 
      btnLogout.onclick = () => window.location.href = "login.html";
    }

  } else {
    console.log("✅ Usuario autenticado:", user.email);
    window.userEmail = user.email;

    if(btnLogout) {
      btnLogout.textContent = "Cerrar sesión";
      btnLogout.style.background = ""; 
      btnLogout.onclick = async () => {
        await auth.signOut();
        window.location.href = "login.html";
      };
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await auth.signOut();
        window.location.href = "login.html";
      } catch (err) {
        console.error("❌ Error al cerrar sesión:", err);
      }
    });
  }
});


if (!window.state) {
  window.state = {
    items: [],
    cart: []
  };
}

////Agregar al carrito

window.addToCart = function (itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return alert("Error: item no encontrado");

  state.cart.push({ ...item });
  console.log("🛒 Agregado al carrito:", item);
  alert("Producto agregado al carrito ✔");
};




 ////Cargar items  Firestore

async function cargarItemsDesdeFirestore() {
  try {
    const snapshot = await db.collection("items").get();

    const items = snapshot.docs.map(doc => {
      const d = doc.data();

  
      return {
        id: doc.id,
        img: d.img || d.imagen || "",
        title: d.title || d.titulo || "Sin título",
        desc: d.desc || d.descripcion || "",
        price: d.price || d.precio || 0,
        author: d.author || d.autor || "desconocido",
        category: d.category || d.categoria || "General",
        rating: d.rating || 0
      };
    });

    console.log("✅ Items cargados desde Firestore (normalizados):", items);

    state.items = items;

    if (typeof renderFeatured === "function") renderFeatured();
    if (typeof renderGallery === "function") renderGallery();

  } catch (error) {
    console.error("❌ Error al cargar items desde Firestore:", error);
  }
}

document.addEventListener("DOMContentLoaded", cargarItemsDesdeFirestore);

 ///Render pendientes

window.renderPending = renderPending;

setTimeout(() => {
  if (typeof renderPending === "function") renderPending();
}, 800);
