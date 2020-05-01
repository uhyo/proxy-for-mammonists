import http from "http";
import net from "net";

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

server.on("connect", (req, socket, head) => {
  console.log(`proxying HTTPS request to ${req.headers.host}`);
  const u = new URL(`https://${req.headers.host}`);
  const conn = net.createConnection(
    {
      host: u.hostname,
      port: u.port || 443,
    },
    () => {
      socket.write("HTTP/1.1 200 OK\n\n");
      conn.pipe(socket);
    }
  );
  if (head) {
    conn.write(head);
  }
  socket.pipe(conn);
});

server.listen(8111, "0.0.0.0");
