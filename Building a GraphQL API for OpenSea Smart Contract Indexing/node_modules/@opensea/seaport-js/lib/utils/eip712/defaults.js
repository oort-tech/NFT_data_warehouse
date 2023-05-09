"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGetter = void 0;
var logger_1 = require("@ethersproject/logger");
var utils_1 = require("ethers/lib/utils");
var logger = new logger_1.Logger("defaults");
var baseDefaults = {
    integer: 0,
    address: (0, utils_1.hexZeroPad)("0x", 20),
    bool: false,
    bytes: "0x",
    string: "",
};
var isNullish = function (value) {
    if (value === undefined)
        return false;
    return (value !== undefined &&
        value !== null &&
        ((["string", "number"].includes(typeof value) &&
            BigInt(value) === BigInt(0)) ||
            (Array.isArray(value) && value.every(isNullish)) ||
            (typeof value === "object" && Object.values(value).every(isNullish)) ||
            (typeof value === "boolean" && value === false)));
};
function getDefaultForBaseType(type) {
    var _a;
    // bytesXX
    var _b = __read((_a = type.match(/^bytes(\d+)$/)) !== null && _a !== void 0 ? _a : [], 2), width = _b[1];
    if (width)
        return (0, utils_1.hexZeroPad)("0x", parseInt(width));
    if (type.match(/^(u?)int(\d*)$/))
        type = "integer";
    return baseDefaults[type];
}
var DefaultGetter = /** @class */ (function () {
    function DefaultGetter(types) {
        this.types = types;
        this.defaultValues = {};
        for (var name_1 in types) {
            var defaultValue = this.getDefaultValue(name_1);
            this.defaultValues[name_1] = defaultValue;
            if (!isNullish(defaultValue)) {
                logger.throwError("Got non-empty value for type ".concat(name_1, " in default generator: ").concat(defaultValue));
            }
        }
    }
    DefaultGetter.from = function (types, type) {
        var defaultValues = new DefaultGetter(types).defaultValues;
        if (type)
            return defaultValues[type];
        return defaultValues;
    };
    /* eslint-enable no-dupe-class-members */
    DefaultGetter.prototype.getDefaultValue = function (type) {
        var _this = this;
        if (this.defaultValues[type])
            return this.defaultValues[type];
        // Basic type (address, bool, uint256, etc)
        var basic = getDefaultForBaseType(type);
        if (basic !== undefined)
            return basic;
        // Array
        var match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
        if (match) {
            var subtype = match[1];
            var length_1 = parseInt(match[3]);
            if (length_1 > 0) {
                var baseValue = this.getDefaultValue(subtype);
                return Array(length_1).fill(baseValue);
            }
            return [];
        }
        // Struct
        var fields = this.types[type];
        if (fields) {
            return fields.reduce(function (obj, _a) {
                var _b;
                var name = _a.name, type = _a.type;
                return (__assign(__assign({}, obj), (_b = {}, _b[name] = _this.getDefaultValue(type), _b)));
            }, {});
        }
        return logger.throwArgumentError("unknown type: ".concat(type), "type", type);
    };
    return DefaultGetter;
}());
exports.DefaultGetter = DefaultGetter;
//# sourceMappingURL=defaults.js.map