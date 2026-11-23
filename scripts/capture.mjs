// Capture d'écran avec émulation mobile via CDP (Node 24, WebSocket natif).
import fs from "node:fs";

const port = process.argv[2] ?? "9333";
const url = process.argv[3] ?? "http://127.0.0.1:4310/";
const width = Number(process.argv[4] ?? 420);
const height = Number(process.argv[5] ?? 1400);
const out = process.argv[6] ?? ".shots/cdp.png";

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
  height,
  deviceScaleFactor: 1,
  mobile: width < 800,
});
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2600));

const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width, height, scale: 1 },
});
fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`${out} ${width}x${height}`);
ws.close();
process.exit(0);
