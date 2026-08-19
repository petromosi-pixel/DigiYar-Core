/* DigiYar V4 — Web Conversation UI */
(function () {
  'use strict';

  function boot() {
    if (!window.DigiYarConversationEngine) return;

    const form = document.getElementById('digiyar-chat-form');
    const input = document.getElementById('digiyar-chat-input');
    const messages = document.getElementById('digiyar-chat-messages');
    const products = document.getElementById('digiyar-products');
    if (!form || !input || !messages) return;

    let engine = null;

    function addMessage(text, role) {
      const el = document.createElement('div');
      el.className = 'digiyar-chat-message ' + role;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }

    function showQuestion(result) {
      if (result && result.question && result.question.question) {
        addMessage(result.question.question, 'assistant');
      }
    }

    function showProducts(items) {
      if (!products || !Array.isArray(items) || !items.length) return;
      products.innerHTML = '';
      items.slice(0, 3).forEach(function (item) {
        const card = document.createElement('article');
        card.className = 'digiyar-product-card';
        card.innerHTML = '<h3></h3><p class="digiyar-product-price"></p>' +
          '<a class="digiyar-product-link" target="_blank" rel="noopener">مشاهده کالا</a>';
        card.querySelector('h3').textContent = item.name || item.title || 'محصول پیشنهادی';
        card.querySelector('.digiyar-product-price').textContent = item.price ? Number(item.price).toLocaleString('fa-IR') + ' تومان' : '';
        const link = item.url || item.link || item.productUrl;
        if (link) card.querySelector('a').href = link;
        products.appendChild(card);
      });
    }

    function process(text) {
      if (!engine) {
        engine = new window.DigiYarConversationEngine();
        engine.start(text).then(function (result) {
          handleResult(result);
        }).catch(handleError);
      } else {
        engine.continueConversation(text).then(function (result) {
          handleResult(result);
        }).catch(handleError);
      }
    }

    function handleResult(result) {
      showQuestion(result);
      if (result && result.status === 'complete' && result.need) {
        addMessage('نیازت کامل شد؛ در حال آماده‌سازی پیشنهادها…', 'assistant');
        if (window.DigiYarProductRetrieval) {
          window.DigiYarProductRetrieval.search(result.need).then(function (items) {
            showProducts(items);
          }).catch(function () {
            addMessage('فعلاً نتونستم محصولات را دریافت کنم.', 'assistant');
          });
        }
      }
    }

    function handleError(error) {
      console.error(error);
      addMessage('در پردازش درخواست مشکلی پیش آمد. دوباره امتحان کن.', 'assistant');
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
