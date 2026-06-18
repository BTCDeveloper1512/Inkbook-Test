// craco.config.js
const path = require("path");
require("dotenv").config();

const isDevServer = process.env.NODE_ENV !== "production";

const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };
      // Remove incompatible plugins: ForkTsCheckerWebpackPlugin (ajv v8 compat) + ESLintWebpackPlugin
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (p) => !p.constructor || (
          p.constructor.name !== "ForkTsCheckerWebpackPlugin" &&
          p.constructor.name !== "ESLintWebpackPlugin"
        )
      );
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

// Apply visual edits FIRST so we can wrap its devServer below
if (isDevServer) {
  try {
    const { withVisualEdits } = require("@emergentbase/visual-edits/craco");
    webpackConfig = withVisualEdits(webpackConfig);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('@emergentbase/visual-edits/craco')) {
      console.warn("[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled.");
    } else {
      throw err;
    }
  }
}

// Wrap whatever devServer config exists (including from withVisualEdits) so our
// host/port/allowedHosts/proxy settings are always applied last.
const previousDevServer = webpackConfig.devServer;
webpackConfig.devServer = (devServerConfig) => {
  // Let any prior devServer config run first
  if (typeof previousDevServer === "function") {
    devServerConfig = previousDevServer(devServerConfig) || devServerConfig;
  }

  devServerConfig.host = "0.0.0.0";
  devServerConfig.port = 5000;
  devServerConfig.allowedHosts = "all";

  // Inject /api proxy as the FIRST middleware in the WDS middleware array.
  // http-proxy-middleware v2 + WDS v5 breaks POST response forwarding (compression
  // middleware wraps res.write/end, causing the proxy response to be silently dropped).
  // We use a minimal hand-rolled Node.js http proxy that bypasses this issue entirely.
  const originalSetupMiddlewares = devServerConfig.setupMiddlewares;
  devServerConfig.setupMiddlewares = (middlewares, devServer) => {
    const http = require("http");
    const forwardToBackend = (req, res, body) => {
      const headers = { ...req.headers, host: "localhost:8000" };
      // Override content-length to match the actual buffered body length
      if (body && body.length > 0) {
        headers["content-length"] = String(body.length);
      } else {
        delete headers["content-length"];
        delete headers["transfer-encoding"];
      }
      const options = {
        hostname: "localhost",
        port: 8000,
        path: req.url,
        method: req.method,
        headers,
      };
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        const responseChunks = [];
        proxyRes.on("data", (c) => responseChunks.push(c));
        proxyRes.on("end", () => res.end(Buffer.concat(responseChunks)));
      });
      proxyReq.on("error", (err) => {
        console.error("[api-proxy] backend error:", err.message);
        if (!res.headersSent) { res.writeHead(502); res.end("Bad Gateway"); }
      });
      if (body && body.length > 0) proxyReq.write(body);
      proxyReq.end();
    };

    // Expo host-based proxy: if Host matches *.expo.riker.replit.dev, forward to Expo web app
    const expoProxyMw = (req, res, next) => {
      const host = req.headers.host || "";
      if (!host.includes(".expo.riker.replit.dev")) return next();
      const opts = {
        hostname: "localhost",
        port: 8080,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: "localhost:8080" },
      };
      const proxyReq = http.request(opts, (proxyRes) => {
        const h = { ...proxyRes.headers };
        delete h["x-frame-options"];
        delete h["content-security-policy"];
        res.writeHead(proxyRes.statusCode, h);
        proxyRes.pipe(res, { end: true });
      });
      proxyReq.on("error", (err) => {
        if (!res.headersSent) { res.writeHead(502); res.end("Expo proxy error: " + err.message); }
      });
      req.pipe(proxyReq, { end: true });
    };
    middlewares.unshift({ name: "expo-proxy", middleware: expoProxyMw });

    const apiProxyMw = (req, res, next) => {
      if (!req.url.startsWith("/api")) return next();

      // IMPORTANT: @emergentbase/visual-edits body parser runs before this middleware
      // via devServer.app.use() and pre-consumes the POST body stream, setting req.body.
      // If req.body is already set, use it directly — the stream is exhausted.
      if (req.body !== undefined) {
        let bodyBuf;
        if (Buffer.isBuffer(req.body)) {
          bodyBuf = req.body;
        } else if (typeof req.body === "string") {
          bodyBuf = Buffer.from(req.body);
        } else if (req.body !== null && typeof req.body === "object") {
          // visual-edits parsed JSON — re-serialize to send to backend
          bodyBuf = Buffer.from(JSON.stringify(req.body));
        } else {
          bodyBuf = Buffer.alloc(0);
        }
        return forwardToBackend(req, res, bodyBuf);
      }

      // Body not yet consumed — read it from the stream
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => forwardToBackend(req, res, Buffer.concat(chunks)));
      req.on("error", (err) => { console.error("[api-proxy] req error:", err.message); next(err); });
    };
    // Insert at front so it runs before webpack-dev-middleware and historyApiFallback
    middlewares.unshift({ name: "api-proxy", middleware: apiProxyMw });
    if (originalSetupMiddlewares) {
      middlewares = originalSetupMiddlewares(middlewares, devServer);
    }
    if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
      setupHealthEndpoints(devServer, healthPluginInstance);
    }
    return middlewares;
  };

  return devServerConfig;
};

module.exports = webpackConfig;
