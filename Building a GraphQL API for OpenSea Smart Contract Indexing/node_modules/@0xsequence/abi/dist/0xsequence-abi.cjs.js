'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./0xsequence-abi.cjs.prod.js");
} else {
  module.exports = require("./0xsequence-abi.cjs.dev.js");
}
