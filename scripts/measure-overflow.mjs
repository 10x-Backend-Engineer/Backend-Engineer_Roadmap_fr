// Mesure l'overflow horizontal via le protocole DevTools (Node 24 a WebSocket natif).
const port = process.argv[2] ?? "9333";
const target = process.argv[3] ?? "http://127.0.0.1:4310/";
const width = Number(process.argv[4] ?? 420);

const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
const page = await res.json();
const ws = new WebSocket(page.webSocketDebuggerUrl);

let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
});

await new Promise((r) => ws.addEventListener("open", r, { once: true }));

await send("Emulation.setDeviceMetricsOverride", {
  width,
  height: 1200,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Page.enable");
await send("Page.navigate", { url: target });
await new Promise((r) => setTimeout(r, 2500));

const expr = `(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 1) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 60),
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: (el.textContent || "").trim().slice(0, 40),
      });
    }
  }
  out.sort((a, b) => b.right - a.right);
  return JSON.stringify({ vw, scrollWidth: document.documentElement.scrollWidth, count: out.length, worst: out.slice(0, 12) }, null, 1);
})()`;

const out = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(out.result.value);
ws.close();
process.exit(0);
