/* =========================================================
   FRERE'S · Asistente "Frankie"
   Chat de ayuda 100% en el navegador (sin backend). Responde a
   preguntas frecuentes sobre precios, horarios, ubicación,
   servicios y reservas, y deriva a WhatsApp cuando hace falta.
   Las respuestas y palabras clave llegan en el idioma de la
   página (#pageData, generado desde _fuente/textos/*.json).
   ========================================================= */
(function () {
  "use strict";

  var launcher = document.getElementById("assistantLauncher");
  var panel = document.getElementById("assistant");
  var log = document.getElementById("assistantLog");
  var form = document.getElementById("assistantForm");
  var input = document.getElementById("assistantInput");
  var closeBtn = document.getElementById("assistantClose");
  var chips = document.getElementById("assistantChips");
  if (!launcher || !panel || !log) return;

  var A;
  try { A = JSON.parse(document.getElementById("pageData").textContent).asistente; } catch (e) { return; }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var started = false;

  var waCta = '<a class="amsg__cta" href="' + A.wa + '" target="_blank" rel="noopener">' +
    '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24z"/></svg>' +
    " " + A.cta + "</a>";

  // Minúsculas, sin acentos y con la puntuación convertida en espacios. Una palabra clave
  // escrita con espacios alrededor (" hi ") solo coincide con la palabra entera.
  function normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9€]+/g, " ");
  }
  var INTENTS = (A.intents || []).map(function (it) {
    return {
      keys: it.keys.map(function (k) { var n = normalize(k); return /^\s|\s$/.test(k) ? n : n.trim(); }),
      reply: it.reply + (it.cta ? waCta : ""),
      peso: it.peso || 1
    };
  });

  function answer(text) {
    var t = " " + normalize(text) + " ";
    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var score = 0;
      it.keys.forEach(function (k) { if (k && t.indexOf(k) >= 0) score += it.peso; });
      if (score > bestScore) { bestScore = score; best = it; }
    });
    return best ? best.reply : A.fallback + waCta;
  }

  // ---- Render de mensajes ----
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addUser(text) {
    var el = document.createElement("div");
    el.className = "amsg amsg--user";
    el.innerHTML = esc(text);
    log.appendChild(el);
    scrollDown();
  }
  function addBot(html) {
    var el = document.createElement("div");
    el.className = "amsg amsg--bot";
    el.innerHTML = html;
    log.appendChild(el);
    scrollDown();
  }
  function typing() {
    var el = document.createElement("div");
    el.className = "amsg amsg--bot amsg--typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(el);
    scrollDown();
    return el;
  }
  function botReply(text) {
    if (reduce) { addBot(answer(text)); return; }
    var t = typing();
    setTimeout(function () {
      t.remove();
      addBot(answer(text));
    }, 650 + Math.random() * 400);
  }

  // ---- Apertura / cierre ----
  function open() {
    panel.hidden = false;
    document.body.classList.add("assistant-open");
    launcher.setAttribute("aria-expanded", "true");
    if (!started) {
      started = true;
      var t = typing();
      setTimeout(function () {
        t.remove();
        addBot(A.saludo);
      }, reduce ? 0 : 500);
    }
    setTimeout(function () { if (input) input.focus(); }, 320);
  }
  function close() {
    panel.hidden = true;
    document.body.classList.remove("assistant-open");
    launcher.setAttribute("aria-expanded", "false");
  }
  function toggle() { panel.hidden ? open() : close(); }

  launcher.addEventListener("click", toggle);
  if (closeBtn) closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = (input.value || "").trim();
    if (!v) return;
    addUser(v);
    input.value = "";
    botReply(v);
  });

  if (chips) chips.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-q]");
    if (!btn) return;
    var q = btn.getAttribute("data-q");
    addUser(q);
    botReply(q);
  });
})();
