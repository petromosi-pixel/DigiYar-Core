/* =========================================================
   DigiYar V5 — Web Conversation UI
   Alpha 0.1 — End-to-End Core bridge
   ========================================================= */
(function () {
  'use strict';

  function applyV5Splash() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    // V5 Step 1: keep the V3 three-piece logo structure already present in HTML,
    // but apply the new lighter-navy brand treatment without touching Core V4.
    splash.className = 'splash-screen v5-splash-screen';

    const brandText = splash.querySelector('.splash-brand p');
    if (brandText) brandText.textContent = 'دستیار دنیای دیجیتال';

    const style = document.createElement('style');
    style.id = 'digiyar-v5-splash-runtime';
    style.textContent = `
      .v5-splash-screen {
        background: radial-gradient(circle at 50% 42%, #2a4169 0%, #22395f 58%, #172b4a 100%) !important;
      }
      .v5-splash-screen .splash-content {
        width: min(90vw, 390px);
      }
      .v5-splash-screen .splash-logo-assembly {
        width: 210px;
        height: 170px;
        margin-bottom: 12px;
      }
      .v5-splash-screen .logo-piece {
        animation: v5SplashLogoIn 1.05s cubic-bezier(.2,.8,.2,1) forwards;
      }
      .v5-splash-screen .logo-piece-1 { animation-delay: .05s; }
      .v5-splash-screen .logo-piece-2 { animation-delay: .18s; }
      .v5-splash-screen .logo-piece-3 { animation-delay: .31s; }
      .v5-splash-screen .logo-piece img {
        width: 165px;
        height: 165px;
      }
      .v5-splash-screen .splash-brand {
        animation: v5SplashTextIn .8s ease .55s forwards;
      }
      .v5-splash-screen .splash-brand h1 {
        color: #ff8a00 !important;
        font-size: 34px;
        font-weight: 900;
      }
      .v5-splash-screen .splash-brand p {
        color: #f4f7fb !important;
        font-size: 15px;
      }
      .v5-splash-screen .splash-loader {
        width: 105px;
        height: 3px;
        margin-top: 26px;
        background: rgba(255,255,255,.16);
      }
      .v5-splash-screen .splash-loader span {
        background: #ff8a00 !important;
        animation: v5SplashLoader 1.2s ease-in-out infinite;
      }
      @keyframes v5SplashLogoIn {
        from { opacity: 0; transform: translateY(-22px) scale(.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes v5SplashTextIn {
        from { opacity: 0; transform: translateY(-9px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes v5SplashLoader {
        0% { transform: translateX(220%); }
        100% { transform: translateX(-320%); }
      }
      @media (max-width: 430px) {
        .v5-splash-screen .splash-logo-assembly { width: 190px; height: 155px; }
        .v5-splash-screen .logo-piece img { width: 150px; height: 150px; }
        .v5-splash-screen .splash-brand h1 { font-size: 31px; }
      }
    `;
    document.head.appendChild(style);
  }

  applyV5Splash();

  function boot() {
    const Engine = window.DigiYarConversationEngine || window.DigiyarConversationEngine;
    const Integration = window.DigiyarProductRetrievalIntegration;
    const form = document.getElementById('digiyar-chat-form');
    const input = document.getElementById('digiyar-chat-input');
    const messages = document.getElementById('digiyar-chat-messages');
    const products = document.getElementById('digiyar-products');

    if (!Engine || !form || !input || !messages) return;

    let state = null;
    let busy = false;

    function addMessage(text, role) {
      const el = document.createElement('div');
      el.className = 'digiyar-chat-message ' + role;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
      return el;
    }

    function setBusy(value) {
      busy = value;
      input.disabled = value;
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = value;
    }

    function priceValue(item) {
      const value = Number(item && item.price);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function applyNeedFilters(items, need) {
      if (!Array.isArray(items)) return [];
      const budget = need && need.budget ? need.budget : null;
      const min = budget && Number(budget.min);
      const max = budget && Number(budget.max);
      return items.filter(function (item) {
        const price = priceValue(item);
        if (price <= 0) return false;
        if (Number.isFinite(min) && min > 0 && price < min) return false;
        if (Number.isFinite(max) && max > 0 && price > max) return false;
        return true;
      });
    }

    function renderProducts(items, need) {
      if (!products) return;
      products.innerHTML = '';
      const filtered = applyNeedFilters(items, need).slice(0, 3);

      if (!filtered.length) {
        addMessage('برای نیاز کامل‌شده، فعلاً محصول قابل نمایش پیدا نشد.', 'assistant');
        return;
      }

      filtered.forEach(function (item) {
        const card = document.createElement('article');
        card.className = 'digiyar-product-card';

        const image = document.createElement('img');
        image.alt = item.name || 'محصول پیشنهادی';
        image.loading = 'lazy';
        image.className = 'digiyar-product-image';
        image.src = item.image || '';
        image.onerror = function () { image.style.display = 'none'; };

        const title = document.createElement('h3');
        title.textContent = item.name || 'محصول پیشنهادی';

        const price = document.createElement('p');
        price.className = 'digiyar-product-price';
        price.textContent = priceValue(item)
          ? priceValue(item).toLocaleString('fa-IR') + ' تومان'
          : 'قیمت نامشخص';

        const link = document.createElement('a');
        link.className = 'digiyar-product-link';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'مشاهده کالا';
        link.href = item.affiliateUrl || item.productUrl || item.url || '#';

        card.appendChild(image);
        card.appendChild(title);
        card.appendChild(price);
        card.appendChild(link);
        products.appendChild(card);
      });
    }

    async function retrieveProducts(need) {
      if (!Integration || typeof Integration.retrieve !== 'function') {
        addMessage('اتصال موتور جست‌وجوی محصولات در Web App در دسترس نیست.', 'assistant');
        return;
      }

      addMessage('نیازت کامل شد؛ دارم گزینه‌های واقعی بازار را بررسی می‌کنم…', 'assistant');
      setBusy(true);

      try {
        const result = await Integration.retrieve(need, { remote: true });
        if (!result || result.status === 'retrieval_error') {
          addMessage('در دریافت محصولات زنده مشکلی پیش آمد؛ دوباره امتحان کن.', 'assistant');
          return;
        }
        renderProducts(result.products || [], need);
      } catch (error) {
        console.error('DigiYar V5 Retrieval:', error);
        addMessage('در دریافت محصولات زنده مشکلی پیش آمد؛ دوباره امتحان کن.', 'assistant');
      } finally {
        setBusy(false);
        input.focus();
      }
    }

    function showQuestion(result) {
      if (result && result.question && result.question.question) {
        addMessage(result.question.question, 'assistant');
      }
    }

    async function handleResult(result) {
      if (!result) return;
      state = result.state || state;
      showQuestion(result);
      if (result.status === 'complete' && result.need) {
        await retrieveProducts(result.need);
      }
    }

    async function process(text) {
      try {
        let result;
        if (!state) result = Engine.start(text);
        else result = Engine.continueConversation(state, text);
        await handleResult(result);
      } catch (error) {
        console.error('DigiYar V5 Conversation:', error);
        addMessage('در پردازش درخواست مشکلی پیش آمد. دوباره امتحان کن.', 'assistant');
      }
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy) return;
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, 'user');
      input.value = '';
      await process(text);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
