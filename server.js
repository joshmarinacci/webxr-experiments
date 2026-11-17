const express = require("express");
const path = require("node:path");

const app = express();
const port = process.env.PORT || 3000;
// Serve the repo itself by default; SITE_ROOT=dist serves the built site (used by the smoke test).
const root = path.resolve(__dirname, process.env.SITE_ROOT || ".");

app.use(express.static(root));

app.listen(port, () => {
  console.log(`WebXR experiments (${root}) available at http://localhost:${port}`);
});
