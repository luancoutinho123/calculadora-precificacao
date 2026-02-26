/* cart.js - Coutinho Açaí (padronizado)
   - Carrinho flutuante aparece apenas com itens
   - Cupom sequencial (contador)
   - Cupom 80mm: formato igual ao seu modelo
*/

const CART_KEY = "cart_v1";
const USER_KEY = "user_v1";
const TEMP_KEY = "temp_item_v1";

// Cupom contador
const COUPON_KEY = "coupon_counter_v1";
const CURRENT_COUPON_KEY = "current_coupon_v1";
const CURRENT_DT_KEY = "current_dt_v1"; // data/hora do pedido atual

// Config do cardápio (admin)
const CONFIG_KEY = "menu_config_v1";

// ---------- Helpers ----------
function safeJsonParse(value, fallback) {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
}

function formatBRL(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTimeBR(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

// linha com pontinhos tipo: Item..............................R$ 14,99
function dotLine(left, right, width = 40) {
  const L = String(left || "");
  const R = String(right || "");
  const dotsCount = Math.max(1, width - L.length - R.length);
  return L + ".".repeat(dotsCount) + R;
}

// quebra texto em linhas no tamanho do cupom
function wrapText(text, maxLen = 32) {
  const s = String(text || "").trim();
  if (!s) return [];
  const out = [];
  let line = "";

  // quebra por espaços (mantém pipes no texto)
  const parts = s.split(" ");
  for (const part of parts) {
    if (!line) {
      line = part;
      continue;
    }
    if ((line + " " + part).length <= maxLen) {
      line += " " + part;
    } else {
      out.push(line);
      line = part;
    }
  }
  if (line) out.push(line);
  return out;
}

// ---------- Config padrão (taxa) ----------
const DEFAULT_CONFIG = {
  deliveryFee: 1.00
};

function getMenuConfig() {
  const cfg = safeJsonParse(localStorage.getItem(CONFIG_KEY), null);
  if (!cfg) return { ...DEFAULT_CONFIG };
  const merged = { ...DEFAULT_CONFIG };
  if (typeof cfg.deliveryFee === "number") merged.deliveryFee = cfg.deliveryFee;
  return merged;
}
function saveMenuConfig(cfg) { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }
function resetMenuConfig() { localStorage.removeItem(CONFIG_KEY); }

// ---------- Estado ----------
function getCart() { return safeJsonParse(localStorage.getItem(CART_KEY), []); }
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function getUser() { return safeJsonParse(localStorage.getItem(USER_KEY), null); }
function saveUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }

function getTempItem() { return safeJsonParse(localStorage.getItem(TEMP_KEY), null); }
function saveTempItem(item) { localStorage.setItem(TEMP_KEY, JSON.stringify(item)); }
function clearTempItem() { localStorage.removeItem(TEMP_KEY); }

// ---------- Cupom contador ----------
function getLastCouponNumber() {
  const n = Number(localStorage.getItem(COUPON_KEY) || "0");
  return Number.isFinite(n) ? n : 0;
}
function nextCouponNumber() {
  const next = getLastCouponNumber() + 1;
  localStorage.setItem(COUPON_KEY, String(next));
  return next;
}
function setCouponNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return false;
  localStorage.setItem(COUPON_KEY, String(Math.floor(num)));
  return true;
}
function setCurrentCoupon(n) { localStorage.setItem(CURRENT_COUPON_KEY, String(n)); }
function getCurrentCoupon() {
  const n = Number(localStorage.getItem(CURRENT_COUPON_KEY) || "0");
  return Number.isFinite(n) ? n : 0;
}
function clearCurrentCoupon() { localStorage.removeItem(CURRENT_COUPON_KEY); }

function setCurrentDateTime(isoString) { localStorage.setItem(CURRENT_DT_KEY, String(isoString || "")); }
function getCurrentDateTime() {
  const s = localStorage.getItem(CURRENT_DT_KEY);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function clearCurrentDateTime() { localStorage.removeItem(CURRENT_DT_KEY); }

// ---------- Cupom 80mm (FORMATO IGUAL AO SEU MODELO) ----------
function buildReceiptText({ paymentMethod = "", troco = "" } = {}) {
  const cfg = getMenuConfig();
  const cart = getCart();
  const user = getUser();

  const delivery = Number(cfg.deliveryFee || 1.00);
  const subtotal = cart.reduce((s, i) => s + (Number(i.price) * Number(i.qty || 1)), 0);
  const total = subtotal + (cart.length ? delivery : 0);

  const cupomNum = getCurrentCoupon() || getLastCouponNumber();

  const dt = getCurrentDateTime() || new Date();
  const dtStr = formatDateTimeBR(dt);

  const lines = [];
  lines.push("COUTINHO AÇAI");
  lines.push("CUPOM DE PEDIDO");
  lines.push(`CUPOM: ${cupomNum} (${dtStr})`);
  lines.push("--------------------------------");

  cart.forEach((i) => {
    const qty = Number(i.qty || 1);
    const name = String(i.name || "Item");
    const price = Number(i.price || 0);

    lines.push(`${qty}x ${name}`);

    // meta pode vir em qualquer tamanho, vamos quebrar em linhas de 32
    // Se já tiver “|” e etc, mantém e quebra por espaço.
    if (i.meta) {
      const metaLines = wrapText(i.meta, 32);
      metaLines.forEach((ml, idx) => {
        // primeira linha do meta vai com 2 espaços
        // próximas também, como no exemplo
        lines.push("  " + ml);
      });
    } else {
      // mantém um “respiro” tipo o FreakShake do seu exemplo
      lines.push("  ");
    }

    lines.push(dotLine("Item", formatBRL(price), 40));
    lines.push(""); // linha em branco entre itens
  });

  lines.push("--------------------------------");
  lines.push(dotLine("SUBTOTAL", formatBRL(subtotal), 40));
  lines.push(dotLine("ENTREGA", formatBRL(cart.length ? delivery : 0), 40));
  lines.push(dotLine("TOTAL", formatBRL(total), 40));
  lines.push("--------------------------------");

  if (user) {
    lines.push(`CLIENTE: ${user.nome || ""}`);
    lines.push(`END: ${user.end || ""}`);
    lines.push(`REF: ${user.ref || ""}`);
    lines.push("--------------------------------");
  }

  // Pagamento 1 linha (e troco opcional em linha abaixo)
  if (paymentMethod) {
    lines.push(`PAGAMENTO: ${paymentMethod}`);
    if (String(troco || "").trim()) {
      lines.push(`TROCO: ${String(troco).trim()}`);
    }
    lines.push("--------------------------------");
  }

  lines.push("Agradecemos pela preferência 💜");

  return { text: lines.join("\n"), total, subtotal, delivery };
}

// ---------- Carrinho flutuante ----------
function qs(id) { return document.getElementById(id); }

function openCart() {
  const drawer = qs("cart-drawer");
  if (!drawer) return;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  const drawer = qs("cart-drawer");
  if (!drawer) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function updateCartUI() {
  const cart = getCart();
  const fab = qs("cart-fab");
  const badge = qs("cart-badge");
  const itemsEl = qs("cart-items");
  const totalEl = qs("cart-total");
  const checkoutBtn = qs("cart-checkout");

  if (fab) fab.style.display = cart.length ? "grid" : "none";

  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
  if (badge) {
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }

  if (!itemsEl || !totalEl || !checkoutBtn) return;

  const cfg = getMenuConfig();
  const delivery = Number(cfg.deliveryFee || 1.00);
  const subtotal = cart.reduce((s, i) => s + (Number(i.price) * Number(i.qty || 1)), 0);
  const total = subtotal + (cart.length ? delivery : 0);

  totalEl.textContent = formatBRL(total);
  checkoutBtn.disabled = cart.length === 0;

  if (cart.length === 0) {
    itemsEl.innerHTML = `<p class="muted">Seu carrinho está vazio.</p>`;
    return;
  }

  itemsEl.innerHTML = cart.map((item, idx) => {
    const meta = item.meta ? `<div class="cart-item__meta">${escapeHtml(item.meta)}</div>` : "";
    return `
      <div class="cart-item">
        <div>
          <div class="cart-item__title">${escapeHtml(item.name)}</div>
          ${meta}
          <div class="cart-item__meta">${formatBRL(item.price)} cada</div>
        </div>
        <div class="cart-item__actions">
          <div class="cart-qty">
            <button aria-label="Diminuir" data-dec="${idx}">−</button>
            <strong>${item.qty}</strong>
            <button aria-label="Aumentar" data-inc="${idx}">+</button>
          </div>
          <button aria-label="Remover" data-rm="${idx}" class="cart-trash">🗑️</button>
        </div>
      </div>
    `;
  }).join("");
}

// ---------- API ----------
window.CartAPI = {
  // carrinho
  getCart,
  saveCart,
  addToCart: (item) => {
    const cart = getCart();
    if (!item || !item.name) return;

    const normalized = {
      id: String(item.id || item.name),
      name: String(item.name),
      price: Number(item.price || 0),
      qty: Number(item.qty || 1),
      meta: String(item.meta || "")
    };

    const found = cart.find(x => x.id === normalized.id && (x.meta || "") === (normalized.meta || ""));
    if (found) found.qty += normalized.qty || 1;
    else cart.push({ ...normalized, qty: normalized.qty || 1 });

    saveCart(cart);
    openCart();
  },
  incIndex: (idx) => { const c = getCart(); if (c[idx]) c[idx].qty += 1; saveCart(c); },
  decIndex: (idx) => {
    const c = getCart();
    if (!c[idx]) return;
    c[idx].qty -= 1;
    if (c[idx].qty <= 0) c.splice(idx, 1);
    saveCart(c);
  },
  removeIndex: (idx) => { const c = getCart(); c.splice(idx, 1); saveCart(c); },

  // user/temp
  getUser, saveUser,
  getTempItem, saveTempItem, clearTempItem,

  // cupom
  getLastCouponNumber,
  nextCouponNumber,
  setCouponNumber,
  setCurrentCoupon,
  getCurrentCoupon,
  clearCurrentCoupon,
  setCurrentDateTime,
  getCurrentDateTime,
  clearCurrentDateTime,

  // config
  getMenuConfig,
  saveMenuConfig,
  resetMenuConfig,

  // recibo
  buildReceiptText
};

// listeners do carrinho
document.addEventListener("DOMContentLoaded", () => {
  const fab = qs("cart-fab");
  const drawer = qs("cart-drawer");
  const checkoutBtn = qs("cart-checkout");

  if (fab) {
    fab.addEventListener("click", () => {
      updateCartUI();
      openCart();
    });
  }

  if (drawer) {
    drawer.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.matches("[data-cart-close]")) return closeCart();
      if (t && t.dataset && t.dataset.inc !== undefined) return window.CartAPI.incIndex(+t.dataset.inc);
      if (t && t.dataset && t.dataset.dec !== undefined) return window.CartAPI.decIndex(+t.dataset.dec);
      if (t && t.dataset && t.dataset.rm !== undefined) return window.CartAPI.removeIndex(+t.dataset.rm);
    });
  }

  if (checkoutBtn) checkoutBtn.addEventListener("click", () => location.href = "checkout.html");

  updateCartUI();
});
