'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./0xsequence-multicall.cjs.prod.js");
} else {
  module.exports = require("./0xsequence-multicall.cjs.dev.js");
}
