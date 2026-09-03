/* DigiYar V5.1 — Video Splash controller
   Uses the existing #splashScreen overlay and falls back to the original splash
   if the video asset is unavailable. No app content or layout is replaced. */
(function () {
  'use strict';

  var VIDEO_SRC = './digiyar-splash.mp4';
  var MAX_SPLASH_MS = 9500;
  var REMOVE_AFTER_FADE_MS = 550;
  var splash;
  var video;
  var soundHint;
  var dismissed = false;

  function dismissSplash() {
    if (dismissed || !splash) return;
    dismissed = true;
    splash.classList.add('splash-hidden');
    splash.setAttribute('aria-hidden', 'true');
    window.setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, REMOVE_AFTER_FADE_MS);
  }

  function showSoundHint() {
    if (soundHint) soundHint.classList.add('show');
  }

  function enableSound() {
    if (!video) return;
    video.muted = false;
    video.play().then(function () {
      if (soundHint) soundHint.classList.remove('show');
    }).catch(function () {
      showSoundHint();
    });
  }

  function activateVideoSplash() {
    if (!splash || !video) return;
    splash.classList.add('video-active');
    video.play().catch(function () {
      video.muted = true;
      video.play().catch(function () {});
      showSoundHint();
    });
  }

  function initVideoSplash() {
    if (!splash) return;

    video = document.createElement('video');
    video.className = 'v5-splash-video';
    video.id = 'splashVideo';
    video.src = VIDEO_SRC;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.setAttribute('preload', 'auto');
    video.setAttribute('aria-hidden', 'true');

    soundHint = document.createElement('div');
    soundHint.className = 'v5-splash-video-hint';
    soundHint.textContent = '🔊 برای پخش صدا لمس کنید';
    soundHint.setAttribute('aria-hidden', 'true');

    video.addEventListener('canplay', activateVideoSplash, { once: true });
    video.addEventListener('loadeddata', activateVideoSplash, { once: true });
    video.addEventListener('ended', dismissSplash);
    video.addEventListener('error', function () {
      /* Keep the original splash visible and let the safety timeout dismiss it. */
      splash.classList.remove('video-active');
      if (video && video.parentNode) video.parentNode.removeChild(video);
      video = null;
      if (soundHint && soundHint.parentNode) soundHint.parentNode.removeChild(soundHint);
      soundHint = null;
    });

    splash.appendChild(video);
    splash.appendChild(soundHint);

    /* First try muted autoplay — the browser-safe path. */
    video.play().catch(function () {
      showSoundHint();
    });

    var gesture = function () {
      enableSound();
      window.removeEventListener('touchstart', gesture);
      window.removeEventListener('click', gesture);
    };
    window.addEventListener('touchstart', gesture, { once: true, passive: true });
    window.addEventListener('click', gesture, { once: true });
  }

  function init() {
    splash = document.getElementById('splashScreen');
    if (!splash) return;

    splash.setAttribute('aria-hidden', 'false');
    initVideoSplash();

    /* Hard safety net: the app can never remain blocked by the splash. */
    window.setTimeout(dismissSplash, MAX_SPLASH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
