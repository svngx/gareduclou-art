// ── Gare du Clou · Rhizom-Engine ──
// Liest Knoten aus window.__GDC_KNOTEN__ (gesetzt von index.astro)
// Navigiert bei Klick zur Stück-Seite

(function () {
  var K = window.__GDC_KNOTEN__ || [];
  if (!K.length) return;

  var COL = { spurweite: "#6b8f71", passage: "#8a7f65", ankunft: "#8f6b6b" };
  var RL = { spurweite: "spur||weite", passage: "/passage/", ankunft: "an//kunft" };

  // Lookup
  var KM = {};
  for (var i = 0; i < K.length; i++) KM[K[i].id] = K[i];

  // Bidirektionale Bezüge berechnen
  for (var i = 0; i < K.length; i++) {
    var n = K[i];
    if (!n.bezuege) n.bezuege = [];
    for (var j = 0; j < n.bezuege.length; j++) {
      var t = KM[n.bezuege[j]];
      if (t && t.bezuege.indexOf(n.id) < 0) {
        t.bezuege.push(n.id);
      }
    }
  }

  // State
  var lang = "de", hoverId = null;
  var px = {}, py = {}, vx = {}, vy = {};
  var canvas, ctx, W, H, dpr;
  var frame = 0;

  canvas = document.getElementById("c");
  if (!canvas) return;
  ctx = canvas.getContext("2d");

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
    for (var i = 0; i < K.length; i++) {
      var n = K[i], fx = 0, fy = 0;
      // Abstoßung
      for (var j = 0; j < K.length; j++) {
        if (i === j) continue;
        var dx = px[n.id] - px[K[j].id];
        var dy = py[n.id] - py[K[j].id];
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        fx += (dx / d) * 5000 / (d * d);
        fy += (dy / d) * 5000 / (d * d);
      }
      // Anziehung entlang Bezüge
      for (var k = 0; k < n.bezuege.length; k++) {
        var ci = n.bezuege[k];
        if (!px[ci]) continue;
        fx += (px[ci] - px[n.id]) * 0.006;
        fy += (py[ci] - py[n.id]) * 0.006;
      }
      // Zentrierung
      fx += (W / 2 - px[n.id]) * 0.004;
      fy += (H / 2 - py[n.id]) * 0.004;
      vx[n.id] = (vx[n.id] + fx) * 0.8;
      vy[n.id] = (vy[n.id] + fy) * 0.8;
    }
    for (var i = 0; i < K.length; i++) {
      px[K[i].id] += vx[K[i].id];
      py[K[i].id] += vy[K[i].id];
      px[K[i].id] = Math.max(80, Math.min(W - 80, px[K[i].id]));
      py[K[i].id] = Math.max(70, Math.min(H - 60, py[K[i].id]));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var hov = hoverId ? KM[hoverId] : null;
    var cs = {};
    if (hov) {
      for (var i = 0; i < hov.bezuege.length; i++) cs[hov.bezuege[i]] = true;
    }

    // Kanten
    for (var i = 0; i < K.length; i++) {
      var n = K[i];
      for (var k = 0; k < n.bezuege.length; k++) {
        var ci = n.bezuege[k];
        if (!px[ci]) continue;
        // Nur einmal zeichnen (id-Vergleich)
        if (n.id > ci) continue;
        var act = hoverId && (hoverId === n.id || hoverId === ci);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px[n.id], py[n.id]);
        ctx.lineTo(px[ci], py[ci]);
        ctx.strokeStyle = act ? COL[n.register] : "#333";
        ctx.globalAlpha = act ? 0.45 : 0.12;
        ctx.lineWidth = act ? 1.5 : 0.5;
        if (!act) ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Knoten
    for (var i = 0; i < K.length; i++) {
      var n = K[i];
      var isH = hoverId === n.id;
      var isC = !!cs[n.id];
      var br = n.register === "ankunft" ? 6 : n.register === "passage" ? 9 : 11;
      var rr = isH ? br + 5 : br;
      var col = COL[n.register];

      ctx.save();
      if (hoverId) ctx.globalAlpha = isH ? 1 : isC ? 0.75 : 0.15;
      else ctx.globalAlpha = 0.7;

      ctx.beginPath();
      ctx.arc(px[n.id], py[n.id], rr, 0, Math.PI * 2);
      ctx.fillStyle = isH ? col : "#141414";
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = isH ? 2.5 : 1;
      ctx.stroke();

      if (!hoverId || isH || isC) {
        var lb = lang === "en" ? (n.en || n.de) : n.de;
        if (lb.length > 28) lb = lb.substring(0, 26) + "\u2026";
        ctx.font = (isH ? "13" : "10") + "px Georgia, serif";
        ctx.fillStyle = isH ? "#e8e4df" : "#8a857e";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(lb, px[n.id], py[n.id] - rr - 6);
      }
      ctx.restore();
    }

    // Hint
    var h = document.getElementById("hint");
    if (h) {
      h.textContent = lang === "de"
        ? "Einen Knoten anklicken, um einzutreten. Kein Anfang. Kein Men\u00FC."
        : "Click a node to enter. No beginning. No menu.";
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

  // ── Events ──
  canvas.addEventListener("click", function (e) {
    var id = hit(e.clientX, e.clientY);
    if (id) {
      // Navigation zur Stück-Seite
      window.location.href = "/" + id;
    }
  });

  canvas.addEventListener("mousemove", function (e) {
    var id = hit(e.clientX, e.clientY);
    if (id !== hoverId) {
      hoverId = id;
      canvas.style.cursor = id ? "pointer" : "default";
      draw();
    }
  });

  canvas.addEventListener("mouseleave", function () {
    hoverId = null;
    canvas.style.cursor = "default";
    draw();
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

  window.addEventListener("resize", function () {
    sz();
    frame = 0;
    loop();
  });

  // ── Start ──
  sz();
  place();
  loop();
})();
