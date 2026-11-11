export function appendMessage(logEl, text, who) {
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

export function setStatus(el, text) {
  if (el) el.textContent = text;
}

export function bindEnvSelector(buttons, onChange) {
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.env);
      try { localStorage.setItem('env', btn.dataset.env); } catch (e) {}
    });
  });
  try {
    const saved = localStorage.getItem('env');
    if (saved) {
      const btn = [...buttons].find((b) => b.dataset.env === saved);
      if (btn) btn.click();
    }
  } catch (e) {}
}
