// ===== GOOGLE SHEETS INTEGRATION =====
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlm4-GNLc2YpNcESOSuzbras_vRr8r8w4fRBlsYILnfGXN0WW9fHNMt0g8l7gRZdg/exec";

// ฟังก์ชันส่งข้อมูลจากเครื่องไปเซฟใน Google Sheet
async function saveToGoogleSheet() {
    const payload = {
        action: 'saveAll',
        orders: JSON.parse(localStorage.getItem('orders')) || [],
        history: JSON.parse(localStorage.getItem('history')) || [],
        menu: JSON.parse(localStorage.getItem('menu')) || MENU
    };
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        console.log('Saved to Google Sheet successfully');
    } catch (e) {
        console.error('Error saving to Google Sheet:', e);
    }
}

// ฟังก์ชันดึงข้อมูลจาก Google Sheet มาอัปเดตในเครื่อง
async function loadFromGoogleSheet() {
    try {
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'loadAll' })
        });
        const data = await res.json();
        
        // เอาข้อมูลจาก Google Sheet มาใส่ใน localStorage และตัวแปรของแอป
        if (data.menu && data.menu.length > 0) {
            localStorage.setItem('mookrata_menu', JSON.stringify(data.menu));
            menuData = data.menu;
        }
        if (data.orders) {
            localStorage.setItem('mookrata_orders', JSON.stringify(data.orders));
            orders = data.orders;
        }
        if (data.history) {
            localStorage.setItem('mookrata_history', JSON.stringify(data.history));
            history_ = data.history;
        }
        
        // สั่งให้หน้าเว็บวาดหน้าจอใหม่ด้วยข้อมูลล่าสุดที่ดึงมา
        renderDashboard();
        updateBadge();
        
    } catch (e) {
        console.error('Error loading from Google Sheet:', e);
    }
}
// ===== DATA =====
const MENU = [
  {id:1,name:'หมูกระทะชุดใหญ่',price:250,cat:'เมนูหลัก',icon:'🍖',img:'mookata_hero.png'},
  {id:2,name:'หมูกระทะชุดจัมโบ้',price:300,cat:'เมนูหลัก',icon:'🔥',img:'mookata_hero.png'},
  {id:3,name:'ผัดหมี่โคราช',price:40,cat:'เมนูหลัก',icon:'🍜',img:'pad_mee_korat.png'},
  {id:4,name:'เนื้อหมูสามชั้นสไลด์',price:50,cat:'สั่งเพิ่ม',icon:'🥩',img:'meat_platter.png'},
  {id:5,name:'เนื้อหมู',price:50,cat:'สั่งเพิ่ม',icon:'🥩',img:'meat_platter.png'},
  {id:6,name:'ตับ',price:40,cat:'สั่งเพิ่ม',icon:'🫀',img:'meat_platter.png'},
  {id:7,name:'ปลาดอลลี่',price:60,cat:'สั่งเพิ่ม',icon:'🐟',img:'meat_platter.png'},
  {id:8,name:'ปูอัด',price:40,cat:'สั่งเพิ่ม',icon:'🦀',img:'meat_platter.png'},
  {id:9,name:'ปลาหมึกบั้ง',price:50,cat:'สั่งเพิ่ม',icon:'🦑',img:'meat_platter.png'},
  {id:10,name:'ไข่ไก่',price:10,cat:'สั่งเพิ่ม',icon:'🥚'},
  {id:11,name:'ชุดผัก',price:30,cat:'สั่งเพิ่ม',icon:'🥬'},
  {id:12,name:'น้ำเปล่าขวดเล็ก',price:15,cat:'เครื่องดื่ม',icon:'💧',img:'water_bottle.png'},
  {id:13,name:'น้ำเปล่าขวดใหญ่',price:20,cat:'เครื่องดื่ม',icon:'💧',img:'water_bottle.png'},
  {id:14,name:'โค้กขวดใหญ่',price:40,cat:'เครื่องดื่ม',icon:'🥤',img:'coke_bottle.png'},
  {id:15,name:'โค้กขวดเล็ก',price:20,cat:'เครื่องดื่ม',icon:'🥤',img:'coke_bottle.png'},
  {id:16,name:'เป๊ปซี่ขวดใหญ่',price:40,cat:'เครื่องดื่ม',icon:'🥤',img:'pepsi_bottle.png'},
  {id:17,name:'ช้าง',price:60,cat:'เครื่องดื่ม',icon:'🍺',img:'chang_beer.png'},
  {id:18,name:'ลีโอ',price:65,cat:'เครื่องดื่ม',icon:'🍺',img:'leo_beer.png'},
  {id:19,name:'สิงห์',price:70,cat:'เครื่องดื่ม',icon:'🍺',img:'singha_beer.png'},
  {id:20,name:'เหล้า',price:0,cat:'เครื่องดื่ม',icon:'🥃',customPrice:true},
];

let menuData = JSON.parse(localStorage.getItem('mookrata_menu')) || [...MENU];
let orders = JSON.parse(localStorage.getItem('mookrata_orders')) || [];
let history_ = JSON.parse(localStorage.getItem('mookrata_history')) || [];
let queueCounter = parseInt(localStorage.getItem('mookrata_qc')) || 1;
let currentOrderId = null;
let tempCart = {};
let customPriceItemId = null;
let nextMenuId = menuData.length ? Math.max(...menuData.map(m=>m.id)) + 1 : 100;
let currentFilter = 'all';
let promptPayId = localStorage.getItem('mookrata_promptpay_id') || '';

const TABLES = [
  {id:'1ใน',zone:'in'},{id:'2ใน',zone:'in'},{id:'3ใน',zone:'in'},
  {id:'4ใน',zone:'in'},{id:'5ใน',zone:'in'},{id:'6ใน',zone:'in'},
  {id:'1นอก',zone:'out'},{id:'2นอก',zone:'out'},{id:'3นอก',zone:'out'},
  {id:'4นอก',zone:'out'},{id:'5นอก',zone:'out'},
];

const ORDER_TYPE_LABELS = {
  'walkin': {label:'ซื้อกลับบ้าน', icon:'fa-store', cls:'ot-walkin'},
  'dinein': {label:'กินในร้าน', icon:'fa-chair', cls:'ot-dinein'},
  'phone-pickup': {label:'โทรสั่งมารับ', icon:'fa-phone', cls:'ot-phone-pickup'},
  'phone-reserve': {label:'โทรจองโต๊ะ', icon:'fa-calendar-check', cls:'ot-phone-reserve'},
};

function orderNeedsTable(type) {
  return type === 'dinein' || type === 'phone-reserve';
}

function orderNeedsGuests(type) {
  return type === 'dinein' || type === 'phone-reserve';
}

function getActiveOrderStatusText(type) {
  if (type === 'walkin') return 'ซื้อกลับบ้าน';
  if (type === 'phone-pickup') return 'รอมารับ';
  if (type === 'phone-reserve') return 'จองโต๊ะ';
  return 'กำลังทาน';
}

function getOrderMetaText(o) {
  const parts = [];
  if (o.table) parts.push('โต๊ะ ' + o.table);
  if (orderNeedsGuests(o.orderType)) parts.push(o.guests + ' คน');
  return parts.join(' • ');
}

function save() {
  localStorage.setItem('mookrata_menu', JSON.stringify(menuData));
  localStorage.setItem('mookrata_orders', JSON.stringify(orders));
  localStorage.setItem('mookrata_history', JSON.stringify(history_));
  localStorage.setItem('mookrata_qc', queueCounter);
  // 🌟 สั่งให้ส่งข้อมูลขึ้น Google Sheet ทันทีที่มีการบันทึกข้อมูลในแอป
  saveToGoogleSheet();
}

function savePromptPayId(value) {
  promptPayId = value.trim();
  localStorage.setItem('mookrata_promptpay_id', promptPayId);
}

// ===== NAVIGATION =====
function navigateTo(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('view-' + view);
  if (el) { el.classList.add('active'); }
  const nav = document.getElementById('nav-' + view);
  if (nav) nav.classList.add('active');
  if (view === 'dashboard') renderDashboard();
  if (view === 'queue') renderQueue();
  if (view === 'menu-manage') renderMenuManage();
  if (view === 'history') renderHistory();
  if (view === 'reports') renderReports();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.view));
});

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString('th-TH');
  const d = now.toLocaleDateString('th-TH', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const ce = document.getElementById('sidebar-clock');
  const de = document.getElementById('sidebar-date');
  if(ce) ce.textContent = t;
  if(de) de.textContent = d;
}
setInterval(updateClock, 1000);
updateClock();

// ===== TOAST =====
function showToast(msg, type='success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':type==='error'?'times-circle':'info-circle'}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 2500);
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('show');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  }
});

// ===== NEW ORDER =====
function showNewOrderModal() {
  document.getElementById('customer-name').value = '';
  document.getElementById('table-number').value = '';
  document.getElementById('num-guests').value = '2';
  // Reset order type
  document.querySelectorAll('.ot-option').forEach(o => o.classList.remove('active'));
  document.querySelector('.ot-option[data-type="walkin"]').classList.add('active');
  updateOrderFormVisibility('walkin');
  updateOccupiedTables();
  openModal('modal-new-order');
  setTimeout(() => document.getElementById('customer-name').focus(), 100);
}

function selectOrderType(el) {
  document.querySelectorAll('.ot-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  updateOrderFormVisibility(el.dataset.type);
}

function updateOrderFormVisibility(type) {
  const tg = document.getElementById('table-group');
  const gg = document.getElementById('guests-group');
  tg.style.display = orderNeedsTable(type) ? 'block' : 'none';
  gg.style.display = orderNeedsGuests(type) ? 'block' : 'none';
}

function getSelectedOrderType() {
  const active = document.querySelector('.ot-option.active');
  return active ? active.dataset.type : 'walkin';
}

function updateOccupiedTables() {
  const sel = document.getElementById('table-number');
  const occupiedTables = orders.filter(o => o.status === 'active' && o.table).map(o => o.table);
  Array.from(sel.options).forEach(opt => {
    if (opt.value) {
      const isOccupied = occupiedTables.includes(opt.value);
      opt.disabled = isOccupied;
      opt.textContent = opt.value.replace(/([0-9]+)(ใน|นอก)/, 'โต๊ะ $1 $2') + (isOccupied ? ' (ไม่ว่าง)' : '');
    }
  });
}

function createNewOrder() {
  const name = document.getElementById('customer-name').value.trim();
  const orderType = getSelectedOrderType();
  const table = orderNeedsTable(orderType) ? document.getElementById('table-number').value : '';
  const guests = orderNeedsGuests(orderType) ? (parseInt(document.getElementById('num-guests').value) || 1) : 0;
  if (!name) { showToast('กรุณากรอกชื่อลูกค้า','error'); return; }
  if (orderNeedsTable(orderType) && !table) {
    showToast('กรุณาเลือกโต๊ะ','error'); return;
  }
  const order = {
    id: Date.now(),
    queue: queueCounter++,
    name, table, guests, orderType,
    items: [],
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  save();
  closeModal('modal-new-order');
  showToast(`เพิ่มคิว #${order.queue} - ${name} (${ORDER_TYPE_LABELS[orderType].label})`);
  updateBadge();
  viewOrder(order.id);
  setTimeout(showMenuModal, 120);
}

// ===== RENDER DASHBOARD =====
function renderDashboard() {
  const active = orders.filter(o => o.status === 'active');
  const paid = history_.filter(h => h.status === 'paid');
  document.getElementById('stat-active').textContent = active.length;
  document.getElementById('stat-completed').textContent = paid.length;
  document.getElementById('stat-queue').textContent = active.length;

  // Revenue by order type
  const walkinRev = paid.filter(o => o.orderType === 'walkin').reduce((s,o) => s + getOrderTotal(o), 0);
  const dineinRev = paid.filter(o => o.orderType === 'dinein').reduce((s,o) => s + getOrderTotal(o), 0);
  const phoneRev = paid.filter(o => o.orderType === 'phone-pickup').reduce((s,o) => s + getOrderTotal(o), 0);
  const reserveRev = paid.filter(o => o.orderType === 'phone-reserve').reduce((s,o) => s + getOrderTotal(o), 0);
  const totalRev = walkinRev + dineinRev + phoneRev + reserveRev;

  const e = id => document.getElementById(id);
  if(e('rv-walkin')) e('rv-walkin').textContent = '฿' + walkinRev.toLocaleString();
  if(e('rv-dinein')) e('rv-dinein').textContent = '฿' + dineinRev.toLocaleString();
  if(e('rv-phone')) e('rv-phone').textContent = '฿' + phoneRev.toLocaleString();
  if(e('rv-reserve')) e('rv-reserve').textContent = '฿' + reserveRev.toLocaleString();
  if(e('rv-total')) e('rv-total').textContent = '฿' + totalRev.toLocaleString();

  renderTableMap();
  renderFilteredOrders();
}

function renderTableMap() {
  const el = document.getElementById('tables-all');
  if (!el) return;
  const active = orders.filter(o => o.status === 'active');
  el.innerHTML = TABLES.map(t => {
    const order = active.find(o => o.table === t.id);
    const isOccupied = order && order.orderType !== 'phone-reserve';
    const isReserved = order && order.orderType === 'phone-reserve';
    const cls = isOccupied ? 'occupied' : (isReserved ? 'reserved' : '');
    const dotCls = isOccupied ? 'busy' : (isReserved ? 'rsv' : 'free');
    const statusText = isOccupied ? 'กำลังใช้' : (isReserved ? 'จองแล้ว' : 'ว่าง');
    const custName = order ? order.name : '';
    const onclick = order ? `onclick="viewOrder(${order.id})"` : '';
    return `<div class="table-cell ${cls}" ${onclick}>
      <div class="tc-dot ${dotCls}"></div>
      <div class="tc-name">${t.id}</div>
      <div class="tc-status">${statusText}</div>
      ${custName ? `<div class="tc-customer">${custName}</div>` : ''}
    </div>`;
  }).join('');
}

function filterOrders(el, filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderFilteredOrders();
}

function renderFilteredOrders() {
  let active = orders.filter(o => o.status === 'active');
  if (currentFilter !== 'all') {
    active = active.filter(o => o.orderType === currentFilter);
  }
  const grid = document.getElementById('active-orders-grid');
  if (!active.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><p>ยังไม่มีออเดอร์</p><button class="btn btn-primary" onclick="showNewOrderModal()">เริ่มรับออเดอร์</button></div>';
    return;
  }
  grid.innerHTML = active.map(o => {
    const total = getOrderTotal(o);
    const preview = o.items.slice(0, 3).map(i => i.name).join(', ') || 'ยังไม่ได้สั่ง';
    const ot = ORDER_TYPE_LABELS[o.orderType || 'walkin'];
    const metaText = getOrderMetaText(o) || ORDER_TYPE_LABELS[o.orderType || 'walkin'].label;
    return `<div class="order-card" onclick="viewOrder(${o.id})">
      <div class="order-card-header">
        <div class="queue-num">${o.queue}</div>
        <div class="customer-info">
          <h4>${o.name}</h4>
          <p>${metaText}</p>
        </div>
        <span class="ot-badge ${ot.cls}"><i class="fas ${ot.icon}"></i> ${ot.label}</span>
      </div>
      <div class="order-card-body"><div class="items-preview">${preview}</div></div>
      <div class="order-card-footer">
        <span class="total">฿${total.toLocaleString()}</span>
        <span class="status status-active">${getActiveOrderStatusText(o.orderType)}</span>
      </div>
    </div>`;
  }).join('');
}

function getOrderTotal(o) {
  return o.items.reduce((s, i) => s + (i.price * i.qty), 0);
}

function updateBadge() {
  const b = document.getElementById('queue-badge');
  const c = orders.filter(o => o.status === 'active').length;
  b.textContent = c;
  b.style.display = c ? 'inline' : 'none';
}

// ===== QUEUE =====
function renderQueue() {
  const list = document.getElementById('queue-list');
  const active = orders.filter(o => o.status === 'active');
  if (!active.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>ยังไม่มีคิว</p></div>';
    return;
  }
  list.innerHTML = active.map(o => {
    const total = getOrderTotal(o);
    const t = new Date(o.createdAt).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
    const ot = ORDER_TYPE_LABELS[o.orderType || 'walkin'];
    return `<div class="queue-item" onclick="viewOrder(${o.id})">
      <div class="q-number">${o.queue}</div>
      <div class="q-info">
        <h4>${o.name} <span class="ot-badge ${ot.cls}"><i class="fas ${ot.icon}"></i> ${ot.label}</span></h4>
        <p>${[getOrderMetaText(o), 'เวลา ' + t, o.items.length + ' รายการ'].filter(Boolean).join(' • ')}</p>
      </div>
      <div class="q-total">฿${total.toLocaleString()}</div>
    </div>`;
  }).join('');
}

// ===== VIEW ORDER DETAIL =====
function viewOrder(id) {
  currentOrderId = id;
  const o = orders.find(x => x.id === id);
  if (!o) return;
  const ot = ORDER_TYPE_LABELS[o.orderType || 'walkin'];
  document.getElementById('order-detail-title').textContent = `ออเดอร์ #${o.queue} - ${o.name}`;
  const metaText = getOrderMetaText(o);
  document.getElementById('order-detail-subtitle').innerHTML = `${metaText ? metaText + ' • ' : ''}<span class="ot-badge ${ot.cls}"><i class="fas ${ot.icon}"></i> ${ot.label}</span>`;
  // Restore button visibility for active orders
  document.getElementById('btn-add-items').style.display='';
  document.getElementById('btn-cancel-order').style.display='';
  document.getElementById('btn-qr-pay').style.display='';
  navigateTo('order-detail');
  renderOrderItems();
}

function renderOrderItems() {
  const o = orders.find(x => x.id === currentOrderId);
  if (!o) return;
  const list = document.getElementById('order-items-list');
  if (!o.items.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-basket"></i><p>ยังไม่มีรายการ</p><button class="btn btn-primary" onclick="showMenuModal()"><i class="fas fa-plus"></i> เพิ่มเมนู</button></div>';
  } else {
    list.innerHTML = '<h3 style="margin-bottom:12px"><i class="fas fa-list" style="color:var(--orange)"></i> รายการอาหาร</h3>' +
      o.items.map((item, idx) => `<div class="order-item-row">
        <span class="item-name">${item.name}</span>
        <div class="item-qty">
          <button onclick="changeQty(${idx},-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${idx},1)">+</button>
        </div>
        <span class="item-price">฿${(item.price*item.qty).toLocaleString()}</span>
        <span class="item-remove" onclick="removeItem(${idx})"><i class="fas fa-trash"></i></span>
      </div>`).join('');
  }
  const total = getOrderTotal(o);
  const panel = document.getElementById('order-summary-panel');
  panel.innerHTML = `
    <h3 style="margin-bottom:12px"><i class="fas fa-calculator" style="color:var(--orange)"></i> สรุปรายการ</h3>
    ${o.items.map(i => `<div class="summary-row"><span>${i.name} x${i.qty}</span><span>฿${(i.price*i.qty).toLocaleString()}</span></div>`).join('')}
    <div class="summary-row total-row"><span>รวมทั้งหมด</span><span>฿${total.toLocaleString()}</span></div>
    <button class="btn btn-success btn-block" style="margin-top:16px" onclick="showMenuModal()"><i class="fas fa-plus"></i> เพิ่มเมนู</button>
    <button class="btn btn-warning btn-block" style="margin-top:8px" onclick="showQRPayment()"><i class="fas fa-qrcode"></i> QR ชำระเงิน</button>
    <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="showReceipt()"><i class="fas fa-receipt"></i> พิมพ์ใบเสร็จ</button>`;
}

function changeQty(idx, delta) {
  const o = orders.find(x => x.id === currentOrderId);
  if (!o) return;
  o.items[idx].qty += delta;
  if (o.items[idx].qty <= 0) o.items.splice(idx, 1);
  save(); renderOrderItems();
}

function removeItem(idx) {
  const o = orders.find(x => x.id === currentOrderId);
  if (!o) return;
  o.items.splice(idx, 1);
  save(); renderOrderItems();
  showToast('ลบรายการแล้ว','info');
}

function cancelOrder() {
  if (!confirm('ยืนยันยกเลิกออเดอร์นี้?')) return;
  const o = orders.find(x => x.id === currentOrderId);
  if (!o) return;
  o.status = 'cancelled';
  history_.push(o);
  orders = orders.filter(x => x.id !== currentOrderId);
  save(); updateBadge();
  showToast('ยกเลิกออเดอร์แล้ว','error');
  navigateTo('dashboard');
}

// ===== MENU MODAL =====
function showMenuModal() {
  tempCart = {};
  renderMenuTabs();
  openModal('modal-menu');
}

function renderMenuTabs() {
  const cats = [...new Set(menuData.map(m => m.cat))];
  const tabs = document.getElementById('menu-tabs');
  tabs.innerHTML = cats.map((c, i) => `<div class="menu-tab${i===0?' active':''}" onclick="selectMenuTab(this,'${c}')">${c}</div>`).join('');
  renderMenuGrid(cats[0]);
}

function selectMenuTab(el, cat) {
  document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderMenuGrid(cat);
}

function renderMenuGrid(cat) {
  const items = menuData.filter(m => m.cat === cat);
  const grid = document.getElementById('menu-grid');
  grid.innerHTML = items.map(m => {
    const qty = tempCart[m.id]?.qty || 0;
    const sel = qty > 0 ? ' selected' : '';
    const imgHtml = m.img ? `<img src="${m.img}" alt="${m.name}">` : `<div class="mi-icon">${m.icon||'🍽️'}</div>`;
    const priceText = m.customPrice ? 'ใส่ราคา' : `฿${m.price}`;
    return `<div class="menu-item-card${sel}" id="mc-${m.id}">
      ${imgHtml}
      <div class="mi-name">${m.name}</div>
      <div class="mi-price">${priceText}</div>
      <div class="mi-qty">
        <button onclick="event.stopPropagation();menuQty(${m.id},-1)">−</button>
        <span>${qty}</span>
        <button onclick="event.stopPropagation();menuQty(${m.id},1)">+</button>
      </div>
    </div>`;
  }).join('');
  updateCartSummary();
}

function menuQty(id, delta) {
  const m = menuData.find(x => x.id === id);
  if (!m) return;
  if (m.customPrice && delta > 0 && !tempCart[id]) {
    customPriceItemId = id;
    document.getElementById('custom-price-title').textContent = m.name + ' - ใส่ราคา';
    document.getElementById('custom-price-input').value = '';
    openModal('modal-custom-price');
    return;
  }
  if (!tempCart[id]) tempCart[id] = {id:m.id,name:m.name,price:m.customPrice?0:m.price,qty:0};
  tempCart[id].qty += delta;
  if (tempCart[id].qty <= 0) delete tempCart[id];
  const card = document.getElementById('mc-'+id);
  if(card) {
    const qty = tempCart[id]?.qty || 0;
    card.classList.toggle('selected', qty > 0);
    card.querySelector('.mi-qty span').textContent = qty;
  }
  updateCartSummary();
}

function confirmCustomPrice() {
  const price = parseInt(document.getElementById('custom-price-input').value);
  if (!price || price <= 0) { showToast('กรุณาใส่ราคา','error'); return; }
  const m = menuData.find(x => x.id === customPriceItemId);
  if (!m) return;
  tempCart[m.id] = {id:m.id,name:m.name,price,qty:1};
  closeModal('modal-custom-price');
  const card = document.getElementById('mc-'+m.id);
  if(card) {
    card.classList.add('selected');
    card.querySelector('.mi-qty span').textContent = '1';
  }
  updateCartSummary();
}

function updateCartSummary() {
  const items = Object.values(tempCart);
  document.getElementById('cart-count').textContent = items.reduce((s,i)=>s+i.qty,0);
  document.getElementById('cart-total').textContent = '฿'+items.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString();
}

function confirmMenuSelection() {
  const o = orders.find(x => x.id === currentOrderId);
  if (!o) return;
  Object.values(tempCart).forEach(ci => {
    const existing = o.items.find(i => i.id === ci.id && i.price === ci.price);
    if (existing) existing.qty += ci.qty;
    else o.items.push({...ci});
  });
  save();
  closeModal('modal-menu');
  renderOrderItems();
  showToast('เพิ่มเมนูแล้ว');
}

// ===== PROMPTPAY QR PAYMENT =====
function emvField(id, value) {
  return id + String(value.length).padStart(2, '0') + value;
}

function crc16Ccitt(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function normalizePromptPayTarget(target) {
  const digits = target.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) {
    return {type: '01', value: '0066' + digits.slice(1)};
  }
  if (/^66\d{9}$/.test(digits)) {
    return {type: '01', value: '00' + digits};
  }
  if (/^\d{13}$/.test(digits)) {
    return {type: '02', value: digits};
  }
  return null;
}

function generatePromptPayPayload(target, amount) {
  const normalized = normalizePromptPayTarget(target);
  if (!normalized) return null;
  const merchantInfo = emvField('00', 'A000000677010111') + emvField(normalized.type, normalized.value);
  let payload = '';
  payload += emvField('00', '01');
  payload += emvField('01', '12');
  payload += emvField('29', merchantInfo);
  payload += emvField('52', '0000');
  payload += emvField('53', '764');
  payload += emvField('54', Number(amount).toFixed(2));
  payload += emvField('58', 'TH');
  payload += '6304';
  return payload + crc16Ccitt(payload);
}

function renderPromptPayQRCode() {
  const o = orders.find(x => x.id === currentOrderId);
  const container = document.getElementById('qr-code-container');
  const input = document.getElementById('promptpay-id');
  if (!o || !container || !input) return;
  savePromptPayId(input.value);
  const payload = generatePromptPayPayload(promptPayId, getOrderTotal(o));
  container.innerHTML = '';
  if (!payload) {
    container.innerHTML = '<p class="qr-error">กรอกเบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก</p>';
    return;
  }
  try {
    const qr = qrcode(0, 'M');
    qr.addData(payload);
    qr.make();
    container.innerHTML = qr.createImgTag(5);
  } catch(e) {
    container.innerHTML = '<p class="qr-error">ไม่สามารถสร้าง PromptPay QR Code ได้</p>';
  }
}

function showQRPayment() {
  const o = orders.find(x => x.id === currentOrderId);
  if (!o || !o.items.length) { showToast('ยังไม่มีรายการอาหาร','error'); return; }
  const total = getOrderTotal(o);
  document.getElementById('qr-amount').textContent = '฿' + total.toLocaleString();
  const promptPayInput = document.getElementById('promptpay-id');
  if (promptPayInput) promptPayInput.value = promptPayId;
  renderPromptPayQRCode();
  openModal('modal-qr-payment');
}

function markAsPaid() {
  const o = orders.find(x => x.id === currentOrderId);
  if (!o) return;
  o.status = 'paid';
  o.paidAt = new Date().toISOString();
  history_.push(o);
  orders = orders.filter(x => x.id !== currentOrderId);
  save(); updateBadge();
  closeModal('modal-qr-payment');
  showToast('ชำระเงินเรียบร้อย! ขอบคุณครับ 🎉');
  navigateTo('dashboard');
}

// ===== RECEIPT =====
function showReceipt() {
  const o = orders.find(x => x.id === currentOrderId) || history_.find(x => x.id === currentOrderId);
  if (!o) return;
  const total = getOrderTotal(o);
  const now = new Date();
  document.getElementById('receipt-content').innerHTML = `
    <div class="r-header">
      <h2>🔥 ร้านหมูกระทะแม่พร 🔥</h2>
      <p>ใบเสร็จรับเงิน</p>
      <p>วันที่: ${now.toLocaleDateString('th-TH')} เวลา: ${now.toLocaleTimeString('th-TH')}</p>
      <p>คิวที่: ${o.queue} | ลูกค้า: ${o.name}${o.table?' | โต๊ะ: '+o.table:''}</p>
    </div>
    <div class="r-items">
      ${o.items.map(i=>`<div class="r-item"><span>${i.name} x${i.qty}</span><span>฿${(i.price*i.qty).toLocaleString()}</span></div>`).join('')}
    </div>
    <div class="r-line"></div>
    <div class="r-total"><span>รวมทั้งหมด</span><span>฿${total.toLocaleString()}</span></div>
    <div class="r-footer">
      <p>ขอบคุณที่ใช้บริการ ❤️</p>
      <p>ร้านหมูกระทะแม่พร</p>
    </div>`;
  openModal('modal-receipt');
}

function printReceipt() { window.print(); }

// ===== MENU MANAGEMENT =====
function renderMenuManage() {
  const cats = [...new Set(menuData.map(m => m.cat))];
  const el = document.getElementById('menu-categories-view');
  el.innerHTML = cats.map(cat => {
    const items = menuData.filter(m => m.cat === cat);
    return `<div class="menu-cat-section">
      <div class="menu-cat-header"><span>${cat} (${items.length})</span></div>
      <div class="menu-cat-items">
        ${items.map(m => `<div class="menu-manage-item">
          <span class="mmi-name">${m.icon||''} ${m.name}</span>
          <span class="mmi-price">${m.customPrice?'ใส่ราคาเอง':'฿'+m.price}</span>
          <button class="btn btn-danger btn-sm" onclick="deleteMenuItem(${m.id})"><i class="fas fa-trash"></i></button>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function showAddMenuItemModal() { openModal('modal-add-menu'); }

function addNewMenuItem() {
  const name = document.getElementById('new-menu-name').value.trim();
  const price = parseInt(document.getElementById('new-menu-price').value);
  const cat = document.getElementById('new-menu-category').value;
  if (!name) { showToast('กรุณากรอกชื่อเมนู','error'); return; }
  if (!price || price <= 0) { showToast('กรุณากรอกราคา','error'); return; }
  menuData.push({id:nextMenuId++,name,price,cat,icon:'🍽️'});
  save(); closeModal('modal-add-menu');
  renderMenuManage();
  showToast('เพิ่มเมนู '+name+' แล้ว');
  document.getElementById('new-menu-name').value='';
  document.getElementById('new-menu-price').value='';
}

function deleteMenuItem(id) {
  if (!confirm('ลบเมนูนี้?')) return;
  menuData = menuData.filter(m => m.id !== id);
  save(); renderMenuManage();
  showToast('ลบเมนูแล้ว','info');
}

// ===== HISTORY =====
function getDateStr(d) {
  const dt = new Date(d);
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
}
function getTodayStr() { return getDateStr(new Date()); }

function renderHistory() {
  const dateInput = document.getElementById('history-date');
  if (!dateInput.value) dateInput.value = getTodayStr();
  const sel = dateInput.value;
  const filtered = history_.filter(o => getDateStr(o.createdAt) === sel);
  const paid = filtered.filter(o => o.status === 'paid');
  const totalRev = paid.reduce((s,o) => s + getOrderTotal(o), 0);
  const inRev = paid.filter(o => o.table && o.table.includes('ใน')).reduce((s,o) => s + getOrderTotal(o), 0);
  const outRev = paid.filter(o => o.table && o.table.includes('นอก')).reduce((s,o) => s + getOrderTotal(o), 0);
  document.getElementById('history-summary').innerHTML = `
    <div class="hs-card hs-orders"><span class="hs-value">${paid.length}</span><span class="hs-label">ออเดอร์</span></div>
    <div class="hs-card hs-indoor"><span class="hs-value">฿${inRev.toLocaleString()}</span><span class="hs-label">ในร้าน</span></div>
    <div class="hs-card hs-outdoor"><span class="hs-value">฿${outRev.toLocaleString()}</span><span class="hs-label">นอกร้าน</span></div>
    <div class="hs-card hs-total"><span class="hs-value">฿${totalRev.toLocaleString()}</span><span class="hs-label">รวม</span></div>`;
  const list = document.getElementById('history-list');
  if (!filtered.length) { list.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>ไม่มีออเดอร์ในวันนี้</p></div>'; return; }
  list.innerHTML = filtered.slice().reverse().map(o => {
    const total = getOrderTotal(o);
    const sc = o.status==='paid'?'status-paid':'status-cancelled';
    const st = o.status==='paid'?'ชำระแล้ว':'ยกเลิก';
    const ot = ORDER_TYPE_LABELS[o.orderType||'walkin'];
    return `<div class="history-item" onclick="viewHistoryOrder(${o.id})">
      <div class="q-number" style="background:${o.status==='paid'?'var(--green)':'var(--red)'}">${o.queue}</div>
      <div class="h-info"><h4>${o.name} <span class="ot-badge ${ot.cls}"><i class="fas ${ot.icon}"></i> ${ot.label}</span></h4><p>${new Date(o.createdAt).toLocaleString('th-TH')} • ${o.table?'โต๊ะ '+o.table+' • ':''}${o.items.length} รายการ</p></div>
      <div class="h-total">฿${total.toLocaleString()}</div>
      <span class="h-status ${sc}">${st}</span></div>`;
  }).join('');
}

function showAllHistory() {
  document.getElementById('history-date').value = '';
  const paid = history_.filter(o => o.status === 'paid');
  const totalRev = paid.reduce((s,o) => s + getOrderTotal(o), 0);
  document.getElementById('history-summary').innerHTML = `
    <div class="hs-card hs-orders"><span class="hs-value">${paid.length}</span><span class="hs-label">ทั้งหมด</span></div>
    <div class="hs-card hs-indoor"><span class="hs-value">-</span><span class="hs-label">ทุกวัน</span></div>
    <div class="hs-card hs-outdoor"><span class="hs-value">-</span><span class="hs-label">ทุกวัน</span></div>
    <div class="hs-card hs-total"><span class="hs-value">฿${totalRev.toLocaleString()}</span><span class="hs-label">รวมทุกวัน</span></div>`;
  const list = document.getElementById('history-list');
  if (!history_.length) { list.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>ยังไม่มีประวัติ</p></div>'; return; }
  list.innerHTML = history_.slice().reverse().map(o => {
    const total = getOrderTotal(o);
    const sc = o.status==='paid'?'status-paid':'status-cancelled';
    const st = o.status==='paid'?'ชำระแล้ว':'ยกเลิก';
    const ot = ORDER_TYPE_LABELS[o.orderType||'walkin'];
    return `<div class="history-item" onclick="viewHistoryOrder(${o.id})">
      <div class="q-number" style="background:${o.status==='paid'?'var(--green)':'var(--red)'}">${o.queue}</div>
      <div class="h-info"><h4>${o.name} <span class="ot-badge ${ot.cls}"><i class="fas ${ot.icon}"></i> ${ot.label}</span></h4><p>${new Date(o.createdAt).toLocaleString('th-TH')} • ${o.items.length} รายการ</p></div>
      <div class="h-total">฿${total.toLocaleString()}</div>
      <span class="h-status ${sc}">${st}</span></div>`;
  }).join('');
}

function viewHistoryOrder(id) {
  currentOrderId = id;
  const o = history_.find(x => x.id === id);
  if (!o) return;
  const ot = ORDER_TYPE_LABELS[o.orderType||'walkin'];
  document.getElementById('order-detail-title').textContent = `ออเดอร์ #${o.queue} - ${o.name}`;
  document.getElementById('order-detail-subtitle').innerHTML = (o.status==='paid'?'✅ ชำระแล้ว':'❌ ยกเลิก')+` • <span class="ot-badge ${ot.cls}"><i class="fas ${ot.icon}"></i> ${ot.label}</span>`;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-order-detail').classList.add('active');
  document.getElementById('btn-add-items').style.display='none';
  document.getElementById('btn-cancel-order').style.display='none';
  document.getElementById('btn-qr-pay').style.display='none';
  renderOrderItems();
}

function clearHistory() {
  if (!confirm('ล้างประวัติทั้งหมด?')) return;
  history_ = []; save(); renderHistory();
  showToast('ล้างประวัติแล้ว','info');
}

// ===== REPORTS =====
let chartD=null,chartT=null,chartZ=null;

function renderReports() {
  const f=document.getElementById('report-from'), t=document.getElementById('report-to');
  if(!f.value){const d=new Date();d.setDate(d.getDate()-6);f.value=getDateStr(d);}
  if(!t.value) t.value=getTodayStr();
  generateReport();
}

function generateReport() {
  const from=document.getElementById('report-from').value, to=document.getElementById('report-to').value;
  if(!from||!to) return;
  const paid=history_.filter(o=>o.status==='paid');
  const inR=paid.filter(o=>{const d=getDateStr(o.createdAt);return d>=from&&d<=to;});
  const totalRev=inR.reduce((s,o)=>s+getOrderTotal(o),0);
  const days=new Set(inR.map(o=>getDateStr(o.createdAt))).size||1;
  const avg=Math.round(totalRev/days);
  const best=getBestSeller(inR);
  document.getElementById('report-cards').innerHTML=`
    <div class="rpt-card rpt-orders"><div class="rpt-icon">📦</div><span class="rpt-value">${inR.length}</span><span class="rpt-label">ออเดอร์</span></div>
    <div class="rpt-card rpt-total"><div class="rpt-icon">💰</div><span class="rpt-value">฿${totalRev.toLocaleString()}</span><span class="rpt-label">รายได้รวม</span></div>
    <div class="rpt-card rpt-avg"><div class="rpt-icon">📊</div><span class="rpt-value">฿${avg.toLocaleString()}</span><span class="rpt-label">เฉลี่ย/วัน</span></div>
    <div class="rpt-card"><div class="rpt-icon">🍖</div><span class="rpt-value" style="color:var(--orange)">${best}</span><span class="rpt-label">ขายดี</span></div>`;
  drawDailyChart(from,to,paid);
  drawTypesChart(inR);
  drawZoneChart(inR);
}

function getBestSeller(orders){
  const c={};orders.forEach(o=>o.items.forEach(i=>{c[i.name]=(c[i.name]||0)+i.qty;}));
  const s=Object.entries(c).sort((a,b)=>b[1]-a[1]);return s.length?s[0][0]:'-';
}

function getDatesRange(from,to){
  const dates=[];let cur=new Date(from+'T00:00:00');const end=new Date(to+'T00:00:00');
  while(cur<=end){dates.push(getDateStr(cur));cur.setDate(cur.getDate()+1);}return dates;
}

function drawDailyChart(from,to,paid){
  const dates=getDatesRange(from,to);
  const data=dates.map(d=>paid.filter(o=>getDateStr(o.createdAt)===d).reduce((s,o)=>s+getOrderTotal(o),0));
  const labels=dates.map(d=>{const dt=new Date(d+'T00:00:00');return dt.getDate()+'/'+(dt.getMonth()+1);});
  if(chartD) chartD.destroy();
  chartD=new Chart(document.getElementById('chart-daily-revenue'),{
    type:'bar',data:{labels,datasets:[{label:'รายได้ (บาท)',data,backgroundColor:'rgba(232,58,20,0.6)',borderColor:'#e83a14',borderWidth:2,borderRadius:6}]},
    options:{responsive:true,plugins:{legend:{labels:{color:'#2d1f14'}}},scales:{x:{ticks:{color:'#6b5544'},grid:{color:'rgba(0,0,0,0.06)'}},y:{ticks:{color:'#6b5544',callback:v=>'฿'+v.toLocaleString()},grid:{color:'rgba(0,0,0,0.06)'}}}}
  });
}

function drawTypesChart(orders){
  const t={'walkin':0,'dinein':0,'phone-pickup':0,'phone-reserve':0};
  orders.forEach(o=>{t[o.orderType||'walkin']++;});
  if(chartT) chartT.destroy();
  chartT=new Chart(document.getElementById('chart-order-types'),{
    type:'doughnut',data:{labels:['ซื้อกลับบ้าน','กินในร้าน','โทรสั่งมารับ','โทรจองโต๊ะ'],datasets:[{data:[t['walkin'],t['dinein'],t['phone-pickup'],t['phone-reserve']],backgroundColor:['#2e7d32','#f9a825','#1976d2','#7b1fa2'],borderColor:'#ffffff',borderWidth:2}]},
    options:{responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#2d1f14',padding:16}}}}
  });
}

function drawZoneChart(orders){
  const w=orders.filter(o=>o.orderType==='walkin').reduce((s,o)=>s+getOrderTotal(o),0);
  const d=orders.filter(o=>o.orderType==='dinein').reduce((s,o)=>s+getOrderTotal(o),0);
  const ph=orders.filter(o=>o.orderType==='phone-pickup').reduce((s,o)=>s+getOrderTotal(o),0);
  const r=orders.filter(o=>o.orderType==='phone-reserve').reduce((s,o)=>s+getOrderTotal(o),0);
  if(chartZ) chartZ.destroy();
  chartZ=new Chart(document.getElementById('chart-zone-revenue'),{
    type:'bar',data:{labels:['ซื้อกลับบ้าน','กินในร้าน','โทรสั่งมารับ','โทรจองโต๊ะ'],datasets:[{label:'รายได้ (บาท)',data:[w,d,ph,r],backgroundColor:['rgba(46,125,50,0.7)','rgba(249,168,37,0.7)','rgba(25,118,210,0.7)','rgba(123,31,162,0.7)'],borderColor:['#2e7d32','#f9a825','#1976d2','#7b1fa2'],borderWidth:2,borderRadius:8}]},
    options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#6b5544',callback:v=>'฿'+v.toLocaleString()},grid:{color:'rgba(0,0,0,0.06)'}},y:{ticks:{color:'#6b5544'},grid:{color:'rgba(0,0,0,0.06)'}}}}
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  updateBadge();
// 🌟 ดึงข้อมูลล่าสุดจาก Google Sheet ทันทีที่เปิดแอปหรือรีเฟรชหน้าเว็บ
  loadFromGoogleSheet();
});
