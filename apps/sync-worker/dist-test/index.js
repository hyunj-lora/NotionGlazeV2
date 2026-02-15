var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/@notionhq/client/build/src/utils.js
var require_utils = __commonJS({
  "../../node_modules/@notionhq/client/build/src/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isObject = exports.pick = exports.assertNever = void 0;
    function assertNever(value) {
      throw new Error(`Unexpected value should never occur: ${value}`);
    }
    __name(assertNever, "assertNever");
    exports.assertNever = assertNever;
    function pick(base, keys) {
      const entries = keys.map((key) => [key, base === null || base === void 0 ? void 0 : base[key]]);
      return Object.fromEntries(entries);
    }
    __name(pick, "pick");
    exports.pick = pick;
    function isObject(o) {
      return typeof o === "object" && o !== null;
    }
    __name(isObject, "isObject");
    exports.isObject = isObject;
  }
});

// ../../node_modules/@notionhq/client/build/src/logging.js
var require_logging = __commonJS({
  "../../node_modules/@notionhq/client/build/src/logging.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logLevelSeverity = exports.makeConsoleLogger = exports.LogLevel = void 0;
    var utils_1 = require_utils();
    var LogLevel;
    (function(LogLevel2) {
      LogLevel2["DEBUG"] = "debug";
      LogLevel2["INFO"] = "info";
      LogLevel2["WARN"] = "warn";
      LogLevel2["ERROR"] = "error";
    })(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
    function makeConsoleLogger(name) {
      return (level, message, extraInfo) => {
        console[level](`${name} ${level}:`, message, extraInfo);
      };
    }
    __name(makeConsoleLogger, "makeConsoleLogger");
    exports.makeConsoleLogger = makeConsoleLogger;
    function logLevelSeverity(level) {
      switch (level) {
        case LogLevel.DEBUG:
          return 20;
        case LogLevel.INFO:
          return 40;
        case LogLevel.WARN:
          return 60;
        case LogLevel.ERROR:
          return 80;
        default:
          return (0, utils_1.assertNever)(level);
      }
    }
    __name(logLevelSeverity, "logLevelSeverity");
    exports.logLevelSeverity = logLevelSeverity;
  }
});

// ../../node_modules/@notionhq/client/build/src/errors.js
var require_errors = __commonJS({
  "../../node_modules/@notionhq/client/build/src/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildRequestError = exports.APIResponseError = exports.UnknownHTTPResponseError = exports.isHTTPResponseError = exports.RequestTimeoutError = exports.isNotionClientError = exports.ClientErrorCode = exports.APIErrorCode = void 0;
    var utils_1 = require_utils();
    var APIErrorCode;
    (function(APIErrorCode2) {
      APIErrorCode2["Unauthorized"] = "unauthorized";
      APIErrorCode2["RestrictedResource"] = "restricted_resource";
      APIErrorCode2["ObjectNotFound"] = "object_not_found";
      APIErrorCode2["RateLimited"] = "rate_limited";
      APIErrorCode2["InvalidJSON"] = "invalid_json";
      APIErrorCode2["InvalidRequestURL"] = "invalid_request_url";
      APIErrorCode2["InvalidRequest"] = "invalid_request";
      APIErrorCode2["ValidationError"] = "validation_error";
      APIErrorCode2["ConflictError"] = "conflict_error";
      APIErrorCode2["InternalServerError"] = "internal_server_error";
      APIErrorCode2["ServiceUnavailable"] = "service_unavailable";
    })(APIErrorCode = exports.APIErrorCode || (exports.APIErrorCode = {}));
    var ClientErrorCode;
    (function(ClientErrorCode2) {
      ClientErrorCode2["RequestTimeout"] = "notionhq_client_request_timeout";
      ClientErrorCode2["ResponseError"] = "notionhq_client_response_error";
    })(ClientErrorCode = exports.ClientErrorCode || (exports.ClientErrorCode = {}));
    var NotionClientErrorBase = class extends Error {
      static {
        __name(this, "NotionClientErrorBase");
      }
    };
    function isNotionClientError(error) {
      return (0, utils_1.isObject)(error) && error instanceof NotionClientErrorBase;
    }
    __name(isNotionClientError, "isNotionClientError");
    exports.isNotionClientError = isNotionClientError;
    function isNotionClientErrorWithCode(error, codes) {
      return isNotionClientError(error) && error.code in codes;
    }
    __name(isNotionClientErrorWithCode, "isNotionClientErrorWithCode");
    var RequestTimeoutError = class _RequestTimeoutError extends NotionClientErrorBase {
      static {
        __name(this, "RequestTimeoutError");
      }
      constructor(message = "Request to Notion API has timed out") {
        super(message);
        this.code = ClientErrorCode.RequestTimeout;
        this.name = "RequestTimeoutError";
      }
      static isRequestTimeoutError(error) {
        return isNotionClientErrorWithCode(error, {
          [ClientErrorCode.RequestTimeout]: true
        });
      }
      static rejectAfterTimeout(promise, timeoutMS) {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new _RequestTimeoutError());
          }, timeoutMS);
          promise.then(resolve).catch(reject).then(() => clearTimeout(timeoutId));
        });
      }
    };
    exports.RequestTimeoutError = RequestTimeoutError;
    var HTTPResponseError = class extends NotionClientErrorBase {
      static {
        __name(this, "HTTPResponseError");
      }
      constructor(args) {
        super(args.message);
        this.name = "HTTPResponseError";
        const { code, status, headers, rawBodyText } = args;
        this.code = code;
        this.status = status;
        this.headers = headers;
        this.body = rawBodyText;
      }
    };
    var httpResponseErrorCodes = {
      [ClientErrorCode.ResponseError]: true,
      [APIErrorCode.Unauthorized]: true,
      [APIErrorCode.RestrictedResource]: true,
      [APIErrorCode.ObjectNotFound]: true,
      [APIErrorCode.RateLimited]: true,
      [APIErrorCode.InvalidJSON]: true,
      [APIErrorCode.InvalidRequestURL]: true,
      [APIErrorCode.InvalidRequest]: true,
      [APIErrorCode.ValidationError]: true,
      [APIErrorCode.ConflictError]: true,
      [APIErrorCode.InternalServerError]: true,
      [APIErrorCode.ServiceUnavailable]: true
    };
    function isHTTPResponseError(error) {
      if (!isNotionClientErrorWithCode(error, httpResponseErrorCodes)) {
        return false;
      }
      return true;
    }
    __name(isHTTPResponseError, "isHTTPResponseError");
    exports.isHTTPResponseError = isHTTPResponseError;
    var UnknownHTTPResponseError = class extends HTTPResponseError {
      static {
        __name(this, "UnknownHTTPResponseError");
      }
      constructor(args) {
        var _a;
        super({
          ...args,
          code: ClientErrorCode.ResponseError,
          message: (_a = args.message) !== null && _a !== void 0 ? _a : `Request to Notion API failed with status: ${args.status}`
        });
        this.name = "UnknownHTTPResponseError";
      }
      static isUnknownHTTPResponseError(error) {
        return isNotionClientErrorWithCode(error, {
          [ClientErrorCode.ResponseError]: true
        });
      }
    };
    exports.UnknownHTTPResponseError = UnknownHTTPResponseError;
    var apiErrorCodes = {
      [APIErrorCode.Unauthorized]: true,
      [APIErrorCode.RestrictedResource]: true,
      [APIErrorCode.ObjectNotFound]: true,
      [APIErrorCode.RateLimited]: true,
      [APIErrorCode.InvalidJSON]: true,
      [APIErrorCode.InvalidRequestURL]: true,
      [APIErrorCode.InvalidRequest]: true,
      [APIErrorCode.ValidationError]: true,
      [APIErrorCode.ConflictError]: true,
      [APIErrorCode.InternalServerError]: true,
      [APIErrorCode.ServiceUnavailable]: true
    };
    var APIResponseError = class extends HTTPResponseError {
      static {
        __name(this, "APIResponseError");
      }
      constructor() {
        super(...arguments);
        this.name = "APIResponseError";
      }
      static isAPIResponseError(error) {
        return isNotionClientErrorWithCode(error, apiErrorCodes);
      }
    };
    exports.APIResponseError = APIResponseError;
    function buildRequestError(response, bodyText) {
      const apiErrorResponseBody = parseAPIErrorResponseBody(bodyText);
      if (apiErrorResponseBody !== void 0) {
        return new APIResponseError({
          code: apiErrorResponseBody.code,
          message: apiErrorResponseBody.message,
          headers: response.headers,
          status: response.status,
          rawBodyText: bodyText
        });
      }
      return new UnknownHTTPResponseError({
        message: void 0,
        headers: response.headers,
        status: response.status,
        rawBodyText: bodyText
      });
    }
    __name(buildRequestError, "buildRequestError");
    exports.buildRequestError = buildRequestError;
    function parseAPIErrorResponseBody(body) {
      if (typeof body !== "string") {
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (parseError) {
        return;
      }
      if (!(0, utils_1.isObject)(parsed) || typeof parsed["message"] !== "string" || !isAPIErrorCode(parsed["code"])) {
        return;
      }
      return {
        ...parsed,
        code: parsed["code"],
        message: parsed["message"]
      };
    }
    __name(parseAPIErrorResponseBody, "parseAPIErrorResponseBody");
    function isAPIErrorCode(code) {
      return typeof code === "string" && code in apiErrorCodes;
    }
    __name(isAPIErrorCode, "isAPIErrorCode");
  }
});

// ../../node_modules/@notionhq/client/build/src/api-endpoints.js
var require_api_endpoints = __commonJS({
  "../../node_modules/@notionhq/client/build/src/api-endpoints.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.oauthIntrospect = exports.oauthRevoke = exports.oauthToken = exports.listComments = exports.createComment = exports.search = exports.createDatabase = exports.listDatabases = exports.queryDatabase = exports.updateDatabase = exports.getDatabase = exports.appendBlockChildren = exports.listBlockChildren = exports.deleteBlock = exports.updateBlock = exports.getBlock = exports.getPageProperty = exports.updatePage = exports.getPage = exports.createPage = exports.listUsers = exports.getUser = exports.getSelf = void 0;
    exports.getSelf = {
      method: "get",
      pathParams: [],
      queryParams: [],
      bodyParams: [],
      path: /* @__PURE__ */ __name(() => `users/me`, "path")
    };
    exports.getUser = {
      method: "get",
      pathParams: ["user_id"],
      queryParams: [],
      bodyParams: [],
      path: /* @__PURE__ */ __name((p) => `users/${p.user_id}`, "path")
    };
    exports.listUsers = {
      method: "get",
      pathParams: [],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: /* @__PURE__ */ __name(() => `users`, "path")
    };
    exports.createPage = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["parent", "properties", "icon", "cover", "content", "children"],
      path: /* @__PURE__ */ __name(() => `pages`, "path")
    };
    exports.getPage = {
      method: "get",
      pathParams: ["page_id"],
      queryParams: ["filter_properties"],
      bodyParams: [],
      path: /* @__PURE__ */ __name((p) => `pages/${p.page_id}`, "path")
    };
    exports.updatePage = {
      method: "patch",
      pathParams: ["page_id"],
      queryParams: [],
      bodyParams: ["properties", "icon", "cover", "archived", "in_trash"],
      path: /* @__PURE__ */ __name((p) => `pages/${p.page_id}`, "path")
    };
    exports.getPageProperty = {
      method: "get",
      pathParams: ["page_id", "property_id"],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: /* @__PURE__ */ __name((p) => `pages/${p.page_id}/properties/${p.property_id}`, "path")
    };
    exports.getBlock = {
      method: "get",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: [],
      path: /* @__PURE__ */ __name((p) => `blocks/${p.block_id}`, "path")
    };
    exports.updateBlock = {
      method: "patch",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: [
        "embed",
        "type",
        "archived",
        "in_trash",
        "bookmark",
        "image",
        "video",
        "pdf",
        "file",
        "audio",
        "code",
        "equation",
        "divider",
        "breadcrumb",
        "table_of_contents",
        "link_to_page",
        "table_row",
        "heading_1",
        "heading_2",
        "heading_3",
        "paragraph",
        "bulleted_list_item",
        "numbered_list_item",
        "quote",
        "to_do",
        "toggle",
        "template",
        "callout",
        "synced_block",
        "table"
      ],
      path: /* @__PURE__ */ __name((p) => `blocks/${p.block_id}`, "path")
    };
    exports.deleteBlock = {
      method: "delete",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: [],
      path: /* @__PURE__ */ __name((p) => `blocks/${p.block_id}`, "path")
    };
    exports.listBlockChildren = {
      method: "get",
      pathParams: ["block_id"],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: /* @__PURE__ */ __name((p) => `blocks/${p.block_id}/children`, "path")
    };
    exports.appendBlockChildren = {
      method: "patch",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: ["children", "after"],
      path: /* @__PURE__ */ __name((p) => `blocks/${p.block_id}/children`, "path")
    };
    exports.getDatabase = {
      method: "get",
      pathParams: ["database_id"],
      queryParams: [],
      bodyParams: [],
      path: /* @__PURE__ */ __name((p) => `databases/${p.database_id}`, "path")
    };
    exports.updateDatabase = {
      method: "patch",
      pathParams: ["database_id"],
      queryParams: [],
      bodyParams: [
        "title",
        "description",
        "icon",
        "cover",
        "properties",
        "is_inline",
        "archived",
        "in_trash"
      ],
      path: /* @__PURE__ */ __name((p) => `databases/${p.database_id}`, "path")
    };
    exports.queryDatabase = {
      method: "post",
      pathParams: ["database_id"],
      queryParams: ["filter_properties"],
      bodyParams: [
        "sorts",
        "filter",
        "start_cursor",
        "page_size",
        "archived",
        "in_trash"
      ],
      path: /* @__PURE__ */ __name((p) => `databases/${p.database_id}/query`, "path")
    };
    exports.listDatabases = {
      method: "get",
      pathParams: [],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: /* @__PURE__ */ __name(() => `databases`, "path")
    };
    exports.createDatabase = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: [
        "parent",
        "properties",
        "icon",
        "cover",
        "title",
        "description",
        "is_inline"
      ],
      path: /* @__PURE__ */ __name(() => `databases`, "path")
    };
    exports.search = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["sort", "query", "start_cursor", "page_size", "filter"],
      path: /* @__PURE__ */ __name(() => `search`, "path")
    };
    exports.createComment = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["parent", "rich_text", "discussion_id"],
      path: /* @__PURE__ */ __name(() => `comments`, "path")
    };
    exports.listComments = {
      method: "get",
      pathParams: [],
      queryParams: ["block_id", "start_cursor", "page_size"],
      bodyParams: [],
      path: /* @__PURE__ */ __name(() => `comments`, "path")
    };
    exports.oauthToken = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["grant_type", "code", "redirect_uri", "external_account"],
      path: /* @__PURE__ */ __name(() => `oauth/token`, "path")
    };
    exports.oauthRevoke = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["token"],
      path: /* @__PURE__ */ __name(() => `oauth/revoke`, "path")
    };
    exports.oauthIntrospect = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["token"],
      path: /* @__PURE__ */ __name(() => `oauth/introspect`, "path")
    };
  }
});

// ../../node_modules/node-fetch/browser.js
var require_browser = __commonJS({
  "../../node_modules/node-fetch/browser.js"(exports, module) {
    "use strict";
    var getGlobal = /* @__PURE__ */ __name(function() {
      if (typeof self !== "undefined") {
        return self;
      }
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof global !== "undefined") {
        return global;
      }
      throw new Error("unable to locate global object");
    }, "getGlobal");
    var globalObject = getGlobal();
    module.exports = exports = globalObject.fetch;
    if (globalObject.fetch) {
      exports.default = globalObject.fetch.bind(globalObject);
    }
    exports.Headers = globalObject.Headers;
    exports.Request = globalObject.Request;
    exports.Response = globalObject.Response;
  }
});

// ../../node_modules/@notionhq/client/build/package.json
var require_package = __commonJS({
  "../../node_modules/@notionhq/client/build/package.json"(exports, module) {
    module.exports = {
      name: "@notionhq/client",
      version: "2.3.0",
      description: "A simple and easy to use client for the Notion API",
      engines: {
        node: ">=12"
      },
      homepage: "https://developers.notion.com/docs/getting-started",
      bugs: {
        url: "https://github.com/makenotion/notion-sdk-js/issues"
      },
      repository: {
        type: "git",
        url: "https://github.com/makenotion/notion-sdk-js/"
      },
      keywords: [
        "notion",
        "notionapi",
        "rest",
        "notion-api"
      ],
      main: "./build/src",
      types: "./build/src/index.d.ts",
      scripts: {
        prepare: "npm run build",
        prepublishOnly: "npm run checkLoggedIn && npm run lint && npm run test",
        build: "tsc",
        prettier: "prettier --write .",
        lint: "prettier --check . && eslint . --ext .ts && cspell '**/*' ",
        test: "jest ./test",
        "check-links": "git ls-files | grep md$ | xargs -n 1 markdown-link-check",
        prebuild: "npm run clean",
        clean: "rm -rf ./build",
        checkLoggedIn: "./scripts/verifyLoggedIn.sh"
      },
      author: "",
      license: "MIT",
      files: [
        "build/package.json",
        "build/src/**"
      ],
      dependencies: {
        "@types/node-fetch": "^2.5.10",
        "node-fetch": "^2.6.1"
      },
      devDependencies: {
        "@types/jest": "^28.1.4",
        "@typescript-eslint/eslint-plugin": "^5.39.0",
        "@typescript-eslint/parser": "^5.39.0",
        cspell: "^5.4.1",
        eslint: "^7.24.0",
        jest: "^28.1.2",
        "markdown-link-check": "^3.8.7",
        prettier: "^2.8.8",
        "ts-jest": "^28.0.5",
        typescript: "^4.8.4"
      }
    };
  }
});

// ../../node_modules/@notionhq/client/build/src/Client.js
var require_Client = __commonJS({
  "../../node_modules/@notionhq/client/build/src/Client.js"(exports) {
    "use strict";
    var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var _Client_auth;
    var _Client_logLevel;
    var _Client_logger;
    var _Client_prefixUrl;
    var _Client_timeoutMs;
    var _Client_notionVersion;
    var _Client_fetch;
    var _Client_agent;
    var _Client_userAgent;
    Object.defineProperty(exports, "__esModule", { value: true });
    var logging_1 = require_logging();
    var errors_1 = require_errors();
    var utils_1 = require_utils();
    var api_endpoints_1 = require_api_endpoints();
    var node_fetch_1 = require_browser();
    var package_json_1 = require_package();
    var Client2 = class _Client {
      static {
        __name(this, "Client");
      }
      constructor(options) {
        var _a, _b, _c, _d, _e, _f;
        _Client_auth.set(this, void 0);
        _Client_logLevel.set(this, void 0);
        _Client_logger.set(this, void 0);
        _Client_prefixUrl.set(this, void 0);
        _Client_timeoutMs.set(this, void 0);
        _Client_notionVersion.set(this, void 0);
        _Client_fetch.set(this, void 0);
        _Client_agent.set(this, void 0);
        _Client_userAgent.set(this, void 0);
        this.blocks = {
          /**
           * Retrieve block
           */
          retrieve: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.getBlock.path(args),
              method: api_endpoints_1.getBlock.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getBlock.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getBlock.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "retrieve"),
          /**
           * Update block
           */
          update: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.updateBlock.path(args),
              method: api_endpoints_1.updateBlock.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.updateBlock.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.updateBlock.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "update"),
          /**
           * Delete block
           */
          delete: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.deleteBlock.path(args),
              method: api_endpoints_1.deleteBlock.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.deleteBlock.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.deleteBlock.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "delete"),
          children: {
            /**
             * Append block children
             */
            append: /* @__PURE__ */ __name((args) => {
              return this.request({
                path: api_endpoints_1.appendBlockChildren.path(args),
                method: api_endpoints_1.appendBlockChildren.method,
                query: (0, utils_1.pick)(args, api_endpoints_1.appendBlockChildren.queryParams),
                body: (0, utils_1.pick)(args, api_endpoints_1.appendBlockChildren.bodyParams),
                auth: args === null || args === void 0 ? void 0 : args.auth
              });
            }, "append"),
            /**
             * Retrieve block children
             */
            list: /* @__PURE__ */ __name((args) => {
              return this.request({
                path: api_endpoints_1.listBlockChildren.path(args),
                method: api_endpoints_1.listBlockChildren.method,
                query: (0, utils_1.pick)(args, api_endpoints_1.listBlockChildren.queryParams),
                body: (0, utils_1.pick)(args, api_endpoints_1.listBlockChildren.bodyParams),
                auth: args === null || args === void 0 ? void 0 : args.auth
              });
            }, "list")
          }
        };
        this.databases = {
          /**
           * List databases
           *
           * @deprecated Please use `search`
           */
          list: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.listDatabases.path(),
              method: api_endpoints_1.listDatabases.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.listDatabases.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.listDatabases.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "list"),
          /**
           * Retrieve a database
           */
          retrieve: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.getDatabase.path(args),
              method: api_endpoints_1.getDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "retrieve"),
          /**
           * Query a database
           */
          query: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.queryDatabase.path(args),
              method: api_endpoints_1.queryDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.queryDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.queryDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "query"),
          /**
           * Create a database
           */
          create: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.createDatabase.path(),
              method: api_endpoints_1.createDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.createDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.createDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "create"),
          /**
           * Update a database
           */
          update: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.updateDatabase.path(args),
              method: api_endpoints_1.updateDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.updateDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.updateDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "update")
        };
        this.pages = {
          /**
           * Create a page
           */
          create: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.createPage.path(),
              method: api_endpoints_1.createPage.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.createPage.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.createPage.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "create"),
          /**
           * Retrieve a page
           */
          retrieve: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.getPage.path(args),
              method: api_endpoints_1.getPage.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getPage.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getPage.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "retrieve"),
          /**
           * Update page properties
           */
          update: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.updatePage.path(args),
              method: api_endpoints_1.updatePage.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.updatePage.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.updatePage.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "update"),
          properties: {
            /**
             * Retrieve page property
             */
            retrieve: /* @__PURE__ */ __name((args) => {
              return this.request({
                path: api_endpoints_1.getPageProperty.path(args),
                method: api_endpoints_1.getPageProperty.method,
                query: (0, utils_1.pick)(args, api_endpoints_1.getPageProperty.queryParams),
                body: (0, utils_1.pick)(args, api_endpoints_1.getPageProperty.bodyParams),
                auth: args === null || args === void 0 ? void 0 : args.auth
              });
            }, "retrieve")
          }
        };
        this.users = {
          /**
           * Retrieve a user
           */
          retrieve: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.getUser.path(args),
              method: api_endpoints_1.getUser.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getUser.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getUser.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "retrieve"),
          /**
           * List all users
           */
          list: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.listUsers.path(),
              method: api_endpoints_1.listUsers.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.listUsers.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.listUsers.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "list"),
          /**
           * Get details about bot
           */
          me: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.getSelf.path(),
              method: api_endpoints_1.getSelf.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getSelf.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getSelf.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "me")
        };
        this.comments = {
          /**
           * Create a comment
           */
          create: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.createComment.path(),
              method: api_endpoints_1.createComment.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.createComment.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.createComment.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "create"),
          /**
           * List comments
           */
          list: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.listComments.path(),
              method: api_endpoints_1.listComments.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.listComments.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.listComments.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }, "list")
        };
        this.search = (args) => {
          return this.request({
            path: api_endpoints_1.search.path(),
            method: api_endpoints_1.search.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.search.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.search.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        };
        this.oauth = {
          /**
           * Get token
           */
          token: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.oauthToken.path(),
              method: api_endpoints_1.oauthToken.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.oauthToken.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.oauthToken.bodyParams),
              auth: {
                client_id: args.client_id,
                client_secret: args.client_secret
              }
            });
          }, "token"),
          /**
           * Introspect token
           */
          introspect: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.oauthIntrospect.path(),
              method: api_endpoints_1.oauthIntrospect.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.oauthIntrospect.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.oauthIntrospect.bodyParams),
              auth: {
                client_id: args.client_id,
                client_secret: args.client_secret
              }
            });
          }, "introspect"),
          /**
           * Revoke token
           */
          revoke: /* @__PURE__ */ __name((args) => {
            return this.request({
              path: api_endpoints_1.oauthRevoke.path(),
              method: api_endpoints_1.oauthRevoke.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.oauthRevoke.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.oauthRevoke.bodyParams),
              auth: {
                client_id: args.client_id,
                client_secret: args.client_secret
              }
            });
          }, "revoke")
        };
        __classPrivateFieldSet(this, _Client_auth, options === null || options === void 0 ? void 0 : options.auth, "f");
        __classPrivateFieldSet(this, _Client_logLevel, (_a = options === null || options === void 0 ? void 0 : options.logLevel) !== null && _a !== void 0 ? _a : logging_1.LogLevel.WARN, "f");
        __classPrivateFieldSet(this, _Client_logger, (_b = options === null || options === void 0 ? void 0 : options.logger) !== null && _b !== void 0 ? _b : (0, logging_1.makeConsoleLogger)(package_json_1.name), "f");
        __classPrivateFieldSet(this, _Client_prefixUrl, `${(_c = options === null || options === void 0 ? void 0 : options.baseUrl) !== null && _c !== void 0 ? _c : "https://api.notion.com"}/v1/`, "f");
        __classPrivateFieldSet(this, _Client_timeoutMs, (_d = options === null || options === void 0 ? void 0 : options.timeoutMs) !== null && _d !== void 0 ? _d : 6e4, "f");
        __classPrivateFieldSet(this, _Client_notionVersion, (_e = options === null || options === void 0 ? void 0 : options.notionVersion) !== null && _e !== void 0 ? _e : _Client.defaultNotionVersion, "f");
        __classPrivateFieldSet(this, _Client_fetch, (_f = options === null || options === void 0 ? void 0 : options.fetch) !== null && _f !== void 0 ? _f : node_fetch_1.default, "f");
        __classPrivateFieldSet(this, _Client_agent, options === null || options === void 0 ? void 0 : options.agent, "f");
        __classPrivateFieldSet(this, _Client_userAgent, `notionhq-client/${package_json_1.version}`, "f");
      }
      /**
       * Sends a request.
       *
       * @param path
       * @param method
       * @param query
       * @param body
       * @returns
       */
      async request({ path, method, query, body, auth }) {
        this.log(logging_1.LogLevel.INFO, "request start", { method, path });
        const bodyAsJsonString = !body || Object.entries(body).length === 0 ? void 0 : JSON.stringify(body);
        const url = new URL(`${__classPrivateFieldGet(this, _Client_prefixUrl, "f")}${path}`);
        if (query) {
          for (const [key, value] of Object.entries(query)) {
            if (value !== void 0) {
              if (Array.isArray(value)) {
                value.forEach((val2) => url.searchParams.append(key, decodeURIComponent(val2)));
              } else {
                url.searchParams.append(key, String(value));
              }
            }
          }
        }
        let authorizationHeader;
        if (typeof auth === "object") {
          const unencodedCredential = `${auth.client_id}:${auth.client_secret}`;
          const encodedCredential = Buffer.from(unencodedCredential).toString("base64");
          authorizationHeader = { authorization: `Basic ${encodedCredential}` };
        } else {
          authorizationHeader = this.authAsHeaders(auth);
        }
        const headers = {
          ...authorizationHeader,
          "Notion-Version": __classPrivateFieldGet(this, _Client_notionVersion, "f"),
          "user-agent": __classPrivateFieldGet(this, _Client_userAgent, "f")
        };
        if (bodyAsJsonString !== void 0) {
          headers["content-type"] = "application/json";
        }
        try {
          const response = await errors_1.RequestTimeoutError.rejectAfterTimeout(__classPrivateFieldGet(this, _Client_fetch, "f").call(this, url.toString(), {
            method: method.toUpperCase(),
            headers,
            body: bodyAsJsonString,
            agent: __classPrivateFieldGet(this, _Client_agent, "f")
          }), __classPrivateFieldGet(this, _Client_timeoutMs, "f"));
          const responseText = await response.text();
          if (!response.ok) {
            throw (0, errors_1.buildRequestError)(response, responseText);
          }
          const responseJson = JSON.parse(responseText);
          this.log(logging_1.LogLevel.INFO, "request success", { method, path });
          return responseJson;
        } catch (error) {
          if (!(0, errors_1.isNotionClientError)(error)) {
            throw error;
          }
          this.log(logging_1.LogLevel.WARN, "request fail", {
            code: error.code,
            message: error.message
          });
          if ((0, errors_1.isHTTPResponseError)(error)) {
            this.log(logging_1.LogLevel.DEBUG, "failed response body", {
              body: error.body
            });
          }
          throw error;
        }
      }
      /**
       * Emits a log message to the console.
       *
       * @param level The level for this message
       * @param args Arguments to send to the console
       */
      log(level, message, extraInfo) {
        if ((0, logging_1.logLevelSeverity)(level) >= (0, logging_1.logLevelSeverity)(__classPrivateFieldGet(this, _Client_logLevel, "f"))) {
          __classPrivateFieldGet(this, _Client_logger, "f").call(this, level, message, extraInfo);
        }
      }
      /**
       * Transforms an API key or access token into a headers object suitable for an HTTP request.
       *
       * This method uses the instance's value as the default when the input is undefined. If neither are defined, it returns
       * an empty object
       *
       * @param auth API key or access token
       * @returns headers key-value object
       */
      authAsHeaders(auth) {
        const headers = {};
        const authHeaderValue = auth !== null && auth !== void 0 ? auth : __classPrivateFieldGet(this, _Client_auth, "f");
        if (authHeaderValue !== void 0) {
          headers["authorization"] = `Bearer ${authHeaderValue}`;
        }
        return headers;
      }
    };
    exports.default = Client2;
    _Client_auth = /* @__PURE__ */ new WeakMap(), _Client_logLevel = /* @__PURE__ */ new WeakMap(), _Client_logger = /* @__PURE__ */ new WeakMap(), _Client_prefixUrl = /* @__PURE__ */ new WeakMap(), _Client_timeoutMs = /* @__PURE__ */ new WeakMap(), _Client_notionVersion = /* @__PURE__ */ new WeakMap(), _Client_fetch = /* @__PURE__ */ new WeakMap(), _Client_agent = /* @__PURE__ */ new WeakMap(), _Client_userAgent = /* @__PURE__ */ new WeakMap();
    Client2.defaultNotionVersion = "2022-06-28";
  }
});

// ../../node_modules/@notionhq/client/build/src/helpers.js
var require_helpers = __commonJS({
  "../../node_modules/@notionhq/client/build/src/helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isMentionRichTextItemResponse = exports.isEquationRichTextItemResponse = exports.isTextRichTextItemResponse = exports.isFullComment = exports.isFullUser = exports.isFullPageOrDatabase = exports.isFullDatabase = exports.isFullPage = exports.isFullBlock = exports.collectPaginatedAPI = exports.iteratePaginatedAPI = void 0;
    async function* iteratePaginatedAPI(listFn, firstPageArgs) {
      let nextCursor = firstPageArgs.start_cursor;
      do {
        const response = await listFn({
          ...firstPageArgs,
          start_cursor: nextCursor
        });
        yield* response.results;
        nextCursor = response.next_cursor;
      } while (nextCursor);
    }
    __name(iteratePaginatedAPI, "iteratePaginatedAPI");
    exports.iteratePaginatedAPI = iteratePaginatedAPI;
    async function collectPaginatedAPI(listFn, firstPageArgs) {
      const results = [];
      for await (const item of iteratePaginatedAPI(listFn, firstPageArgs)) {
        results.push(item);
      }
      return results;
    }
    __name(collectPaginatedAPI, "collectPaginatedAPI");
    exports.collectPaginatedAPI = collectPaginatedAPI;
    function isFullBlock(response) {
      return response.object === "block" && "type" in response;
    }
    __name(isFullBlock, "isFullBlock");
    exports.isFullBlock = isFullBlock;
    function isFullPage(response) {
      return response.object === "page" && "url" in response;
    }
    __name(isFullPage, "isFullPage");
    exports.isFullPage = isFullPage;
    function isFullDatabase(response) {
      return response.object === "database" && "title" in response;
    }
    __name(isFullDatabase, "isFullDatabase");
    exports.isFullDatabase = isFullDatabase;
    function isFullPageOrDatabase(response) {
      if (response.object === "database") {
        return isFullDatabase(response);
      } else {
        return isFullPage(response);
      }
    }
    __name(isFullPageOrDatabase, "isFullPageOrDatabase");
    exports.isFullPageOrDatabase = isFullPageOrDatabase;
    function isFullUser(response) {
      return "type" in response;
    }
    __name(isFullUser, "isFullUser");
    exports.isFullUser = isFullUser;
    function isFullComment(response) {
      return "created_by" in response;
    }
    __name(isFullComment, "isFullComment");
    exports.isFullComment = isFullComment;
    function isTextRichTextItemResponse(richText) {
      return richText.type === "text";
    }
    __name(isTextRichTextItemResponse, "isTextRichTextItemResponse");
    exports.isTextRichTextItemResponse = isTextRichTextItemResponse;
    function isEquationRichTextItemResponse(richText) {
      return richText.type === "equation";
    }
    __name(isEquationRichTextItemResponse, "isEquationRichTextItemResponse");
    exports.isEquationRichTextItemResponse = isEquationRichTextItemResponse;
    function isMentionRichTextItemResponse(richText) {
      return richText.type === "mention";
    }
    __name(isMentionRichTextItemResponse, "isMentionRichTextItemResponse");
    exports.isMentionRichTextItemResponse = isMentionRichTextItemResponse;
  }
});

// ../../node_modules/@notionhq/client/build/src/index.js
var require_src = __commonJS({
  "../../node_modules/@notionhq/client/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isFullPageOrDatabase = exports.isFullComment = exports.isFullUser = exports.isFullPage = exports.isFullDatabase = exports.isFullBlock = exports.iteratePaginatedAPI = exports.collectPaginatedAPI = exports.isNotionClientError = exports.RequestTimeoutError = exports.UnknownHTTPResponseError = exports.APIResponseError = exports.ClientErrorCode = exports.APIErrorCode = exports.LogLevel = exports.Client = void 0;
    var Client_1 = require_Client();
    Object.defineProperty(exports, "Client", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return Client_1.default;
    }, "get") });
    var logging_1 = require_logging();
    Object.defineProperty(exports, "LogLevel", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return logging_1.LogLevel;
    }, "get") });
    var errors_1 = require_errors();
    Object.defineProperty(exports, "APIErrorCode", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return errors_1.APIErrorCode;
    }, "get") });
    Object.defineProperty(exports, "ClientErrorCode", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return errors_1.ClientErrorCode;
    }, "get") });
    Object.defineProperty(exports, "APIResponseError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return errors_1.APIResponseError;
    }, "get") });
    Object.defineProperty(exports, "UnknownHTTPResponseError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return errors_1.UnknownHTTPResponseError;
    }, "get") });
    Object.defineProperty(exports, "RequestTimeoutError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return errors_1.RequestTimeoutError;
    }, "get") });
    Object.defineProperty(exports, "isNotionClientError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return errors_1.isNotionClientError;
    }, "get") });
    var helpers_1 = require_helpers();
    Object.defineProperty(exports, "collectPaginatedAPI", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.collectPaginatedAPI;
    }, "get") });
    Object.defineProperty(exports, "iteratePaginatedAPI", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.iteratePaginatedAPI;
    }, "get") });
    Object.defineProperty(exports, "isFullBlock", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.isFullBlock;
    }, "get") });
    Object.defineProperty(exports, "isFullDatabase", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.isFullDatabase;
    }, "get") });
    Object.defineProperty(exports, "isFullPage", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.isFullPage;
    }, "get") });
    Object.defineProperty(exports, "isFullUser", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.isFullUser;
    }, "get") });
    Object.defineProperty(exports, "isFullComment", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.isFullComment;
    }, "get") });
    Object.defineProperty(exports, "isFullPageOrDatabase", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return helpers_1.isFullPageOrDatabase;
    }, "get") });
  }
});

// ../../packages/core/dist/parser.js
var NotionParser = class {
  static {
    __name(this, "NotionParser");
  }
  /**
   * Converts Notion blocks to a clean, optimized JSON structure
   * suitable for Astro rendering.
   */
  static parseBlocks(blocks) {
    return blocks.map((block) => {
      const parsed = {
        id: block.id,
        type: block.type,
        content: this.extractContent(block)
      };
      if (block.children) {
        parsed.children = this.parseBlocks(block.children);
      }
      return parsed;
    });
  }
  static extractContent(block) {
    const type = block.type;
    const data = block[type];
    switch (type) {
      case "paragraph":
      case "heading_1":
      case "heading_2":
      case "heading_3":
      case "bulleted_list_item":
      case "numbered_list_item":
      case "to_do":
      case "quote":
      case "toggle":
        return {
          rich_text: data.rich_text,
          checked: data.checked
          // For to_do
        };
      case "image":
      case "video":
      case "file":
      case "pdf":
        return {
          url: data.file?.url || data.external?.url,
          caption: data.caption,
          type: data.type
          // 'file' or 'external'
        };
      case "code":
        return {
          rich_text: data.rich_text,
          language: data.language
        };
      case "callout":
        return {
          rich_text: data.rich_text,
          icon: data.icon
        };
      case "button":
        return {
          rich_text: data.rich_text,
          outline: data.outline,
          color: data.color
        };
      case "bookmark":
        return {
          url: data.url,
          caption: data.caption
        };
      case "child_database":
        const metadata = this.parseDatabaseMetadata(data);
        return {
          title: metadata.title,
          original_title: data.title,
          viewType: metadata.viewType,
          layoutFlags: metadata.layoutFlags,
          // If the backend has injected `database_schema` and `database_rows` (Enrichment Strategy)
          schema: block.database_schema,
          rows: block.database_rows ? block.database_rows.map((row) => ({
            id: row.id,
            icon: row.icon?.emoji || row.icon?.external?.url || row.icon?.file?.url || null,
            cover: row.cover?.external?.url || row.cover?.file?.url || null,
            properties: this.parseDatabaseProperties(row.properties, block.database_schema),
            url: row.url
          })) : []
        };
      case "equation":
        return {
          expression: data.expression
        };
      case "divider":
      case "column_list":
      case "column":
      case "synced_block":
        return {};
      case "table":
        return {
          table_width: data.table_width,
          has_column_header: data.has_column_header,
          has_row_header: data.has_row_header
        };
      case "table_row":
        return {
          cells: data.cells
          // This is an array of rich_text arrays
        };
      default:
        return data;
    }
  }
  static parseDatabaseMetadata(data) {
    const title = data.title || "";
    const description = data.description || "";
    const knownTags = ["Gallery", "Masonry", "Board", "List", "Hero", "Calendar", "Timeline", "Feed", "Kanban", "Table"];
    const pattern = new RegExp(`\\[(${knownTags.join("|")})\\]`, "gi");
    const extract = /* @__PURE__ */ __name((text) => {
      const matches = text.match(pattern);
      return matches ? matches.map((m) => m.replace(/[\[\]]/g, "")) : [];
    }, "extract");
    let magicTags = extract(description);
    if (magicTags.length === 0) {
      magicTags = extract(title);
    }
    let viewType = "table";
    const hasTag = /* @__PURE__ */ __name((tag) => magicTags.some((t) => t.toLowerCase() === tag.toLowerCase()), "hasTag");
    if (hasTag("Calendar"))
      viewType = "calendar";
    else if (hasTag("Timeline"))
      viewType = "timeline";
    else if (hasTag("Gallery"))
      viewType = "gallery";
    else if (hasTag("Board") || hasTag("Kanban"))
      viewType = "board";
    else if (hasTag("Feed"))
      viewType = "feed";
    else if (hasTag("List"))
      viewType = "list";
    const cleanTitle = title.replace(pattern, "").trim();
    return {
      title: cleanTitle,
      viewType,
      layoutFlags: magicTags
    };
  }
  static parseDatabaseProperties(properties, schema) {
    const parsed = {};
    if (!properties)
      return parsed;
    for (const [key, value] of Object.entries(properties)) {
      const prop = value;
      const type = prop.type;
      if (!type)
        continue;
      switch (type) {
        case "title":
        case "rich_text":
          parsed[key] = prop[type]?.map((t) => t.plain_text).join("") || "";
          break;
        case "select":
          parsed[key] = prop.select;
          break;
        case "multi_select":
          parsed[key] = prop.multi_select;
          break;
        case "date":
          parsed[key] = prop.date;
          break;
        case "checkbox":
          parsed[key] = prop.checkbox;
          break;
        case "url":
          parsed[key] = prop.url;
          break;
        case "email":
          parsed[key] = prop.email;
          break;
        case "phone_number":
          parsed[key] = prop.phone_number;
          break;
        case "files":
          parsed[key] = prop.files?.map((f) => f.file?.url || f.external?.url) || [];
          break;
        case "people":
          parsed[key] = prop.people?.map((p) => ({
            id: p.id,
            name: p.name,
            avatar_url: p.avatar_url
          })) || [];
          break;
        case "status":
          parsed[key] = prop.status;
          break;
        case "created_time":
          parsed[key] = prop.created_time;
          break;
        case "last_edited_time":
          parsed[key] = prop.last_edited_time;
          break;
        case "number":
          parsed[key] = prop.number;
          break;
        case "formula":
          if (prop.formula.type === "string")
            parsed[key] = prop.formula.string;
          else if (prop.formula.type === "number")
            parsed[key] = prop.formula.number;
          else if (prop.formula.type === "boolean")
            parsed[key] = prop.formula.boolean;
          else if (prop.formula.type === "date")
            parsed[key] = prop.formula.date;
          break;
        case "relation":
          parsed[key] = prop.relation?.map((r) => r.id) || [];
          break;
        case "rollup":
          if (prop.rollup.type === "array") {
            parsed[key] = prop.rollup.array;
          } else {
            parsed[key] = prop.rollup[prop.rollup.type];
          }
          break;
        default:
          parsed[key] = null;
      }
    }
    return parsed;
  }
};

// ../../packages/core/dist/notion.js
var import_client = __toESM(require_src(), 1);
var NotionService = class {
  static {
    __name(this, "NotionService");
  }
  client;
  constructor(accessToken) {
    this.client = new import_client.Client({ auth: accessToken });
  }
  /**
   * Fetches all pages from a database that have been edited since the last sync.
   */
  async getUpdatedPages(databaseId, sinceDate) {
    return await this.client.databases.query({
      database_id: databaseId,
      ...sinceDate && {
        filter: {
          timestamp: "last_edited_time",
          last_edited_time: {
            on_or_after: sinceDate.toISOString()
          }
        }
      },
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending"
        }
      ]
    });
  }
  /**
   * Checks the single most recent change in the database.
   * Returns the ISO string of the last_edited_time.
   */
  async getLatestDatabaseChangeTime(databaseId) {
    const response = await this.client.databases.query({
      database_id: databaseId,
      page_size: 1,
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending"
        }
      ]
    });
    if (response.results.length === 0)
      return null;
    return response.results[0].last_edited_time;
  }
  /**
   * Recursively fetches all blocks for a given page/block with a depth limit to avoid subrequest limits.
   */
  async getBlocks(blockId, depth = 0, context = { requestCount: 0 }) {
    if (depth > 3 || context.requestCount > 40)
      return [];
    let blocks = [];
    let cursor;
    try {
      while (true) {
        context.requestCount++;
        const response = await this.client.blocks.children.list({
          block_id: blockId,
          start_cursor: cursor,
          page_size: 100
        });
        blocks.push(...response.results);
        if (!response.has_more || context.requestCount > 40)
          break;
        cursor = response.next_cursor;
      }
      for (const block of blocks) {
        if (block.type === "child_database") {
          try {
            const db = await this.client.databases.retrieve({ database_id: block.id });
            let allRows = [];
            let cursor2;
            while (true) {
              const response = await this.client.databases.query({
                database_id: block.id,
                page_size: 100,
                start_cursor: cursor2
              });
              allRows.push(...response.results);
              if (!response.has_more || allRows.length >= 1e3)
                break;
              cursor2 = response.next_cursor;
            }
            block.database_schema = db.properties;
            block.database_rows = allRows;
          } catch (e) {
            console.error(`Failed to enrich database ${block.id}`, e);
          }
        } else if (block.has_children && context.requestCount < 45) {
          block.children = await this.getBlocks(block.id, depth + 1, context);
        }
      }
    } catch (err) {
      console.error(`Error fetching blocks for ${blockId}:`, err);
    }
    return blocks;
  }
  /**
   * Fetches metadata for a single page.
   */
  async getPage(pageId) {
    return await this.client.pages.retrieve({ page_id: pageId });
  }
  /**
   * Fetches metadata for a single database.
   */
  async getDatabase(databaseId) {
    return await this.client.databases.retrieve({ database_id: databaseId });
  }
};

// ../../packages/core/dist/crypto.js
var CryptoService = class {
  static {
    __name(this, "CryptoService");
  }
  secretString;
  key = null;
  encoder = new TextEncoder();
  decoder = new TextDecoder();
  constructor(secretString) {
    this.secretString = secretString;
  }
  async ensureKey() {
    if (this.key)
      return;
    const hash = await crypto.subtle.digest("SHA-256", this.encoder.encode(this.secretString));
    this.key = await crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  }
  /**
   * Encrypts a string and returns a base64-encoded string containing IV + Ciphertext
   */
  async encrypt(text) {
    await this.ensureKey();
    if (!this.key)
      throw new Error("Failed to initialize CryptoKey");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedText = this.encoder.encode(text);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this.key, encodedText);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  }
  /**
   * Decrypts a base64-encoded string (IV + Ciphertext)
   */
  async decrypt(encryptedBase64) {
    await this.ensureKey();
    if (!this.key)
      throw new Error("Failed to initialize CryptoKey");
    const combined = new Uint8Array(atob(encryptedBase64).split("").map((c) => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.key, ciphertext);
    return this.decoder.decode(decrypted);
  }
};

// src/core/assets.ts
async function processBlocksForAssets(blocks, tenantId, pageId, env, context, notion) {
  for (const block of blocks) {
    if (context.requestCount > 45) break;
    const type = block.type;
    const data = block[type];
    const hijack = /* @__PURE__ */ __name(async (url) => {
      if (url && (url.includes("amazonaws.com") || data.type === "file")) {
        return await hijackAsset(url, tenantId, pageId, block.id, env, context);
      }
      return null;
    }, "hijack");
    if (["image", "video", "file", "pdf", "audio"].includes(type) && data) {
      const rawUrl = data.file?.url || data.external?.url;
      const newUrl = await hijack(rawUrl);
      if (newUrl) {
        block[type] = {
          ...data,
          // keep caption etc
          type: "file",
          file: { url: newUrl }
        };
      }
    } else if (type === "child_database" && data.title === "Untitled") {
      try {
        context.requestCount++;
        const dbInfo = await notion.getDatabase(block.id);
        const realTitle = dbInfo.title?.map((t) => t.plain_text).join("") || "Untitled";
        data.title = realTitle;
        console.log(`    Refreshed Database Title: ${realTitle}`);
      } catch (e) {
        console.warn(`    Failed to fetch database title for ${block.id}`, e);
      }
    }
    if (block.children) {
      await processBlocksForAssets(block.children, tenantId, pageId, env, context, notion);
    }
  }
}
__name(processBlocksForAssets, "processBlocksForAssets");
async function hijackAsset(url, tenantId, pageId, assetId, env, context) {
  console.log(`    Hijacking asset: ${assetId}`);
  context.requestCount++;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download asset: ${response.statusText}`);
    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    let extension = "bin";
    if (contentType.includes("image/")) extension = contentType.split("/")[1];
    else if (contentType === "application/pdf") extension = "pdf";
    else if (contentType.includes("video/")) extension = contentType.split("/")[1];
    if (extension === "jpeg") extension = "jpg";
    if (extension.includes(";")) extension = extension.split(";")[0];
    const key = `${tenantId}/${pageId}/${assetId}.${extension}`;
    await env.BUCKET.put(key, blob, {
      httpMetadata: { contentType }
    });
    return `/api/assets/${key}`;
  } catch (e) {
    console.error(`      Failed to hijack asset ${assetId}:`, e);
    return url;
  }
}
__name(hijackAsset, "hijackAsset");
async function processPageAssets(page, tenantId, env, context) {
  let coverUrl = null;
  let iconUrl = null;
  if (page.cover) {
    const rawUrl = page.cover.file?.url || page.cover.external?.url;
    if (rawUrl) {
      if (rawUrl.includes("amazonaws.com") || page.cover.type === "file") {
        coverUrl = await hijackAsset(rawUrl, tenantId, page.id, "cover", env, context);
      } else {
        coverUrl = rawUrl;
      }
    }
  }
  if (page.icon && page.icon.type === "file") {
    const rawUrl = page.icon.file.url;
    if (rawUrl) {
      iconUrl = await hijackAsset(rawUrl, tenantId, page.id, "icon", env, context);
    }
  }
  return { coverUrl, iconUrl };
}
__name(processPageAssets, "processPageAssets");

// src/core/ai.ts
async function provideAISidekick(title, blocks, env) {
  if (!env.AI) return null;
  const contentSnippet = blocks.filter((b) => ["paragraph", "heading_1", "heading_2", "heading_3", "quote"].includes(b.type)).map((b) => b.content.rich_text?.map((t) => t.plain_text).join("") || "").join("\n").substring(0, 2e3);
  const prompt = `
        You are an expert content analyzer for a blogging platform called NotionGlaze.
        Analyze the following blog post title and content snippet.
        Provide:
        1. A list of 3-5 relevant tags (comma separated).
        2. A concise SEO description (max 160 chars).
        3. A short summary (max 200 chars).

        Title: ${title}
        Content: ${contentSnippet}

        Return ONLY a JSON object in this format:
        {"tags": ["tag1", "tag2"], "seoDescription": "...", "summary": "..."}
    `;
  try {
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are a helpful assistant that returns JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    return response;
  } catch (e) {
    console.error("AI Sidekick Error:", e);
    return null;
  }
}
__name(provideAISidekick, "provideAISidekick");

// src/core/sync.ts
var val = /* @__PURE__ */ __name((v) => v === void 0 ? null : v, "val");
async function syncTenant(tenant, env) {
  console.log(`Processing Tenant: ${tenant.id}`);
  await env.DB.prepare("UPDATE tenants SET sync_status = ?, last_sync_error = NULL, sync_progress = 0, sync_heartbeat = ? WHERE id = ?").bind("syncing", val(Date.now()), val(tenant.id)).run();
  try {
    const encryptionSecret = env.ENCRYPTION_SECRET || "fallback-secret-for-dev-only";
    const cryptoService = new CryptoService(encryptionSecret);
    const decryptedToken = await cryptoService.decrypt(tenant.notion_access_token);
    const notion = new NotionService(decryptedToken);
    let { results: sources } = await env.DB.prepare("SELECT * FROM tenant_sources WHERE tenant_id = ?").bind(tenant.id).all();
    if (sources.length === 0 && tenant.root_page_id) {
      sources = [{
        id: "legacy-root",
        notion_db_id: tenant.root_page_id,
        name: "Main",
        auto_tag: null
      }];
    }
    if (sources.length === 0) {
      throw new Error("No content sources found. Connect a database in settings.");
    }
    const allUpdatedPages = [];
    for (const source of sources) {
      console.log(`  Checking Source: ${source.name} (${source.notion_db_id})`);
      const latestPost = await env.DB.prepare(
        "SELECT last_edited_time FROM posts WHERE tenant_id = ? AND source_id = ? ORDER BY last_edited_time DESC LIMIT 1"
      ).bind(tenant.id, source.id).first();
      const ourLatestMs = latestPost?.last_edited_time || 0;
      const notionLatestStr = await notion.getLatestDatabaseChangeTime(source.notion_db_id);
      if (notionLatestStr) {
        const notionLatestMs = new Date(notionLatestStr).getTime();
        if (notionLatestMs <= ourLatestMs) {
          console.log(`    [Optimization] No changes for source ${source.name}.`);
          continue;
        }
      }
      const lastSyncDate = ourLatestMs > 0 ? new Date(ourLatestMs) : void 0;
      const response = await notion.getUpdatedPages(source.notion_db_id, lastSyncDate);
      for (const page of response.results) {
        page._sourceContext = {
          sourceId: source.id,
          autoTag: source.auto_tag
        };
        allUpdatedPages.push(page);
      }
    }
    console.log(`  Found ${allUpdatedPages.length} total updated pages across ${sources.length} sources.`);
    if (allUpdatedPages.length === 0) {
      await env.DB.prepare("UPDATE tenants SET sync_status = ?, last_synced_at = ?, last_sync_count = 0, sync_progress = 100, sync_heartbeat = ? WHERE id = ?").bind("idle", val(Date.now()), val(Date.now()), val(tenant.id)).run();
      return;
    }
    await env.DB.prepare("UPDATE tenants SET sync_total = ?, sync_processed = 0, sync_heartbeat = ? WHERE id = ?").bind(val(allUpdatedPages.length), val(Date.now()), val(tenant.id)).run();
    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < allUpdatedPages.length; i += chunkSize) {
      chunks.push(allUpdatedPages.slice(i, i + chunkSize));
    }
    const chunkPromises = chunks.map((chunk, index) => {
      if (env.SYNC_WORKER) {
        return env.SYNC_WORKER.fetch("http://internal/sync-chunk", {
          method: "POST",
          body: JSON.stringify({
            tenantId: tenant.id,
            pages: chunk,
            isLastChunk: index === chunks.length - 1
          })
        });
      } else {
        return processChunk(tenant.id, chunk, env, index === chunks.length - 1);
      }
    });
    await Promise.all(chunkPromises);
    console.log(`Sync Lead complete for ${tenant.id}.`);
  } catch (err) {
    console.error(`Failed to sync tenant ${tenant.id}:`, err);
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    await env.DB.prepare("UPDATE tenants SET sync_status = ?, last_sync_error = ?, sync_heartbeat = ? WHERE id = ?").bind("error", val(errorMsg), val(Date.now()), val(tenant.id)).run();
  }
}
__name(syncTenant, "syncTenant");
async function processChunk(tenantId, pages, env, isLastChunk) {
  console.log(`  Chunk Worker: Processing ${pages.length} pages for ${tenantId}`);
  const context = { requestCount: 0 };
  try {
    const tenant = await env.DB.prepare("SELECT * FROM tenants WHERE id = ?").bind(tenantId).first();
    if (tenant && tenant.config_json) {
      try {
        tenant.config = JSON.parse(tenant.config_json);
      } catch (e) {
        tenant.config = {};
      }
    } else if (tenant) {
      tenant.config = {};
    }
    const encryptionSecret = env.ENCRYPTION_SECRET || "fallback-secret-for-dev-only";
    const cryptoService = new CryptoService(encryptionSecret);
    const decryptedToken = await cryptoService.decrypt(tenant.notion_access_token);
    const notion = new NotionService(decryptedToken);
    for (const page of pages) {
      try {
        await processPage(page, tenant, env, notion, context);
      } catch (pageErr) {
        console.error(`  Failed to process page ${page.id}:`, pageErr);
      } finally {
        await env.DB.prepare(`
                    UPDATE tenants 
                    SET sync_processed = sync_processed + 1,
                        sync_progress = ( (sync_processed + 1) * 100 / sync_total ),
                        sync_heartbeat = ?
                    WHERE id = ?
                `).bind(val(Date.now()), val(tenantId)).run();
      }
    }
    const finalCheck = await env.DB.prepare("SELECT sync_processed, sync_total FROM tenants WHERE id = ?").bind(tenantId).first();
    if (finalCheck && finalCheck.sync_processed >= finalCheck.sync_total) {
      await env.DB.prepare("UPDATE tenants SET sync_status = ?, last_synced_at = ?, last_sync_count = ?, sync_progress = 100 WHERE id = ?").bind("idle", val(Date.now()), val(finalCheck.sync_processed), val(tenantId)).run();
      console.log(`Sync for ${tenantId} marked as IDLE.`);
    }
  } catch (err) {
    console.error(`Chunk Worker failed for ${tenantId}:`, err);
  }
}
__name(processChunk, "processChunk");
async function processPage(page, tenant, env, notion, context) {
  const tenantId = tenant.id;
  const config = tenant.config || {};
  const pageId = page.id;
  const lastEditedTimeMs = new Date(page.last_edited_time).getTime();
  const sourceContext = page._sourceContext || {};
  const sourceId = sourceContext.sourceId || null;
  const autoTag = sourceContext.autoTag;
  const existing = await env.DB.prepare("SELECT last_edited_time FROM posts WHERE id = ?").bind(pageId).first();
  if (existing && existing.last_edited_time >= lastEditedTimeMs) {
    console.log(`    [Skip] Page ${pageId} is already up to date.`);
    return;
  }
  console.log(`  Syncing Page: ${pageId} (Source: ${sourceId})`);
  const blocks = await notion.getBlocks(pageId, 0, context);
  const { coverUrl, iconUrl } = await processPageAssets(page, tenantId, env, context);
  if (coverUrl) page._coverUrl = coverUrl;
  if (iconUrl) page.icon = { type: "file", file: { url: iconUrl } };
  await processBlocksForAssets(blocks, tenantId, pageId, env, context, notion);
  const parsedBlocks = NotionParser.parseBlocks(blocks);
  const props = page.properties;
  const titlePropKey = Object.keys(props).find((key) => props[key].type === "title");
  const title = titlePropKey ? props[titlePropKey].title?.[0]?.plain_text || "Untitled" : "Untitled";
  const slugPropKey = Object.keys(props).find(
    (key) => ["Slug", "slug", "\uC2AC\uB7EC\uADF8", "URL", "url"].includes(key)
  );
  const slug = slugPropKey ? props[slugPropKey].rich_text?.[0]?.plain_text || pageId : pageId;
  const statusPropKey = Object.keys(props).find(
    (key) => ["Status", "status", "\uC0C1\uD0DC"].includes(key)
  );
  const status = statusPropKey ? props[statusPropKey].status?.name || props[statusPropKey].select?.name || "Published" : "Published";
  const summaryPropKey = Object.keys(props).find(
    (key) => ["Summary", "summary", "\uC694\uC57D", "Description", "\uC124\uBA85"].includes(key)
  );
  let summary = summaryPropKey ? props[summaryPropKey].rich_text?.[0]?.plain_text || null : null;
  const tagsPropKey = Object.keys(props).find(
    (key) => ["Tags", "tags", "\uD0DC\uADF8"].includes(key)
  );
  let tags = tagsPropKey ? props[tagsPropKey].multi_select?.map((t) => t.name) || [] : [];
  if (autoTag && !tags.includes(autoTag)) {
    tags.push(autoTag);
  }
  const datePropKey = Object.keys(props).find(
    (key) => ["Date", "date", "\uB0A0\uC9DC", "PublishedAt"].includes(key)
  );
  const publishedAt = datePropKey && props[datePropKey].date?.start ? new Date(props[datePropKey].date.start).getTime() : null;
  const notionUrl = page.url;
  const seoTitle = props["SEO Title"]?.rich_text?.[0]?.plain_text || title;
  let seoDescription = props["SEO Description"]?.rich_text?.[0]?.plain_text || summary;
  if (tenant.plan === "pro") {
    const needsAI = config.ai_seo_enabled && (!seoDescription || seoDescription.length < 10) || config.ai_tagging_enabled && tags.length === 0;
    if (needsAI) {
      console.log(`    [AI Sidekick] Analyzing page content for ${pageId}...`);
      try {
        const aiResult = await provideAISidekick(title, parsedBlocks, env);
        if (aiResult) {
          if (config.ai_seo_enabled) {
            if (!summary) summary = aiResult.summary;
            if (!seoDescription || seoDescription.length < 10) seoDescription = aiResult.seoDescription;
          }
          if (config.ai_tagging_enabled && aiResult.tags && Array.isArray(aiResult.tags)) {
            for (const t of aiResult.tags) {
              if (!tags.includes(t)) tags.push(t);
            }
          }
        }
      } catch (aiErr) {
        console.warn(`    [AI Sidekick] Failed for ${pageId}:`, aiErr);
      }
    }
  }
  const icon = page.icon ? JSON.stringify(page.icon) : null;
  const createdTime = new Date(page.created_time).getTime();
  const lastEditedTime = new Date(page.last_edited_time).getTime();
  const archived = page.archived ? 1 : 0;
  const inTrash = page.in_trash ? 1 : 0;
  const statements = [];
  statements.push(env.DB.prepare(`
        INSERT INTO posts (
            id, tenant_id, source_id, slug, title, summary, tags, content_json, 
            cover_image_url, 
            published_at, last_edited_time, status, notion_url,
            icon, created_time, archived, in_trash,
            seo_title, seo_description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            source_id = excluded.source_id,
            title = excluded.title,
            slug = excluded.slug,
            summary = excluded.summary,
            tags = excluded.tags,
            content_json = excluded.content_json,
            published_at = excluded.published_at,
            last_edited_time = excluded.last_edited_time,
            status = excluded.status,
            notion_url = excluded.notion_url,
            icon = excluded.icon,
            created_time = excluded.created_time,
            archived = excluded.archived,
            in_trash = excluded.in_trash,
            seo_title = excluded.seo_title,
            seo_description = excluded.seo_description
    `).bind(
    val(pageId),
    val(tenantId),
    val(sourceId),
    val(slug),
    val(title),
    val(summary),
    JSON.stringify(tags),
    JSON.stringify(parsedBlocks),
    val(page._coverUrl),
    val(publishedAt),
    val(lastEditedTime),
    val(status),
    val(notionUrl),
    val(icon),
    val(createdTime),
    val(archived),
    val(inTrash),
    val(seoTitle),
    val(seoDescription)
  ));
  collectBlockStatements(parsedBlocks, pageId, tenantId, null, env, statements);
  context.requestCount++;
  await env.DB.batch(statements);
}
__name(processPage, "processPage");
function collectBlockStatements(blocks, postId, tenantId, parentId, env, statements) {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    statements.push(env.DB.prepare(`
            INSERT INTO blocks (
                id, post_id, tenant_id, parent_id, type, content_json, 
                created_time, last_edited_time, order_index
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                content_json = excluded.content_json,
                last_edited_time = excluded.last_edited_time,
                order_index = excluded.order_index
        `).bind(
      val(block.id),
      val(postId),
      val(tenantId),
      val(parentId),
      val(block.type),
      val(JSON.stringify(block.content)),
      val(block.created_time),
      val(block.last_edited_time),
      val(i)
    ));
    if (block.children && block.children.length > 0) {
      collectBlockStatements(block.children, postId, tenantId, block.id, env, statements);
    }
  }
}
__name(collectBlockStatements, "collectBlockStatements");

// src/index.ts
var index_default = {
  async scheduled(event, env, ctx) {
    console.log("--- Starting Sync Heist 2.0 (Parallel) ---");
    try {
      const now = Math.floor(Date.now() / 1e3);
      const { results: tenants } = await env.DB.prepare(`
                SELECT * FROM tenants 
                WHERE plan = 'pro' 
                OR (plan = 'trial' AND trial_ends_at > ?)
            `).bind(now).all();
      console.log(`Found ${tenants.length} eligible tenants for sync.`);
      for (const tenant of tenants) {
        ctx.waitUntil(syncTenant(tenant, env));
      }
    } catch (err) {
      console.error("Scheduled Sync Dispatch failed:", err);
    }
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/sync-chunk")) {
      const body = await request.json();
      ctx.waitUntil(processChunk(body.tenantId, body.pages, env, body.isLastChunk));
      return new Response("Chunk processing started");
    }
    if (url.pathname.endsWith("/sync")) {
      const tenantId = url.searchParams.get("tenantId");
      if (tenantId) {
        const tenant = await env.DB.prepare("SELECT * FROM tenants WHERE id = ?").bind(tenantId).first();
        if (!tenant) {
          return new Response(`Tenant ${tenantId} not found`, { status: 404 });
        }
        const now = Math.floor(Date.now() / 1e3);
        const t = tenant;
        if (t.plan !== "pro" && (!t.trial_ends_at || now > t.trial_ends_at)) {
          return new Response(`Sync blocked: Trial expired or no active subscription.`, { status: 403 });
        }
        ctx.waitUntil(syncTenant(tenant, env));
        return new Response(`Sync triggered for tenant ${tenantId}`);
      } else {
        ctx.waitUntil(this.scheduled({}, env, ctx));
        return new Response("Sync triggered for all tenants.");
      }
    }
    return new Response("Sync Worker is active.");
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
