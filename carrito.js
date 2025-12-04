const cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartContainer = document.getElementById('cart-container');
const cartTotalEl = document.getElementById('cart-total');
const btnShowPayment = document.getElementById('btn-show-payment');
const paymentForm = document.getElementById('payment-form');
const btnClosePayment = document.getElementById('btn-close-payment');
const payMethod = document.getElementById('pay-method');
const paymentExtra = document.getElementById('payment-extra');
const btnPay = document.getElementById('btn-pay');
const btnBack = document.getElementById('btn-back');

function renderCart() {
  cartContainer.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;
    const div = document.createElement('div');
    div.className = 'carrito-item';
    div.innerHTML = `
      <img src="${item.img}" alt="${item.title}">
      <div class="item-info">
        <h3>${item.title}</h3>
        <p>${item.category}</p>
        <p>S/. ${item.price.toFixed(2)}</p>
      </div>
      <button class="remove-btn" data-index="${index}">Quitar</button>
    `;
    cartContainer.appendChild(div);
  });

  cartTotalEl.textContent = `Total: S/. ${total.toFixed(2)}`;


  document.querySelectorAll('.remove-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = e.currentTarget.dataset.index;
      cart.splice(idx,1);
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
    });
  });
}

btnShowPayment.addEventListener('click', ()=>{
  if(cart.length === 0) return alert('El carrito está vacío');
  paymentForm.style.display = 'block';
});

btnClosePayment.addEventListener('click', ()=>{
  paymentForm.style.display = 'none';
  paymentExtra.innerHTML = '';
  payMethod.value = '';
});

payMethod.addEventListener('change', ()=>{
  const metodo = payMethod.value;
  paymentExtra.innerHTML = '';

  if(metodo === 'Yape' || metodo === 'Plin'){
    const numero = "9"+Math.floor(10000000 + Math.random()*90000000);
    const codigo = Math.floor(100000000 + Math.random()*900000000);
    
  
    paymentExtra.innerHTML = `
      <p style="font-size:14px; color:#ccc;">Envía el pago al número: <strong style="color:#fff;">${numero}</strong></p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${numero}-${codigo}" 
           style="margin:10px auto; display:block; border:2px solid #00c0ff; border-radius:10px;" />
      
      <label>Ingresa el Código de Operación:</label>
      <input type="text" id="input-yape-code" placeholder="Ej: 123456" 
             style="background-color:#121212; color:#fff; border:1px solid #00c0ff; border-radius:6px; padding:8px; width:100%; margin-top:5px;" />
    `;

  } else if(metodo === 'Tarjeta'){
    
    paymentExtra.innerHTML = `
      <label>Número de tarjeta:</label>
      <input type="text" id="input-card" placeholder="0000 0000 0000 0000" maxlength="19"
             style="background-color:#121212; color:#fff; border:1px solid #00c0ff; border-radius:6px; padding:8px; width:100%; margin-top:5px; margin-bottom:10px;" />
      
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
           <label>Expira (MM/AA):</label>
           <input type="text" id="input-exp" placeholder="MM/AA" maxlength="5"
                  style="background-color:#121212; color:#fff; border:1px solid #00c0ff; border-radius:6px; padding:8px; width:100%; margin-top:5px;" />
        </div>
        <div style="flex:1;">
           <label>CVV:</label>
           <input type="password" id="input-cvv" placeholder="123" maxlength="3"
                  style="background-color:#121212; color:#fff; border:1px solid #00c0ff; border-radius:6px; padding:8px; width:100%; margin-top:5px;" />
        </div>
      </div>
    `;
  }
});

btnPay.addEventListener('click', ()=>{
  const metodo = payMethod.value;


  if(!metodo) return alert('⚠️ Selecciona un método de pago');


  if (metodo === 'Tarjeta') {
    const cardNum = document.getElementById('input-card')?.value;
    const cardExp = document.getElementById('input-exp')?.value;
    const cardCvv = document.getElementById('input-cvv')?.value;

    if (!cardNum || !cardExp || !cardCvv) {
      return alert('⚠️ Por favor completa todos los datos de la tarjeta.');
    }
    if (cardNum.length < 16) {
      return alert('⚠️ El número de tarjeta es muy corto.');
    }
  }

 
  if (metodo === 'Yape' || metodo === 'Plin') {
    const yapeCode = document.getElementById('input-yape-code')?.value;
    
    if (!yapeCode) {
      return alert('⚠️ Debes ingresar el código de operación para confirmar.');
    }
  }


  alert(`✅ ¡Pago exitoso con ${metodo}! Enviando pedido...`);
  

  cart.length = 0; 
  localStorage.removeItem('cart');
  renderCart();
  
  paymentForm.style.display = 'none';
  window.location.href = 'index.html'; 
});
btnBack.addEventListener('click', ()=> window.location.href='index.html');

renderCart();


