// ── Gare du Clou · Rhizom-Engine ──
// Panel-Modus: Klick öffnet Inhalt rechts, Rhizom bleibt sichtbar.

(function () {
  var K = window.__GDC_KNOTEN__ || [];
  if (!K.length) return;

  var COL = { spurweite: "#ff0000", passage: "#39b34a", ankunft: "#afafaf" };
  var RL = { spurweite: "spur||weite", passage: "/passage/", ankunft: "an//kunft" };

  // Lookup
  var KM = {};
  for (var i = 0; i < K.length; i++) KM[K[i].id] = K[i];

  // Bidirektionale Bezüge
  for (var i = 0; i < K.length; i++) {
    var n = K[i];
    if (!n.bezuege) n.bezuege = [];
    for (var j = 0; j < n.bezuege.length; j++) {
      var t = KM[n.bezuege[j]];
      if (t && t.bezuege.indexOf(n.id) < 0) t.bezuege.push(n.id);
    }
  }

  // State
  var lang = "de", activeId = null, hoverId = null;
  var activeLayers = {};
  var px = {}, py = {}, vx = {}, vy = {};
  var canvas, ctx, W, H, dpr;
  var frame = 0;

  canvas = document.getElementById("c");
  if (!canvas) return;
  ctx = canvas.getContext("2d");

  var panel = document.getElementById("panel");
  var panels = document.querySelectorAll(".panel-stueck");

  function sz() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function place() {
    for (var i = 0; i < K.length; i++) {
      var a = (i / K.length) * Math.PI * 2;
      var rad = Math.min(W, H) * 0.25;
      px[K[i].id] = W / 2 + Math.cos(a) * rad + (Math.random() - 0.5) * 80;
      py[K[i].id] = H / 2 + Math.sin(a) * rad + (Math.random() - 0.5) * 80;
      vx[K[i].id] = 0;
      vy[K[i].id] = 0;
    }
  }

  function phys() {
    var aw = activeId ? W - 363 : W;
    for (var i = 0; i < K.length; i++) {
      var n = K[i], fx = 0, fy = 0;
      for (var j = 0; j < K.length; j++) {
        if (i === j) continue;
        var dx = px[n.id] - px[K[j].id];
        var dy = py[n.id] - py[K[j].id];
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        fx += (dx / d) * 5000 / (d * d);
        fy += (dy / d) * 5000 / (d * d);
      }
      for (var k = 0; k < n.bezuege.length; k++) {
        var ci = n.bezuege[k];
        if (!px[ci]) continue;
        fx += (px[ci] - px[n.id]) * 0.006;
        fy += (py[ci] - py[n.id]) * 0.006;
      }
      fx += (aw / 2 - px[n.id]) * 0.004;
      fy += (H / 2 - py[n.id]) * 0.004;
      vx[n.id] = (vx[n.id] + fx) * 0.8;
      vy[n.id] = (vy[n.id] + fy) * 0.8;
    }
    for (var i = 0; i < K.length; i++) {
      px[K[i].id] += vx[K[i].id];
      py[K[i].id] += vy[K[i].id];
      px[K[i].id] = Math.max(80, Math.min((activeId ? W - 443 : W - 80), px[K[i].id]));
      py[K[i].id] = Math.max(70, Math.min(H - 60, py[K[i].id]));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var an = activeId ? KM[activeId] : null;
    var cs = {};
    if (an) for (var i = 0; i < an.bezuege.length; i++) cs[an.bezuege[i]] = true;

    // Kanten
    for (var i = 0; i < K.length; i++) {
      var n = K[i];
      for (var k = 0; k < n.bezuege.length; k++) {
        var ci = n.bezuege[k];
        if (!px[ci]) continue;
        if (n.id > ci) continue;
        var act = activeId && (activeId === n.id || activeId === ci);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px[n.id], py[n.id]);
        ctx.lineTo(px[ci], py[ci]);
        ctx.strokeStyle = act ? COL[n.register] : "#404040";
        ctx.globalAlpha = act ? 0.6 : 0.4;
        ctx.lineWidth = act ? 1.5 : 0.5;
        if (!act) ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Knoten
    for (var i = 0; i < K.length; i++) {
      var n = K[i];
      var isA = activeId === n.id;
      var isH = hoverId === n.id;
      var isC = !!cs[n.id];
      var br = n.register === "ankunft" ? 6 : n.register === "passage" ? 9 : 11;
      var rr = (isA || isH) ? br + 5 : br;
      var col = COL[n.register];

      ctx.save();
      if (activeId) ctx.globalAlpha = isA ? 1 : isC ? 0.75 : 0.15;
      else if (hoverId) ctx.globalAlpha = isH ? 1 : isC ? 0.75 : 0.15;
      else ctx.globalAlpha = 0.7;

      ctx.beginPath();
      ctx.arc(px[n.id], py[n.id], rr, 0, Math.PI * 2);
      ctx.fillStyle = isA ? col : "#000000";
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = isA ? 2.5 : isH ? 2 : 1;
      ctx.stroke();

      if (!activeId && !hoverId || isA || isH || isC) {
        var lb = lang === "en" ? (n.en || n.de) : n.de;
        if (lb.length > 28) lb = lb.substring(0, 26) + "\u2026";
        ctx.font = ((isA || isH) ? "13" : "11") + "px 'Snv Cond D', Georgia, serif";
        ctx.fillStyle = (isA || isH) ? "#ffffff" : "#afafaf";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(lb, px[n.id], py[n.id] - rr - 6);
      }
      ctx.restore();
    }

    // Hint
    var h = document.getElementById("hint");
    if (h) {
      h.textContent = activeId ? "" :
        (lang === "de"
          ? "Einen Knoten anklicken, um einzutreten. Kein Anfang. Kein Men\u00FC."
          : "Click a node to enter. No beginning. No menu.");
    }
  }

  function loop() {
    if (frame < 300) { phys(); frame++; }
    draw();
    if (frame < 300) requestAnimationFrame(loop);
  }

  // ── Hit-Test ──
  function hit(mx, my) {
    var best = null, bd = 30;
    for (var i = 0; i < K.length; i++) {
      var dx = mx - px[K[i].id], dy = my - py[K[i].id];
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bd) { bd = d; best = K[i].id; }
    }
    return best;
  }

  // ── Panel öffnen ──
  function sel(id) {
    activeId = id;
    activeLayers = { kern: true };

    // Alle Panel-Inhalte verstecken, aktives zeigen
    panels.forEach(function (p) { p.style.display = "none"; });
    var target = document.querySelector('[data-panel="' + id + '"]');
    if (target) target.style.display = "block";

    panel.classList.add("open");

    // Schichten-Sichtbarkeit
    updateLayers(id);

    // Layer-Buttons initialisieren
    var btns = document.querySelectorAll('[data-layer][data-for="' + id + '"]');
    btns.forEach(function (b) {
      var lid = b.getAttribute("data-layer");
      if (b.classList.contains("off")) return;
      b.classList.toggle("on", !!activeLayers[lid]);
    });

    frame = 0;
    loop();
  }

  function updateLayers(id) {
    var target = document.querySelector('[data-panel="' + id + '"]');
    if (!target) return;
    var secs = target.querySelectorAll("section[data-schicht]");
    secs.forEach(function (sec) {
      var s = sec.getAttribute("data-schicht");
      sec.style.display = activeLayers[s] ? "" : "none";
    });
  }

  function closePanel() {
    activeId = null;
    panel.classList.remove("open");
    frame = 0;
    loop();
  }

  // ── Events ──
  canvas.addEventListener("click", function (e) {
    var id = hit(e.clientX, e.clientY);
    if (id) sel(id);
  });

  canvas.addEventListener("mousemove", function (e) {
    var id = hit(e.clientX, e.clientY);
    if (id !== hoverId) {
      hoverId = id;
      canvas.style.cursor = id ? "pointer" : "default";
      if (!activeId) draw();
    }
  });

  canvas.addEventListener("mouseleave", function () {
    hoverId = null;
    canvas.style.cursor = "default";
    if (!activeId) draw();
  });

  // Schließen
  document.getElementById("cb").addEventListener("click", closePanel);

  // Layer-Toggle (Event-Delegation)
  document.getElementById("pc").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-layer]");
    if (!btn || !activeId) return;
    var lid = btn.getAttribute("data-layer");
    if (lid === "kern" || btn.classList.contains("off")) return;

    activeLayers[lid] = !activeLayers[lid];
    btn.classList.toggle("on", !!activeLayers[lid]);
    updateLayers(activeId);
  });

  // Bezüge-Navigation (Event-Delegation)
  document.getElementById("pc").addEventListener("click", function (e) {
    var bzb = e.target.closest("[data-goto]");
    if (!bzb) return;
    sel(bzb.getAttribute("data-goto"));
  });

  // Sprache
  var lb = document.getElementById("langBtn");
  if (lb) {
    lb.addEventListener("click", function () {
      lang = lang === "de" ? "en" : "de";
      this.textContent = lang === "de" ? "DE \u2192 EN" : "EN \u2192 DE";
      draw();
    });
  }

  window.addEventListener("resize", function () { sz(); frame = 0; loop(); });

  // ── Start ──
  sz();
  place();
  loop();
})();
