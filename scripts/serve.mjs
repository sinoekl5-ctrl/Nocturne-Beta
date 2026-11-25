import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../prototype/", import.meta.url)));
const projectRoot = resolve(root, "..");
const sharedCoreModulePath = "/packages/core/url-cleaner.mjs";
const port = Number(process.env.PORT ?? 4173);
const mime = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"], [".json", "application/json; charset=utf-8"],
]);

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  try {
    const rawPath = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const requested = rawPath === "/" ? "/index.html" : rawPath;
    // Expose this one shared core module to the prototype; all other project files stay private.
    const servesSharedCoreModule = requested === sharedCoreModulePath;
    const base = servesSharedCoreModule ? projectRoot : root;
    const file = resolve(base, `.${normalize(requested)}`);
    if (file !== base && !file.startsWith(base + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error("Not a file");
    const body = req.method === "HEAD" ? null : await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime.get(extname(file)) ?? "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'self' data:; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Nocturne visual prototype: http://127.0.0.1:${port}\n`);
});
