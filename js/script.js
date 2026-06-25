/* ============================================================
   동작 스크립트 (앨범 버전) — 직접 고칠 필요 없습니다.
   PHOTOS = [ { title, date, photos:[...] }, ... ]
   각 작업(work)은 사진 여러 장(앨범)을 가질 수 있습니다.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 첫 진입 인트로 ---------- */
  (function initIntro() {
    var intro = document.getElementById("intro");
    if (!intro) return;
    var shown = false;
    try { shown = sessionStorage.getItem("introShown") === "1"; } catch (e) {}
    if (shown) { if (intro.parentNode) intro.parentNode.removeChild(intro); return; }
    try { sessionStorage.setItem("introShown", "1"); } catch (e) {}
    document.body.classList.add("intro-active");
    setTimeout(function () { intro.classList.add("intro--hide"); document.body.classList.remove("intro-active"); }, 1700);
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 2700);
  })();

  /* ---------- config 반영 ---------- */
  function applyConfig() {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var key = el.getAttribute("data-site");
      if (key === "name")          el.textContent = SITE.name;
      else if (key === "heroTitle")el.textContent = SITE.heroTitle;
      else if (key === "heroSub") {
        el.textContent = SITE.heroSub || "";
        if (!SITE.heroSub) el.style.display = "none";
      }
    });
    document.title = SITE.name || "Nail Portfolio";
    var y = document.getElementById("year");
    if (y) y.textContent = "2026";

    // 히어로 배경 사진
    var heroBg = document.getElementById("heroBg");
    if (heroBg && SITE.heroImage) {
      heroBg.style.backgroundImage = "url('" + encodeURI(SITE.heroImage) + "')";
      var hero = document.querySelector(".hero");
      if (hero) hero.classList.add("has-image");
    }

    buildContact();
  }

  function buildContact() {
    var box = document.getElementById("contactLinks");
    if (!box) return;
    var c = SITE.contact || {};
    var links = [];
    if (c.instagram) links.push({ label: "Instagram", href: c.instagram });
    if (c.kakao)     links.push({ label: "카카오톡",   href: c.kakao });
    if (c.email)     links.push({ label: "Email",     href: "mailto:" + c.email });
    if (c.phone)     links.push({ label: c.phone,      href: "tel:" + c.phone.replace(/[^0-9]/g, "") });
    if (!links.length) { box.closest(".contact").style.display = "none"; return; }
    box.innerHTML = links.map(function (l) {
      var ext = /^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : "";
      return '<a href="' + l.href + '"' + ext + ">" + esc(l.label) + "</a>";
    }).join("");
  }

  /* ---------- 데이터 (없으면 샘플) ---------- */
  var demoMode = !Array.isArray(PHOTOS) || PHOTOS.length === 0;
  var works = demoMode ? makeDemoWorks() : PHOTOS.slice();

  function makeDemoWorks() {
    var t = ["#efe7dd","#e7ddd2","#e3d6cb","#f0e8e1","#ddd2c6","#e9ddd0","#f1ebe3"];
    function sv(c,h){return placeholderSVG(c,h);}
    return [
      { title:"", date:"2026.06.20", photos:[sv(t[0],440), sv(t[1],360), sv(t[2],420)] },
      { title:"", date:"2026.06.12", photos:[sv(t[3],360)] },
      { title:"", date:"2026.05.30", photos:[sv(t[4],460), sv(t[5],340)] },
      { title:"", date:"2026.05.18", photos:[sv(t[6],380)] }
    ];
  }
  function placeholderSVG(bg, h) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="' + h + '">' +
      '<rect width="100%" height="100%" fill="' + bg + '"/>' +
      '<text x="50%" y="50%" fill="#b29f8c" font-family="serif" font-size="26" ' +
      'text-anchor="middle" dominant-baseline="middle" letter-spacing="6">SAMPLE</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function cleanName(name) {
    if (!name) return "";
    if (/^(img|dsc|dscn|kakaotalk|screenshot|photo|image|pic|_dsc)[\W_]*\d+/i.test(name)) return "";
    if (/^\d{6,}$/.test(name)) return "";
    return name;
  }

  /* ---------- 갤러리 렌더 ---------- */
  var gallery = document.getElementById("gallery");
  var emptyEl = document.getElementById("galleryEmpty");

  if (works.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
  } else {
    works.forEach(function (w, idx) {
      var nm = cleanName(w.title);
      var n = (w.photos || []).length;
      var card = document.createElement("figure");
      card.className = "card";
      card.dataset.index = idx;
      card.innerHTML =
        '<img loading="lazy" src="' + esc(w.photos[0]) + '" alt="' + esc(nm || w.date || "") + '" />' +
        (n > 1 ? '<span class="card__count">' + iconStack() + n + "</span>" : "") +
        '<figcaption class="card__overlay"><div>' +
          (w.date ? '<span class="card__date">' + esc(w.date) + "</span>" : "") +
          (nm ? '<div class="card__name">' + esc(nm) + "</div>" : "") +
        "</div></figcaption>";
      card.addEventListener("click", function () { openLightbox(idx); });
      gallery.appendChild(card);
      // blur-up: 사진 로딩이 끝나면 또렷하게
      var im = card.querySelector("img");
      if (im) {
        if (im.complete && im.naturalWidth) { im.classList.add("is-loaded"); }
        else {
          im.addEventListener("load", function () { im.classList.add("is-loaded"); });
          im.addEventListener("error", function () { im.classList.add("is-loaded"); });
        }
      }
    });
    revealOnScroll();
  }
  function iconStack() {
    return '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="13" height="13" rx="2"/>' +
      '<path d="M8 21h11a2 2 0 0 0 2-2V8"/></svg>';
  }

  if (demoMode) showDemoBanner();

  /* ---------- 라이트박스 (앨범 뷰어) ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCaption");
  var lbCounter = document.getElementById("lbCounter");
  var lbThumbs = document.getElementById("lbThumbs");
  var prevBtn = document.getElementById("lbPrev");
  var nextBtn = document.getElementById("lbNext");
  var curWork = 0, curSub = 0;

  function openLightbox(workIdx) {
    curWork = workIdx; curSub = 0; renderLightbox(); lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() { lb.hidden = true; document.body.style.overflow = ""; }

  function renderLightbox() {
    var w = works[curWork];
    var photos = w.photos || [];
    var multi = photos.length > 1;
    lbImg.src = photos[curSub];
    lbImg.alt = cleanName(w.title) || "";
    lbCap.textContent = [cleanName(w.title), w.date].filter(Boolean).join("  ·  ");
    lbCounter.textContent = multi ? (curSub + 1) + " / " + photos.length : "";
    prevBtn.style.display = multi ? "" : "none";
    nextBtn.style.display = multi ? "" : "none";
    if (multi) {
      lbThumbs.style.display = "";
      lbThumbs.innerHTML = photos.map(function (src, i) {
        return '<button class="lb-thumb' + (i === curSub ? " is-active" : "") + '" data-i="' + i + '">' +
          '<img src="' + esc(src) + '" alt=""></button>';
      }).join("");
      lbThumbs.querySelectorAll(".lb-thumb").forEach(function (b) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          curSub = parseInt(b.getAttribute("data-i"), 10); renderLightbox();
        });
      });
      var act = lbThumbs.querySelector(".lb-thumb.is-active");
      if (act && act.scrollIntoView) act.scrollIntoView({ block: "nearest", inline: "center" });
    } else {
      lbThumbs.style.display = "none";
      lbThumbs.innerHTML = "";
    }
  }
  function stepSub(dir) {
    var photos = works[curWork].photos || [];
    if (photos.length < 2) return;
    curSub = (curSub + dir + photos.length) % photos.length;
    renderLightbox();
  }

  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", function (e) { e.stopPropagation(); stepSub(-1); });
  nextBtn.addEventListener("click", function (e) { e.stopPropagation(); stepSub(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") stepSub(-1);
    else if (e.key === "ArrowRight") stepSub(1);
  });
  var touchX = null;
  lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) stepSub(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* ---------- 스크롤 등장 효과 ---------- */
  function revealOnScroll() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".card").forEach(function (c, i) {
      c.style.transitionDelay = (i % 3) * 0.08 + "s"; io.observe(c);
    });
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 메뉴/스크롤 ---------- */
  var nav = document.getElementById("nav");
  window.addEventListener("scroll", function () { nav.classList.toggle("is-scrolled", window.scrollY > 30); });
  var toggle = document.getElementById("navToggle");
  toggle.addEventListener("click", function () { document.body.classList.toggle("menu-open"); });
  document.querySelectorAll(".nav__links a").forEach(function (a) {
    a.addEventListener("click", function () { document.body.classList.remove("menu-open"); });
  });

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function showDemoBanner() {
    var b = document.createElement("div");
    b.className = "demo-banner";
    b.textContent = "샘플 화면입니다 · images 폴더에 사진(또는 작업 폴더)을 넣고 업데이트하세요";
    document.body.appendChild(b);
    setTimeout(function () { b.style.opacity = "0"; b.style.transition = "opacity .6s"; }, 6000);
  }

  applyConfig();
})();
