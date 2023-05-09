'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./0xsequence-network.cjs.prod.js");
} else {
  module.exports = require("./0xsequence-network.cjs.dev.js");
}
