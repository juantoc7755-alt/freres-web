/* =========================================================
   FRERE'S · Diseño 3 · Interacciones
   Cabecera, menú móvil, selector de idioma, apariciones,
   regla de la cita, estado "abierto ahora" y día de hoy.
   Los textos llegan en el idioma de la página (#pageData).
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var UI = {};
  try { UI = JSON.parse($("#pageData").textContent).ui || {}; } catch (e) {}

  /* ---------- Al recargar, siempre arriba ---------- */
  // El navegador recordaría el scroll (o saltaría al #ancla de la URL). Al recargar se quita el
  // ancla y se vuelve al principio; al entrar desde un enlace con #ancla se respeta el ancla.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var navEntry = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  var isReload = navEntry ? navEntry.type === "reload" : !!(window.performance && performance.navigation && performance.navigation.type === 1);
  if (isReload) {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    var toTop = function () { window.scrollTo(0, 0); };
    toTop();
    window.addEventListener("load", function () { toTop(); requestAnimationFrame(toTop); });
  }

  /* ---------- Año ---------- */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Cabecera ---------- */
  var header = $("#header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  var toggle = $("#navToggle"), mnav = $("#mobileNav");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (UI.menuAbrir) toggle.setAttribute("aria-label", open ? UI.menuCerrar : UI.menuAbrir);
    }
    if (mnav) mnav.setAttribute("aria-hidden", open ? "false" : "true");
  }
  if (toggle) toggle.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  $$(".mobile-nav a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });

  /* ---------- Selector de idioma ---------- */
  var langs = $(".langs");
  function closeLangs() { if (langs) langs.open = false; }
  document.addEventListener("click", function (e) { if (langs && langs.open && !langs.contains(e.target)) closeLangs(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setNav(false); closeLangs(); } });

  /* ---------- Apariciones + regla de la cita ---------- */
  var revealTargets = ".head, .hero__copy, .facts__row, .board, .about__photo, .about__copy, .gallery__item, .visit__grid > *, .book__card";
  $$(revealTargets).forEach(function (el) { el.classList.add("reveal"); });
  var ruler = $("#ruler");

  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
    if (ruler) io.observe(ruler);
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    if (ruler) ruler.classList.add("is-in");
  }

  /* ---------- Horario: abierto ahora + día de hoy ---------- */
  // El horario se lee de la propia tabla (generada desde _fuente/datos.json), así nunca se desincroniza.
  // Minutos desde medianoche. 0 = domingo … 6 = sábado.
  var HOURS = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  $$(".hours tr[data-day]").forEach(function (tr) {
    var day = parseInt(tr.getAttribute("data-day"), 10);
    $$("td", tr).forEach(function (td) {
      var m = td.textContent.match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
      if (m) HOURS[day].push([+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]]);
    });
  });

  function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return h + ":" + (mm < 10 ? "0" : "") + mm; }
  function fill(tpl, vars) { return tpl.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ""; }); }

  function nowInReus() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      return { day: day, min: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
    } catch (e) {
      var d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function statusText(now) {
    if (!UI.abierto) return null;
    var today = HOURS[now.day];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) return { open: true, text: fill(UI.abierto, { t: hhmm(today[i][1]) }) };
      if (now.min < today[i][0]) return { open: false, text: fill(UI.cerradoHoy, { t: hhmm(today[i][0]) }) };
    }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (HOURS[d].length) {
        var when = k === 1 ? UI.manana : UI.dias[d];
        return { open: false, text: fill(UI.cerradoLuego, { cuando: when, t: hhmm(HOURS[d][0][0]) }) };
      }
    }
    return null;
  }

  function paintHours() {
    var now = nowInReus();
    var st = statusText(now), el = $("#openStatus");
    if (st && el) {
      $(".status__text", el).textContent = st.text;
      el.classList.toggle("is-open", st.open);
      el.hidden = false;
    }
    $$(".hours tr").forEach(function (tr) {
      tr.classList.toggle("is-today", parseInt(tr.getAttribute("data-day"), 10) === now.day);
    });
  }
  paintHours();
  setInterval(paintHours, 60000);

  /* ---------- Vídeo del espejo (móvil) ---------- */
  var heroVideo = $("#heroVideo");
  if (heroVideo) {
    if (reduce) { heroVideo.removeAttribute("autoplay"); heroVideo.pause(); }
    else {
      var tryPlay = function () { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); };
      tryPlay();
      document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
    }
  }
})();
