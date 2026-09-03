/* =========================================================
   DigiYar V5.1 — Web Conversation UI
   E2E bridge: Need -> Candidate -> Resolver -> Offer
   ========================================================= */
(function () {
  'use strict';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-v51-module="' + src + '"]');
      if (existing) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.v51Module = src;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(script);
    });
  }

  async function ensureV51Modules() {
    if (!window.DigiYarV5CatalogAdapter) await loadScript('js/v5-catalog-adapter.js');
    if (!window.DigiYarV5PriceEngine) await loadScript('js/v5-price-engine.js');
    if (!window.DigiYarV5CandidateRetrieval) await loadScript('js/v5-candidate-retrieval.js');
  }

  function boot() {
    const Engine = window.DigiYarConversationEngine || window.DigiyarConversationEngine;
    const Integration = window.DigiyarProductRetrievalIntegration;
    const form = document.getElementById('digiyar-chat-form');
    const input = document.getElementById('digiyar-chat-input');
    const messages = document.getElementById('digiyar-chat-messages');
    const products = document.getElementById('digiyar-products');

    if (!Engine || !Integration || !form || !input || !messages) return;

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
      const live = item && item.bestOffer && Number(item.bestOffer.priceToman);
      if (Number.isFinite(live) && live > 0) return live;
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
        if (budget && budget.mode === 'MAX_PRICE' && Number.isFinite(max) && max > 0 && price > max) return false;
        if (Number.isFinite(min) && min > 0 && price < min) return false;
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
        image.alt = item.name || 'محصول پیشنهادی'; image.loading = 'lazy'; image.className = 'digiyar-product-image'; image.src = item.image || '';
        image.onerror = function () { image.style.display = 'none'; };
        const title = document.createElement('h3'); title.textContent = item.name || 'محصول پیشنهادی';
        const price = document.createElement('p'); price.className = 'digiyar-product-price';
        price.textContent = priceValue(item) ? priceValue(item).toLocaleString('fa-IR') + ' تومان' : 'قیمت نامشخص';
        const link = document.createElement('a'); link.className = 'digiyar-product-link'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'مشاهده کالا';
        link.href = item.bestOffer && item.bestOffer.affiliateUrl || item.affiliateUrl || item.productUrl || item.url || '#';
        card.appendChild(image); card.appendChild(title); card.appendChild(price); card.appendChild(link); products.appendChild(card);
      });
    }

    async function retrieveProducts(need) {
      addMessage('نیازت کامل شد؛ دارم گزینه‌های واقعی بازار را بررسی می‌کنم…', 'assistant');
      setBusy(true);
      try {
        await ensureV51Modules();
        const result = await Integration.retrieve(need, { remote: true, candidateLimit: 10, limit: 3, resolverTimeout: 10000 });
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
      if (result && result.question && result.question.question) addMessage(result.question.question, 'assistant');
    }

    async function handleResult(result) {
      if (!result) return;
      state = result.state || state;
      showQuestion(result);
      if (result.status === 'complete' && result.need) await retrieveProducts(result.need);
    }

    async function process(text) {
      try {
        const result = !state ? Engine.start(text) : Engine.continueConversation(state, text);
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
      addMessage(text, 'user'); input.value = ''; await process(text);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
