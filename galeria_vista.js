const state = {
  items: [],
  pending: [],
  cart: [],
  currentItem: null
};

window.state = state;

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function showView(viewId){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if(target) target.classList.add('active');

  $$('.nav-link').forEach(a=>{
    a.classList.toggle('active', a.dataset.link === viewId);
  });
}

function formatMoney(v){ return 'S/. ' + Number(v).toFixed(2); }

function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

function updateCartCount(){
  const el = $('#cart-count');
  if(el) el.textContent = state.cart.length;
}

function renderFeatured(){
  const container = $('#featured-grid');
  if (!container) return;

  container.innerHTML = '';
  state.items.slice(0,3).forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img class="card-img" src="${it.img}" />
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">${escapeHtml(it.title)}</div>
            <div class="muted" style="font-size:13px">${escapeHtml(it.author)} · ${escapeHtml(it.category)}</div>
          </div>
          <div style="text-align:right">
            <div class="price">${formatMoney(it.price)}</div>
            <div class="stars">${(it.rating || 0).toFixed(1)} ★</div>
          </div>
        </div>
      </div>
    `;

    card.onclick = () => openDetail(it.id);
    container.appendChild(card);
  });
}

function renderGallery(){
  const grid = $('#gallery-grid');
  if(!grid) return;
  grid.innerHTML = '';

  let items = state.items.slice();
  const q = $('#search-input') ? $('#search-input').value.trim().toLowerCase() : '';
  const cat = $('#filter-cat') ? $('#filter-cat').value : '';
  const sort = $('#filter-sort') ? $('#filter-sort').value : '';

  if(q) items = items.filter(i =>
    (i.title + ' ' + i.author + ' ' + (i.desc||'') + ' ' + i.category)
      .toLowerCase().includes(q)
  );
  if(cat) items = items.filter(i => i.category === cat);

  if(sort === 'price-asc') items.sort((a,b)=>a.price-b.price);
  if(sort === 'price-desc') items.sort((a,b)=>b.price-a.price);
  if(sort === 'popular') items.sort((a,b)=>b.rating-a.rating);
  if(sort === 'new') items.reverse();

  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img class="card-img" src="${it.img}" />
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="min-width:0">
            <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${escapeHtml(it.title)}
            </div>
            <div class="muted" style="font-size:13px">${escapeHtml(it.author)}</div>
          </div>
          <div style="text-align:right">
            <div class="price">${formatMoney(it.price)}</div>
            <div class="stars">${(it.rating || 0).toFixed(1)} ★</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
  <button class="btn btn-ghost" data-id="${it.id}" onclick="openDetailFromBtn(event)">Ver detalle</button>
  <button class="btn btn-primary" data-id="${it.id}" onclick="addToCartFromBtn(event)">Agregar</button>

  ${
    firebase.auth().currentUser &&
    firebase.auth().currentUser.email === it.author
      ? `<button class="btn btn-danger" data-id="${it.id}" onclick="deleteMyItem(event)">Eliminar</button>`
      : ""
  }
</div>

      </div>
    `;
    grid.appendChild(card);
  });
}

function openDetail(id){
  const it = state.items.find(x => x.id === id);
  if(!it) return alert('Artículo no encontrado');

  state.currentItem = it;

  $('#detail-img').src = it.img;
  $('#detail-title').textContent = it.title;
  $('#detail-author').textContent = it.author + ' • ' + it.category;
  $('#detail-price').textContent = formatMoney(it.price);
  $('#detail-desc').textContent = it.desc;

  cargarComentarios(id);

  $('#add-to-cart').dataset.id = it.id;


  let delBtn = document.getElementById("btn-delete-detail");


  if (!delBtn) {
    delBtn = document.createElement("button");
    delBtn.id = "btn-delete-detail";
    delBtn.textContent = "Eliminar publicación";
    delBtn.className = "btn btn-danger";
    delBtn.style.marginTop = "15px";
    delBtn.style.width = "100%";
    delBtn.style.display = "none";


    document.getElementById("detail-img").parentNode.appendChild(delBtn);
  }

  delBtn.onclick = () => deleteMyItem(it.id);

  const user = firebase.auth().currentUser;
  if (user && (user.email === it.author || user.email === it.autor)) {
    delBtn.style.display = "block";
    delBtn.dataset.id = it.id;
  } else {
    delBtn.style.display = "none";
  }

  showView('detail');
}


function openDetailFromBtn(e){
  e.stopPropagation();
  openDetail(e.currentTarget.dataset.id);
}


async function cargarComentarios(itemId) {
  try {
    const docRef = await db.collection("items").doc(itemId).get();
    if(!docRef.exists){
      state.currentItem.comments = [];
      state.currentItem.avgStars = "0.0";
      renderComments();
      updateDetailRating("0.0");
      return;
    }

    const data = docRef.data();
    const commentsArray = Array.isArray(data.comments) ? data.comments.slice().reverse() : []; 
    state.currentItem.comments = commentsArray;

    // calcular promedio de estrellas
    let totalStars = 0;
    commentsArray.forEach(c => totalStars += Number(c.stars || 0));
    const avg = commentsArray.length > 0 ? (totalStars / commentsArray.length) : 0;
    const avgFixed = avg.toFixed(1);
    state.currentItem.avgStars = avgFixed;

    try {
      await db.collection("items").doc(itemId).update({ rating: Number(avgFixed) });
    } catch (err) {
      console.warn("No se pudo actualizar rating en doc:", err);
    }

    renderComments();
    updateDetailRating(avgFixed);

  } catch (err) {
    console.error("Error al cargar comentarios:", err);
  }
}


function addToCartFromBtn(e){
  e.stopPropagation();

  const usuario = firebase.auth().currentUser;
  if (!usuario) {
    alert("🔒 Para comprar, necesitas iniciar sesión o registrarte.");
    window.location.href = "login.html";
    return;
  }

  const id = e.currentTarget.dataset.id || state.currentItem?.id;


  const item = state.items.find(i => i.id === id);

  if (!item) return alert("No se encontró el producto");

  state.cart.push({ ...item });
  renderCart();
  updateCartCount();
  alert("Agregado al carrito");
}

function renderCart(){
  const list = $('#cart-list');
  if(!list) return;
  list.innerHTML = '';

  let total = 0;
  state.cart.forEach((it, idx) => {
    total += Number(it.price);

    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${it.img}" />
      <div style="flex:1">
        <div style="font-weight:700">${escapeHtml(it.title)}</div>
        <div class="muted" style="font-size:13px">${escapeHtml(it.author)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700">${formatMoney(it.price)}</div>
        <button class="btn btn-ghost" data-idx="${idx}" onclick="removeFromCart(event)">Quitar</button>
      </div>
    `;
    list.appendChild(el);
  });

  $('#cart-total').textContent = formatMoney(total);
  $('#pay-total').textContent = formatMoney(total);
  updateCartCount();
}

function removeFromCart(e){
  const idx = Number(e.currentTarget.dataset.idx);
  state.cart.splice(idx,1);
  renderCart();
}


function renderComments(){
  const sec = $('#comments-section');
  if(!sec) return;
  sec.innerHTML = '';

  const comments = state.currentItem && state.currentItem.comments ? state.currentItem.comments : [];
  if(!comments.length){
    sec.innerHTML = '<div class="muted">Sé el primero en comentar.</div>';
    return;
  }

  const user = firebase.auth().currentUser;
  comments.forEach(c => {
    const d = document.createElement('div');
    d.className = "comment-box";
    let dateStr = '';
    if(c.timestamp) {
      try {
        const dt = new Date(Number(c.timestamp));
        dateStr = dt.toLocaleString();
      } catch(e){}
    }
    const isOwner = user && user.email === c.author;

    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700">${escapeHtml(c.author)}</div>
          <div class="muted" style="font-size:12px">${dateStr}</div>
        </div>
        <div style="text-align:right">
          <div class="muted">${'★'.repeat(Number(c.stars || 0))}</div>
          ${isOwner ? `<button class="btn btn-ghost btn-delete-comment" data-id="${escapeHtml(c.id || c.timestamp)}">Eliminar</button>` : ''}
        </div>
      </div>
      <div class="muted" style="margin-top:6px">${escapeHtml(c.text)}</div>
    `;
    sec.appendChild(d);
  });

  $$('.btn-delete-comment').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const cid = ev.currentTarget.dataset.id;
      const commentObj = state.currentItem.comments.find(x => (String(x.id) === String(cid) || String(x.timestamp) === String(cid)));
      if(!commentObj) {
        alert('Comentario no encontrado');
        return;
      }
      // confirmar
      const ok = confirm('¿Eliminar tu comentario?');
      if(!ok) return;
      await eliminarComentario(state.currentItem.id, commentObj);
    });
  });
}


async function postComentario() {
  const textEl = $('#comment-text');
  const starsEl = $('#comment-stars');
  if(!textEl || !starsEl) return;

  const text = textEl.value.trim();
  const stars = Number(starsEl.value) || 0;

  const user = firebase.auth().currentUser;
  if(!user){
    alert("Debes iniciar sesión para comentar.");
    return;
  }
  if(!text){
    alert("Escribe un comentario");
    return;
  }
  const userEmail = user.email;
  const itemId = state.currentItem.id;


  const timestamp = Date.now();
  const commentObj = {
    id: String(timestamp),      
    author: userEmail,
    text: text,
    stars: stars,
    timestamp: timestamp
  };

  try {
    await db.collection("items").doc(itemId).update({
      comments: firebase.firestore.FieldValue.arrayUnion(commentObj)
    });

    textEl.value = '';
    starsEl.value = '5';
    await cargarComentarios(itemId);
    alert('Comentario publicado ✔');

  } catch (err) {
    console.error('Error al publicar comentario:', err);
    alert('Error al publicar comentario');
  }
}


async function eliminarComentario(itemId, commentObj) {
  try {
    const user = firebase.auth().currentUser;
    if(!user || user.email !== commentObj.author){
      alert('No tienes permiso para eliminar este comentario.');
      return;
    }

    await db.collection("items").doc(itemId).update({
      comments: firebase.firestore.FieldValue.arrayRemove(commentObj)
    });


    await cargarComentarios(itemId);
    alert('Comentario eliminado ✔');

  } catch (err) {
    console.error('Error al eliminar comentario:', err);
    alert('No se pudo eliminar el comentario.');
  }
}


async function publishNew(){

  const user = firebase.auth().currentUser;
  if(!user){
    alert("🔒 Para publicar necesitas iniciar sesión.");
    window.location.href = "login.html"; 
    return;
  }

  const title = $('#pub-title').value.trim();
  const desc = $('#pub-desc').value.trim();
  const category = $('#pub-category').value.trim();
  const price = parseFloat($('#pub-price').value) || 0;
  const image = $('#pub-image').value.trim();

  if(!title || !desc || !category || !image){
    alert("Completa todos los campos");
    return;
  }

  const newPost = {
    titulo: title,
    descripcion: desc,
    categoria: category,
    precio: price,
    imagen: image,
    autor: user.email,  
    estado: "pendiente",
    fecha: new Date().toISOString()
  };

  try{
    await db.collection("pendientes").add(newPost);
    alert("Enviado a revisión");

    $('#pub-title').value = "";
    $('#pub-desc').value = "";
    $('#pub-category').value = "";
    $('#pub-price').value = "";
    $('#pub-image').value = "";

  } catch(err){
    console.error(err);
    alert("Error al publicar");
  }
}


function renderPending(){
  const container = $('#pending-list');
  if(!container) return;

  container.innerHTML = "";
  if(!state.pending.length){
    container.innerHTML = '<div class="muted">No hay publicaciones pendientes.</div>';
    return;
  }

  state.pending.forEach((item, idx)=>{
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
      <img src="${item.imagen}" class="admin-img" />
      <div class="admin-info">
        <h3>${item.titulo}</h3>
        <p>${item.descripcion}</p>
        <p><strong>Categoría:</strong> ${item.categoria}</p>
        <p><strong>Precio:</strong> S/. ${item.precio}</p>
        <p><strong>Autor:</strong> ${item.autor}</p>
      </div>
      <div class="admin-actions">
        <button class="btn btn-primary" data-idx="${idx}" onclick="approve(event)">Aprobar</button>
        <button class="btn btn-ghost" data-idx="${idx}" onclick="reject(event)">Rechazar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function approve(e){
  const idx = e.currentTarget.dataset.idx;
  const item = state.pending.splice(idx,1)[0];

  state.items.unshift({
    id: 'i'+Date.now(),
    img: item.imagen,
    title: item.titulo,
    desc: item.descripcion,
    category: item.categoria,
    price: item.precio,
    author: item.autor,
    rating: 0
  });

  renderPending();
  renderGallery();
  renderFeatured();
  alert("Aprobado");
}

function reject(e){
  const idx = e.currentTarget.dataset.idx;
  state.pending.splice(idx,1);
  renderPending();
  alert("Rechazado");
}


document.addEventListener('DOMContentLoaded', ()=>{
  $$('.nav-link').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      showView(a.dataset.link);
    });
  });

  $('#btn-explore').addEventListener('click', ()=>showView('gallery'));

  const goGalleryBtn = $('#go-to-gallery');
if (goGalleryBtn) goGalleryBtn.addEventListener('click', ()=> showView('gallery'));

  $('#home-explore').addEventListener('click', ()=>showView('gallery'));

  $('#btn-cart').addEventListener('click', ()=>{
    localStorage.setItem('cart', JSON.stringify(state.cart));
    window.location.href = 'carrito.html';
  });

  $('#search-input') && $('#search-input').addEventListener('input', ()=> renderGallery());
  $('#filter-cat') && $('#filter-cat').addEventListener('change', ()=> renderGallery());
  $('#filter-sort') && $('#filter-sort').addEventListener('change', ()=> renderGallery());

  $('#add-to-cart') && $('#add-to-cart').addEventListener('click', ()=>{
    const id = $('#add-to-cart').dataset.id;
    if(id) addToCartFromBtn({currentTarget:{dataset:{id}}, stopPropagation(){ }});
  });


  const postBtn = $('#post-comment');
  if(postBtn){
    postBtn.addEventListener('click', postComentario);
  }

  $('#btn-publish').addEventListener('click', publishNew);

  $('#btn-checkout').addEventListener('click', ()=>{
    updatePaymentTotal();
    showView('payment');
  });

  $$('input[name="pay-method"]').forEach(radio=>{
    radio.addEventListener('change', ()=>{
      const val = $('input[name="pay-method"]:checked').value;
      $('#card-form').style.display = val==='card'?'block':'none';
      $('#yape-form').style.display = val==='yape'?'block':'none';
    });
  });

  $('#btn-pay').addEventListener('click', ()=>{
    alert("Pago simulado exitoso!");
    state.cart = [];
    renderCart();
    showView('confirm');
  });

  $('#btn-pay-cancel').addEventListener('click', ()=>showView('cart'));

  renderFeatured();
  renderGallery();
  renderCart();
  renderPending();
});


function updatePaymentTotal(){
  const total = state.cart.reduce((acc,it)=>acc+Number(it.price),0);
  $('#pay-total').textContent = formatMoney(total);
}


function updateDetailRating(avg) {
  const ratingEl = document.getElementById("detail-rating");
  if (!ratingEl) return;
  const avgNum = Number(avg) || 0;
  const rounded = Math.round(avgNum);
  ratingEl.innerHTML = "★".repeat(rounded) + "☆".repeat(5 - rounded) +
    ` <span style="color:#555;">(${avgNum.toFixed(1)})</span>`;
}


async function deleteMyItem(eOrId) {
  let id;

  if (eOrId?.currentTarget?.dataset?.id) {
    id = eOrId.currentTarget.dataset.id;
  }

  else if (typeof eOrId === "string") {
    id = eOrId;
  }

  else if (state.currentItem?.id) {
    id = state.currentItem.id;
  }

  if (!id) return alert("No se encontró ID para eliminar.");

  const item = state.items.find(i => i.id === id);
  if (!item) return alert("Publicación no encontrada.");

  const user = firebase.auth().currentUser;
  if (!user || user.email !== item.author) {
    return alert("No tienes permiso para eliminar esta publicación.");
  }

  const ok = confirm("¿Seguro que deseas eliminar esta publicación?");
  if (!ok) return;

  try {
    await db.collection("items").doc(id).delete();

    state.items = state.items.filter(it => it.id !== id);

    renderGallery();
    renderFeatured();

    alert("Publicación eliminada ✔");

    showView("gallery");

  } catch (err) {
    console.error(err);
    alert("Error al eliminar la publicación.");
  }
}

window.openDetail = openDetail;
window.openDetailFromBtn = openDetailFromBtn;
window.addToCartFromBtn = addToCartFromBtn;
window.removeFromCart = removeFromCart;
window.approve = approve;
window.reject = reject;
window.renderPending = renderPending;
