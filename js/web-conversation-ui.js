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

    function productQuery(need) {
      if (!need) return 'گوشی';
      const parts = [];
      if (need.category === 'mobile') parts.push('گوشی موبایل');
      else if (need.category === 'laptop') parts.push('لپ تاپ');
      else if (need.category) parts.push(String(need.category));
      if (Array.isArray(need.usage) && need.usage.indexOf('photography') >= 0) parts.push('عکاسی');
      if (Array.isArray(need.usage) && need.usage.indexOf('gaming') >= 0) parts.push('گیمینگ');
      return parts.join(' ') || 'محصول';
    }

    function showQuestion(result) {
      if (result && result.question && result.question.question) addMessage(result.question.question, 'assistant');
    }

    function showProducts(items) {
      if (!products) return;
      products.innerHTML = '';
      if (!Array.isArray(items) || !items.length) {
        addMessage('فعلاً محصول مناسبی از منبع جست‌وجو دریافت نشد.', 'assistant');
        return;
      }
      items.slice(0, 3).forEach(function (item) {
        const card = document.createElement('article');
        card.className = 'digiyar-product-card';
        const image = document.createElement('img');
        image.alt = item.name || 'محصول پیشنهادی';
        image.loading = 'lazy';
        image.style.cssText = 'width:100%;height:150px;object-fit:contain;border-radius:10px;background:#fff';
        if (item.image) image.src = item.image;
        const title = document.createElement('h3');
        title.textContent = item.name || 'محصول پیشنهادی';
        const price = document.createElement('p');
        price.className = 'digiyar-product-price';
        price.textContent = item.price ? Number(item.price).toLocaleString('fa-IR') + ' تومان' : 'قیمت نامشخص';
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

    function retrieveProducts(need) {
      if (!window.DigiYarProductRetrieval) {
        addMessage('موتور جست‌وجوی محصولات هنوز در دسترس نیست.', 'assistant');
        return;
      }
      addMessage('نیازت کامل شد؛ دارم بهترین گزینه‌ها را پیدا می‌کنم…', 'assistant');
      window.DigiYarProductRetrieval.search(productQuery(need)).then(showProducts).catch(function (error) {
        console.error(error);
        addMessage('در دریافت محصولات مشکلی پیش آمد.', 'assistant');
      });
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
        if (!state) {
          result = Engine.start(text);
        } else {
          result = Engine.continueConversation(state, text);
        }
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
