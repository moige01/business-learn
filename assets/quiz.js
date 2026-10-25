// Quiz reutilizable: <div class="q" data-correct="1" data-why="..."><p>Pregunta</p><button>..</button>...</div>
// data-correct = índice (0-based) de la respuesta correcta. Respuesta inmediata + puntaje en #score.
(function () {
  const qs = [...document.querySelectorAll(".q[data-correct]")];
  const score = document.getElementById("score");
  let right = 0, done = 0;
  qs.forEach((q) => {
    const fb = document.createElement("div");
    fb.className = "fb";
    q.appendChild(fb);
    const btns = [...q.querySelectorAll("button")];
    btns.forEach((b, i) => b.addEventListener("click", () => {
      if (q.dataset.done) return;
      q.dataset.done = "1";
      const ok = i === +q.dataset.correct;
      b.classList.add(ok ? "ok" : "bad");
      if (!ok) btns[+q.dataset.correct].classList.add("ok");
      fb.textContent = (ok ? "Correcto. " : "No. ") + q.dataset.why;
      done++; if (ok) right++;
      if (score) score.textContent = right + " / " + qs.length + (done === qs.length ? " — listo" : "");
    }));
  });
  if (score) score.textContent = "0 / " + qs.length;
})();
