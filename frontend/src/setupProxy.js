// Proxy is handled by craco.config.js (hand-rolled Node.js http proxy in setupMiddlewares).
// This file intentionally left empty — do NOT add http-proxy-middleware here;
// it breaks POST response forwarding in WDS v5 due to compression middleware interference.
module.exports = function (app) {};
