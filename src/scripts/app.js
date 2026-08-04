/* TattooDesignsCo - клиентские утилиты.
 *
 * Всё работает без сервера и без регистрации (DESIGN.md §7).
 * Скрипт грузится с defer и не блокирует рендер; если JS не выполнится,
 * страница остаётся полностью рабочей - карточки это ссылки, FAQ на
 * <details>, фильтры на <a href>.
 */
(function () {
  'use strict';

  var KEY = 'tdc.saved.v1';

  /* --- Хранилище подборки ------------------------------------------------ */

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function write(map) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(map));
    } catch (e) {
      /* приватный режим или переполнение - молча продолжаем */
    }
  }

  function count(map) {
    return Object.keys(map).length;
  }

  /* --- Save-кнопки ------------------------------------------------------- */

  function sortedIds(map) {
    return Object.keys(map).sort(function (a, b) {
      return (map[b].at || 0) - (map[a].at || 0);
    });
  }

  function paintCount(map) {
    var n = count(map);

    /* Бейдж в шапке */
    document.querySelectorAll('[data-saved-count]').forEach(function (el) {
      el.textContent = n ? String(n) : '';
      el.hidden = n === 0;
    });

    /* Подписи «N saved» / «N ideas saved» - форма берётся из исходного текста */
    document.querySelectorAll('[data-saved-count-text]').forEach(function (el) {
      var long = /idea/i.test(el.textContent || '');
      var noun = n === 1 ? 'idea' : 'ideas';
      el.textContent = long ? n + ' ' + noun + ' saved' : n + ' saved';
    });

    paintThumbs(map);
  }

  /* --- Превью подборки в блоке «Build your shortlist» -------------------- */

  function paintThumbs(map) {
    var host = document.querySelector('[data-shortlist-thumbs]');
    if (!host) return;

    var ids = sortedIds(map).slice(0, 4);

    if (!ids.length) {
      host.innerHTML =
        '<li class="empty small muted">Tap the bookmark on any idea to add it here.</li>';
      return;
    }

    host.innerHTML = ids
      .map(function (id) {
        var item = map[id];
        var title = (item.title || '').replace(/"/g, '&quot;');
        return (
          '<li><a href="' + id + '" title="' + title + '">' +
          '<img src="/images/' + item.image + '-400.webp" alt="" ' +
          'width="400" height="533" loading="lazy" decoding="async"></a></li>'
        );
      })
      .join('');
  }

  function initSave() {
    var map = read();
    var buttons = document.querySelectorAll('[data-save]');

    buttons.forEach(function (btn) {
      var id = btn.getAttribute('data-save');
      btn.setAttribute('aria-pressed', map[id] ? 'true' : 'false');

      btn.addEventListener('click', function () {
        var current = read();
        if (current[id]) {
          delete current[id];
          btn.setAttribute('aria-pressed', 'false');
        } else {
          current[id] = {
            title: btn.getAttribute('data-save-title') || '',
            image: btn.getAttribute('data-save-image') || '',
            at: Date.now(),
          };
          btn.setAttribute('aria-pressed', 'true');
        }
        write(current);
        paintCount(current);
      });
    });

    paintCount(map);
  }

  /* --- «Скопировать описание для мастера» -------------------------------- */

  function initBrief() {
    var button = document.querySelector('[data-brief-copy]');
    var input = document.querySelector('[data-brief-input]');
    if (!button || !input) return;

    var label = button.querySelector('[data-brief-label]');
    var original = label ? label.textContent : '';
    var timer = null;

    button.addEventListener('click', function () {
      var text = input.value;

      var done = function () {
        if (!label) return;
        label.textContent = 'Copied';
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          label.textContent = original;
        }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }

      function fallback() {
        input.removeAttribute('readonly');
        input.select();
        try {
          document.execCommand('copy');
          done();
        } catch (e) {
          /* пользователь скопирует вручную - текст уже выделен */
        }
        input.setAttribute('readonly', 'readonly');
      }
    });
  }

  /* --- Страница подборки -------------------------------------------------- */

  function initSavedPage() {
    var host = document.querySelector('[data-saved-list]');
    if (!host) return;

    var map = read();
    var ids = sortedIds(map);

    if (!ids.length) {
      host.innerHTML =
        '<p class="muted">Nothing saved yet. Tap the bookmark on any idea to add it here.</p>';
      return;
    }

    var html = ids
      .map(function (id) {
        var item = map[id];
        var src = '/images/' + item.image;
        return (
          '<article class="saved-item">' +
          '<a href="' + id + '">' +
          '<img src="' + src + '-400.webp" alt="" width="400" height="533" loading="lazy">' +
          '<span>' + item.title + '</span>' +
          '</a></article>'
        );
      })
      .join('');

    host.innerHTML = html;
  }

  /* --- Share --------------------------------------------------------------
   * Web Share API там, где он есть (в основном мобильные), иначе копируем
   * ссылку в буфер. Никаких сторонних скриптов шеринга: они тянут вес и
   * трекеры, а бюджет по Core Web Vitals в этой нише уже израсходован
   * изображениями.
   */
  function initShare() {
    document.querySelectorAll('[data-share]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var title = btn.getAttribute('data-share') || document.title;
        var url = window.location.href;
        var label = btn.querySelector('span');
        var original = label ? label.textContent : '';

        if (navigator.share) {
          navigator.share({ title: title, url: url }).catch(function () {});
          return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            if (!label) return;
            label.textContent = 'Link copied';
            window.setTimeout(function () {
              label.textContent = original;
            }, 1800);
          });
        }
      });
    });
  }

  /* Лайтбокс, DESIGN.md §5
   * Крупное изображение, Save, подпись с параметрами, стрелки, кнопка
   * «скопировать описание для мастера». Закрывается по фону, свайпом вниз и
   * по Esc: модалок, требующих попадания в крестик, спека не допускает.
   *
   * Разметка создаётся здесь, а не в HTML: без JS плитки остаются либо
   * ссылками на страницы идей, либо обычными изображениями, и ни одного
   * лишнего байта в документ не попадает.
   */
  function initLightbox() {
    var tiles = [].slice.call(document.querySelectorAll('[data-gal]'));
    if (!tiles.length) return;

    var lb = null;
    var el = {};
    var current = -1;
    var lastFocus = null;

    function build() {
      lb = document.createElement('div');
      lb.className = 'lb';
      lb.hidden = true;
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Tattoo idea');
      lb.innerHTML =
        '<button class="lb-close" type="button" aria-label="Close">✕</button>' +
        '<div class="lb-inner">' +
        '<button class="lb-nav lb-prev" type="button" aria-label="Previous idea">‹</button>' +
        '<button class="lb-nav lb-next" type="button" aria-label="Next idea">›</button>' +
        '<div class="lb-figure"><img class="lb-img" alt=""></div>' +
        '<div class="lb-meta">' +
        '<p class="lb-caption"></p>' +
        '<div class="lb-actions">' +
        '<button class="btn btn-outline lb-save" type="button" aria-pressed="false">Save idea</button>' +
        '<a class="btn btn-outline lb-pin" target="_blank" rel="noopener nofollow">Pin</a>' +
        '<button class="btn btn-primary lb-copy" type="button">Copy description</button>' +
        '<a class="btn btn-outline lb-details" hidden>View details</a>' +
        '</div>' +
        '<p class="lb-hint">Swipe down, tap the background or press Esc to close.</p>' +
        '</div></div>';

      document.body.appendChild(lb);

      el.inner = lb.querySelector('.lb-inner');
      el.img = lb.querySelector('.lb-img');
      el.caption = lb.querySelector('.lb-caption');
      el.save = lb.querySelector('.lb-save');
      el.pin = lb.querySelector('.lb-pin');
      el.copy = lb.querySelector('.lb-copy');
      el.details = lb.querySelector('.lb-details');
      el.prev = lb.querySelector('.lb-prev');
      el.next = lb.querySelector('.lb-next');

      lb.addEventListener('click', function (e) {
        if (!el.inner.contains(e.target)) close();
      });
      lb.querySelector('.lb-close').addEventListener('click', close);
      el.prev.addEventListener('click', function () { show(current - 1); });
      el.next.addEventListener('click', function () { show(current + 1); });
      el.save.addEventListener('click', toggleSave);
      el.copy.addEventListener('click', copyBrief);

      /* Свайп вниз закрывает */
      var y0 = null;
      el.inner.addEventListener('touchstart', function (e) {
        y0 = e.touches[0].clientY;
      }, { passive: true });

      el.inner.addEventListener('touchmove', function (e) {
        if (y0 === null) return;
        var dy = e.touches[0].clientY - y0;
        if (dy > 0) {
          el.inner.style.transform = 'translateY(' + dy + 'px)';
          el.inner.style.opacity = String(Math.max(0.3, 1 - dy / 400));
        }
      }, { passive: true });

      el.inner.addEventListener('touchend', function (e) {
        var dy = e.changedTouches[0].clientY - (y0 || 0);
        el.inner.style.transform = '';
        el.inner.style.opacity = '';
        y0 = null;
        if (dy > 90) close();
      });
    }

    function brief(d) {
      return [
        (d.style || '').toLowerCase(),
        '~' + (d.size || ''),
        (d.placement || '').toLowerCase(),
        (d.color || '').toLowerCase()
      ].filter(Boolean).join(', ');
    }

    function show(i) {
      if (i < 0 || i >= tiles.length) return;
      current = i;

      var d = tiles[i].dataset;
      var base = '/images/' + d.image;

      el.img.src = base + '-1200.webp';
      el.img.srcset = base + '-800.webp 800w, ' + base + '-1200.webp 1200w';
      el.img.sizes = '(min-width: 900px) 900px, 96vw';
      el.img.alt = d.alt || '';

      el.caption.innerHTML =
        '<span class="lb-count">' + (i + 1) + ' / ' + tiles.length + '</span>' +
        [d.placement, d.size, d.style, d.color].filter(Boolean).join(' · ');

      el.pin.href =
        'https://www.pinterest.com/pin/create/button/?url=' +
        encodeURIComponent(location.origin + (d.href || location.pathname)) +
        '&media=' + encodeURIComponent(location.origin + base + '-1200.webp') +
        '&description=' + encodeURIComponent(d.alt || '');

      if (d.href) {
        el.details.href = d.href;
        el.details.hidden = false;
      } else {
        el.details.hidden = true;
      }

      el.save.setAttribute('aria-pressed', read()[d.id] ? 'true' : 'false');
      el.save.textContent = read()[d.id] ? 'Saved' : 'Save idea';

      el.prev.disabled = i === 0;
      el.next.disabled = i === tiles.length - 1;

      /* Подгружаем соседа заранее, чтобы листание не мигало */
      var nxt = tiles[i + 1];
      if (nxt) new Image().src = '/images/' + nxt.dataset.image + '-1200.webp';
    }

    function toggleSave() {
      var d = tiles[current].dataset;
      var map = read();

      if (map[d.id]) delete map[d.id];
      else map[d.id] = { title: d.alt || '', image: d.image, at: Date.now() };

      write(map);
      paintCount(map);

      var on = Boolean(map[d.id]);
      el.save.setAttribute('aria-pressed', on ? 'true' : 'false');
      el.save.textContent = on ? 'Saved' : 'Save idea';

      /* Синхронизируем кнопку на самой плитке */
      var btn = tiles[current].querySelector('[data-save]');
      if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    function copyBrief() {
      var text = brief(tiles[current].dataset);
      var done = function () {
        el.copy.textContent = 'Copied';
        window.setTimeout(function () {
          el.copy.textContent = 'Copy description';
        }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      }
    }

    function open(i) {
      if (!lb) build();
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      show(i);
      el.inner.querySelector('.lb-close, .lb-next, .lb-save').focus();
      document.addEventListener('keydown', onKey);
    }

    function close() {
      if (!lb) return;
      lb.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    }

    tiles.forEach(function (tile, i) {
      var hit = tile.querySelector('[data-open]');
      if (!hit) return;

      hit.addEventListener('click', function (e) {
        /* Ctrl/Cmd-клик и средняя кнопка: обычный переход по ссылке */
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        open(i);
      });
    });
  }

  function boot() {
    initSave();
    initBrief();
    initShare();
    initLightbox();
    initSavedPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
