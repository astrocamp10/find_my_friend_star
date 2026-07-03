import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { readFile } from "node:fs/promises";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const compressibleTypes = new Set([".html", ".js", ".css", ".json", ".svg"]);
const immutableTypes = new Set([".json", ".svg"]);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const filePath = normalize(join(root, requestPath));

    if (!filePath.startsWith(normalize(root))) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const extension = extname(filePath);
    let body = await readFile(filePath);
    const headers = {
      "Content-Type": types[extension] || "application/octet-stream",
      "Cache-Control": immutableTypes.has(extension) ? "public, max-age=31536000, immutable" : "no-cache",
    };

    const acceptedEncoding = request.headers["accept-encoding"] || "";
    if (compressibleTypes.has(extension) && body.length > 1024) {
      if (acceptedEncoding.includes("br")) {
        body = brotliCompressSync(body);
        headers["Content-Encoding"] = "br";
        headers.Vary = "Accept-Encoding";
      } else if (acceptedEncoding.includes("gzip")) {
        body = gzipSync(body);
        headers["Content-Encoding"] = "gzip";
        headers.Vary = "Accept-Encoding";
      }
    }

    response.writeHead(200, headers);
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, () => {
  console.log(`나의 친구 별 찾기: http://localhost:${port}`);
});
