"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// app/next.config.ts
var next_config_exports = {};
__export(next_config_exports, {
  default: () => next_config_default
});
module.exports = __toCommonJS(next_config_exports);
var nextConfig = {
  images: {
    unoptimized: true
  },
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.0.101", "192.168.0.193", "192.168.1.3", "192.168.8.113"]
};
var next_config_default = nextConfig;
