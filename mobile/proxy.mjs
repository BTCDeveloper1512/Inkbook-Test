import http from 'http';

const TARGET_PORT = 8080;
const PROXY_PORT = 8099;

const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${TARGET_PORT}`,
    },
  };

  const proxy = http.request(options, (proxyRes) => {
    // Allow iframe embedding
    const headers = { ...proxyRes.headers };
    delete headers['x-frame-options'];
    delete headers['content-security-policy'];
    headers['access-control-allow-origin'] = '*';
    
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    res.writeHead(502);
    res.end('Expo app not available: ' + err.message);
  });

  req.pipe(proxy, { end: true });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Expo proxy running: http://localhost:${PROXY_PORT} → http://localhost:${TARGET_PORT}`);
});
