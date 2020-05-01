import http from "http";
import net from "net";
import tls from "tls";

const server = http.createServer((req, res) => {
  // HTTP リクエストをプロキシする処理
  const u = new URL(req.url, `http://${req.headers.host}`);

  console.log(`proxying HTTP request to ${req.headers.host}`);
  const proxyReq = http.request(
    u,
    {
      method: req.method,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  req.pipe(proxyReq);
});

server.on("connect", (req, socket, head) => {
  console.log(`proxying HTTPS request to ${req.headers.host}`);
  const u = new URL(`https://${req.headers.host}`);
  const certificateCheckP = checkCertificateIsNotLetsEncrypt(
    u.hostname,
    u.port || 443
  );
  const conn = net.createConnection(
    {
      host: u.hostname,
      port: u.port || 443,
    },
    () => {
      certificateCheckP
        .then((ok) => {
          if (ok) {
            socket.write("HTTP/1.1 200 OK\n\n");
            conn.pipe(socket);
          } else {
            console.log(`Request to ${u.hostname} is blocked`);
            socket.end("HTTP/1.1 403 Forbidden\n\n");
          }
        })
        .catch((err) => {
          // ?
          socket.end("HTTP/1.1 500 Internal Server Error\n\n" + err.toString());
        });
      // pipeTLSResponse(socket, checkConn);
    }
  );
  if (head) {
    conn.write(head);
  }
  socket.pipe(conn);
  conn.on("error", (err) => {
    console.error(err);
    socket.end();
  });
});

server.listen(8111, "0.0.0.0");

function checkCertificateIsNotLetsEncrypt(host, port) {
  return new Promise((resolve, reject) => {
    const checkConn = tls.connect(
      {
        host,
        port,
        servername: host,
      },
      () => {
        const cert = checkConn.getPeerCertificate();
        const issuer = cert && cert.issuer;
        if (issuer) {
          if (issuer.O === "Let's Encrypt") {
            // this should be blocked
            resolve(false);
          } else {
            // OK
            resolve(true);
          }
        } else {
          // no issuer?
          reject(new Error("Could not get certificate issuer"));
        }
      }
    );
    checkConn.on("error", reject);
  });
}
