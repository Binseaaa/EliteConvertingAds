'use strict';

tailwind.config = {
      theme: {
        extend: {
          colors: {
            black:   '#080808',
            'off-black': '#101010',
            card:    '#141414',
            white:   '#f5f5f0',
            muted:   'rgba(245,245,240,0.45)',
            accent:  '#c8f53a',
            accent2: '#3affa3',
            'accent-glow': 'rgba(200,245,58,0.18)',
            border:  'rgba(255,255,255,0.07)',
          },
          fontFamily: {
            display: ['"Bebas Neue"', 'sans-serif'],
            body:    ['"DM Sans"',    'sans-serif'],
            mono:    ['"Space Mono"', 'monospace'],
          },
          keyframes: {
            pulseGlow: {
              '0%,100%': { opacity:'0.7', transform:'scale(1)' },
              '50%':     { opacity:'1',   transform:'scale(1.06)' },
            },
            pulse: {
              '0%,100%': { opacity:'1',   transform:'scale(1)' },
              '50%':     { opacity:'0.5', transform:'scale(0.8)' },
            },
            expandRing: {
              '0%,100%': { opacity:'0.6', transform:'translate(-50%,-50%) scale(1)' },
              '50%':     { opacity:'1',   transform:'translate(-50%,-50%) scale(1.04)' },
            },
            floatA: {
              '0%,100%': { transform:'rotate(-7deg) translateY(0)' },
              '50%':     { transform:'rotate(-7deg) translateY(-10px)' },
            },
            floatB: {
              '0%,100%': { transform:'translateX(-50%) rotate(0deg) translateY(0)' },
              '50%':     { transform:'translateX(-50%) rotate(0deg) translateY(-14px)' },
            },
            floatC: {
              '0%,100%': { transform:'rotate(7deg) translateY(0)' },
              '50%':     { transform:'rotate(7deg) translateY(-10px)' },
            },
            floatD: {
              '0%,100%': { transform:'rotate(5deg) translateY(0)' },
              '50%':     { transform:'rotate(5deg) translateY(-8px)' },
            },
            floatE: {
              '0%,100%': { transform:'translateX(-50%) rotate(-3deg) translateY(0)' },
              '50%':     { transform:'translateX(-50%) rotate(-3deg) translateY(-10px)' },
            },
            floatF: {
              '0%,100%': { transform:'rotate(-6deg) translateY(0)' },
              '50%':     { transform:'rotate(-6deg) translateY(-8px)' },
            },
            ticker: {
              from: { transform:'translateX(0)' },
              to:   { transform:'translateX(-50%)' },
            },
          },
          animation: {
            pulseGlow:  'pulseGlow 6s ease-in-out infinite',
            pulseGlow2: 'pulseGlow 6s ease-in-out infinite 2s',
            dotPulse:   'pulse 2s infinite',
            expandRing:  'expandRing 3s ease-in-out infinite',
            expandRing2: 'expandRing 3s ease-in-out infinite 1s',
            floatA: 'floatA 5s ease-in-out infinite',
            floatB: 'floatB 5s ease-in-out infinite 0.5s',
            floatC: 'floatC 5s ease-in-out infinite 1s',
            floatD: 'floatD 5s ease-in-out infinite 1.5s',
            floatE: 'floatE 5s ease-in-out infinite 2s',
            floatF: 'floatF 5s ease-in-out infinite 2.5s',
            ticker: 'ticker 18s linear infinite',
          },
        },
      },
    };

// ─── CONFIG ───────────────────────────────────────────────────
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw86YM14CXf9tWfuxo-vMC-zgIrQKegwyGQ_2NzJ9aH8beC7dk5aBXei5E5wRCNMUop/exec',
  STRIPE_PK:  'pk_live_51TJCTlLc9CxU3CKu4arHLqXjtmFVbLNquU11fCZIIDxlHAfOvCvAdN8bJo4g6qLmupRcTc497F1BFlAJOiTIsCii00ZR2hvFb2',
  PAYMENT_INTENT_URL: '/.netlify/functions/create-payment-intent',
};

// ─── STATE ────────────────────────────────────────────────────
const state = {
  pendingFormData: null,
  pendingForm:     null,
  pendingBtn:      null,
  stripe:          null,
  cardElement:     null,
};

// ─── STRIPE ELEMENT STYLE ─────────────────────────────────────
const STRIPE_STYLE = {
  style: {
    base: {
      color:       '#f5f5f0',
      fontFamily:  'DM Sans, sans-serif',
      fontSize:    '15px',
      '::placeholder': { color: 'rgba(245,245,240,0.3)' },
    },
    invalid: { color: '#ff6b6b' },
  },
};

// =============================================================
//  SCROLL REVEAL
// =============================================================
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), 80);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

// =============================================================
//  UPLOAD PREVIEW
// =============================================================
function handleUpload(input, previewId, nameId) {
  const file = input.files[0];
  if (!file) return;

  const box     = input.closest('.upload-box');
  const preview = document.getElementById(previewId);
  const nameEl  = document.getElementById(nameId);
  const reader  = new FileReader();

  reader.onload = (e) => {
    preview.src             = e.target.result;
    preview.style.display   = 'block';
    nameEl.textContent      = file.name;
    box.classList.add('has-file');
  };

  reader.readAsDataURL(file);
}

// =============================================================
//  PRICE CALCULATOR
// =============================================================
function calcTotal() {
  const PACKAGE_PRICES = { starter: 100, growth: 250, elite: 500 };
  const EXTRA_PRICES   = { variations: { '1': 10, '3': 25, '5': 40 } };

  const pkg  = document.getElementById('package')?.value ?? '';
  let   total = PACKAGE_PRICES[pkg] ?? 0;

  document.querySelectorAll('.extra-toggle.active').forEach((toggle) => {
    const label = toggle.querySelector('.extra-toggle-label')?.textContent ?? '';

    if (label.includes('Voiceover'))  total += 10;
    if (label.includes('Thumbnail'))  total += 10;
    if (label.includes('Variations')) {
      const sel = toggle.closest('.extra-item')?.querySelector('.extra-select');
      total += EXTRA_PRICES.variations[sel?.value] ?? 0;
    }
  });

  return total;
}

// =============================================================
//  READ IMAGE AS BASE64
// =============================================================
function readImage(inputId) {
  return new Promise((resolve) => {
    const file = document.getElementById(inputId)?.files[0];
    if (!file) return resolve({ name: '', b64: '', mime: '' });

    const reader = new FileReader();
    reader.onload = (e) => {
      const [, b64] = e.target.result.split(',');
      resolve({ name: file.name, b64, mime: file.type });
    };
    reader.readAsDataURL(file);
  });
}

// =============================================================
//  RESET SUBMIT BUTTON
// =============================================================
function resetBtn() {
  if (!state.pendingBtn) return;
  state.pendingBtn.textContent  = 'Submit My Order →';
  state.pendingBtn.disabled     = false;
  state.pendingBtn.style.opacity = '1';
}

// =============================================================
//  RESET FORM
// =============================================================
function resetForm() {
  state.pendingForm?.reset();

  // Clear image previews
  ['upload-product-preview', 'upload-logo-preview'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.src = ''; }
  });

  // Reset upload labels
  const labels = {
    'upload-product-name': 'Click to upload · PNG, JPG, WEBP',
    'upload-logo-name':    'Click to upload · PNG, SVG, JPG',
  };
  Object.entries(labels).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  // Clear toggled states
  document.querySelectorAll('.upload-box.has-file').forEach((b) => b.classList.remove('has-file'));
  document.querySelectorAll('.extra-toggle.active').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.extra-subopts.visible').forEach((s) => s.classList.remove('visible'));
}

// =============================================================
//  PAYMENT POPUP
// =============================================================
function showPaymentPopup(total, custEmail, productName, pkg) {
  document.getElementById('payment-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id    = 'payment-overlay';
  Object.assign(overlay.style, {
    position:      'fixed',
    inset:         '0',
    background:    'rgba(8,8,8,0.92)',
    zIndex:        '9998',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    padding:       '20px',
    backdropFilter:'blur(8px)',
  });

  overlay.innerHTML = `
    <div style="background:#141414;border:1px solid rgba(200,245,58,0.3);border-radius:10px;
                padding:36px 32px;max-width:460px;width:100%;position:relative;">

      <button id="close-payment-btn"
        style="position:absolute;top:14px;right:16px;background:none;border:none;
               color:rgba(245,245,240,0.4);font-size:1.2rem;cursor:pointer;line-height:1;">&#10005;</button>

      <!-- Header -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:52px;height:52px;border-radius:50%;background:rgba(200,245,58,0.1);
                    border:1px solid rgba(200,245,58,0.35);display:flex;align-items:center;
                    justify-content:center;margin:0 auto 16px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8f53a"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <h3 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:0.04em;
                   color:#c8f53a;margin:0 0 6px;">Complete Payment</h3>
        <p style="color:rgba(245,245,240,0.5);font-size:0.82rem;margin:0;">
          Secure card payment powered by Stripe
        </p>
      </div>

      <!-- Order summary -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                  border-radius:6px;padding:16px;margin-bottom:20px;">
        <p style="font-size:0.72rem;font-family:'Space Mono',monospace;letter-spacing:0.1em;
                  color:rgba(245,245,240,0.35);text-transform:uppercase;margin:0 0 10px;">Order Summary</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:0.88rem;color:rgba(245,245,240,0.65);">${productName}</span>
          <span style="font-size:0.88rem;color:rgba(245,245,240,0.65);">${pkg}</span>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.07);margin:10px 0;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.9rem;font-weight:600;color:#f5f5f0;">Total Due</span>
          <span style="font-size:1.4rem;font-family:'Bebas Neue',sans-serif;
                       color:#c8f53a;letter-spacing:0.05em;">$${total} USD</span>
        </div>
      </div>

      <!-- Stripe fields -->
      <div style="margin-bottom:16px;display:flex;flex-direction:column;gap:10px;">
        <div>
          <label style="font-size:0.72rem;font-family:'Space Mono',monospace;letter-spacing:0.1em;
                        color:rgba(245,245,240,0.35);text-transform:uppercase;display:block;margin-bottom:6px;">
            Card Number
          </label>
          <div id="stripe-card-number"
               style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);
                      border-radius:4px;padding:14px 12px;"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:0.72rem;font-family:'Space Mono',monospace;letter-spacing:0.1em;
                          color:rgba(245,245,240,0.35);text-transform:uppercase;display:block;margin-bottom:6px;">
              Expiry Date
            </label>
            <div id="stripe-card-expiry"
                 style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);
                        border-radius:4px;padding:14px 12px;"></div>
          </div>
          <div>
            <label style="font-size:0.72rem;font-family:'Space Mono',monospace;letter-spacing:0.1em;
                          color:rgba(245,245,240,0.35);text-transform:uppercase;display:block;margin-bottom:6px;">
              CVC
            </label>
            <div id="stripe-card-cvc"
                 style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);
                        border-radius:4px;padding:14px 12px;"></div>
          </div>
        </div>
        <div id="stripe-card-errors" style="color:#ff6b6b;font-size:0.78rem;min-height:18px;"></div>
      </div>

      <!-- Pay button -->
      <button id="stripe-pay-btn"
        style="width:100%;background:#c8f53a;color:#080808;font-family:'Space Mono',monospace;
               font-size:0.8rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
               padding:15px 24px;border:none;border-radius:4px;cursor:pointer;box-sizing:border-box;">
        Pay $${total} USD
      </button>

      <!-- Trust badge -->
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="rgba(245,245,240,0.3)" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p style="font-size:0.72rem;color:rgba(245,245,240,0.3);margin:0;">
          Secured by Stripe · SSL Encrypted
        </p>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Wire up close button after DOM insertion
  document.getElementById('close-payment-btn').addEventListener('click', () => {
    overlay.remove();
    resetBtn();
  });

  // Wire up pay button after DOM insertion
  document.getElementById('stripe-pay-btn').addEventListener('click', () => {
    handleStripePayment(total, custEmail);
  });

  // Init Stripe elements
  setTimeout(() => {
    state.stripe ??= Stripe(CONFIG.STRIPE_PK);

    const elements   = state.stripe.elements();
    const cardNumber = elements.create('cardNumber', STRIPE_STYLE);
    const cardExpiry = elements.create('cardExpiry', STRIPE_STYLE);
    const cardCvc    = elements.create('cardCvc',    STRIPE_STYLE);

    cardNumber.mount('#stripe-card-number');
    cardExpiry.mount('#stripe-card-expiry');
    cardCvc.mount('#stripe-card-cvc');

    state.cardElement = cardNumber;

    // Live error display
    const showError = (e) => {
      const el = document.getElementById('stripe-card-errors');
      if (el) el.textContent = e.error?.message ?? '';
    };
    [cardNumber, cardExpiry, cardCvc].forEach((el) => el.on('change', showError));
  }, 50);
}

// =============================================================
//  STRIPE PAYMENT HANDLER
// =============================================================
async function handleStripePayment(total, custEmail) {
  const btn = document.getElementById('stripe-pay-btn');
  if (!btn || !state.cardElement) return;

  // Loading state
  btn.textContent    = 'Processing...';
  btn.disabled       = true;
  btn.style.opacity  = '0.6';

  const setError = (msg) => {
    const el = document.getElementById('stripe-card-errors');
    if (el) el.textContent = msg;
    btn.textContent   = `Pay $${total} USD`;
    btn.disabled      = false;
    btn.style.opacity = '1';
  };

  try {
    // 1. Create PaymentIntent via Netlify function
    const res  = await fetch(CONFIG.PAYMENT_INTENT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ amount: Math.round(total * 100) }),
    });
    const data = await res.json();

    if (!data.clientSecret) throw new Error(data.error ?? 'Payment setup failed. Please try again.');

    // 2. Confirm card payment
    const { error, paymentIntent } = await state.stripe.confirmCardPayment(data.clientSecret, {
      payment_method: { card: state.cardElement },
    });

    if (error) {
      setError(error.message);
    } else if (paymentIntent?.status === 'succeeded') {
      submitOrderToSheets(custEmail);
    }
  } catch (err) {
    setError(err.message);
  }
}

// =============================================================
//  SUBMIT ORDER TO GOOGLE SHEETS (after payment)
// =============================================================
function submitOrderToSheets(custEmail) {
  if (!state.pendingFormData) {
    showOrderComplete(custEmail);
    return;
  }

  fetch(CONFIG.SCRIPT_URL, {
    method: 'POST',
    mode:   'no-cors',
    body:   state.pendingFormData,
  }).finally(() => showOrderComplete(custEmail));
}

// =============================================================
//  ORDER COMPLETE SCREEN
// =============================================================
function showOrderComplete(custEmail) {
  document.getElementById('payment-overlay')?.remove();

  const done = document.createElement('div');
  done.id = 'done-overlay';
  Object.assign(done.style, {
    position:       'fixed',
    inset:          '0',
    background:     'rgba(8,8,8,0.92)',
    zIndex:         '9999',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '20px',
    backdropFilter: 'blur(8px)',
  });

  done.innerHTML = `
    <div style="background:#141414;border:1px solid rgba(200,245,58,0.35);border-radius:10px;
                padding:44px 36px;max-width:440px;width:100%;text-align:center;">
      <div style="width:60px;height:60px;border-radius:50%;background:rgba(200,245,58,0.12);
                  border:1px solid rgba(200,245,58,0.4);display:flex;align-items:center;
                  justify-content:center;margin:0 auto 20px;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c8f53a"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:0.04em;
                 color:#c8f53a;margin:0 0 10px;">Order Confirmed!</h3>
      <p style="color:rgba(245,245,240,0.65);font-size:0.92rem;line-height:1.7;margin:0 0 6px;">
        Payment successful. We are already getting to work on your ad creative.
      </p>
      <p style="color:rgba(245,245,240,0.4);font-size:0.8rem;margin:0 0 28px;">
        Confirmation sent to <strong style="color:#f5f5f0;">${custEmail}</strong>
      </p>
      <p style="color:rgba(245,245,240,0.25);font-size:0.72rem;font-family:'Space Mono',monospace;
                letter-spacing:0.08em;margin:0 0 24px;">EXPECTED DELIVERY · 24–48 HOURS</p>
      <button id="done-close-btn"
        style="background:#c8f53a;color:#080808;font-family:'Space Mono',monospace;font-size:0.75rem;
               font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:12px 32px;
               border:none;border-radius:2px;cursor:pointer;">
        Done
      </button>
    </div>`;

  document.body.appendChild(done);
  document.getElementById('done-close-btn').addEventListener('click', () => done.remove());

  // Reset everything
  resetForm();
  resetBtn();
  state.pendingFormData = null;
}

// =============================================================
//  FORM SUBMIT HANDLER
// =============================================================
async function handleSubmit(evt) {
  evt.preventDefault();

  const form = evt.target;
  const btn  = form.querySelector('.submit-btn') ?? form.querySelector('button[type="submit"]');

  state.pendingForm = form;
  state.pendingBtn  = btn;

  // Collect form values
  const productName = document.getElementById('product-name').value.trim();
  const custEmail   = document.getElementById('email').value.trim();
  const adFormatEl  = document.getElementById('ad-format');
  const adFormat    = adFormatEl.options[adFormatEl.selectedIndex].text;
  const packageEl   = document.getElementById('package');
  const pkg         = packageEl.options[packageEl.selectedIndex].text;
  const notes       = document.getElementById('description').value.trim();

  // Build extras string
  const extrasArr = [];
  document.querySelectorAll('.extra-toggle.active').forEach((toggle) => {
    let label = toggle.querySelector('.extra-toggle-label')?.textContent.trim() ?? '';
    const sel = toggle.closest('.extra-item')?.querySelector('.extra-select');
    if (sel?.value) label += ` (${sel.options[sel.selectedIndex].text})`;
    extrasArr.push(label);
  });
  const extras = extrasArr.length ? extrasArr.join(' | ') : 'None';

  const total = calcTotal();
  if (total === 0) {
    alert('Please select a package before submitting.');
    return;
  }

  // Loading state
  btn.textContent    = 'Preparing payment...';
  btn.disabled       = true;
  btn.style.opacity  = '0.6';

  // Read images in parallel
  const [prodImg, logoImg] = await Promise.all([
    readImage('upload-product'),
    readImage('upload-logo'),
  ]);

  // Build FormData for Google Sheets
  const fd = new FormData();
  fd.append('productName',  productName);
  fd.append('custEmail',    custEmail);
  fd.append('adFormat',     adFormat);
  fd.append('package',      pkg);
  fd.append('notes',        notes);
  fd.append('extras',       extras);
  fd.append('total',        `$${total} USD`);
  fd.append('productImage', prodImg.name || 'Not uploaded');
  fd.append('logoName',     logoImg.name || 'Not uploaded');
  fd.append('productB64',   prodImg.b64);
  fd.append('productMime',  prodImg.mime);
  fd.append('logoB64',      logoImg.b64);
  fd.append('logoMime',     logoImg.mime);

  state.pendingFormData = fd;

  // Restore button, then show payment popup
  btn.textContent    = 'Submit My Order →';
  btn.disabled       = false;
  btn.style.opacity  = '1';

  showPaymentPopup(total, custEmail, productName, pkg);
}

// =============================================================
//  INIT
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
});

const btn = document.getElementById("menu-btn");
const menu = document.getElementById("mobile-menu");

btn.addEventListener("click", () => {
menu.classList.toggle("hidden");
});

const track = document.getElementById("carouselTrack");
track.innerHTML += track.innerHTML;

let index = 0;
const step = 240;
const total = track.children.length / 2;

function updateCarousel() {
  track.style.transition = "transform 0.3s ease";
  track.style.transform = `translate3d(${-index * step}px, 0, 0)`;
}

// BUTTON = instant next/prev (TikTok snap)
function moveCarousel(dir) {
  index += dir;

  // loop safely within real items only
  if (index >= total) index = 0;
  if (index < 0) index = total - 1;

  updateCarousel();
}

// AUTO LOOP (runs independently, same logic as button)
setInterval(() => {
  index++;

  if (index >= total) {
    index = 0;
  }

  updateCarousel();
}, 5000);

function toggleExtra(btn, targetId) {

  // toggle dropdown
  if (targetId) {
    const el = document.getElementById(targetId);
    el.classList.toggle('hidden');
  }

  // toggle active state on button
  btn.classList.toggle('border-accent');
  btn.classList.toggle('text-white');
  btn.classList.toggle('bg-white/[0.06]');
  btn.classList.toggle('text-white/60');
}

function previewImage(event, previewId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const img = document.getElementById(previewId);
    img.src = e.target.result;
    img.classList.remove("hidden");

    // show remove button
    const removeBtn = document.getElementById(previewId.includes("product") ? "product-remove" : "logo-remove");
    if (removeBtn) removeBtn.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function removeImage(e, inputId, previewId) {
  e.stopPropagation();

  const input = document.getElementById(inputId);
  const img = document.getElementById(previewId);

  input.value = "";
  img.src = "";
  img.classList.add("hidden");

  const removeBtn = document.getElementById(previewId.includes("product") ? "product-remove" : "logo-remove");
  if (removeBtn) removeBtn.classList.add("hidden");
}

function handleDrop(event, inputId, previewId) {
  event.preventDefault();

  const file = event.dataTransfer.files[0];
  if (!file) return;

  const input = document.getElementById(inputId);

  // assign file manually
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;

  previewImage({ target: input }, previewId);
}

document.querySelectorAll('[data-package]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();

    const packageValue = btn.dataset.package;
    const price = btn.dataset.price;

    // set package dropdown
    const packageSelect = document.getElementById('package');
    if (packageSelect) {
      packageSelect.value = packageValue;
      packageSelect.dispatchEvent(new Event('change'));
    }

    // optional: scroll to form
    document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' });

    console.log("Selected package:", packageValue, price);
  });
});