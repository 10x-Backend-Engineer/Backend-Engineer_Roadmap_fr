// Vérifie l'interaction réelle : cocher, persister, recharger.
const port = process.argv[2] ?? "9333";
const base = process.argv[3] ?? "http://127.0.0.1:4310";

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

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.value;
};

await new Promise((r) => ws.addEventListener("open", r, { once: true }));
await send("Page.enable");
await send("Runtime.enable");

const results = [];

// 0. repartir d'un état propre
await send("Page.navigate", { url: `${base}/` });
await new Promise((r) => setTimeout(r, 1500));
await evaluate(`localStorage.clear()`);

// 1. page domaine : cocher le premier module
await send("Page.navigate", { url: `${base}/roadmap/api-design` });
await new Promise((r) => setTimeout(r, 2000));
results.push(["checkbox présent", await evaluate(`document.querySelectorAll("label.check input").length > 0`)]);
await evaluate(`document.querySelectorAll("label.check input")[0].click()`);
await new Promise((r) => setTimeout(r, 300));
results.push(["localStorage écrit", await evaluate(`(localStorage.getItem("backend-roadmap:progress:v1") || "").includes("api-design")`)]);
const sideCount = await evaluate(`document.querySelector(".side-foot .lbl")?.textContent || ""`);
results.push(["compteur sidebar", /[1-9]\d*\/\d{3}/.test(sideCount), sideCount]);

// 2. rechargement : l'état doit survivre
await send("Page.reload");
await new Promise((r) => setTimeout(r, 2200));
results.push(["case cochée après reload", await evaluate(`document.querySelectorAll("label.check input")[0].checked`)]);
results.push(["barre progression visible", await evaluate(`!!document.querySelector(".side-foot .bar > i")`)]);

// 3. filtre exercices
await send("Page.navigate", { url: `${base}/exercises` });
await new Promise((r) => setTimeout(r, 1800));
const before = await evaluate(`document.querySelectorAll(".ex").length`);
await evaluate(`[...document.querySelectorAll(".pill")].find(b => b.textContent.trim() === "Debug").click()`);
await new Promise((r) => setTimeout(r, 400));
const after = await evaluate(`document.querySelectorAll(".ex").length`);
results.push(["filtre Debug réduit la liste", before > after && after > 0, `${before} -> ${after}`]);

// 4. recherche ressources
await send("Page.navigate", { url: `${base}/resources` });
await new Promise((r) => setTimeout(r, 1800));
const rBefore = await evaluate(`document.querySelectorAll(".res-row").length`);
await evaluate(`(() => {
  const i = document.querySelector("input.input");
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(i, "kafka");
  i.dispatchEvent(new Event("input", { bubbles: true }));
})()`);
await new Promise((r) => setTimeout(r, 500));
const rAfter = await evaluate(`document.querySelectorAll(".res-row").length`);
results.push(["recherche ressources filtre", rAfter > 0 && rAfter < rBefore, `${rBefore} -> ${rAfter}`]);

// 5. navigation entre domaines
await send("Page.navigate", { url: `${base}/roadmap/api-design` });
await new Promise((r) => setTimeout(r, 1500));
results.push(["lien domaine suivant", await evaluate(`[...document.querySelectorAll("a")].some(a => a.textContent.includes("Auth") && a.getAttribute("href") === "/roadmap/auth")`)]);

// 6. systèmes : cocher une étape
await send("Page.navigate", { url: `${base}/systems/rate-limiter` });
await new Promise((r) => setTimeout(r, 1800));
results.push(["page système rendue", await evaluate(`document.body.innerText.includes("Distributed Rate Limiter")`)]);
await evaluate(`document.querySelectorAll("label.check input")[0].click()`);
await new Promise((r) => setTimeout(r, 300));
results.push([
  "étape système persistée",
  await evaluate(`(localStorage.getItem("backend-roadmap:progress:v1") || "").includes("system:rate-limiter:step:0")`),
]);

// 7. blueprint : liens croisés
await send("Page.navigate", { url: `${base}/blueprint` });
await new Promise((r) => setTimeout(r, 1500));
results.push([
  "blueprint liens vers systèmes",
  await evaluate(`[...document.querySelectorAll("a")].some(a => a.getAttribute("href") === "/systems/rate-limiter")`),
]);

for (const [label, ok, extra] of results) {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${extra ? " (" + extra + ")" : ""}`);
}
const failed = results.filter((r) => !r[1]).length;
console.log(failed === 0 ? "TOUT EST OK" : `${failed} échec(s)`);
ws.close();
process.exit(failed === 0 ? 0 : 1);
