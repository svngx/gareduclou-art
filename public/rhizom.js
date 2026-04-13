// ── Gare du Clou · Rhizom-Engine ──
// Panel-Modus: Klick öffnet Inhalt rechts, Rhizom bleibt sichtbar.
// Farben + 3-Ring-Kreise: Figma Stand 13.04.2026

(function () {
  var K = window.__GDC_KNOTEN__ || [];
  if (!K.length) return;

  // Registerfarben (Figma-Tokens 13.04.2026)
  var COL = { spurweite: "#ff0000", passage: "#002395", ankunft: "#ffffff" };
  var RL = { spurweite: "spur||weite", passage: "/passage/", ankunft: "an//kunft" };

  // 3-Ring-Reihenfolge pro Register (außen → mitte → innen)
  var RINGS = {
    spurweite: ["#ff0000", "#ffffff", "#002395"],
    passage:   ["#002395", "#ffffff", "#ff0000"],
    ankunft:   ["#ffffff", "#ff0000", "#002395"]
  };

  // Basisradien pro Register (Figma: spur=75, passage=50, ankunft=35 → halbe Werte)
  var BASE_R = { spurweite: 37, passage: 25, ankunft: 17 };
  var HOVER_R = { spurweite: 50, passage: 25, ankunft: 17 };

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

    // Kanten (gestrichelt, #404040)
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
        ctx.strokeStyle = act ? COL[n.register] : "#666666";
        ctx.globalAlpha = act ? 0.8 : 0.6;
        ctx.lineWidth = act ? 1.5 : 1;
        if (!act) ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Knoten — 3 konzentrische Ringe
    for (var i = 0; i < K.length; i++) {
      var n = K[i];
      var isA = activeId === n.id;
      var isH = hoverId === n.id;
      var isC = !!cs[n.id];
      var big = isA || isH;
      var br = big ? HOVER_R[n.register] : BASE_R[n.register];
      var rings = RINGS[n.register];

      ctx.save();
      if (activeId) ctx.globalAlpha = isA ? 1 : isC ? 0.75 : 0.15;
      else if (hoverId) ctx.globalAlpha = isH ? 1 : isC ? 0.75 : 0.15;
      else ctx.globalAlpha = 0.7;

      // Ring 1 (außen) — bei active: gefüllt
      var r1 = br;
      ctx.beginPath();
      ctx.arc(px[n.id], py[n.id], r1, 0, Math.PI * 2);
      ctx.fillStyle = isA ? rings[0] : "#000000";
      ctx.fill();
      ctx.strokeStyle = rings[0];
      ctx.lineWidth = isA ? 2.5 : big ? 2 : 2;
      ctx.stroke();

      // Ring 2 (mitte)
      var r2 = r1 - (big ? 3 : 2);
      if (r2 > 2) {
        ctx.beginPath();
        ctx.arc(px[n.id], py[n.id], r2, 0, Math.PI * 2);
        ctx.strokeStyle = rings[1];
        ctx.lineWidth = big ? 2 : 1;
        ctx.stroke();
      }

      // Ring 3 (innen)
      var r3 = r2 - (big ? 3 : 2);
      if (r3 > 2) {
        ctx.beginPath();
        ctx.arc(px[n.id], py[n.id], r3, 0, Math.PI * 2);
        ctx.strokeStyle = rings[2];
        ctx.lineWidth = big ? 2 : 1;
        ctx.stroke();
      }

      // Label
      if (!activeId && !hoverId || isA || isH || isC) {
        var lb = lang === "en" ? (n.en || n.de) : n.de;
        if (lb.length > 28) lb = lb.substring(0, 26) + "\u2026";
        ctx.font = (big ? "13" : "11") + "px 'Snv Cond D', Georgia, serif";
        ctx.fillStyle = (isA || isH) ? "#ffffff" : "#afafaf";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(lb, px[n.id], py[n.id] - r1 - 6);
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
    var best = null, bd = 55;
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

    // Alle Panel-Inhalte verstecken, aktives zeigen (flex statt block)
    panels.forEach(function (p) { p.style.display = "none"; });
    var target = document.querySelector('[data-panel="' + id + '"]');
    if (target) target.style.display = "flex";

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
    panels.forEach(function (p) { p.style.display = "none"; });
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
