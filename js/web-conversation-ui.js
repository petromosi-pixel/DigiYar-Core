/* DigiYar V4 — Web Conversation UI */
(function () {
  'use strict';

  function boot() {
    const Engine = window.DigiYarConversationEngine || window.DigiyarConversationEngine;
    const form = document.getElementById('digiyar-chat-form');
    const input = document.getElementById('digiyar-chat-input');
    const messages = document.getElementById('digiyar-chat-messages');
    const products = document.getElementById('digiyar-products');
    if (!Engine || !form || !input || !messages) return;

    let state = null;

    function addMessage(text, role) {
      const el = document.createElement('div');
      el.className = 'digiyar-chat-message ' + role;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
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

    function diagnosticMessage(diagnostic, need) {
      if (!diagnostic) return '';
      const budget = need && need.budget ? need.budget : null;
      const max = budget && Number(budget.max);
      const min = budget && Number(budget.min);
      const range = min > 0 && max > 0
        ? Number(min).toLocaleString('fa-IR') + ' تا ' + Number(max).toLocaleString('fa-IR')
        : max > 0 ? 'حداکثر ' + Number(max).toLocaleString('fa-IR') : 'بدون سقف قیمت';
      return 'تشخیص فنی موقت: منبع «' + (diagnostic.source || 'نامشخص') +
        '»، دریافت خام: ' + Number(diagnostic.rawCount || 0).toLocaleString('fa-IR') +
        '، محصول قابل پردازش: ' + Number(diagnostic.normalizedCount || 0).toLocaleString('fa-IR') +
        '، دارای قیمت: ' + Number(diagnostic.pricedCount || 0).toLocaleString('fa-IR') +
        '؛ بازه درخواستی: ' + range + ' تومان.';
    }

    function showProducts(items, need, diagnostic) {
      if (!products) return;
      products.innerHTML = '';
      const filtered = applyNeedFilters(items, need);

      if (!filtered.length) {
        const max = need && need.budget && Number(need.budget.max);
        const min = need && need.budget && Number(need.budget.min);
        if (diagnostic) addMessage(diagnosticMessage(diagnostic, need), 'assistant');
        if (min > 0 && max > 0) {
          addMessage('در حال حاضر در نتایج زنده، محصولی در بازه ' + Number(min).toLocaleString('fa-IR') + ' تا ' + Number(max).toLocaleString('fa-IR') + ' تومان پیدا نکردم.', 'assistant');
        } else if (max > 0) {
          addMessage('در حال حاضر در نتایج زنده، محصولی با قیمت حداکثر ' + Number(max).toLocaleString('fa-IR') + ' تومان پیدا نکردم.', 'assistant');
        } else {
          addMessage('فعلاً محصول مناسبی از منبع جست‌وجو دریافت نشد.', 'assistant');
        }
        return;
      }

      filtered.slice(0, 3).forEach(function (item) {
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
        price.textContent = priceValue(item) ? priceValue(item).toLocaleString('fa-IR') + ' تومان' : 'قیمت نامشخص';

        const link = document.createElement('a');
        link.className = 'digiyar-product-link';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'مشاهده کالا';
        link.href = item.affiliateUrl || item.productUrl || '#';

        card.appendChild(image);
        card.appendChild(title);
        card.appendChild(price);
        card.appendChild(link);
        products.appendChild(card);
      });
    }

    async function retrieveProducts(need) {
      const Integration = window.DigiyarProductRetrievalIntegration;
      if (!Integration || typeof Integration.retrieve !== 'function') {
        addMessage('اتصال موتور جست‌وجوی محصولات هنوز در دسترس نیست.', 'assistant');
        return;
      }

      addMessage('نیازت کامل شد؛ دارم گزینه‌های واقعی بازار را بررسی می‌کنم…', 'assistant');

      try {
        const result = await Integration.retrieve(need, { remote: true });
        showProducts(result.products || [], need, result.diagnostic || null);
      } catch (error) {
        console.error(error);
        addMessage('در دریافت محصولات زنده مشکلی پیش آمد؛ دوباره امتحان کن.', 'assistant');
      }
    }

    function showQuestion(result) {
      if (result && result.question && result.question.question) addMessage(result.question.question, 'assistant');
    }

    function handleResult(result) {
      if (!result) return;
      state = result.state || state;
      showQuestion(result);
      if (result.status === 'complete' && result.need) retrieveProducts(result.need);
    }

    function process(text) {
      try {
        let result;
        if (!state) result = Engine.start(text);
        else result = Engine.continueConversation(state, text);
        handleResult(result);
      } catch (error) {
        console.error(error);
        addMessage('در پردازش درخواست مشکلی پیش آمد. دوباره امتحان کن.', 'assistant');
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, 'user');
      input.value = '';
      input.focus();
      process(text);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
