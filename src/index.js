import http from "http";

const server = http.createServer((req, res) => {
  // HTTP リクエストをプロキシする処理
  const u = new URL(req.url, `http://${req.headers.host}`);

  console.log(`proxying HTTP request to ${req.headers.host}`);
  const proxyReq = http.request(u, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  req.pipe(proxyReq);
});

server.listen(8111, "0.0.0.0");
