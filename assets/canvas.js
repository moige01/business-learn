// Lean Canvas interactivo y reutilizable.
// Uso: <div id="canvas" data-key="clave-unica" data-seed='{"problem":"texto"}'></div> + <ul id="checks"></ul> (opcional) + <div id="lc-actions"></div> (opcional)
// Guarda en localStorage (si está disponible), revisa reglas de Running Lean al instante y copia el canvas como texto.
(function () {
  const root = document.getElementById("canvas");
  if (!root) return;
  const KEY = "lc:" + (root.dataset.key || "default");
  const seed = JSON.parse(root.dataset.seed || "{}");
  // Orden de llenado de Running Lean (RL p.26-44); en pantallas anchas CSS lo coloca como lienzo.
  const F = [
    ["segments", "Segmentos de clientes", "Quién tiene el problema y quién paga. Cliente = quien paga.", 0],
    ["early", "Adoptante temprano", "El subconjunto concreto al que apuntas primero.", 1],
    ["problem", "Problema", "Top 1 a 3 problemas.", 0],
    ["alt", "Alternativas existentes", "Cómo lo resuelven hoy. \"No hacer nada\" cuenta.", 1],
    ["uvp", "Propuesta de valor única", "Por qué eres diferente y vale la pena. Una frase.", 0],
    ["concept", "Concepto de alto nivel", "Analogía \"X para Y\".", 1],
    ["solution", "Solución", "Top 3 funciones, lo más simple.", 0],
    ["channels", "Canales", "Camino hasta tus clientes.", 0],
    ["revenue", "Fuentes de ingresos", "Qué cobras, cuánto y en qué moneda.", 0],
    ["costs", "Estructura de costes", "Costes fijos y variables de arrancar.", 0],
    ["metrics", "Métricas clave", "Los números que dicen cómo vas.", 0],
    ["unfair", "Ventaja injusta", "Lo que no se puede copiar ni comprar. Vacío es válido.", 0],
  ];
  const TAGS = [["", "Certeza: sin marcar"], ["intuicion", "Intuición"], ["observacion", "Observación anecdótica"], ["hecho", "Hecho (con evidencia)"]];
  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  F.forEach(([id]) => { if (!state[id]) state[id] = { v: seed[id] || "", t: "" }; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  const grid = document.createElement("div");
  grid.className = "lc lc-grid";
  F.forEach(([id, label, hint, sub]) => {
    const box = document.createElement("div");
    box.className = "lc-f" + (sub ? " sub" : "");
    box.dataset.id = id;
    box.innerHTML = `<label for="f-${id}">${label}</label><div class="hint">${hint}</div>`;
    const ta = document.createElement("textarea");
    ta.id = "f-" + id; ta.value = state[id].v;
    ta.addEventListener("input", () => { state[id].v = ta.value; save(); run(); });
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", "Certeza de " + label);
    TAGS.forEach(([val, txt]) => { const o = document.createElement("option"); o.value = val; o.textContent = txt; sel.appendChild(o); });
    sel.value = state[id].t;
    sel.addEventListener("change", () => { state[id].t = sel.value; save(); run(); });
    box.append(ta, sel);
    grid.appendChild(box);
  });
  root.appendChild(grid);

  const v = (id) => state[id].v.trim();
  const lines = (id) => v(id).split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const checksEl = document.getElementById("checks");
  function run() {
    if (!checksEl) return;
    const broad = /\b(todos|todo el mundo|cualquiera|everyone)\b/i.test(v("segments"));
    const weakAdv = /pasi[oó]n|primero en|c[oó]digo|funcionalidades|tecnolog[ií]a|first.?mover/i.test(v("unfair"));
    const untagged = F.filter(([id]) => v(id) && !state[id].t).length;
    const facts = F.filter(([id]) => state[id].t === "hecho").length;
    const R = [
      !v("segments") ? ["todo", "Segmentos: pendiente."] : broad ? ["warn", "Segmentos: \"todos\" no sirve; empieza por un grupo concreto (RL p.24)."] : ["ok", "Segmentos: definido."],
      !v("early") ? ["todo", "Adoptante temprano: pendiente. Define a uno, no al cliente masivo (RL p.28)."] : ["ok", "Adoptante temprano: definido."],
      !v("problem") ? ["todo", "Problema: pendiente."] : lines("problem").length > 3 ? ["warn", "Problema: máximo 3 (RL p.27)."] : ["ok", "Problema: " + lines("problem").length + " de 3."],
      !v("alt") ? ["todo", "Alternativas existentes: pendiente. Incluye \"no hacer nada\" (RL p.27)."] : ["ok", "Alternativas existentes: anotadas."],
      !v("solution") ? ["todo", "Solución: pendiente."] : lines("solution").length > 3 ? ["warn", "Solución: máximo 3 funciones (RL p.32)."] : ["ok", "Solución: " + lines("solution").length + " de 3."],
      !v("revenue") ? ["todo", "Ingresos: pendiente."] : !/\d/.test(v("revenue")) ? ["warn", "Ingresos: pon un número (precio y moneda); ancla contra las alternativas (RL p.38)."] : ["ok", "Ingresos: con número."],
      weakAdv ? ["warn", "Ventaja injusta: pasión, código, funciones o ser el primero se copian o no cuentan (RL p.42)."] : ["ok", "Ventaja injusta: " + (v("unfair") ? "revisa que no se pueda copiar o comprar." : "vacío es válido al inicio.")],
      untagged ? ["warn", "Certeza: faltan " + untagged + " cajas por marcar (intuición, observación o hecho)."] : ["ok", "Certeza: todas las cajas con contenido están marcadas."],
      ["todo", "Hechos marcados: " + facts + ". Sin haber hablado con clientes, lo normal es 0 o muy pocos."],
    ];
    const sym = { ok: "✓", warn: "!", todo: "○" };
    checksEl.innerHTML = "";
    R.forEach(([k, t]) => { const li = document.createElement("li"); li.className = k; li.textContent = sym[k] + " " + t; checksEl.appendChild(li); });
  }

  const actions = document.getElementById("lc-actions");
  if (actions) {
    const copy = document.createElement("button"); copy.textContent = "Copiar canvas como texto";
    const reset = document.createElement("button"); reset.textContent = "Reiniciar";
    const msg = document.createElement("span"); msg.className = "lc-msg";
    copy.addEventListener("click", async () => {
      const txt = "LEAN CANVAS\n\n" + F.map(([id, label]) => `## ${label}${state[id].t ? " [" + state[id].t + "]" : ""}\n${v(id) || "(vacío)"}`).join("\n\n");
      try { await navigator.clipboard.writeText(txt); msg.textContent = "Copiado. Pégalo en la conversación para que lo revise."; }
      catch (e) { const w = window.open("", "_blank"); if (w) { w.document.write("<pre>" + txt.replace(/</g, "&lt;") + "</pre>"); } msg.textContent = "Se abrió en otra pestaña."; }
    });
    reset.addEventListener("click", () => {
      if (!confirm("¿Volver al punto de partida? Pierdes lo que escribiste.")) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
      location.reload();
    });
    actions.append(copy, reset, msg);
  }
  run();
})();
