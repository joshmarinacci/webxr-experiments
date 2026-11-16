const express = require("express");
const path = require("node:path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`WebXR experiments available at http://localhost:${port}`);
});
