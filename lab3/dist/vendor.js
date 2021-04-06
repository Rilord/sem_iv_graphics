__fuse.bundle({

// node_modules/fuse-box/modules/fuse-box-websocket/index.js @4
4: function(__fusereq, exports, module){
const events = __fusereq(5);
function log(text) {
  console.info(`%c${text}`, 'color: #237abe');
}
class SocketClient {
  constructor(opts) {
    opts = opts || ({});
    const port = opts.port || window.location.port;
    const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
    const domain = location.hostname || 'localhost';
    if (opts.connectionURL) {
      this.url = opts.connectionURL;
    } else {
      if (opts.useCurrentURL) {
        this.url = protocol + location.hostname + (location.port ? ':' + location.port : '');
      }
      if (opts.port) {
        this.url = `${protocol}${domain}:${opts.port}`;
      }
    }
    this.authSent = false;
    this.emitter = new events.EventEmitter();
  }
  reconnect(fn) {
    setTimeout(() => {
      this.emitter.emit('reconnect', {
        message: 'Trying to reconnect'
      });
      this.connect(fn);
    }, 5000);
  }
  on(event, fn) {
    this.emitter.on(event, fn);
  }
  connect(fn) {
    setTimeout(() => {
      log(`Connecting to FuseBox HMR at ${this.url}`);
      this.client = new WebSocket(this.url);
      this.bindEvents(fn);
    }, 0);
  }
  close() {
    this.client.close();
  }
  send(eventName, data) {
    if (this.client.readyState === 1) {
      this.client.send(JSON.stringify({
        name: eventName,
        payload: data || ({})
      }));
    }
  }
  error(data) {
    this.emitter.emit('error', data);
  }
  bindEvents(fn) {
    this.client.onopen = event => {
      log('Connection successful');
      if (fn) {
        fn(this);
      }
    };
    this.client.onerror = event => {
      this.error({
        reason: event.reason,
        message: 'Socket error'
      });
    };
    this.client.onclose = event => {
      this.emitter.emit('close', {
        message: 'Socket closed'
      });
      if (event.code !== 1011) {
        this.reconnect(fn);
      }
    };
    this.client.onmessage = event => {
      let data = event.data;
      if (data) {
        let item = JSON.parse(data);
        this.emitter.emit(item.name, item.payload);
      }
    };
  }
}
exports.SocketClient = SocketClient;

},

// node_modules/fuse-box/modules/events/index.js @5
5: function(__fusereq, exports, module){
function EventEmitter() {
  this._events = this._events || ({});
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;
EventEmitter.defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function (n) {
  if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};
EventEmitter.prototype.emit = function (type) {
  var er, handler, len, args, i, listeners;
  if (!this._events) this._events = {};
  if (type === 'error') {
    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er;
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }
  handler = this._events[type];
  if (isUndefined(handler)) return false;
  if (isFunction(handler)) {
    switch (arguments.length) {
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++) listeners[i].apply(this, args);
  }
  return true;
};
EventEmitter.prototype.addListener = function (type, listener) {
  var m;
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  if (!this._events) this._events = {};
  if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);
  if (!this._events[type]) this._events[type] = listener; else if (isObject(this._events[type])) this._events[type].push(listener); else this._events[type] = [this._events[type], listener];
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }
    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
      if (typeof console.trace === 'function') {
        console.trace();
      }
    }
  }
  return this;
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.once = function (type, listener) {
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  var fired = false;
  function g() {
    this.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }
  g.listener = listener;
  this.on(type, g);
  return this;
};
EventEmitter.prototype.removeListener = function (type, listener) {
  var list, position, length, i;
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  if (!this._events || !this._events[type]) return this;
  list = this._events[type];
  length = list.length;
  position = -1;
  if (list === listener || isFunction(list.listener) && list.listener === listener) {
    delete this._events[type];
    if (this._events.removeListener) this.emit('removeListener', type, listener);
  } else if (isObject(list)) {
    for (i = length; i-- > 0; ) {
      if (list[i] === listener || list[i].listener && list[i].listener === listener) {
        position = i;
        break;
      }
    }
    if (position < 0) return this;
    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }
    if (this._events.removeListener) this.emit('removeListener', type, listener);
  }
  return this;
};
EventEmitter.prototype.removeAllListeners = function (type) {
  var key, listeners;
  if (!this._events) return this;
  if (!this._events.removeListener) {
    if (arguments.length === 0) this._events = {}; else if (this._events[type]) delete this._events[type];
    return this;
  }
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }
  listeners = this._events[type];
  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];
  return this;
};
EventEmitter.prototype.listeners = function (type) {
  var ret;
  if (!this._events || !this._events[type]) ret = []; else if (isFunction(this._events[type])) ret = [this._events[type]]; else ret = this._events[type].slice();
  return ret;
};
EventEmitter.prototype.listenerCount = function (type) {
  if (this._events) {
    var evlistener = this._events[type];
    if (isFunction(evlistener)) return 1; else if (evlistener) return evlistener.length;
  }
  return 0;
};
EventEmitter.listenerCount = function (emitter, type) {
  return emitter.listenerCount(type);
};
function isFunction(arg) {
  return typeof arg === 'function';
}
function isNumber(arg) {
  return typeof arg === 'number';
}
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
function isUndefined(arg) {
  return arg === void 0;
}

},

// node_modules/fuse-box/modules/fuse-box-hot-reload/clientHotReload.ts @2
2: function(__fusereq, exports, module){
exports.__esModule = true;
const {SocketClient} = __fusereq(4);
function log(text) {
  console.info(`%c${text}`, 'color: #237abe');
}
const STYLESHEET_EXTENSIONS = ['.css', '.scss', '.sass', '.less', '.styl'];
function gatherSummary() {
  const modules = [];
  for (const id in __fuse.modules) {
    modules.push(parseInt(id));
  }
  return {
    modules
  };
}
function createHMRHelper(payload) {
  const {updates} = payload;
  let isStylesheeetUpdate = true;
  for (const item of updates) {
    const file = item.path;
    const s = file.match(/(\.\w+)$/i);
    const extension = s[1];
    if (!STYLESHEET_EXTENSIONS.includes(extension)) {
      isStylesheeetUpdate = false;
    }
  }
  return {
    isStylesheeetUpdate,
    callEntries: () => {
      const appEntries = [1];
      for (const entryId of appEntries) {
        __fuse.r(entryId);
      }
    },
    callModules: modules => {
      for (const item of modules) __fuse.r(item.id);
    },
    flushAll: () => {
      __fuse.c = {};
    },
    flushModules: modules => {
      for (const item of modules) {
        __fuse.c[item.id] = undefined;
      }
    },
    updateModules: () => {
      for (const update of updates) {
        new Function(update.content)();
      }
    }
  };
}
exports.connect = opts => {
  let client = new SocketClient(opts);
  client.connect();
  client.on('get-summary', data => {
    const {id} = data;
    const summary = gatherSummary();
    client.send('summary', {
      id,
      summary
    });
  });
  client.on('reload', () => {
    window.location.reload();
  });
  client.on('hmr', payload => {
    const {updates} = payload;
    const hmr = createHMRHelper(payload);
    const hmrModuleId = undefined;
    if (hmrModuleId) {
      const hmrModule = __fuse.r(hmrModuleId);
      if (!hmrModule.default) throw new Error('An HMR plugin must export a default function');
      hmrModule.default(payload, hmr);
      return;
    }
    hmr.updateModules();
    if (hmr.isStylesheeetUpdate) {
      log(`Flushing ${updates.map(item => item.path)}`);
      hmr.flushModules(updates);
      log(`Calling modules ${updates.map(item => item.path)}`);
      hmr.callModules(updates);
    } else {
      log(`Flushing all`);
      hmr.flushAll();
      log(`Calling entries all`);
      hmr.callEntries();
    }
  });
};

},

// node_modules/jquery/dist/jquery.js @3
3: function(__fusereq, exports, module){
(function (global, factory) {
  "use strict";
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = global.document ? factory(global, true) : function (w) {
      if (!w.document) {
        throw new Error("jQuery requires a window with a document");
      }
      return factory(w);
    };
  } else {
    factory(global);
  }
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
  "use strict";
  var arr = [];
  var getProto = Object.getPrototypeOf;
  var slice = arr.slice;
  var flat = arr.flat ? function (array) {
    return arr.flat.call(array);
  } : function (array) {
    return arr.concat.apply([], array);
  };
  var push = arr.push;
  var indexOf = arr.indexOf;
  var class2type = {};
  var toString = class2type.toString;
  var hasOwn = class2type.hasOwnProperty;
  var fnToString = hasOwn.toString;
  var ObjectFunctionString = fnToString.call(Object);
  var support = {};
  var isFunction = function isFunction(obj) {
    return typeof obj === "function" && typeof obj.nodeType !== "number" && typeof obj.item !== "function";
  };
  var isWindow = function isWindow(obj) {
    return obj != null && obj === obj.window;
  };
  var document = window.document;
  var preservedScriptAttributes = {
    type: true,
    src: true,
    nonce: true,
    noModule: true
  };
  function DOMEval(code, node, doc) {
    doc = doc || document;
    var i, val, script = doc.createElement("script");
    script.text = code;
    if (node) {
      for (i in preservedScriptAttributes) {
        val = node[i] || node.getAttribute && node.getAttribute(i);
        if (val) {
          script.setAttribute(i, val);
        }
      }
    }
    doc.head.appendChild(script).parentNode.removeChild(script);
  }
  function toType(obj) {
    if (obj == null) {
      return obj + "";
    }
    return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
  }
  var version = "3.6.0", jQuery = function (selector, context) {
    return new jQuery.fn.init(selector, context);
  };
  jQuery.fn = jQuery.prototype = {
    jquery: version,
    constructor: jQuery,
    length: 0,
    toArray: function () {
      return slice.call(this);
    },
    get: function (num) {
      if (num == null) {
        return slice.call(this);
      }
      return num < 0 ? this[num + this.length] : this[num];
    },
    pushStack: function (elems) {
      var ret = jQuery.merge(this.constructor(), elems);
      ret.prevObject = this;
      return ret;
    },
    each: function (callback) {
      return jQuery.each(this, callback);
    },
    map: function (callback) {
      return this.pushStack(jQuery.map(this, function (elem, i) {
        return callback.call(elem, i, elem);
      }));
    },
    slice: function () {
      return this.pushStack(slice.apply(this, arguments));
    },
    first: function () {
      return this.eq(0);
    },
    last: function () {
      return this.eq(-1);
    },
    even: function () {
      return this.pushStack(jQuery.grep(this, function (_elem, i) {
        return (i + 1) % 2;
      }));
    },
    odd: function () {
      return this.pushStack(jQuery.grep(this, function (_elem, i) {
        return i % 2;
      }));
    },
    eq: function (i) {
      var len = this.length, j = +i + (i < 0 ? len : 0);
      return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },
    end: function () {
      return this.prevObject || this.constructor();
    },
    push: push,
    sort: arr.sort,
    splice: arr.splice
  };
  jQuery.extend = jQuery.fn.extend = function () {
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || ({}), i = 1, length = arguments.length, deep = false;
    if (typeof target === "boolean") {
      deep = target;
      target = arguments[i] || ({});
      i++;
    }
    if (typeof target !== "object" && !isFunction(target)) {
      target = {};
    }
    if (i === length) {
      target = this;
      i--;
    }
    for (; i < length; i++) {
      if ((options = arguments[i]) != null) {
        for (name in options) {
          copy = options[name];
          if (name === "__proto__" || target === copy) {
            continue;
          }
          if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
            src = target[name];
            if (copyIsArray && !Array.isArray(src)) {
              clone = [];
            } else if (!copyIsArray && !jQuery.isPlainObject(src)) {
              clone = {};
            } else {
              clone = src;
            }
            copyIsArray = false;
            target[name] = jQuery.extend(deep, clone, copy);
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    return target;
  };
  jQuery.extend({
    expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
    isReady: true,
    error: function (msg) {
      throw new Error(msg);
    },
    noop: function () {},
    isPlainObject: function (obj) {
      var proto, Ctor;
      if (!obj || toString.call(obj) !== "[object Object]") {
        return false;
      }
      proto = getProto(obj);
      if (!proto) {
        return true;
      }
      Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
      return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
    },
    isEmptyObject: function (obj) {
      var name;
      for (name in obj) {
        return false;
      }
      return true;
    },
    globalEval: function (code, options, doc) {
      DOMEval(code, {
        nonce: options && options.nonce
      }, doc);
    },
    each: function (obj, callback) {
      var length, i = 0;
      if (isArrayLike(obj)) {
        length = obj.length;
        for (; i < length; i++) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      } else {
        for (i in obj) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      }
      return obj;
    },
    makeArray: function (arr, results) {
      var ret = results || [];
      if (arr != null) {
        if (isArrayLike(Object(arr))) {
          jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
        } else {
          push.call(ret, arr);
        }
      }
      return ret;
    },
    inArray: function (elem, arr, i) {
      return arr == null ? -1 : indexOf.call(arr, elem, i);
    },
    merge: function (first, second) {
      var len = +second.length, j = 0, i = first.length;
      for (; j < len; j++) {
        first[i++] = second[j];
      }
      first.length = i;
      return first;
    },
    grep: function (elems, callback, invert) {
      var callbackInverse, matches = [], i = 0, length = elems.length, callbackExpect = !invert;
      for (; i < length; i++) {
        callbackInverse = !callback(elems[i], i);
        if (callbackInverse !== callbackExpect) {
          matches.push(elems[i]);
        }
      }
      return matches;
    },
    map: function (elems, callback, arg) {
      var length, value, i = 0, ret = [];
      if (isArrayLike(elems)) {
        length = elems.length;
        for (; i < length; i++) {
          value = callback(elems[i], i, arg);
          if (value != null) {
            ret.push(value);
          }
        }
      } else {
        for (i in elems) {
          value = callback(elems[i], i, arg);
          if (value != null) {
            ret.push(value);
          }
        }
      }
      return flat(ret);
    },
    guid: 1,
    support: support
  });
  if (typeof Symbol === "function") {
    jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
  }
  jQuery.each(("Boolean Number String Function Array Date RegExp Object Error Symbol").split(" "), function (_i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
  });
  function isArrayLike(obj) {
    var length = !!obj && ("length" in obj) && obj.length, type = toType(obj);
    if (isFunction(obj) || isWindow(obj)) {
      return false;
    }
    return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1 in obj);
  }
  var Sizzle = (function (window) {
    var i, support, Expr, getText, isXML, tokenize, compile, select, outermostContext, sortInput, hasDuplicate, setDocument, document, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains, expando = "sizzle" + 1 * new Date(), preferredDoc = window.document, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), nonnativeSelectorCache = createCache(), sortOrder = function (a, b) {
      if (a === b) {
        hasDuplicate = true;
      }
      return 0;
    }, hasOwn = ({}).hasOwnProperty, arr = [], pop = arr.pop, pushNative = arr.push, push = arr.push, slice = arr.slice, indexOf = function (list, elem) {
      var i = 0, len = list.length;
      for (; i < len; i++) {
        if (list[i] === elem) {
          return i;
        }
      }
      return -1;
    }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|" + "ismap|loop|multiple|open|readonly|required|scoped", whitespace = "[\\x20\\t\\r\\n\\f]", identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+", attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + "*([*^$|!~]?=)" + whitespace + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]", pseudos = ":(" + identifier + ")(?:\\((" + "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" + "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" + ".*" + ")\\)|)", rwhitespace = new RegExp(whitespace + "+", "g"), rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rdescend = new RegExp(whitespace + "|>"), rpseudo = new RegExp(pseudos), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = {
      "ID": new RegExp("^#(" + identifier + ")"),
      "CLASS": new RegExp("^\\.(" + identifier + ")"),
      "TAG": new RegExp("^(" + identifier + "|[*])"),
      "ATTR": new RegExp("^" + attributes),
      "PSEUDO": new RegExp("^" + pseudos),
      "CHILD": new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
      "bool": new RegExp("^(?:" + booleans + ")$", "i"),
      "needsContext": new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
    }, rhtml = /HTML$/i, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rnative = /^[^{]+\{\s*\[native \w/, rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling = /[+~]/, runescape = new RegExp("\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g"), funescape = function (escape, nonHex) {
      var high = "0x" + escape.slice(1) - 0x10000;
      return nonHex ? nonHex : high < 0 ? String.fromCharCode(high + 0x10000) : String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
    }, rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g, fcssescape = function (ch, asCodePoint) {
      if (asCodePoint) {
        if (ch === "\0") {
          return "\uFFFD";
        }
        return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
      }
      return "\\" + ch;
    }, unloadHandler = function () {
      setDocument();
    }, inDisabledFieldset = addCombinator(function (elem) {
      return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
    }, {
      dir: "parentNode",
      next: "legend"
    });
    try {
      push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);
      arr[preferredDoc.childNodes.length].nodeType;
    } catch (e) {
      push = {
        apply: arr.length ? function (target, els) {
          pushNative.apply(target, slice.call(els));
        } : function (target, els) {
          var j = target.length, i = 0;
          while (target[j++] = els[i++]) {}
          target.length = j - 1;
        }
      };
    }
    function Sizzle(selector, context, results, seed) {
      var m, i, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument, nodeType = context ? context.nodeType : 9;
      results = results || [];
      if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
        return results;
      }
      if (!seed) {
        setDocument(context);
        context = context || document;
        if (documentIsHTML) {
          if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
            if (m = match[1]) {
              if (nodeType === 9) {
                if (elem = context.getElementById(m)) {
                  if (elem.id === m) {
                    results.push(elem);
                    return results;
                  }
                } else {
                  return results;
                }
              } else {
                if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {
                  results.push(elem);
                  return results;
                }
              }
            } else if (match[2]) {
              push.apply(results, context.getElementsByTagName(selector));
              return results;
            } else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {
              push.apply(results, context.getElementsByClassName(m));
              return results;
            }
          }
          if (support.qsa && !nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector)) && (nodeType !== 1 || context.nodeName.toLowerCase() !== "object")) {
            newSelector = selector;
            newContext = context;
            if (nodeType === 1 && (rdescend.test(selector) || rcombinators.test(selector))) {
              newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
              if (newContext !== context || !support.scope) {
                if (nid = context.getAttribute("id")) {
                  nid = nid.replace(rcssescape, fcssescape);
                } else {
                  context.setAttribute("id", nid = expando);
                }
              }
              groups = tokenize(selector);
              i = groups.length;
              while (i--) {
                groups[i] = (nid ? "#" + nid : ":scope") + " " + toSelector(groups[i]);
              }
              newSelector = groups.join(",");
            }
            try {
              push.apply(results, newContext.querySelectorAll(newSelector));
              return results;
            } catch (qsaError) {
              nonnativeSelectorCache(selector, true);
            } finally {
              if (nid === expando) {
                context.removeAttribute("id");
              }
            }
          }
        }
      }
      return select(selector.replace(rtrim, "$1"), context, results, seed);
    }
    function createCache() {
      var keys = [];
      function cache(key, value) {
        if (keys.push(key + " ") > Expr.cacheLength) {
          delete cache[keys.shift()];
        }
        return cache[key + " "] = value;
      }
      return cache;
    }
    function markFunction(fn) {
      fn[expando] = true;
      return fn;
    }
    function assert(fn) {
      var el = document.createElement("fieldset");
      try {
        return !!fn(el);
      } catch (e) {
        return false;
      } finally {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        el = null;
      }
    }
    function addHandle(attrs, handler) {
      var arr = attrs.split("|"), i = arr.length;
      while (i--) {
        Expr.attrHandle[arr[i]] = handler;
      }
    }
    function siblingCheck(a, b) {
      var cur = b && a, diff = cur && a.nodeType === 1 && b.nodeType === 1 && a.sourceIndex - b.sourceIndex;
      if (diff) {
        return diff;
      }
      if (cur) {
        while (cur = cur.nextSibling) {
          if (cur === b) {
            return -1;
          }
        }
      }
      return a ? 1 : -1;
    }
    function createInputPseudo(type) {
      return function (elem) {
        var name = elem.nodeName.toLowerCase();
        return name === "input" && elem.type === type;
      };
    }
    function createButtonPseudo(type) {
      return function (elem) {
        var name = elem.nodeName.toLowerCase();
        return (name === "input" || name === "button") && elem.type === type;
      };
    }
    function createDisabledPseudo(disabled) {
      return function (elem) {
        if (("form" in elem)) {
          if (elem.parentNode && elem.disabled === false) {
            if (("label" in elem)) {
              if (("label" in elem.parentNode)) {
                return elem.parentNode.disabled === disabled;
              } else {
                return elem.disabled === disabled;
              }
            }
            return elem.isDisabled === disabled || elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
          }
          return elem.disabled === disabled;
        } else if (("label" in elem)) {
          return elem.disabled === disabled;
        }
        return false;
      };
    }
    function createPositionalPseudo(fn) {
      return markFunction(function (argument) {
        argument = +argument;
        return markFunction(function (seed, matches) {
          var j, matchIndexes = fn([], seed.length, argument), i = matchIndexes.length;
          while (i--) {
            if (seed[j = matchIndexes[i]]) {
              seed[j] = !(matches[j] = seed[j]);
            }
          }
        });
      });
    }
    function testContext(context) {
      return context && typeof context.getElementsByTagName !== "undefined" && context;
    }
    support = Sizzle.support = {};
    isXML = Sizzle.isXML = function (elem) {
      var namespace = elem && elem.namespaceURI, docElem = elem && (elem.ownerDocument || elem).documentElement;
      return !rhtml.test(namespace || docElem && docElem.nodeName || "HTML");
    };
    setDocument = Sizzle.setDocument = function (node) {
      var hasCompare, subWindow, doc = node ? node.ownerDocument || node : preferredDoc;
      if (doc == document || doc.nodeType !== 9 || !doc.documentElement) {
        return document;
      }
      document = doc;
      docElem = document.documentElement;
      documentIsHTML = !isXML(document);
      if (preferredDoc != document && (subWindow = document.defaultView) && subWindow.top !== subWindow) {
        if (subWindow.addEventListener) {
          subWindow.addEventListener("unload", unloadHandler, false);
        } else if (subWindow.attachEvent) {
          subWindow.attachEvent("onunload", unloadHandler);
        }
      }
      support.scope = assert(function (el) {
        docElem.appendChild(el).appendChild(document.createElement("div"));
        return typeof el.querySelectorAll !== "undefined" && !el.querySelectorAll(":scope fieldset div").length;
      });
      support.attributes = assert(function (el) {
        el.className = "i";
        return !el.getAttribute("className");
      });
      support.getElementsByTagName = assert(function (el) {
        el.appendChild(document.createComment(""));
        return !el.getElementsByTagName("*").length;
      });
      support.getElementsByClassName = rnative.test(document.getElementsByClassName);
      support.getById = assert(function (el) {
        docElem.appendChild(el).id = expando;
        return !document.getElementsByName || !document.getElementsByName(expando).length;
      });
      if (support.getById) {
        Expr.filter["ID"] = function (id) {
          var attrId = id.replace(runescape, funescape);
          return function (elem) {
            return elem.getAttribute("id") === attrId;
          };
        };
        Expr.find["ID"] = function (id, context) {
          if (typeof context.getElementById !== "undefined" && documentIsHTML) {
            var elem = context.getElementById(id);
            return elem ? [elem] : [];
          }
        };
      } else {
        Expr.filter["ID"] = function (id) {
          var attrId = id.replace(runescape, funescape);
          return function (elem) {
            var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
            return node && node.value === attrId;
          };
        };
        Expr.find["ID"] = function (id, context) {
          if (typeof context.getElementById !== "undefined" && documentIsHTML) {
            var node, i, elems, elem = context.getElementById(id);
            if (elem) {
              node = elem.getAttributeNode("id");
              if (node && node.value === id) {
                return [elem];
              }
              elems = context.getElementsByName(id);
              i = 0;
              while (elem = elems[i++]) {
                node = elem.getAttributeNode("id");
                if (node && node.value === id) {
                  return [elem];
                }
              }
            }
            return [];
          }
        };
      }
      Expr.find["TAG"] = support.getElementsByTagName ? function (tag, context) {
        if (typeof context.getElementsByTagName !== "undefined") {
          return context.getElementsByTagName(tag);
        } else if (support.qsa) {
          return context.querySelectorAll(tag);
        }
      } : function (tag, context) {
        var elem, tmp = [], i = 0, results = context.getElementsByTagName(tag);
        if (tag === "*") {
          while (elem = results[i++]) {
            if (elem.nodeType === 1) {
              tmp.push(elem);
            }
          }
          return tmp;
        }
        return results;
      };
      Expr.find["CLASS"] = support.getElementsByClassName && (function (className, context) {
        if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
          return context.getElementsByClassName(className);
        }
      });
      rbuggyMatches = [];
      rbuggyQSA = [];
      if (support.qsa = rnative.test(document.querySelectorAll)) {
        assert(function (el) {
          var input;
          docElem.appendChild(el).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\r\\' msallowcapture=''>" + "<option selected=''></option></select>";
          if (el.querySelectorAll("[msallowcapture^='']").length) {
            rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
          }
          if (!el.querySelectorAll("[selected]").length) {
            rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
          }
          if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
            rbuggyQSA.push("~=");
          }
          input = document.createElement("input");
          input.setAttribute("name", "");
          el.appendChild(input);
          if (!el.querySelectorAll("[name='']").length) {
            rbuggyQSA.push("\\[" + whitespace + "*name" + whitespace + "*=" + whitespace + "*(?:''|\"\")");
          }
          if (!el.querySelectorAll(":checked").length) {
            rbuggyQSA.push(":checked");
          }
          if (!el.querySelectorAll("a#" + expando + "+*").length) {
            rbuggyQSA.push(".#.+[+~]");
          }
          el.querySelectorAll("\\\f");
          rbuggyQSA.push("[\\r\\n\\f]");
        });
        assert(function (el) {
          el.innerHTML = "<a href='' disabled='disabled'></a>" + "<select disabled='disabled'><option/></select>";
          var input = document.createElement("input");
          input.setAttribute("type", "hidden");
          el.appendChild(input).setAttribute("name", "D");
          if (el.querySelectorAll("[name=d]").length) {
            rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");
          }
          if (el.querySelectorAll(":enabled").length !== 2) {
            rbuggyQSA.push(":enabled", ":disabled");
          }
          docElem.appendChild(el).disabled = true;
          if (el.querySelectorAll(":disabled").length !== 2) {
            rbuggyQSA.push(":enabled", ":disabled");
          }
          el.querySelectorAll("*,:x");
          rbuggyQSA.push(",.*:");
        });
      }
      if (support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) {
        assert(function (el) {
          support.disconnectedMatch = matches.call(el, "*");
          matches.call(el, "[s!='']:x");
          rbuggyMatches.push("!=", pseudos);
        });
      }
      rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
      rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));
      hasCompare = rnative.test(docElem.compareDocumentPosition);
      contains = hasCompare || rnative.test(docElem.contains) ? function (a, b) {
        var adown = a.nodeType === 9 ? a.documentElement : a, bup = b && b.parentNode;
        return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
      } : function (a, b) {
        if (b) {
          while (b = b.parentNode) {
            if (b === a) {
              return true;
            }
          }
        }
        return false;
      };
      sortOrder = hasCompare ? function (a, b) {
        if (a === b) {
          hasDuplicate = true;
          return 0;
        }
        var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
        if (compare) {
          return compare;
        }
        compare = (a.ownerDocument || a) == (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1;
        if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
          if (a == document || a.ownerDocument == preferredDoc && contains(preferredDoc, a)) {
            return -1;
          }
          if (b == document || b.ownerDocument == preferredDoc && contains(preferredDoc, b)) {
            return 1;
          }
          return sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
        }
        return compare & 4 ? -1 : 1;
      } : function (a, b) {
        if (a === b) {
          hasDuplicate = true;
          return 0;
        }
        var cur, i = 0, aup = a.parentNode, bup = b.parentNode, ap = [a], bp = [b];
        if (!aup || !bup) {
          return a == document ? -1 : b == document ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
        } else if (aup === bup) {
          return siblingCheck(a, b);
        }
        cur = a;
        while (cur = cur.parentNode) {
          ap.unshift(cur);
        }
        cur = b;
        while (cur = cur.parentNode) {
          bp.unshift(cur);
        }
        while (ap[i] === bp[i]) {
          i++;
        }
        return i ? siblingCheck(ap[i], bp[i]) : ap[i] == preferredDoc ? -1 : bp[i] == preferredDoc ? 1 : 0;
      };
      return document;
    };
    Sizzle.matches = function (expr, elements) {
      return Sizzle(expr, null, null, elements);
    };
    Sizzle.matchesSelector = function (elem, expr) {
      setDocument(elem);
      if (support.matchesSelector && documentIsHTML && !nonnativeSelectorCache[expr + " "] && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
        try {
          var ret = matches.call(elem, expr);
          if (ret || support.disconnectedMatch || elem.document && elem.document.nodeType !== 11) {
            return ret;
          }
        } catch (e) {
          nonnativeSelectorCache(expr, true);
        }
      }
      return Sizzle(expr, document, null, [elem]).length > 0;
    };
    Sizzle.contains = function (context, elem) {
      if ((context.ownerDocument || context) != document) {
        setDocument(context);
      }
      return contains(context, elem);
    };
    Sizzle.attr = function (elem, name) {
      if ((elem.ownerDocument || elem) != document) {
        setDocument(elem);
      }
      var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
      return val !== undefined ? val : support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
    };
    Sizzle.escape = function (sel) {
      return (sel + "").replace(rcssescape, fcssescape);
    };
    Sizzle.error = function (msg) {
      throw new Error("Syntax error, unrecognized expression: " + msg);
    };
    Sizzle.uniqueSort = function (results) {
      var elem, duplicates = [], j = 0, i = 0;
      hasDuplicate = !support.detectDuplicates;
      sortInput = !support.sortStable && results.slice(0);
      results.sort(sortOrder);
      if (hasDuplicate) {
        while (elem = results[i++]) {
          if (elem === results[i]) {
            j = duplicates.push(i);
          }
        }
        while (j--) {
          results.splice(duplicates[j], 1);
        }
      }
      sortInput = null;
      return results;
    };
    getText = Sizzle.getText = function (elem) {
      var node, ret = "", i = 0, nodeType = elem.nodeType;
      if (!nodeType) {
        while (node = elem[i++]) {
          ret += getText(node);
        }
      } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
        if (typeof elem.textContent === "string") {
          return elem.textContent;
        } else {
          for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
            ret += getText(elem);
          }
        }
      } else if (nodeType === 3 || nodeType === 4) {
        return elem.nodeValue;
      }
      return ret;
    };
    Expr = Sizzle.selectors = {
      cacheLength: 50,
      createPseudo: markFunction,
      match: matchExpr,
      attrHandle: {},
      find: {},
      relative: {
        ">": {
          dir: "parentNode",
          first: true
        },
        " ": {
          dir: "parentNode"
        },
        "+": {
          dir: "previousSibling",
          first: true
        },
        "~": {
          dir: "previousSibling"
        }
      },
      preFilter: {
        "ATTR": function (match) {
          match[1] = match[1].replace(runescape, funescape);
          match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
          if (match[2] === "~=") {
            match[3] = " " + match[3] + " ";
          }
          return match.slice(0, 4);
        },
        "CHILD": function (match) {
          match[1] = match[1].toLowerCase();
          if (match[1].slice(0, 3) === "nth") {
            if (!match[3]) {
              Sizzle.error(match[0]);
            }
            match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
            match[5] = +(match[7] + match[8] || match[3] === "odd");
          } else if (match[3]) {
            Sizzle.error(match[0]);
          }
          return match;
        },
        "PSEUDO": function (match) {
          var excess, unquoted = !match[6] && match[2];
          if (matchExpr["CHILD"].test(match[0])) {
            return null;
          }
          if (match[3]) {
            match[2] = match[4] || match[5] || "";
          } else if (unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
            match[0] = match[0].slice(0, excess);
            match[2] = unquoted.slice(0, excess);
          }
          return match.slice(0, 3);
        }
      },
      filter: {
        "TAG": function (nodeNameSelector) {
          var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
          return nodeNameSelector === "*" ? function () {
            return true;
          } : function (elem) {
            return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
          };
        },
        "CLASS": function (className) {
          var pattern = classCache[className + " "];
          return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function (elem) {
            return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");
          });
        },
        "ATTR": function (name, operator, check) {
          return function (elem) {
            var result = Sizzle.attr(elem, name);
            if (result == null) {
              return operator === "!=";
            }
            if (!operator) {
              return true;
            }
            result += "";
            return operator === "=" ? result === check : operator === "!=" ? result !== check : operator === "^=" ? check && result.indexOf(check) === 0 : operator === "*=" ? check && result.indexOf(check) > -1 : operator === "$=" ? check && result.slice(-check.length) === check : operator === "~=" ? (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1 : operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" : false;
          };
        },
        "CHILD": function (type, what, _argument, first, last) {
          var simple = type.slice(0, 3) !== "nth", forward = type.slice(-4) !== "last", ofType = what === "of-type";
          return first === 1 && last === 0 ? function (elem) {
            return !!elem.parentNode;
          } : function (elem, _context, xml) {
            var cache, uniqueCache, outerCache, node, nodeIndex, start, dir = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
            if (parent) {
              if (simple) {
                while (dir) {
                  node = elem;
                  while (node = node[dir]) {
                    if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
                      return false;
                    }
                  }
                  start = dir = type === "only" && !start && "nextSibling";
                }
                return true;
              }
              start = [forward ? parent.firstChild : parent.lastChild];
              if (forward && useCache) {
                node = parent;
                outerCache = node[expando] || (node[expando] = {});
                uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                cache = uniqueCache[type] || [];
                nodeIndex = cache[0] === dirruns && cache[1];
                diff = nodeIndex && cache[2];
                node = nodeIndex && parent.childNodes[nodeIndex];
                while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
                  if (node.nodeType === 1 && ++diff && node === elem) {
                    uniqueCache[type] = [dirruns, nodeIndex, diff];
                    break;
                  }
                }
              } else {
                if (useCache) {
                  node = elem;
                  outerCache = node[expando] || (node[expando] = {});
                  uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                  cache = uniqueCache[type] || [];
                  nodeIndex = cache[0] === dirruns && cache[1];
                  diff = nodeIndex;
                }
                if (diff === false) {
                  while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
                    if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
                      if (useCache) {
                        outerCache = node[expando] || (node[expando] = {});
                        uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                        uniqueCache[type] = [dirruns, diff];
                      }
                      if (node === elem) {
                        break;
                      }
                    }
                  }
                }
              }
              diff -= last;
              return diff === first || diff % first === 0 && diff / first >= 0;
            }
          };
        },
        "PSEUDO": function (pseudo, argument) {
          var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
          if (fn[expando]) {
            return fn(argument);
          }
          if (fn.length > 1) {
            args = [pseudo, pseudo, "", argument];
            return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function (seed, matches) {
              var idx, matched = fn(seed, argument), i = matched.length;
              while (i--) {
                idx = indexOf(seed, matched[i]);
                seed[idx] = !(matches[idx] = matched[i]);
              }
            }) : function (elem) {
              return fn(elem, 0, args);
            };
          }
          return fn;
        }
      },
      pseudos: {
        "not": markFunction(function (selector) {
          var input = [], results = [], matcher = compile(selector.replace(rtrim, "$1"));
          return matcher[expando] ? markFunction(function (seed, matches, _context, xml) {
            var elem, unmatched = matcher(seed, null, xml, []), i = seed.length;
            while (i--) {
              if (elem = unmatched[i]) {
                seed[i] = !(matches[i] = elem);
              }
            }
          }) : function (elem, _context, xml) {
            input[0] = elem;
            matcher(input, null, xml, results);
            input[0] = null;
            return !results.pop();
          };
        }),
        "has": markFunction(function (selector) {
          return function (elem) {
            return Sizzle(selector, elem).length > 0;
          };
        }),
        "contains": markFunction(function (text) {
          text = text.replace(runescape, funescape);
          return function (elem) {
            return (elem.textContent || getText(elem)).indexOf(text) > -1;
          };
        }),
        "lang": markFunction(function (lang) {
          if (!ridentifier.test(lang || "")) {
            Sizzle.error("unsupported lang: " + lang);
          }
          lang = lang.replace(runescape, funescape).toLowerCase();
          return function (elem) {
            var elemLang;
            do {
              if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                elemLang = elemLang.toLowerCase();
                return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
              }
            } while ((elem = elem.parentNode) && elem.nodeType === 1);
            return false;
          };
        }),
        "target": function (elem) {
          var hash = window.location && window.location.hash;
          return hash && hash.slice(1) === elem.id;
        },
        "root": function (elem) {
          return elem === docElem;
        },
        "focus": function (elem) {
          return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
        },
        "enabled": createDisabledPseudo(false),
        "disabled": createDisabledPseudo(true),
        "checked": function (elem) {
          var nodeName = elem.nodeName.toLowerCase();
          return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;
        },
        "selected": function (elem) {
          if (elem.parentNode) {
            elem.parentNode.selectedIndex;
          }
          return elem.selected === true;
        },
        "empty": function (elem) {
          for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
            if (elem.nodeType < 6) {
              return false;
            }
          }
          return true;
        },
        "parent": function (elem) {
          return !Expr.pseudos["empty"](elem);
        },
        "header": function (elem) {
          return rheader.test(elem.nodeName);
        },
        "input": function (elem) {
          return rinputs.test(elem.nodeName);
        },
        "button": function (elem) {
          var name = elem.nodeName.toLowerCase();
          return name === "input" && elem.type === "button" || name === "button";
        },
        "text": function (elem) {
          var attr;
          return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
        },
        "first": createPositionalPseudo(function () {
          return [0];
        }),
        "last": createPositionalPseudo(function (_matchIndexes, length) {
          return [length - 1];
        }),
        "eq": createPositionalPseudo(function (_matchIndexes, length, argument) {
          return [argument < 0 ? argument + length : argument];
        }),
        "even": createPositionalPseudo(function (matchIndexes, length) {
          var i = 0;
          for (; i < length; i += 2) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        }),
        "odd": createPositionalPseudo(function (matchIndexes, length) {
          var i = 1;
          for (; i < length; i += 2) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        }),
        "lt": createPositionalPseudo(function (matchIndexes, length, argument) {
          var i = argument < 0 ? argument + length : argument > length ? length : argument;
          for (; --i >= 0; ) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        }),
        "gt": createPositionalPseudo(function (matchIndexes, length, argument) {
          var i = argument < 0 ? argument + length : argument;
          for (; ++i < length; ) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        })
      }
    };
    Expr.pseudos["nth"] = Expr.pseudos["eq"];
    for (i in {
      radio: true,
      checkbox: true,
      file: true,
      password: true,
      image: true
    }) {
      Expr.pseudos[i] = createInputPseudo(i);
    }
    for (i in {
      submit: true,
      reset: true
    }) {
      Expr.pseudos[i] = createButtonPseudo(i);
    }
    function setFilters() {}
    setFilters.prototype = Expr.filters = Expr.pseudos;
    Expr.setFilters = new setFilters();
    tokenize = Sizzle.tokenize = function (selector, parseOnly) {
      var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
      if (cached) {
        return parseOnly ? 0 : cached.slice(0);
      }
      soFar = selector;
      groups = [];
      preFilters = Expr.preFilter;
      while (soFar) {
        if (!matched || (match = rcomma.exec(soFar))) {
          if (match) {
            soFar = soFar.slice(match[0].length) || soFar;
          }
          groups.push(tokens = []);
        }
        matched = false;
        if (match = rcombinators.exec(soFar)) {
          matched = match.shift();
          tokens.push({
            value: matched,
            type: match[0].replace(rtrim, " ")
          });
          soFar = soFar.slice(matched.length);
        }
        for (type in Expr.filter) {
          if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
            matched = match.shift();
            tokens.push({
              value: matched,
              type: type,
              matches: match
            });
            soFar = soFar.slice(matched.length);
          }
        }
        if (!matched) {
          break;
        }
      }
      return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
    };
    function toSelector(tokens) {
      var i = 0, len = tokens.length, selector = "";
      for (; i < len; i++) {
        selector += tokens[i].value;
      }
      return selector;
    }
    function addCombinator(matcher, combinator, base) {
      var dir = combinator.dir, skip = combinator.next, key = skip || dir, checkNonElements = base && key === "parentNode", doneName = done++;
      return combinator.first ? function (elem, context, xml) {
        while (elem = elem[dir]) {
          if (elem.nodeType === 1 || checkNonElements) {
            return matcher(elem, context, xml);
          }
        }
        return false;
      } : function (elem, context, xml) {
        var oldCache, uniqueCache, outerCache, newCache = [dirruns, doneName];
        if (xml) {
          while (elem = elem[dir]) {
            if (elem.nodeType === 1 || checkNonElements) {
              if (matcher(elem, context, xml)) {
                return true;
              }
            }
          }
        } else {
          while (elem = elem[dir]) {
            if (elem.nodeType === 1 || checkNonElements) {
              outerCache = elem[expando] || (elem[expando] = {});
              uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});
              if (skip && skip === elem.nodeName.toLowerCase()) {
                elem = elem[dir] || elem;
              } else if ((oldCache = uniqueCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                return newCache[2] = oldCache[2];
              } else {
                uniqueCache[key] = newCache;
                if (newCache[2] = matcher(elem, context, xml)) {
                  return true;
                }
              }
            }
          }
        }
        return false;
      };
    }
    function elementMatcher(matchers) {
      return matchers.length > 1 ? function (elem, context, xml) {
        var i = matchers.length;
        while (i--) {
          if (!matchers[i](elem, context, xml)) {
            return false;
          }
        }
        return true;
      } : matchers[0];
    }
    function multipleContexts(selector, contexts, results) {
      var i = 0, len = contexts.length;
      for (; i < len; i++) {
        Sizzle(selector, contexts[i], results);
      }
      return results;
    }
    function condense(unmatched, map, filter, context, xml) {
      var elem, newUnmatched = [], i = 0, len = unmatched.length, mapped = map != null;
      for (; i < len; i++) {
        if (elem = unmatched[i]) {
          if (!filter || filter(elem, context, xml)) {
            newUnmatched.push(elem);
            if (mapped) {
              map.push(i);
            }
          }
        }
      }
      return newUnmatched;
    }
    function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
      if (postFilter && !postFilter[expando]) {
        postFilter = setMatcher(postFilter);
      }
      if (postFinder && !postFinder[expando]) {
        postFinder = setMatcher(postFinder, postSelector);
      }
      return markFunction(function (seed, results, context, xml) {
        var temp, i, elem, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []), matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems, matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
        if (matcher) {
          matcher(matcherIn, matcherOut, context, xml);
        }
        if (postFilter) {
          temp = condense(matcherOut, postMap);
          postFilter(temp, [], context, xml);
          i = temp.length;
          while (i--) {
            if (elem = temp[i]) {
              matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
            }
          }
        }
        if (seed) {
          if (postFinder || preFilter) {
            if (postFinder) {
              temp = [];
              i = matcherOut.length;
              while (i--) {
                if (elem = matcherOut[i]) {
                  temp.push(matcherIn[i] = elem);
                }
              }
              postFinder(null, matcherOut = [], temp, xml);
            }
            i = matcherOut.length;
            while (i--) {
              if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {
                seed[temp] = !(results[temp] = elem);
              }
            }
          }
        } else {
          matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
          if (postFinder) {
            postFinder(null, results, matcherOut, xml);
          } else {
            push.apply(results, matcherOut);
          }
        }
      });
    }
    function matcherFromTokens(tokens) {
      var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i = leadingRelative ? 1 : 0, matchContext = addCombinator(function (elem) {
        return elem === checkContext;
      }, implicitRelative, true), matchAnyContext = addCombinator(function (elem) {
        return indexOf(checkContext, elem) > -1;
      }, implicitRelative, true), matchers = [function (elem, context, xml) {
        var ret = !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
        checkContext = null;
        return ret;
      }];
      for (; i < len; i++) {
        if (matcher = Expr.relative[tokens[i].type]) {
          matchers = [addCombinator(elementMatcher(matchers), matcher)];
        } else {
          matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);
          if (matcher[expando]) {
            j = ++i;
            for (; j < len; j++) {
              if (Expr.relative[tokens[j].type]) {
                break;
              }
            }
            return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({
              value: tokens[i - 2].type === " " ? "*" : ""
            })).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));
          }
          matchers.push(matcher);
        }
      }
      return elementMatcher(matchers);
    }
    function matcherFromGroupMatchers(elementMatchers, setMatchers) {
      var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function (seed, context, xml, results, outermost) {
        var elem, j, matcher, matchedCount = 0, i = "0", unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && Expr.find["TAG"]("*", outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1, len = elems.length;
        if (outermost) {
          outermostContext = context == document || context || outermost;
        }
        for (; i !== len && (elem = elems[i]) != null; i++) {
          if (byElement && elem) {
            j = 0;
            if (!context && elem.ownerDocument != document) {
              setDocument(elem);
              xml = !documentIsHTML;
            }
            while (matcher = elementMatchers[j++]) {
              if (matcher(elem, context || document, xml)) {
                results.push(elem);
                break;
              }
            }
            if (outermost) {
              dirruns = dirrunsUnique;
            }
          }
          if (bySet) {
            if (elem = !matcher && elem) {
              matchedCount--;
            }
            if (seed) {
              unmatched.push(elem);
            }
          }
        }
        matchedCount += i;
        if (bySet && i !== matchedCount) {
          j = 0;
          while (matcher = setMatchers[j++]) {
            matcher(unmatched, setMatched, context, xml);
          }
          if (seed) {
            if (matchedCount > 0) {
              while (i--) {
                if (!(unmatched[i] || setMatched[i])) {
                  setMatched[i] = pop.call(results);
                }
              }
            }
            setMatched = condense(setMatched);
          }
          push.apply(results, setMatched);
          if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
            Sizzle.uniqueSort(results);
          }
        }
        if (outermost) {
          dirruns = dirrunsUnique;
          outermostContext = contextBackup;
        }
        return unmatched;
      };
      return bySet ? markFunction(superMatcher) : superMatcher;
    }
    compile = Sizzle.compile = function (selector, match) {
      var i, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
      if (!cached) {
        if (!match) {
          match = tokenize(selector);
        }
        i = match.length;
        while (i--) {
          cached = matcherFromTokens(match[i]);
          if (cached[expando]) {
            setMatchers.push(cached);
          } else {
            elementMatchers.push(cached);
          }
        }
        cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
        cached.selector = selector;
      }
      return cached;
    };
    select = Sizzle.select = function (selector, context, results, seed) {
      var i, tokens, token, type, find, compiled = typeof selector === "function" && selector, match = !seed && tokenize(selector = compiled.selector || selector);
      results = results || [];
      if (match.length === 1) {
        tokens = match[0] = match[0].slice(0);
        if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
          context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
          if (!context) {
            return results;
          } else if (compiled) {
            context = context.parentNode;
          }
          selector = selector.slice(tokens.shift().value.length);
        }
        i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
        while (i--) {
          token = tokens[i];
          if (Expr.relative[type = token.type]) {
            break;
          }
          if (find = Expr.find[type]) {
            if (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)) {
              tokens.splice(i, 1);
              selector = seed.length && toSelector(tokens);
              if (!selector) {
                push.apply(results, seed);
                return results;
              }
              break;
            }
          }
        }
      }
      (compiled || compile(selector, match))(seed, context, !documentIsHTML, results, !context || rsibling.test(selector) && testContext(context.parentNode) || context);
      return results;
    };
    support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
    support.detectDuplicates = !!hasDuplicate;
    setDocument();
    support.sortDetached = assert(function (el) {
      return el.compareDocumentPosition(document.createElement("fieldset")) & 1;
    });
    if (!assert(function (el) {
      el.innerHTML = "<a href='#'></a>";
      return el.firstChild.getAttribute("href") === "#";
    })) {
      addHandle("type|href|height|width", function (elem, name, isXML) {
        if (!isXML) {
          return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
        }
      });
    }
    if (!support.attributes || !assert(function (el) {
      el.innerHTML = "<input/>";
      el.firstChild.setAttribute("value", "");
      return el.firstChild.getAttribute("value") === "";
    })) {
      addHandle("value", function (elem, _name, isXML) {
        if (!isXML && elem.nodeName.toLowerCase() === "input") {
          return elem.defaultValue;
        }
      });
    }
    if (!assert(function (el) {
      return el.getAttribute("disabled") == null;
    })) {
      addHandle(booleans, function (elem, name, isXML) {
        var val;
        if (!isXML) {
          return elem[name] === true ? name.toLowerCase() : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
        }
      });
    }
    return Sizzle;
  })(window);
  jQuery.find = Sizzle;
  jQuery.expr = Sizzle.selectors;
  jQuery.expr[":"] = jQuery.expr.pseudos;
  jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
  jQuery.text = Sizzle.getText;
  jQuery.isXMLDoc = Sizzle.isXML;
  jQuery.contains = Sizzle.contains;
  jQuery.escapeSelector = Sizzle.escape;
  var dir = function (elem, dir, until) {
    var matched = [], truncate = until !== undefined;
    while ((elem = elem[dir]) && elem.nodeType !== 9) {
      if (elem.nodeType === 1) {
        if (truncate && jQuery(elem).is(until)) {
          break;
        }
        matched.push(elem);
      }
    }
    return matched;
  };
  var siblings = function (n, elem) {
    var matched = [];
    for (; n; n = n.nextSibling) {
      if (n.nodeType === 1 && n !== elem) {
        matched.push(n);
      }
    }
    return matched;
  };
  var rneedsContext = jQuery.expr.match.needsContext;
  function nodeName(elem, name) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  }
  var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
  function winnow(elements, qualifier, not) {
    if (isFunction(qualifier)) {
      return jQuery.grep(elements, function (elem, i) {
        return !!qualifier.call(elem, i, elem) !== not;
      });
    }
    if (qualifier.nodeType) {
      return jQuery.grep(elements, function (elem) {
        return elem === qualifier !== not;
      });
    }
    if (typeof qualifier !== "string") {
      return jQuery.grep(elements, function (elem) {
        return indexOf.call(qualifier, elem) > -1 !== not;
      });
    }
    return jQuery.filter(qualifier, elements, not);
  }
  jQuery.filter = function (expr, elems, not) {
    var elem = elems[0];
    if (not) {
      expr = ":not(" + expr + ")";
    }
    if (elems.length === 1 && elem.nodeType === 1) {
      return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
    }
    return jQuery.find.matches(expr, jQuery.grep(elems, function (elem) {
      return elem.nodeType === 1;
    }));
  };
  jQuery.fn.extend({
    find: function (selector) {
      var i, ret, len = this.length, self = this;
      if (typeof selector !== "string") {
        return this.pushStack(jQuery(selector).filter(function () {
          for (i = 0; i < len; i++) {
            if (jQuery.contains(self[i], this)) {
              return true;
            }
          }
        }));
      }
      ret = this.pushStack([]);
      for (i = 0; i < len; i++) {
        jQuery.find(selector, self[i], ret);
      }
      return len > 1 ? jQuery.uniqueSort(ret) : ret;
    },
    filter: function (selector) {
      return this.pushStack(winnow(this, selector || [], false));
    },
    not: function (selector) {
      return this.pushStack(winnow(this, selector || [], true));
    },
    is: function (selector) {
      return !!winnow(this, typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [], false).length;
    }
  });
  var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, init = jQuery.fn.init = function (selector, context, root) {
    var match, elem;
    if (!selector) {
      return this;
    }
    root = root || rootjQuery;
    if (typeof selector === "string") {
      if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
        match = [null, selector, null];
      } else {
        match = rquickExpr.exec(selector);
      }
      if (match && (match[1] || !context)) {
        if (match[1]) {
          context = context instanceof jQuery ? context[0] : context;
          jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
          if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
            for (match in context) {
              if (isFunction(this[match])) {
                this[match](context[match]);
              } else {
                this.attr(match, context[match]);
              }
            }
          }
          return this;
        } else {
          elem = document.getElementById(match[2]);
          if (elem) {
            this[0] = elem;
            this.length = 1;
          }
          return this;
        }
      } else if (!context || context.jquery) {
        return (context || root).find(selector);
      } else {
        return this.constructor(context).find(selector);
      }
    } else if (selector.nodeType) {
      this[0] = selector;
      this.length = 1;
      return this;
    } else if (isFunction(selector)) {
      return root.ready !== undefined ? root.ready(selector) : selector(jQuery);
    }
    return jQuery.makeArray(selector, this);
  };
  init.prototype = jQuery.fn;
  rootjQuery = jQuery(document);
  var rparentsprev = /^(?:parents|prev(?:Until|All))/, guaranteedUnique = {
    children: true,
    contents: true,
    next: true,
    prev: true
  };
  jQuery.fn.extend({
    has: function (target) {
      var targets = jQuery(target, this), l = targets.length;
      return this.filter(function () {
        var i = 0;
        for (; i < l; i++) {
          if (jQuery.contains(this, targets[i])) {
            return true;
          }
        }
      });
    },
    closest: function (selectors, context) {
      var cur, i = 0, l = this.length, matched = [], targets = typeof selectors !== "string" && jQuery(selectors);
      if (!rneedsContext.test(selectors)) {
        for (; i < l; i++) {
          for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
            if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))) {
              matched.push(cur);
              break;
            }
          }
        }
      }
      return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
    },
    index: function (elem) {
      if (!elem) {
        return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      }
      if (typeof elem === "string") {
        return indexOf.call(jQuery(elem), this[0]);
      }
      return indexOf.call(this, elem.jquery ? elem[0] : elem);
    },
    add: function (selector, context) {
      return this.pushStack(jQuery.uniqueSort(jQuery.merge(this.get(), jQuery(selector, context))));
    },
    addBack: function (selector) {
      return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector));
    }
  });
  function sibling(cur, dir) {
    while ((cur = cur[dir]) && cur.nodeType !== 1) {}
    return cur;
  }
  jQuery.each({
    parent: function (elem) {
      var parent = elem.parentNode;
      return parent && parent.nodeType !== 11 ? parent : null;
    },
    parents: function (elem) {
      return dir(elem, "parentNode");
    },
    parentsUntil: function (elem, _i, until) {
      return dir(elem, "parentNode", until);
    },
    next: function (elem) {
      return sibling(elem, "nextSibling");
    },
    prev: function (elem) {
      return sibling(elem, "previousSibling");
    },
    nextAll: function (elem) {
      return dir(elem, "nextSibling");
    },
    prevAll: function (elem) {
      return dir(elem, "previousSibling");
    },
    nextUntil: function (elem, _i, until) {
      return dir(elem, "nextSibling", until);
    },
    prevUntil: function (elem, _i, until) {
      return dir(elem, "previousSibling", until);
    },
    siblings: function (elem) {
      return siblings((elem.parentNode || ({})).firstChild, elem);
    },
    children: function (elem) {
      return siblings(elem.firstChild);
    },
    contents: function (elem) {
      if (elem.contentDocument != null && getProto(elem.contentDocument)) {
        return elem.contentDocument;
      }
      if (nodeName(elem, "template")) {
        elem = elem.content || elem;
      }
      return jQuery.merge([], elem.childNodes);
    }
  }, function (name, fn) {
    jQuery.fn[name] = function (until, selector) {
      var matched = jQuery.map(this, fn, until);
      if (name.slice(-5) !== "Until") {
        selector = until;
      }
      if (selector && typeof selector === "string") {
        matched = jQuery.filter(selector, matched);
      }
      if (this.length > 1) {
        if (!guaranteedUnique[name]) {
          jQuery.uniqueSort(matched);
        }
        if (rparentsprev.test(name)) {
          matched.reverse();
        }
      }
      return this.pushStack(matched);
    };
  });
  var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
  function createOptions(options) {
    var object = {};
    jQuery.each(options.match(rnothtmlwhite) || [], function (_, flag) {
      object[flag] = true;
    });
    return object;
  }
  jQuery.Callbacks = function (options) {
    options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);
    var firing, memory, fired, locked, list = [], queue = [], firingIndex = -1, fire = function () {
      locked = locked || options.once;
      fired = firing = true;
      for (; queue.length; firingIndex = -1) {
        memory = queue.shift();
        while (++firingIndex < list.length) {
          if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
            firingIndex = list.length;
            memory = false;
          }
        }
      }
      if (!options.memory) {
        memory = false;
      }
      firing = false;
      if (locked) {
        if (memory) {
          list = [];
        } else {
          list = "";
        }
      }
    }, self = {
      add: function () {
        if (list) {
          if (memory && !firing) {
            firingIndex = list.length - 1;
            queue.push(memory);
          }
          (function add(args) {
            jQuery.each(args, function (_, arg) {
              if (isFunction(arg)) {
                if (!options.unique || !self.has(arg)) {
                  list.push(arg);
                }
              } else if (arg && arg.length && toType(arg) !== "string") {
                add(arg);
              }
            });
          })(arguments);
          if (memory && !firing) {
            fire();
          }
        }
        return this;
      },
      remove: function () {
        jQuery.each(arguments, function (_, arg) {
          var index;
          while ((index = jQuery.inArray(arg, list, index)) > -1) {
            list.splice(index, 1);
            if (index <= firingIndex) {
              firingIndex--;
            }
          }
        });
        return this;
      },
      has: function (fn) {
        return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
      },
      empty: function () {
        if (list) {
          list = [];
        }
        return this;
      },
      disable: function () {
        locked = queue = [];
        list = memory = "";
        return this;
      },
      disabled: function () {
        return !list;
      },
      lock: function () {
        locked = queue = [];
        if (!memory && !firing) {
          list = memory = "";
        }
        return this;
      },
      locked: function () {
        return !!locked;
      },
      fireWith: function (context, args) {
        if (!locked) {
          args = args || [];
          args = [context, args.slice ? args.slice() : args];
          queue.push(args);
          if (!firing) {
            fire();
          }
        }
        return this;
      },
      fire: function () {
        self.fireWith(this, arguments);
        return this;
      },
      fired: function () {
        return !!fired;
      }
    };
    return self;
  };
  function Identity(v) {
    return v;
  }
  function Thrower(ex) {
    throw ex;
  }
  function adoptValue(value, resolve, reject, noValue) {
    var method;
    try {
      if (value && isFunction(method = value.promise)) {
        method.call(value).done(resolve).fail(reject);
      } else if (value && isFunction(method = value.then)) {
        method.call(value, resolve, reject);
      } else {
        resolve.apply(undefined, [value].slice(noValue));
      }
    } catch (value) {
      reject.apply(undefined, [value]);
    }
  }
  jQuery.extend({
    Deferred: function (func) {
      var tuples = [["notify", "progress", jQuery.Callbacks("memory"), jQuery.Callbacks("memory"), 2], ["resolve", "done", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 0, "resolved"], ["reject", "fail", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 1, "rejected"]], state = "pending", promise = {
        state: function () {
          return state;
        },
        always: function () {
          deferred.done(arguments).fail(arguments);
          return this;
        },
        "catch": function (fn) {
          return promise.then(null, fn);
        },
        pipe: function () {
          var fns = arguments;
          return jQuery.Deferred(function (newDefer) {
            jQuery.each(tuples, function (_i, tuple) {
              var fn = isFunction(fns[tuple[4]]) && fns[tuple[4]];
              deferred[tuple[1]](function () {
                var returned = fn && fn.apply(this, arguments);
                if (returned && isFunction(returned.promise)) {
                  returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                } else {
                  newDefer[tuple[0] + "With"](this, fn ? [returned] : arguments);
                }
              });
            });
            fns = null;
          }).promise();
        },
        then: function (onFulfilled, onRejected, onProgress) {
          var maxDepth = 0;
          function resolve(depth, deferred, handler, special) {
            return function () {
              var that = this, args = arguments, mightThrow = function () {
                var returned, then;
                if (depth < maxDepth) {
                  return;
                }
                returned = handler.apply(that, args);
                if (returned === deferred.promise()) {
                  throw new TypeError("Thenable self-resolution");
                }
                then = returned && (typeof returned === "object" || typeof returned === "function") && returned.then;
                if (isFunction(then)) {
                  if (special) {
                    then.call(returned, resolve(maxDepth, deferred, Identity, special), resolve(maxDepth, deferred, Thrower, special));
                  } else {
                    maxDepth++;
                    then.call(returned, resolve(maxDepth, deferred, Identity, special), resolve(maxDepth, deferred, Thrower, special), resolve(maxDepth, deferred, Identity, deferred.notifyWith));
                  }
                } else {
                  if (handler !== Identity) {
                    that = undefined;
                    args = [returned];
                  }
                  (special || deferred.resolveWith)(that, args);
                }
              }, process = special ? mightThrow : function () {
                try {
                  mightThrow();
                } catch (e) {
                  if (jQuery.Deferred.exceptionHook) {
                    jQuery.Deferred.exceptionHook(e, process.stackTrace);
                  }
                  if (depth + 1 >= maxDepth) {
                    if (handler !== Thrower) {
                      that = undefined;
                      args = [e];
                    }
                    deferred.rejectWith(that, args);
                  }
                }
              };
              if (depth) {
                process();
              } else {
                if (jQuery.Deferred.getStackHook) {
                  process.stackTrace = jQuery.Deferred.getStackHook();
                }
                window.setTimeout(process);
              }
            };
          }
          return jQuery.Deferred(function (newDefer) {
            tuples[0][3].add(resolve(0, newDefer, isFunction(onProgress) ? onProgress : Identity, newDefer.notifyWith));
            tuples[1][3].add(resolve(0, newDefer, isFunction(onFulfilled) ? onFulfilled : Identity));
            tuples[2][3].add(resolve(0, newDefer, isFunction(onRejected) ? onRejected : Thrower));
          }).promise();
        },
        promise: function (obj) {
          return obj != null ? jQuery.extend(obj, promise) : promise;
        }
      }, deferred = {};
      jQuery.each(tuples, function (i, tuple) {
        var list = tuple[2], stateString = tuple[5];
        promise[tuple[1]] = list.add;
        if (stateString) {
          list.add(function () {
            state = stateString;
          }, tuples[3 - i][2].disable, tuples[3 - i][3].disable, tuples[0][2].lock, tuples[0][3].lock);
        }
        list.add(tuple[3].fire);
        deferred[tuple[0]] = function () {
          deferred[tuple[0] + "With"](this === deferred ? undefined : this, arguments);
          return this;
        };
        deferred[tuple[0] + "With"] = list.fireWith;
      });
      promise.promise(deferred);
      if (func) {
        func.call(deferred, deferred);
      }
      return deferred;
    },
    when: function (singleValue) {
      var remaining = arguments.length, i = remaining, resolveContexts = Array(i), resolveValues = slice.call(arguments), primary = jQuery.Deferred(), updateFunc = function (i) {
        return function (value) {
          resolveContexts[i] = this;
          resolveValues[i] = arguments.length > 1 ? slice.call(arguments) : value;
          if (!--remaining) {
            primary.resolveWith(resolveContexts, resolveValues);
          }
        };
      };
      if (remaining <= 1) {
        adoptValue(singleValue, primary.done(updateFunc(i)).resolve, primary.reject, !remaining);
        if (primary.state() === "pending" || isFunction(resolveValues[i] && resolveValues[i].then)) {
          return primary.then();
        }
      }
      while (i--) {
        adoptValue(resolveValues[i], updateFunc(i), primary.reject);
      }
      return primary.promise();
    }
  });
  var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
  jQuery.Deferred.exceptionHook = function (error, stack) {
    if (window.console && window.console.warn && error && rerrorNames.test(error.name)) {
      window.console.warn("jQuery.Deferred exception: " + error.message, error.stack, stack);
    }
  };
  jQuery.readyException = function (error) {
    window.setTimeout(function () {
      throw error;
    });
  };
  var readyList = jQuery.Deferred();
  jQuery.fn.ready = function (fn) {
    readyList.then(fn).catch(function (error) {
      jQuery.readyException(error);
    });
    return this;
  };
  jQuery.extend({
    isReady: false,
    readyWait: 1,
    ready: function (wait) {
      if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
        return;
      }
      jQuery.isReady = true;
      if (wait !== true && --jQuery.readyWait > 0) {
        return;
      }
      readyList.resolveWith(document, [jQuery]);
    }
  });
  jQuery.ready.then = readyList.then;
  function completed() {
    document.removeEventListener("DOMContentLoaded", completed);
    window.removeEventListener("load", completed);
    jQuery.ready();
  }
  if (document.readyState === "complete" || document.readyState !== "loading" && !document.documentElement.doScroll) {
    window.setTimeout(jQuery.ready);
  } else {
    document.addEventListener("DOMContentLoaded", completed);
    window.addEventListener("load", completed);
  }
  var access = function (elems, fn, key, value, chainable, emptyGet, raw) {
    var i = 0, len = elems.length, bulk = key == null;
    if (toType(key) === "object") {
      chainable = true;
      for (i in key) {
        access(elems, fn, i, key[i], true, emptyGet, raw);
      }
    } else if (value !== undefined) {
      chainable = true;
      if (!isFunction(value)) {
        raw = true;
      }
      if (bulk) {
        if (raw) {
          fn.call(elems, value);
          fn = null;
        } else {
          bulk = fn;
          fn = function (elem, _key, value) {
            return bulk.call(jQuery(elem), value);
          };
        }
      }
      if (fn) {
        for (; i < len; i++) {
          fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
        }
      }
    }
    if (chainable) {
      return elems;
    }
    if (bulk) {
      return fn.call(elems);
    }
    return len ? fn(elems[0], key) : emptyGet;
  };
  var rmsPrefix = /^-ms-/, rdashAlpha = /-([a-z])/g;
  function fcamelCase(_all, letter) {
    return letter.toUpperCase();
  }
  function camelCase(string) {
    return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
  }
  var acceptData = function (owner) {
    return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
  };
  function Data() {
    this.expando = jQuery.expando + Data.uid++;
  }
  Data.uid = 1;
  Data.prototype = {
    cache: function (owner) {
      var value = owner[this.expando];
      if (!value) {
        value = {};
        if (acceptData(owner)) {
          if (owner.nodeType) {
            owner[this.expando] = value;
          } else {
            Object.defineProperty(owner, this.expando, {
              value: value,
              configurable: true
            });
          }
        }
      }
      return value;
    },
    set: function (owner, data, value) {
      var prop, cache = this.cache(owner);
      if (typeof data === "string") {
        cache[camelCase(data)] = value;
      } else {
        for (prop in data) {
          cache[camelCase(prop)] = data[prop];
        }
      }
      return cache;
    },
    get: function (owner, key) {
      return key === undefined ? this.cache(owner) : owner[this.expando] && owner[this.expando][camelCase(key)];
    },
    access: function (owner, key, value) {
      if (key === undefined || key && typeof key === "string" && value === undefined) {
        return this.get(owner, key);
      }
      this.set(owner, key, value);
      return value !== undefined ? value : key;
    },
    remove: function (owner, key) {
      var i, cache = owner[this.expando];
      if (cache === undefined) {
        return;
      }
      if (key !== undefined) {
        if (Array.isArray(key)) {
          key = key.map(camelCase);
        } else {
          key = camelCase(key);
          key = (key in cache) ? [key] : key.match(rnothtmlwhite) || [];
        }
        i = key.length;
        while (i--) {
          delete cache[key[i]];
        }
      }
      if (key === undefined || jQuery.isEmptyObject(cache)) {
        if (owner.nodeType) {
          owner[this.expando] = undefined;
        } else {
          delete owner[this.expando];
        }
      }
    },
    hasData: function (owner) {
      var cache = owner[this.expando];
      return cache !== undefined && !jQuery.isEmptyObject(cache);
    }
  };
  var dataPriv = new Data();
  var dataUser = new Data();
  var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
  function getData(data) {
    if (data === "true") {
      return true;
    }
    if (data === "false") {
      return false;
    }
    if (data === "null") {
      return null;
    }
    if (data === +data + "") {
      return +data;
    }
    if (rbrace.test(data)) {
      return JSON.parse(data);
    }
    return data;
  }
  function dataAttr(elem, key, data) {
    var name;
    if (data === undefined && elem.nodeType === 1) {
      name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
      data = elem.getAttribute(name);
      if (typeof data === "string") {
        try {
          data = getData(data);
        } catch (e) {}
        dataUser.set(elem, key, data);
      } else {
        data = undefined;
      }
    }
    return data;
  }
  jQuery.extend({
    hasData: function (elem) {
      return dataUser.hasData(elem) || dataPriv.hasData(elem);
    },
    data: function (elem, name, data) {
      return dataUser.access(elem, name, data);
    },
    removeData: function (elem, name) {
      dataUser.remove(elem, name);
    },
    _data: function (elem, name, data) {
      return dataPriv.access(elem, name, data);
    },
    _removeData: function (elem, name) {
      dataPriv.remove(elem, name);
    }
  });
  jQuery.fn.extend({
    data: function (key, value) {
      var i, name, data, elem = this[0], attrs = elem && elem.attributes;
      if (key === undefined) {
        if (this.length) {
          data = dataUser.get(elem);
          if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
            i = attrs.length;
            while (i--) {
              if (attrs[i]) {
                name = attrs[i].name;
                if (name.indexOf("data-") === 0) {
                  name = camelCase(name.slice(5));
                  dataAttr(elem, name, data[name]);
                }
              }
            }
            dataPriv.set(elem, "hasDataAttrs", true);
          }
        }
        return data;
      }
      if (typeof key === "object") {
        return this.each(function () {
          dataUser.set(this, key);
        });
      }
      return access(this, function (value) {
        var data;
        if (elem && value === undefined) {
          data = dataUser.get(elem, key);
          if (data !== undefined) {
            return data;
          }
          data = dataAttr(elem, key);
          if (data !== undefined) {
            return data;
          }
          return;
        }
        this.each(function () {
          dataUser.set(this, key, value);
        });
      }, null, value, arguments.length > 1, null, true);
    },
    removeData: function (key) {
      return this.each(function () {
        dataUser.remove(this, key);
      });
    }
  });
  jQuery.extend({
    queue: function (elem, type, data) {
      var queue;
      if (elem) {
        type = (type || "fx") + "queue";
        queue = dataPriv.get(elem, type);
        if (data) {
          if (!queue || Array.isArray(data)) {
            queue = dataPriv.access(elem, type, jQuery.makeArray(data));
          } else {
            queue.push(data);
          }
        }
        return queue || [];
      }
    },
    dequeue: function (elem, type) {
      type = type || "fx";
      var queue = jQuery.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery._queueHooks(elem, type), next = function () {
        jQuery.dequeue(elem, type);
      };
      if (fn === "inprogress") {
        fn = queue.shift();
        startLength--;
      }
      if (fn) {
        if (type === "fx") {
          queue.unshift("inprogress");
        }
        delete hooks.stop;
        fn.call(elem, next, hooks);
      }
      if (!startLength && hooks) {
        hooks.empty.fire();
      }
    },
    _queueHooks: function (elem, type) {
      var key = type + "queueHooks";
      return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
        empty: jQuery.Callbacks("once memory").add(function () {
          dataPriv.remove(elem, [type + "queue", key]);
        })
      });
    }
  });
  jQuery.fn.extend({
    queue: function (type, data) {
      var setter = 2;
      if (typeof type !== "string") {
        data = type;
        type = "fx";
        setter--;
      }
      if (arguments.length < setter) {
        return jQuery.queue(this[0], type);
      }
      return data === undefined ? this : this.each(function () {
        var queue = jQuery.queue(this, type, data);
        jQuery._queueHooks(this, type);
        if (type === "fx" && queue[0] !== "inprogress") {
          jQuery.dequeue(this, type);
        }
      });
    },
    dequeue: function (type) {
      return this.each(function () {
        jQuery.dequeue(this, type);
      });
    },
    clearQueue: function (type) {
      return this.queue(type || "fx", []);
    },
    promise: function (type, obj) {
      var tmp, count = 1, defer = jQuery.Deferred(), elements = this, i = this.length, resolve = function () {
        if (!--count) {
          defer.resolveWith(elements, [elements]);
        }
      };
      if (typeof type !== "string") {
        obj = type;
        type = undefined;
      }
      type = type || "fx";
      while (i--) {
        tmp = dataPriv.get(elements[i], type + "queueHooks");
        if (tmp && tmp.empty) {
          count++;
          tmp.empty.add(resolve);
        }
      }
      resolve();
      return defer.promise(obj);
    }
  });
  var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;
  var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
  var cssExpand = ["Top", "Right", "Bottom", "Left"];
  var documentElement = document.documentElement;
  var isAttached = function (elem) {
    return jQuery.contains(elem.ownerDocument, elem);
  }, composed = {
    composed: true
  };
  if (documentElement.getRootNode) {
    isAttached = function (elem) {
      return jQuery.contains(elem.ownerDocument, elem) || elem.getRootNode(composed) === elem.ownerDocument;
    };
  }
  var isHiddenWithinTree = function (elem, el) {
    elem = el || elem;
    return elem.style.display === "none" || elem.style.display === "" && isAttached(elem) && jQuery.css(elem, "display") === "none";
  };
  function adjustCSS(elem, prop, valueParts, tween) {
    var adjusted, scale, maxIterations = 20, currentValue = tween ? function () {
      return tween.cur();
    } : function () {
      return jQuery.css(elem, prop, "");
    }, initial = currentValue(), unit = valueParts && valueParts[3] || (jQuery.cssNumber[prop] ? "" : "px"), initialInUnit = elem.nodeType && (jQuery.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery.css(elem, prop));
    if (initialInUnit && initialInUnit[3] !== unit) {
      initial = initial / 2;
      unit = unit || initialInUnit[3];
      initialInUnit = +initial || 1;
      while (maxIterations--) {
        jQuery.style(elem, prop, initialInUnit + unit);
        if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
          maxIterations = 0;
        }
        initialInUnit = initialInUnit / scale;
      }
      initialInUnit = initialInUnit * 2;
      jQuery.style(elem, prop, initialInUnit + unit);
      valueParts = valueParts || [];
    }
    if (valueParts) {
      initialInUnit = +initialInUnit || +initial || 0;
      adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
      if (tween) {
        tween.unit = unit;
        tween.start = initialInUnit;
        tween.end = adjusted;
      }
    }
    return adjusted;
  }
  var defaultDisplayMap = {};
  function getDefaultDisplay(elem) {
    var temp, doc = elem.ownerDocument, nodeName = elem.nodeName, display = defaultDisplayMap[nodeName];
    if (display) {
      return display;
    }
    temp = doc.body.appendChild(doc.createElement(nodeName));
    display = jQuery.css(temp, "display");
    temp.parentNode.removeChild(temp);
    if (display === "none") {
      display = "block";
    }
    defaultDisplayMap[nodeName] = display;
    return display;
  }
  function showHide(elements, show) {
    var display, elem, values = [], index = 0, length = elements.length;
    for (; index < length; index++) {
      elem = elements[index];
      if (!elem.style) {
        continue;
      }
      display = elem.style.display;
      if (show) {
        if (display === "none") {
          values[index] = dataPriv.get(elem, "display") || null;
          if (!values[index]) {
            elem.style.display = "";
          }
        }
        if (elem.style.display === "" && isHiddenWithinTree(elem)) {
          values[index] = getDefaultDisplay(elem);
        }
      } else {
        if (display !== "none") {
          values[index] = "none";
          dataPriv.set(elem, "display", display);
        }
      }
    }
    for (index = 0; index < length; index++) {
      if (values[index] != null) {
        elements[index].style.display = values[index];
      }
    }
    return elements;
  }
  jQuery.fn.extend({
    show: function () {
      return showHide(this, true);
    },
    hide: function () {
      return showHide(this);
    },
    toggle: function (state) {
      if (typeof state === "boolean") {
        return state ? this.show() : this.hide();
      }
      return this.each(function () {
        if (isHiddenWithinTree(this)) {
          jQuery(this).show();
        } else {
          jQuery(this).hide();
        }
      });
    }
  });
  var rcheckableType = /^(?:checkbox|radio)$/i;
  var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
  var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;
  (function () {
    var fragment = document.createDocumentFragment(), div = fragment.appendChild(document.createElement("div")), input = document.createElement("input");
    input.setAttribute("type", "radio");
    input.setAttribute("checked", "checked");
    input.setAttribute("name", "t");
    div.appendChild(input);
    support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
    div.innerHTML = "<textarea>x</textarea>";
    support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
    div.innerHTML = "<option></option>";
    support.option = !!div.lastChild;
  })();
  var wrapMap = {
    thead: [1, "<table>", "</table>"],
    col: [2, "<table><colgroup>", "</colgroup></table>"],
    tr: [2, "<table><tbody>", "</tbody></table>"],
    td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
    _default: [0, "", ""]
  };
  wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
  wrapMap.th = wrapMap.td;
  if (!support.option) {
    wrapMap.optgroup = wrapMap.option = [1, "<select multiple='multiple'>", "</select>"];
  }
  function getAll(context, tag) {
    var ret;
    if (typeof context.getElementsByTagName !== "undefined") {
      ret = context.getElementsByTagName(tag || "*");
    } else if (typeof context.querySelectorAll !== "undefined") {
      ret = context.querySelectorAll(tag || "*");
    } else {
      ret = [];
    }
    if (tag === undefined || tag && nodeName(context, tag)) {
      return jQuery.merge([context], ret);
    }
    return ret;
  }
  function setGlobalEval(elems, refElements) {
    var i = 0, l = elems.length;
    for (; i < l; i++) {
      dataPriv.set(elems[i], "globalEval", !refElements || dataPriv.get(refElements[i], "globalEval"));
    }
  }
  var rhtml = /<|&#?\w+;/;
  function buildFragment(elems, context, scripts, selection, ignored) {
    var elem, tmp, tag, wrap, attached, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
    for (; i < l; i++) {
      elem = elems[i];
      if (elem || elem === 0) {
        if (toType(elem) === "object") {
          jQuery.merge(nodes, elem.nodeType ? [elem] : elem);
        } else if (!rhtml.test(elem)) {
          nodes.push(context.createTextNode(elem));
        } else {
          tmp = tmp || fragment.appendChild(context.createElement("div"));
          tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
          wrap = wrapMap[tag] || wrapMap._default;
          tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];
          j = wrap[0];
          while (j--) {
            tmp = tmp.lastChild;
          }
          jQuery.merge(nodes, tmp.childNodes);
          tmp = fragment.firstChild;
          tmp.textContent = "";
        }
      }
    }
    fragment.textContent = "";
    i = 0;
    while (elem = nodes[i++]) {
      if (selection && jQuery.inArray(elem, selection) > -1) {
        if (ignored) {
          ignored.push(elem);
        }
        continue;
      }
      attached = isAttached(elem);
      tmp = getAll(fragment.appendChild(elem), "script");
      if (attached) {
        setGlobalEval(tmp);
      }
      if (scripts) {
        j = 0;
        while (elem = tmp[j++]) {
          if (rscriptType.test(elem.type || "")) {
            scripts.push(elem);
          }
        }
      }
    }
    return fragment;
  }
  var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
  function returnTrue() {
    return true;
  }
  function returnFalse() {
    return false;
  }
  function expectSync(elem, type) {
    return elem === safeActiveElement() === (type === "focus");
  }
  function safeActiveElement() {
    try {
      return document.activeElement;
    } catch (err) {}
  }
  function on(elem, types, selector, data, fn, one) {
    var origFn, type;
    if (typeof types === "object") {
      if (typeof selector !== "string") {
        data = data || selector;
        selector = undefined;
      }
      for (type in types) {
        on(elem, type, selector, data, types[type], one);
      }
      return elem;
    }
    if (data == null && fn == null) {
      fn = selector;
      data = selector = undefined;
    } else if (fn == null) {
      if (typeof selector === "string") {
        fn = data;
        data = undefined;
      } else {
        fn = data;
        data = selector;
        selector = undefined;
      }
    }
    if (fn === false) {
      fn = returnFalse;
    } else if (!fn) {
      return elem;
    }
    if (one === 1) {
      origFn = fn;
      fn = function (event) {
        jQuery().off(event);
        return origFn.apply(this, arguments);
      };
      fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
    }
    return elem.each(function () {
      jQuery.event.add(this, types, fn, data, selector);
    });
  }
  jQuery.event = {
    global: {},
    add: function (elem, types, handler, data, selector) {
      var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
      if (!acceptData(elem)) {
        return;
      }
      if (handler.handler) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
      }
      if (selector) {
        jQuery.find.matchesSelector(documentElement, selector);
      }
      if (!handler.guid) {
        handler.guid = jQuery.guid++;
      }
      if (!(events = elemData.events)) {
        events = elemData.events = Object.create(null);
      }
      if (!(eventHandle = elemData.handle)) {
        eventHandle = elemData.handle = function (e) {
          return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : undefined;
        };
      }
      types = (types || "").match(rnothtmlwhite) || [""];
      t = types.length;
      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || "").split(".").sort();
        if (!type) {
          continue;
        }
        special = jQuery.event.special[type] || ({});
        type = (selector ? special.delegateType : special.bindType) || type;
        special = jQuery.event.special[type] || ({});
        handleObj = jQuery.extend({
          type: type,
          origType: origType,
          data: data,
          handler: handler,
          guid: handler.guid,
          selector: selector,
          needsContext: selector && jQuery.expr.match.needsContext.test(selector),
          namespace: namespaces.join(".")
        }, handleObjIn);
        if (!(handlers = events[type])) {
          handlers = events[type] = [];
          handlers.delegateCount = 0;
          if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
            if (elem.addEventListener) {
              elem.addEventListener(type, eventHandle);
            }
          }
        }
        if (special.add) {
          special.add.call(elem, handleObj);
          if (!handleObj.handler.guid) {
            handleObj.handler.guid = handler.guid;
          }
        }
        if (selector) {
          handlers.splice(handlers.delegateCount++, 0, handleObj);
        } else {
          handlers.push(handleObj);
        }
        jQuery.event.global[type] = true;
      }
    },
    remove: function (elem, types, handler, selector, mappedTypes) {
      var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
      if (!elemData || !(events = elemData.events)) {
        return;
      }
      types = (types || "").match(rnothtmlwhite) || [""];
      t = types.length;
      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || "").split(".").sort();
        if (!type) {
          for (type in events) {
            jQuery.event.remove(elem, type + types[t], handler, selector, true);
          }
          continue;
        }
        special = jQuery.event.special[type] || ({});
        type = (selector ? special.delegateType : special.bindType) || type;
        handlers = events[type] || [];
        tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
        origCount = j = handlers.length;
        while (j--) {
          handleObj = handlers[j];
          if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
            handlers.splice(j, 1);
            if (handleObj.selector) {
              handlers.delegateCount--;
            }
            if (special.remove) {
              special.remove.call(elem, handleObj);
            }
          }
        }
        if (origCount && !handlers.length) {
          if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
            jQuery.removeEvent(elem, type, elemData.handle);
          }
          delete events[type];
        }
      }
      if (jQuery.isEmptyObject(events)) {
        dataPriv.remove(elem, "handle events");
      }
    },
    dispatch: function (nativeEvent) {
      var i, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length), event = jQuery.event.fix(nativeEvent), handlers = (dataPriv.get(this, "events") || Object.create(null))[event.type] || [], special = jQuery.event.special[event.type] || ({});
      args[0] = event;
      for (i = 1; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      event.delegateTarget = this;
      if (special.preDispatch && special.preDispatch.call(this, event) === false) {
        return;
      }
      handlerQueue = jQuery.event.handlers.call(this, event, handlers);
      i = 0;
      while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;
        j = 0;
        while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
          if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
            event.handleObj = handleObj;
            event.data = handleObj.data;
            ret = ((jQuery.event.special[handleObj.origType] || ({})).handle || handleObj.handler).apply(matched.elem, args);
            if (ret !== undefined) {
              if ((event.result = ret) === false) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          }
        }
      }
      if (special.postDispatch) {
        special.postDispatch.call(this, event);
      }
      return event.result;
    },
    handlers: function (event, handlers) {
      var i, handleObj, sel, matchedHandlers, matchedSelectors, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
      if (delegateCount && cur.nodeType && !(event.type === "click" && event.button >= 1)) {
        for (; cur !== this; cur = cur.parentNode || this) {
          if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
            matchedHandlers = [];
            matchedSelectors = {};
            for (i = 0; i < delegateCount; i++) {
              handleObj = handlers[i];
              sel = handleObj.selector + " ";
              if (matchedSelectors[sel] === undefined) {
                matchedSelectors[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) > -1 : jQuery.find(sel, this, null, [cur]).length;
              }
              if (matchedSelectors[sel]) {
                matchedHandlers.push(handleObj);
              }
            }
            if (matchedHandlers.length) {
              handlerQueue.push({
                elem: cur,
                handlers: matchedHandlers
              });
            }
          }
        }
      }
      cur = this;
      if (delegateCount < handlers.length) {
        handlerQueue.push({
          elem: cur,
          handlers: handlers.slice(delegateCount)
        });
      }
      return handlerQueue;
    },
    addProp: function (name, hook) {
      Object.defineProperty(jQuery.Event.prototype, name, {
        enumerable: true,
        configurable: true,
        get: isFunction(hook) ? function () {
          if (this.originalEvent) {
            return hook(this.originalEvent);
          }
        } : function () {
          if (this.originalEvent) {
            return this.originalEvent[name];
          }
        },
        set: function (value) {
          Object.defineProperty(this, name, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
          });
        }
      });
    },
    fix: function (originalEvent) {
      return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent);
    },
    special: {
      load: {
        noBubble: true
      },
      click: {
        setup: function (data) {
          var el = this || data;
          if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
            leverageNative(el, "click", returnTrue);
          }
          return false;
        },
        trigger: function (data) {
          var el = this || data;
          if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
            leverageNative(el, "click");
          }
          return true;
        },
        _default: function (event) {
          var target = event.target;
          return rcheckableType.test(target.type) && target.click && nodeName(target, "input") && dataPriv.get(target, "click") || nodeName(target, "a");
        }
      },
      beforeunload: {
        postDispatch: function (event) {
          if (event.result !== undefined && event.originalEvent) {
            event.originalEvent.returnValue = event.result;
          }
        }
      }
    }
  };
  function leverageNative(el, type, expectSync) {
    if (!expectSync) {
      if (dataPriv.get(el, type) === undefined) {
        jQuery.event.add(el, type, returnTrue);
      }
      return;
    }
    dataPriv.set(el, type, false);
    jQuery.event.add(el, type, {
      namespace: false,
      handler: function (event) {
        var notAsync, result, saved = dataPriv.get(this, type);
        if (event.isTrigger & 1 && this[type]) {
          if (!saved.length) {
            saved = slice.call(arguments);
            dataPriv.set(this, type, saved);
            notAsync = expectSync(this, type);
            this[type]();
            result = dataPriv.get(this, type);
            if (saved !== result || notAsync) {
              dataPriv.set(this, type, false);
            } else {
              result = {};
            }
            if (saved !== result) {
              event.stopImmediatePropagation();
              event.preventDefault();
              return result && result.value;
            }
          } else if ((jQuery.event.special[type] || ({})).delegateType) {
            event.stopPropagation();
          }
        } else if (saved.length) {
          dataPriv.set(this, type, {
            value: jQuery.event.trigger(jQuery.extend(saved[0], jQuery.Event.prototype), saved.slice(1), this)
          });
          event.stopImmediatePropagation();
        }
      }
    });
  }
  jQuery.removeEvent = function (elem, type, handle) {
    if (elem.removeEventListener) {
      elem.removeEventListener(type, handle);
    }
  };
  jQuery.Event = function (src, props) {
    if (!(this instanceof jQuery.Event)) {
      return new jQuery.Event(src, props);
    }
    if (src && src.type) {
      this.originalEvent = src;
      this.type = src.type;
      this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined && src.returnValue === false ? returnTrue : returnFalse;
      this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
      this.currentTarget = src.currentTarget;
      this.relatedTarget = src.relatedTarget;
    } else {
      this.type = src;
    }
    if (props) {
      jQuery.extend(this, props);
    }
    this.timeStamp = src && src.timeStamp || Date.now();
    this[jQuery.expando] = true;
  };
  jQuery.Event.prototype = {
    constructor: jQuery.Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,
    isSimulated: false,
    preventDefault: function () {
      var e = this.originalEvent;
      this.isDefaultPrevented = returnTrue;
      if (e && !this.isSimulated) {
        e.preventDefault();
      }
    },
    stopPropagation: function () {
      var e = this.originalEvent;
      this.isPropagationStopped = returnTrue;
      if (e && !this.isSimulated) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function () {
      var e = this.originalEvent;
      this.isImmediatePropagationStopped = returnTrue;
      if (e && !this.isSimulated) {
        e.stopImmediatePropagation();
      }
      this.stopPropagation();
    }
  };
  jQuery.each({
    altKey: true,
    bubbles: true,
    cancelable: true,
    changedTouches: true,
    ctrlKey: true,
    detail: true,
    eventPhase: true,
    metaKey: true,
    pageX: true,
    pageY: true,
    shiftKey: true,
    view: true,
    "char": true,
    code: true,
    charCode: true,
    key: true,
    keyCode: true,
    button: true,
    buttons: true,
    clientX: true,
    clientY: true,
    offsetX: true,
    offsetY: true,
    pointerId: true,
    pointerType: true,
    screenX: true,
    screenY: true,
    targetTouches: true,
    toElement: true,
    touches: true,
    which: true
  }, jQuery.event.addProp);
  jQuery.each({
    focus: "focusin",
    blur: "focusout"
  }, function (type, delegateType) {
    jQuery.event.special[type] = {
      setup: function () {
        leverageNative(this, type, expectSync);
        return false;
      },
      trigger: function () {
        leverageNative(this, type);
        return true;
      },
      _default: function () {
        return true;
      },
      delegateType: delegateType
    };
  });
  jQuery.each({
    mouseenter: "mouseover",
    mouseleave: "mouseout",
    pointerenter: "pointerover",
    pointerleave: "pointerout"
  }, function (orig, fix) {
    jQuery.event.special[orig] = {
      delegateType: fix,
      bindType: fix,
      handle: function (event) {
        var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
        if (!related || related !== target && !jQuery.contains(target, related)) {
          event.type = handleObj.origType;
          ret = handleObj.handler.apply(this, arguments);
          event.type = fix;
        }
        return ret;
      }
    };
  });
  jQuery.fn.extend({
    on: function (types, selector, data, fn) {
      return on(this, types, selector, data, fn);
    },
    one: function (types, selector, data, fn) {
      return on(this, types, selector, data, fn, 1);
    },
    off: function (types, selector, fn) {
      var handleObj, type;
      if (types && types.preventDefault && types.handleObj) {
        handleObj = types.handleObj;
        jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
        return this;
      }
      if (typeof types === "object") {
        for (type in types) {
          this.off(type, selector, types[type]);
        }
        return this;
      }
      if (selector === false || typeof selector === "function") {
        fn = selector;
        selector = undefined;
      }
      if (fn === false) {
        fn = returnFalse;
      }
      return this.each(function () {
        jQuery.event.remove(this, types, fn, selector);
      });
    }
  });
  var rnoInnerhtml = /<script|<style|<link/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
  function manipulationTarget(elem, content) {
    if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
      return jQuery(elem).children("tbody")[0] || elem;
    }
    return elem;
  }
  function disableScript(elem) {
    elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
    return elem;
  }
  function restoreScript(elem) {
    if ((elem.type || "").slice(0, 5) === "true/") {
      elem.type = elem.type.slice(5);
    } else {
      elem.removeAttribute("type");
    }
    return elem;
  }
  function cloneCopyEvent(src, dest) {
    var i, l, type, pdataOld, udataOld, udataCur, events;
    if (dest.nodeType !== 1) {
      return;
    }
    if (dataPriv.hasData(src)) {
      pdataOld = dataPriv.get(src);
      events = pdataOld.events;
      if (events) {
        dataPriv.remove(dest, "handle events");
        for (type in events) {
          for ((i = 0, l = events[type].length); i < l; i++) {
            jQuery.event.add(dest, type, events[type][i]);
          }
        }
      }
    }
    if (dataUser.hasData(src)) {
      udataOld = dataUser.access(src);
      udataCur = jQuery.extend({}, udataOld);
      dataUser.set(dest, udataCur);
    }
  }
  function fixInput(src, dest) {
    var nodeName = dest.nodeName.toLowerCase();
    if (nodeName === "input" && rcheckableType.test(src.type)) {
      dest.checked = src.checked;
    } else if (nodeName === "input" || nodeName === "textarea") {
      dest.defaultValue = src.defaultValue;
    }
  }
  function domManip(collection, args, callback, ignored) {
    args = flat(args);
    var fragment, first, scripts, hasScripts, node, doc, i = 0, l = collection.length, iNoClone = l - 1, value = args[0], valueIsFunction = isFunction(value);
    if (valueIsFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
      return collection.each(function (index) {
        var self = collection.eq(index);
        if (valueIsFunction) {
          args[0] = value.call(this, index, self.html());
        }
        domManip(self, args, callback, ignored);
      });
    }
    if (l) {
      fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
      first = fragment.firstChild;
      if (fragment.childNodes.length === 1) {
        fragment = first;
      }
      if (first || ignored) {
        scripts = jQuery.map(getAll(fragment, "script"), disableScript);
        hasScripts = scripts.length;
        for (; i < l; i++) {
          node = fragment;
          if (i !== iNoClone) {
            node = jQuery.clone(node, true, true);
            if (hasScripts) {
              jQuery.merge(scripts, getAll(node, "script"));
            }
          }
          callback.call(collection[i], node, i);
        }
        if (hasScripts) {
          doc = scripts[scripts.length - 1].ownerDocument;
          jQuery.map(scripts, restoreScript);
          for (i = 0; i < hasScripts; i++) {
            node = scripts[i];
            if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {
              if (node.src && (node.type || "").toLowerCase() !== "module") {
                if (jQuery._evalUrl && !node.noModule) {
                  jQuery._evalUrl(node.src, {
                    nonce: node.nonce || node.getAttribute("nonce")
                  }, doc);
                }
              } else {
                DOMEval(node.textContent.replace(rcleanScript, ""), node, doc);
              }
            }
          }
        }
      }
    }
    return collection;
  }
  function remove(elem, selector, keepData) {
    var node, nodes = selector ? jQuery.filter(selector, elem) : elem, i = 0;
    for (; (node = nodes[i]) != null; i++) {
      if (!keepData && node.nodeType === 1) {
        jQuery.cleanData(getAll(node));
      }
      if (node.parentNode) {
        if (keepData && isAttached(node)) {
          setGlobalEval(getAll(node, "script"));
        }
        node.parentNode.removeChild(node);
      }
    }
    return elem;
  }
  jQuery.extend({
    htmlPrefilter: function (html) {
      return html;
    },
    clone: function (elem, dataAndEvents, deepDataAndEvents) {
      var i, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = isAttached(elem);
      if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
        destElements = getAll(clone);
        srcElements = getAll(elem);
        for ((i = 0, l = srcElements.length); i < l; i++) {
          fixInput(srcElements[i], destElements[i]);
        }
      }
      if (dataAndEvents) {
        if (deepDataAndEvents) {
          srcElements = srcElements || getAll(elem);
          destElements = destElements || getAll(clone);
          for ((i = 0, l = srcElements.length); i < l; i++) {
            cloneCopyEvent(srcElements[i], destElements[i]);
          }
        } else {
          cloneCopyEvent(elem, clone);
        }
      }
      destElements = getAll(clone, "script");
      if (destElements.length > 0) {
        setGlobalEval(destElements, !inPage && getAll(elem, "script"));
      }
      return clone;
    },
    cleanData: function (elems) {
      var data, elem, type, special = jQuery.event.special, i = 0;
      for (; (elem = elems[i]) !== undefined; i++) {
        if (acceptData(elem)) {
          if (data = elem[dataPriv.expando]) {
            if (data.events) {
              for (type in data.events) {
                if (special[type]) {
                  jQuery.event.remove(elem, type);
                } else {
                  jQuery.removeEvent(elem, type, data.handle);
                }
              }
            }
            elem[dataPriv.expando] = undefined;
          }
          if (elem[dataUser.expando]) {
            elem[dataUser.expando] = undefined;
          }
        }
      }
    }
  });
  jQuery.fn.extend({
    detach: function (selector) {
      return remove(this, selector, true);
    },
    remove: function (selector) {
      return remove(this, selector);
    },
    text: function (value) {
      return access(this, function (value) {
        return value === undefined ? jQuery.text(this) : this.empty().each(function () {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
            this.textContent = value;
          }
        });
      }, null, value, arguments.length);
    },
    append: function () {
      return domManip(this, arguments, function (elem) {
        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
          var target = manipulationTarget(this, elem);
          target.appendChild(elem);
        }
      });
    },
    prepend: function () {
      return domManip(this, arguments, function (elem) {
        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
          var target = manipulationTarget(this, elem);
          target.insertBefore(elem, target.firstChild);
        }
      });
    },
    before: function () {
      return domManip(this, arguments, function (elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this);
        }
      });
    },
    after: function () {
      return domManip(this, arguments, function (elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this.nextSibling);
        }
      });
    },
    empty: function () {
      var elem, i = 0;
      for (; (elem = this[i]) != null; i++) {
        if (elem.nodeType === 1) {
          jQuery.cleanData(getAll(elem, false));
          elem.textContent = "";
        }
      }
      return this;
    },
    clone: function (dataAndEvents, deepDataAndEvents) {
      dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
      deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
      return this.map(function () {
        return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
      });
    },
    html: function (value) {
      return access(this, function (value) {
        var elem = this[0] || ({}), i = 0, l = this.length;
        if (value === undefined && elem.nodeType === 1) {
          return elem.innerHTML;
        }
        if (typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {
          value = jQuery.htmlPrefilter(value);
          try {
            for (; i < l; i++) {
              elem = this[i] || ({});
              if (elem.nodeType === 1) {
                jQuery.cleanData(getAll(elem, false));
                elem.innerHTML = value;
              }
            }
            elem = 0;
          } catch (e) {}
        }
        if (elem) {
          this.empty().append(value);
        }
      }, null, value, arguments.length);
    },
    replaceWith: function () {
      var ignored = [];
      return domManip(this, arguments, function (elem) {
        var parent = this.parentNode;
        if (jQuery.inArray(this, ignored) < 0) {
          jQuery.cleanData(getAll(this));
          if (parent) {
            parent.replaceChild(elem, this);
          }
        }
      }, ignored);
    }
  });
  jQuery.each({
    appendTo: "append",
    prependTo: "prepend",
    insertBefore: "before",
    insertAfter: "after",
    replaceAll: "replaceWith"
  }, function (name, original) {
    jQuery.fn[name] = function (selector) {
      var elems, ret = [], insert = jQuery(selector), last = insert.length - 1, i = 0;
      for (; i <= last; i++) {
        elems = i === last ? this : this.clone(true);
        jQuery(insert[i])[original](elems);
        push.apply(ret, elems.get());
      }
      return this.pushStack(ret);
    };
  });
  var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
  var getStyles = function (elem) {
    var view = elem.ownerDocument.defaultView;
    if (!view || !view.opener) {
      view = window;
    }
    return view.getComputedStyle(elem);
  };
  var swap = function (elem, options, callback) {
    var ret, name, old = {};
    for (name in options) {
      old[name] = elem.style[name];
      elem.style[name] = options[name];
    }
    ret = callback.call(elem);
    for (name in options) {
      elem.style[name] = old[name];
    }
    return ret;
  };
  var rboxStyle = new RegExp(cssExpand.join("|"), "i");
  (function () {
    function computeStyleTests() {
      if (!div) {
        return;
      }
      container.style.cssText = "position:absolute;left:-11111px;width:60px;" + "margin-top:1px;padding:0;border:0";
      div.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;" + "margin:auto;border:1px;padding:1px;" + "width:60%;top:1%";
      documentElement.appendChild(container).appendChild(div);
      var divStyle = window.getComputedStyle(div);
      pixelPositionVal = divStyle.top !== "1%";
      reliableMarginLeftVal = roundPixelMeasures(divStyle.marginLeft) === 12;
      div.style.right = "60%";
      pixelBoxStylesVal = roundPixelMeasures(divStyle.right) === 36;
      boxSizingReliableVal = roundPixelMeasures(divStyle.width) === 36;
      div.style.position = "absolute";
      scrollboxSizeVal = roundPixelMeasures(div.offsetWidth / 3) === 12;
      documentElement.removeChild(container);
      div = null;
    }
    function roundPixelMeasures(measure) {
      return Math.round(parseFloat(measure));
    }
    var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal, reliableTrDimensionsVal, reliableMarginLeftVal, container = document.createElement("div"), div = document.createElement("div");
    if (!div.style) {
      return;
    }
    div.style.backgroundClip = "content-box";
    div.cloneNode(true).style.backgroundClip = "";
    support.clearCloneStyle = div.style.backgroundClip === "content-box";
    jQuery.extend(support, {
      boxSizingReliable: function () {
        computeStyleTests();
        return boxSizingReliableVal;
      },
      pixelBoxStyles: function () {
        computeStyleTests();
        return pixelBoxStylesVal;
      },
      pixelPosition: function () {
        computeStyleTests();
        return pixelPositionVal;
      },
      reliableMarginLeft: function () {
        computeStyleTests();
        return reliableMarginLeftVal;
      },
      scrollboxSize: function () {
        computeStyleTests();
        return scrollboxSizeVal;
      },
      reliableTrDimensions: function () {
        var table, tr, trChild, trStyle;
        if (reliableTrDimensionsVal == null) {
          table = document.createElement("table");
          tr = document.createElement("tr");
          trChild = document.createElement("div");
          table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
          tr.style.cssText = "border:1px solid";
          tr.style.height = "1px";
          trChild.style.height = "9px";
          trChild.style.display = "block";
          documentElement.appendChild(table).appendChild(tr).appendChild(trChild);
          trStyle = window.getComputedStyle(tr);
          reliableTrDimensionsVal = parseInt(trStyle.height, 10) + parseInt(trStyle.borderTopWidth, 10) + parseInt(trStyle.borderBottomWidth, 10) === tr.offsetHeight;
          documentElement.removeChild(table);
        }
        return reliableTrDimensionsVal;
      }
    });
  })();
  function curCSS(elem, name, computed) {
    var width, minWidth, maxWidth, ret, style = elem.style;
    computed = computed || getStyles(elem);
    if (computed) {
      ret = computed.getPropertyValue(name) || computed[name];
      if (ret === "" && !isAttached(elem)) {
        ret = jQuery.style(elem, name);
      }
      if (!support.pixelBoxStyles() && rnumnonpx.test(ret) && rboxStyle.test(name)) {
        width = style.width;
        minWidth = style.minWidth;
        maxWidth = style.maxWidth;
        style.minWidth = style.maxWidth = style.width = ret;
        ret = computed.width;
        style.width = width;
        style.minWidth = minWidth;
        style.maxWidth = maxWidth;
      }
    }
    return ret !== undefined ? ret + "" : ret;
  }
  function addGetHookIf(conditionFn, hookFn) {
    return {
      get: function () {
        if (conditionFn()) {
          delete this.get;
          return;
        }
        return (this.get = hookFn).apply(this, arguments);
      }
    };
  }
  var cssPrefixes = ["Webkit", "Moz", "ms"], emptyStyle = document.createElement("div").style, vendorProps = {};
  function vendorPropName(name) {
    var capName = name[0].toUpperCase() + name.slice(1), i = cssPrefixes.length;
    while (i--) {
      name = cssPrefixes[i] + capName;
      if ((name in emptyStyle)) {
        return name;
      }
    }
  }
  function finalPropName(name) {
    var final = jQuery.cssProps[name] || vendorProps[name];
    if (final) {
      return final;
    }
    if ((name in emptyStyle)) {
      return name;
    }
    return vendorProps[name] = vendorPropName(name) || name;
  }
  var rdisplayswap = /^(none|table(?!-c[ea]).+)/, rcustomProp = /^--/, cssShow = {
    position: "absolute",
    visibility: "hidden",
    display: "block"
  }, cssNormalTransform = {
    letterSpacing: "0",
    fontWeight: "400"
  };
  function setPositiveNumber(_elem, value, subtract) {
    var matches = rcssNum.exec(value);
    return matches ? Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px") : value;
  }
  function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
    var i = dimension === "width" ? 1 : 0, extra = 0, delta = 0;
    if (box === (isBorderBox ? "border" : "content")) {
      return 0;
    }
    for (; i < 4; i += 2) {
      if (box === "margin") {
        delta += jQuery.css(elem, box + cssExpand[i], true, styles);
      }
      if (!isBorderBox) {
        delta += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
        if (box !== "padding") {
          delta += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
        } else {
          extra += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
        }
      } else {
        if (box === "content") {
          delta -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
        }
        if (box !== "margin") {
          delta -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
        }
      }
    }
    if (!isBorderBox && computedVal >= 0) {
      delta += Math.max(0, Math.ceil(elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5)) || 0;
    }
    return delta;
  }
  function getWidthOrHeight(elem, dimension, extra) {
    var styles = getStyles(elem), boxSizingNeeded = !support.boxSizingReliable() || extra, isBorderBox = boxSizingNeeded && jQuery.css(elem, "boxSizing", false, styles) === "border-box", valueIsBorderBox = isBorderBox, val = curCSS(elem, dimension, styles), offsetProp = "offset" + dimension[0].toUpperCase() + dimension.slice(1);
    if (rnumnonpx.test(val)) {
      if (!extra) {
        return val;
      }
      val = "auto";
    }
    if ((!support.boxSizingReliable() && isBorderBox || !support.reliableTrDimensions() && nodeName(elem, "tr") || val === "auto" || !parseFloat(val) && jQuery.css(elem, "display", false, styles) === "inline") && elem.getClientRects().length) {
      isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";
      valueIsBorderBox = (offsetProp in elem);
      if (valueIsBorderBox) {
        val = elem[offsetProp];
      }
    }
    val = parseFloat(val) || 0;
    return val + boxModelAdjustment(elem, dimension, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles, val) + "px";
  }
  jQuery.extend({
    cssHooks: {
      opacity: {
        get: function (elem, computed) {
          if (computed) {
            var ret = curCSS(elem, "opacity");
            return ret === "" ? "1" : ret;
          }
        }
      }
    },
    cssNumber: {
      "animationIterationCount": true,
      "columnCount": true,
      "fillOpacity": true,
      "flexGrow": true,
      "flexShrink": true,
      "fontWeight": true,
      "gridArea": true,
      "gridColumn": true,
      "gridColumnEnd": true,
      "gridColumnStart": true,
      "gridRow": true,
      "gridRowEnd": true,
      "gridRowStart": true,
      "lineHeight": true,
      "opacity": true,
      "order": true,
      "orphans": true,
      "widows": true,
      "zIndex": true,
      "zoom": true
    },
    cssProps: {},
    style: function (elem, name, value, extra) {
      if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
        return;
      }
      var ret, type, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name), style = elem.style;
      if (!isCustomProp) {
        name = finalPropName(origName);
      }
      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
      if (value !== undefined) {
        type = typeof value;
        if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
          value = adjustCSS(elem, name, ret);
          type = "number";
        }
        if (value == null || value !== value) {
          return;
        }
        if (type === "number" && !isCustomProp) {
          value += ret && ret[3] || (jQuery.cssNumber[origName] ? "" : "px");
        }
        if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
          style[name] = "inherit";
        }
        if (!hooks || !(("set" in hooks)) || (value = hooks.set(elem, value, extra)) !== undefined) {
          if (isCustomProp) {
            style.setProperty(name, value);
          } else {
            style[name] = value;
          }
        }
      } else {
        if (hooks && ("get" in hooks) && (ret = hooks.get(elem, false, extra)) !== undefined) {
          return ret;
        }
        return style[name];
      }
    },
    css: function (elem, name, extra, styles) {
      var val, num, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name);
      if (!isCustomProp) {
        name = finalPropName(origName);
      }
      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
      if (hooks && ("get" in hooks)) {
        val = hooks.get(elem, true, extra);
      }
      if (val === undefined) {
        val = curCSS(elem, name, styles);
      }
      if (val === "normal" && (name in cssNormalTransform)) {
        val = cssNormalTransform[name];
      }
      if (extra === "" || extra) {
        num = parseFloat(val);
        return extra === true || isFinite(num) ? num || 0 : val;
      }
      return val;
    }
  });
  jQuery.each(["height", "width"], function (_i, dimension) {
    jQuery.cssHooks[dimension] = {
      get: function (elem, computed, extra) {
        if (computed) {
          return rdisplayswap.test(jQuery.css(elem, "display")) && (!elem.getClientRects().length || !elem.getBoundingClientRect().width) ? swap(elem, cssShow, function () {
            return getWidthOrHeight(elem, dimension, extra);
          }) : getWidthOrHeight(elem, dimension, extra);
        }
      },
      set: function (elem, value, extra) {
        var matches, styles = getStyles(elem), scrollboxSizeBuggy = !support.scrollboxSize() && styles.position === "absolute", boxSizingNeeded = scrollboxSizeBuggy || extra, isBorderBox = boxSizingNeeded && jQuery.css(elem, "boxSizing", false, styles) === "border-box", subtract = extra ? boxModelAdjustment(elem, dimension, extra, isBorderBox, styles) : 0;
        if (isBorderBox && scrollboxSizeBuggy) {
          subtract -= Math.ceil(elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - parseFloat(styles[dimension]) - boxModelAdjustment(elem, dimension, "border", false, styles) - 0.5);
        }
        if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {
          elem.style[dimension] = value;
          value = jQuery.css(elem, dimension);
        }
        return setPositiveNumber(elem, value, subtract);
      }
    };
  });
  jQuery.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, function (elem, computed) {
    if (computed) {
      return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, {
        marginLeft: 0
      }, function () {
        return elem.getBoundingClientRect().left;
      })) + "px";
    }
  });
  jQuery.each({
    margin: "",
    padding: "",
    border: "Width"
  }, function (prefix, suffix) {
    jQuery.cssHooks[prefix + suffix] = {
      expand: function (value) {
        var i = 0, expanded = {}, parts = typeof value === "string" ? value.split(" ") : [value];
        for (; i < 4; i++) {
          expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
        }
        return expanded;
      }
    };
    if (prefix !== "margin") {
      jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
    }
  });
  jQuery.fn.extend({
    css: function (name, value) {
      return access(this, function (elem, name, value) {
        var styles, len, map = {}, i = 0;
        if (Array.isArray(name)) {
          styles = getStyles(elem);
          len = name.length;
          for (; i < len; i++) {
            map[name[i]] = jQuery.css(elem, name[i], false, styles);
          }
          return map;
        }
        return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
      }, name, value, arguments.length > 1);
    }
  });
  function Tween(elem, options, prop, end, easing) {
    return new Tween.prototype.init(elem, options, prop, end, easing);
  }
  jQuery.Tween = Tween;
  Tween.prototype = {
    constructor: Tween,
    init: function (elem, options, prop, end, easing, unit) {
      this.elem = elem;
      this.prop = prop;
      this.easing = easing || jQuery.easing._default;
      this.options = options;
      this.start = this.now = this.cur();
      this.end = end;
      this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
    },
    cur: function () {
      var hooks = Tween.propHooks[this.prop];
      return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
    },
    run: function (percent) {
      var eased, hooks = Tween.propHooks[this.prop];
      if (this.options.duration) {
        this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);
      } else {
        this.pos = eased = percent;
      }
      this.now = (this.end - this.start) * eased + this.start;
      if (this.options.step) {
        this.options.step.call(this.elem, this.now, this);
      }
      if (hooks && hooks.set) {
        hooks.set(this);
      } else {
        Tween.propHooks._default.set(this);
      }
      return this;
    }
  };
  Tween.prototype.init.prototype = Tween.prototype;
  Tween.propHooks = {
    _default: {
      get: function (tween) {
        var result;
        if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
          return tween.elem[tween.prop];
        }
        result = jQuery.css(tween.elem, tween.prop, "");
        return !result || result === "auto" ? 0 : result;
      },
      set: function (tween) {
        if (jQuery.fx.step[tween.prop]) {
          jQuery.fx.step[tween.prop](tween);
        } else if (tween.elem.nodeType === 1 && (jQuery.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) {
          jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
        } else {
          tween.elem[tween.prop] = tween.now;
        }
      }
    }
  };
  Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
    set: function (tween) {
      if (tween.elem.nodeType && tween.elem.parentNode) {
        tween.elem[tween.prop] = tween.now;
      }
    }
  };
  jQuery.easing = {
    linear: function (p) {
      return p;
    },
    swing: function (p) {
      return 0.5 - Math.cos(p * Math.PI) / 2;
    },
    _default: "swing"
  };
  jQuery.fx = Tween.prototype.init;
  jQuery.fx.step = {};
  var fxNow, inProgress, rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
  function schedule() {
    if (inProgress) {
      if (document.hidden === false && window.requestAnimationFrame) {
        window.requestAnimationFrame(schedule);
      } else {
        window.setTimeout(schedule, jQuery.fx.interval);
      }
      jQuery.fx.tick();
    }
  }
  function createFxNow() {
    window.setTimeout(function () {
      fxNow = undefined;
    });
    return fxNow = Date.now();
  }
  function genFx(type, includeWidth) {
    var which, i = 0, attrs = {
      height: type
    };
    includeWidth = includeWidth ? 1 : 0;
    for (; i < 4; i += 2 - includeWidth) {
      which = cssExpand[i];
      attrs["margin" + which] = attrs["padding" + which] = type;
    }
    if (includeWidth) {
      attrs.opacity = attrs.width = type;
    }
    return attrs;
  }
  function createTween(value, prop, animation) {
    var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]), index = 0, length = collection.length;
    for (; index < length; index++) {
      if (tween = collection[index].call(animation, prop, value)) {
        return tween;
      }
    }
  }
  function defaultPrefilter(elem, props, opts) {
    var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display, isBox = ("width" in props) || ("height" in props), anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, "fxshow");
    if (!opts.queue) {
      hooks = jQuery._queueHooks(elem, "fx");
      if (hooks.unqueued == null) {
        hooks.unqueued = 0;
        oldfire = hooks.empty.fire;
        hooks.empty.fire = function () {
          if (!hooks.unqueued) {
            oldfire();
          }
        };
      }
      hooks.unqueued++;
      anim.always(function () {
        anim.always(function () {
          hooks.unqueued--;
          if (!jQuery.queue(elem, "fx").length) {
            hooks.empty.fire();
          }
        });
      });
    }
    for (prop in props) {
      value = props[prop];
      if (rfxtypes.test(value)) {
        delete props[prop];
        toggle = toggle || value === "toggle";
        if (value === (hidden ? "hide" : "show")) {
          if (value === "show" && dataShow && dataShow[prop] !== undefined) {
            hidden = true;
          } else {
            continue;
          }
        }
        orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
      }
    }
    propTween = !jQuery.isEmptyObject(props);
    if (!propTween && jQuery.isEmptyObject(orig)) {
      return;
    }
    if (isBox && elem.nodeType === 1) {
      opts.overflow = [style.overflow, style.overflowX, style.overflowY];
      restoreDisplay = dataShow && dataShow.display;
      if (restoreDisplay == null) {
        restoreDisplay = dataPriv.get(elem, "display");
      }
      display = jQuery.css(elem, "display");
      if (display === "none") {
        if (restoreDisplay) {
          display = restoreDisplay;
        } else {
          showHide([elem], true);
          restoreDisplay = elem.style.display || restoreDisplay;
          display = jQuery.css(elem, "display");
          showHide([elem]);
        }
      }
      if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
        if (jQuery.css(elem, "float") === "none") {
          if (!propTween) {
            anim.done(function () {
              style.display = restoreDisplay;
            });
            if (restoreDisplay == null) {
              display = style.display;
              restoreDisplay = display === "none" ? "" : display;
            }
          }
          style.display = "inline-block";
        }
      }
    }
    if (opts.overflow) {
      style.overflow = "hidden";
      anim.always(function () {
        style.overflow = opts.overflow[0];
        style.overflowX = opts.overflow[1];
        style.overflowY = opts.overflow[2];
      });
    }
    propTween = false;
    for (prop in orig) {
      if (!propTween) {
        if (dataShow) {
          if (("hidden" in dataShow)) {
            hidden = dataShow.hidden;
          }
        } else {
          dataShow = dataPriv.access(elem, "fxshow", {
            display: restoreDisplay
          });
        }
        if (toggle) {
          dataShow.hidden = !hidden;
        }
        if (hidden) {
          showHide([elem], true);
        }
        anim.done(function () {
          if (!hidden) {
            showHide([elem]);
          }
          dataPriv.remove(elem, "fxshow");
          for (prop in orig) {
            jQuery.style(elem, prop, orig[prop]);
          }
        });
      }
      propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
      if (!((prop in dataShow))) {
        dataShow[prop] = propTween.start;
        if (hidden) {
          propTween.end = propTween.start;
          propTween.start = 0;
        }
      }
    }
  }
  function propFilter(props, specialEasing) {
    var index, name, easing, value, hooks;
    for (index in props) {
      name = camelCase(index);
      easing = specialEasing[name];
      value = props[index];
      if (Array.isArray(value)) {
        easing = value[1];
        value = props[index] = value[0];
      }
      if (index !== name) {
        props[name] = value;
        delete props[index];
      }
      hooks = jQuery.cssHooks[name];
      if (hooks && ("expand" in hooks)) {
        value = hooks.expand(value);
        delete props[name];
        for (index in value) {
          if (!((index in props))) {
            props[index] = value[index];
            specialEasing[index] = easing;
          }
        }
      } else {
        specialEasing[name] = easing;
      }
    }
  }
  function Animation(elem, properties, options) {
    var result, stopped, index = 0, length = Animation.prefilters.length, deferred = jQuery.Deferred().always(function () {
      delete tick.elem;
    }), tick = function () {
      if (stopped) {
        return false;
      }
      var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index = 0, length = animation.tweens.length;
      for (; index < length; index++) {
        animation.tweens[index].run(percent);
      }
      deferred.notifyWith(elem, [animation, percent, remaining]);
      if (percent < 1 && length) {
        return remaining;
      }
      if (!length) {
        deferred.notifyWith(elem, [animation, 1, 0]);
      }
      deferred.resolveWith(elem, [animation]);
      return false;
    }, animation = deferred.promise({
      elem: elem,
      props: jQuery.extend({}, properties),
      opts: jQuery.extend(true, {
        specialEasing: {},
        easing: jQuery.easing._default
      }, options),
      originalProperties: properties,
      originalOptions: options,
      startTime: fxNow || createFxNow(),
      duration: options.duration,
      tweens: [],
      createTween: function (prop, end) {
        var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
        animation.tweens.push(tween);
        return tween;
      },
      stop: function (gotoEnd) {
        var index = 0, length = gotoEnd ? animation.tweens.length : 0;
        if (stopped) {
          return this;
        }
        stopped = true;
        for (; index < length; index++) {
          animation.tweens[index].run(1);
        }
        if (gotoEnd) {
          deferred.notifyWith(elem, [animation, 1, 0]);
          deferred.resolveWith(elem, [animation, gotoEnd]);
        } else {
          deferred.rejectWith(elem, [animation, gotoEnd]);
        }
        return this;
      }
    }), props = animation.props;
    propFilter(props, animation.opts.specialEasing);
    for (; index < length; index++) {
      result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
      if (result) {
        if (isFunction(result.stop)) {
          jQuery._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
        }
        return result;
      }
    }
    jQuery.map(props, createTween, animation);
    if (isFunction(animation.opts.start)) {
      animation.opts.start.call(elem, animation);
    }
    animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    jQuery.fx.timer(jQuery.extend(tick, {
      elem: elem,
      anim: animation,
      queue: animation.opts.queue
    }));
    return animation;
  }
  jQuery.Animation = jQuery.extend(Animation, {
    tweeners: {
      "*": [function (prop, value) {
        var tween = this.createTween(prop, value);
        adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
        return tween;
      }]
    },
    tweener: function (props, callback) {
      if (isFunction(props)) {
        callback = props;
        props = ["*"];
      } else {
        props = props.match(rnothtmlwhite);
      }
      var prop, index = 0, length = props.length;
      for (; index < length; index++) {
        prop = props[index];
        Animation.tweeners[prop] = Animation.tweeners[prop] || [];
        Animation.tweeners[prop].unshift(callback);
      }
    },
    prefilters: [defaultPrefilter],
    prefilter: function (callback, prepend) {
      if (prepend) {
        Animation.prefilters.unshift(callback);
      } else {
        Animation.prefilters.push(callback);
      }
    }
  });
  jQuery.speed = function (speed, easing, fn) {
    var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
      complete: fn || !fn && easing || isFunction(speed) && speed,
      duration: speed,
      easing: fn && easing || easing && !isFunction(easing) && easing
    };
    if (jQuery.fx.off) {
      opt.duration = 0;
    } else {
      if (typeof opt.duration !== "number") {
        if ((opt.duration in jQuery.fx.speeds)) {
          opt.duration = jQuery.fx.speeds[opt.duration];
        } else {
          opt.duration = jQuery.fx.speeds._default;
        }
      }
    }
    if (opt.queue == null || opt.queue === true) {
      opt.queue = "fx";
    }
    opt.old = opt.complete;
    opt.complete = function () {
      if (isFunction(opt.old)) {
        opt.old.call(this);
      }
      if (opt.queue) {
        jQuery.dequeue(this, opt.queue);
      }
    };
    return opt;
  };
  jQuery.fn.extend({
    fadeTo: function (speed, to, easing, callback) {
      return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({
        opacity: to
      }, speed, easing, callback);
    },
    animate: function (prop, speed, easing, callback) {
      var empty = jQuery.isEmptyObject(prop), optall = jQuery.speed(speed, easing, callback), doAnimation = function () {
        var anim = Animation(this, jQuery.extend({}, prop), optall);
        if (empty || dataPriv.get(this, "finish")) {
          anim.stop(true);
        }
      };
      doAnimation.finish = doAnimation;
      return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
    },
    stop: function (type, clearQueue, gotoEnd) {
      var stopQueue = function (hooks) {
        var stop = hooks.stop;
        delete hooks.stop;
        stop(gotoEnd);
      };
      if (typeof type !== "string") {
        gotoEnd = clearQueue;
        clearQueue = type;
        type = undefined;
      }
      if (clearQueue) {
        this.queue(type || "fx", []);
      }
      return this.each(function () {
        var dequeue = true, index = type != null && type + "queueHooks", timers = jQuery.timers, data = dataPriv.get(this);
        if (index) {
          if (data[index] && data[index].stop) {
            stopQueue(data[index]);
          }
        } else {
          for (index in data) {
            if (data[index] && data[index].stop && rrun.test(index)) {
              stopQueue(data[index]);
            }
          }
        }
        for (index = timers.length; index--; ) {
          if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
            timers[index].anim.stop(gotoEnd);
            dequeue = false;
            timers.splice(index, 1);
          }
        }
        if (dequeue || !gotoEnd) {
          jQuery.dequeue(this, type);
        }
      });
    },
    finish: function (type) {
      if (type !== false) {
        type = type || "fx";
      }
      return this.each(function () {
        var index, data = dataPriv.get(this), queue = data[type + "queue"], hooks = data[type + "queueHooks"], timers = jQuery.timers, length = queue ? queue.length : 0;
        data.finish = true;
        jQuery.queue(this, type, []);
        if (hooks && hooks.stop) {
          hooks.stop.call(this, true);
        }
        for (index = timers.length; index--; ) {
          if (timers[index].elem === this && timers[index].queue === type) {
            timers[index].anim.stop(true);
            timers.splice(index, 1);
          }
        }
        for (index = 0; index < length; index++) {
          if (queue[index] && queue[index].finish) {
            queue[index].finish.call(this);
          }
        }
        delete data.finish;
      });
    }
  });
  jQuery.each(["toggle", "show", "hide"], function (_i, name) {
    var cssFn = jQuery.fn[name];
    jQuery.fn[name] = function (speed, easing, callback) {
      return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
    };
  });
  jQuery.each({
    slideDown: genFx("show"),
    slideUp: genFx("hide"),
    slideToggle: genFx("toggle"),
    fadeIn: {
      opacity: "show"
    },
    fadeOut: {
      opacity: "hide"
    },
    fadeToggle: {
      opacity: "toggle"
    }
  }, function (name, props) {
    jQuery.fn[name] = function (speed, easing, callback) {
      return this.animate(props, speed, easing, callback);
    };
  });
  jQuery.timers = [];
  jQuery.fx.tick = function () {
    var timer, i = 0, timers = jQuery.timers;
    fxNow = Date.now();
    for (; i < timers.length; i++) {
      timer = timers[i];
      if (!timer() && timers[i] === timer) {
        timers.splice(i--, 1);
      }
    }
    if (!timers.length) {
      jQuery.fx.stop();
    }
    fxNow = undefined;
  };
  jQuery.fx.timer = function (timer) {
    jQuery.timers.push(timer);
    jQuery.fx.start();
  };
  jQuery.fx.interval = 13;
  jQuery.fx.start = function () {
    if (inProgress) {
      return;
    }
    inProgress = true;
    schedule();
  };
  jQuery.fx.stop = function () {
    inProgress = null;
  };
  jQuery.fx.speeds = {
    slow: 600,
    fast: 200,
    _default: 400
  };
  jQuery.fn.delay = function (time, type) {
    time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
    type = type || "fx";
    return this.queue(type, function (next, hooks) {
      var timeout = window.setTimeout(next, time);
      hooks.stop = function () {
        window.clearTimeout(timeout);
      };
    });
  };
  (function () {
    var input = document.createElement("input"), select = document.createElement("select"), opt = select.appendChild(document.createElement("option"));
    input.type = "checkbox";
    support.checkOn = input.value !== "";
    support.optSelected = opt.selected;
    input = document.createElement("input");
    input.value = "t";
    input.type = "radio";
    support.radioValue = input.value === "t";
  })();
  var boolHook, attrHandle = jQuery.expr.attrHandle;
  jQuery.fn.extend({
    attr: function (name, value) {
      return access(this, jQuery.attr, name, value, arguments.length > 1);
    },
    removeAttr: function (name) {
      return this.each(function () {
        jQuery.removeAttr(this, name);
      });
    }
  });
  jQuery.extend({
    attr: function (elem, name, value) {
      var ret, hooks, nType = elem.nodeType;
      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      }
      if (typeof elem.getAttribute === "undefined") {
        return jQuery.prop(elem, name, value);
      }
      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
      }
      if (value !== undefined) {
        if (value === null) {
          jQuery.removeAttr(elem, name);
          return;
        }
        if (hooks && ("set" in hooks) && (ret = hooks.set(elem, value, name)) !== undefined) {
          return ret;
        }
        elem.setAttribute(name, value + "");
        return value;
      }
      if (hooks && ("get" in hooks) && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }
      ret = jQuery.find.attr(elem, name);
      return ret == null ? undefined : ret;
    },
    attrHooks: {
      type: {
        set: function (elem, value) {
          if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
            var val = elem.value;
            elem.setAttribute("type", value);
            if (val) {
              elem.value = val;
            }
            return value;
          }
        }
      }
    },
    removeAttr: function (elem, value) {
      var name, i = 0, attrNames = value && value.match(rnothtmlwhite);
      if (attrNames && elem.nodeType === 1) {
        while (name = attrNames[i++]) {
          elem.removeAttribute(name);
        }
      }
    }
  });
  boolHook = {
    set: function (elem, value, name) {
      if (value === false) {
        jQuery.removeAttr(elem, name);
      } else {
        elem.setAttribute(name, name);
      }
      return name;
    }
  };
  jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function (_i, name) {
    var getter = attrHandle[name] || jQuery.find.attr;
    attrHandle[name] = function (elem, name, isXML) {
      var ret, handle, lowercaseName = name.toLowerCase();
      if (!isXML) {
        handle = attrHandle[lowercaseName];
        attrHandle[lowercaseName] = ret;
        ret = getter(elem, name, isXML) != null ? lowercaseName : null;
        attrHandle[lowercaseName] = handle;
      }
      return ret;
    };
  });
  var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
  jQuery.fn.extend({
    prop: function (name, value) {
      return access(this, jQuery.prop, name, value, arguments.length > 1);
    },
    removeProp: function (name) {
      return this.each(function () {
        delete this[jQuery.propFix[name] || name];
      });
    }
  });
  jQuery.extend({
    prop: function (elem, name, value) {
      var ret, hooks, nType = elem.nodeType;
      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      }
      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        name = jQuery.propFix[name] || name;
        hooks = jQuery.propHooks[name];
      }
      if (value !== undefined) {
        if (hooks && ("set" in hooks) && (ret = hooks.set(elem, value, name)) !== undefined) {
          return ret;
        }
        return elem[name] = value;
      }
      if (hooks && ("get" in hooks) && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }
      return elem[name];
    },
    propHooks: {
      tabIndex: {
        get: function (elem) {
          var tabindex = jQuery.find.attr(elem, "tabindex");
          if (tabindex) {
            return parseInt(tabindex, 10);
          }
          if (rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href) {
            return 0;
          }
          return -1;
        }
      }
    },
    propFix: {
      "for": "htmlFor",
      "class": "className"
    }
  });
  if (!support.optSelected) {
    jQuery.propHooks.selected = {
      get: function (elem) {
        var parent = elem.parentNode;
        if (parent && parent.parentNode) {
          parent.parentNode.selectedIndex;
        }
        return null;
      },
      set: function (elem) {
        var parent = elem.parentNode;
        if (parent) {
          parent.selectedIndex;
          if (parent.parentNode) {
            parent.parentNode.selectedIndex;
          }
        }
      }
    };
  }
  jQuery.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
    jQuery.propFix[this.toLowerCase()] = this;
  });
  function stripAndCollapse(value) {
    var tokens = value.match(rnothtmlwhite) || [];
    return tokens.join(" ");
  }
  function getClass(elem) {
    return elem.getAttribute && elem.getAttribute("class") || "";
  }
  function classesToArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      return value.match(rnothtmlwhite) || [];
    }
    return [];
  }
  jQuery.fn.extend({
    addClass: function (value) {
      var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
      if (isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).addClass(value.call(this, j, getClass(this)));
        });
      }
      classes = classesToArray(value);
      if (classes.length) {
        while (elem = this[i++]) {
          curValue = getClass(elem);
          cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
          if (cur) {
            j = 0;
            while (clazz = classes[j++]) {
              if (cur.indexOf(" " + clazz + " ") < 0) {
                cur += clazz + " ";
              }
            }
            finalValue = stripAndCollapse(cur);
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }
      return this;
    },
    removeClass: function (value) {
      var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
      if (isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).removeClass(value.call(this, j, getClass(this)));
        });
      }
      if (!arguments.length) {
        return this.attr("class", "");
      }
      classes = classesToArray(value);
      if (classes.length) {
        while (elem = this[i++]) {
          curValue = getClass(elem);
          cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
          if (cur) {
            j = 0;
            while (clazz = classes[j++]) {
              while (cur.indexOf(" " + clazz + " ") > -1) {
                cur = cur.replace(" " + clazz + " ", " ");
              }
            }
            finalValue = stripAndCollapse(cur);
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }
      return this;
    },
    toggleClass: function (value, stateVal) {
      var type = typeof value, isValidValue = type === "string" || Array.isArray(value);
      if (typeof stateVal === "boolean" && isValidValue) {
        return stateVal ? this.addClass(value) : this.removeClass(value);
      }
      if (isFunction(value)) {
        return this.each(function (i) {
          jQuery(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal);
        });
      }
      return this.each(function () {
        var className, i, self, classNames;
        if (isValidValue) {
          i = 0;
          self = jQuery(this);
          classNames = classesToArray(value);
          while (className = classNames[i++]) {
            if (self.hasClass(className)) {
              self.removeClass(className);
            } else {
              self.addClass(className);
            }
          }
        } else if (value === undefined || type === "boolean") {
          className = getClass(this);
          if (className) {
            dataPriv.set(this, "__className__", className);
          }
          if (this.setAttribute) {
            this.setAttribute("class", className || value === false ? "" : dataPriv.get(this, "__className__") || "");
          }
        }
      });
    },
    hasClass: function (selector) {
      var className, elem, i = 0;
      className = " " + selector + " ";
      while (elem = this[i++]) {
        if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
          return true;
        }
      }
      return false;
    }
  });
  var rreturn = /\r/g;
  jQuery.fn.extend({
    val: function (value) {
      var hooks, ret, valueIsFunction, elem = this[0];
      if (!arguments.length) {
        if (elem) {
          hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
          if (hooks && ("get" in hooks) && (ret = hooks.get(elem, "value")) !== undefined) {
            return ret;
          }
          ret = elem.value;
          if (typeof ret === "string") {
            return ret.replace(rreturn, "");
          }
          return ret == null ? "" : ret;
        }
        return;
      }
      valueIsFunction = isFunction(value);
      return this.each(function (i) {
        var val;
        if (this.nodeType !== 1) {
          return;
        }
        if (valueIsFunction) {
          val = value.call(this, i, jQuery(this).val());
        } else {
          val = value;
        }
        if (val == null) {
          val = "";
        } else if (typeof val === "number") {
          val += "";
        } else if (Array.isArray(val)) {
          val = jQuery.map(val, function (value) {
            return value == null ? "" : value + "";
          });
        }
        hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
        if (!hooks || !(("set" in hooks)) || hooks.set(this, val, "value") === undefined) {
          this.value = val;
        }
      });
    }
  });
  jQuery.extend({
    valHooks: {
      option: {
        get: function (elem) {
          var val = jQuery.find.attr(elem, "value");
          return val != null ? val : stripAndCollapse(jQuery.text(elem));
        }
      },
      select: {
        get: function (elem) {
          var value, option, i, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one", values = one ? null : [], max = one ? index + 1 : options.length;
          if (index < 0) {
            i = max;
          } else {
            i = one ? index : 0;
          }
          for (; i < max; i++) {
            option = options[i];
            if ((option.selected || i === index) && !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {
              value = jQuery(option).val();
              if (one) {
                return value;
              }
              values.push(value);
            }
          }
          return values;
        },
        set: function (elem, value) {
          var optionSet, option, options = elem.options, values = jQuery.makeArray(value), i = options.length;
          while (i--) {
            option = options[i];
            if (option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1) {
              optionSet = true;
            }
          }
          if (!optionSet) {
            elem.selectedIndex = -1;
          }
          return values;
        }
      }
    }
  });
  jQuery.each(["radio", "checkbox"], function () {
    jQuery.valHooks[this] = {
      set: function (elem, value) {
        if (Array.isArray(value)) {
          return elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1;
        }
      }
    };
    if (!support.checkOn) {
      jQuery.valHooks[this].get = function (elem) {
        return elem.getAttribute("value") === null ? "on" : elem.value;
      };
    }
  });
  support.focusin = ("onfocusin" in window);
  var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, stopPropagationCallback = function (e) {
    e.stopPropagation();
  };
  jQuery.extend(jQuery.event, {
    trigger: function (event, data, elem, onlyHandlers) {
      var i, cur, tmp, bubbleType, ontype, handle, special, lastElement, eventPath = [elem || document], type = hasOwn.call(event, "type") ? event.type : event, namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
      cur = lastElement = tmp = elem = elem || document;
      if (elem.nodeType === 3 || elem.nodeType === 8) {
        return;
      }
      if (rfocusMorph.test(type + jQuery.event.triggered)) {
        return;
      }
      if (type.indexOf(".") > -1) {
        namespaces = type.split(".");
        type = namespaces.shift();
        namespaces.sort();
      }
      ontype = type.indexOf(":") < 0 && "on" + type;
      event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);
      event.isTrigger = onlyHandlers ? 2 : 3;
      event.namespace = namespaces.join(".");
      event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
      event.result = undefined;
      if (!event.target) {
        event.target = elem;
      }
      data = data == null ? [event] : jQuery.makeArray(data, [event]);
      special = jQuery.event.special[type] || ({});
      if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
        return;
      }
      if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
        bubbleType = special.delegateType || type;
        if (!rfocusMorph.test(bubbleType + type)) {
          cur = cur.parentNode;
        }
        for (; cur; cur = cur.parentNode) {
          eventPath.push(cur);
          tmp = cur;
        }
        if (tmp === (elem.ownerDocument || document)) {
          eventPath.push(tmp.defaultView || tmp.parentWindow || window);
        }
      }
      i = 0;
      while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
        lastElement = cur;
        event.type = i > 1 ? bubbleType : special.bindType || type;
        handle = (dataPriv.get(cur, "events") || Object.create(null))[event.type] && dataPriv.get(cur, "handle");
        if (handle) {
          handle.apply(cur, data);
        }
        handle = ontype && cur[ontype];
        if (handle && handle.apply && acceptData(cur)) {
          event.result = handle.apply(cur, data);
          if (event.result === false) {
            event.preventDefault();
          }
        }
      }
      event.type = type;
      if (!onlyHandlers && !event.isDefaultPrevented()) {
        if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
          if (ontype && isFunction(elem[type]) && !isWindow(elem)) {
            tmp = elem[ontype];
            if (tmp) {
              elem[ontype] = null;
            }
            jQuery.event.triggered = type;
            if (event.isPropagationStopped()) {
              lastElement.addEventListener(type, stopPropagationCallback);
            }
            elem[type]();
            if (event.isPropagationStopped()) {
              lastElement.removeEventListener(type, stopPropagationCallback);
            }
            jQuery.event.triggered = undefined;
            if (tmp) {
              elem[ontype] = tmp;
            }
          }
        }
      }
      return event.result;
    },
    simulate: function (type, elem, event) {
      var e = jQuery.extend(new jQuery.Event(), event, {
        type: type,
        isSimulated: true
      });
      jQuery.event.trigger(e, null, elem);
    }
  });
  jQuery.fn.extend({
    trigger: function (type, data) {
      return this.each(function () {
        jQuery.event.trigger(type, data, this);
      });
    },
    triggerHandler: function (type, data) {
      var elem = this[0];
      if (elem) {
        return jQuery.event.trigger(type, data, elem, true);
      }
    }
  });
  if (!support.focusin) {
    jQuery.each({
      focus: "focusin",
      blur: "focusout"
    }, function (orig, fix) {
      var handler = function (event) {
        jQuery.event.simulate(fix, event.target, jQuery.event.fix(event));
      };
      jQuery.event.special[fix] = {
        setup: function () {
          var doc = this.ownerDocument || this.document || this, attaches = dataPriv.access(doc, fix);
          if (!attaches) {
            doc.addEventListener(orig, handler, true);
          }
          dataPriv.access(doc, fix, (attaches || 0) + 1);
        },
        teardown: function () {
          var doc = this.ownerDocument || this.document || this, attaches = dataPriv.access(doc, fix) - 1;
          if (!attaches) {
            doc.removeEventListener(orig, handler, true);
            dataPriv.remove(doc, fix);
          } else {
            dataPriv.access(doc, fix, attaches);
          }
        }
      };
    });
  }
  var location = window.location;
  var nonce = {
    guid: Date.now()
  };
  var rquery = /\?/;
  jQuery.parseXML = function (data) {
    var xml, parserErrorElem;
    if (!data || typeof data !== "string") {
      return null;
    }
    try {
      xml = new window.DOMParser().parseFromString(data, "text/xml");
    } catch (e) {}
    parserErrorElem = xml && xml.getElementsByTagName("parsererror")[0];
    if (!xml || parserErrorElem) {
      jQuery.error("Invalid XML: " + (parserErrorElem ? jQuery.map(parserErrorElem.childNodes, function (el) {
        return el.textContent;
      }).join("\n") : data));
    }
    return xml;
  };
  var rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
  function buildParams(prefix, obj, traditional, add) {
    var name;
    if (Array.isArray(obj)) {
      jQuery.each(obj, function (i, v) {
        if (traditional || rbracket.test(prefix)) {
          add(prefix, v);
        } else {
          buildParams(prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]", v, traditional, add);
        }
      });
    } else if (!traditional && toType(obj) === "object") {
      for (name in obj) {
        buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
      }
    } else {
      add(prefix, obj);
    }
  }
  jQuery.param = function (a, traditional) {
    var prefix, s = [], add = function (key, valueOrFunction) {
      var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
      s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
    };
    if (a == null) {
      return "";
    }
    if (Array.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {
      jQuery.each(a, function () {
        add(this.name, this.value);
      });
    } else {
      for (prefix in a) {
        buildParams(prefix, a[prefix], traditional, add);
      }
    }
    return s.join("&");
  };
  jQuery.fn.extend({
    serialize: function () {
      return jQuery.param(this.serializeArray());
    },
    serializeArray: function () {
      return this.map(function () {
        var elements = jQuery.prop(this, "elements");
        return elements ? jQuery.makeArray(elements) : this;
      }).filter(function () {
        var type = this.type;
        return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
      }).map(function (_i, elem) {
        var val = jQuery(this).val();
        if (val == null) {
          return null;
        }
        if (Array.isArray(val)) {
          return jQuery.map(val, function (val) {
            return {
              name: elem.name,
              value: val.replace(rCRLF, "\r\n")
            };
          });
        }
        return {
          name: elem.name,
          value: val.replace(rCRLF, "\r\n")
        };
      }).get();
    }
  });
  var r20 = /%20/g, rhash = /#.*$/, rantiCache = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, prefilters = {}, transports = {}, allTypes = ("*/").concat("*"), originAnchor = document.createElement("a");
  originAnchor.href = location.href;
  function addToPrefiltersOrTransports(structure) {
    return function (dataTypeExpression, func) {
      if (typeof dataTypeExpression !== "string") {
        func = dataTypeExpression;
        dataTypeExpression = "*";
      }
      var dataType, i = 0, dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
      if (isFunction(func)) {
        while (dataType = dataTypes[i++]) {
          if (dataType[0] === "+") {
            dataType = dataType.slice(1) || "*";
            (structure[dataType] = structure[dataType] || []).unshift(func);
          } else {
            (structure[dataType] = structure[dataType] || []).push(func);
          }
        }
      }
    };
  }
  function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
    var inspected = {}, seekingTransport = structure === transports;
    function inspect(dataType) {
      var selected;
      inspected[dataType] = true;
      jQuery.each(structure[dataType] || [], function (_, prefilterOrFactory) {
        var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
        if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
          options.dataTypes.unshift(dataTypeOrTransport);
          inspect(dataTypeOrTransport);
          return false;
        } else if (seekingTransport) {
          return !(selected = dataTypeOrTransport);
        }
      });
      return selected;
    }
    return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
  }
  function ajaxExtend(target, src) {
    var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || ({});
    for (key in src) {
      if (src[key] !== undefined) {
        (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
      }
    }
    if (deep) {
      jQuery.extend(true, target, deep);
    }
    return target;
  }
  function ajaxHandleResponses(s, jqXHR, responses) {
    var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes;
    while (dataTypes[0] === "*") {
      dataTypes.shift();
      if (ct === undefined) {
        ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
      }
    }
    if (ct) {
      for (type in contents) {
        if (contents[type] && contents[type].test(ct)) {
          dataTypes.unshift(type);
          break;
        }
      }
    }
    if ((dataTypes[0] in responses)) {
      finalDataType = dataTypes[0];
    } else {
      for (type in responses) {
        if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
          finalDataType = type;
          break;
        }
        if (!firstDataType) {
          firstDataType = type;
        }
      }
      finalDataType = finalDataType || firstDataType;
    }
    if (finalDataType) {
      if (finalDataType !== dataTypes[0]) {
        dataTypes.unshift(finalDataType);
      }
      return responses[finalDataType];
    }
  }
  function ajaxConvert(s, response, jqXHR, isSuccess) {
    var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
    if (dataTypes[1]) {
      for (conv in s.converters) {
        converters[conv.toLowerCase()] = s.converters[conv];
      }
    }
    current = dataTypes.shift();
    while (current) {
      if (s.responseFields[current]) {
        jqXHR[s.responseFields[current]] = response;
      }
      if (!prev && isSuccess && s.dataFilter) {
        response = s.dataFilter(response, s.dataType);
      }
      prev = current;
      current = dataTypes.shift();
      if (current) {
        if (current === "*") {
          current = prev;
        } else if (prev !== "*" && prev !== current) {
          conv = converters[prev + " " + current] || converters["* " + current];
          if (!conv) {
            for (conv2 in converters) {
              tmp = conv2.split(" ");
              if (tmp[1] === current) {
                conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                if (conv) {
                  if (conv === true) {
                    conv = converters[conv2];
                  } else if (converters[conv2] !== true) {
                    current = tmp[0];
                    dataTypes.unshift(tmp[1]);
                  }
                  break;
                }
              }
            }
          }
          if (conv !== true) {
            if (conv && s.throws) {
              response = conv(response);
            } else {
              try {
                response = conv(response);
              } catch (e) {
                return {
                  state: "parsererror",
                  error: conv ? e : "No conversion from " + prev + " to " + current
                };
              }
            }
          }
        }
      }
    }
    return {
      state: "success",
      data: response
    };
  }
  jQuery.extend({
    active: 0,
    lastModified: {},
    etag: {},
    ajaxSettings: {
      url: location.href,
      type: "GET",
      isLocal: rlocalProtocol.test(location.protocol),
      global: true,
      processData: true,
      async: true,
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      accepts: {
        "*": allTypes,
        text: "text/plain",
        html: "text/html",
        xml: "application/xml, text/xml",
        json: "application/json, text/javascript"
      },
      contents: {
        xml: /\bxml\b/,
        html: /\bhtml/,
        json: /\bjson\b/
      },
      responseFields: {
        xml: "responseXML",
        text: "responseText",
        json: "responseJSON"
      },
      converters: {
        "* text": String,
        "text html": true,
        "text json": JSON.parse,
        "text xml": jQuery.parseXML
      },
      flatOptions: {
        url: true,
        context: true
      }
    },
    ajaxSetup: function (target, settings) {
      return settings ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) : ajaxExtend(jQuery.ajaxSettings, target);
    },
    ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
    ajaxTransport: addToPrefiltersOrTransports(transports),
    ajax: function (url, options) {
      if (typeof url === "object") {
        options = url;
        url = undefined;
      }
      options = options || ({});
      var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, completed, fireGlobals, i, uncached, s = jQuery.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event, deferred = jQuery.Deferred(), completeDeferred = jQuery.Callbacks("once memory"), statusCode = s.statusCode || ({}), requestHeaders = {}, requestHeadersNames = {}, strAbort = "canceled", jqXHR = {
        readyState: 0,
        getResponseHeader: function (key) {
          var match;
          if (completed) {
            if (!responseHeaders) {
              responseHeaders = {};
              while (match = rheaders.exec(responseHeadersString)) {
                responseHeaders[match[1].toLowerCase() + " "] = (responseHeaders[match[1].toLowerCase() + " "] || []).concat(match[2]);
              }
            }
            match = responseHeaders[key.toLowerCase() + " "];
          }
          return match == null ? null : match.join(", ");
        },
        getAllResponseHeaders: function () {
          return completed ? responseHeadersString : null;
        },
        setRequestHeader: function (name, value) {
          if (completed == null) {
            name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
            requestHeaders[name] = value;
          }
          return this;
        },
        overrideMimeType: function (type) {
          if (completed == null) {
            s.mimeType = type;
          }
          return this;
        },
        statusCode: function (map) {
          var code;
          if (map) {
            if (completed) {
              jqXHR.always(map[jqXHR.status]);
            } else {
              for (code in map) {
                statusCode[code] = [statusCode[code], map[code]];
              }
            }
          }
          return this;
        },
        abort: function (statusText) {
          var finalText = statusText || strAbort;
          if (transport) {
            transport.abort(finalText);
          }
          done(0, finalText);
          return this;
        }
      };
      deferred.promise(jqXHR);
      s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");
      s.type = options.method || options.type || s.method || s.type;
      s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
      if (s.crossDomain == null) {
        urlAnchor = document.createElement("a");
        try {
          urlAnchor.href = s.url;
          urlAnchor.href = urlAnchor.href;
          s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
        } catch (e) {
          s.crossDomain = true;
        }
      }
      if (s.data && s.processData && typeof s.data !== "string") {
        s.data = jQuery.param(s.data, s.traditional);
      }
      inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
      if (completed) {
        return jqXHR;
      }
      fireGlobals = jQuery.event && s.global;
      if (fireGlobals && jQuery.active++ === 0) {
        jQuery.event.trigger("ajaxStart");
      }
      s.type = s.type.toUpperCase();
      s.hasContent = !rnoContent.test(s.type);
      cacheURL = s.url.replace(rhash, "");
      if (!s.hasContent) {
        uncached = s.url.slice(cacheURL.length);
        if (s.data && (s.processData || typeof s.data === "string")) {
          cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
          delete s.data;
        }
        if (s.cache === false) {
          cacheURL = cacheURL.replace(rantiCache, "$1");
          uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce.guid++ + uncached;
        }
        s.url = cacheURL + uncached;
      } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
        s.data = s.data.replace(r20, "+");
      }
      if (s.ifModified) {
        if (jQuery.lastModified[cacheURL]) {
          jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
        }
        if (jQuery.etag[cacheURL]) {
          jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
        }
      }
      if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
        jqXHR.setRequestHeader("Content-Type", s.contentType);
      }
      jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
      for (i in s.headers) {
        jqXHR.setRequestHeader(i, s.headers[i]);
      }
      if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) {
        return jqXHR.abort();
      }
      strAbort = "abort";
      completeDeferred.add(s.complete);
      jqXHR.done(s.success);
      jqXHR.fail(s.error);
      transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
      if (!transport) {
        done(-1, "No Transport");
      } else {
        jqXHR.readyState = 1;
        if (fireGlobals) {
          globalEventContext.trigger("ajaxSend", [jqXHR, s]);
        }
        if (completed) {
          return jqXHR;
        }
        if (s.async && s.timeout > 0) {
          timeoutTimer = window.setTimeout(function () {
            jqXHR.abort("timeout");
          }, s.timeout);
        }
        try {
          completed = false;
          transport.send(requestHeaders, done);
        } catch (e) {
          if (completed) {
            throw e;
          }
          done(-1, e);
        }
      }
      function done(status, nativeStatusText, responses, headers) {
        var isSuccess, success, error, response, modified, statusText = nativeStatusText;
        if (completed) {
          return;
        }
        completed = true;
        if (timeoutTimer) {
          window.clearTimeout(timeoutTimer);
        }
        transport = undefined;
        responseHeadersString = headers || "";
        jqXHR.readyState = status > 0 ? 4 : 0;
        isSuccess = status >= 200 && status < 300 || status === 304;
        if (responses) {
          response = ajaxHandleResponses(s, jqXHR, responses);
        }
        if (!isSuccess && jQuery.inArray("script", s.dataTypes) > -1 && jQuery.inArray("json", s.dataTypes) < 0) {
          s.converters["text script"] = function () {};
        }
        response = ajaxConvert(s, response, jqXHR, isSuccess);
        if (isSuccess) {
          if (s.ifModified) {
            modified = jqXHR.getResponseHeader("Last-Modified");
            if (modified) {
              jQuery.lastModified[cacheURL] = modified;
            }
            modified = jqXHR.getResponseHeader("etag");
            if (modified) {
              jQuery.etag[cacheURL] = modified;
            }
          }
          if (status === 204 || s.type === "HEAD") {
            statusText = "nocontent";
          } else if (status === 304) {
            statusText = "notmodified";
          } else {
            statusText = response.state;
            success = response.data;
            error = response.error;
            isSuccess = !error;
          }
        } else {
          error = statusText;
          if (status || !statusText) {
            statusText = "error";
            if (status < 0) {
              status = 0;
            }
          }
        }
        jqXHR.status = status;
        jqXHR.statusText = (nativeStatusText || statusText) + "";
        if (isSuccess) {
          deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
        } else {
          deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
        }
        jqXHR.statusCode(statusCode);
        statusCode = undefined;
        if (fireGlobals) {
          globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [jqXHR, s, isSuccess ? success : error]);
        }
        completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
        if (fireGlobals) {
          globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
          if (!--jQuery.active) {
            jQuery.event.trigger("ajaxStop");
          }
        }
      }
      return jqXHR;
    },
    getJSON: function (url, data, callback) {
      return jQuery.get(url, data, callback, "json");
    },
    getScript: function (url, callback) {
      return jQuery.get(url, undefined, callback, "script");
    }
  });
  jQuery.each(["get", "post"], function (_i, method) {
    jQuery[method] = function (url, data, callback, type) {
      if (isFunction(data)) {
        type = type || callback;
        callback = data;
        data = undefined;
      }
      return jQuery.ajax(jQuery.extend({
        url: url,
        type: method,
        dataType: type,
        data: data,
        success: callback
      }, jQuery.isPlainObject(url) && url));
    };
  });
  jQuery.ajaxPrefilter(function (s) {
    var i;
    for (i in s.headers) {
      if (i.toLowerCase() === "content-type") {
        s.contentType = s.headers[i] || "";
      }
    }
  });
  jQuery._evalUrl = function (url, options, doc) {
    return jQuery.ajax({
      url: url,
      type: "GET",
      dataType: "script",
      cache: true,
      async: false,
      global: false,
      converters: {
        "text script": function () {}
      },
      dataFilter: function (response) {
        jQuery.globalEval(response, options, doc);
      }
    });
  };
  jQuery.fn.extend({
    wrapAll: function (html) {
      var wrap;
      if (this[0]) {
        if (isFunction(html)) {
          html = html.call(this[0]);
        }
        wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);
        if (this[0].parentNode) {
          wrap.insertBefore(this[0]);
        }
        wrap.map(function () {
          var elem = this;
          while (elem.firstElementChild) {
            elem = elem.firstElementChild;
          }
          return elem;
        }).append(this);
      }
      return this;
    },
    wrapInner: function (html) {
      if (isFunction(html)) {
        return this.each(function (i) {
          jQuery(this).wrapInner(html.call(this, i));
        });
      }
      return this.each(function () {
        var self = jQuery(this), contents = self.contents();
        if (contents.length) {
          contents.wrapAll(html);
        } else {
          self.append(html);
        }
      });
    },
    wrap: function (html) {
      var htmlIsFunction = isFunction(html);
      return this.each(function (i) {
        jQuery(this).wrapAll(htmlIsFunction ? html.call(this, i) : html);
      });
    },
    unwrap: function (selector) {
      this.parent(selector).not("body").each(function () {
        jQuery(this).replaceWith(this.childNodes);
      });
      return this;
    }
  });
  jQuery.expr.pseudos.hidden = function (elem) {
    return !jQuery.expr.pseudos.visible(elem);
  };
  jQuery.expr.pseudos.visible = function (elem) {
    return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
  };
  jQuery.ajaxSettings.xhr = function () {
    try {
      return new window.XMLHttpRequest();
    } catch (e) {}
  };
  var xhrSuccessStatus = {
    0: 200,
    1223: 204
  }, xhrSupported = jQuery.ajaxSettings.xhr();
  support.cors = !!xhrSupported && ("withCredentials" in xhrSupported);
  support.ajax = xhrSupported = !!xhrSupported;
  jQuery.ajaxTransport(function (options) {
    var callback, errorCallback;
    if (support.cors || xhrSupported && !options.crossDomain) {
      return {
        send: function (headers, complete) {
          var i, xhr = options.xhr();
          xhr.open(options.type, options.url, options.async, options.username, options.password);
          if (options.xhrFields) {
            for (i in options.xhrFields) {
              xhr[i] = options.xhrFields[i];
            }
          }
          if (options.mimeType && xhr.overrideMimeType) {
            xhr.overrideMimeType(options.mimeType);
          }
          if (!options.crossDomain && !headers["X-Requested-With"]) {
            headers["X-Requested-With"] = "XMLHttpRequest";
          }
          for (i in headers) {
            xhr.setRequestHeader(i, headers[i]);
          }
          callback = function (type) {
            return function () {
              if (callback) {
                callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = xhr.onreadystatechange = null;
                if (type === "abort") {
                  xhr.abort();
                } else if (type === "error") {
                  if (typeof xhr.status !== "number") {
                    complete(0, "error");
                  } else {
                    complete(xhr.status, xhr.statusText);
                  }
                } else {
                  complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText, (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? {
                    binary: xhr.response
                  } : {
                    text: xhr.responseText
                  }, xhr.getAllResponseHeaders());
                }
              }
            };
          };
          xhr.onload = callback();
          errorCallback = xhr.onerror = xhr.ontimeout = callback("error");
          if (xhr.onabort !== undefined) {
            xhr.onabort = errorCallback;
          } else {
            xhr.onreadystatechange = function () {
              if (xhr.readyState === 4) {
                window.setTimeout(function () {
                  if (callback) {
                    errorCallback();
                  }
                });
              }
            };
          }
          callback = callback("abort");
          try {
            xhr.send(options.hasContent && options.data || null);
          } catch (e) {
            if (callback) {
              throw e;
            }
          }
        },
        abort: function () {
          if (callback) {
            callback();
          }
        }
      };
    }
  });
  jQuery.ajaxPrefilter(function (s) {
    if (s.crossDomain) {
      s.contents.script = false;
    }
  });
  jQuery.ajaxSetup({
    accepts: {
      script: "text/javascript, application/javascript, " + "application/ecmascript, application/x-ecmascript"
    },
    contents: {
      script: /\b(?:java|ecma)script\b/
    },
    converters: {
      "text script": function (text) {
        jQuery.globalEval(text);
        return text;
      }
    }
  });
  jQuery.ajaxPrefilter("script", function (s) {
    if (s.cache === undefined) {
      s.cache = false;
    }
    if (s.crossDomain) {
      s.type = "GET";
    }
  });
  jQuery.ajaxTransport("script", function (s) {
    if (s.crossDomain || s.scriptAttrs) {
      var script, callback;
      return {
        send: function (_, complete) {
          script = jQuery("<script>").attr(s.scriptAttrs || ({})).prop({
            charset: s.scriptCharset,
            src: s.url
          }).on("load error", callback = function (evt) {
            script.remove();
            callback = null;
            if (evt) {
              complete(evt.type === "error" ? 404 : 200, evt.type);
            }
          });
          document.head.appendChild(script[0]);
        },
        abort: function () {
          if (callback) {
            callback();
          }
        }
      };
    }
  });
  var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
  jQuery.ajaxSetup({
    jsonp: "callback",
    jsonpCallback: function () {
      var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce.guid++;
      this[callback] = true;
      return callback;
    }
  });
  jQuery.ajaxPrefilter("json jsonp", function (s, originalSettings, jqXHR) {
    var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
    if (jsonProp || s.dataTypes[0] === "jsonp") {
      callbackName = s.jsonpCallback = isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
      if (jsonProp) {
        s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
      } else if (s.jsonp !== false) {
        s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
      }
      s.converters["script json"] = function () {
        if (!responseContainer) {
          jQuery.error(callbackName + " was not called");
        }
        return responseContainer[0];
      };
      s.dataTypes[0] = "json";
      overwritten = window[callbackName];
      window[callbackName] = function () {
        responseContainer = arguments;
      };
      jqXHR.always(function () {
        if (overwritten === undefined) {
          jQuery(window).removeProp(callbackName);
        } else {
          window[callbackName] = overwritten;
        }
        if (s[callbackName]) {
          s.jsonpCallback = originalSettings.jsonpCallback;
          oldCallbacks.push(callbackName);
        }
        if (responseContainer && isFunction(overwritten)) {
          overwritten(responseContainer[0]);
        }
        responseContainer = overwritten = undefined;
      });
      return "script";
    }
  });
  support.createHTMLDocument = (function () {
    var body = document.implementation.createHTMLDocument("").body;
    body.innerHTML = "<form></form><form></form>";
    return body.childNodes.length === 2;
  })();
  jQuery.parseHTML = function (data, context, keepScripts) {
    if (typeof data !== "string") {
      return [];
    }
    if (typeof context === "boolean") {
      keepScripts = context;
      context = false;
    }
    var base, parsed, scripts;
    if (!context) {
      if (support.createHTMLDocument) {
        context = document.implementation.createHTMLDocument("");
        base = context.createElement("base");
        base.href = document.location.href;
        context.head.appendChild(base);
      } else {
        context = document;
      }
    }
    parsed = rsingleTag.exec(data);
    scripts = !keepScripts && [];
    if (parsed) {
      return [context.createElement(parsed[1])];
    }
    parsed = buildFragment([data], context, scripts);
    if (scripts && scripts.length) {
      jQuery(scripts).remove();
    }
    return jQuery.merge([], parsed.childNodes);
  };
  jQuery.fn.load = function (url, params, callback) {
    var selector, type, response, self = this, off = url.indexOf(" ");
    if (off > -1) {
      selector = stripAndCollapse(url.slice(off));
      url = url.slice(0, off);
    }
    if (isFunction(params)) {
      callback = params;
      params = undefined;
    } else if (params && typeof params === "object") {
      type = "POST";
    }
    if (self.length > 0) {
      jQuery.ajax({
        url: url,
        type: type || "GET",
        dataType: "html",
        data: params
      }).done(function (responseText) {
        response = arguments;
        self.html(selector ? jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) : responseText);
      }).always(callback && (function (jqXHR, status) {
        self.each(function () {
          callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
        });
      }));
    }
    return this;
  };
  jQuery.expr.pseudos.animated = function (elem) {
    return jQuery.grep(jQuery.timers, function (fn) {
      return elem === fn.elem;
    }).length;
  };
  jQuery.offset = {
    setOffset: function (elem, options, i) {
      var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery.css(elem, "position"), curElem = jQuery(elem), props = {};
      if (position === "static") {
        elem.style.position = "relative";
      }
      curOffset = curElem.offset();
      curCSSTop = jQuery.css(elem, "top");
      curCSSLeft = jQuery.css(elem, "left");
      calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
      if (calculatePosition) {
        curPosition = curElem.position();
        curTop = curPosition.top;
        curLeft = curPosition.left;
      } else {
        curTop = parseFloat(curCSSTop) || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
      }
      if (isFunction(options)) {
        options = options.call(elem, i, jQuery.extend({}, curOffset));
      }
      if (options.top != null) {
        props.top = options.top - curOffset.top + curTop;
      }
      if (options.left != null) {
        props.left = options.left - curOffset.left + curLeft;
      }
      if (("using" in options)) {
        options.using.call(elem, props);
      } else {
        curElem.css(props);
      }
    }
  };
  jQuery.fn.extend({
    offset: function (options) {
      if (arguments.length) {
        return options === undefined ? this : this.each(function (i) {
          jQuery.offset.setOffset(this, options, i);
        });
      }
      var rect, win, elem = this[0];
      if (!elem) {
        return;
      }
      if (!elem.getClientRects().length) {
        return {
          top: 0,
          left: 0
        };
      }
      rect = elem.getBoundingClientRect();
      win = elem.ownerDocument.defaultView;
      return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset
      };
    },
    position: function () {
      if (!this[0]) {
        return;
      }
      var offsetParent, offset, doc, elem = this[0], parentOffset = {
        top: 0,
        left: 0
      };
      if (jQuery.css(elem, "position") === "fixed") {
        offset = elem.getBoundingClientRect();
      } else {
        offset = this.offset();
        doc = elem.ownerDocument;
        offsetParent = elem.offsetParent || doc.documentElement;
        while (offsetParent && (offsetParent === doc.body || offsetParent === doc.documentElement) && jQuery.css(offsetParent, "position") === "static") {
          offsetParent = offsetParent.parentNode;
        }
        if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
          parentOffset = jQuery(offsetParent).offset();
          parentOffset.top += jQuery.css(offsetParent, "borderTopWidth", true);
          parentOffset.left += jQuery.css(offsetParent, "borderLeftWidth", true);
        }
      }
      return {
        top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
        left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
      };
    },
    offsetParent: function () {
      return this.map(function () {
        var offsetParent = this.offsetParent;
        while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
          offsetParent = offsetParent.offsetParent;
        }
        return offsetParent || documentElement;
      });
    }
  });
  jQuery.each({
    scrollLeft: "pageXOffset",
    scrollTop: "pageYOffset"
  }, function (method, prop) {
    var top = "pageYOffset" === prop;
    jQuery.fn[method] = function (val) {
      return access(this, function (elem, method, val) {
        var win;
        if (isWindow(elem)) {
          win = elem;
        } else if (elem.nodeType === 9) {
          win = elem.defaultView;
        }
        if (val === undefined) {
          return win ? win[prop] : elem[method];
        }
        if (win) {
          win.scrollTo(!top ? val : win.pageXOffset, top ? val : win.pageYOffset);
        } else {
          elem[method] = val;
        }
      }, method, val, arguments.length);
    };
  });
  jQuery.each(["top", "left"], function (_i, prop) {
    jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function (elem, computed) {
      if (computed) {
        computed = curCSS(elem, prop);
        return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed;
      }
    });
  });
  jQuery.each({
    Height: "height",
    Width: "width"
  }, function (name, type) {
    jQuery.each({
      padding: "inner" + name,
      content: type,
      "": "outer" + name
    }, function (defaultExtra, funcName) {
      jQuery.fn[funcName] = function (margin, value) {
        var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"), extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
        return access(this, function (elem, type, value) {
          var doc;
          if (isWindow(elem)) {
            return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
          }
          if (elem.nodeType === 9) {
            doc = elem.documentElement;
            return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);
          }
          return value === undefined ? jQuery.css(elem, type, extra) : jQuery.style(elem, type, value, extra);
        }, type, chainable ? margin : undefined, chainable);
      };
    });
  });
  jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (_i, type) {
    jQuery.fn[type] = function (fn) {
      return this.on(type, fn);
    };
  });
  jQuery.fn.extend({
    bind: function (types, data, fn) {
      return this.on(types, null, data, fn);
    },
    unbind: function (types, fn) {
      return this.off(types, null, fn);
    },
    delegate: function (selector, types, data, fn) {
      return this.on(types, selector, data, fn);
    },
    undelegate: function (selector, types, fn) {
      return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
    },
    hover: function (fnOver, fnOut) {
      return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
    }
  });
  jQuery.each(("blur focus focusin focusout resize scroll click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup contextmenu").split(" "), function (_i, name) {
    jQuery.fn[name] = function (data, fn) {
      return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
    };
  });
  var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
  jQuery.proxy = function (fn, context) {
    var tmp, args, proxy;
    if (typeof context === "string") {
      tmp = fn[context];
      context = fn;
      fn = tmp;
    }
    if (!isFunction(fn)) {
      return undefined;
    }
    args = slice.call(arguments, 2);
    proxy = function () {
      return fn.apply(context || this, args.concat(slice.call(arguments)));
    };
    proxy.guid = fn.guid = fn.guid || jQuery.guid++;
    return proxy;
  };
  jQuery.holdReady = function (hold) {
    if (hold) {
      jQuery.readyWait++;
    } else {
      jQuery.ready(true);
    }
  };
  jQuery.isArray = Array.isArray;
  jQuery.parseJSON = JSON.parse;
  jQuery.nodeName = nodeName;
  jQuery.isFunction = isFunction;
  jQuery.isWindow = isWindow;
  jQuery.camelCase = camelCase;
  jQuery.type = toType;
  jQuery.now = Date.now;
  jQuery.isNumeric = function (obj) {
    var type = jQuery.type(obj);
    return (type === "number" || type === "string") && !isNaN(obj - parseFloat(obj));
  };
  jQuery.trim = function (text) {
    return text == null ? "" : (text + "").replace(rtrim, "");
  };
  if (typeof define === "function" && define.amd) {
    define("jquery", [], function () {
      return jQuery;
    });
  }
  var _jQuery = window.jQuery, _$ = window.$;
  jQuery.noConflict = function (deep) {
    if (window.$ === jQuery) {
      window.$ = _$;
    }
    if (deep && window.jQuery === jQuery) {
      window.jQuery = _jQuery;
    }
    return jQuery;
  };
  if (typeof noGlobal === "undefined") {
    window.jQuery = window.$ = jQuery;
  }
  return jQuery;
});

},

// node_modules/moment/moment.js @7
7: function(__fusereq, exports, module){
;
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.moment = factory();
})(this, function () {
  'use strict';
  var hookCallback;
  function hooks() {
    return hookCallback.apply(null, arguments);
  }
  function setHookCallback(callback) {
    hookCallback = callback;
  }
  function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
  }
  function isObject(input) {
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
  }
  function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
  }
  function isObjectEmpty(obj) {
    if (Object.getOwnPropertyNames) {
      return Object.getOwnPropertyNames(obj).length === 0;
    } else {
      var k;
      for (k in obj) {
        if (hasOwnProp(obj, k)) {
          return false;
        }
      }
      return true;
    }
  }
  function isUndefined(input) {
    return input === void 0;
  }
  function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
  }
  function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
  }
  function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
      res.push(fn(arr[i], i));
    }
    return res;
  }
  function extend(a, b) {
    for (var i in b) {
      if (hasOwnProp(b, i)) {
        a[i] = b[i];
      }
    }
    if (hasOwnProp(b, 'toString')) {
      a.toString = b.toString;
    }
    if (hasOwnProp(b, 'valueOf')) {
      a.valueOf = b.valueOf;
    }
    return a;
  }
  function createUTC(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
  }
  function defaultParsingFlags() {
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidEra: null,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false,
      parsedDateParts: [],
      era: null,
      meridiem: null,
      rfc2822: false,
      weekdayMismatch: false
    };
  }
  function getParsingFlags(m) {
    if (m._pf == null) {
      m._pf = defaultParsingFlags();
    }
    return m._pf;
  }
  var some;
  if (Array.prototype.some) {
    some = Array.prototype.some;
  } else {
    some = function (fun) {
      var t = Object(this), len = t.length >>> 0, i;
      for (i = 0; i < len; i++) {
        if ((i in t) && fun.call(this, t[i], i, t)) {
          return true;
        }
      }
      return false;
    };
  }
  function isValid(m) {
    if (m._isValid == null) {
      var flags = getParsingFlags(m), parsedParts = some.call(flags.parsedDateParts, function (i) {
        return i != null;
      }), isNowValid = !isNaN(m._d.getTime()) && flags.overflow < 0 && !flags.empty && !flags.invalidEra && !flags.invalidMonth && !flags.invalidWeekday && !flags.weekdayMismatch && !flags.nullInput && !flags.invalidFormat && !flags.userInvalidated && (!flags.meridiem || flags.meridiem && parsedParts);
      if (m._strict) {
        isNowValid = isNowValid && flags.charsLeftOver === 0 && flags.unusedTokens.length === 0 && flags.bigHour === undefined;
      }
      if (Object.isFrozen == null || !Object.isFrozen(m)) {
        m._isValid = isNowValid;
      } else {
        return isNowValid;
      }
    }
    return m._isValid;
  }
  function createInvalid(flags) {
    var m = createUTC(NaN);
    if (flags != null) {
      extend(getParsingFlags(m), flags);
    } else {
      getParsingFlags(m).userInvalidated = true;
    }
    return m;
  }
  var momentProperties = hooks.momentProperties = [], updateInProgress = false;
  function copyConfig(to, from) {
    var i, prop, val;
    if (!isUndefined(from._isAMomentObject)) {
      to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
      to._i = from._i;
    }
    if (!isUndefined(from._f)) {
      to._f = from._f;
    }
    if (!isUndefined(from._l)) {
      to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
      to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
      to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
      to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
      to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
      to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
      to._locale = from._locale;
    }
    if (momentProperties.length > 0) {
      for (i = 0; i < momentProperties.length; i++) {
        prop = momentProperties[i];
        val = from[prop];
        if (!isUndefined(val)) {
          to[prop] = val;
        }
      }
    }
    return to;
  }
  function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
      this._d = new Date(NaN);
    }
    if (updateInProgress === false) {
      updateInProgress = true;
      hooks.updateOffset(this);
      updateInProgress = false;
    }
  }
  function isMoment(obj) {
    return obj instanceof Moment || obj != null && obj._isAMomentObject != null;
  }
  function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
      console.warn('Deprecation warning: ' + msg);
    }
  }
  function deprecate(msg, fn) {
    var firstTime = true;
    return extend(function () {
      if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(null, msg);
      }
      if (firstTime) {
        var args = [], arg, i, key;
        for (i = 0; i < arguments.length; i++) {
          arg = '';
          if (typeof arguments[i] === 'object') {
            arg += '\n[' + i + '] ';
            for (key in arguments[0]) {
              if (hasOwnProp(arguments[0], key)) {
                arg += key + ': ' + arguments[0][key] + ', ';
              }
            }
            arg = arg.slice(0, -2);
          } else {
            arg = arguments[i];
          }
          args.push(arg);
        }
        warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + new Error().stack);
        firstTime = false;
      }
      return fn.apply(this, arguments);
    }, fn);
  }
  var deprecations = {};
  function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
      hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
      warn(msg);
      deprecations[name] = true;
    }
  }
  hooks.suppressDeprecationWarnings = false;
  hooks.deprecationHandler = null;
  function isFunction(input) {
    return typeof Function !== 'undefined' && input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
  }
  function set(config) {
    var prop, i;
    for (i in config) {
      if (hasOwnProp(config, i)) {
        prop = config[i];
        if (isFunction(prop)) {
          this[i] = prop;
        } else {
          this['_' + i] = prop;
        }
      }
    }
    this._config = config;
    this._dayOfMonthOrdinalParseLenient = new RegExp((this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + '|' + (/\d{1,2}/).source);
  }
  function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
      if (hasOwnProp(childConfig, prop)) {
        if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
          res[prop] = {};
          extend(res[prop], parentConfig[prop]);
          extend(res[prop], childConfig[prop]);
        } else if (childConfig[prop] != null) {
          res[prop] = childConfig[prop];
        } else {
          delete res[prop];
        }
      }
    }
    for (prop in parentConfig) {
      if (hasOwnProp(parentConfig, prop) && !hasOwnProp(childConfig, prop) && isObject(parentConfig[prop])) {
        res[prop] = extend({}, res[prop]);
      }
    }
    return res;
  }
  function Locale(config) {
    if (config != null) {
      this.set(config);
    }
  }
  var keys;
  if (Object.keys) {
    keys = Object.keys;
  } else {
    keys = function (obj) {
      var i, res = [];
      for (i in obj) {
        if (hasOwnProp(obj, i)) {
          res.push(i);
        }
      }
      return res;
    };
  }
  var defaultCalendar = {
    sameDay: '[Today at] LT',
    nextDay: '[Tomorrow at] LT',
    nextWeek: 'dddd [at] LT',
    lastDay: '[Yesterday at] LT',
    lastWeek: '[Last] dddd [at] LT',
    sameElse: 'L'
  };
  function calendar(key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
  }
  function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number), zerosToFill = targetLength - absNumber.length, sign = number >= 0;
    return (sign ? forceSign ? '+' : '' : '-') + Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
  }
  var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g, localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, formatFunctions = {}, formatTokenFunctions = {};
  function addFormatToken(token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
      func = function () {
        return this[callback]();
      };
    }
    if (token) {
      formatTokenFunctions[token] = func;
    }
    if (padded) {
      formatTokenFunctions[padded[0]] = function () {
        return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
      };
    }
    if (ordinal) {
      formatTokenFunctions[ordinal] = function () {
        return this.localeData().ordinal(func.apply(this, arguments), token);
      };
    }
  }
  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
  }
  function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;
    for ((i = 0, length = array.length); i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }
    return function (mom) {
      var output = '', i;
      for (i = 0; i < length; i++) {
        output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
      }
      return output;
    };
  }
  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.localeData().invalidDate();
    }
    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);
    return formatFunctions[format](m);
  }
  function expandFormat(format, locale) {
    var i = 5;
    function replaceLongDateFormatTokens(input) {
      return locale.longDateFormat(input) || input;
    }
    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }
    return format;
  }
  var defaultLongDateFormat = {
    LTS: 'h:mm:ss A',
    LT: 'h:mm A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A'
  };
  function longDateFormat(key) {
    var format = this._longDateFormat[key], formatUpper = this._longDateFormat[key.toUpperCase()];
    if (format || !formatUpper) {
      return format;
    }
    this._longDateFormat[key] = formatUpper.match(formattingTokens).map(function (tok) {
      if (tok === 'MMMM' || tok === 'MM' || tok === 'DD' || tok === 'dddd') {
        return tok.slice(1);
      }
      return tok;
    }).join('');
    return this._longDateFormat[key];
  }
  var defaultInvalidDate = 'Invalid date';
  function invalidDate() {
    return this._invalidDate;
  }
  var defaultOrdinal = '%d', defaultDayOfMonthOrdinalParse = /\d{1,2}/;
  function ordinal(number) {
    return this._ordinal.replace('%d', number);
  }
  var defaultRelativeTime = {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    w: 'a week',
    ww: '%d weeks',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  };
  function relativeTime(number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return isFunction(output) ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
  }
  function pastFuture(diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
  }
  var aliases = {};
  function addUnitAlias(unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
  }
  function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
  }
  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {}, normalizedProp, prop;
    for (prop in inputObject) {
      if (hasOwnProp(inputObject, prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }
    return normalizedInput;
  }
  var priorities = {};
  function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
  }
  function getPrioritizedUnits(unitsObj) {
    var units = [], u;
    for (u in unitsObj) {
      if (hasOwnProp(unitsObj, u)) {
        units.push({
          unit: u,
          priority: priorities[u]
        });
      }
    }
    units.sort(function (a, b) {
      return a.priority - b.priority;
    });
    return units;
  }
  function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  }
  function absFloor(number) {
    if (number < 0) {
      return Math.ceil(number) || 0;
    } else {
      return Math.floor(number);
    }
  }
  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion, value = 0;
    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      value = absFloor(coercedNumber);
    }
    return value;
  }
  function makeGetSet(unit, keepTime) {
    return function (value) {
      if (value != null) {
        set$1(this, unit, value);
        hooks.updateOffset(this, keepTime);
        return this;
      } else {
        return get(this, unit);
      }
    };
  }
  function get(mom, unit) {
    return mom.isValid() ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
  }
  function set$1(mom, unit, value) {
    if (mom.isValid() && !isNaN(value)) {
      if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
        value = toInt(value);
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
      } else {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
      }
    }
  }
  function stringGet(units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
      return this[units]();
    }
    return this;
  }
  function stringSet(units, value) {
    if (typeof units === 'object') {
      units = normalizeObjectUnits(units);
      var prioritized = getPrioritizedUnits(units), i;
      for (i = 0; i < prioritized.length; i++) {
        this[prioritized[i].unit](units[prioritized[i].unit]);
      }
    } else {
      units = normalizeUnits(units);
      if (isFunction(this[units])) {
        return this[units](value);
      }
    }
    return this;
  }
  var match1 = /\d/, match2 = /\d\d/, match3 = /\d{3}/, match4 = /\d{4}/, match6 = /[+-]?\d{6}/, match1to2 = /\d\d?/, match3to4 = /\d\d\d\d?/, match5to6 = /\d\d\d\d\d\d?/, match1to3 = /\d{1,3}/, match1to4 = /\d{1,4}/, match1to6 = /[+-]?\d{1,6}/, matchUnsigned = /\d+/, matchSigned = /[+-]?\d+/, matchOffset = /Z|[+-]\d\d:?\d\d/gi, matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i, regexes;
  regexes = {};
  function addRegexToken(token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
      return isStrict && strictRegex ? strictRegex : regex;
    };
  }
  function getParseRegexForToken(token, config) {
    if (!hasOwnProp(regexes, token)) {
      return new RegExp(unescapeFormat(token));
    }
    return regexes[token](config._strict, config._locale);
  }
  function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
      return p1 || p2 || p3 || p4;
    }));
  }
  function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  var tokens = {};
  function addParseToken(token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
      token = [token];
    }
    if (isNumber(callback)) {
      func = function (input, array) {
        array[callback] = toInt(input);
      };
    }
    for (i = 0; i < token.length; i++) {
      tokens[token[i]] = func;
    }
  }
  function addWeekParseToken(token, callback) {
    addParseToken(token, function (input, array, config, token) {
      config._w = config._w || ({});
      callback(input, config._w, config, token);
    });
  }
  function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
      tokens[token](input, config._a, config, token);
    }
  }
  var YEAR = 0, MONTH = 1, DATE = 2, HOUR = 3, MINUTE = 4, SECOND = 5, MILLISECOND = 6, WEEK = 7, WEEKDAY = 8;
  function mod(n, x) {
    return (n % x + x) % x;
  }
  var indexOf;
  if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function (o) {
      var i;
      for (i = 0; i < this.length; ++i) {
        if (this[i] === o) {
          return i;
        }
      }
      return -1;
    };
  }
  function daysInMonth(year, month) {
    if (isNaN(year) || isNaN(month)) {
      return NaN;
    }
    var modMonth = mod(month, 12);
    year += (month - modMonth) / 12;
    return modMonth === 1 ? isLeapYear(year) ? 29 : 28 : 31 - modMonth % 7 % 2;
  }
  addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
  });
  addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
  });
  addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
  });
  addUnitAlias('month', 'M');
  addUnitPriority('month', 8);
  addRegexToken('M', match1to2);
  addRegexToken('MM', match1to2, match2);
  addRegexToken('MMM', function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
  });
  addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
  });
  addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
  });
  addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    if (month != null) {
      array[MONTH] = month;
    } else {
      getParsingFlags(config).invalidMonth = input;
    }
  });
  var defaultLocaleMonths = ('January_February_March_April_May_June_July_August_September_October_November_December').split('_'), defaultLocaleMonthsShort = ('Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec').split('_'), MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/, defaultMonthsShortRegex = matchWord, defaultMonthsRegex = matchWord;
  function localeMonths(m, format) {
    if (!m) {
      return isArray(this._months) ? this._months : this._months['standalone'];
    }
    return isArray(this._months) ? this._months[m.month()] : this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
  }
  function localeMonthsShort(m, format) {
    if (!m) {
      return isArray(this._monthsShort) ? this._monthsShort : this._monthsShort['standalone'];
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] : this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
  }
  function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
      for (i = 0; i < 12; ++i) {
        mom = createUTC([2000, i]);
        this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
        this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
      }
    }
    if (strict) {
      if (format === 'MMM') {
        ii = indexOf.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format === 'MMM') {
        ii = indexOf.call(this._shortMonthsParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._longMonthsParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }
  function localeMonthsParse(monthName, format, strict) {
    var i, mom, regex;
    if (this._monthsParseExact) {
      return handleStrictParse.call(this, monthName, format, strict);
    }
    if (!this._monthsParse) {
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
    }
    for (i = 0; i < 12; i++) {
      mom = createUTC([2000, i]);
      if (strict && !this._longMonthsParse[i]) {
        this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
        this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
      }
      if (!strict && !this._monthsParse[i]) {
        regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
        this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
      }
      if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
        return i;
      } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
        return i;
      } else if (!strict && this._monthsParse[i].test(monthName)) {
        return i;
      }
    }
  }
  function setMonth(mom, value) {
    var dayOfMonth;
    if (!mom.isValid()) {
      return mom;
    }
    if (typeof value === 'string') {
      if ((/^\d+$/).test(value)) {
        value = toInt(value);
      } else {
        value = mom.localeData().monthsParse(value);
        if (!isNumber(value)) {
          return mom;
        }
      }
    }
    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
  }
  function getSetMonth(value) {
    if (value != null) {
      setMonth(this, value);
      hooks.updateOffset(this, true);
      return this;
    } else {
      return get(this, 'Month');
    }
  }
  function getDaysInMonth() {
    return daysInMonth(this.year(), this.month());
  }
  function monthsShortRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsShortStrictRegex;
      } else {
        return this._monthsShortRegex;
      }
    } else {
      if (!hasOwnProp(this, '_monthsShortRegex')) {
        this._monthsShortRegex = defaultMonthsShortRegex;
      }
      return this._monthsShortStrictRegex && isStrict ? this._monthsShortStrictRegex : this._monthsShortRegex;
    }
  }
  function monthsRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsStrictRegex;
      } else {
        return this._monthsRegex;
      }
    } else {
      if (!hasOwnProp(this, '_monthsRegex')) {
        this._monthsRegex = defaultMonthsRegex;
      }
      return this._monthsStrictRegex && isStrict ? this._monthsStrictRegex : this._monthsRegex;
    }
  }
  function computeMonthsParse() {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }
    var shortPieces = [], longPieces = [], mixedPieces = [], i, mom;
    for (i = 0; i < 12; i++) {
      mom = createUTC([2000, i]);
      shortPieces.push(this.monthsShort(mom, ''));
      longPieces.push(this.months(mom, ''));
      mixedPieces.push(this.months(mom, ''));
      mixedPieces.push(this.monthsShort(mom, ''));
    }
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
      shortPieces[i] = regexEscape(shortPieces[i]);
      longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
      mixedPieces[i] = regexEscape(mixedPieces[i]);
    }
    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
  }
  addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? zeroFill(y, 4) : '+' + y;
  });
  addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
  });
  addFormatToken(0, ['YYYY', 4], 0, 'year');
  addFormatToken(0, ['YYYYY', 5], 0, 'year');
  addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');
  addUnitAlias('year', 'y');
  addUnitPriority('year', 1);
  addRegexToken('Y', matchSigned);
  addRegexToken('YY', match1to2, match2);
  addRegexToken('YYYY', match1to4, match4);
  addRegexToken('YYYYY', match1to6, match6);
  addRegexToken('YYYYYY', match1to6, match6);
  addParseToken(['YYYYY', 'YYYYYY'], YEAR);
  addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
  });
  addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
  });
  addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
  });
  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }
  hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
  };
  var getSetYear = makeGetSet('FullYear', true);
  function getIsLeapYear() {
    return isLeapYear(this.year());
  }
  function createDate(y, m, d, h, M, s, ms) {
    var date;
    if (y < 100 && y >= 0) {
      date = new Date(y + 400, m, d, h, M, s, ms);
      if (isFinite(date.getFullYear())) {
        date.setFullYear(y);
      }
    } else {
      date = new Date(y, m, d, h, M, s, ms);
    }
    return date;
  }
  function createUTCDate(y) {
    var date, args;
    if (y < 100 && y >= 0) {
      args = Array.prototype.slice.call(arguments);
      args[0] = y + 400;
      date = new Date(Date.UTC.apply(null, args));
      if (isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
      }
    } else {
      date = new Date(Date.UTC.apply(null, arguments));
    }
    return date;
  }
  function firstWeekOffset(year, dow, doy) {
    var fwd = 7 + dow - doy, fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;
    return -fwdlw + fwd - 1;
  }
  function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7, weekOffset = firstWeekOffset(year, dow, doy), dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset, resYear, resDayOfYear;
    if (dayOfYear <= 0) {
      resYear = year - 1;
      resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
      resYear = year + 1;
      resDayOfYear = dayOfYear - daysInYear(year);
    } else {
      resYear = year;
      resDayOfYear = dayOfYear;
    }
    return {
      year: resYear,
      dayOfYear: resDayOfYear
    };
  }
  function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy), week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1, resWeek, resYear;
    if (week < 1) {
      resYear = mom.year() - 1;
      resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
      resWeek = week - weeksInYear(mom.year(), dow, doy);
      resYear = mom.year() + 1;
    } else {
      resYear = mom.year();
      resWeek = week;
    }
    return {
      week: resWeek,
      year: resYear
    };
  }
  function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy), weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
  }
  addFormatToken('w', ['ww', 2], 'wo', 'week');
  addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');
  addUnitAlias('week', 'w');
  addUnitAlias('isoWeek', 'W');
  addUnitPriority('week', 5);
  addUnitPriority('isoWeek', 5);
  addRegexToken('w', match1to2);
  addRegexToken('ww', match1to2, match2);
  addRegexToken('W', match1to2);
  addRegexToken('WW', match1to2, match2);
  addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
  });
  function localeWeek(mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
  }
  var defaultLocaleWeek = {
    dow: 0,
    doy: 6
  };
  function localeFirstDayOfWeek() {
    return this._week.dow;
  }
  function localeFirstDayOfYear() {
    return this._week.doy;
  }
  function getSetWeek(input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
  }
  function getSetISOWeek(input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
  }
  addFormatToken('d', 0, 'do', 'day');
  addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
  });
  addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
  });
  addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
  });
  addFormatToken('e', 0, 0, 'weekday');
  addFormatToken('E', 0, 0, 'isoWeekday');
  addUnitAlias('day', 'd');
  addUnitAlias('weekday', 'e');
  addUnitAlias('isoWeekday', 'E');
  addUnitPriority('day', 11);
  addUnitPriority('weekday', 11);
  addUnitPriority('isoWeekday', 11);
  addRegexToken('d', match1to2);
  addRegexToken('e', match1to2);
  addRegexToken('E', match1to2);
  addRegexToken('dd', function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
  });
  addRegexToken('ddd', function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
  });
  addRegexToken('dddd', function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
  });
  addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    if (weekday != null) {
      week.d = weekday;
    } else {
      getParsingFlags(config).invalidWeekday = input;
    }
  });
  addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
  });
  function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
      return input;
    }
    if (!isNaN(input)) {
      return parseInt(input, 10);
    }
    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
      return input;
    }
    return null;
  }
  function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
      return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
  }
  function shiftWeekdays(ws, n) {
    return ws.slice(n, 7).concat(ws.slice(0, n));
  }
  var defaultLocaleWeekdays = ('Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday').split('_'), defaultLocaleWeekdaysShort = ('Sun_Mon_Tue_Wed_Thu_Fri_Sat').split('_'), defaultLocaleWeekdaysMin = ('Su_Mo_Tu_We_Th_Fr_Sa').split('_'), defaultWeekdaysRegex = matchWord, defaultWeekdaysShortRegex = matchWord, defaultWeekdaysMinRegex = matchWord;
  function localeWeekdays(m, format) {
    var weekdays = isArray(this._weekdays) ? this._weekdays : this._weekdays[m && m !== true && this._weekdays.isFormat.test(format) ? 'format' : 'standalone'];
    return m === true ? shiftWeekdays(weekdays, this._week.dow) : m ? weekdays[m.day()] : weekdays;
  }
  function localeWeekdaysShort(m) {
    return m === true ? shiftWeekdays(this._weekdaysShort, this._week.dow) : m ? this._weekdaysShort[m.day()] : this._weekdaysShort;
  }
  function localeWeekdaysMin(m) {
    return m === true ? shiftWeekdays(this._weekdaysMin, this._week.dow) : m ? this._weekdaysMin[m.day()] : this._weekdaysMin;
  }
  function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._minWeekdaysParse = [];
      for (i = 0; i < 7; ++i) {
        mom = createUTC([2000, 1]).day(i);
        this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
        this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
        this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
      }
    }
    if (strict) {
      if (format === 'dddd') {
        ii = indexOf.call(this._weekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format === 'ddd') {
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format === 'dddd') {
        ii = indexOf.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format === 'ddd') {
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf.call(this._minWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }
  function localeWeekdaysParse(weekdayName, format, strict) {
    var i, mom, regex;
    if (this._weekdaysParseExact) {
      return handleStrictParse$1.call(this, weekdayName, format, strict);
    }
    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._minWeekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._fullWeekdaysParse = [];
    }
    for (i = 0; i < 7; i++) {
      mom = createUTC([2000, 1]).day(i);
      if (strict && !this._fullWeekdaysParse[i]) {
        this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\\.?') + '$', 'i');
        this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$', 'i');
        this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$', 'i');
      }
      if (!this._weekdaysParse[i]) {
        regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
        this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
      }
      if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
        return i;
      }
    }
  }
  function getSetDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
      input = parseWeekday(input, this.localeData());
      return this.add(input - day, 'd');
    } else {
      return day;
    }
  }
  function getSetLocaleDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
  }
  function getSetISODayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    if (input != null) {
      var weekday = parseIsoWeekday(input, this.localeData());
      return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
      return this.day() || 7;
    }
  }
  function weekdaysRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysStrictRegex;
      } else {
        return this._weekdaysRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        this._weekdaysRegex = defaultWeekdaysRegex;
      }
      return this._weekdaysStrictRegex && isStrict ? this._weekdaysStrictRegex : this._weekdaysRegex;
    }
  }
  function weekdaysShortRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysShortStrictRegex;
      } else {
        return this._weekdaysShortRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysShortRegex')) {
        this._weekdaysShortRegex = defaultWeekdaysShortRegex;
      }
      return this._weekdaysShortStrictRegex && isStrict ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
  }
  function weekdaysMinRegex(isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysMinStrictRegex;
      } else {
        return this._weekdaysMinRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysMinRegex')) {
        this._weekdaysMinRegex = defaultWeekdaysMinRegex;
      }
      return this._weekdaysMinStrictRegex && isStrict ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
  }
  function computeWeekdaysParse() {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }
    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [], i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
      mom = createUTC([2000, 1]).day(i);
      minp = regexEscape(this.weekdaysMin(mom, ''));
      shortp = regexEscape(this.weekdaysShort(mom, ''));
      longp = regexEscape(this.weekdays(mom, ''));
      minPieces.push(minp);
      shortPieces.push(shortp);
      longPieces.push(longp);
      mixedPieces.push(minp);
      mixedPieces.push(shortp);
      mixedPieces.push(longp);
    }
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;
    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
  }
  function hFormat() {
    return this.hours() % 12 || 12;
  }
  function kFormat() {
    return this.hours() || 24;
  }
  addFormatToken('H', ['HH', 2], 0, 'hour');
  addFormatToken('h', ['hh', 2], 0, hFormat);
  addFormatToken('k', ['kk', 2], 0, kFormat);
  addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
  });
  addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
  });
  addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
  });
  addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
  });
  function meridiem(token, lowercase) {
    addFormatToken(token, 0, 0, function () {
      return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
  }
  meridiem('a', true);
  meridiem('A', false);
  addUnitAlias('hour', 'h');
  addUnitPriority('hour', 13);
  function matchMeridiem(isStrict, locale) {
    return locale._meridiemParse;
  }
  addRegexToken('a', matchMeridiem);
  addRegexToken('A', matchMeridiem);
  addRegexToken('H', match1to2);
  addRegexToken('h', match1to2);
  addRegexToken('k', match1to2);
  addRegexToken('HH', match1to2, match2);
  addRegexToken('hh', match1to2, match2);
  addRegexToken('kk', match1to2, match2);
  addRegexToken('hmm', match3to4);
  addRegexToken('hmmss', match5to6);
  addRegexToken('Hmm', match3to4);
  addRegexToken('Hmmss', match5to6);
  addParseToken(['H', 'HH'], HOUR);
  addParseToken(['k', 'kk'], function (input, array, config) {
    var kInput = toInt(input);
    array[HOUR] = kInput === 24 ? 0 : kInput;
  });
  addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
  });
  addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4, pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
  });
  addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4, pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
  });
  function localeIsPM(input) {
    return (input + '').toLowerCase().charAt(0) === 'p';
  }
  var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i, getSetHour = makeGetSet('Hours', true);
  function localeMeridiem(hours, minutes, isLower) {
    if (hours > 11) {
      return isLower ? 'pm' : 'PM';
    } else {
      return isLower ? 'am' : 'AM';
    }
  }
  var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    relativeTime: defaultRelativeTime,
    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,
    week: defaultLocaleWeek,
    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,
    meridiemParse: defaultLocaleMeridiemParse
  };
  var locales = {}, localeFamilies = {}, globalLocale;
  function commonPrefix(arr1, arr2) {
    var i, minl = Math.min(arr1.length, arr2.length);
    for (i = 0; i < minl; i += 1) {
      if (arr1[i] !== arr2[i]) {
        return i;
      }
    }
    return minl;
  }
  function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
  }
  function chooseLocale(names) {
    var i = 0, j, next, locale, split;
    while (i < names.length) {
      split = normalizeLocale(names[i]).split('-');
      j = split.length;
      next = normalizeLocale(names[i + 1]);
      next = next ? next.split('-') : null;
      while (j > 0) {
        locale = loadLocale(split.slice(0, j).join('-'));
        if (locale) {
          return locale;
        }
        if (next && next.length >= j && commonPrefix(split, next) >= j - 1) {
          break;
        }
        j--;
      }
      i++;
    }
    return globalLocale;
  }
  function loadLocale(name) {
    var oldLocale = null, aliasedRequire;
    if (locales[name] === undefined && typeof module !== 'undefined' && module && module.exports) {
      try {
        oldLocale = globalLocale._abbr;
        aliasedRequire = __fusereq;
        aliasedRequire('./locale/' + name);
        getSetGlobalLocale(oldLocale);
      } catch (e) {
        locales[name] = null;
      }
    }
    return locales[name];
  }
  function getSetGlobalLocale(key, values) {
    var data;
    if (key) {
      if (isUndefined(values)) {
        data = getLocale(key);
      } else {
        data = defineLocale(key, values);
      }
      if (data) {
        globalLocale = data;
      } else {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('Locale ' + key + ' not found. Did you forget to load it?');
        }
      }
    }
    return globalLocale._abbr;
  }
  function defineLocale(name, config) {
    if (config !== null) {
      var locale, parentConfig = baseConfig;
      config.abbr = name;
      if (locales[name] != null) {
        deprecateSimple('defineLocaleOverride', 'use moment.updateLocale(localeName, config) to change ' + 'an existing locale. moment.defineLocale(localeName, ' + 'config) should only be used for creating a new locale ' + 'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
        parentConfig = locales[name]._config;
      } else if (config.parentLocale != null) {
        if (locales[config.parentLocale] != null) {
          parentConfig = locales[config.parentLocale]._config;
        } else {
          locale = loadLocale(config.parentLocale);
          if (locale != null) {
            parentConfig = locale._config;
          } else {
            if (!localeFamilies[config.parentLocale]) {
              localeFamilies[config.parentLocale] = [];
            }
            localeFamilies[config.parentLocale].push({
              name: name,
              config: config
            });
            return null;
          }
        }
      }
      locales[name] = new Locale(mergeConfigs(parentConfig, config));
      if (localeFamilies[name]) {
        localeFamilies[name].forEach(function (x) {
          defineLocale(x.name, x.config);
        });
      }
      getSetGlobalLocale(name);
      return locales[name];
    } else {
      delete locales[name];
      return null;
    }
  }
  function updateLocale(name, config) {
    if (config != null) {
      var locale, tmpLocale, parentConfig = baseConfig;
      if (locales[name] != null && locales[name].parentLocale != null) {
        locales[name].set(mergeConfigs(locales[name]._config, config));
      } else {
        tmpLocale = loadLocale(name);
        if (tmpLocale != null) {
          parentConfig = tmpLocale._config;
        }
        config = mergeConfigs(parentConfig, config);
        if (tmpLocale == null) {
          config.abbr = name;
        }
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;
      }
      getSetGlobalLocale(name);
    } else {
      if (locales[name] != null) {
        if (locales[name].parentLocale != null) {
          locales[name] = locales[name].parentLocale;
          if (name === getSetGlobalLocale()) {
            getSetGlobalLocale(name);
          }
        } else if (locales[name] != null) {
          delete locales[name];
        }
      }
    }
    return locales[name];
  }
  function getLocale(key) {
    var locale;
    if (key && key._locale && key._locale._abbr) {
      key = key._locale._abbr;
    }
    if (!key) {
      return globalLocale;
    }
    if (!isArray(key)) {
      locale = loadLocale(key);
      if (locale) {
        return locale;
      }
      key = [key];
    }
    return chooseLocale(key);
  }
  function listLocales() {
    return keys(locales);
  }
  function checkOverflow(m) {
    var overflow, a = m._a;
    if (a && getParsingFlags(m).overflow === -2) {
      overflow = a[MONTH] < 0 || a[MONTH] > 11 ? MONTH : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH]) ? DATE : a[HOUR] < 0 || a[HOUR] > 24 || a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0) ? HOUR : a[MINUTE] < 0 || a[MINUTE] > 59 ? MINUTE : a[SECOND] < 0 || a[SECOND] > 59 ? SECOND : a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND : -1;
      if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
        overflow = DATE;
      }
      if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
        overflow = WEEK;
      }
      if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
        overflow = WEEKDAY;
      }
      getParsingFlags(m).overflow = overflow;
    }
    return m;
  }
  var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/, basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/, tzRegex = /Z|[+-]\d\d(?::?\d\d)?/, isoDates = [['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/], ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/], ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/], ['GGGG-[W]WW', /\d{4}-W\d\d/, false], ['YYYY-DDD', /\d{4}-\d{3}/], ['YYYY-MM', /\d{4}-\d\d/, false], ['YYYYYYMMDD', /[+-]\d{10}/], ['YYYYMMDD', /\d{8}/], ['GGGG[W]WWE', /\d{4}W\d{3}/], ['GGGG[W]WW', /\d{4}W\d{2}/, false], ['YYYYDDD', /\d{7}/], ['YYYYMM', /\d{6}/, false], ['YYYY', /\d{4}/, false]], isoTimes = [['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/], ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/], ['HH:mm:ss', /\d\d:\d\d:\d\d/], ['HH:mm', /\d\d:\d\d/], ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/], ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/], ['HHmmss', /\d\d\d\d\d\d/], ['HHmm', /\d\d\d\d/], ['HH', /\d\d/]], aspNetJsonRegex = /^\/?Date\((-?\d+)/i, rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/, obsOffsets = {
    UT: 0,
    GMT: 0,
    EDT: -4 * 60,
    EST: -5 * 60,
    CDT: -5 * 60,
    CST: -6 * 60,
    MDT: -6 * 60,
    MST: -7 * 60,
    PDT: -7 * 60,
    PST: -8 * 60
  };
  function configFromISO(config) {
    var i, l, string = config._i, match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string), allowTime, dateFormat, timeFormat, tzFormat;
    if (match) {
      getParsingFlags(config).iso = true;
      for ((i = 0, l = isoDates.length); i < l; i++) {
        if (isoDates[i][1].exec(match[1])) {
          dateFormat = isoDates[i][0];
          allowTime = isoDates[i][2] !== false;
          break;
        }
      }
      if (dateFormat == null) {
        config._isValid = false;
        return;
      }
      if (match[3]) {
        for ((i = 0, l = isoTimes.length); i < l; i++) {
          if (isoTimes[i][1].exec(match[3])) {
            timeFormat = (match[2] || ' ') + isoTimes[i][0];
            break;
          }
        }
        if (timeFormat == null) {
          config._isValid = false;
          return;
        }
      }
      if (!allowTime && timeFormat != null) {
        config._isValid = false;
        return;
      }
      if (match[4]) {
        if (tzRegex.exec(match[4])) {
          tzFormat = 'Z';
        } else {
          config._isValid = false;
          return;
        }
      }
      config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
      configFromStringAndFormat(config);
    } else {
      config._isValid = false;
    }
  }
  function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
    var result = [untruncateYear(yearStr), defaultLocaleMonthsShort.indexOf(monthStr), parseInt(dayStr, 10), parseInt(hourStr, 10), parseInt(minuteStr, 10)];
    if (secondStr) {
      result.push(parseInt(secondStr, 10));
    }
    return result;
  }
  function untruncateYear(yearStr) {
    var year = parseInt(yearStr, 10);
    if (year <= 49) {
      return 2000 + year;
    } else if (year <= 999) {
      return 1900 + year;
    }
    return year;
  }
  function preprocessRFC2822(s) {
    return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
  function checkWeekday(weekdayStr, parsedInput, config) {
    if (weekdayStr) {
      var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr), weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
      if (weekdayProvided !== weekdayActual) {
        getParsingFlags(config).weekdayMismatch = true;
        config._isValid = false;
        return false;
      }
    }
    return true;
  }
  function calculateOffset(obsOffset, militaryOffset, numOffset) {
    if (obsOffset) {
      return obsOffsets[obsOffset];
    } else if (militaryOffset) {
      return 0;
    } else {
      var hm = parseInt(numOffset, 10), m = hm % 100, h = (hm - m) / 100;
      return h * 60 + m;
    }
  }
  function configFromRFC2822(config) {
    var match = rfc2822.exec(preprocessRFC2822(config._i)), parsedArray;
    if (match) {
      parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
      if (!checkWeekday(match[1], parsedArray, config)) {
        return;
      }
      config._a = parsedArray;
      config._tzm = calculateOffset(match[8], match[9], match[10]);
      config._d = createUTCDate.apply(null, config._a);
      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
      getParsingFlags(config).rfc2822 = true;
    } else {
      config._isValid = false;
    }
  }
  function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);
    if (matched !== null) {
      config._d = new Date(+matched[1]);
      return;
    }
    configFromISO(config);
    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    }
    configFromRFC2822(config);
    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    }
    if (config._strict) {
      config._isValid = false;
    } else {
      hooks.createFromInputFallback(config);
    }
  }
  hooks.createFromInputFallback = deprecate('value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' + 'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' + 'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.', function (config) {
    config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
  });
  function defaults(a, b, c) {
    if (a != null) {
      return a;
    }
    if (b != null) {
      return b;
    }
    return c;
  }
  function currentDateArray(config) {
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
      return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
  }
  function configFromArray(config) {
    var i, date, input = [], currentDate, expectedWeekday, yearToUse;
    if (config._d) {
      return;
    }
    currentDate = currentDateArray(config);
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      dayOfYearFromWeekInfo(config);
    }
    if (config._dayOfYear != null) {
      yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);
      if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
        getParsingFlags(config)._overflowDayOfYear = true;
      }
      date = createUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }
    for (; i < 7; i++) {
      config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    }
    if (config._a[HOUR] === 24 && config._a[MINUTE] === 0 && config._a[SECOND] === 0 && config._a[MILLISECOND] === 0) {
      config._nextDay = true;
      config._a[HOUR] = 0;
    }
    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();
    if (config._tzm != null) {
      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }
    if (config._nextDay) {
      config._a[HOUR] = 24;
    }
    if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
      getParsingFlags(config).weekdayMismatch = true;
    }
  }
  function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;
    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
      dow = 1;
      doy = 4;
      weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
      week = defaults(w.W, 1);
      weekday = defaults(w.E, 1);
      if (weekday < 1 || weekday > 7) {
        weekdayOverflow = true;
      }
    } else {
      dow = config._locale._week.dow;
      doy = config._locale._week.doy;
      curWeek = weekOfYear(createLocal(), dow, doy);
      weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);
      week = defaults(w.w, curWeek.week);
      if (w.d != null) {
        weekday = w.d;
        if (weekday < 0 || weekday > 6) {
          weekdayOverflow = true;
        }
      } else if (w.e != null) {
        weekday = w.e + dow;
        if (w.e < 0 || w.e > 6) {
          weekdayOverflow = true;
        }
      } else {
        weekday = dow;
      }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
      getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
      getParsingFlags(config)._overflowWeekday = true;
    } else {
      temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
  }
  hooks.ISO_8601 = function () {};
  hooks.RFC_2822 = function () {};
  function configFromStringAndFormat(config) {
    if (config._f === hooks.ISO_8601) {
      configFromISO(config);
      return;
    }
    if (config._f === hooks.RFC_2822) {
      configFromRFC2822(config);
      return;
    }
    config._a = [];
    getParsingFlags(config).empty = true;
    var string = '' + config._i, i, parsedInput, tokens, token, skipped, stringLength = string.length, totalParsedInputLength = 0, era;
    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) {
          getParsingFlags(config).unusedInput.push(skipped);
        }
        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length;
      }
      if (formatTokenFunctions[token]) {
        if (parsedInput) {
          getParsingFlags(config).empty = false;
        } else {
          getParsingFlags(config).unusedTokens.push(token);
        }
        addTimeToArrayFromToken(token, parsedInput, config);
      } else if (config._strict && !parsedInput) {
        getParsingFlags(config).unusedTokens.push(token);
      }
    }
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      getParsingFlags(config).unusedInput.push(string);
    }
    if (config._a[HOUR] <= 12 && getParsingFlags(config).bigHour === true && config._a[HOUR] > 0) {
      getParsingFlags(config).bigHour = undefined;
    }
    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);
    era = getParsingFlags(config).era;
    if (era !== null) {
      config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
    }
    configFromArray(config);
    checkOverflow(config);
  }
  function meridiemFixWrap(locale, hour, meridiem) {
    var isPm;
    if (meridiem == null) {
      return hour;
    }
    if (locale.meridiemHour != null) {
      return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
      isPm = locale.isPM(meridiem);
      if (isPm && hour < 12) {
        hour += 12;
      }
      if (!isPm && hour === 12) {
        hour = 0;
      }
      return hour;
    } else {
      return hour;
    }
  }
  function configFromStringAndArray(config) {
    var tempConfig, bestMoment, scoreToBeat, i, currentScore, validFormatFound, bestFormatIsValid = false;
    if (config._f.length === 0) {
      getParsingFlags(config).invalidFormat = true;
      config._d = new Date(NaN);
      return;
    }
    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      validFormatFound = false;
      tempConfig = copyConfig({}, config);
      if (config._useUTC != null) {
        tempConfig._useUTC = config._useUTC;
      }
      tempConfig._f = config._f[i];
      configFromStringAndFormat(tempConfig);
      if (isValid(tempConfig)) {
        validFormatFound = true;
      }
      currentScore += getParsingFlags(tempConfig).charsLeftOver;
      currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;
      getParsingFlags(tempConfig).score = currentScore;
      if (!bestFormatIsValid) {
        if (scoreToBeat == null || currentScore < scoreToBeat || validFormatFound) {
          scoreToBeat = currentScore;
          bestMoment = tempConfig;
          if (validFormatFound) {
            bestFormatIsValid = true;
          }
        }
      } else {
        if (currentScore < scoreToBeat) {
          scoreToBeat = currentScore;
          bestMoment = tempConfig;
        }
      }
    }
    extend(config, bestMoment || tempConfig);
  }
  function configFromObject(config) {
    if (config._d) {
      return;
    }
    var i = normalizeObjectUnits(config._i), dayOrDate = i.day === undefined ? i.date : i.day;
    config._a = map([i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond], function (obj) {
      return obj && parseInt(obj, 10);
    });
    configFromArray(config);
  }
  function createFromConfig(config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
      res.add(1, 'd');
      res._nextDay = undefined;
    }
    return res;
  }
  function prepareConfig(config) {
    var input = config._i, format = config._f;
    config._locale = config._locale || getLocale(config._l);
    if (input === null || format === undefined && input === '') {
      return createInvalid({
        nullInput: true
      });
    }
    if (typeof input === 'string') {
      config._i = input = config._locale.preparse(input);
    }
    if (isMoment(input)) {
      return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
      config._d = input;
    } else if (isArray(format)) {
      configFromStringAndArray(config);
    } else if (format) {
      configFromStringAndFormat(config);
    } else {
      configFromInput(config);
    }
    if (!isValid(config)) {
      config._d = null;
    }
    return config;
  }
  function configFromInput(config) {
    var input = config._i;
    if (isUndefined(input)) {
      config._d = new Date(hooks.now());
    } else if (isDate(input)) {
      config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
      configFromString(config);
    } else if (isArray(input)) {
      config._a = map(input.slice(0), function (obj) {
        return parseInt(obj, 10);
      });
      configFromArray(config);
    } else if (isObject(input)) {
      configFromObject(config);
    } else if (isNumber(input)) {
      config._d = new Date(input);
    } else {
      hooks.createFromInputFallback(config);
    }
  }
  function createLocalOrUTC(input, format, locale, strict, isUTC) {
    var c = {};
    if (format === true || format === false) {
      strict = format;
      format = undefined;
    }
    if (locale === true || locale === false) {
      strict = locale;
      locale = undefined;
    }
    if (isObject(input) && isObjectEmpty(input) || isArray(input) && input.length === 0) {
      input = undefined;
    }
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;
    return createFromConfig(c);
  }
  function createLocal(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
  }
  var prototypeMin = deprecate('moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
    var other = createLocal.apply(null, arguments);
    if (this.isValid() && other.isValid()) {
      return other < this ? this : other;
    } else {
      return createInvalid();
    }
  }), prototypeMax = deprecate('moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
    var other = createLocal.apply(null, arguments);
    if (this.isValid() && other.isValid()) {
      return other > this ? this : other;
    } else {
      return createInvalid();
    }
  });
  function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
      moments = moments[0];
    }
    if (!moments.length) {
      return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
      if (!moments[i].isValid() || moments[i][fn](res)) {
        res = moments[i];
      }
    }
    return res;
  }
  function min() {
    var args = [].slice.call(arguments, 0);
    return pickBy('isBefore', args);
  }
  function max() {
    var args = [].slice.call(arguments, 0);
    return pickBy('isAfter', args);
  }
  var now = function () {
    return Date.now ? Date.now() : +new Date();
  };
  var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];
  function isDurationValid(m) {
    var key, unitHasDecimal = false, i;
    for (key in m) {
      if (hasOwnProp(m, key) && !(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
        return false;
      }
    }
    for (i = 0; i < ordering.length; ++i) {
      if (m[ordering[i]]) {
        if (unitHasDecimal) {
          return false;
        }
        if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
          unitHasDecimal = true;
        }
      }
    }
    return true;
  }
  function isValid$1() {
    return this._isValid;
  }
  function createInvalid$1() {
    return createDuration(NaN);
  }
  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration), years = normalizedInput.year || 0, quarters = normalizedInput.quarter || 0, months = normalizedInput.month || 0, weeks = normalizedInput.week || normalizedInput.isoWeek || 0, days = normalizedInput.day || 0, hours = normalizedInput.hour || 0, minutes = normalizedInput.minute || 0, seconds = normalizedInput.second || 0, milliseconds = normalizedInput.millisecond || 0;
    this._isValid = isDurationValid(normalizedInput);
    this._milliseconds = +milliseconds + seconds * 1e3 + minutes * 6e4 + hours * 1000 * 60 * 60;
    this._days = +days + weeks * 7;
    this._months = +months + quarters * 3 + years * 12;
    this._data = {};
    this._locale = getLocale();
    this._bubble();
  }
  function isDuration(obj) {
    return obj instanceof Duration;
  }
  function absRound(number) {
    if (number < 0) {
      return Math.round(-1 * number) * -1;
    } else {
      return Math.round(number);
    }
  }
  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length), lengthDiff = Math.abs(array1.length - array2.length), diffs = 0, i;
    for (i = 0; i < len; i++) {
      if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) {
        diffs++;
      }
    }
    return diffs + lengthDiff;
  }
  function offset(token, separator) {
    addFormatToken(token, 0, 0, function () {
      var offset = this.utcOffset(), sign = '+';
      if (offset < 0) {
        offset = -offset;
        sign = '-';
      }
      return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~offset % 60, 2);
    });
  }
  offset('Z', ':');
  offset('ZZ', '');
  addRegexToken('Z', matchShortOffset);
  addRegexToken('ZZ', matchShortOffset);
  addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
  });
  var chunkOffset = /([\+\-]|\d\d)/gi;
  function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher), chunk, parts, minutes;
    if (matches === null) {
      return null;
    }
    chunk = matches[matches.length - 1] || [];
    parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    minutes = +(parts[1] * 60) + toInt(parts[2]);
    return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
  }
  function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
      res = model.clone();
      diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
      res._d.setTime(res._d.valueOf() + diff);
      hooks.updateOffset(res, false);
      return res;
    } else {
      return createLocal(input).local();
    }
  }
  function getDateOffset(m) {
    return -Math.round(m._d.getTimezoneOffset());
  }
  hooks.updateOffset = function () {};
  function getSetOffset(input, keepLocalTime, keepMinutes) {
    var offset = this._offset || 0, localAdjust;
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    if (input != null) {
      if (typeof input === 'string') {
        input = offsetFromString(matchShortOffset, input);
        if (input === null) {
          return this;
        }
      } else if (Math.abs(input) < 16 && !keepMinutes) {
        input = input * 60;
      }
      if (!this._isUTC && keepLocalTime) {
        localAdjust = getDateOffset(this);
      }
      this._offset = input;
      this._isUTC = true;
      if (localAdjust != null) {
        this.add(localAdjust, 'm');
      }
      if (offset !== input) {
        if (!keepLocalTime || this._changeInProgress) {
          addSubtract(this, createDuration(input - offset, 'm'), 1, false);
        } else if (!this._changeInProgress) {
          this._changeInProgress = true;
          hooks.updateOffset(this, true);
          this._changeInProgress = null;
        }
      }
      return this;
    } else {
      return this._isUTC ? offset : getDateOffset(this);
    }
  }
  function getSetZone(input, keepLocalTime) {
    if (input != null) {
      if (typeof input !== 'string') {
        input = -input;
      }
      this.utcOffset(input, keepLocalTime);
      return this;
    } else {
      return -this.utcOffset();
    }
  }
  function setOffsetToUTC(keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
  }
  function setOffsetToLocal(keepLocalTime) {
    if (this._isUTC) {
      this.utcOffset(0, keepLocalTime);
      this._isUTC = false;
      if (keepLocalTime) {
        this.subtract(getDateOffset(this), 'm');
      }
    }
    return this;
  }
  function setOffsetToParsedOffset() {
    if (this._tzm != null) {
      this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === 'string') {
      var tZone = offsetFromString(matchOffset, this._i);
      if (tZone != null) {
        this.utcOffset(tZone);
      } else {
        this.utcOffset(0, true);
      }
    }
    return this;
  }
  function hasAlignedHourOffset(input) {
    if (!this.isValid()) {
      return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;
    return (this.utcOffset() - input) % 60 === 0;
  }
  function isDaylightSavingTime() {
    return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset();
  }
  function isDaylightSavingTimeShifted() {
    if (!isUndefined(this._isDSTShifted)) {
      return this._isDSTShifted;
    }
    var c = {}, other;
    copyConfig(c, this);
    c = prepareConfig(c);
    if (c._a) {
      other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
      this._isDSTShifted = this.isValid() && compareArrays(c._a, other.toArray()) > 0;
    } else {
      this._isDSTShifted = false;
    }
    return this._isDSTShifted;
  }
  function isLocal() {
    return this.isValid() ? !this._isUTC : false;
  }
  function isUtcOffset() {
    return this.isValid() ? this._isUTC : false;
  }
  function isUtc() {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
  }
  var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/, isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;
  function createDuration(input, key) {
    var duration = input, match = null, sign, ret, diffRes;
    if (isDuration(input)) {
      duration = {
        ms: input._milliseconds,
        d: input._days,
        M: input._months
      };
    } else if (isNumber(input) || !isNaN(+input)) {
      duration = {};
      if (key) {
        duration[key] = +input;
      } else {
        duration.milliseconds = +input;
      }
    } else if (match = aspNetRegex.exec(input)) {
      sign = match[1] === '-' ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign
      };
    } else if (match = isoRegex.exec(input)) {
      sign = match[1] === '-' ? -1 : 1;
      duration = {
        y: parseIso(match[2], sign),
        M: parseIso(match[3], sign),
        w: parseIso(match[4], sign),
        d: parseIso(match[5], sign),
        h: parseIso(match[6], sign),
        m: parseIso(match[7], sign),
        s: parseIso(match[8], sign)
      };
    } else if (duration == null) {
      duration = {};
    } else if (typeof duration === 'object' && (('from' in duration) || ('to' in duration))) {
      diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));
      duration = {};
      duration.ms = diffRes.milliseconds;
      duration.M = diffRes.months;
    }
    ret = new Duration(duration);
    if (isDuration(input) && hasOwnProp(input, '_locale')) {
      ret._locale = input._locale;
    }
    if (isDuration(input) && hasOwnProp(input, '_isValid')) {
      ret._isValid = input._isValid;
    }
    return ret;
  }
  createDuration.fn = Duration.prototype;
  createDuration.invalid = createInvalid$1;
  function parseIso(inp, sign) {
    var res = inp && parseFloat(inp.replace(',', '.'));
    return (isNaN(res) ? 0 : res) * sign;
  }
  function positiveMomentsDifference(base, other) {
    var res = {};
    res.months = other.month() - base.month() + (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
      --res.months;
    }
    res.milliseconds = +other - +base.clone().add(res.months, 'M');
    return res;
  }
  function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
      return {
        milliseconds: 0,
        months: 0
      };
    }
    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
      res = positiveMomentsDifference(base, other);
    } else {
      res = positiveMomentsDifference(other, base);
      res.milliseconds = -res.milliseconds;
      res.months = -res.months;
    }
    return res;
  }
  function createAdder(direction, name) {
    return function (val, period) {
      var dur, tmp;
      if (period !== null && !isNaN(+period)) {
        deprecateSimple(name, 'moment().' + name + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' + 'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
        tmp = val;
        val = period;
        period = tmp;
      }
      dur = createDuration(val, period);
      addSubtract(this, dur, direction);
      return this;
    };
  }
  function addSubtract(mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds, days = absRound(duration._days), months = absRound(duration._months);
    if (!mom.isValid()) {
      return;
    }
    updateOffset = updateOffset == null ? true : updateOffset;
    if (months) {
      setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (days) {
      set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (milliseconds) {
      mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (updateOffset) {
      hooks.updateOffset(mom, days || months);
    }
  }
  var add = createAdder(1, 'add'), subtract = createAdder(-1, 'subtract');
  function isString(input) {
    return typeof input === 'string' || input instanceof String;
  }
  function isMomentInput(input) {
    return isMoment(input) || isDate(input) || isString(input) || isNumber(input) || isNumberOrStringArray(input) || isMomentInputObject(input) || input === null || input === undefined;
  }
  function isMomentInputObject(input) {
    var objectTest = isObject(input) && !isObjectEmpty(input), propertyTest = false, properties = ['years', 'year', 'y', 'months', 'month', 'M', 'days', 'day', 'd', 'dates', 'date', 'D', 'hours', 'hour', 'h', 'minutes', 'minute', 'm', 'seconds', 'second', 's', 'milliseconds', 'millisecond', 'ms'], i, property;
    for (i = 0; i < properties.length; i += 1) {
      property = properties[i];
      propertyTest = propertyTest || hasOwnProp(input, property);
    }
    return objectTest && propertyTest;
  }
  function isNumberOrStringArray(input) {
    var arrayTest = isArray(input), dataTypeTest = false;
    if (arrayTest) {
      dataTypeTest = input.filter(function (item) {
        return !isNumber(item) && isString(input);
      }).length === 0;
    }
    return arrayTest && dataTypeTest;
  }
  function isCalendarSpec(input) {
    var objectTest = isObject(input) && !isObjectEmpty(input), propertyTest = false, properties = ['sameDay', 'nextDay', 'lastDay', 'nextWeek', 'lastWeek', 'sameElse'], i, property;
    for (i = 0; i < properties.length; i += 1) {
      property = properties[i];
      propertyTest = propertyTest || hasOwnProp(input, property);
    }
    return objectTest && propertyTest;
  }
  function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' : diff < -1 ? 'lastWeek' : diff < 0 ? 'lastDay' : diff < 1 ? 'sameDay' : diff < 2 ? 'nextDay' : diff < 7 ? 'nextWeek' : 'sameElse';
  }
  function calendar$1(time, formats) {
    if (arguments.length === 1) {
      if (!arguments[0]) {
        time = undefined;
        formats = undefined;
      } else if (isMomentInput(arguments[0])) {
        time = arguments[0];
        formats = undefined;
      } else if (isCalendarSpec(arguments[0])) {
        formats = arguments[0];
        time = undefined;
      }
    }
    var now = time || createLocal(), sod = cloneWithOffset(now, this).startOf('day'), format = hooks.calendarFormat(this, sod) || 'sameElse', output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);
    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
  }
  function clone() {
    return new Moment(this);
  }
  function isAfter(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units) || 'millisecond';
    if (units === 'millisecond') {
      return this.valueOf() > localInput.valueOf();
    } else {
      return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
  }
  function isBefore(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units) || 'millisecond';
    if (units === 'millisecond') {
      return this.valueOf() < localInput.valueOf();
    } else {
      return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
  }
  function isBetween(from, to, units, inclusivity) {
    var localFrom = isMoment(from) ? from : createLocal(from), localTo = isMoment(to) ? to : createLocal(to);
    if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
      return false;
    }
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(localFrom, units) : !this.isBefore(localFrom, units)) && (inclusivity[1] === ')' ? this.isBefore(localTo, units) : !this.isAfter(localTo, units));
  }
  function isSame(input, units) {
    var localInput = isMoment(input) ? input : createLocal(input), inputMs;
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units) || 'millisecond';
    if (units === 'millisecond') {
      return this.valueOf() === localInput.valueOf();
    } else {
      inputMs = localInput.valueOf();
      return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
  }
  function isSameOrAfter(input, units) {
    return this.isSame(input, units) || this.isAfter(input, units);
  }
  function isSameOrBefore(input, units) {
    return this.isSame(input, units) || this.isBefore(input, units);
  }
  function diff(input, units, asFloat) {
    var that, zoneDelta, output;
    if (!this.isValid()) {
      return NaN;
    }
    that = cloneWithOffset(input, this);
    if (!that.isValid()) {
      return NaN;
    }
    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;
    units = normalizeUnits(units);
    switch (units) {
      case 'year':
        output = monthDiff(this, that) / 12;
        break;
      case 'month':
        output = monthDiff(this, that);
        break;
      case 'quarter':
        output = monthDiff(this, that) / 3;
        break;
      case 'second':
        output = (this - that) / 1e3;
        break;
      case 'minute':
        output = (this - that) / 6e4;
        break;
      case 'hour':
        output = (this - that) / 36e5;
        break;
      case 'day':
        output = (this - that - zoneDelta) / 864e5;
        break;
      case 'week':
        output = (this - that - zoneDelta) / 6048e5;
        break;
      default:
        output = this - that;
    }
    return asFloat ? output : absFloor(output);
  }
  function monthDiff(a, b) {
    if (a.date() < b.date()) {
      return -monthDiff(b, a);
    }
    var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()), anchor = a.clone().add(wholeMonthDiff, 'months'), anchor2, adjust;
    if (b - anchor < 0) {
      anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
      adjust = (b - anchor) / (anchor - anchor2);
    } else {
      anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
      adjust = (b - anchor) / (anchor2 - anchor);
    }
    return -(wholeMonthDiff + adjust) || 0;
  }
  hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
  hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';
  function toString() {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
  }
  function toISOString(keepOffset) {
    if (!this.isValid()) {
      return null;
    }
    var utc = keepOffset !== true, m = utc ? this.clone().utc() : this;
    if (m.year() < 0 || m.year() > 9999) {
      return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
    }
    if (isFunction(Date.prototype.toISOString)) {
      if (utc) {
        return this.toDate().toISOString();
      } else {
        return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
      }
    }
    return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
  }
  function inspect() {
    if (!this.isValid()) {
      return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment', zone = '', prefix, year, datetime, suffix;
    if (!this.isLocal()) {
      func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
      zone = 'Z';
    }
    prefix = '[' + func + '("]';
    year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
    datetime = '-MM-DD[T]HH:mm:ss.SSS';
    suffix = zone + '[")]';
    return this.format(prefix + year + datetime + suffix);
  }
  function format(inputString) {
    if (!inputString) {
      inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
  }
  function from(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
      return createDuration({
        to: this,
        from: time
      }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }
  function fromNow(withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
  }
  function to(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
      return createDuration({
        from: this,
        to: time
      }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }
  function toNow(withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
  }
  function locale(key) {
    var newLocaleData;
    if (key === undefined) {
      return this._locale._abbr;
    } else {
      newLocaleData = getLocale(key);
      if (newLocaleData != null) {
        this._locale = newLocaleData;
      }
      return this;
    }
  }
  var lang = deprecate('moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.', function (key) {
    if (key === undefined) {
      return this.localeData();
    } else {
      return this.locale(key);
    }
  });
  function localeData() {
    return this._locale;
  }
  var MS_PER_SECOND = 1000, MS_PER_MINUTE = 60 * MS_PER_SECOND, MS_PER_HOUR = 60 * MS_PER_MINUTE, MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;
  function mod$1(dividend, divisor) {
    return (dividend % divisor + divisor) % divisor;
  }
  function localStartOfDate(y, m, d) {
    if (y < 100 && y >= 0) {
      return new Date(y + 400, m, d) - MS_PER_400_YEARS;
    } else {
      return new Date(y, m, d).valueOf();
    }
  }
  function utcStartOfDate(y, m, d) {
    if (y < 100 && y >= 0) {
      return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
    } else {
      return Date.UTC(y, m, d);
    }
  }
  function startOf(units) {
    var time, startOfDate;
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond' || !this.isValid()) {
      return this;
    }
    startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;
    switch (units) {
      case 'year':
        time = startOfDate(this.year(), 0, 1);
        break;
      case 'quarter':
        time = startOfDate(this.year(), this.month() - this.month() % 3, 1);
        break;
      case 'month':
        time = startOfDate(this.year(), this.month(), 1);
        break;
      case 'week':
        time = startOfDate(this.year(), this.month(), this.date() - this.weekday());
        break;
      case 'isoWeek':
        time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1));
        break;
      case 'day':
      case 'date':
        time = startOfDate(this.year(), this.month(), this.date());
        break;
      case 'hour':
        time = this._d.valueOf();
        time -= mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR);
        break;
      case 'minute':
        time = this._d.valueOf();
        time -= mod$1(time, MS_PER_MINUTE);
        break;
      case 'second':
        time = this._d.valueOf();
        time -= mod$1(time, MS_PER_SECOND);
        break;
    }
    this._d.setTime(time);
    hooks.updateOffset(this, true);
    return this;
  }
  function endOf(units) {
    var time, startOfDate;
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond' || !this.isValid()) {
      return this;
    }
    startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;
    switch (units) {
      case 'year':
        time = startOfDate(this.year() + 1, 0, 1) - 1;
        break;
      case 'quarter':
        time = startOfDate(this.year(), this.month() - this.month() % 3 + 3, 1) - 1;
        break;
      case 'month':
        time = startOfDate(this.year(), this.month() + 1, 1) - 1;
        break;
      case 'week':
        time = startOfDate(this.year(), this.month(), this.date() - this.weekday() + 7) - 1;
        break;
      case 'isoWeek':
        time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1) + 7) - 1;
        break;
      case 'day':
      case 'date':
        time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
        break;
      case 'hour':
        time = this._d.valueOf();
        time += MS_PER_HOUR - mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR) - 1;
        break;
      case 'minute':
        time = this._d.valueOf();
        time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
        break;
      case 'second':
        time = this._d.valueOf();
        time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
        break;
    }
    this._d.setTime(time);
    hooks.updateOffset(this, true);
    return this;
  }
  function valueOf() {
    return this._d.valueOf() - (this._offset || 0) * 60000;
  }
  function unix() {
    return Math.floor(this.valueOf() / 1000);
  }
  function toDate() {
    return new Date(this.valueOf());
  }
  function toArray() {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
  }
  function toObject() {
    var m = this;
    return {
      years: m.year(),
      months: m.month(),
      date: m.date(),
      hours: m.hours(),
      minutes: m.minutes(),
      seconds: m.seconds(),
      milliseconds: m.milliseconds()
    };
  }
  function toJSON() {
    return this.isValid() ? this.toISOString() : null;
  }
  function isValid$2() {
    return isValid(this);
  }
  function parsingFlags() {
    return extend({}, getParsingFlags(this));
  }
  function invalidAt() {
    return getParsingFlags(this).overflow;
  }
  function creationData() {
    return {
      input: this._i,
      format: this._f,
      locale: this._locale,
      isUTC: this._isUTC,
      strict: this._strict
    };
  }
  addFormatToken('N', 0, 0, 'eraAbbr');
  addFormatToken('NN', 0, 0, 'eraAbbr');
  addFormatToken('NNN', 0, 0, 'eraAbbr');
  addFormatToken('NNNN', 0, 0, 'eraName');
  addFormatToken('NNNNN', 0, 0, 'eraNarrow');
  addFormatToken('y', ['y', 1], 'yo', 'eraYear');
  addFormatToken('y', ['yy', 2], 0, 'eraYear');
  addFormatToken('y', ['yyy', 3], 0, 'eraYear');
  addFormatToken('y', ['yyyy', 4], 0, 'eraYear');
  addRegexToken('N', matchEraAbbr);
  addRegexToken('NN', matchEraAbbr);
  addRegexToken('NNN', matchEraAbbr);
  addRegexToken('NNNN', matchEraName);
  addRegexToken('NNNNN', matchEraNarrow);
  addParseToken(['N', 'NN', 'NNN', 'NNNN', 'NNNNN'], function (input, array, config, token) {
    var era = config._locale.erasParse(input, token, config._strict);
    if (era) {
      getParsingFlags(config).era = era;
    } else {
      getParsingFlags(config).invalidEra = input;
    }
  });
  addRegexToken('y', matchUnsigned);
  addRegexToken('yy', matchUnsigned);
  addRegexToken('yyy', matchUnsigned);
  addRegexToken('yyyy', matchUnsigned);
  addRegexToken('yo', matchEraYearOrdinal);
  addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
  addParseToken(['yo'], function (input, array, config, token) {
    var match;
    if (config._locale._eraYearOrdinalRegex) {
      match = input.match(config._locale._eraYearOrdinalRegex);
    }
    if (config._locale.eraYearOrdinalParse) {
      array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
    } else {
      array[YEAR] = parseInt(input, 10);
    }
  });
  function localeEras(m, format) {
    var i, l, date, eras = this._eras || getLocale('en')._eras;
    for ((i = 0, l = eras.length); i < l; ++i) {
      switch (typeof eras[i].since) {
        case 'string':
          date = hooks(eras[i].since).startOf('day');
          eras[i].since = date.valueOf();
          break;
      }
      switch (typeof eras[i].until) {
        case 'undefined':
          eras[i].until = +Infinity;
          break;
        case 'string':
          date = hooks(eras[i].until).startOf('day').valueOf();
          eras[i].until = date.valueOf();
          break;
      }
    }
    return eras;
  }
  function localeErasParse(eraName, format, strict) {
    var i, l, eras = this.eras(), name, abbr, narrow;
    eraName = eraName.toUpperCase();
    for ((i = 0, l = eras.length); i < l; ++i) {
      name = eras[i].name.toUpperCase();
      abbr = eras[i].abbr.toUpperCase();
      narrow = eras[i].narrow.toUpperCase();
      if (strict) {
        switch (format) {
          case 'N':
          case 'NN':
          case 'NNN':
            if (abbr === eraName) {
              return eras[i];
            }
            break;
          case 'NNNN':
            if (name === eraName) {
              return eras[i];
            }
            break;
          case 'NNNNN':
            if (narrow === eraName) {
              return eras[i];
            }
            break;
        }
      } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
        return eras[i];
      }
    }
  }
  function localeErasConvertYear(era, year) {
    var dir = era.since <= era.until ? +1 : -1;
    if (year === undefined) {
      return hooks(era.since).year();
    } else {
      return hooks(era.since).year() + (year - era.offset) * dir;
    }
  }
  function getEraName() {
    var i, l, val, eras = this.localeData().eras();
    for ((i = 0, l = eras.length); i < l; ++i) {
      val = this.clone().startOf('day').valueOf();
      if (eras[i].since <= val && val <= eras[i].until) {
        return eras[i].name;
      }
      if (eras[i].until <= val && val <= eras[i].since) {
        return eras[i].name;
      }
    }
    return '';
  }
  function getEraNarrow() {
    var i, l, val, eras = this.localeData().eras();
    for ((i = 0, l = eras.length); i < l; ++i) {
      val = this.clone().startOf('day').valueOf();
      if (eras[i].since <= val && val <= eras[i].until) {
        return eras[i].narrow;
      }
      if (eras[i].until <= val && val <= eras[i].since) {
        return eras[i].narrow;
      }
    }
    return '';
  }
  function getEraAbbr() {
    var i, l, val, eras = this.localeData().eras();
    for ((i = 0, l = eras.length); i < l; ++i) {
      val = this.clone().startOf('day').valueOf();
      if (eras[i].since <= val && val <= eras[i].until) {
        return eras[i].abbr;
      }
      if (eras[i].until <= val && val <= eras[i].since) {
        return eras[i].abbr;
      }
    }
    return '';
  }
  function getEraYear() {
    var i, l, dir, val, eras = this.localeData().eras();
    for ((i = 0, l = eras.length); i < l; ++i) {
      dir = eras[i].since <= eras[i].until ? +1 : -1;
      val = this.clone().startOf('day').valueOf();
      if (eras[i].since <= val && val <= eras[i].until || eras[i].until <= val && val <= eras[i].since) {
        return (this.year() - hooks(eras[i].since).year()) * dir + eras[i].offset;
      }
    }
    return this.year();
  }
  function erasNameRegex(isStrict) {
    if (!hasOwnProp(this, '_erasNameRegex')) {
      computeErasParse.call(this);
    }
    return isStrict ? this._erasNameRegex : this._erasRegex;
  }
  function erasAbbrRegex(isStrict) {
    if (!hasOwnProp(this, '_erasAbbrRegex')) {
      computeErasParse.call(this);
    }
    return isStrict ? this._erasAbbrRegex : this._erasRegex;
  }
  function erasNarrowRegex(isStrict) {
    if (!hasOwnProp(this, '_erasNarrowRegex')) {
      computeErasParse.call(this);
    }
    return isStrict ? this._erasNarrowRegex : this._erasRegex;
  }
  function matchEraAbbr(isStrict, locale) {
    return locale.erasAbbrRegex(isStrict);
  }
  function matchEraName(isStrict, locale) {
    return locale.erasNameRegex(isStrict);
  }
  function matchEraNarrow(isStrict, locale) {
    return locale.erasNarrowRegex(isStrict);
  }
  function matchEraYearOrdinal(isStrict, locale) {
    return locale._eraYearOrdinalRegex || matchUnsigned;
  }
  function computeErasParse() {
    var abbrPieces = [], namePieces = [], narrowPieces = [], mixedPieces = [], i, l, eras = this.eras();
    for ((i = 0, l = eras.length); i < l; ++i) {
      namePieces.push(regexEscape(eras[i].name));
      abbrPieces.push(regexEscape(eras[i].abbr));
      narrowPieces.push(regexEscape(eras[i].narrow));
      mixedPieces.push(regexEscape(eras[i].name));
      mixedPieces.push(regexEscape(eras[i].abbr));
      mixedPieces.push(regexEscape(eras[i].narrow));
    }
    this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
    this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
    this._erasNarrowRegex = new RegExp('^(' + narrowPieces.join('|') + ')', 'i');
  }
  addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
  });
  addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
  });
  function addWeekYearFormatToken(token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
  }
  addWeekYearFormatToken('gggg', 'weekYear');
  addWeekYearFormatToken('ggggg', 'weekYear');
  addWeekYearFormatToken('GGGG', 'isoWeekYear');
  addWeekYearFormatToken('GGGGG', 'isoWeekYear');
  addUnitAlias('weekYear', 'gg');
  addUnitAlias('isoWeekYear', 'GG');
  addUnitPriority('weekYear', 1);
  addUnitPriority('isoWeekYear', 1);
  addRegexToken('G', matchSigned);
  addRegexToken('g', matchSigned);
  addRegexToken('GG', match1to2, match2);
  addRegexToken('gg', match1to2, match2);
  addRegexToken('GGGG', match1to4, match4);
  addRegexToken('gggg', match1to4, match4);
  addRegexToken('GGGGG', match1to6, match6);
  addRegexToken('ggggg', match1to6, match6);
  addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
  });
  addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
  });
  function getSetWeekYear(input) {
    return getSetWeekYearHelper.call(this, input, this.week(), this.weekday(), this.localeData()._week.dow, this.localeData()._week.doy);
  }
  function getSetISOWeekYear(input) {
    return getSetWeekYearHelper.call(this, input, this.isoWeek(), this.isoWeekday(), 1, 4);
  }
  function getISOWeeksInYear() {
    return weeksInYear(this.year(), 1, 4);
  }
  function getISOWeeksInISOWeekYear() {
    return weeksInYear(this.isoWeekYear(), 1, 4);
  }
  function getWeeksInYear() {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
  }
  function getWeeksInWeekYear() {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
  }
  function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
      return weekOfYear(this, dow, doy).year;
    } else {
      weeksTarget = weeksInYear(input, dow, doy);
      if (week > weeksTarget) {
        week = weeksTarget;
      }
      return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
  }
  function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy), date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);
    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
  }
  addFormatToken('Q', 0, 'Qo', 'quarter');
  addUnitAlias('quarter', 'Q');
  addUnitPriority('quarter', 7);
  addRegexToken('Q', match1);
  addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
  });
  function getSetQuarter(input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
  }
  addFormatToken('D', ['DD', 2], 'Do', 'date');
  addUnitAlias('date', 'D');
  addUnitPriority('date', 9);
  addRegexToken('D', match1to2);
  addRegexToken('DD', match1to2, match2);
  addRegexToken('Do', function (isStrict, locale) {
    return isStrict ? locale._dayOfMonthOrdinalParse || locale._ordinalParse : locale._dayOfMonthOrdinalParseLenient;
  });
  addParseToken(['D', 'DD'], DATE);
  addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0]);
  });
  var getSetDayOfMonth = makeGetSet('Date', true);
  addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');
  addUnitAlias('dayOfYear', 'DDD');
  addUnitPriority('dayOfYear', 4);
  addRegexToken('DDD', match1to3);
  addRegexToken('DDDD', match3);
  addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
  });
  function getSetDayOfYear(input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
  }
  addFormatToken('m', ['mm', 2], 0, 'minute');
  addUnitAlias('minute', 'm');
  addUnitPriority('minute', 14);
  addRegexToken('m', match1to2);
  addRegexToken('mm', match1to2, match2);
  addParseToken(['m', 'mm'], MINUTE);
  var getSetMinute = makeGetSet('Minutes', false);
  addFormatToken('s', ['ss', 2], 0, 'second');
  addUnitAlias('second', 's');
  addUnitPriority('second', 15);
  addRegexToken('s', match1to2);
  addRegexToken('ss', match1to2, match2);
  addParseToken(['s', 'ss'], SECOND);
  var getSetSecond = makeGetSet('Seconds', false);
  addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
  });
  addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
  });
  addFormatToken(0, ['SSS', 3], 0, 'millisecond');
  addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
  });
  addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
  });
  addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
  });
  addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
  });
  addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
  });
  addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
  });
  addUnitAlias('millisecond', 'ms');
  addUnitPriority('millisecond', 16);
  addRegexToken('S', match1to3, match1);
  addRegexToken('SS', match1to3, match2);
  addRegexToken('SSS', match1to3, match3);
  var token, getSetMillisecond;
  for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
  }
  function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
  }
  for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
  }
  getSetMillisecond = makeGetSet('Milliseconds', false);
  addFormatToken('z', 0, 0, 'zoneAbbr');
  addFormatToken('zz', 0, 0, 'zoneName');
  function getZoneAbbr() {
    return this._isUTC ? 'UTC' : '';
  }
  function getZoneName() {
    return this._isUTC ? 'Coordinated Universal Time' : '';
  }
  var proto = Moment.prototype;
  proto.add = add;
  proto.calendar = calendar$1;
  proto.clone = clone;
  proto.diff = diff;
  proto.endOf = endOf;
  proto.format = format;
  proto.from = from;
  proto.fromNow = fromNow;
  proto.to = to;
  proto.toNow = toNow;
  proto.get = stringGet;
  proto.invalidAt = invalidAt;
  proto.isAfter = isAfter;
  proto.isBefore = isBefore;
  proto.isBetween = isBetween;
  proto.isSame = isSame;
  proto.isSameOrAfter = isSameOrAfter;
  proto.isSameOrBefore = isSameOrBefore;
  proto.isValid = isValid$2;
  proto.lang = lang;
  proto.locale = locale;
  proto.localeData = localeData;
  proto.max = prototypeMax;
  proto.min = prototypeMin;
  proto.parsingFlags = parsingFlags;
  proto.set = stringSet;
  proto.startOf = startOf;
  proto.subtract = subtract;
  proto.toArray = toArray;
  proto.toObject = toObject;
  proto.toDate = toDate;
  proto.toISOString = toISOString;
  proto.inspect = inspect;
  if (typeof Symbol !== 'undefined' && Symbol.for != null) {
    proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
      return 'Moment<' + this.format() + '>';
    };
  }
  proto.toJSON = toJSON;
  proto.toString = toString;
  proto.unix = unix;
  proto.valueOf = valueOf;
  proto.creationData = creationData;
  proto.eraName = getEraName;
  proto.eraNarrow = getEraNarrow;
  proto.eraAbbr = getEraAbbr;
  proto.eraYear = getEraYear;
  proto.year = getSetYear;
  proto.isLeapYear = getIsLeapYear;
  proto.weekYear = getSetWeekYear;
  proto.isoWeekYear = getSetISOWeekYear;
  proto.quarter = proto.quarters = getSetQuarter;
  proto.month = getSetMonth;
  proto.daysInMonth = getDaysInMonth;
  proto.week = proto.weeks = getSetWeek;
  proto.isoWeek = proto.isoWeeks = getSetISOWeek;
  proto.weeksInYear = getWeeksInYear;
  proto.weeksInWeekYear = getWeeksInWeekYear;
  proto.isoWeeksInYear = getISOWeeksInYear;
  proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
  proto.date = getSetDayOfMonth;
  proto.day = proto.days = getSetDayOfWeek;
  proto.weekday = getSetLocaleDayOfWeek;
  proto.isoWeekday = getSetISODayOfWeek;
  proto.dayOfYear = getSetDayOfYear;
  proto.hour = proto.hours = getSetHour;
  proto.minute = proto.minutes = getSetMinute;
  proto.second = proto.seconds = getSetSecond;
  proto.millisecond = proto.milliseconds = getSetMillisecond;
  proto.utcOffset = getSetOffset;
  proto.utc = setOffsetToUTC;
  proto.local = setOffsetToLocal;
  proto.parseZone = setOffsetToParsedOffset;
  proto.hasAlignedHourOffset = hasAlignedHourOffset;
  proto.isDST = isDaylightSavingTime;
  proto.isLocal = isLocal;
  proto.isUtcOffset = isUtcOffset;
  proto.isUtc = isUtc;
  proto.isUTC = isUtc;
  proto.zoneAbbr = getZoneAbbr;
  proto.zoneName = getZoneName;
  proto.dates = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
  proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
  proto.years = deprecate('years accessor is deprecated. Use year instead', getSetYear);
  proto.zone = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
  proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);
  function createUnix(input) {
    return createLocal(input * 1000);
  }
  function createInZone() {
    return createLocal.apply(null, arguments).parseZone();
  }
  function preParsePostFormat(string) {
    return string;
  }
  var proto$1 = Locale.prototype;
  proto$1.calendar = calendar;
  proto$1.longDateFormat = longDateFormat;
  proto$1.invalidDate = invalidDate;
  proto$1.ordinal = ordinal;
  proto$1.preparse = preParsePostFormat;
  proto$1.postformat = preParsePostFormat;
  proto$1.relativeTime = relativeTime;
  proto$1.pastFuture = pastFuture;
  proto$1.set = set;
  proto$1.eras = localeEras;
  proto$1.erasParse = localeErasParse;
  proto$1.erasConvertYear = localeErasConvertYear;
  proto$1.erasAbbrRegex = erasAbbrRegex;
  proto$1.erasNameRegex = erasNameRegex;
  proto$1.erasNarrowRegex = erasNarrowRegex;
  proto$1.months = localeMonths;
  proto$1.monthsShort = localeMonthsShort;
  proto$1.monthsParse = localeMonthsParse;
  proto$1.monthsRegex = monthsRegex;
  proto$1.monthsShortRegex = monthsShortRegex;
  proto$1.week = localeWeek;
  proto$1.firstDayOfYear = localeFirstDayOfYear;
  proto$1.firstDayOfWeek = localeFirstDayOfWeek;
  proto$1.weekdays = localeWeekdays;
  proto$1.weekdaysMin = localeWeekdaysMin;
  proto$1.weekdaysShort = localeWeekdaysShort;
  proto$1.weekdaysParse = localeWeekdaysParse;
  proto$1.weekdaysRegex = weekdaysRegex;
  proto$1.weekdaysShortRegex = weekdaysShortRegex;
  proto$1.weekdaysMinRegex = weekdaysMinRegex;
  proto$1.isPM = localeIsPM;
  proto$1.meridiem = localeMeridiem;
  function get$1(format, index, field, setter) {
    var locale = getLocale(), utc = createUTC().set(setter, index);
    return locale[field](utc, format);
  }
  function listMonthsImpl(format, index, field) {
    if (isNumber(format)) {
      index = format;
      format = undefined;
    }
    format = format || '';
    if (index != null) {
      return get$1(format, index, field, 'month');
    }
    var i, out = [];
    for (i = 0; i < 12; i++) {
      out[i] = get$1(format, i, field, 'month');
    }
    return out;
  }
  function listWeekdaysImpl(localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
      if (isNumber(format)) {
        index = format;
        format = undefined;
      }
      format = format || '';
    } else {
      format = localeSorted;
      index = format;
      localeSorted = false;
      if (isNumber(format)) {
        index = format;
        format = undefined;
      }
      format = format || '';
    }
    var locale = getLocale(), shift = localeSorted ? locale._week.dow : 0, i, out = [];
    if (index != null) {
      return get$1(format, (index + shift) % 7, field, 'day');
    }
    for (i = 0; i < 7; i++) {
      out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
  }
  function listMonths(format, index) {
    return listMonthsImpl(format, index, 'months');
  }
  function listMonthsShort(format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
  }
  function listWeekdays(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
  }
  function listWeekdaysShort(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
  }
  function listWeekdaysMin(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
  }
  getSetGlobalLocale('en', {
    eras: [{
      since: '0001-01-01',
      until: +Infinity,
      offset: 1,
      name: 'Anno Domini',
      narrow: 'AD',
      abbr: 'AD'
    }, {
      since: '0000-12-31',
      until: -Infinity,
      offset: 1,
      name: 'Before Christ',
      narrow: 'BC',
      abbr: 'BC'
    }],
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal: function (number) {
      var b = number % 10, output = toInt(number % 100 / 10) === 1 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th';
      return number + output;
    }
  });
  hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
  hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);
  var mathAbs = Math.abs;
  function abs() {
    var data = this._data;
    this._milliseconds = mathAbs(this._milliseconds);
    this._days = mathAbs(this._days);
    this._months = mathAbs(this._months);
    data.milliseconds = mathAbs(data.milliseconds);
    data.seconds = mathAbs(data.seconds);
    data.minutes = mathAbs(data.minutes);
    data.hours = mathAbs(data.hours);
    data.months = mathAbs(data.months);
    data.years = mathAbs(data.years);
    return this;
  }
  function addSubtract$1(duration, input, value, direction) {
    var other = createDuration(input, value);
    duration._milliseconds += direction * other._milliseconds;
    duration._days += direction * other._days;
    duration._months += direction * other._months;
    return duration._bubble();
  }
  function add$1(input, value) {
    return addSubtract$1(this, input, value, 1);
  }
  function subtract$1(input, value) {
    return addSubtract$1(this, input, value, -1);
  }
  function absCeil(number) {
    if (number < 0) {
      return Math.floor(number);
    } else {
      return Math.ceil(number);
    }
  }
  function bubble() {
    var milliseconds = this._milliseconds, days = this._days, months = this._months, data = this._data, seconds, minutes, hours, years, monthsFromDays;
    if (!(milliseconds >= 0 && days >= 0 && months >= 0 || milliseconds <= 0 && days <= 0 && months <= 0)) {
      milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
      days = 0;
      months = 0;
    }
    data.milliseconds = milliseconds % 1000;
    seconds = absFloor(milliseconds / 1000);
    data.seconds = seconds % 60;
    minutes = absFloor(seconds / 60);
    data.minutes = minutes % 60;
    hours = absFloor(minutes / 60);
    data.hours = hours % 24;
    days += absFloor(hours / 24);
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));
    years = absFloor(months / 12);
    months %= 12;
    data.days = days;
    data.months = months;
    data.years = years;
    return this;
  }
  function daysToMonths(days) {
    return days * 4800 / 146097;
  }
  function monthsToDays(months) {
    return months * 146097 / 4800;
  }
  function as(units) {
    if (!this.isValid()) {
      return NaN;
    }
    var days, months, milliseconds = this._milliseconds;
    units = normalizeUnits(units);
    if (units === 'month' || units === 'quarter' || units === 'year') {
      days = this._days + milliseconds / 864e5;
      months = this._months + daysToMonths(days);
      switch (units) {
        case 'month':
          return months;
        case 'quarter':
          return months / 3;
        case 'year':
          return months / 12;
      }
    } else {
      days = this._days + Math.round(monthsToDays(this._months));
      switch (units) {
        case 'week':
          return days / 7 + milliseconds / 6048e5;
        case 'day':
          return days + milliseconds / 864e5;
        case 'hour':
          return days * 24 + milliseconds / 36e5;
        case 'minute':
          return days * 1440 + milliseconds / 6e4;
        case 'second':
          return days * 86400 + milliseconds / 1000;
        case 'millisecond':
          return Math.floor(days * 864e5) + milliseconds;
        default:
          throw new Error('Unknown unit ' + units);
      }
    }
  }
  function valueOf$1() {
    if (!this.isValid()) {
      return NaN;
    }
    return this._milliseconds + this._days * 864e5 + this._months % 12 * 2592e6 + toInt(this._months / 12) * 31536e6;
  }
  function makeAs(alias) {
    return function () {
      return this.as(alias);
    };
  }
  var asMilliseconds = makeAs('ms'), asSeconds = makeAs('s'), asMinutes = makeAs('m'), asHours = makeAs('h'), asDays = makeAs('d'), asWeeks = makeAs('w'), asMonths = makeAs('M'), asQuarters = makeAs('Q'), asYears = makeAs('y');
  function clone$1() {
    return createDuration(this);
  }
  function get$2(units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + 's']() : NaN;
  }
  function makeGetter(name) {
    return function () {
      return this.isValid() ? this._data[name] : NaN;
    };
  }
  var milliseconds = makeGetter('milliseconds'), seconds = makeGetter('seconds'), minutes = makeGetter('minutes'), hours = makeGetter('hours'), days = makeGetter('days'), months = makeGetter('months'), years = makeGetter('years');
  function weeks() {
    return absFloor(this.days() / 7);
  }
  var round = Math.round, thresholds = {
    ss: 44,
    s: 45,
    m: 45,
    h: 22,
    d: 26,
    w: null,
    M: 11
  };
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }
  function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
    var duration = createDuration(posNegDuration).abs(), seconds = round(duration.as('s')), minutes = round(duration.as('m')), hours = round(duration.as('h')), days = round(duration.as('d')), months = round(duration.as('M')), weeks = round(duration.as('w')), years = round(duration.as('y')), a = seconds <= thresholds.ss && ['s', seconds] || seconds < thresholds.s && ['ss', seconds] || minutes <= 1 && ['m'] || minutes < thresholds.m && ['mm', minutes] || hours <= 1 && ['h'] || hours < thresholds.h && ['hh', hours] || days <= 1 && ['d'] || days < thresholds.d && ['dd', days];
    if (thresholds.w != null) {
      a = a || weeks <= 1 && ['w'] || weeks < thresholds.w && ['ww', weeks];
    }
    a = a || months <= 1 && ['M'] || months < thresholds.M && ['MM', months] || years <= 1 && ['y'] || ['yy', years];
    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
  }
  function getSetRelativeTimeRounding(roundingFunction) {
    if (roundingFunction === undefined) {
      return round;
    }
    if (typeof roundingFunction === 'function') {
      round = roundingFunction;
      return true;
    }
    return false;
  }
  function getSetRelativeTimeThreshold(threshold, limit) {
    if (thresholds[threshold] === undefined) {
      return false;
    }
    if (limit === undefined) {
      return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    if (threshold === 's') {
      thresholds.ss = limit - 1;
    }
    return true;
  }
  function humanize(argWithSuffix, argThresholds) {
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }
    var withSuffix = false, th = thresholds, locale, output;
    if (typeof argWithSuffix === 'object') {
      argThresholds = argWithSuffix;
      argWithSuffix = false;
    }
    if (typeof argWithSuffix === 'boolean') {
      withSuffix = argWithSuffix;
    }
    if (typeof argThresholds === 'object') {
      th = Object.assign({}, thresholds, argThresholds);
      if (argThresholds.s != null && argThresholds.ss == null) {
        th.ss = argThresholds.s - 1;
      }
    }
    locale = this.localeData();
    output = relativeTime$1(this, !withSuffix, th, locale);
    if (withSuffix) {
      output = locale.pastFuture(+this, output);
    }
    return locale.postformat(output);
  }
  var abs$1 = Math.abs;
  function sign(x) {
    return (x > 0) - (x < 0) || +x;
  }
  function toISOString$1() {
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }
    var seconds = abs$1(this._milliseconds) / 1000, days = abs$1(this._days), months = abs$1(this._months), minutes, hours, years, s, total = this.asSeconds(), totalSign, ymSign, daysSign, hmsSign;
    if (!total) {
      return 'P0D';
    }
    minutes = absFloor(seconds / 60);
    hours = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;
    years = absFloor(months / 12);
    months %= 12;
    s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
    totalSign = total < 0 ? '-' : '';
    ymSign = sign(this._months) !== sign(total) ? '-' : '';
    daysSign = sign(this._days) !== sign(total) ? '-' : '';
    hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';
    return totalSign + 'P' + (years ? ymSign + years + 'Y' : '') + (months ? ymSign + months + 'M' : '') + (days ? daysSign + days + 'D' : '') + (hours || minutes || seconds ? 'T' : '') + (hours ? hmsSign + hours + 'H' : '') + (minutes ? hmsSign + minutes + 'M' : '') + (seconds ? hmsSign + s + 'S' : '');
  }
  var proto$2 = Duration.prototype;
  proto$2.isValid = isValid$1;
  proto$2.abs = abs;
  proto$2.add = add$1;
  proto$2.subtract = subtract$1;
  proto$2.as = as;
  proto$2.asMilliseconds = asMilliseconds;
  proto$2.asSeconds = asSeconds;
  proto$2.asMinutes = asMinutes;
  proto$2.asHours = asHours;
  proto$2.asDays = asDays;
  proto$2.asWeeks = asWeeks;
  proto$2.asMonths = asMonths;
  proto$2.asQuarters = asQuarters;
  proto$2.asYears = asYears;
  proto$2.valueOf = valueOf$1;
  proto$2._bubble = bubble;
  proto$2.clone = clone$1;
  proto$2.get = get$2;
  proto$2.milliseconds = milliseconds;
  proto$2.seconds = seconds;
  proto$2.minutes = minutes;
  proto$2.hours = hours;
  proto$2.days = days;
  proto$2.weeks = weeks;
  proto$2.months = months;
  proto$2.years = years;
  proto$2.humanize = humanize;
  proto$2.toISOString = toISOString$1;
  proto$2.toString = toISOString$1;
  proto$2.toJSON = toISOString$1;
  proto$2.locale = locale;
  proto$2.localeData = localeData;
  proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
  proto$2.lang = lang;
  addFormatToken('X', 0, 0, 'unix');
  addFormatToken('x', 0, 0, 'valueOf');
  addRegexToken('x', matchSigned);
  addRegexToken('X', matchTimestamp);
  addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input) * 1000);
  });
  addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
  });
  hooks.version = '2.29.1';
  setHookCallback(createLocal);
  hooks.fn = proto;
  hooks.min = min;
  hooks.max = max;
  hooks.now = now;
  hooks.utc = createUTC;
  hooks.unix = createUnix;
  hooks.months = listMonths;
  hooks.isDate = isDate;
  hooks.locale = getSetGlobalLocale;
  hooks.invalid = createInvalid;
  hooks.duration = createDuration;
  hooks.isMoment = isMoment;
  hooks.weekdays = listWeekdays;
  hooks.parseZone = createInZone;
  hooks.localeData = getLocale;
  hooks.isDuration = isDuration;
  hooks.monthsShort = listMonthsShort;
  hooks.weekdaysMin = listWeekdaysMin;
  hooks.defineLocale = defineLocale;
  hooks.updateLocale = updateLocale;
  hooks.locales = listLocales;
  hooks.weekdaysShort = listWeekdaysShort;
  hooks.normalizeUnits = normalizeUnits;
  hooks.relativeTimeRounding = getSetRelativeTimeRounding;
  hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
  hooks.calendarFormat = getCalendarFormat;
  hooks.prototype = proto;
  hooks.HTML5_FMT = {
    DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',
    DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',
    DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm',
    TIME_SECONDS: 'HH:mm:ss',
    TIME_MS: 'HH:mm:ss.SSS',
    WEEK: 'GGGG-[W]WW',
    MONTH: 'YYYY-MM'
  };
  return hooks;
});

},

// node_modules/chart.js/dist/Chart.js @6
6: function(__fusereq, exports, module){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory((function () {
    try {
      return __fusereq(7);
    } catch (e) {}
  })()) : typeof define === 'function' && define.amd ? define(['require'], function (require) {
    return factory((function () {
      try {
        return require('moment');
      } catch (e) {}
    })());
  }) : (global = global || self, global.Chart = factory(global.moment));
})(this, function (moment) {
  'use strict';
  moment = moment && moment.hasOwnProperty('default') ? moment['default'] : moment;
  function createCommonjsModule(fn, module) {
    return (module = {
      exports: {}
    }, fn(module, module.exports), module.exports);
  }
  function getCjsExportFromNamespace(n) {
    return n && n['default'] || n;
  }
  var colorName = {
    "aliceblue": [240, 248, 255],
    "antiquewhite": [250, 235, 215],
    "aqua": [0, 255, 255],
    "aquamarine": [127, 255, 212],
    "azure": [240, 255, 255],
    "beige": [245, 245, 220],
    "bisque": [255, 228, 196],
    "black": [0, 0, 0],
    "blanchedalmond": [255, 235, 205],
    "blue": [0, 0, 255],
    "blueviolet": [138, 43, 226],
    "brown": [165, 42, 42],
    "burlywood": [222, 184, 135],
    "cadetblue": [95, 158, 160],
    "chartreuse": [127, 255, 0],
    "chocolate": [210, 105, 30],
    "coral": [255, 127, 80],
    "cornflowerblue": [100, 149, 237],
    "cornsilk": [255, 248, 220],
    "crimson": [220, 20, 60],
    "cyan": [0, 255, 255],
    "darkblue": [0, 0, 139],
    "darkcyan": [0, 139, 139],
    "darkgoldenrod": [184, 134, 11],
    "darkgray": [169, 169, 169],
    "darkgreen": [0, 100, 0],
    "darkgrey": [169, 169, 169],
    "darkkhaki": [189, 183, 107],
    "darkmagenta": [139, 0, 139],
    "darkolivegreen": [85, 107, 47],
    "darkorange": [255, 140, 0],
    "darkorchid": [153, 50, 204],
    "darkred": [139, 0, 0],
    "darksalmon": [233, 150, 122],
    "darkseagreen": [143, 188, 143],
    "darkslateblue": [72, 61, 139],
    "darkslategray": [47, 79, 79],
    "darkslategrey": [47, 79, 79],
    "darkturquoise": [0, 206, 209],
    "darkviolet": [148, 0, 211],
    "deeppink": [255, 20, 147],
    "deepskyblue": [0, 191, 255],
    "dimgray": [105, 105, 105],
    "dimgrey": [105, 105, 105],
    "dodgerblue": [30, 144, 255],
    "firebrick": [178, 34, 34],
    "floralwhite": [255, 250, 240],
    "forestgreen": [34, 139, 34],
    "fuchsia": [255, 0, 255],
    "gainsboro": [220, 220, 220],
    "ghostwhite": [248, 248, 255],
    "gold": [255, 215, 0],
    "goldenrod": [218, 165, 32],
    "gray": [128, 128, 128],
    "green": [0, 128, 0],
    "greenyellow": [173, 255, 47],
    "grey": [128, 128, 128],
    "honeydew": [240, 255, 240],
    "hotpink": [255, 105, 180],
    "indianred": [205, 92, 92],
    "indigo": [75, 0, 130],
    "ivory": [255, 255, 240],
    "khaki": [240, 230, 140],
    "lavender": [230, 230, 250],
    "lavenderblush": [255, 240, 245],
    "lawngreen": [124, 252, 0],
    "lemonchiffon": [255, 250, 205],
    "lightblue": [173, 216, 230],
    "lightcoral": [240, 128, 128],
    "lightcyan": [224, 255, 255],
    "lightgoldenrodyellow": [250, 250, 210],
    "lightgray": [211, 211, 211],
    "lightgreen": [144, 238, 144],
    "lightgrey": [211, 211, 211],
    "lightpink": [255, 182, 193],
    "lightsalmon": [255, 160, 122],
    "lightseagreen": [32, 178, 170],
    "lightskyblue": [135, 206, 250],
    "lightslategray": [119, 136, 153],
    "lightslategrey": [119, 136, 153],
    "lightsteelblue": [176, 196, 222],
    "lightyellow": [255, 255, 224],
    "lime": [0, 255, 0],
    "limegreen": [50, 205, 50],
    "linen": [250, 240, 230],
    "magenta": [255, 0, 255],
    "maroon": [128, 0, 0],
    "mediumaquamarine": [102, 205, 170],
    "mediumblue": [0, 0, 205],
    "mediumorchid": [186, 85, 211],
    "mediumpurple": [147, 112, 219],
    "mediumseagreen": [60, 179, 113],
    "mediumslateblue": [123, 104, 238],
    "mediumspringgreen": [0, 250, 154],
    "mediumturquoise": [72, 209, 204],
    "mediumvioletred": [199, 21, 133],
    "midnightblue": [25, 25, 112],
    "mintcream": [245, 255, 250],
    "mistyrose": [255, 228, 225],
    "moccasin": [255, 228, 181],
    "navajowhite": [255, 222, 173],
    "navy": [0, 0, 128],
    "oldlace": [253, 245, 230],
    "olive": [128, 128, 0],
    "olivedrab": [107, 142, 35],
    "orange": [255, 165, 0],
    "orangered": [255, 69, 0],
    "orchid": [218, 112, 214],
    "palegoldenrod": [238, 232, 170],
    "palegreen": [152, 251, 152],
    "paleturquoise": [175, 238, 238],
    "palevioletred": [219, 112, 147],
    "papayawhip": [255, 239, 213],
    "peachpuff": [255, 218, 185],
    "peru": [205, 133, 63],
    "pink": [255, 192, 203],
    "plum": [221, 160, 221],
    "powderblue": [176, 224, 230],
    "purple": [128, 0, 128],
    "rebeccapurple": [102, 51, 153],
    "red": [255, 0, 0],
    "rosybrown": [188, 143, 143],
    "royalblue": [65, 105, 225],
    "saddlebrown": [139, 69, 19],
    "salmon": [250, 128, 114],
    "sandybrown": [244, 164, 96],
    "seagreen": [46, 139, 87],
    "seashell": [255, 245, 238],
    "sienna": [160, 82, 45],
    "silver": [192, 192, 192],
    "skyblue": [135, 206, 235],
    "slateblue": [106, 90, 205],
    "slategray": [112, 128, 144],
    "slategrey": [112, 128, 144],
    "snow": [255, 250, 250],
    "springgreen": [0, 255, 127],
    "steelblue": [70, 130, 180],
    "tan": [210, 180, 140],
    "teal": [0, 128, 128],
    "thistle": [216, 191, 216],
    "tomato": [255, 99, 71],
    "turquoise": [64, 224, 208],
    "violet": [238, 130, 238],
    "wheat": [245, 222, 179],
    "white": [255, 255, 255],
    "whitesmoke": [245, 245, 245],
    "yellow": [255, 255, 0],
    "yellowgreen": [154, 205, 50]
  };
  var conversions = createCommonjsModule(function (module) {
    var reverseKeywords = {};
    for (var key in colorName) {
      if (colorName.hasOwnProperty(key)) {
        reverseKeywords[colorName[key]] = key;
      }
    }
    var convert = module.exports = {
      rgb: {
        channels: 3,
        labels: 'rgb'
      },
      hsl: {
        channels: 3,
        labels: 'hsl'
      },
      hsv: {
        channels: 3,
        labels: 'hsv'
      },
      hwb: {
        channels: 3,
        labels: 'hwb'
      },
      cmyk: {
        channels: 4,
        labels: 'cmyk'
      },
      xyz: {
        channels: 3,
        labels: 'xyz'
      },
      lab: {
        channels: 3,
        labels: 'lab'
      },
      lch: {
        channels: 3,
        labels: 'lch'
      },
      hex: {
        channels: 1,
        labels: ['hex']
      },
      keyword: {
        channels: 1,
        labels: ['keyword']
      },
      ansi16: {
        channels: 1,
        labels: ['ansi16']
      },
      ansi256: {
        channels: 1,
        labels: ['ansi256']
      },
      hcg: {
        channels: 3,
        labels: ['h', 'c', 'g']
      },
      apple: {
        channels: 3,
        labels: ['r16', 'g16', 'b16']
      },
      gray: {
        channels: 1,
        labels: ['gray']
      }
    };
    for (var model in convert) {
      if (convert.hasOwnProperty(model)) {
        if (!(('channels' in convert[model]))) {
          throw new Error('missing channels property: ' + model);
        }
        if (!(('labels' in convert[model]))) {
          throw new Error('missing channel labels property: ' + model);
        }
        if (convert[model].labels.length !== convert[model].channels) {
          throw new Error('channel and label counts mismatch: ' + model);
        }
        var channels = convert[model].channels;
        var labels = convert[model].labels;
        delete convert[model].channels;
        delete convert[model].labels;
        Object.defineProperty(convert[model], 'channels', {
          value: channels
        });
        Object.defineProperty(convert[model], 'labels', {
          value: labels
        });
      }
    }
    convert.rgb.hsl = function (rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var min = Math.min(r, g, b);
      var max = Math.max(r, g, b);
      var delta = max - min;
      var h;
      var s;
      var l;
      if (max === min) {
        h = 0;
      } else if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert.rgb.hsv = function (rgb) {
      var rdif;
      var gdif;
      var bdif;
      var h;
      var s;
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var v = Math.max(r, g, b);
      var diff = v - Math.min(r, g, b);
      var diffc = function (c) {
        return (v - c) / 6 / diff + 1 / 2;
      };
      if (diff === 0) {
        h = s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        if (r === v) {
          h = bdif - gdif;
        } else if (g === v) {
          h = 1 / 3 + rdif - bdif;
        } else if (b === v) {
          h = 2 / 3 + gdif - rdif;
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [h * 360, s * 100, v * 100];
    };
    convert.rgb.hwb = function (rgb) {
      var r = rgb[0];
      var g = rgb[1];
      var b = rgb[2];
      var h = convert.rgb.hsl(rgb)[0];
      var w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert.rgb.cmyk = function (rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var c;
      var m;
      var y;
      var k;
      k = Math.min(1 - r, 1 - g, 1 - b);
      c = (1 - r - k) / (1 - k) || 0;
      m = (1 - g - k) / (1 - k) || 0;
      y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2);
    }
    convert.rgb.keyword = function (rgb) {
      var reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      var currentClosestDistance = Infinity;
      var currentClosestKeyword;
      for (var keyword in colorName) {
        if (colorName.hasOwnProperty(keyword)) {
          var value = colorName[keyword];
          var distance = comparativeDistance(rgb, value);
          if (distance < currentClosestDistance) {
            currentClosestDistance = distance;
            currentClosestKeyword = keyword;
          }
        }
      }
      return currentClosestKeyword;
    };
    convert.keyword.rgb = function (keyword) {
      return colorName[keyword];
    };
    convert.rgb.xyz = function (rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
      var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
      var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
      var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
      return [x * 100, y * 100, z * 100];
    };
    convert.rgb.lab = function (rgb) {
      var xyz = convert.rgb.xyz(rgb);
      var x = xyz[0];
      var y = xyz[1];
      var z = xyz[2];
      var l;
      var a;
      var b;
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
      y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
      z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
      l = 116 * y - 16;
      a = 500 * (x - y);
      b = 200 * (y - z);
      return [l, a, b];
    };
    convert.hsl.rgb = function (hsl) {
      var h = hsl[0] / 360;
      var s = hsl[1] / 100;
      var l = hsl[2] / 100;
      var t1;
      var t2;
      var t3;
      var rgb;
      var val;
      if (s === 0) {
        val = l * 255;
        return [val, val, val];
      }
      if (l < 0.5) {
        t2 = l * (1 + s);
      } else {
        t2 = l + s - l * s;
      }
      t1 = 2 * l - t2;
      rgb = [0, 0, 0];
      for (var i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          val = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          val = t2;
        } else if (3 * t3 < 2) {
          val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          val = t1;
        }
        rgb[i] = val * 255;
      }
      return rgb;
    };
    convert.hsl.hsv = function (hsl) {
      var h = hsl[0];
      var s = hsl[1] / 100;
      var l = hsl[2] / 100;
      var smin = s;
      var lmin = Math.max(l, 0.01);
      var sv;
      var v;
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      v = (l + s) / 2;
      sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert.hsv.rgb = function (hsv) {
      var h = hsv[0] / 60;
      var s = hsv[1] / 100;
      var v = hsv[2] / 100;
      var hi = Math.floor(h) % 6;
      var f = h - Math.floor(h);
      var p = 255 * v * (1 - s);
      var q = 255 * v * (1 - s * f);
      var t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0:
          return [v, t, p];
        case 1:
          return [q, v, p];
        case 2:
          return [p, v, t];
        case 3:
          return [p, q, v];
        case 4:
          return [t, p, v];
        case 5:
          return [v, p, q];
      }
    };
    convert.hsv.hsl = function (hsv) {
      var h = hsv[0];
      var s = hsv[1] / 100;
      var v = hsv[2] / 100;
      var vmin = Math.max(v, 0.01);
      var lmin;
      var sl;
      var l;
      l = (2 - s) * v;
      lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert.hwb.rgb = function (hwb) {
      var h = hwb[0] / 360;
      var wh = hwb[1] / 100;
      var bl = hwb[2] / 100;
      var ratio = wh + bl;
      var i;
      var v;
      var f;
      var n;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      i = Math.floor(6 * h);
      v = 1 - bl;
      f = 6 * h - i;
      if ((i & 0x01) !== 0) {
        f = 1 - f;
      }
      n = wh + f * (v - wh);
      var r;
      var g;
      var b;
      switch (i) {
        default:
        case 6:
        case 0:
          r = v;
          g = n;
          b = wh;
          break;
        case 1:
          r = n;
          g = v;
          b = wh;
          break;
        case 2:
          r = wh;
          g = v;
          b = n;
          break;
        case 3:
          r = wh;
          g = n;
          b = v;
          break;
        case 4:
          r = n;
          g = wh;
          b = v;
          break;
        case 5:
          r = v;
          g = wh;
          b = n;
          break;
      }
      return [r * 255, g * 255, b * 255];
    };
    convert.cmyk.rgb = function (cmyk) {
      var c = cmyk[0] / 100;
      var m = cmyk[1] / 100;
      var y = cmyk[2] / 100;
      var k = cmyk[3] / 100;
      var r;
      var g;
      var b;
      r = 1 - Math.min(1, c * (1 - k) + k);
      g = 1 - Math.min(1, m * (1 - k) + k);
      b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.rgb = function (xyz) {
      var x = xyz[0] / 100;
      var y = xyz[1] / 100;
      var z = xyz[2] / 100;
      var r;
      var g;
      var b;
      r = x * 3.2406 + y * -1.5372 + z * -0.4986;
      g = x * -0.9689 + y * 1.8758 + z * 0.0415;
      b = x * 0.0557 + y * -0.2040 + z * 1.0570;
      r = r > 0.0031308 ? 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055 : r * 12.92;
      g = g > 0.0031308 ? 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055 : g * 12.92;
      b = b > 0.0031308 ? 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055 : b * 12.92;
      r = Math.min(Math.max(0, r), 1);
      g = Math.min(Math.max(0, g), 1);
      b = Math.min(Math.max(0, b), 1);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.lab = function (xyz) {
      var x = xyz[0];
      var y = xyz[1];
      var z = xyz[2];
      var l;
      var a;
      var b;
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
      y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
      z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
      l = 116 * y - 16;
      a = 500 * (x - y);
      b = 200 * (y - z);
      return [l, a, b];
    };
    convert.lab.xyz = function (lab) {
      var l = lab[0];
      var a = lab[1];
      var b = lab[2];
      var x;
      var y;
      var z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      var y2 = Math.pow(y, 3);
      var x2 = Math.pow(x, 3);
      var z2 = Math.pow(z, 3);
      y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert.lab.lch = function (lab) {
      var l = lab[0];
      var a = lab[1];
      var b = lab[2];
      var hr;
      var h;
      var c;
      hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert.lch.lab = function (lch) {
      var l = lch[0];
      var c = lch[1];
      var h = lch[2];
      var a;
      var b;
      var hr;
      hr = h / 360 * 2 * Math.PI;
      a = c * Math.cos(hr);
      b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert.rgb.ansi16 = function (args) {
      var r = args[0];
      var g = args[1];
      var b = args[2];
      var value = (1 in arguments) ? arguments[1] : convert.rgb.hsv(args)[2];
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      var ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert.hsv.ansi16 = function (args) {
      return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
    };
    convert.rgb.ansi256 = function (args) {
      var r = args[0];
      var g = args[1];
      var b = args[2];
      if (r === g && g === b) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      var ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert.ansi16.rgb = function (args) {
      var color = args % 10;
      if (color === 0 || color === 7) {
        if (args > 50) {
          color += 3.5;
        }
        color = color / 10.5 * 255;
        return [color, color, color];
      }
      var mult = (~~(args > 50) + 1) * 0.5;
      var r = (color & 1) * mult * 255;
      var g = (color >> 1 & 1) * mult * 255;
      var b = (color >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert.ansi256.rgb = function (args) {
      if (args >= 232) {
        var c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      var rem;
      var r = Math.floor(args / 36) / 5 * 255;
      var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      var b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert.rgb.hex = function (args) {
      var integer = ((Math.round(args[0]) & 0xFF) << 16) + ((Math.round(args[1]) & 0xFF) << 8) + (Math.round(args[2]) & 0xFF);
      var string = integer.toString(16).toUpperCase();
      return ('000000').substring(string.length) + string;
    };
    convert.hex.rgb = function (args) {
      var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      var colorString = match[0];
      if (match[0].length === 3) {
        colorString = colorString.split('').map(function (char) {
          return char + char;
        }).join('');
      }
      var integer = parseInt(colorString, 16);
      var r = integer >> 16 & 0xFF;
      var g = integer >> 8 & 0xFF;
      var b = integer & 0xFF;
      return [r, g, b];
    };
    convert.rgb.hcg = function (rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var max = Math.max(Math.max(r, g), b);
      var min = Math.min(Math.min(r, g), b);
      var chroma = max - min;
      var grayscale;
      var hue;
      if (chroma < 1) {
        grayscale = min / (1 - chroma);
      } else {
        grayscale = 0;
      }
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma + 4;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale * 100];
    };
    convert.hsl.hcg = function (hsl) {
      var s = hsl[1] / 100;
      var l = hsl[2] / 100;
      var c = 1;
      var f = 0;
      if (l < 0.5) {
        c = 2.0 * s * l;
      } else {
        c = 2.0 * s * (1.0 - l);
      }
      if (c < 1.0) {
        f = (l - 0.5 * c) / (1.0 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert.hsv.hcg = function (hsv) {
      var s = hsv[1] / 100;
      var v = hsv[2] / 100;
      var c = s * v;
      var f = 0;
      if (c < 1.0) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert.hcg.rgb = function (hcg) {
      var h = hcg[0] / 360;
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      if (c === 0.0) {
        return [g * 255, g * 255, g * 255];
      }
      var pure = [0, 0, 0];
      var hi = h % 1 * 6;
      var v = hi % 1;
      var w = 1 - v;
      var mg = 0;
      switch (Math.floor(hi)) {
        case 0:
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        case 1:
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        case 2:
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        case 3:
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        case 4:
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        default:
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
      }
      mg = (1.0 - c) * g;
      return [(c * pure[0] + mg) * 255, (c * pure[1] + mg) * 255, (c * pure[2] + mg) * 255];
    };
    convert.hcg.hsv = function (hcg) {
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      var v = c + g * (1.0 - c);
      var f = 0;
      if (v > 0.0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert.hcg.hsl = function (hcg) {
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      var l = g * (1.0 - c) + 0.5 * c;
      var s = 0;
      if (l > 0.0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1.0) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert.hcg.hwb = function (hcg) {
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      var v = c + g * (1.0 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert.hwb.hcg = function (hwb) {
      var w = hwb[1] / 100;
      var b = hwb[2] / 100;
      var v = 1 - b;
      var c = v - w;
      var g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert.apple.rgb = function (apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert.rgb.apple = function (rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert.gray.rgb = function (args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert.gray.hsl = convert.gray.hsv = function (args) {
      return [0, 0, args[0]];
    };
    convert.gray.hwb = function (gray) {
      return [0, 100, gray[0]];
    };
    convert.gray.cmyk = function (gray) {
      return [0, 0, 0, gray[0]];
    };
    convert.gray.lab = function (gray) {
      return [gray[0], 0, 0];
    };
    convert.gray.hex = function (gray) {
      var val = Math.round(gray[0] / 100 * 255) & 0xFF;
      var integer = (val << 16) + (val << 8) + val;
      var string = integer.toString(16).toUpperCase();
      return ('000000').substring(string.length) + string;
    };
    convert.rgb.gray = function (rgb) {
      var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [val / 255 * 100];
    };
  });
  var conversions_1 = conversions.rgb;
  var conversions_2 = conversions.hsl;
  var conversions_3 = conversions.hsv;
  var conversions_4 = conversions.hwb;
  var conversions_5 = conversions.cmyk;
  var conversions_6 = conversions.xyz;
  var conversions_7 = conversions.lab;
  var conversions_8 = conversions.lch;
  var conversions_9 = conversions.hex;
  var conversions_10 = conversions.keyword;
  var conversions_11 = conversions.ansi16;
  var conversions_12 = conversions.ansi256;
  var conversions_13 = conversions.hcg;
  var conversions_14 = conversions.apple;
  var conversions_15 = conversions.gray;
  function buildGraph() {
    var graph = {};
    var models = Object.keys(conversions);
    for (var len = models.length, i = 0; i < len; i++) {
      graph[models[i]] = {
        distance: -1,
        parent: null
      };
    }
    return graph;
  }
  function deriveBFS(fromModel) {
    var graph = buildGraph();
    var queue = [fromModel];
    graph[fromModel].distance = 0;
    while (queue.length) {
      var current = queue.pop();
      var adjacents = Object.keys(conversions[current]);
      for (var len = adjacents.length, i = 0; i < len; i++) {
        var adjacent = adjacents[i];
        var node = graph[adjacent];
        if (node.distance === -1) {
          node.distance = graph[current].distance + 1;
          node.parent = current;
          queue.unshift(adjacent);
        }
      }
    }
    return graph;
  }
  function link(from, to) {
    return function (args) {
      return to(from(args));
    };
  }
  function wrapConversion(toModel, graph) {
    var path = [graph[toModel].parent, toModel];
    var fn = conversions[graph[toModel].parent][toModel];
    var cur = graph[toModel].parent;
    while (graph[cur].parent) {
      path.unshift(graph[cur].parent);
      fn = link(conversions[graph[cur].parent][cur], fn);
      cur = graph[cur].parent;
    }
    fn.conversion = path;
    return fn;
  }
  var route = function (fromModel) {
    var graph = deriveBFS(fromModel);
    var conversion = {};
    var models = Object.keys(graph);
    for (var len = models.length, i = 0; i < len; i++) {
      var toModel = models[i];
      var node = graph[toModel];
      if (node.parent === null) {
        continue;
      }
      conversion[toModel] = wrapConversion(toModel, graph);
    }
    return conversion;
  };
  var convert = {};
  var models = Object.keys(conversions);
  function wrapRaw(fn) {
    var wrappedFn = function (args) {
      if (args === undefined || args === null) {
        return args;
      }
      if (arguments.length > 1) {
        args = Array.prototype.slice.call(arguments);
      }
      return fn(args);
    };
    if (('conversion' in fn)) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  function wrapRounded(fn) {
    var wrappedFn = function (args) {
      if (args === undefined || args === null) {
        return args;
      }
      if (arguments.length > 1) {
        args = Array.prototype.slice.call(arguments);
      }
      var result = fn(args);
      if (typeof result === 'object') {
        for (var len = result.length, i = 0; i < len; i++) {
          result[i] = Math.round(result[i]);
        }
      }
      return result;
    };
    if (('conversion' in fn)) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  models.forEach(function (fromModel) {
    convert[fromModel] = {};
    Object.defineProperty(convert[fromModel], 'channels', {
      value: conversions[fromModel].channels
    });
    Object.defineProperty(convert[fromModel], 'labels', {
      value: conversions[fromModel].labels
    });
    var routes = route(fromModel);
    var routeModels = Object.keys(routes);
    routeModels.forEach(function (toModel) {
      var fn = routes[toModel];
      convert[fromModel][toModel] = wrapRounded(fn);
      convert[fromModel][toModel].raw = wrapRaw(fn);
    });
  });
  var colorConvert = convert;
  var colorName$1 = {
    "aliceblue": [240, 248, 255],
    "antiquewhite": [250, 235, 215],
    "aqua": [0, 255, 255],
    "aquamarine": [127, 255, 212],
    "azure": [240, 255, 255],
    "beige": [245, 245, 220],
    "bisque": [255, 228, 196],
    "black": [0, 0, 0],
    "blanchedalmond": [255, 235, 205],
    "blue": [0, 0, 255],
    "blueviolet": [138, 43, 226],
    "brown": [165, 42, 42],
    "burlywood": [222, 184, 135],
    "cadetblue": [95, 158, 160],
    "chartreuse": [127, 255, 0],
    "chocolate": [210, 105, 30],
    "coral": [255, 127, 80],
    "cornflowerblue": [100, 149, 237],
    "cornsilk": [255, 248, 220],
    "crimson": [220, 20, 60],
    "cyan": [0, 255, 255],
    "darkblue": [0, 0, 139],
    "darkcyan": [0, 139, 139],
    "darkgoldenrod": [184, 134, 11],
    "darkgray": [169, 169, 169],
    "darkgreen": [0, 100, 0],
    "darkgrey": [169, 169, 169],
    "darkkhaki": [189, 183, 107],
    "darkmagenta": [139, 0, 139],
    "darkolivegreen": [85, 107, 47],
    "darkorange": [255, 140, 0],
    "darkorchid": [153, 50, 204],
    "darkred": [139, 0, 0],
    "darksalmon": [233, 150, 122],
    "darkseagreen": [143, 188, 143],
    "darkslateblue": [72, 61, 139],
    "darkslategray": [47, 79, 79],
    "darkslategrey": [47, 79, 79],
    "darkturquoise": [0, 206, 209],
    "darkviolet": [148, 0, 211],
    "deeppink": [255, 20, 147],
    "deepskyblue": [0, 191, 255],
    "dimgray": [105, 105, 105],
    "dimgrey": [105, 105, 105],
    "dodgerblue": [30, 144, 255],
    "firebrick": [178, 34, 34],
    "floralwhite": [255, 250, 240],
    "forestgreen": [34, 139, 34],
    "fuchsia": [255, 0, 255],
    "gainsboro": [220, 220, 220],
    "ghostwhite": [248, 248, 255],
    "gold": [255, 215, 0],
    "goldenrod": [218, 165, 32],
    "gray": [128, 128, 128],
    "green": [0, 128, 0],
    "greenyellow": [173, 255, 47],
    "grey": [128, 128, 128],
    "honeydew": [240, 255, 240],
    "hotpink": [255, 105, 180],
    "indianred": [205, 92, 92],
    "indigo": [75, 0, 130],
    "ivory": [255, 255, 240],
    "khaki": [240, 230, 140],
    "lavender": [230, 230, 250],
    "lavenderblush": [255, 240, 245],
    "lawngreen": [124, 252, 0],
    "lemonchiffon": [255, 250, 205],
    "lightblue": [173, 216, 230],
    "lightcoral": [240, 128, 128],
    "lightcyan": [224, 255, 255],
    "lightgoldenrodyellow": [250, 250, 210],
    "lightgray": [211, 211, 211],
    "lightgreen": [144, 238, 144],
    "lightgrey": [211, 211, 211],
    "lightpink": [255, 182, 193],
    "lightsalmon": [255, 160, 122],
    "lightseagreen": [32, 178, 170],
    "lightskyblue": [135, 206, 250],
    "lightslategray": [119, 136, 153],
    "lightslategrey": [119, 136, 153],
    "lightsteelblue": [176, 196, 222],
    "lightyellow": [255, 255, 224],
    "lime": [0, 255, 0],
    "limegreen": [50, 205, 50],
    "linen": [250, 240, 230],
    "magenta": [255, 0, 255],
    "maroon": [128, 0, 0],
    "mediumaquamarine": [102, 205, 170],
    "mediumblue": [0, 0, 205],
    "mediumorchid": [186, 85, 211],
    "mediumpurple": [147, 112, 219],
    "mediumseagreen": [60, 179, 113],
    "mediumslateblue": [123, 104, 238],
    "mediumspringgreen": [0, 250, 154],
    "mediumturquoise": [72, 209, 204],
    "mediumvioletred": [199, 21, 133],
    "midnightblue": [25, 25, 112],
    "mintcream": [245, 255, 250],
    "mistyrose": [255, 228, 225],
    "moccasin": [255, 228, 181],
    "navajowhite": [255, 222, 173],
    "navy": [0, 0, 128],
    "oldlace": [253, 245, 230],
    "olive": [128, 128, 0],
    "olivedrab": [107, 142, 35],
    "orange": [255, 165, 0],
    "orangered": [255, 69, 0],
    "orchid": [218, 112, 214],
    "palegoldenrod": [238, 232, 170],
    "palegreen": [152, 251, 152],
    "paleturquoise": [175, 238, 238],
    "palevioletred": [219, 112, 147],
    "papayawhip": [255, 239, 213],
    "peachpuff": [255, 218, 185],
    "peru": [205, 133, 63],
    "pink": [255, 192, 203],
    "plum": [221, 160, 221],
    "powderblue": [176, 224, 230],
    "purple": [128, 0, 128],
    "rebeccapurple": [102, 51, 153],
    "red": [255, 0, 0],
    "rosybrown": [188, 143, 143],
    "royalblue": [65, 105, 225],
    "saddlebrown": [139, 69, 19],
    "salmon": [250, 128, 114],
    "sandybrown": [244, 164, 96],
    "seagreen": [46, 139, 87],
    "seashell": [255, 245, 238],
    "sienna": [160, 82, 45],
    "silver": [192, 192, 192],
    "skyblue": [135, 206, 235],
    "slateblue": [106, 90, 205],
    "slategray": [112, 128, 144],
    "slategrey": [112, 128, 144],
    "snow": [255, 250, 250],
    "springgreen": [0, 255, 127],
    "steelblue": [70, 130, 180],
    "tan": [210, 180, 140],
    "teal": [0, 128, 128],
    "thistle": [216, 191, 216],
    "tomato": [255, 99, 71],
    "turquoise": [64, 224, 208],
    "violet": [238, 130, 238],
    "wheat": [245, 222, 179],
    "white": [255, 255, 255],
    "whitesmoke": [245, 245, 245],
    "yellow": [255, 255, 0],
    "yellowgreen": [154, 205, 50]
  };
  var colorString = {
    getRgba: getRgba,
    getHsla: getHsla,
    getRgb: getRgb,
    getHsl: getHsl,
    getHwb: getHwb,
    getAlpha: getAlpha,
    hexString: hexString,
    rgbString: rgbString,
    rgbaString: rgbaString,
    percentString: percentString,
    percentaString: percentaString,
    hslString: hslString,
    hslaString: hslaString,
    hwbString: hwbString,
    keyword: keyword
  };
  function getRgba(string) {
    if (!string) {
      return;
    }
    var abbr = /^#([a-fA-F0-9]{3,4})$/i, hex = /^#([a-fA-F0-9]{6}([a-fA-F0-9]{2})?)$/i, rgba = /^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/i, per = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/i, keyword = /(\w+)/;
    var rgb = [0, 0, 0], a = 1, match = string.match(abbr), hexAlpha = "";
    if (match) {
      match = match[1];
      hexAlpha = match[3];
      for (var i = 0; i < rgb.length; i++) {
        rgb[i] = parseInt(match[i] + match[i], 16);
      }
      if (hexAlpha) {
        a = Math.round(parseInt(hexAlpha + hexAlpha, 16) / 255 * 100) / 100;
      }
    } else if (match = string.match(hex)) {
      hexAlpha = match[2];
      match = match[1];
      for (var i = 0; i < rgb.length; i++) {
        rgb[i] = parseInt(match.slice(i * 2, i * 2 + 2), 16);
      }
      if (hexAlpha) {
        a = Math.round(parseInt(hexAlpha, 16) / 255 * 100) / 100;
      }
    } else if (match = string.match(rgba)) {
      for (var i = 0; i < rgb.length; i++) {
        rgb[i] = parseInt(match[i + 1]);
      }
      a = parseFloat(match[4]);
    } else if (match = string.match(per)) {
      for (var i = 0; i < rgb.length; i++) {
        rgb[i] = Math.round(parseFloat(match[i + 1]) * 2.55);
      }
      a = parseFloat(match[4]);
    } else if (match = string.match(keyword)) {
      if (match[1] == "transparent") {
        return [0, 0, 0, 0];
      }
      rgb = colorName$1[match[1]];
      if (!rgb) {
        return;
      }
    }
    for (var i = 0; i < rgb.length; i++) {
      rgb[i] = scale(rgb[i], 0, 255);
    }
    if (!a && a != 0) {
      a = 1;
    } else {
      a = scale(a, 0, 1);
    }
    rgb[3] = a;
    return rgb;
  }
  function getHsla(string) {
    if (!string) {
      return;
    }
    var hsl = /^hsla?\(\s*([+-]?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)/;
    var match = string.match(hsl);
    if (match) {
      var alpha = parseFloat(match[4]);
      var h = scale(parseInt(match[1]), 0, 360), s = scale(parseFloat(match[2]), 0, 100), l = scale(parseFloat(match[3]), 0, 100), a = scale(isNaN(alpha) ? 1 : alpha, 0, 1);
      return [h, s, l, a];
    }
  }
  function getHwb(string) {
    if (!string) {
      return;
    }
    var hwb = /^hwb\(\s*([+-]?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)/;
    var match = string.match(hwb);
    if (match) {
      var alpha = parseFloat(match[4]);
      var h = scale(parseInt(match[1]), 0, 360), w = scale(parseFloat(match[2]), 0, 100), b = scale(parseFloat(match[3]), 0, 100), a = scale(isNaN(alpha) ? 1 : alpha, 0, 1);
      return [h, w, b, a];
    }
  }
  function getRgb(string) {
    var rgba = getRgba(string);
    return rgba && rgba.slice(0, 3);
  }
  function getHsl(string) {
    var hsla = getHsla(string);
    return hsla && hsla.slice(0, 3);
  }
  function getAlpha(string) {
    var vals = getRgba(string);
    if (vals) {
      return vals[3];
    } else if (vals = getHsla(string)) {
      return vals[3];
    } else if (vals = getHwb(string)) {
      return vals[3];
    }
  }
  function hexString(rgba, a) {
    var a = a !== undefined && rgba.length === 3 ? a : rgba[3];
    return "#" + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (a >= 0 && a < 1 ? hexDouble(Math.round(a * 255)) : "");
  }
  function rgbString(rgba, alpha) {
    if (alpha < 1 || rgba[3] && rgba[3] < 1) {
      return rgbaString(rgba, alpha);
    }
    return "rgb(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2] + ")";
  }
  function rgbaString(rgba, alpha) {
    if (alpha === undefined) {
      alpha = rgba[3] !== undefined ? rgba[3] : 1;
    }
    return "rgba(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2] + ", " + alpha + ")";
  }
  function percentString(rgba, alpha) {
    if (alpha < 1 || rgba[3] && rgba[3] < 1) {
      return percentaString(rgba, alpha);
    }
    var r = Math.round(rgba[0] / 255 * 100), g = Math.round(rgba[1] / 255 * 100), b = Math.round(rgba[2] / 255 * 100);
    return "rgb(" + r + "%, " + g + "%, " + b + "%)";
  }
  function percentaString(rgba, alpha) {
    var r = Math.round(rgba[0] / 255 * 100), g = Math.round(rgba[1] / 255 * 100), b = Math.round(rgba[2] / 255 * 100);
    return "rgba(" + r + "%, " + g + "%, " + b + "%, " + (alpha || rgba[3] || 1) + ")";
  }
  function hslString(hsla, alpha) {
    if (alpha < 1 || hsla[3] && hsla[3] < 1) {
      return hslaString(hsla, alpha);
    }
    return "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)";
  }
  function hslaString(hsla, alpha) {
    if (alpha === undefined) {
      alpha = hsla[3] !== undefined ? hsla[3] : 1;
    }
    return "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, " + alpha + ")";
  }
  function hwbString(hwb, alpha) {
    if (alpha === undefined) {
      alpha = hwb[3] !== undefined ? hwb[3] : 1;
    }
    return "hwb(" + hwb[0] + ", " + hwb[1] + "%, " + hwb[2] + "%" + (alpha !== undefined && alpha !== 1 ? ", " + alpha : "") + ")";
  }
  function keyword(rgb) {
    return reverseNames[rgb.slice(0, 3)];
  }
  function scale(num, min, max) {
    return Math.min(Math.max(min, num), max);
  }
  function hexDouble(num) {
    var str = num.toString(16).toUpperCase();
    return str.length < 2 ? "0" + str : str;
  }
  var reverseNames = {};
  for (var name in colorName$1) {
    reverseNames[colorName$1[name]] = name;
  }
  var Color = function (obj) {
    if (obj instanceof Color) {
      return obj;
    }
    if (!(this instanceof Color)) {
      return new Color(obj);
    }
    this.valid = false;
    this.values = {
      rgb: [0, 0, 0],
      hsl: [0, 0, 0],
      hsv: [0, 0, 0],
      hwb: [0, 0, 0],
      cmyk: [0, 0, 0, 0],
      alpha: 1
    };
    var vals;
    if (typeof obj === 'string') {
      vals = colorString.getRgba(obj);
      if (vals) {
        this.setValues('rgb', vals);
      } else if (vals = colorString.getHsla(obj)) {
        this.setValues('hsl', vals);
      } else if (vals = colorString.getHwb(obj)) {
        this.setValues('hwb', vals);
      }
    } else if (typeof obj === 'object') {
      vals = obj;
      if (vals.r !== undefined || vals.red !== undefined) {
        this.setValues('rgb', vals);
      } else if (vals.l !== undefined || vals.lightness !== undefined) {
        this.setValues('hsl', vals);
      } else if (vals.v !== undefined || vals.value !== undefined) {
        this.setValues('hsv', vals);
      } else if (vals.w !== undefined || vals.whiteness !== undefined) {
        this.setValues('hwb', vals);
      } else if (vals.c !== undefined || vals.cyan !== undefined) {
        this.setValues('cmyk', vals);
      }
    }
  };
  Color.prototype = {
    isValid: function () {
      return this.valid;
    },
    rgb: function () {
      return this.setSpace('rgb', arguments);
    },
    hsl: function () {
      return this.setSpace('hsl', arguments);
    },
    hsv: function () {
      return this.setSpace('hsv', arguments);
    },
    hwb: function () {
      return this.setSpace('hwb', arguments);
    },
    cmyk: function () {
      return this.setSpace('cmyk', arguments);
    },
    rgbArray: function () {
      return this.values.rgb;
    },
    hslArray: function () {
      return this.values.hsl;
    },
    hsvArray: function () {
      return this.values.hsv;
    },
    hwbArray: function () {
      var values = this.values;
      if (values.alpha !== 1) {
        return values.hwb.concat([values.alpha]);
      }
      return values.hwb;
    },
    cmykArray: function () {
      return this.values.cmyk;
    },
    rgbaArray: function () {
      var values = this.values;
      return values.rgb.concat([values.alpha]);
    },
    hslaArray: function () {
      var values = this.values;
      return values.hsl.concat([values.alpha]);
    },
    alpha: function (val) {
      if (val === undefined) {
        return this.values.alpha;
      }
      this.setValues('alpha', val);
      return this;
    },
    red: function (val) {
      return this.setChannel('rgb', 0, val);
    },
    green: function (val) {
      return this.setChannel('rgb', 1, val);
    },
    blue: function (val) {
      return this.setChannel('rgb', 2, val);
    },
    hue: function (val) {
      if (val) {
        val %= 360;
        val = val < 0 ? 360 + val : val;
      }
      return this.setChannel('hsl', 0, val);
    },
    saturation: function (val) {
      return this.setChannel('hsl', 1, val);
    },
    lightness: function (val) {
      return this.setChannel('hsl', 2, val);
    },
    saturationv: function (val) {
      return this.setChannel('hsv', 1, val);
    },
    whiteness: function (val) {
      return this.setChannel('hwb', 1, val);
    },
    blackness: function (val) {
      return this.setChannel('hwb', 2, val);
    },
    value: function (val) {
      return this.setChannel('hsv', 2, val);
    },
    cyan: function (val) {
      return this.setChannel('cmyk', 0, val);
    },
    magenta: function (val) {
      return this.setChannel('cmyk', 1, val);
    },
    yellow: function (val) {
      return this.setChannel('cmyk', 2, val);
    },
    black: function (val) {
      return this.setChannel('cmyk', 3, val);
    },
    hexString: function () {
      return colorString.hexString(this.values.rgb);
    },
    rgbString: function () {
      return colorString.rgbString(this.values.rgb, this.values.alpha);
    },
    rgbaString: function () {
      return colorString.rgbaString(this.values.rgb, this.values.alpha);
    },
    percentString: function () {
      return colorString.percentString(this.values.rgb, this.values.alpha);
    },
    hslString: function () {
      return colorString.hslString(this.values.hsl, this.values.alpha);
    },
    hslaString: function () {
      return colorString.hslaString(this.values.hsl, this.values.alpha);
    },
    hwbString: function () {
      return colorString.hwbString(this.values.hwb, this.values.alpha);
    },
    keyword: function () {
      return colorString.keyword(this.values.rgb, this.values.alpha);
    },
    rgbNumber: function () {
      var rgb = this.values.rgb;
      return rgb[0] << 16 | rgb[1] << 8 | rgb[2];
    },
    luminosity: function () {
      var rgb = this.values.rgb;
      var lum = [];
      for (var i = 0; i < rgb.length; i++) {
        var chan = rgb[i] / 255;
        lum[i] = chan <= 0.03928 ? chan / 12.92 : Math.pow((chan + 0.055) / 1.055, 2.4);
      }
      return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
    },
    contrast: function (color2) {
      var lum1 = this.luminosity();
      var lum2 = color2.luminosity();
      if (lum1 > lum2) {
        return (lum1 + 0.05) / (lum2 + 0.05);
      }
      return (lum2 + 0.05) / (lum1 + 0.05);
    },
    level: function (color2) {
      var contrastRatio = this.contrast(color2);
      if (contrastRatio >= 7.1) {
        return 'AAA';
      }
      return contrastRatio >= 4.5 ? 'AA' : '';
    },
    dark: function () {
      var rgb = this.values.rgb;
      var yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      return yiq < 128;
    },
    light: function () {
      return !this.dark();
    },
    negate: function () {
      var rgb = [];
      for (var i = 0; i < 3; i++) {
        rgb[i] = 255 - this.values.rgb[i];
      }
      this.setValues('rgb', rgb);
      return this;
    },
    lighten: function (ratio) {
      var hsl = this.values.hsl;
      hsl[2] += hsl[2] * ratio;
      this.setValues('hsl', hsl);
      return this;
    },
    darken: function (ratio) {
      var hsl = this.values.hsl;
      hsl[2] -= hsl[2] * ratio;
      this.setValues('hsl', hsl);
      return this;
    },
    saturate: function (ratio) {
      var hsl = this.values.hsl;
      hsl[1] += hsl[1] * ratio;
      this.setValues('hsl', hsl);
      return this;
    },
    desaturate: function (ratio) {
      var hsl = this.values.hsl;
      hsl[1] -= hsl[1] * ratio;
      this.setValues('hsl', hsl);
      return this;
    },
    whiten: function (ratio) {
      var hwb = this.values.hwb;
      hwb[1] += hwb[1] * ratio;
      this.setValues('hwb', hwb);
      return this;
    },
    blacken: function (ratio) {
      var hwb = this.values.hwb;
      hwb[2] += hwb[2] * ratio;
      this.setValues('hwb', hwb);
      return this;
    },
    greyscale: function () {
      var rgb = this.values.rgb;
      var val = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
      this.setValues('rgb', [val, val, val]);
      return this;
    },
    clearer: function (ratio) {
      var alpha = this.values.alpha;
      this.setValues('alpha', alpha - alpha * ratio);
      return this;
    },
    opaquer: function (ratio) {
      var alpha = this.values.alpha;
      this.setValues('alpha', alpha + alpha * ratio);
      return this;
    },
    rotate: function (degrees) {
      var hsl = this.values.hsl;
      var hue = (hsl[0] + degrees) % 360;
      hsl[0] = hue < 0 ? 360 + hue : hue;
      this.setValues('hsl', hsl);
      return this;
    },
    mix: function (mixinColor, weight) {
      var color1 = this;
      var color2 = mixinColor;
      var p = weight === undefined ? 0.5 : weight;
      var w = 2 * p - 1;
      var a = color1.alpha() - color2.alpha();
      var w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
      var w2 = 1 - w1;
      return this.rgb(w1 * color1.red() + w2 * color2.red(), w1 * color1.green() + w2 * color2.green(), w1 * color1.blue() + w2 * color2.blue()).alpha(color1.alpha() * p + color2.alpha() * (1 - p));
    },
    toJSON: function () {
      return this.rgb();
    },
    clone: function () {
      var result = new Color();
      var source = this.values;
      var target = result.values;
      var value, type;
      for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
          value = source[prop];
          type = ({}).toString.call(value);
          if (type === '[object Array]') {
            target[prop] = value.slice(0);
          } else if (type === '[object Number]') {
            target[prop] = value;
          } else {
            console.error('unexpected color value:', value);
          }
        }
      }
      return result;
    }
  };
  Color.prototype.spaces = {
    rgb: ['red', 'green', 'blue'],
    hsl: ['hue', 'saturation', 'lightness'],
    hsv: ['hue', 'saturation', 'value'],
    hwb: ['hue', 'whiteness', 'blackness'],
    cmyk: ['cyan', 'magenta', 'yellow', 'black']
  };
  Color.prototype.maxes = {
    rgb: [255, 255, 255],
    hsl: [360, 100, 100],
    hsv: [360, 100, 100],
    hwb: [360, 100, 100],
    cmyk: [100, 100, 100, 100]
  };
  Color.prototype.getValues = function (space) {
    var values = this.values;
    var vals = {};
    for (var i = 0; i < space.length; i++) {
      vals[space.charAt(i)] = values[space][i];
    }
    if (values.alpha !== 1) {
      vals.a = values.alpha;
    }
    return vals;
  };
  Color.prototype.setValues = function (space, vals) {
    var values = this.values;
    var spaces = this.spaces;
    var maxes = this.maxes;
    var alpha = 1;
    var i;
    this.valid = true;
    if (space === 'alpha') {
      alpha = vals;
    } else if (vals.length) {
      values[space] = vals.slice(0, space.length);
      alpha = vals[space.length];
    } else if (vals[space.charAt(0)] !== undefined) {
      for (i = 0; i < space.length; i++) {
        values[space][i] = vals[space.charAt(i)];
      }
      alpha = vals.a;
    } else if (vals[spaces[space][0]] !== undefined) {
      var chans = spaces[space];
      for (i = 0; i < space.length; i++) {
        values[space][i] = vals[chans[i]];
      }
      alpha = vals.alpha;
    }
    values.alpha = Math.max(0, Math.min(1, alpha === undefined ? values.alpha : alpha));
    if (space === 'alpha') {
      return false;
    }
    var capped;
    for (i = 0; i < space.length; i++) {
      capped = Math.max(0, Math.min(maxes[space][i], values[space][i]));
      values[space][i] = Math.round(capped);
    }
    for (var sname in spaces) {
      if (sname !== space) {
        values[sname] = colorConvert[space][sname](values[space]);
      }
    }
    return true;
  };
  Color.prototype.setSpace = function (space, args) {
    var vals = args[0];
    if (vals === undefined) {
      return this.getValues(space);
    }
    if (typeof vals === 'number') {
      vals = Array.prototype.slice.call(args);
    }
    this.setValues(space, vals);
    return this;
  };
  Color.prototype.setChannel = function (space, index, val) {
    var svalues = this.values[space];
    if (val === undefined) {
      return svalues[index];
    } else if (val === svalues[index]) {
      return this;
    }
    svalues[index] = val;
    this.setValues(space, svalues);
    return this;
  };
  if (typeof window !== 'undefined') {
    window.Color = Color;
  }
  var chartjsColor = Color;
  function isValidKey(key) {
    return ['__proto__', 'prototype', 'constructor'].indexOf(key) === -1;
  }
  var helpers = {
    noop: function () {},
    uid: (function () {
      var id = 0;
      return function () {
        return id++;
      };
    })(),
    isNullOrUndef: function (value) {
      return value === null || typeof value === 'undefined';
    },
    isArray: function (value) {
      if (Array.isArray && Array.isArray(value)) {
        return true;
      }
      var type = Object.prototype.toString.call(value);
      if (type.substr(0, 7) === '[object' && type.substr(-6) === 'Array]') {
        return true;
      }
      return false;
    },
    isObject: function (value) {
      return value !== null && Object.prototype.toString.call(value) === '[object Object]';
    },
    isFinite: function (value) {
      return (typeof value === 'number' || value instanceof Number) && isFinite(value);
    },
    valueOrDefault: function (value, defaultValue) {
      return typeof value === 'undefined' ? defaultValue : value;
    },
    valueAtIndexOrDefault: function (value, index, defaultValue) {
      return helpers.valueOrDefault(helpers.isArray(value) ? value[index] : value, defaultValue);
    },
    callback: function (fn, args, thisArg) {
      if (fn && typeof fn.call === 'function') {
        return fn.apply(thisArg, args);
      }
    },
    each: function (loopable, fn, thisArg, reverse) {
      var i, len, keys;
      if (helpers.isArray(loopable)) {
        len = loopable.length;
        if (reverse) {
          for (i = len - 1; i >= 0; i--) {
            fn.call(thisArg, loopable[i], i);
          }
        } else {
          for (i = 0; i < len; i++) {
            fn.call(thisArg, loopable[i], i);
          }
        }
      } else if (helpers.isObject(loopable)) {
        keys = Object.keys(loopable);
        len = keys.length;
        for (i = 0; i < len; i++) {
          fn.call(thisArg, loopable[keys[i]], keys[i]);
        }
      }
    },
    arrayEquals: function (a0, a1) {
      var i, ilen, v0, v1;
      if (!a0 || !a1 || a0.length !== a1.length) {
        return false;
      }
      for ((i = 0, ilen = a0.length); i < ilen; ++i) {
        v0 = a0[i];
        v1 = a1[i];
        if (v0 instanceof Array && v1 instanceof Array) {
          if (!helpers.arrayEquals(v0, v1)) {
            return false;
          }
        } else if (v0 !== v1) {
          return false;
        }
      }
      return true;
    },
    clone: function (source) {
      if (helpers.isArray(source)) {
        return source.map(helpers.clone);
      }
      if (helpers.isObject(source)) {
        var target = Object.create(source);
        var keys = Object.keys(source);
        var klen = keys.length;
        var k = 0;
        for (; k < klen; ++k) {
          target[keys[k]] = helpers.clone(source[keys[k]]);
        }
        return target;
      }
      return source;
    },
    _merger: function (key, target, source, options) {
      if (!isValidKey(key)) {
        return;
      }
      var tval = target[key];
      var sval = source[key];
      if (helpers.isObject(tval) && helpers.isObject(sval)) {
        helpers.merge(tval, sval, options);
      } else {
        target[key] = helpers.clone(sval);
      }
    },
    _mergerIf: function (key, target, source) {
      if (!isValidKey(key)) {
        return;
      }
      var tval = target[key];
      var sval = source[key];
      if (helpers.isObject(tval) && helpers.isObject(sval)) {
        helpers.mergeIf(tval, sval);
      } else if (!target.hasOwnProperty(key)) {
        target[key] = helpers.clone(sval);
      }
    },
    merge: function (target, source, options) {
      var sources = helpers.isArray(source) ? source : [source];
      var ilen = sources.length;
      var merge, i, keys, klen, k;
      if (!helpers.isObject(target)) {
        return target;
      }
      options = options || ({});
      merge = options.merger || helpers._merger;
      for (i = 0; i < ilen; ++i) {
        source = sources[i];
        if (!helpers.isObject(source)) {
          continue;
        }
        keys = Object.keys(source);
        for ((k = 0, klen = keys.length); k < klen; ++k) {
          merge(keys[k], target, source, options);
        }
      }
      return target;
    },
    mergeIf: function (target, source) {
      return helpers.merge(target, source, {
        merger: helpers._mergerIf
      });
    },
    extend: Object.assign || (function (target) {
      return helpers.merge(target, [].slice.call(arguments, 1), {
        merger: function (key, dst, src) {
          dst[key] = src[key];
        }
      });
    }),
    inherits: function (extensions) {
      var me = this;
      var ChartElement = extensions && extensions.hasOwnProperty('constructor') ? extensions.constructor : function () {
        return me.apply(this, arguments);
      };
      var Surrogate = function () {
        this.constructor = ChartElement;
      };
      Surrogate.prototype = me.prototype;
      ChartElement.prototype = new Surrogate();
      ChartElement.extend = helpers.inherits;
      if (extensions) {
        helpers.extend(ChartElement.prototype, extensions);
      }
      ChartElement.__super__ = me.prototype;
      return ChartElement;
    },
    _deprecated: function (scope, value, previous, current) {
      if (value !== undefined) {
        console.warn(scope + ': "' + previous + '" is deprecated. Please use "' + current + '" instead');
      }
    }
  };
  var helpers_core = helpers;
  helpers.callCallback = helpers.callback;
  helpers.indexOf = function (array, item, fromIndex) {
    return Array.prototype.indexOf.call(array, item, fromIndex);
  };
  helpers.getValueOrDefault = helpers.valueOrDefault;
  helpers.getValueAtIndexOrDefault = helpers.valueAtIndexOrDefault;
  var effects = {
    linear: function (t) {
      return t;
    },
    easeInQuad: function (t) {
      return t * t;
    },
    easeOutQuad: function (t) {
      return -t * (t - 2);
    },
    easeInOutQuad: function (t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t;
      }
      return -0.5 * (--t * (t - 2) - 1);
    },
    easeInCubic: function (t) {
      return t * t * t;
    },
    easeOutCubic: function (t) {
      return (t = t - 1) * t * t + 1;
    },
    easeInOutCubic: function (t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t * t;
      }
      return 0.5 * ((t -= 2) * t * t + 2);
    },
    easeInQuart: function (t) {
      return t * t * t * t;
    },
    easeOutQuart: function (t) {
      return -((t = t - 1) * t * t * t - 1);
    },
    easeInOutQuart: function (t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t * t * t;
      }
      return -0.5 * ((t -= 2) * t * t * t - 2);
    },
    easeInQuint: function (t) {
      return t * t * t * t * t;
    },
    easeOutQuint: function (t) {
      return (t = t - 1) * t * t * t * t + 1;
    },
    easeInOutQuint: function (t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t * t * t * t;
      }
      return 0.5 * ((t -= 2) * t * t * t * t + 2);
    },
    easeInSine: function (t) {
      return -Math.cos(t * (Math.PI / 2)) + 1;
    },
    easeOutSine: function (t) {
      return Math.sin(t * (Math.PI / 2));
    },
    easeInOutSine: function (t) {
      return -0.5 * (Math.cos(Math.PI * t) - 1);
    },
    easeInExpo: function (t) {
      return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    },
    easeOutExpo: function (t) {
      return t === 1 ? 1 : -Math.pow(2, -10 * t) + 1;
    },
    easeInOutExpo: function (t) {
      if (t === 0) {
        return 0;
      }
      if (t === 1) {
        return 1;
      }
      if ((t /= 0.5) < 1) {
        return 0.5 * Math.pow(2, 10 * (t - 1));
      }
      return 0.5 * (-Math.pow(2, -10 * --t) + 2);
    },
    easeInCirc: function (t) {
      if (t >= 1) {
        return t;
      }
      return -(Math.sqrt(1 - t * t) - 1);
    },
    easeOutCirc: function (t) {
      return Math.sqrt(1 - (t = t - 1) * t);
    },
    easeInOutCirc: function (t) {
      if ((t /= 0.5) < 1) {
        return -0.5 * (Math.sqrt(1 - t * t) - 1);
      }
      return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    },
    easeInElastic: function (t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t === 0) {
        return 0;
      }
      if (t === 1) {
        return 1;
      }
      if (!p) {
        p = 0.3;
      }
      if (a < 1) {
        a = 1;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(1 / a);
      }
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
    },
    easeOutElastic: function (t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t === 0) {
        return 0;
      }
      if (t === 1) {
        return 1;
      }
      if (!p) {
        p = 0.3;
      }
      if (a < 1) {
        a = 1;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(1 / a);
      }
      return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    },
    easeInOutElastic: function (t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t === 0) {
        return 0;
      }
      if ((t /= 0.5) === 2) {
        return 1;
      }
      if (!p) {
        p = 0.45;
      }
      if (a < 1) {
        a = 1;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(1 / a);
      }
      if (t < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
      }
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1;
    },
    easeInBack: function (t) {
      var s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    easeOutBack: function (t) {
      var s = 1.70158;
      return (t = t - 1) * t * ((s + 1) * t + s) + 1;
    },
    easeInOutBack: function (t) {
      var s = 1.70158;
      if ((t /= 0.5) < 1) {
        return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
      }
      return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
    },
    easeInBounce: function (t) {
      return 1 - effects.easeOutBounce(1 - t);
    },
    easeOutBounce: function (t) {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      }
      if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      }
      if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      }
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    easeInOutBounce: function (t) {
      if (t < 0.5) {
        return effects.easeInBounce(t * 2) * 0.5;
      }
      return effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5;
    }
  };
  var helpers_easing = {
    effects: effects
  };
  helpers_core.easingEffects = effects;
  var PI = Math.PI;
  var RAD_PER_DEG = PI / 180;
  var DOUBLE_PI = PI * 2;
  var HALF_PI = PI / 2;
  var QUARTER_PI = PI / 4;
  var TWO_THIRDS_PI = PI * 2 / 3;
  var exports$1 = {
    clear: function (chart) {
      chart.ctx.clearRect(0, 0, chart.width, chart.height);
    },
    roundedRect: function (ctx, x, y, width, height, radius) {
      if (radius) {
        var r = Math.min(radius, height / 2, width / 2);
        var left = x + r;
        var top = y + r;
        var right = x + width - r;
        var bottom = y + height - r;
        ctx.moveTo(x, top);
        if (left < right && top < bottom) {
          ctx.arc(left, top, r, -PI, -HALF_PI);
          ctx.arc(right, top, r, -HALF_PI, 0);
          ctx.arc(right, bottom, r, 0, HALF_PI);
          ctx.arc(left, bottom, r, HALF_PI, PI);
        } else if (left < right) {
          ctx.moveTo(left, y);
          ctx.arc(right, top, r, -HALF_PI, HALF_PI);
          ctx.arc(left, top, r, HALF_PI, PI + HALF_PI);
        } else if (top < bottom) {
          ctx.arc(left, top, r, -PI, 0);
          ctx.arc(left, bottom, r, 0, PI);
        } else {
          ctx.arc(left, top, r, -PI, PI);
        }
        ctx.closePath();
        ctx.moveTo(x, y);
      } else {
        ctx.rect(x, y, width, height);
      }
    },
    drawPoint: function (ctx, style, radius, x, y, rotation) {
      var type, xOffset, yOffset, size, cornerRadius;
      var rad = (rotation || 0) * RAD_PER_DEG;
      if (style && typeof style === 'object') {
        type = style.toString();
        if (type === '[object HTMLImageElement]' || type === '[object HTMLCanvasElement]') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rad);
          ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
          ctx.restore();
          return;
        }
      }
      if (isNaN(radius) || radius <= 0) {
        return;
      }
      ctx.beginPath();
      switch (style) {
        default:
          ctx.arc(x, y, radius, 0, DOUBLE_PI);
          ctx.closePath();
          break;
        case 'triangle':
          ctx.moveTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
          rad += TWO_THIRDS_PI;
          ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
          rad += TWO_THIRDS_PI;
          ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
          ctx.closePath();
          break;
        case 'rectRounded':
          cornerRadius = radius * 0.516;
          size = radius - cornerRadius;
          xOffset = Math.cos(rad + QUARTER_PI) * size;
          yOffset = Math.sin(rad + QUARTER_PI) * size;
          ctx.arc(x - xOffset, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
          ctx.arc(x + yOffset, y - xOffset, cornerRadius, rad - HALF_PI, rad);
          ctx.arc(x + xOffset, y + yOffset, cornerRadius, rad, rad + HALF_PI);
          ctx.arc(x - yOffset, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
          ctx.closePath();
          break;
        case 'rect':
          if (!rotation) {
            size = Math.SQRT1_2 * radius;
            ctx.rect(x - size, y - size, 2 * size, 2 * size);
            break;
          }
          rad += QUARTER_PI;
        case 'rectRot':
          xOffset = Math.cos(rad) * radius;
          yOffset = Math.sin(rad) * radius;
          ctx.moveTo(x - xOffset, y - yOffset);
          ctx.lineTo(x + yOffset, y - xOffset);
          ctx.lineTo(x + xOffset, y + yOffset);
          ctx.lineTo(x - yOffset, y + xOffset);
          ctx.closePath();
          break;
        case 'crossRot':
          rad += QUARTER_PI;
        case 'cross':
          xOffset = Math.cos(rad) * radius;
          yOffset = Math.sin(rad) * radius;
          ctx.moveTo(x - xOffset, y - yOffset);
          ctx.lineTo(x + xOffset, y + yOffset);
          ctx.moveTo(x + yOffset, y - xOffset);
          ctx.lineTo(x - yOffset, y + xOffset);
          break;
        case 'star':
          xOffset = Math.cos(rad) * radius;
          yOffset = Math.sin(rad) * radius;
          ctx.moveTo(x - xOffset, y - yOffset);
          ctx.lineTo(x + xOffset, y + yOffset);
          ctx.moveTo(x + yOffset, y - xOffset);
          ctx.lineTo(x - yOffset, y + xOffset);
          rad += QUARTER_PI;
          xOffset = Math.cos(rad) * radius;
          yOffset = Math.sin(rad) * radius;
          ctx.moveTo(x - xOffset, y - yOffset);
          ctx.lineTo(x + xOffset, y + yOffset);
          ctx.moveTo(x + yOffset, y - xOffset);
          ctx.lineTo(x - yOffset, y + xOffset);
          break;
        case 'line':
          xOffset = Math.cos(rad) * radius;
          yOffset = Math.sin(rad) * radius;
          ctx.moveTo(x - xOffset, y - yOffset);
          ctx.lineTo(x + xOffset, y + yOffset);
          break;
        case 'dash':
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(rad) * radius, y + Math.sin(rad) * radius);
          break;
      }
      ctx.fill();
      ctx.stroke();
    },
    _isPointInArea: function (point, area) {
      var epsilon = 1e-6;
      return point.x > area.left - epsilon && point.x < area.right + epsilon && point.y > area.top - epsilon && point.y < area.bottom + epsilon;
    },
    clipArea: function (ctx, area) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
      ctx.clip();
    },
    unclipArea: function (ctx) {
      ctx.restore();
    },
    lineTo: function (ctx, previous, target, flip) {
      var stepped = target.steppedLine;
      if (stepped) {
        if (stepped === 'middle') {
          var midpoint = (previous.x + target.x) / 2.0;
          ctx.lineTo(midpoint, flip ? target.y : previous.y);
          ctx.lineTo(midpoint, flip ? previous.y : target.y);
        } else if (stepped === 'after' && !flip || stepped !== 'after' && flip) {
          ctx.lineTo(previous.x, target.y);
        } else {
          ctx.lineTo(target.x, previous.y);
        }
        ctx.lineTo(target.x, target.y);
        return;
      }
      if (!target.tension) {
        ctx.lineTo(target.x, target.y);
        return;
      }
      ctx.bezierCurveTo(flip ? previous.controlPointPreviousX : previous.controlPointNextX, flip ? previous.controlPointPreviousY : previous.controlPointNextY, flip ? target.controlPointNextX : target.controlPointPreviousX, flip ? target.controlPointNextY : target.controlPointPreviousY, target.x, target.y);
    }
  };
  var helpers_canvas = exports$1;
  helpers_core.clear = exports$1.clear;
  helpers_core.drawRoundedRectangle = function (ctx) {
    ctx.beginPath();
    exports$1.roundedRect.apply(exports$1, arguments);
  };
  var defaults = {
    _set: function (scope, values) {
      return helpers_core.merge(this[scope] || (this[scope] = {}), values);
    }
  };
  defaults._set('global', {
    defaultColor: 'rgba(0,0,0,0.1)',
    defaultFontColor: '#666',
    defaultFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    defaultFontSize: 12,
    defaultFontStyle: 'normal',
    defaultLineHeight: 1.2,
    showLines: true
  });
  var core_defaults = defaults;
  var valueOrDefault = helpers_core.valueOrDefault;
  function toFontString(font) {
    if (!font || helpers_core.isNullOrUndef(font.size) || helpers_core.isNullOrUndef(font.family)) {
      return null;
    }
    return (font.style ? font.style + ' ' : '') + (font.weight ? font.weight + ' ' : '') + font.size + 'px ' + font.family;
  }
  var helpers_options = {
    toLineHeight: function (value, size) {
      var matches = ('' + value).match(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/);
      if (!matches || matches[1] === 'normal') {
        return size * 1.2;
      }
      value = +matches[2];
      switch (matches[3]) {
        case 'px':
          return value;
        case '%':
          value /= 100;
          break;
      }
      return size * value;
    },
    toPadding: function (value) {
      var t, r, b, l;
      if (helpers_core.isObject(value)) {
        t = +value.top || 0;
        r = +value.right || 0;
        b = +value.bottom || 0;
        l = +value.left || 0;
      } else {
        t = r = b = l = +value || 0;
      }
      return {
        top: t,
        right: r,
        bottom: b,
        left: l,
        height: t + b,
        width: l + r
      };
    },
    _parseFont: function (options) {
      var globalDefaults = core_defaults.global;
      var size = valueOrDefault(options.fontSize, globalDefaults.defaultFontSize);
      var font = {
        family: valueOrDefault(options.fontFamily, globalDefaults.defaultFontFamily),
        lineHeight: helpers_core.options.toLineHeight(valueOrDefault(options.lineHeight, globalDefaults.defaultLineHeight), size),
        size: size,
        style: valueOrDefault(options.fontStyle, globalDefaults.defaultFontStyle),
        weight: null,
        string: ''
      };
      font.string = toFontString(font);
      return font;
    },
    resolve: function (inputs, context, index, info) {
      var cacheable = true;
      var i, ilen, value;
      for ((i = 0, ilen = inputs.length); i < ilen; ++i) {
        value = inputs[i];
        if (value === undefined) {
          continue;
        }
        if (context !== undefined && typeof value === 'function') {
          value = value(context);
          cacheable = false;
        }
        if (index !== undefined && helpers_core.isArray(value)) {
          value = value[index];
          cacheable = false;
        }
        if (value !== undefined) {
          if (info && !cacheable) {
            info.cacheable = false;
          }
          return value;
        }
      }
    }
  };
  var exports$2 = {
    _factorize: function (value) {
      var result = [];
      var sqrt = Math.sqrt(value);
      var i;
      for (i = 1; i < sqrt; i++) {
        if (value % i === 0) {
          result.push(i);
          result.push(value / i);
        }
      }
      if (sqrt === (sqrt | 0)) {
        result.push(sqrt);
      }
      result.sort(function (a, b) {
        return a - b;
      }).pop();
      return result;
    },
    log10: Math.log10 || (function (x) {
      var exponent = Math.log(x) * Math.LOG10E;
      var powerOf10 = Math.round(exponent);
      var isPowerOf10 = x === Math.pow(10, powerOf10);
      return isPowerOf10 ? powerOf10 : exponent;
    })
  };
  var helpers_math = exports$2;
  helpers_core.log10 = exports$2.log10;
  var getRtlAdapter = function (rectX, width) {
    return {
      x: function (x) {
        return rectX + rectX + width - x;
      },
      setWidth: function (w) {
        width = w;
      },
      textAlign: function (align) {
        if (align === 'center') {
          return align;
        }
        return align === 'right' ? 'left' : 'right';
      },
      xPlus: function (x, value) {
        return x - value;
      },
      leftForLtr: function (x, itemWidth) {
        return x - itemWidth;
      }
    };
  };
  var getLtrAdapter = function () {
    return {
      x: function (x) {
        return x;
      },
      setWidth: function (w) {},
      textAlign: function (align) {
        return align;
      },
      xPlus: function (x, value) {
        return x + value;
      },
      leftForLtr: function (x, _itemWidth) {
        return x;
      }
    };
  };
  var getAdapter = function (rtl, rectX, width) {
    return rtl ? getRtlAdapter(rectX, width) : getLtrAdapter();
  };
  var overrideTextDirection = function (ctx, direction) {
    var style, original;
    if (direction === 'ltr' || direction === 'rtl') {
      style = ctx.canvas.style;
      original = [style.getPropertyValue('direction'), style.getPropertyPriority('direction')];
      style.setProperty('direction', direction, 'important');
      ctx.prevTextDirection = original;
    }
  };
  var restoreTextDirection = function (ctx) {
    var original = ctx.prevTextDirection;
    if (original !== undefined) {
      delete ctx.prevTextDirection;
      ctx.canvas.style.setProperty('direction', original[0], original[1]);
    }
  };
  var helpers_rtl = {
    getRtlAdapter: getAdapter,
    overrideTextDirection: overrideTextDirection,
    restoreTextDirection: restoreTextDirection
  };
  var helpers$1 = helpers_core;
  var easing = helpers_easing;
  var canvas = helpers_canvas;
  var options = helpers_options;
  var math = helpers_math;
  var rtl = helpers_rtl;
  helpers$1.easing = easing;
  helpers$1.canvas = canvas;
  helpers$1.options = options;
  helpers$1.math = math;
  helpers$1.rtl = rtl;
  function interpolate(start, view, model, ease) {
    var keys = Object.keys(model);
    var i, ilen, key, actual, origin, target, type, c0, c1;
    for ((i = 0, ilen = keys.length); i < ilen; ++i) {
      key = keys[i];
      target = model[key];
      if (!view.hasOwnProperty(key)) {
        view[key] = target;
      }
      actual = view[key];
      if (actual === target || key[0] === '_') {
        continue;
      }
      if (!start.hasOwnProperty(key)) {
        start[key] = actual;
      }
      origin = start[key];
      type = typeof target;
      if (type === typeof origin) {
        if (type === 'string') {
          c0 = chartjsColor(origin);
          if (c0.valid) {
            c1 = chartjsColor(target);
            if (c1.valid) {
              view[key] = c1.mix(c0, ease).rgbString();
              continue;
            }
          }
        } else if (helpers$1.isFinite(origin) && helpers$1.isFinite(target)) {
          view[key] = origin + (target - origin) * ease;
          continue;
        }
      }
      view[key] = target;
    }
  }
  var Element = function (configuration) {
    helpers$1.extend(this, configuration);
    this.initialize.apply(this, arguments);
  };
  helpers$1.extend(Element.prototype, {
    _type: undefined,
    initialize: function () {
      this.hidden = false;
    },
    pivot: function () {
      var me = this;
      if (!me._view) {
        me._view = helpers$1.extend({}, me._model);
      }
      me._start = {};
      return me;
    },
    transition: function (ease) {
      var me = this;
      var model = me._model;
      var start = me._start;
      var view = me._view;
      if (!model || ease === 1) {
        me._view = helpers$1.extend({}, model);
        me._start = null;
        return me;
      }
      if (!view) {
        view = me._view = {};
      }
      if (!start) {
        start = me._start = {};
      }
      interpolate(start, view, model, ease);
      return me;
    },
    tooltipPosition: function () {
      return {
        x: this._model.x,
        y: this._model.y
      };
    },
    hasValue: function () {
      return helpers$1.isNumber(this._model.x) && helpers$1.isNumber(this._model.y);
    }
  });
  Element.extend = helpers$1.inherits;
  var core_element = Element;
  var exports$3 = core_element.extend({
    chart: null,
    currentStep: 0,
    numSteps: 60,
    easing: '',
    render: null,
    onAnimationProgress: null,
    onAnimationComplete: null
  });
  var core_animation = exports$3;
  Object.defineProperty(exports$3.prototype, 'animationObject', {
    get: function () {
      return this;
    }
  });
  Object.defineProperty(exports$3.prototype, 'chartInstance', {
    get: function () {
      return this.chart;
    },
    set: function (value) {
      this.chart = value;
    }
  });
  core_defaults._set('global', {
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
      onProgress: helpers$1.noop,
      onComplete: helpers$1.noop
    }
  });
  var core_animations = {
    animations: [],
    request: null,
    addAnimation: function (chart, animation, duration, lazy) {
      var animations = this.animations;
      var i, ilen;
      animation.chart = chart;
      animation.startTime = Date.now();
      animation.duration = duration;
      if (!lazy) {
        chart.animating = true;
      }
      for ((i = 0, ilen = animations.length); i < ilen; ++i) {
        if (animations[i].chart === chart) {
          animations[i] = animation;
          return;
        }
      }
      animations.push(animation);
      if (animations.length === 1) {
        this.requestAnimationFrame();
      }
    },
    cancelAnimation: function (chart) {
      var index = helpers$1.findIndex(this.animations, function (animation) {
        return animation.chart === chart;
      });
      if (index !== -1) {
        this.animations.splice(index, 1);
        chart.animating = false;
      }
    },
    requestAnimationFrame: function () {
      var me = this;
      if (me.request === null) {
        me.request = helpers$1.requestAnimFrame.call(window, function () {
          me.request = null;
          me.startDigest();
        });
      }
    },
    startDigest: function () {
      var me = this;
      me.advance();
      if (me.animations.length > 0) {
        me.requestAnimationFrame();
      }
    },
    advance: function () {
      var animations = this.animations;
      var animation, chart, numSteps, nextStep;
      var i = 0;
      while (i < animations.length) {
        animation = animations[i];
        chart = animation.chart;
        numSteps = animation.numSteps;
        nextStep = Math.floor((Date.now() - animation.startTime) / animation.duration * numSteps) + 1;
        animation.currentStep = Math.min(nextStep, numSteps);
        helpers$1.callback(animation.render, [chart, animation], chart);
        helpers$1.callback(animation.onAnimationProgress, [animation], chart);
        if (animation.currentStep >= numSteps) {
          helpers$1.callback(animation.onAnimationComplete, [animation], chart);
          chart.animating = false;
          animations.splice(i, 1);
        } else {
          ++i;
        }
      }
    }
  };
  var resolve = helpers$1.options.resolve;
  var arrayEvents = ['push', 'pop', 'shift', 'splice', 'unshift'];
  function listenArrayEvents(array, listener) {
    if (array._chartjs) {
      array._chartjs.listeners.push(listener);
      return;
    }
    Object.defineProperty(array, '_chartjs', {
      configurable: true,
      enumerable: false,
      value: {
        listeners: [listener]
      }
    });
    arrayEvents.forEach(function (key) {
      var method = 'onData' + key.charAt(0).toUpperCase() + key.slice(1);
      var base = array[key];
      Object.defineProperty(array, key, {
        configurable: true,
        enumerable: false,
        value: function () {
          var args = Array.prototype.slice.call(arguments);
          var res = base.apply(this, args);
          helpers$1.each(array._chartjs.listeners, function (object) {
            if (typeof object[method] === 'function') {
              object[method].apply(object, args);
            }
          });
          return res;
        }
      });
    });
  }
  function unlistenArrayEvents(array, listener) {
    var stub = array._chartjs;
    if (!stub) {
      return;
    }
    var listeners = stub.listeners;
    var index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length > 0) {
      return;
    }
    arrayEvents.forEach(function (key) {
      delete array[key];
    });
    delete array._chartjs;
  }
  var DatasetController = function (chart, datasetIndex) {
    this.initialize(chart, datasetIndex);
  };
  helpers$1.extend(DatasetController.prototype, {
    datasetElementType: null,
    dataElementType: null,
    _datasetElementOptions: ['backgroundColor', 'borderCapStyle', 'borderColor', 'borderDash', 'borderDashOffset', 'borderJoinStyle', 'borderWidth'],
    _dataElementOptions: ['backgroundColor', 'borderColor', 'borderWidth', 'pointStyle'],
    initialize: function (chart, datasetIndex) {
      var me = this;
      me.chart = chart;
      me.index = datasetIndex;
      me.linkScales();
      me.addElements();
      me._type = me.getMeta().type;
    },
    updateIndex: function (datasetIndex) {
      this.index = datasetIndex;
    },
    linkScales: function () {
      var me = this;
      var meta = me.getMeta();
      var chart = me.chart;
      var scales = chart.scales;
      var dataset = me.getDataset();
      var scalesOpts = chart.options.scales;
      if (meta.xAxisID === null || !((meta.xAxisID in scales)) || dataset.xAxisID) {
        meta.xAxisID = dataset.xAxisID || scalesOpts.xAxes[0].id;
      }
      if (meta.yAxisID === null || !((meta.yAxisID in scales)) || dataset.yAxisID) {
        meta.yAxisID = dataset.yAxisID || scalesOpts.yAxes[0].id;
      }
    },
    getDataset: function () {
      return this.chart.data.datasets[this.index];
    },
    getMeta: function () {
      return this.chart.getDatasetMeta(this.index);
    },
    getScaleForId: function (scaleID) {
      return this.chart.scales[scaleID];
    },
    _getValueScaleId: function () {
      return this.getMeta().yAxisID;
    },
    _getIndexScaleId: function () {
      return this.getMeta().xAxisID;
    },
    _getValueScale: function () {
      return this.getScaleForId(this._getValueScaleId());
    },
    _getIndexScale: function () {
      return this.getScaleForId(this._getIndexScaleId());
    },
    reset: function () {
      this._update(true);
    },
    destroy: function () {
      if (this._data) {
        unlistenArrayEvents(this._data, this);
      }
    },
    createMetaDataset: function () {
      var me = this;
      var type = me.datasetElementType;
      return type && new type({
        _chart: me.chart,
        _datasetIndex: me.index
      });
    },
    createMetaData: function (index) {
      var me = this;
      var type = me.dataElementType;
      return type && new type({
        _chart: me.chart,
        _datasetIndex: me.index,
        _index: index
      });
    },
    addElements: function () {
      var me = this;
      var meta = me.getMeta();
      var data = me.getDataset().data || [];
      var metaData = meta.data;
      var i, ilen;
      for ((i = 0, ilen = data.length); i < ilen; ++i) {
        metaData[i] = metaData[i] || me.createMetaData(i);
      }
      meta.dataset = meta.dataset || me.createMetaDataset();
    },
    addElementAndReset: function (index) {
      var element = this.createMetaData(index);
      this.getMeta().data.splice(index, 0, element);
      this.updateElement(element, index, true);
    },
    buildOrUpdateElements: function () {
      var me = this;
      var dataset = me.getDataset();
      var data = dataset.data || (dataset.data = []);
      if (me._data !== data) {
        if (me._data) {
          unlistenArrayEvents(me._data, me);
        }
        if (data && Object.isExtensible(data)) {
          listenArrayEvents(data, me);
        }
        me._data = data;
      }
      me.resyncElements();
    },
    _configure: function () {
      var me = this;
      me._config = helpers$1.merge(Object.create(null), [me.chart.options.datasets[me._type], me.getDataset()], {
        merger: function (key, target, source) {
          if (key !== '_meta' && key !== 'data') {
            helpers$1._merger(key, target, source);
          }
        }
      });
    },
    _update: function (reset) {
      var me = this;
      me._configure();
      me._cachedDataOpts = null;
      me.update(reset);
    },
    update: helpers$1.noop,
    transition: function (easingValue) {
      var meta = this.getMeta();
      var elements = meta.data || [];
      var ilen = elements.length;
      var i = 0;
      for (; i < ilen; ++i) {
        elements[i].transition(easingValue);
      }
      if (meta.dataset) {
        meta.dataset.transition(easingValue);
      }
    },
    draw: function () {
      var meta = this.getMeta();
      var elements = meta.data || [];
      var ilen = elements.length;
      var i = 0;
      if (meta.dataset) {
        meta.dataset.draw();
      }
      for (; i < ilen; ++i) {
        elements[i].draw();
      }
    },
    getStyle: function (index) {
      var me = this;
      var meta = me.getMeta();
      var dataset = meta.dataset;
      var style;
      me._configure();
      if (dataset && index === undefined) {
        style = me._resolveDatasetElementOptions(dataset || ({}));
      } else {
        index = index || 0;
        style = me._resolveDataElementOptions(meta.data[index] || ({}), index);
      }
      if (style.fill === false || style.fill === null) {
        style.backgroundColor = style.borderColor;
      }
      return style;
    },
    _resolveDatasetElementOptions: function (element, hover) {
      var me = this;
      var chart = me.chart;
      var datasetOpts = me._config;
      var custom = element.custom || ({});
      var options = chart.options.elements[me.datasetElementType.prototype._type] || ({});
      var elementOptions = me._datasetElementOptions;
      var values = {};
      var i, ilen, key, readKey;
      var context = {
        chart: chart,
        dataset: me.getDataset(),
        datasetIndex: me.index,
        hover: hover
      };
      for ((i = 0, ilen = elementOptions.length); i < ilen; ++i) {
        key = elementOptions[i];
        readKey = hover ? 'hover' + key.charAt(0).toUpperCase() + key.slice(1) : key;
        values[key] = resolve([custom[readKey], datasetOpts[readKey], options[readKey]], context);
      }
      return values;
    },
    _resolveDataElementOptions: function (element, index) {
      var me = this;
      var custom = element && element.custom;
      var cached = me._cachedDataOpts;
      if (cached && !custom) {
        return cached;
      }
      var chart = me.chart;
      var datasetOpts = me._config;
      var options = chart.options.elements[me.dataElementType.prototype._type] || ({});
      var elementOptions = me._dataElementOptions;
      var values = {};
      var context = {
        chart: chart,
        dataIndex: index,
        dataset: me.getDataset(),
        datasetIndex: me.index
      };
      var info = {
        cacheable: !custom
      };
      var keys, i, ilen, key;
      custom = custom || ({});
      if (helpers$1.isArray(elementOptions)) {
        for ((i = 0, ilen = elementOptions.length); i < ilen; ++i) {
          key = elementOptions[i];
          values[key] = resolve([custom[key], datasetOpts[key], options[key]], context, index, info);
        }
      } else {
        keys = Object.keys(elementOptions);
        for ((i = 0, ilen = keys.length); i < ilen; ++i) {
          key = keys[i];
          values[key] = resolve([custom[key], datasetOpts[elementOptions[key]], datasetOpts[key], options[key]], context, index, info);
        }
      }
      if (info.cacheable) {
        me._cachedDataOpts = Object.freeze(values);
      }
      return values;
    },
    removeHoverStyle: function (element) {
      helpers$1.merge(element._model, element.$previousStyle || ({}));
      delete element.$previousStyle;
    },
    setHoverStyle: function (element) {
      var dataset = this.chart.data.datasets[element._datasetIndex];
      var index = element._index;
      var custom = element.custom || ({});
      var model = element._model;
      var getHoverColor = helpers$1.getHoverColor;
      element.$previousStyle = {
        backgroundColor: model.backgroundColor,
        borderColor: model.borderColor,
        borderWidth: model.borderWidth
      };
      model.backgroundColor = resolve([custom.hoverBackgroundColor, dataset.hoverBackgroundColor, getHoverColor(model.backgroundColor)], undefined, index);
      model.borderColor = resolve([custom.hoverBorderColor, dataset.hoverBorderColor, getHoverColor(model.borderColor)], undefined, index);
      model.borderWidth = resolve([custom.hoverBorderWidth, dataset.hoverBorderWidth, model.borderWidth], undefined, index);
    },
    _removeDatasetHoverStyle: function () {
      var element = this.getMeta().dataset;
      if (element) {
        this.removeHoverStyle(element);
      }
    },
    _setDatasetHoverStyle: function () {
      var element = this.getMeta().dataset;
      var prev = {};
      var i, ilen, key, keys, hoverOptions, model;
      if (!element) {
        return;
      }
      model = element._model;
      hoverOptions = this._resolveDatasetElementOptions(element, true);
      keys = Object.keys(hoverOptions);
      for ((i = 0, ilen = keys.length); i < ilen; ++i) {
        key = keys[i];
        prev[key] = model[key];
        model[key] = hoverOptions[key];
      }
      element.$previousStyle = prev;
    },
    resyncElements: function () {
      var me = this;
      var meta = me.getMeta();
      var data = me.getDataset().data;
      var numMeta = meta.data.length;
      var numData = data.length;
      if (numData < numMeta) {
        meta.data.splice(numData, numMeta - numData);
      } else if (numData > numMeta) {
        me.insertElements(numMeta, numData - numMeta);
      }
    },
    insertElements: function (start, count) {
      for (var i = 0; i < count; ++i) {
        this.addElementAndReset(start + i);
      }
    },
    onDataPush: function () {
      var count = arguments.length;
      this.insertElements(this.getDataset().data.length - count, count);
    },
    onDataPop: function () {
      this.getMeta().data.pop();
    },
    onDataShift: function () {
      this.getMeta().data.shift();
    },
    onDataSplice: function (start, count) {
      this.getMeta().data.splice(start, count);
      this.insertElements(start, arguments.length - 2);
    },
    onDataUnshift: function () {
      this.insertElements(0, arguments.length);
    }
  });
  DatasetController.extend = helpers$1.inherits;
  var core_datasetController = DatasetController;
  var TAU = Math.PI * 2;
  core_defaults._set('global', {
    elements: {
      arc: {
        backgroundColor: core_defaults.global.defaultColor,
        borderColor: '#fff',
        borderWidth: 2,
        borderAlign: 'center'
      }
    }
  });
  function clipArc(ctx, arc) {
    var startAngle = arc.startAngle;
    var endAngle = arc.endAngle;
    var pixelMargin = arc.pixelMargin;
    var angleMargin = pixelMargin / arc.outerRadius;
    var x = arc.x;
    var y = arc.y;
    ctx.beginPath();
    ctx.arc(x, y, arc.outerRadius, startAngle - angleMargin, endAngle + angleMargin);
    if (arc.innerRadius > pixelMargin) {
      angleMargin = pixelMargin / arc.innerRadius;
      ctx.arc(x, y, arc.innerRadius - pixelMargin, endAngle + angleMargin, startAngle - angleMargin, true);
    } else {
      ctx.arc(x, y, pixelMargin, endAngle + Math.PI / 2, startAngle - Math.PI / 2);
    }
    ctx.closePath();
    ctx.clip();
  }
  function drawFullCircleBorders(ctx, vm, arc, inner) {
    var endAngle = arc.endAngle;
    var i;
    if (inner) {
      arc.endAngle = arc.startAngle + TAU;
      clipArc(ctx, arc);
      arc.endAngle = endAngle;
      if (arc.endAngle === arc.startAngle && arc.fullCircles) {
        arc.endAngle += TAU;
        arc.fullCircles--;
      }
    }
    ctx.beginPath();
    ctx.arc(arc.x, arc.y, arc.innerRadius, arc.startAngle + TAU, arc.startAngle, true);
    for (i = 0; i < arc.fullCircles; ++i) {
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(arc.x, arc.y, vm.outerRadius, arc.startAngle, arc.startAngle + TAU);
    for (i = 0; i < arc.fullCircles; ++i) {
      ctx.stroke();
    }
  }
  function drawBorder(ctx, vm, arc) {
    var inner = vm.borderAlign === 'inner';
    if (inner) {
      ctx.lineWidth = vm.borderWidth * 2;
      ctx.lineJoin = 'round';
    } else {
      ctx.lineWidth = vm.borderWidth;
      ctx.lineJoin = 'bevel';
    }
    if (arc.fullCircles) {
      drawFullCircleBorders(ctx, vm, arc, inner);
    }
    if (inner) {
      clipArc(ctx, arc);
    }
    ctx.beginPath();
    ctx.arc(arc.x, arc.y, vm.outerRadius, arc.startAngle, arc.endAngle);
    ctx.arc(arc.x, arc.y, arc.innerRadius, arc.endAngle, arc.startAngle, true);
    ctx.closePath();
    ctx.stroke();
  }
  var element_arc = core_element.extend({
    _type: 'arc',
    inLabelRange: function (mouseX) {
      var vm = this._view;
      if (vm) {
        return Math.pow(mouseX - vm.x, 2) < Math.pow(vm.radius + vm.hoverRadius, 2);
      }
      return false;
    },
    inRange: function (chartX, chartY) {
      var vm = this._view;
      if (vm) {
        var pointRelativePosition = helpers$1.getAngleFromPoint(vm, {
          x: chartX,
          y: chartY
        });
        var angle = pointRelativePosition.angle;
        var distance = pointRelativePosition.distance;
        var startAngle = vm.startAngle;
        var endAngle = vm.endAngle;
        while (endAngle < startAngle) {
          endAngle += TAU;
        }
        while (angle > endAngle) {
          angle -= TAU;
        }
        while (angle < startAngle) {
          angle += TAU;
        }
        var betweenAngles = angle >= startAngle && angle <= endAngle;
        var withinRadius = distance >= vm.innerRadius && distance <= vm.outerRadius;
        return betweenAngles && withinRadius;
      }
      return false;
    },
    getCenterPoint: function () {
      var vm = this._view;
      var halfAngle = (vm.startAngle + vm.endAngle) / 2;
      var halfRadius = (vm.innerRadius + vm.outerRadius) / 2;
      return {
        x: vm.x + Math.cos(halfAngle) * halfRadius,
        y: vm.y + Math.sin(halfAngle) * halfRadius
      };
    },
    getArea: function () {
      var vm = this._view;
      return Math.PI * ((vm.endAngle - vm.startAngle) / (2 * Math.PI)) * (Math.pow(vm.outerRadius, 2) - Math.pow(vm.innerRadius, 2));
    },
    tooltipPosition: function () {
      var vm = this._view;
      var centreAngle = vm.startAngle + (vm.endAngle - vm.startAngle) / 2;
      var rangeFromCentre = (vm.outerRadius - vm.innerRadius) / 2 + vm.innerRadius;
      return {
        x: vm.x + Math.cos(centreAngle) * rangeFromCentre,
        y: vm.y + Math.sin(centreAngle) * rangeFromCentre
      };
    },
    draw: function () {
      var ctx = this._chart.ctx;
      var vm = this._view;
      var pixelMargin = vm.borderAlign === 'inner' ? 0.33 : 0;
      var arc = {
        x: vm.x,
        y: vm.y,
        innerRadius: vm.innerRadius,
        outerRadius: Math.max(vm.outerRadius - pixelMargin, 0),
        pixelMargin: pixelMargin,
        startAngle: vm.startAngle,
        endAngle: vm.endAngle,
        fullCircles: Math.floor(vm.circumference / TAU)
      };
      var i;
      ctx.save();
      ctx.fillStyle = vm.backgroundColor;
      ctx.strokeStyle = vm.borderColor;
      if (arc.fullCircles) {
        arc.endAngle = arc.startAngle + TAU;
        ctx.beginPath();
        ctx.arc(arc.x, arc.y, arc.outerRadius, arc.startAngle, arc.endAngle);
        ctx.arc(arc.x, arc.y, arc.innerRadius, arc.endAngle, arc.startAngle, true);
        ctx.closePath();
        for (i = 0; i < arc.fullCircles; ++i) {
          ctx.fill();
        }
        arc.endAngle = arc.startAngle + vm.circumference % TAU;
      }
      ctx.beginPath();
      ctx.arc(arc.x, arc.y, arc.outerRadius, arc.startAngle, arc.endAngle);
      ctx.arc(arc.x, arc.y, arc.innerRadius, arc.endAngle, arc.startAngle, true);
      ctx.closePath();
      ctx.fill();
      if (vm.borderWidth) {
        drawBorder(ctx, vm, arc);
      }
      ctx.restore();
    }
  });
  var valueOrDefault$1 = helpers$1.valueOrDefault;
  var defaultColor = core_defaults.global.defaultColor;
  core_defaults._set('global', {
    elements: {
      line: {
        tension: 0.4,
        backgroundColor: defaultColor,
        borderWidth: 3,
        borderColor: defaultColor,
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        capBezierPoints: true,
        fill: true
      }
    }
  });
  var element_line = core_element.extend({
    _type: 'line',
    draw: function () {
      var me = this;
      var vm = me._view;
      var ctx = me._chart.ctx;
      var spanGaps = vm.spanGaps;
      var points = me._children.slice();
      var globalDefaults = core_defaults.global;
      var globalOptionLineElements = globalDefaults.elements.line;
      var lastDrawnIndex = -1;
      var closePath = me._loop;
      var index, previous, currentVM;
      if (!points.length) {
        return;
      }
      if (me._loop) {
        for (index = 0; index < points.length; ++index) {
          previous = helpers$1.previousItem(points, index);
          if (!points[index]._view.skip && previous._view.skip) {
            points = points.slice(index).concat(points.slice(0, index));
            closePath = spanGaps;
            break;
          }
        }
        if (closePath) {
          points.push(points[0]);
        }
      }
      ctx.save();
      ctx.lineCap = vm.borderCapStyle || globalOptionLineElements.borderCapStyle;
      if (ctx.setLineDash) {
        ctx.setLineDash(vm.borderDash || globalOptionLineElements.borderDash);
      }
      ctx.lineDashOffset = valueOrDefault$1(vm.borderDashOffset, globalOptionLineElements.borderDashOffset);
      ctx.lineJoin = vm.borderJoinStyle || globalOptionLineElements.borderJoinStyle;
      ctx.lineWidth = valueOrDefault$1(vm.borderWidth, globalOptionLineElements.borderWidth);
      ctx.strokeStyle = vm.borderColor || globalDefaults.defaultColor;
      ctx.beginPath();
      currentVM = points[0]._view;
      if (!currentVM.skip) {
        ctx.moveTo(currentVM.x, currentVM.y);
        lastDrawnIndex = 0;
      }
      for (index = 1; index < points.length; ++index) {
        currentVM = points[index]._view;
        previous = lastDrawnIndex === -1 ? helpers$1.previousItem(points, index) : points[lastDrawnIndex];
        if (!currentVM.skip) {
          if (lastDrawnIndex !== index - 1 && !spanGaps || lastDrawnIndex === -1) {
            ctx.moveTo(currentVM.x, currentVM.y);
          } else {
            helpers$1.canvas.lineTo(ctx, previous._view, currentVM);
          }
          lastDrawnIndex = index;
        }
      }
      if (closePath) {
        ctx.closePath();
      }
      ctx.stroke();
      ctx.restore();
    }
  });
  var valueOrDefault$2 = helpers$1.valueOrDefault;
  var defaultColor$1 = core_defaults.global.defaultColor;
  core_defaults._set('global', {
    elements: {
      point: {
        radius: 3,
        pointStyle: 'circle',
        backgroundColor: defaultColor$1,
        borderColor: defaultColor$1,
        borderWidth: 1,
        hitRadius: 1,
        hoverRadius: 4,
        hoverBorderWidth: 1
      }
    }
  });
  function xRange(mouseX) {
    var vm = this._view;
    return vm ? Math.abs(mouseX - vm.x) < vm.radius + vm.hitRadius : false;
  }
  function yRange(mouseY) {
    var vm = this._view;
    return vm ? Math.abs(mouseY - vm.y) < vm.radius + vm.hitRadius : false;
  }
  var element_point = core_element.extend({
    _type: 'point',
    inRange: function (mouseX, mouseY) {
      var vm = this._view;
      return vm ? Math.pow(mouseX - vm.x, 2) + Math.pow(mouseY - vm.y, 2) < Math.pow(vm.hitRadius + vm.radius, 2) : false;
    },
    inLabelRange: xRange,
    inXRange: xRange,
    inYRange: yRange,
    getCenterPoint: function () {
      var vm = this._view;
      return {
        x: vm.x,
        y: vm.y
      };
    },
    getArea: function () {
      return Math.PI * Math.pow(this._view.radius, 2);
    },
    tooltipPosition: function () {
      var vm = this._view;
      return {
        x: vm.x,
        y: vm.y,
        padding: vm.radius + vm.borderWidth
      };
    },
    draw: function (chartArea) {
      var vm = this._view;
      var ctx = this._chart.ctx;
      var pointStyle = vm.pointStyle;
      var rotation = vm.rotation;
      var radius = vm.radius;
      var x = vm.x;
      var y = vm.y;
      var globalDefaults = core_defaults.global;
      var defaultColor = globalDefaults.defaultColor;
      if (vm.skip) {
        return;
      }
      if (chartArea === undefined || helpers$1.canvas._isPointInArea(vm, chartArea)) {
        ctx.strokeStyle = vm.borderColor || defaultColor;
        ctx.lineWidth = valueOrDefault$2(vm.borderWidth, globalDefaults.elements.point.borderWidth);
        ctx.fillStyle = vm.backgroundColor || defaultColor;
        helpers$1.canvas.drawPoint(ctx, pointStyle, radius, x, y, rotation);
      }
    }
  });
  var defaultColor$2 = core_defaults.global.defaultColor;
  core_defaults._set('global', {
    elements: {
      rectangle: {
        backgroundColor: defaultColor$2,
        borderColor: defaultColor$2,
        borderSkipped: 'bottom',
        borderWidth: 0
      }
    }
  });
  function isVertical(vm) {
    return vm && vm.width !== undefined;
  }
  function getBarBounds(vm) {
    var x1, x2, y1, y2, half;
    if (isVertical(vm)) {
      half = vm.width / 2;
      x1 = vm.x - half;
      x2 = vm.x + half;
      y1 = Math.min(vm.y, vm.base);
      y2 = Math.max(vm.y, vm.base);
    } else {
      half = vm.height / 2;
      x1 = Math.min(vm.x, vm.base);
      x2 = Math.max(vm.x, vm.base);
      y1 = vm.y - half;
      y2 = vm.y + half;
    }
    return {
      left: x1,
      top: y1,
      right: x2,
      bottom: y2
    };
  }
  function swap(orig, v1, v2) {
    return orig === v1 ? v2 : orig === v2 ? v1 : orig;
  }
  function parseBorderSkipped(vm) {
    var edge = vm.borderSkipped;
    var res = {};
    if (!edge) {
      return res;
    }
    if (vm.horizontal) {
      if (vm.base > vm.x) {
        edge = swap(edge, 'left', 'right');
      }
    } else if (vm.base < vm.y) {
      edge = swap(edge, 'bottom', 'top');
    }
    res[edge] = true;
    return res;
  }
  function parseBorderWidth(vm, maxW, maxH) {
    var value = vm.borderWidth;
    var skip = parseBorderSkipped(vm);
    var t, r, b, l;
    if (helpers$1.isObject(value)) {
      t = +value.top || 0;
      r = +value.right || 0;
      b = +value.bottom || 0;
      l = +value.left || 0;
    } else {
      t = r = b = l = +value || 0;
    }
    return {
      t: skip.top || t < 0 ? 0 : t > maxH ? maxH : t,
      r: skip.right || r < 0 ? 0 : r > maxW ? maxW : r,
      b: skip.bottom || b < 0 ? 0 : b > maxH ? maxH : b,
      l: skip.left || l < 0 ? 0 : l > maxW ? maxW : l
    };
  }
  function boundingRects(vm) {
    var bounds = getBarBounds(vm);
    var width = bounds.right - bounds.left;
    var height = bounds.bottom - bounds.top;
    var border = parseBorderWidth(vm, width / 2, height / 2);
    return {
      outer: {
        x: bounds.left,
        y: bounds.top,
        w: width,
        h: height
      },
      inner: {
        x: bounds.left + border.l,
        y: bounds.top + border.t,
        w: width - border.l - border.r,
        h: height - border.t - border.b
      }
    };
  }
  function inRange(vm, x, y) {
    var skipX = x === null;
    var skipY = y === null;
    var bounds = !vm || skipX && skipY ? false : getBarBounds(vm);
    return bounds && (skipX || x >= bounds.left && x <= bounds.right) && (skipY || y >= bounds.top && y <= bounds.bottom);
  }
  var element_rectangle = core_element.extend({
    _type: 'rectangle',
    draw: function () {
      var ctx = this._chart.ctx;
      var vm = this._view;
      var rects = boundingRects(vm);
      var outer = rects.outer;
      var inner = rects.inner;
      ctx.fillStyle = vm.backgroundColor;
      ctx.fillRect(outer.x, outer.y, outer.w, outer.h);
      if (outer.w === inner.w && outer.h === inner.h) {
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(outer.x, outer.y, outer.w, outer.h);
      ctx.clip();
      ctx.fillStyle = vm.borderColor;
      ctx.rect(inner.x, inner.y, inner.w, inner.h);
      ctx.fill('evenodd');
      ctx.restore();
    },
    height: function () {
      var vm = this._view;
      return vm.base - vm.y;
    },
    inRange: function (mouseX, mouseY) {
      return inRange(this._view, mouseX, mouseY);
    },
    inLabelRange: function (mouseX, mouseY) {
      var vm = this._view;
      return isVertical(vm) ? inRange(vm, mouseX, null) : inRange(vm, null, mouseY);
    },
    inXRange: function (mouseX) {
      return inRange(this._view, mouseX, null);
    },
    inYRange: function (mouseY) {
      return inRange(this._view, null, mouseY);
    },
    getCenterPoint: function () {
      var vm = this._view;
      var x, y;
      if (isVertical(vm)) {
        x = vm.x;
        y = (vm.y + vm.base) / 2;
      } else {
        x = (vm.x + vm.base) / 2;
        y = vm.y;
      }
      return {
        x: x,
        y: y
      };
    },
    getArea: function () {
      var vm = this._view;
      return isVertical(vm) ? vm.width * Math.abs(vm.y - vm.base) : vm.height * Math.abs(vm.x - vm.base);
    },
    tooltipPosition: function () {
      var vm = this._view;
      return {
        x: vm.x,
        y: vm.y
      };
    }
  });
  var elements = {};
  var Arc = element_arc;
  var Line = element_line;
  var Point = element_point;
  var Rectangle = element_rectangle;
  elements.Arc = Arc;
  elements.Line = Line;
  elements.Point = Point;
  elements.Rectangle = Rectangle;
  var deprecated = helpers$1._deprecated;
  var valueOrDefault$3 = helpers$1.valueOrDefault;
  core_defaults._set('bar', {
    hover: {
      mode: 'label'
    },
    scales: {
      xAxes: [{
        type: 'category',
        offset: true,
        gridLines: {
          offsetGridLines: true
        }
      }],
      yAxes: [{
        type: 'linear'
      }]
    }
  });
  core_defaults._set('global', {
    datasets: {
      bar: {
        categoryPercentage: 0.8,
        barPercentage: 0.9
      }
    }
  });
  function computeMinSampleSize(scale, pixels) {
    var min = scale._length;
    var prev, curr, i, ilen;
    for ((i = 1, ilen = pixels.length); i < ilen; ++i) {
      min = Math.min(min, Math.abs(pixels[i] - pixels[i - 1]));
    }
    for ((i = 0, ilen = scale.getTicks().length); i < ilen; ++i) {
      curr = scale.getPixelForTick(i);
      min = i > 0 ? Math.min(min, Math.abs(curr - prev)) : min;
      prev = curr;
    }
    return min;
  }
  function computeFitCategoryTraits(index, ruler, options) {
    var thickness = options.barThickness;
    var count = ruler.stackCount;
    var curr = ruler.pixels[index];
    var min = helpers$1.isNullOrUndef(thickness) ? computeMinSampleSize(ruler.scale, ruler.pixels) : -1;
    var size, ratio;
    if (helpers$1.isNullOrUndef(thickness)) {
      size = min * options.categoryPercentage;
      ratio = options.barPercentage;
    } else {
      size = thickness * count;
      ratio = 1;
    }
    return {
      chunk: size / count,
      ratio: ratio,
      start: curr - size / 2
    };
  }
  function computeFlexCategoryTraits(index, ruler, options) {
    var pixels = ruler.pixels;
    var curr = pixels[index];
    var prev = index > 0 ? pixels[index - 1] : null;
    var next = index < pixels.length - 1 ? pixels[index + 1] : null;
    var percent = options.categoryPercentage;
    var start, size;
    if (prev === null) {
      prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
    }
    if (next === null) {
      next = curr + curr - prev;
    }
    start = curr - (curr - Math.min(prev, next)) / 2 * percent;
    size = Math.abs(next - prev) / 2 * percent;
    return {
      chunk: size / ruler.stackCount,
      ratio: options.barPercentage,
      start: start
    };
  }
  var controller_bar = core_datasetController.extend({
    dataElementType: elements.Rectangle,
    _dataElementOptions: ['backgroundColor', 'borderColor', 'borderSkipped', 'borderWidth', 'barPercentage', 'barThickness', 'categoryPercentage', 'maxBarThickness', 'minBarLength'],
    initialize: function () {
      var me = this;
      var meta, scaleOpts;
      core_datasetController.prototype.initialize.apply(me, arguments);
      meta = me.getMeta();
      meta.stack = me.getDataset().stack;
      meta.bar = true;
      scaleOpts = me._getIndexScale().options;
      deprecated('bar chart', scaleOpts.barPercentage, 'scales.[x/y]Axes.barPercentage', 'dataset.barPercentage');
      deprecated('bar chart', scaleOpts.barThickness, 'scales.[x/y]Axes.barThickness', 'dataset.barThickness');
      deprecated('bar chart', scaleOpts.categoryPercentage, 'scales.[x/y]Axes.categoryPercentage', 'dataset.categoryPercentage');
      deprecated('bar chart', me._getValueScale().options.minBarLength, 'scales.[x/y]Axes.minBarLength', 'dataset.minBarLength');
      deprecated('bar chart', scaleOpts.maxBarThickness, 'scales.[x/y]Axes.maxBarThickness', 'dataset.maxBarThickness');
    },
    update: function (reset) {
      var me = this;
      var rects = me.getMeta().data;
      var i, ilen;
      me._ruler = me.getRuler();
      for ((i = 0, ilen = rects.length); i < ilen; ++i) {
        me.updateElement(rects[i], i, reset);
      }
    },
    updateElement: function (rectangle, index, reset) {
      var me = this;
      var meta = me.getMeta();
      var dataset = me.getDataset();
      var options = me._resolveDataElementOptions(rectangle, index);
      rectangle._xScale = me.getScaleForId(meta.xAxisID);
      rectangle._yScale = me.getScaleForId(meta.yAxisID);
      rectangle._datasetIndex = me.index;
      rectangle._index = index;
      rectangle._model = {
        backgroundColor: options.backgroundColor,
        borderColor: options.borderColor,
        borderSkipped: options.borderSkipped,
        borderWidth: options.borderWidth,
        datasetLabel: dataset.label,
        label: me.chart.data.labels[index]
      };
      if (helpers$1.isArray(dataset.data[index])) {
        rectangle._model.borderSkipped = null;
      }
      me._updateElementGeometry(rectangle, index, reset, options);
      rectangle.pivot();
    },
    _updateElementGeometry: function (rectangle, index, reset, options) {
      var me = this;
      var model = rectangle._model;
      var vscale = me._getValueScale();
      var base = vscale.getBasePixel();
      var horizontal = vscale.isHorizontal();
      var ruler = me._ruler || me.getRuler();
      var vpixels = me.calculateBarValuePixels(me.index, index, options);
      var ipixels = me.calculateBarIndexPixels(me.index, index, ruler, options);
      model.horizontal = horizontal;
      model.base = reset ? base : vpixels.base;
      model.x = horizontal ? reset ? base : vpixels.head : ipixels.center;
      model.y = horizontal ? ipixels.center : reset ? base : vpixels.head;
      model.height = horizontal ? ipixels.size : undefined;
      model.width = horizontal ? undefined : ipixels.size;
    },
    _getStacks: function (last) {
      var me = this;
      var scale = me._getIndexScale();
      var metasets = scale._getMatchingVisibleMetas(me._type);
      var stacked = scale.options.stacked;
      var ilen = metasets.length;
      var stacks = [];
      var i, meta;
      for (i = 0; i < ilen; ++i) {
        meta = metasets[i];
        if (stacked === false || stacks.indexOf(meta.stack) === -1 || stacked === undefined && meta.stack === undefined) {
          stacks.push(meta.stack);
        }
        if (meta.index === last) {
          break;
        }
      }
      return stacks;
    },
    getStackCount: function () {
      return this._getStacks().length;
    },
    getStackIndex: function (datasetIndex, name) {
      var stacks = this._getStacks(datasetIndex);
      var index = name !== undefined ? stacks.indexOf(name) : -1;
      return index === -1 ? stacks.length - 1 : index;
    },
    getRuler: function () {
      var me = this;
      var scale = me._getIndexScale();
      var pixels = [];
      var i, ilen;
      for ((i = 0, ilen = me.getMeta().data.length); i < ilen; ++i) {
        pixels.push(scale.getPixelForValue(null, i, me.index));
      }
      return {
        pixels: pixels,
        start: scale._startPixel,
        end: scale._endPixel,
        stackCount: me.getStackCount(),
        scale: scale
      };
    },
    calculateBarValuePixels: function (datasetIndex, index, options) {
      var me = this;
      var chart = me.chart;
      var scale = me._getValueScale();
      var isHorizontal = scale.isHorizontal();
      var datasets = chart.data.datasets;
      var metasets = scale._getMatchingVisibleMetas(me._type);
      var value = scale._parseValue(datasets[datasetIndex].data[index]);
      var minBarLength = options.minBarLength;
      var stacked = scale.options.stacked;
      var stack = me.getMeta().stack;
      var start = value.start === undefined ? 0 : value.max >= 0 && value.min >= 0 ? value.min : value.max;
      var length = value.start === undefined ? value.end : value.max >= 0 && value.min >= 0 ? value.max - value.min : value.min - value.max;
      var ilen = metasets.length;
      var i, imeta, ivalue, base, head, size, stackLength;
      if (stacked || stacked === undefined && stack !== undefined) {
        for (i = 0; i < ilen; ++i) {
          imeta = metasets[i];
          if (imeta.index === datasetIndex) {
            break;
          }
          if (imeta.stack === stack) {
            stackLength = scale._parseValue(datasets[imeta.index].data[index]);
            ivalue = stackLength.start === undefined ? stackLength.end : stackLength.min >= 0 && stackLength.max >= 0 ? stackLength.max : stackLength.min;
            if (value.min < 0 && ivalue < 0 || value.max >= 0 && ivalue > 0) {
              start += ivalue;
            }
          }
        }
      }
      base = scale.getPixelForValue(start);
      head = scale.getPixelForValue(start + length);
      size = head - base;
      if (minBarLength !== undefined && Math.abs(size) < minBarLength) {
        size = minBarLength;
        if (length >= 0 && !isHorizontal || length < 0 && isHorizontal) {
          head = base - minBarLength;
        } else {
          head = base + minBarLength;
        }
      }
      return {
        size: size,
        base: base,
        head: head,
        center: head + size / 2
      };
    },
    calculateBarIndexPixels: function (datasetIndex, index, ruler, options) {
      var me = this;
      var range = options.barThickness === 'flex' ? computeFlexCategoryTraits(index, ruler, options) : computeFitCategoryTraits(index, ruler, options);
      var stackIndex = me.getStackIndex(datasetIndex, me.getMeta().stack);
      var center = range.start + range.chunk * stackIndex + range.chunk / 2;
      var size = Math.min(valueOrDefault$3(options.maxBarThickness, Infinity), range.chunk * range.ratio);
      return {
        base: center - size / 2,
        head: center + size / 2,
        center: center,
        size: size
      };
    },
    draw: function () {
      var me = this;
      var chart = me.chart;
      var scale = me._getValueScale();
      var rects = me.getMeta().data;
      var dataset = me.getDataset();
      var ilen = rects.length;
      var i = 0;
      helpers$1.canvas.clipArea(chart.ctx, chart.chartArea);
      for (; i < ilen; ++i) {
        var val = scale._parseValue(dataset.data[i]);
        if (!isNaN(val.min) && !isNaN(val.max)) {
          rects[i].draw();
        }
      }
      helpers$1.canvas.unclipArea(chart.ctx);
    },
    _resolveDataElementOptions: function () {
      var me = this;
      var values = helpers$1.extend({}, core_datasetController.prototype._resolveDataElementOptions.apply(me, arguments));
      var indexOpts = me._getIndexScale().options;
      var valueOpts = me._getValueScale().options;
      values.barPercentage = valueOrDefault$3(indexOpts.barPercentage, values.barPercentage);
      values.barThickness = valueOrDefault$3(indexOpts.barThickness, values.barThickness);
      values.categoryPercentage = valueOrDefault$3(indexOpts.categoryPercentage, values.categoryPercentage);
      values.maxBarThickness = valueOrDefault$3(indexOpts.maxBarThickness, values.maxBarThickness);
      values.minBarLength = valueOrDefault$3(valueOpts.minBarLength, values.minBarLength);
      return values;
    }
  });
  var valueOrDefault$4 = helpers$1.valueOrDefault;
  var resolve$1 = helpers$1.options.resolve;
  core_defaults._set('bubble', {
    hover: {
      mode: 'single'
    },
    scales: {
      xAxes: [{
        type: 'linear',
        position: 'bottom',
        id: 'x-axis-0'
      }],
      yAxes: [{
        type: 'linear',
        position: 'left',
        id: 'y-axis-0'
      }]
    },
    tooltips: {
      callbacks: {
        title: function () {
          return '';
        },
        label: function (item, data) {
          var datasetLabel = data.datasets[item.datasetIndex].label || '';
          var dataPoint = data.datasets[item.datasetIndex].data[item.index];
          return datasetLabel + ': (' + item.xLabel + ', ' + item.yLabel + ', ' + dataPoint.r + ')';
        }
      }
    }
  });
  var controller_bubble = core_datasetController.extend({
    dataElementType: elements.Point,
    _dataElementOptions: ['backgroundColor', 'borderColor', 'borderWidth', 'hoverBackgroundColor', 'hoverBorderColor', 'hoverBorderWidth', 'hoverRadius', 'hitRadius', 'pointStyle', 'rotation'],
    update: function (reset) {
      var me = this;
      var meta = me.getMeta();
      var points = meta.data;
      helpers$1.each(points, function (point, index) {
        me.updateElement(point, index, reset);
      });
    },
    updateElement: function (point, index, reset) {
      var me = this;
      var meta = me.getMeta();
      var custom = point.custom || ({});
      var xScale = me.getScaleForId(meta.xAxisID);
      var yScale = me.getScaleForId(meta.yAxisID);
      var options = me._resolveDataElementOptions(point, index);
      var data = me.getDataset().data[index];
      var dsIndex = me.index;
      var x = reset ? xScale.getPixelForDecimal(0.5) : xScale.getPixelForValue(typeof data === 'object' ? data : NaN, index, dsIndex);
      var y = reset ? yScale.getBasePixel() : yScale.getPixelForValue(data, index, dsIndex);
      point._xScale = xScale;
      point._yScale = yScale;
      point._options = options;
      point._datasetIndex = dsIndex;
      point._index = index;
      point._model = {
        backgroundColor: options.backgroundColor,
        borderColor: options.borderColor,
        borderWidth: options.borderWidth,
        hitRadius: options.hitRadius,
        pointStyle: options.pointStyle,
        rotation: options.rotation,
        radius: reset ? 0 : options.radius,
        skip: custom.skip || isNaN(x) || isNaN(y),
        x: x,
        y: y
      };
      point.pivot();
    },
    setHoverStyle: function (point) {
      var model = point._model;
      var options = point._options;
      var getHoverColor = helpers$1.getHoverColor;
      point.$previousStyle = {
        backgroundColor: model.backgroundColor,
        borderColor: model.borderColor,
        borderWidth: model.borderWidth,
        radius: model.radius
      };
      model.backgroundColor = valueOrDefault$4(options.hoverBackgroundColor, getHoverColor(options.backgroundColor));
      model.borderColor = valueOrDefault$4(options.hoverBorderColor, getHoverColor(options.borderColor));
      model.borderWidth = valueOrDefault$4(options.hoverBorderWidth, options.borderWidth);
      model.radius = options.radius + options.hoverRadius;
    },
    _resolveDataElementOptions: function (point, index) {
      var me = this;
      var chart = me.chart;
      var dataset = me.getDataset();
      var custom = point.custom || ({});
      var data = dataset.data[index] || ({});
      var values = core_datasetController.prototype._resolveDataElementOptions.apply(me, arguments);
      var context = {
        chart: chart,
        dataIndex: index,
        dataset: dataset,
        datasetIndex: me.index
      };
      if (me._cachedDataOpts === values) {
        values = helpers$1.extend({}, values);
      }
      values.radius = resolve$1([custom.radius, data.r, me._config.radius, chart.options.elements.point.radius], context, index);
      return values;
    }
  });
  var valueOrDefault$5 = helpers$1.valueOrDefault;
  var PI$1 = Math.PI;
  var DOUBLE_PI$1 = PI$1 * 2;
  var HALF_PI$1 = PI$1 / 2;
  core_defaults._set('doughnut', {
    animation: {
      animateRotate: true,
      animateScale: false
    },
    hover: {
      mode: 'single'
    },
    legendCallback: function (chart) {
      var list = document.createElement('ul');
      var data = chart.data;
      var datasets = data.datasets;
      var labels = data.labels;
      var i, ilen, listItem, listItemSpan;
      list.setAttribute('class', chart.id + '-legend');
      if (datasets.length) {
        for ((i = 0, ilen = datasets[0].data.length); i < ilen; ++i) {
          listItem = list.appendChild(document.createElement('li'));
          listItemSpan = listItem.appendChild(document.createElement('span'));
          listItemSpan.style.backgroundColor = datasets[0].backgroundColor[i];
          if (labels[i]) {
            listItem.appendChild(document.createTextNode(labels[i]));
          }
        }
      }
      return list.outerHTML;
    },
    legend: {
      labels: {
        generateLabels: function (chart) {
          var data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map(function (label, i) {
              var meta = chart.getDatasetMeta(0);
              var style = meta.controller.getStyle(i);
              return {
                text: label,
                fillStyle: style.backgroundColor,
                strokeStyle: style.borderColor,
                lineWidth: style.borderWidth,
                hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                index: i
              };
            });
          }
          return [];
        }
      },
      onClick: function (e, legendItem) {
        var index = legendItem.index;
        var chart = this.chart;
        var i, ilen, meta;
        for ((i = 0, ilen = (chart.data.datasets || []).length); i < ilen; ++i) {
          meta = chart.getDatasetMeta(i);
          if (meta.data[index]) {
            meta.data[index].hidden = !meta.data[index].hidden;
          }
        }
        chart.update();
      }
    },
    cutoutPercentage: 50,
    rotation: -HALF_PI$1,
    circumference: DOUBLE_PI$1,
    tooltips: {
      callbacks: {
        title: function () {
          return '';
        },
        label: function (tooltipItem, data) {
          var dataLabel = data.labels[tooltipItem.index];
          var value = ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
          if (helpers$1.isArray(dataLabel)) {
            dataLabel = dataLabel.slice();
            dataLabel[0] += value;
          } else {
            dataLabel += value;
          }
          return dataLabel;
        }
      }
    }
  });
  var controller_doughnut = core_datasetController.extend({
    dataElementType: elements.Arc,
    linkScales: helpers$1.noop,
    _dataElementOptions: ['backgroundColor', 'borderColor', 'borderWidth', 'borderAlign', 'hoverBackgroundColor', 'hoverBorderColor', 'hoverBorderWidth'],
    getRingIndex: function (datasetIndex) {
      var ringIndex = 0;
      for (var j = 0; j < datasetIndex; ++j) {
        if (this.chart.isDatasetVisible(j)) {
          ++ringIndex;
        }
      }
      return ringIndex;
    },
    update: function (reset) {
      var me = this;
      var chart = me.chart;
      var chartArea = chart.chartArea;
      var opts = chart.options;
      var ratioX = 1;
      var ratioY = 1;
      var offsetX = 0;
      var offsetY = 0;
      var meta = me.getMeta();
      var arcs = meta.data;
      var cutout = opts.cutoutPercentage / 100 || 0;
      var circumference = opts.circumference;
      var chartWeight = me._getRingWeight(me.index);
      var maxWidth, maxHeight, i, ilen;
      if (circumference < DOUBLE_PI$1) {
        var startAngle = opts.rotation % DOUBLE_PI$1;
        startAngle += startAngle >= PI$1 ? -DOUBLE_PI$1 : startAngle < -PI$1 ? DOUBLE_PI$1 : 0;
        var endAngle = startAngle + circumference;
        var startX = Math.cos(startAngle);
        var startY = Math.sin(startAngle);
        var endX = Math.cos(endAngle);
        var endY = Math.sin(endAngle);
        var contains0 = startAngle <= 0 && endAngle >= 0 || endAngle >= DOUBLE_PI$1;
        var contains90 = startAngle <= HALF_PI$1 && endAngle >= HALF_PI$1 || endAngle >= DOUBLE_PI$1 + HALF_PI$1;
        var contains180 = startAngle === -PI$1 || endAngle >= PI$1;
        var contains270 = startAngle <= -HALF_PI$1 && endAngle >= -HALF_PI$1 || endAngle >= PI$1 + HALF_PI$1;
        var minX = contains180 ? -1 : Math.min(startX, startX * cutout, endX, endX * cutout);
        var minY = contains270 ? -1 : Math.min(startY, startY * cutout, endY, endY * cutout);
        var maxX = contains0 ? 1 : Math.max(startX, startX * cutout, endX, endX * cutout);
        var maxY = contains90 ? 1 : Math.max(startY, startY * cutout, endY, endY * cutout);
        ratioX = (maxX - minX) / 2;
        ratioY = (maxY - minY) / 2;
        offsetX = -(maxX + minX) / 2;
        offsetY = -(maxY + minY) / 2;
      }
      for ((i = 0, ilen = arcs.length); i < ilen; ++i) {
        arcs[i]._options = me._resolveDataElementOptions(arcs[i], i);
      }
      chart.borderWidth = me.getMaxBorderWidth();
      maxWidth = (chartArea.right - chartArea.left - chart.borderWidth) / ratioX;
      maxHeight = (chartArea.bottom - chartArea.top - chart.borderWidth) / ratioY;
      chart.outerRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
      chart.innerRadius = Math.max(chart.outerRadius * cutout, 0);
      chart.radiusLength = (chart.outerRadius - chart.innerRadius) / (me._getVisibleDatasetWeightTotal() || 1);
      chart.offsetX = offsetX * chart.outerRadius;
      chart.offsetY = offsetY * chart.outerRadius;
      meta.total = me.calculateTotal();
      me.outerRadius = chart.outerRadius - chart.radiusLength * me._getRingWeightOffset(me.index);
      me.innerRadius = Math.max(me.outerRadius - chart.radiusLength * chartWeight, 0);
      for ((i = 0, ilen = arcs.length); i < ilen; ++i) {
        me.updateElement(arcs[i], i, reset);
      }
    },
    updateElement: function (arc, index, reset) {
      var me = this;
      var chart = me.chart;
      var chartArea = chart.chartArea;
      var opts = chart.options;
      var animationOpts = opts.animation;
      var centerX = (chartArea.left + chartArea.right) / 2;
      var centerY = (chartArea.top + chartArea.bottom) / 2;
      var startAngle = opts.rotation;
      var endAngle = opts.rotation;
      var dataset = me.getDataset();
      var circumference = reset && animationOpts.animateRotate ? 0 : arc.hidden ? 0 : me.calculateCircumference(dataset.data[index]) * (opts.circumference / DOUBLE_PI$1);
      var innerRadius = reset && animationOpts.animateScale ? 0 : me.innerRadius;
      var outerRadius = reset && animationOpts.animateScale ? 0 : me.outerRadius;
      var options = arc._options || ({});
      helpers$1.extend(arc, {
        _datasetIndex: me.index,
        _index: index,
        _model: {
          backgroundColor: options.backgroundColor,
          borderColor: options.borderColor,
          borderWidth: options.borderWidth,
          borderAlign: options.borderAlign,
          x: centerX + chart.offsetX,
          y: centerY + chart.offsetY,
          startAngle: startAngle,
          endAngle: endAngle,
          circumference: circumference,
          outerRadius: outerRadius,
          innerRadius: innerRadius,
          label: helpers$1.valueAtIndexOrDefault(dataset.label, index, chart.data.labels[index])
        }
      });
      var model = arc._model;
      if (!reset || !animationOpts.animateRotate) {
        if (index === 0) {
          model.startAngle = opts.rotation;
        } else {
          model.startAngle = me.getMeta().data[index - 1]._model.endAngle;
        }
        model.endAngle = model.startAngle + model.circumference;
      }
      arc.pivot();
    },
    calculateTotal: function () {
      var dataset = this.getDataset();
      var meta = this.getMeta();
      var total = 0;
      var value;
      helpers$1.each(meta.data, function (element, index) {
        value = dataset.data[index];
        if (!isNaN(value) && !element.hidden) {
          total += Math.abs(value);
        }
      });
      return total;
    },
    calculateCircumference: function (value) {
      var total = this.getMeta().total;
      if (total > 0 && !isNaN(value)) {
        return DOUBLE_PI$1 * (Math.abs(value) / total);
      }
      return 0;
    },
    getMaxBorderWidth: function (arcs) {
      var me = this;
      var max = 0;
      var chart = me.chart;
      var i, ilen, meta, arc, controller, options, borderWidth, hoverWidth;
      if (!arcs) {
        for ((i = 0, ilen = chart.data.datasets.length); i < ilen; ++i) {
          if (chart.isDatasetVisible(i)) {
            meta = chart.getDatasetMeta(i);
            arcs = meta.data;
            if (i !== me.index) {
              controller = meta.controller;
            }
            break;
          }
        }
      }
      if (!arcs) {
        return 0;
      }
      for ((i = 0, ilen = arcs.length); i < ilen; ++i) {
        arc = arcs[i];
        if (controller) {
          controller._configure();
          options = controller._resolveDataElementOptions(arc, i);
        } else {
          options = arc._options;
        }
        if (options.borderAlign !== 'inner') {
          borderWidth = options.borderWidth;
          hoverWidth = options.hoverBorderWidth;
          max = borderWidth > max ? borderWidth : max;
          max = hoverWidth > max ? hoverWidth : max;
        }
      }
      return max;
    },
    setHoverStyle: function (arc) {
      var model = arc._model;
      var options = arc._options;
      var getHoverColor = helpers$1.getHoverColor;
      arc.$previousStyle = {
        backgroundColor: model.backgroundColor,
        borderColor: model.borderColor,
        borderWidth: model.borderWidth
      };
      model.backgroundColor = valueOrDefault$5(options.hoverBackgroundColor, getHoverColor(options.backgroundColor));
      model.borderColor = valueOrDefault$5(options.hoverBorderColor, getHoverColor(options.borderColor));
      model.borderWidth = valueOrDefault$5(options.hoverBorderWidth, options.borderWidth);
    },
    _getRingWeightOffset: function (datasetIndex) {
      var ringWeightOffset = 0;
      for (var i = 0; i < datasetIndex; ++i) {
        if (this.chart.isDatasetVisible(i)) {
          ringWeightOffset += this._getRingWeight(i);
        }
      }
      return ringWeightOffset;
    },
    _getRingWeight: function (dataSetIndex) {
      return Math.max(valueOrDefault$5(this.chart.data.datasets[dataSetIndex].weight, 1), 0);
    },
    _getVisibleDatasetWeightTotal: function () {
      return this._getRingWeightOffset(this.chart.data.datasets.length);
    }
  });
  core_defaults._set('horizontalBar', {
    hover: {
      mode: 'index',
      axis: 'y'
    },
    scales: {
      xAxes: [{
        type: 'linear',
        position: 'bottom'
      }],
      yAxes: [{
        type: 'category',
        position: 'left',
        offset: true,
        gridLines: {
          offsetGridLines: true
        }
      }]
    },
    elements: {
      rectangle: {
        borderSkipped: 'left'
      }
    },
    tooltips: {
      mode: 'index',
      axis: 'y'
    }
  });
  core_defaults._set('global', {
    datasets: {
      horizontalBar: {
        categoryPercentage: 0.8,
        barPercentage: 0.9
      }
    }
  });
  var controller_horizontalBar = controller_bar.extend({
    _getValueScaleId: function () {
      return this.getMeta().xAxisID;
    },
    _getIndexScaleId: function () {
      return this.getMeta().yAxisID;
    }
  });
  var valueOrDefault$6 = helpers$1.valueOrDefault;
  var resolve$2 = helpers$1.options.resolve;
  var isPointInArea = helpers$1.canvas._isPointInArea;
  core_defaults._set('line', {
    showLines: true,
    spanGaps: false,
    hover: {
      mode: 'label'
    },
    scales: {
      xAxes: [{
        type: 'category',
        id: 'x-axis-0'
      }],
      yAxes: [{
        type: 'linear',
        id: 'y-axis-0'
      }]
    }
  });
  function scaleClip(scale, halfBorderWidth) {
    var tickOpts = scale && scale.options.ticks || ({});
    var reverse = tickOpts.reverse;
    var min = tickOpts.min === undefined ? halfBorderWidth : 0;
    var max = tickOpts.max === undefined ? halfBorderWidth : 0;
    return {
      start: reverse ? max : min,
      end: reverse ? min : max
    };
  }
  function defaultClip(xScale, yScale, borderWidth) {
    var halfBorderWidth = borderWidth / 2;
    var x = scaleClip(xScale, halfBorderWidth);
    var y = scaleClip(yScale, halfBorderWidth);
    return {
      top: y.end,
      right: x.end,
      bottom: y.start,
      left: x.start
    };
  }
  function toClip(value) {
    var t, r, b, l;
    if (helpers$1.isObject(value)) {
      t = value.top;
      r = value.right;
      b = value.bottom;
      l = value.left;
    } else {
      t = r = b = l = value;
    }
    return {
      top: t,
      right: r,
      bottom: b,
      left: l
    };
  }
  var controller_line = core_datasetController.extend({
    datasetElementType: elements.Line,
    dataElementType: elements.Point,
    _datasetElementOptions: ['backgroundColor', 'borderCapStyle', 'borderColor', 'borderDash', 'borderDashOffset', 'borderJoinStyle', 'borderWidth', 'cubicInterpolationMode', 'fill'],
    _dataElementOptions: {
      backgroundColor: 'pointBackgroundColor',
      borderColor: 'pointBorderColor',
      borderWidth: 'pointBorderWidth',
      hitRadius: 'pointHitRadius',
      hoverBackgroundColor: 'pointHoverBackgroundColor',
      hoverBorderColor: 'pointHoverBorderColor',
      hoverBorderWidth: 'pointHoverBorderWidth',
      hoverRadius: 'pointHoverRadius',
      pointStyle: 'pointStyle',
      radius: 'pointRadius',
      rotation: 'pointRotation'
    },
    update: function (reset) {
      var me = this;
      var meta = me.getMeta();
      var line = meta.dataset;
      var points = meta.data || [];
      var options = me.chart.options;
      var config = me._config;
      var showLine = me._showLine = valueOrDefault$6(config.showLine, options.showLines);
      var i, ilen;
      me._xScale = me.getScaleForId(meta.xAxisID);
      me._yScale = me.getScaleForId(meta.yAxisID);
      if (showLine) {
        if (config.tension !== undefined && config.lineTension === undefined) {
          config.lineTension = config.tension;
        }
        line._scale = me._yScale;
        line._datasetIndex = me.index;
        line._children = points;
        line._model = me._resolveDatasetElementOptions(line);
        line.pivot();
      }
      for ((i = 0, ilen = points.length); i < ilen; ++i) {
        me.updateElement(points[i], i, reset);
      }
      if (showLine && line._model.tension !== 0) {
        me.updateBezierControlPoints();
      }
      for ((i = 0, ilen = points.length); i < ilen; ++i) {
        points[i].pivot();
      }
    },
    updateElement: function (point, index, reset) {
      var me = this;
      var meta = me.getMeta();
      var custom = point.custom || ({});
      var dataset = me.getDataset();
      var datasetIndex = me.index;
      var value = dataset.data[index];
      var xScale = me._xScale;
      var yScale = me._yScale;
      var lineModel = meta.dataset._model;
      var x, y;
      var options = me._resolveDataElementOptions(point, index);
      x = xScale.getPixelForValue(typeof value === 'object' ? value : NaN, index, datasetIndex);
      y = reset ? yScale.getBasePixel() : me.calculatePointY(value, index, datasetIndex);
      point._xScale = xScale;
      point._yScale = yScale;
      point._options = options;
      point._datasetIndex = datasetIndex;
      point._index = index;
      point._model = {
        x: x,
        y: y,
        skip: custom.skip || isNaN(x) || isNaN(y),
        radius: options.radius,
        pointStyle: options.pointStyle,
        rotation: options.rotation,
        backgroundColor: options.backgroundColor,
        borderColor: options.borderColor,
        borderWidth: options.borderWidth,
        tension: valueOrDefault$6(custom.tension, lineModel ? lineModel.tension : 0),
        steppedLine: lineModel ? lineModel.steppedLine : false,
        hitRadius: options.hitRadius
      };
    },
    _resolveDatasetElementOptions: function (element) {
      var me = this;
      var config = me._config;
      var custom = element.custom || ({});
      var options = me.chart.options;
      var lineOptions = options.elements.line;
      var values = core_datasetController.prototype._resolveDatasetElementOptions.apply(me, arguments);
      values.spanGaps = valueOrDefault$6(config.spanGaps, options.spanGaps);
      values.tension = valueOrDefault$6(config.lineTension, lineOptions.tension);
      values.steppedLine = resolve$2([custom.steppedLine, config.steppedLine, lineOptions.stepped]);
      values.clip = toClip(valueOrDefault$6(config.clip, defaultClip(me._xScale, me._yScale, values.borderWidth)));
      return values;
    },
    calculatePointY: function (value, index, datasetIndex) {
      var me = this;
      var chart = me.chart;
      var yScale = me._yScale;
      var sumPos = 0;
      var sumNeg = 0;
      var i, ds, dsMeta, stackedRightValue, rightValue, metasets, ilen;
      if (yScale.options.stacked) {
        rightValue = +yScale.getRightValue(value);
        metasets = chart._getSortedVisibleDatasetMetas();
        ilen = metasets.length;
        for (i = 0; i < ilen; ++i) {
          dsMeta = metasets[i];
          if (dsMeta.index === datasetIndex) {
            break;
          }
          ds = chart.data.datasets[dsMeta.index];
          if (dsMeta.type === 'line' && dsMeta.yAxisID === yScale.id) {
            stackedRightValue = +yScale.getRightValue(ds.data[index]);
            if (stackedRightValue < 0) {
              sumNeg += stackedRightValue || 0;
            } else {
              sumPos += stackedRightValue || 0;
            }
          }
        }
        if (rightValue < 0) {
          return yScale.getPixelForValue(sumNeg + rightValue);
        }
        return yScale.getPixelForValue(sumPos + rightValue);
      }
      return yScale.getPixelForValue(value);
    },
    updateBezierControlPoints: function () {
      var me = this;
      var chart = me.chart;
      var meta = me.getMeta();
      var lineModel = meta.dataset._model;
      var area = chart.chartArea;
      var points = meta.data || [];
      var i, ilen, model, controlPoints;
      if (lineModel.spanGaps) {
        points = points.filter(function (pt) {
          return !pt._model.skip;
        });
      }
      function capControlPoint(pt, min, max) {
        return Math.max(Math.min(pt, max), min);
      }
      if (lineModel.cubicInterpolationMode === 'monotone') {
        helpers$1.splineCurveMonotone(points);
      } else {
        for ((i = 0, ilen = points.length); i < ilen; ++i) {
          model = points[i]._model;
          controlPoints = helpers$1.splineCurve(helpers$1.previousItem(points, i)._model, model, helpers$1.nextItem(points, i)._model, lineModel.tension);
          model.controlPointPreviousX = controlPoints.previous.x;
          model.controlPointPreviousY = controlPoints.previous.y;
          model.controlPointNextX = controlPoints.next.x;
          model.controlPointNextY = controlPoints.next.y;
        }
      }
      if (chart.options.elements.line.capBezierPoints) {
        for ((i = 0, ilen = points.length); i < ilen; ++i) {
          model = points[i]._model;
          if (isPointInArea(model, area)) {
            if (i > 0 && isPointInArea(points[i - 1]._model, area)) {
              model.controlPointPreviousX = capControlPoint(model.controlPointPreviousX, area.left, area.right);
              model.controlPointPreviousY = capControlPoint(model.controlPointPreviousY, area.top, area.bottom);
            }
            if (i < points.length - 1 && isPointInArea(points[i + 1]._model, area)) {
              model.controlPointNextX = capControlPoint(model.controlPointNextX, area.left, area.right);
              model.controlPointNextY = capControlPoint(model.controlPointNextY, area.top, area.bottom);
            }
          }
        }
      }
    },
    draw: function () {
      var me = this;
      var chart = me.chart;
      var meta = me.getMeta();
      var points = meta.data || [];
      var area = chart.chartArea;
      var canvas = chart.canvas;
      var i = 0;
      var ilen = points.length;
      var clip;
      if (me._showLine) {
        clip = meta.dataset._model.clip;
        helpers$1.canvas.clipArea(chart.ctx, {
          left: clip.left === false ? 0 : area.left - clip.left,
          right: clip.right === false ? canvas.width : area.right + clip.right,
          top: clip.top === false ? 0 : area.top - clip.top,
          bottom: clip.bottom === false ? canvas.height : area.bottom + clip.bottom
        });
        meta.dataset.draw();
        helpers$1.canvas.unclipArea(chart.ctx);
      }
      for (; i < ilen; ++i) {
        points[i].draw(area);
      }
    },
    setHoverStyle: function (point) {
      var model = point._model;
      var options = point._options;
      var getHoverColor = helpers$1.getHoverColor;
      point.$previousStyle = {
        backgroundColor: model.backgroundColor,
        borderColor: model.borderColor,
        borderWidth: model.borderWidth,
        radius: model.radius
      };
      model.backgroundColor = valueOrDefault$6(options.hoverBackgroundColor, getHoverColor(options.backgroundColor));
      model.borderColor = valueOrDefault$6(options.hoverBorderColor, getHoverColor(options.borderColor));
      model.borderWidth = valueOrDefault$6(options.hoverBorderWidth, options.borderWidth);
      model.radius = valueOrDefault$6(options.hoverRadius, options.radius);
    }
  });
  var resolve$3 = helpers$1.options.resolve;
  core_defaults._set('polarArea', {
    scale: {
      type: 'radialLinear',
      angleLines: {
        display: false
      },
      gridLines: {
        circular: true
      },
      pointLabels: {
        display: false
      },
      ticks: {
        beginAtZero: true
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    },
    startAngle: -0.5 * Math.PI,
    legendCallback: function (chart) {
      var list = document.createElement('ul');
      var data = chart.data;
      var datasets = data.datasets;
      var labels = data.labels;
      var i, ilen, listItem, listItemSpan;
      list.setAttribute('class', chart.id + '-legend');
      if (datasets.length) {
        for ((i = 0, ilen = datasets[0].data.length); i < ilen; ++i) {
          listItem = list.appendChild(document.createElement('li'));
          listItemSpan = listItem.appendChild(document.createElement('span'));
          listItemSpan.style.backgroundColor = datasets[0].backgroundColor[i];
          if (labels[i]) {
            listItem.appendChild(document.createTextNode(labels[i]));
          }
        }
      }
      return list.outerHTML;
    },
    legend: {
      labels: {
        generateLabels: function (chart) {
          var data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map(function (label, i) {
              var meta = chart.getDatasetMeta(0);
              var style = meta.controller.getStyle(i);
              return {
                text: label,
                fillStyle: style.backgroundColor,
                strokeStyle: style.borderColor,
                lineWidth: style.borderWidth,
                hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                index: i
              };
            });
          }
          return [];
        }
      },
      onClick: function (e, legendItem) {
        var index = legendItem.index;
        var chart = this.chart;
        var i, ilen, meta;
        for ((i = 0, ilen = (chart.data.datasets || []).length); i < ilen; ++i) {
          meta = chart.getDatasetMeta(i);
          meta.data[index].hidden = !meta.data[index].hidden;
        }
        chart.update();
      }
    },
    tooltips: {
      callbacks: {
        title: function () {
          return '';
        },
        label: function (item, data) {
          return data.labels[item.index] + ': ' + item.yLabel;
        }
      }
    }
  });
  var controller_polarArea = core_datasetController.extend({
    dataElementType: elements.Arc,
    linkScales: helpers$1.noop,
    _dataElementOptions: ['backgroundColor', 'borderColor', 'borderWidth', 'borderAlign', 'hoverBackgroundColor', 'hoverBorderColor', 'hoverBorderWidth'],
    _getIndexScaleId: function () {
      return this.chart.scale.id;
    },
    _getValueScaleId: function () {
      return this.chart.scale.id;
    },
    update: function (reset) {
      var me = this;
      var dataset = me.getDataset();
      var meta = me.getMeta();
      var start = me.chart.options.startAngle || 0;
      var starts = me._starts = [];
      var angles = me._angles = [];
      var arcs = meta.data;
      var i, ilen, angle;
      me._updateRadius();
      meta.count = me.countVisibleElements();
      for ((i = 0, ilen = dataset.data.length); i < ilen; i++) {
        starts[i] = start;
        angle = me._computeAngle(i);
        angles[i] = angle;
        start += angle;
      }
      for ((i = 0, ilen = arcs.length); i < ilen; ++i) {
        arcs[i]._options = me._resolveDataElementOptions(arcs[i], i);
        me.updateElement(arcs[i], i, reset);
      }
    },
    _updateRadius: function () {
      var me = this;
      var chart = me.chart;
      var chartArea = chart.chartArea;
      var opts = chart.options;
      var minSize = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
      chart.outerRadius = Math.max(minSize / 2, 0);
      chart.innerRadius = Math.max(opts.cutoutPercentage ? chart.outerRadius / 100 * opts.cutoutPercentage : 1, 0);
      chart.radiusLength = (chart.outerRadius - chart.innerRadius) / chart.getVisibleDatasetCount();
      me.outerRadius = chart.outerRadius - chart.radiusLength * me.index;
      me.innerRadius = me.outerRadius - chart.radiusLength;
    },
    updateElement: function (arc, index, reset) {
      var me = this;
      var chart = me.chart;
      var dataset = me.getDataset();
      var opts = chart.options;
      var animationOpts = opts.animation;
      var scale = chart.scale;
      var labels = chart.data.labels;
      var centerX = scale.xCenter;
      var centerY = scale.yCenter;
      var datasetStartAngle = opts.startAngle;
      var distance = arc.hidden ? 0 : scale.getDistanceFromCenterForValue(dataset.data[index]);
      var startAngle = me._starts[index];
      var endAngle = startAngle + (arc.hidden ? 0 : me._angles[index]);
      var resetRadius = animationOpts.animateScale ? 0 : scale.getDistanceFromCenterForValue(dataset.data[index]);
      var options = arc._options || ({});
      helpers$1.extend(arc, {
        _datasetIndex: me.index,
        _index: index,
        _scale: scale,
        _model: {
          backgroundColor: options.backgroundColor,
          borderColor: options.borderColor,
          borderWidth: options.borderWidth,
          borderAlign: options.borderAlign,
          x: centerX,
          y: centerY,
          innerRadius: 0,
          outerRadius: reset ? resetRadius : distance,
          startAngle: reset && animationOpts.animateRotate ? datasetStartAngle : startAngle,
          endAngle: reset && animationOpts.animateRotate ? datasetStartAngle : endAngle,
          label: helpers$1.valueAtIndexOrDefault(labels, index, labels[index])
        }
      });
      arc.pivot();
    },
    countVisibleElements: function () {
      var dataset = this.getDataset();
      var meta = this.getMeta();
      var count = 0;
      helpers$1.each(meta.data, function (element, index) {
        if (!isNaN(dataset.data[index]) && !element.hidden) {
          count++;
        }
      });
      return count;
    },
    setHoverStyle: function (arc) {
      var model = arc._model;
      var options = arc._options;
      var getHoverColor = helpers$1.getHoverColor;
      var valueOrDefault = helpers$1.valueOrDefault;
      arc.$previousStyle = {
        backgroundColor: model.backgroundColor,
        borderColor: model.borderColor,
        borderWidth: model.borderWidth
      };
      model.backgroundColor = valueOrDefault(options.hoverBackgroundColor, getHoverColor(options.backgroundColor));
      model.borderColor = valueOrDefault(options.hoverBorderColor, getHoverColor(options.borderColor));
      model.borderWidth = valueOrDefault(options.hoverBorderWidth, options.borderWidth);
    },
    _computeAngle: function (index) {
      var me = this;
      var count = this.getMeta().count;
      var dataset = me.getDataset();
      var meta = me.getMeta();
      if (isNaN(dataset.data[index]) || meta.data[index].hidden) {
        return 0;
      }
      var context = {
        chart: me.chart,
        dataIndex: index,
        dataset: dataset,
        datasetIndex: me.index
      };
      return resolve$3([me.chart.options.elements.arc.angle, 2 * Math.PI / count], context, index);
    }
  });
  core_defaults._set('pie', helpers$1.clone(core_defaults.doughnut));
  core_defaults._set('pie', {
    cutoutPercentage: 0
  });
  var controller_pie = controller_doughnut;
  var valueOrDefault$7 = helpers$1.valueOrDefault;
  core_defaults._set('radar', {
    spanGaps: false,
    scale: {
      type: 'radialLinear'
    },
    elements: {
      line: {
        fill: 'start',
        tension: 0
      }
    }
  });
  var controller_radar = core_datasetController.extend({
    datasetElementType: elements.Line,
    dataElementType: elements.Point,
    linkScales: helpers$1.noop,
    _datasetElementOptions: ['backgroundColor', 'borderWidth', 'borderColor', 'borderCapStyle', 'borderDash', 'borderDashOffset', 'borderJoinStyle', 'fill'],
    _dataElementOptions: {
      backgroundColor: 'pointBackgroundColor',
      borderColor: 'pointBorderColor',
      borderWidth: 'pointBorderWidth',
      hitRadius: 'pointHitRadius',
      hoverBackgroundColor: 'pointHoverBackgroundColor',
      hoverBorderColor: 'pointHoverBorderColor',
      hoverBorderWidth: 'pointHoverBorderWidth',
      hoverRadius: 'pointHoverRadius',
      pointStyle: 'pointStyle',
      radius: 'pointRadius',
      rotation: 'pointRotation'
    },
    _getIndexScaleId: function () {
      return this.chart.scale.id;
    },
    _getValueScaleId: function () {
      return this.chart.scale.id;
    },
    update: function (reset) {
      var me = this;
      var meta = me.getMeta();
      var line = meta.dataset;
      var points = meta.data || [];
      var scale = me.chart.scale;
      var config = me._config;
      var i, ilen;
      if (config.tension !== undefined && config.lineTension === undefined) {
        config.lineTension = config.tension;
      }
      line._scale = scale;
      line._datasetIndex = me.index;
      line._children = points;
      line._loop = true;
      line._model = me._resolveDatasetElementOptions(line);
      line.pivot();
      for ((i = 0, ilen = points.length); i < ilen; ++i) {
        me.updateElement(points[i], i, reset);
      }
      me.updateBezierControlPoints();
      for ((i = 0, ilen = points.length); i < ilen; ++i) {
        points[i].pivot();
      }
    },
    updateElement: function (point, index, reset) {
      var me = this;
      var custom = point.custom || ({});
      var dataset = me.getDataset();
      var scale = me.chart.scale;
      var pointPosition = scale.getPointPositionForValue(index, dataset.data[index]);
      var options = me._resolveDataElementOptions(point, index);
      var lineModel = me.getMeta().dataset._model;
      var x = reset ? scale.xCenter : pointPosition.x;
      var y = reset ? scale.yCenter : pointPosition.y;
      point._scale = scale;
      point._options = options;
      point._datasetIndex = me.index;
      point._index = index;
      point._model = {
        x: x,
        y: y,
        skip: custom.skip || isNaN(x) || isNaN(y),
        radius: options.radius,
        pointStyle: options.pointStyle,
        rotation: options.rotation,
        backgroundColor: options.backgroundColor,
        borderColor: options.borderColor,
        borderWidth: options.borderWidth,
        tension: valueOrDefault$7(custom.tension, lineModel ? lineModel.tension : 0),
        hitRadius: options.hitRadius
      };
    },
    _resolveDatasetElementOptions: function () {
      var me = this;
      var config = me._config;
      var options = me.chart.options;
      var values = core_datasetController.prototype._resolveDatasetElementOptions.apply(me, arguments);
      values.spanGaps = valueOrDefault$7(config.spanGaps, options.spanGaps);
      values.tension = valueOrDefault$7(config.lineTension, options.elements.line.tension);
      return values;
    },
    updateBezierControlPoints: function () {
      var me = this;
      var meta = me.getMeta();
      var area = me.chart.chartArea;
      var points = meta.data || [];
      var i, ilen, model, controlPoints;
      if (meta.dataset._model.spanGaps) {
        points = points.filter(function (pt) {
          return !pt._model.skip;
        });
      }
      function capControlPoint(pt, min, max) {
        return Math.max(Math.min(pt, max), min);
      }
      for ((i = 0, ilen = points.length); i < ilen; ++i) {
        model = points[i]._model;
        controlPoints = helpers$1.splineCurve(helpers$1.previousItem(points, i, true)._model, model, helpers$1.nextItem(points, i, true)._model, model.tension);
        model.controlPointPreviousX = capControlPoint(controlPoints.previous.x, area.left, area.right);
        model.controlPointPreviousY = capControlPoint(controlPoints.previous.y, area.top, area.bottom);
        model.controlPointNextX = capControlPoint(controlPoints.next.x, area.left, area.right);
        model.controlPointNextY = capControlPoint(controlPoints.next.y, area.top, area.bottom);
      }
    },
    setHoverStyle: function (point) {
      var model = point._model;
      var options = point._options;
      var getHoverColor = helpers$1.getHoverColor;
      point.$previousStyle = {
        backgroundColor: model.backgroundColor,
        borderColor: model.borderColor,
        borderWidth: model.borderWidth,
        radius: model.radius
      };
      model.backgroundColor = valueOrDefault$7(options.hoverBackgroundColor, getHoverColor(options.backgroundColor));
      model.borderColor = valueOrDefault$7(options.hoverBorderColor, getHoverColor(options.borderColor));
      model.borderWidth = valueOrDefault$7(options.hoverBorderWidth, options.borderWidth);
      model.radius = valueOrDefault$7(options.hoverRadius, options.radius);
    }
  });
  core_defaults._set('scatter', {
    hover: {
      mode: 'single'
    },
    scales: {
      xAxes: [{
        id: 'x-axis-1',
        type: 'linear',
        position: 'bottom'
      }],
      yAxes: [{
        id: 'y-axis-1',
        type: 'linear',
        position: 'left'
      }]
    },
    tooltips: {
      callbacks: {
        title: function () {
          return '';
        },
        label: function (item) {
          return '(' + item.xLabel + ', ' + item.yLabel + ')';
        }
      }
    }
  });
  core_defaults._set('global', {
    datasets: {
      scatter: {
        showLine: false
      }
    }
  });
  var controller_scatter = controller_line;
  var controllers = {
    bar: controller_bar,
    bubble: controller_bubble,
    doughnut: controller_doughnut,
    horizontalBar: controller_horizontalBar,
    line: controller_line,
    polarArea: controller_polarArea,
    pie: controller_pie,
    radar: controller_radar,
    scatter: controller_scatter
  };
  function getRelativePosition(e, chart) {
    if (e.native) {
      return {
        x: e.x,
        y: e.y
      };
    }
    return helpers$1.getRelativePosition(e, chart);
  }
  function parseVisibleItems(chart, handler) {
    var metasets = chart._getSortedVisibleDatasetMetas();
    var metadata, i, j, ilen, jlen, element;
    for ((i = 0, ilen = metasets.length); i < ilen; ++i) {
      metadata = metasets[i].data;
      for ((j = 0, jlen = metadata.length); j < jlen; ++j) {
        element = metadata[j];
        if (!element._view.skip) {
          handler(element);
        }
      }
    }
  }
  function getIntersectItems(chart, position) {
    var elements = [];
    parseVisibleItems(chart, function (element) {
      if (element.inRange(position.x, position.y)) {
        elements.push(element);
      }
    });
    return elements;
  }
  function getNearestItems(chart, position, intersect, distanceMetric) {
    var minDistance = Number.POSITIVE_INFINITY;
    var nearestItems = [];
    parseVisibleItems(chart, function (element) {
      if (intersect && !element.inRange(position.x, position.y)) {
        return;
      }
      var center = element.getCenterPoint();
      var distance = distanceMetric(position, center);
      if (distance < minDistance) {
        nearestItems = [element];
        minDistance = distance;
      } else if (distance === minDistance) {
        nearestItems.push(element);
      }
    });
    return nearestItems;
  }
  function getDistanceMetricForAxis(axis) {
    var useX = axis.indexOf('x') !== -1;
    var useY = axis.indexOf('y') !== -1;
    return function (pt1, pt2) {
      var deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
      var deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
      return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    };
  }
  function indexMode(chart, e, options) {
    var position = getRelativePosition(e, chart);
    options.axis = options.axis || 'x';
    var distanceMetric = getDistanceMetricForAxis(options.axis);
    var items = options.intersect ? getIntersectItems(chart, position) : getNearestItems(chart, position, false, distanceMetric);
    var elements = [];
    if (!items.length) {
      return [];
    }
    chart._getSortedVisibleDatasetMetas().forEach(function (meta) {
      var element = meta.data[items[0]._index];
      if (element && !element._view.skip) {
        elements.push(element);
      }
    });
    return elements;
  }
  var core_interaction = {
    modes: {
      single: function (chart, e) {
        var position = getRelativePosition(e, chart);
        var elements = [];
        parseVisibleItems(chart, function (element) {
          if (element.inRange(position.x, position.y)) {
            elements.push(element);
            return elements;
          }
        });
        return elements.slice(0, 1);
      },
      label: indexMode,
      index: indexMode,
      dataset: function (chart, e, options) {
        var position = getRelativePosition(e, chart);
        options.axis = options.axis || 'xy';
        var distanceMetric = getDistanceMetricForAxis(options.axis);
        var items = options.intersect ? getIntersectItems(chart, position) : getNearestItems(chart, position, false, distanceMetric);
        if (items.length > 0) {
          items = chart.getDatasetMeta(items[0]._datasetIndex).data;
        }
        return items;
      },
      'x-axis': function (chart, e) {
        return indexMode(chart, e, {
          intersect: false
        });
      },
      point: function (chart, e) {
        var position = getRelativePosition(e, chart);
        return getIntersectItems(chart, position);
      },
      nearest: function (chart, e, options) {
        var position = getRelativePosition(e, chart);
        options.axis = options.axis || 'xy';
        var distanceMetric = getDistanceMetricForAxis(options.axis);
        return getNearestItems(chart, position, options.intersect, distanceMetric);
      },
      x: function (chart, e, options) {
        var position = getRelativePosition(e, chart);
        var items = [];
        var intersectsItem = false;
        parseVisibleItems(chart, function (element) {
          if (element.inXRange(position.x)) {
            items.push(element);
          }
          if (element.inRange(position.x, position.y)) {
            intersectsItem = true;
          }
        });
        if (options.intersect && !intersectsItem) {
          items = [];
        }
        return items;
      },
      y: function (chart, e, options) {
        var position = getRelativePosition(e, chart);
        var items = [];
        var intersectsItem = false;
        parseVisibleItems(chart, function (element) {
          if (element.inYRange(position.y)) {
            items.push(element);
          }
          if (element.inRange(position.x, position.y)) {
            intersectsItem = true;
          }
        });
        if (options.intersect && !intersectsItem) {
          items = [];
        }
        return items;
      }
    }
  };
  var extend = helpers$1.extend;
  function filterByPosition(array, position) {
    return helpers$1.where(array, function (v) {
      return v.pos === position;
    });
  }
  function sortByWeight(array, reverse) {
    return array.sort(function (a, b) {
      var v0 = reverse ? b : a;
      var v1 = reverse ? a : b;
      return v0.weight === v1.weight ? v0.index - v1.index : v0.weight - v1.weight;
    });
  }
  function wrapBoxes(boxes) {
    var layoutBoxes = [];
    var i, ilen, box;
    for ((i = 0, ilen = (boxes || []).length); i < ilen; ++i) {
      box = boxes[i];
      layoutBoxes.push({
        index: i,
        box: box,
        pos: box.position,
        horizontal: box.isHorizontal(),
        weight: box.weight
      });
    }
    return layoutBoxes;
  }
  function setLayoutDims(layouts, params) {
    var i, ilen, layout;
    for ((i = 0, ilen = layouts.length); i < ilen; ++i) {
      layout = layouts[i];
      layout.width = layout.horizontal ? layout.box.fullWidth && params.availableWidth : params.vBoxMaxWidth;
      layout.height = layout.horizontal && params.hBoxMaxHeight;
    }
  }
  function buildLayoutBoxes(boxes) {
    var layoutBoxes = wrapBoxes(boxes);
    var left = sortByWeight(filterByPosition(layoutBoxes, 'left'), true);
    var right = sortByWeight(filterByPosition(layoutBoxes, 'right'));
    var top = sortByWeight(filterByPosition(layoutBoxes, 'top'), true);
    var bottom = sortByWeight(filterByPosition(layoutBoxes, 'bottom'));
    return {
      leftAndTop: left.concat(top),
      rightAndBottom: right.concat(bottom),
      chartArea: filterByPosition(layoutBoxes, 'chartArea'),
      vertical: left.concat(right),
      horizontal: top.concat(bottom)
    };
  }
  function getCombinedMax(maxPadding, chartArea, a, b) {
    return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
  }
  function updateDims(chartArea, params, layout) {
    var box = layout.box;
    var maxPadding = chartArea.maxPadding;
    var newWidth, newHeight;
    if (layout.size) {
      chartArea[layout.pos] -= layout.size;
    }
    layout.size = layout.horizontal ? box.height : box.width;
    chartArea[layout.pos] += layout.size;
    if (box.getPadding) {
      var boxPadding = box.getPadding();
      maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
      maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
      maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
      maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
    }
    newWidth = params.outerWidth - getCombinedMax(maxPadding, chartArea, 'left', 'right');
    newHeight = params.outerHeight - getCombinedMax(maxPadding, chartArea, 'top', 'bottom');
    if (newWidth !== chartArea.w || newHeight !== chartArea.h) {
      chartArea.w = newWidth;
      chartArea.h = newHeight;
      var sizes = layout.horizontal ? [newWidth, chartArea.w] : [newHeight, chartArea.h];
      return sizes[0] !== sizes[1] && (!isNaN(sizes[0]) || !isNaN(sizes[1]));
    }
  }
  function handleMaxPadding(chartArea) {
    var maxPadding = chartArea.maxPadding;
    function updatePos(pos) {
      var change = Math.max(maxPadding[pos] - chartArea[pos], 0);
      chartArea[pos] += change;
      return change;
    }
    chartArea.y += updatePos('top');
    chartArea.x += updatePos('left');
    updatePos('right');
    updatePos('bottom');
  }
  function getMargins(horizontal, chartArea) {
    var maxPadding = chartArea.maxPadding;
    function marginForPositions(positions) {
      var margin = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      };
      positions.forEach(function (pos) {
        margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
      });
      return margin;
    }
    return horizontal ? marginForPositions(['left', 'right']) : marginForPositions(['top', 'bottom']);
  }
  function fitBoxes(boxes, chartArea, params) {
    var refitBoxes = [];
    var i, ilen, layout, box, refit, changed;
    for ((i = 0, ilen = boxes.length); i < ilen; ++i) {
      layout = boxes[i];
      box = layout.box;
      box.update(layout.width || chartArea.w, layout.height || chartArea.h, getMargins(layout.horizontal, chartArea));
      if (updateDims(chartArea, params, layout)) {
        changed = true;
        if (refitBoxes.length) {
          refit = true;
        }
      }
      if (!box.fullWidth) {
        refitBoxes.push(layout);
      }
    }
    return refit ? fitBoxes(refitBoxes, chartArea, params) || changed : changed;
  }
  function placeBoxes(boxes, chartArea, params) {
    var userPadding = params.padding;
    var x = chartArea.x;
    var y = chartArea.y;
    var i, ilen, layout, box;
    for ((i = 0, ilen = boxes.length); i < ilen; ++i) {
      layout = boxes[i];
      box = layout.box;
      if (layout.horizontal) {
        box.left = box.fullWidth ? userPadding.left : chartArea.left;
        box.right = box.fullWidth ? params.outerWidth - userPadding.right : chartArea.left + chartArea.w;
        box.top = y;
        box.bottom = y + box.height;
        box.width = box.right - box.left;
        y = box.bottom;
      } else {
        box.left = x;
        box.right = x + box.width;
        box.top = chartArea.top;
        box.bottom = chartArea.top + chartArea.h;
        box.height = box.bottom - box.top;
        x = box.right;
      }
    }
    chartArea.x = x;
    chartArea.y = y;
  }
  core_defaults._set('global', {
    layout: {
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    }
  });
  var core_layouts = {
    defaults: {},
    addBox: function (chart, item) {
      if (!chart.boxes) {
        chart.boxes = [];
      }
      item.fullWidth = item.fullWidth || false;
      item.position = item.position || 'top';
      item.weight = item.weight || 0;
      item._layers = item._layers || (function () {
        return [{
          z: 0,
          draw: function () {
            item.draw.apply(item, arguments);
          }
        }];
      });
      chart.boxes.push(item);
    },
    removeBox: function (chart, layoutItem) {
      var index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
      if (index !== -1) {
        chart.boxes.splice(index, 1);
      }
    },
    configure: function (chart, item, options) {
      var props = ['fullWidth', 'position', 'weight'];
      var ilen = props.length;
      var i = 0;
      var prop;
      for (; i < ilen; ++i) {
        prop = props[i];
        if (options.hasOwnProperty(prop)) {
          item[prop] = options[prop];
        }
      }
    },
    update: function (chart, width, height) {
      if (!chart) {
        return;
      }
      var layoutOptions = chart.options.layout || ({});
      var padding = helpers$1.options.toPadding(layoutOptions.padding);
      var availableWidth = width - padding.width;
      var availableHeight = height - padding.height;
      var boxes = buildLayoutBoxes(chart.boxes);
      var verticalBoxes = boxes.vertical;
      var horizontalBoxes = boxes.horizontal;
      var params = Object.freeze({
        outerWidth: width,
        outerHeight: height,
        padding: padding,
        availableWidth: availableWidth,
        vBoxMaxWidth: availableWidth / 2 / verticalBoxes.length,
        hBoxMaxHeight: availableHeight / 2
      });
      var chartArea = extend({
        maxPadding: extend({}, padding),
        w: availableWidth,
        h: availableHeight,
        x: padding.left,
        y: padding.top
      }, padding);
      setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
      fitBoxes(verticalBoxes, chartArea, params);
      if (fitBoxes(horizontalBoxes, chartArea, params)) {
        fitBoxes(verticalBoxes, chartArea, params);
      }
      handleMaxPadding(chartArea);
      placeBoxes(boxes.leftAndTop, chartArea, params);
      chartArea.x += chartArea.w;
      chartArea.y += chartArea.h;
      placeBoxes(boxes.rightAndBottom, chartArea, params);
      chart.chartArea = {
        left: chartArea.left,
        top: chartArea.top,
        right: chartArea.left + chartArea.w,
        bottom: chartArea.top + chartArea.h
      };
      helpers$1.each(boxes.chartArea, function (layout) {
        var box = layout.box;
        extend(box, chart.chartArea);
        box.update(chartArea.w, chartArea.h);
      });
    }
  };
  var platform_basic = {
    acquireContext: function (item) {
      if (item && item.canvas) {
        item = item.canvas;
      }
      return item && item.getContext('2d') || null;
    }
  };
  var platform_dom = "/*\r\n * DOM element rendering detection\r\n * https://davidwalsh.name/detect-node-insertion\r\n */\r\n@keyframes chartjs-render-animation {\r\n\tfrom { opacity: 0.99; }\r\n\tto { opacity: 1; }\r\n}\r\n\r\n.chartjs-render-monitor {\r\n\tanimation: chartjs-render-animation 0.001s;\r\n}\r\n\r\n/*\r\n * DOM element resizing detection\r\n * https://github.com/marcj/css-element-queries\r\n */\r\n.chartjs-size-monitor,\r\n.chartjs-size-monitor-expand,\r\n.chartjs-size-monitor-shrink {\r\n\tposition: absolute;\r\n\tdirection: ltr;\r\n\tleft: 0;\r\n\ttop: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\toverflow: hidden;\r\n\tpointer-events: none;\r\n\tvisibility: hidden;\r\n\tz-index: -1;\r\n}\r\n\r\n.chartjs-size-monitor-expand > div {\r\n\tposition: absolute;\r\n\twidth: 1000000px;\r\n\theight: 1000000px;\r\n\tleft: 0;\r\n\ttop: 0;\r\n}\r\n\r\n.chartjs-size-monitor-shrink > div {\r\n\tposition: absolute;\r\n\twidth: 200%;\r\n\theight: 200%;\r\n\tleft: 0;\r\n\ttop: 0;\r\n}\r\n";
  var platform_dom$1 = Object.freeze({
    __proto__: null,
    'default': platform_dom
  });
  var stylesheet = getCjsExportFromNamespace(platform_dom$1);
  var EXPANDO_KEY = '$chartjs';
  var CSS_PREFIX = 'chartjs-';
  var CSS_SIZE_MONITOR = CSS_PREFIX + 'size-monitor';
  var CSS_RENDER_MONITOR = CSS_PREFIX + 'render-monitor';
  var CSS_RENDER_ANIMATION = CSS_PREFIX + 'render-animation';
  var ANIMATION_START_EVENTS = ['animationstart', 'webkitAnimationStart'];
  var EVENT_TYPES = {
    touchstart: 'mousedown',
    touchmove: 'mousemove',
    touchend: 'mouseup',
    pointerenter: 'mouseenter',
    pointerdown: 'mousedown',
    pointermove: 'mousemove',
    pointerup: 'mouseup',
    pointerleave: 'mouseout',
    pointerout: 'mouseout'
  };
  function readUsedSize(element, property) {
    var value = helpers$1.getStyle(element, property);
    var matches = value && value.match(/^(\d+)(\.\d+)?px$/);
    return matches ? Number(matches[1]) : undefined;
  }
  function initCanvas(canvas, config) {
    var style = canvas.style;
    var renderHeight = canvas.getAttribute('height');
    var renderWidth = canvas.getAttribute('width');
    canvas[EXPANDO_KEY] = {
      initial: {
        height: renderHeight,
        width: renderWidth,
        style: {
          display: style.display,
          height: style.height,
          width: style.width
        }
      }
    };
    style.display = style.display || 'block';
    if (renderWidth === null || renderWidth === '') {
      var displayWidth = readUsedSize(canvas, 'width');
      if (displayWidth !== undefined) {
        canvas.width = displayWidth;
      }
    }
    if (renderHeight === null || renderHeight === '') {
      if (canvas.style.height === '') {
        canvas.height = canvas.width / (config.options.aspectRatio || 2);
      } else {
        var displayHeight = readUsedSize(canvas, 'height');
        if (displayWidth !== undefined) {
          canvas.height = displayHeight;
        }
      }
    }
    return canvas;
  }
  var supportsEventListenerOptions = (function () {
    var supports = false;
    try {
      var options = Object.defineProperty({}, 'passive', {
        get: function () {
          supports = true;
        }
      });
      window.addEventListener('e', null, options);
    } catch (e) {}
    return supports;
  })();
  var eventListenerOptions = supportsEventListenerOptions ? {
    passive: true
  } : false;
  function addListener(node, type, listener) {
    node.addEventListener(type, listener, eventListenerOptions);
  }
  function removeListener(node, type, listener) {
    node.removeEventListener(type, listener, eventListenerOptions);
  }
  function createEvent(type, chart, x, y, nativeEvent) {
    return {
      type: type,
      chart: chart,
      native: nativeEvent || null,
      x: x !== undefined ? x : null,
      y: y !== undefined ? y : null
    };
  }
  function fromNativeEvent(event, chart) {
    var type = EVENT_TYPES[event.type] || event.type;
    var pos = helpers$1.getRelativePosition(event, chart);
    return createEvent(type, chart, pos.x, pos.y, event);
  }
  function throttled(fn, thisArg) {
    var ticking = false;
    var args = [];
    return function () {
      args = Array.prototype.slice.call(arguments);
      thisArg = thisArg || this;
      if (!ticking) {
        ticking = true;
        helpers$1.requestAnimFrame.call(window, function () {
          ticking = false;
          fn.apply(thisArg, args);
        });
      }
    };
  }
  function createDiv(cls) {
    var el = document.createElement('div');
    el.className = cls || '';
    return el;
  }
  function createResizer(handler) {
    var maxSize = 1000000;
    var resizer = createDiv(CSS_SIZE_MONITOR);
    var expand = createDiv(CSS_SIZE_MONITOR + '-expand');
    var shrink = createDiv(CSS_SIZE_MONITOR + '-shrink');
    expand.appendChild(createDiv());
    shrink.appendChild(createDiv());
    resizer.appendChild(expand);
    resizer.appendChild(shrink);
    resizer._reset = function () {
      expand.scrollLeft = maxSize;
      expand.scrollTop = maxSize;
      shrink.scrollLeft = maxSize;
      shrink.scrollTop = maxSize;
    };
    var onScroll = function () {
      resizer._reset();
      handler();
    };
    addListener(expand, 'scroll', onScroll.bind(expand, 'expand'));
    addListener(shrink, 'scroll', onScroll.bind(shrink, 'shrink'));
    return resizer;
  }
  function watchForRender(node, handler) {
    var expando = node[EXPANDO_KEY] || (node[EXPANDO_KEY] = {});
    var proxy = expando.renderProxy = function (e) {
      if (e.animationName === CSS_RENDER_ANIMATION) {
        handler();
      }
    };
    helpers$1.each(ANIMATION_START_EVENTS, function (type) {
      addListener(node, type, proxy);
    });
    expando.reflow = !!node.offsetParent;
    node.classList.add(CSS_RENDER_MONITOR);
  }
  function unwatchForRender(node) {
    var expando = node[EXPANDO_KEY] || ({});
    var proxy = expando.renderProxy;
    if (proxy) {
      helpers$1.each(ANIMATION_START_EVENTS, function (type) {
        removeListener(node, type, proxy);
      });
      delete expando.renderProxy;
    }
    node.classList.remove(CSS_RENDER_MONITOR);
  }
  function addResizeListener(node, listener, chart) {
    var expando = node[EXPANDO_KEY] || (node[EXPANDO_KEY] = {});
    var resizer = expando.resizer = createResizer(throttled(function () {
      if (expando.resizer) {
        var container = chart.options.maintainAspectRatio && node.parentNode;
        var w = container ? container.clientWidth : 0;
        listener(createEvent('resize', chart));
        if (container && container.clientWidth < w && chart.canvas) {
          listener(createEvent('resize', chart));
        }
      }
    }));
    watchForRender(node, function () {
      if (expando.resizer) {
        var container = node.parentNode;
        if (container && container !== resizer.parentNode) {
          container.insertBefore(resizer, container.firstChild);
        }
        resizer._reset();
      }
    });
  }
  function removeResizeListener(node) {
    var expando = node[EXPANDO_KEY] || ({});
    var resizer = expando.resizer;
    delete expando.resizer;
    unwatchForRender(node);
    if (resizer && resizer.parentNode) {
      resizer.parentNode.removeChild(resizer);
    }
  }
  function injectCSS(rootNode, css) {
    var expando = rootNode[EXPANDO_KEY] || (rootNode[EXPANDO_KEY] = {});
    if (!expando.containsStyles) {
      expando.containsStyles = true;
      css = '/* Chart.js */\n' + css;
      var style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.appendChild(document.createTextNode(css));
      rootNode.appendChild(style);
    }
  }
  var platform_dom$2 = {
    disableCSSInjection: false,
    _enabled: typeof window !== 'undefined' && typeof document !== 'undefined',
    _ensureLoaded: function (canvas) {
      if (!this.disableCSSInjection) {
        var root = canvas.getRootNode ? canvas.getRootNode() : document;
        var targetNode = root.host ? root : document.head;
        injectCSS(targetNode, stylesheet);
      }
    },
    acquireContext: function (item, config) {
      if (typeof item === 'string') {
        item = document.getElementById(item);
      } else if (item.length) {
        item = item[0];
      }
      if (item && item.canvas) {
        item = item.canvas;
      }
      var context = item && item.getContext && item.getContext('2d');
      if (context && context.canvas === item) {
        this._ensureLoaded(item);
        initCanvas(item, config);
        return context;
      }
      return null;
    },
    releaseContext: function (context) {
      var canvas = context.canvas;
      if (!canvas[EXPANDO_KEY]) {
        return;
      }
      var initial = canvas[EXPANDO_KEY].initial;
      ['height', 'width'].forEach(function (prop) {
        var value = initial[prop];
        if (helpers$1.isNullOrUndef(value)) {
          canvas.removeAttribute(prop);
        } else {
          canvas.setAttribute(prop, value);
        }
      });
      helpers$1.each(initial.style || ({}), function (value, key) {
        canvas.style[key] = value;
      });
      canvas.width = canvas.width;
      delete canvas[EXPANDO_KEY];
    },
    addEventListener: function (chart, type, listener) {
      var canvas = chart.canvas;
      if (type === 'resize') {
        addResizeListener(canvas, listener, chart);
        return;
      }
      var expando = listener[EXPANDO_KEY] || (listener[EXPANDO_KEY] = {});
      var proxies = expando.proxies || (expando.proxies = {});
      var proxy = proxies[chart.id + '_' + type] = function (event) {
        listener(fromNativeEvent(event, chart));
      };
      addListener(canvas, type, proxy);
    },
    removeEventListener: function (chart, type, listener) {
      var canvas = chart.canvas;
      if (type === 'resize') {
        removeResizeListener(canvas);
        return;
      }
      var expando = listener[EXPANDO_KEY] || ({});
      var proxies = expando.proxies || ({});
      var proxy = proxies[chart.id + '_' + type];
      if (!proxy) {
        return;
      }
      removeListener(canvas, type, proxy);
    }
  };
  helpers$1.addEvent = addListener;
  helpers$1.removeEvent = removeListener;
  var implementation = platform_dom$2._enabled ? platform_dom$2 : platform_basic;
  var platform = helpers$1.extend({
    initialize: function () {},
    acquireContext: function () {},
    releaseContext: function () {},
    addEventListener: function () {},
    removeEventListener: function () {}
  }, implementation);
  core_defaults._set('global', {
    plugins: {}
  });
  var core_plugins = {
    _plugins: [],
    _cacheId: 0,
    register: function (plugins) {
      var p = this._plugins;
      [].concat(plugins).forEach(function (plugin) {
        if (p.indexOf(plugin) === -1) {
          p.push(plugin);
        }
      });
      this._cacheId++;
    },
    unregister: function (plugins) {
      var p = this._plugins;
      [].concat(plugins).forEach(function (plugin) {
        var idx = p.indexOf(plugin);
        if (idx !== -1) {
          p.splice(idx, 1);
        }
      });
      this._cacheId++;
    },
    clear: function () {
      this._plugins = [];
      this._cacheId++;
    },
    count: function () {
      return this._plugins.length;
    },
    getAll: function () {
      return this._plugins;
    },
    notify: function (chart, hook, args) {
      var descriptors = this.descriptors(chart);
      var ilen = descriptors.length;
      var i, descriptor, plugin, params, method;
      for (i = 0; i < ilen; ++i) {
        descriptor = descriptors[i];
        plugin = descriptor.plugin;
        method = plugin[hook];
        if (typeof method === 'function') {
          params = [chart].concat(args || []);
          params.push(descriptor.options);
          if (method.apply(plugin, params) === false) {
            return false;
          }
        }
      }
      return true;
    },
    descriptors: function (chart) {
      var cache = chart.$plugins || (chart.$plugins = {});
      if (cache.id === this._cacheId) {
        return cache.descriptors;
      }
      var plugins = [];
      var descriptors = [];
      var config = chart && chart.config || ({});
      var options = config.options && config.options.plugins || ({});
      this._plugins.concat(config.plugins || []).forEach(function (plugin) {
        var idx = plugins.indexOf(plugin);
        if (idx !== -1) {
          return;
        }
        var id = plugin.id;
        var opts = options[id];
        if (opts === false) {
          return;
        }
        if (opts === true) {
          opts = helpers$1.clone(core_defaults.global.plugins[id]);
        }
        plugins.push(plugin);
        descriptors.push({
          plugin: plugin,
          options: opts || ({})
        });
      });
      cache.descriptors = descriptors;
      cache.id = this._cacheId;
      return descriptors;
    },
    _invalidate: function (chart) {
      delete chart.$plugins;
    }
  };
  var core_scaleService = {
    constructors: {},
    defaults: {},
    registerScaleType: function (type, scaleConstructor, scaleDefaults) {
      this.constructors[type] = scaleConstructor;
      this.defaults[type] = helpers$1.clone(scaleDefaults);
    },
    getScaleConstructor: function (type) {
      return this.constructors.hasOwnProperty(type) ? this.constructors[type] : undefined;
    },
    getScaleDefaults: function (type) {
      return this.defaults.hasOwnProperty(type) ? helpers$1.merge(Object.create(null), [core_defaults.scale, this.defaults[type]]) : {};
    },
    updateScaleDefaults: function (type, additions) {
      var me = this;
      if (me.defaults.hasOwnProperty(type)) {
        me.defaults[type] = helpers$1.extend(me.defaults[type], additions);
      }
    },
    addScalesToLayout: function (chart) {
      helpers$1.each(chart.scales, function (scale) {
        scale.fullWidth = scale.options.fullWidth;
        scale.position = scale.options.position;
        scale.weight = scale.options.weight;
        core_layouts.addBox(chart, scale);
      });
    }
  };
  var valueOrDefault$8 = helpers$1.valueOrDefault;
  var getRtlHelper = helpers$1.rtl.getRtlAdapter;
  core_defaults._set('global', {
    tooltips: {
      enabled: true,
      custom: null,
      mode: 'nearest',
      position: 'average',
      intersect: true,
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleFontStyle: 'bold',
      titleSpacing: 2,
      titleMarginBottom: 6,
      titleFontColor: '#fff',
      titleAlign: 'left',
      bodySpacing: 2,
      bodyFontColor: '#fff',
      bodyAlign: 'left',
      footerFontStyle: 'bold',
      footerSpacing: 2,
      footerMarginTop: 6,
      footerFontColor: '#fff',
      footerAlign: 'left',
      yPadding: 6,
      xPadding: 6,
      caretPadding: 2,
      caretSize: 5,
      cornerRadius: 6,
      multiKeyBackground: '#fff',
      displayColors: true,
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      callbacks: {
        beforeTitle: helpers$1.noop,
        title: function (tooltipItems, data) {
          var title = '';
          var labels = data.labels;
          var labelCount = labels ? labels.length : 0;
          if (tooltipItems.length > 0) {
            var item = tooltipItems[0];
            if (item.label) {
              title = item.label;
            } else if (item.xLabel) {
              title = item.xLabel;
            } else if (labelCount > 0 && item.index < labelCount) {
              title = labels[item.index];
            }
          }
          return title;
        },
        afterTitle: helpers$1.noop,
        beforeBody: helpers$1.noop,
        beforeLabel: helpers$1.noop,
        label: function (tooltipItem, data) {
          var label = data.datasets[tooltipItem.datasetIndex].label || '';
          if (label) {
            label += ': ';
          }
          if (!helpers$1.isNullOrUndef(tooltipItem.value)) {
            label += tooltipItem.value;
          } else {
            label += tooltipItem.yLabel;
          }
          return label;
        },
        labelColor: function (tooltipItem, chart) {
          var meta = chart.getDatasetMeta(tooltipItem.datasetIndex);
          var activeElement = meta.data[tooltipItem.index];
          var view = activeElement._view;
          return {
            borderColor: view.borderColor,
            backgroundColor: view.backgroundColor
          };
        },
        labelTextColor: function () {
          return this._options.bodyFontColor;
        },
        afterLabel: helpers$1.noop,
        afterBody: helpers$1.noop,
        beforeFooter: helpers$1.noop,
        footer: helpers$1.noop,
        afterFooter: helpers$1.noop
      }
    }
  });
  var positioners = {
    average: function (elements) {
      if (!elements.length) {
        return false;
      }
      var i, len;
      var x = 0;
      var y = 0;
      var count = 0;
      for ((i = 0, len = elements.length); i < len; ++i) {
        var el = elements[i];
        if (el && el.hasValue()) {
          var pos = el.tooltipPosition();
          x += pos.x;
          y += pos.y;
          ++count;
        }
      }
      return {
        x: x / count,
        y: y / count
      };
    },
    nearest: function (elements, eventPosition) {
      var x = eventPosition.x;
      var y = eventPosition.y;
      var minDistance = Number.POSITIVE_INFINITY;
      var i, len, nearestElement;
      for ((i = 0, len = elements.length); i < len; ++i) {
        var el = elements[i];
        if (el && el.hasValue()) {
          var center = el.getCenterPoint();
          var d = helpers$1.distanceBetweenPoints(eventPosition, center);
          if (d < minDistance) {
            minDistance = d;
            nearestElement = el;
          }
        }
      }
      if (nearestElement) {
        var tp = nearestElement.tooltipPosition();
        x = tp.x;
        y = tp.y;
      }
      return {
        x: x,
        y: y
      };
    }
  };
  function pushOrConcat(base, toPush) {
    if (toPush) {
      if (helpers$1.isArray(toPush)) {
        Array.prototype.push.apply(base, toPush);
      } else {
        base.push(toPush);
      }
    }
    return base;
  }
  function splitNewlines(str) {
    if ((typeof str === 'string' || str instanceof String) && str.indexOf('\n') > -1) {
      return str.split('\n');
    }
    return str;
  }
  function createTooltipItem(element) {
    var xScale = element._xScale;
    var yScale = element._yScale || element._scale;
    var index = element._index;
    var datasetIndex = element._datasetIndex;
    var controller = element._chart.getDatasetMeta(datasetIndex).controller;
    var indexScale = controller._getIndexScale();
    var valueScale = controller._getValueScale();
    return {
      xLabel: xScale ? xScale.getLabelForIndex(index, datasetIndex) : '',
      yLabel: yScale ? yScale.getLabelForIndex(index, datasetIndex) : '',
      label: indexScale ? '' + indexScale.getLabelForIndex(index, datasetIndex) : '',
      value: valueScale ? '' + valueScale.getLabelForIndex(index, datasetIndex) : '',
      index: index,
      datasetIndex: datasetIndex,
      x: element._model.x,
      y: element._model.y
    };
  }
  function getBaseModel(tooltipOpts) {
    var globalDefaults = core_defaults.global;
    return {
      xPadding: tooltipOpts.xPadding,
      yPadding: tooltipOpts.yPadding,
      xAlign: tooltipOpts.xAlign,
      yAlign: tooltipOpts.yAlign,
      rtl: tooltipOpts.rtl,
      textDirection: tooltipOpts.textDirection,
      bodyFontColor: tooltipOpts.bodyFontColor,
      _bodyFontFamily: valueOrDefault$8(tooltipOpts.bodyFontFamily, globalDefaults.defaultFontFamily),
      _bodyFontStyle: valueOrDefault$8(tooltipOpts.bodyFontStyle, globalDefaults.defaultFontStyle),
      _bodyAlign: tooltipOpts.bodyAlign,
      bodyFontSize: valueOrDefault$8(tooltipOpts.bodyFontSize, globalDefaults.defaultFontSize),
      bodySpacing: tooltipOpts.bodySpacing,
      titleFontColor: tooltipOpts.titleFontColor,
      _titleFontFamily: valueOrDefault$8(tooltipOpts.titleFontFamily, globalDefaults.defaultFontFamily),
      _titleFontStyle: valueOrDefault$8(tooltipOpts.titleFontStyle, globalDefaults.defaultFontStyle),
      titleFontSize: valueOrDefault$8(tooltipOpts.titleFontSize, globalDefaults.defaultFontSize),
      _titleAlign: tooltipOpts.titleAlign,
      titleSpacing: tooltipOpts.titleSpacing,
      titleMarginBottom: tooltipOpts.titleMarginBottom,
      footerFontColor: tooltipOpts.footerFontColor,
      _footerFontFamily: valueOrDefault$8(tooltipOpts.footerFontFamily, globalDefaults.defaultFontFamily),
      _footerFontStyle: valueOrDefault$8(tooltipOpts.footerFontStyle, globalDefaults.defaultFontStyle),
      footerFontSize: valueOrDefault$8(tooltipOpts.footerFontSize, globalDefaults.defaultFontSize),
      _footerAlign: tooltipOpts.footerAlign,
      footerSpacing: tooltipOpts.footerSpacing,
      footerMarginTop: tooltipOpts.footerMarginTop,
      caretSize: tooltipOpts.caretSize,
      cornerRadius: tooltipOpts.cornerRadius,
      backgroundColor: tooltipOpts.backgroundColor,
      opacity: 0,
      legendColorBackground: tooltipOpts.multiKeyBackground,
      displayColors: tooltipOpts.displayColors,
      borderColor: tooltipOpts.borderColor,
      borderWidth: tooltipOpts.borderWidth
    };
  }
  function getTooltipSize(tooltip, model) {
    var ctx = tooltip._chart.ctx;
    var height = model.yPadding * 2;
    var width = 0;
    var body = model.body;
    var combinedBodyLength = body.reduce(function (count, bodyItem) {
      return count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length;
    }, 0);
    combinedBodyLength += model.beforeBody.length + model.afterBody.length;
    var titleLineCount = model.title.length;
    var footerLineCount = model.footer.length;
    var titleFontSize = model.titleFontSize;
    var bodyFontSize = model.bodyFontSize;
    var footerFontSize = model.footerFontSize;
    height += titleLineCount * titleFontSize;
    height += titleLineCount ? (titleLineCount - 1) * model.titleSpacing : 0;
    height += titleLineCount ? model.titleMarginBottom : 0;
    height += combinedBodyLength * bodyFontSize;
    height += combinedBodyLength ? (combinedBodyLength - 1) * model.bodySpacing : 0;
    height += footerLineCount ? model.footerMarginTop : 0;
    height += footerLineCount * footerFontSize;
    height += footerLineCount ? (footerLineCount - 1) * model.footerSpacing : 0;
    var widthPadding = 0;
    var maxLineWidth = function (line) {
      width = Math.max(width, ctx.measureText(line).width + widthPadding);
    };
    ctx.font = helpers$1.fontString(titleFontSize, model._titleFontStyle, model._titleFontFamily);
    helpers$1.each(model.title, maxLineWidth);
    ctx.font = helpers$1.fontString(bodyFontSize, model._bodyFontStyle, model._bodyFontFamily);
    helpers$1.each(model.beforeBody.concat(model.afterBody), maxLineWidth);
    widthPadding = model.displayColors ? bodyFontSize + 2 : 0;
    helpers$1.each(body, function (bodyItem) {
      helpers$1.each(bodyItem.before, maxLineWidth);
      helpers$1.each(bodyItem.lines, maxLineWidth);
      helpers$1.each(bodyItem.after, maxLineWidth);
    });
    widthPadding = 0;
    ctx.font = helpers$1.fontString(footerFontSize, model._footerFontStyle, model._footerFontFamily);
    helpers$1.each(model.footer, maxLineWidth);
    width += 2 * model.xPadding;
    return {
      width: width,
      height: height
    };
  }
  function determineAlignment(tooltip, size) {
    var model = tooltip._model;
    var chart = tooltip._chart;
    var chartArea = tooltip._chart.chartArea;
    var xAlign = 'center';
    var yAlign = 'center';
    if (model.y < size.height) {
      yAlign = 'top';
    } else if (model.y > chart.height - size.height) {
      yAlign = 'bottom';
    }
    var lf, rf;
    var olf, orf;
    var yf;
    var midX = (chartArea.left + chartArea.right) / 2;
    var midY = (chartArea.top + chartArea.bottom) / 2;
    if (yAlign === 'center') {
      lf = function (x) {
        return x <= midX;
      };
      rf = function (x) {
        return x > midX;
      };
    } else {
      lf = function (x) {
        return x <= size.width / 2;
      };
      rf = function (x) {
        return x >= chart.width - size.width / 2;
      };
    }
    olf = function (x) {
      return x + size.width + model.caretSize + model.caretPadding > chart.width;
    };
    orf = function (x) {
      return x - size.width - model.caretSize - model.caretPadding < 0;
    };
    yf = function (y) {
      return y <= midY ? 'top' : 'bottom';
    };
    if (lf(model.x)) {
      xAlign = 'left';
      if (olf(model.x)) {
        xAlign = 'center';
        yAlign = yf(model.y);
      }
    } else if (rf(model.x)) {
      xAlign = 'right';
      if (orf(model.x)) {
        xAlign = 'center';
        yAlign = yf(model.y);
      }
    }
    var opts = tooltip._options;
    return {
      xAlign: opts.xAlign ? opts.xAlign : xAlign,
      yAlign: opts.yAlign ? opts.yAlign : yAlign
    };
  }
  function getBackgroundPoint(vm, size, alignment, chart) {
    var x = vm.x;
    var y = vm.y;
    var caretSize = vm.caretSize;
    var caretPadding = vm.caretPadding;
    var cornerRadius = vm.cornerRadius;
    var xAlign = alignment.xAlign;
    var yAlign = alignment.yAlign;
    var paddingAndSize = caretSize + caretPadding;
    var radiusAndPadding = cornerRadius + caretPadding;
    if (xAlign === 'right') {
      x -= size.width;
    } else if (xAlign === 'center') {
      x -= size.width / 2;
      if (x + size.width > chart.width) {
        x = chart.width - size.width;
      }
      if (x < 0) {
        x = 0;
      }
    }
    if (yAlign === 'top') {
      y += paddingAndSize;
    } else if (yAlign === 'bottom') {
      y -= size.height + paddingAndSize;
    } else {
      y -= size.height / 2;
    }
    if (yAlign === 'center') {
      if (xAlign === 'left') {
        x += paddingAndSize;
      } else if (xAlign === 'right') {
        x -= paddingAndSize;
      }
    } else if (xAlign === 'left') {
      x -= radiusAndPadding;
    } else if (xAlign === 'right') {
      x += radiusAndPadding;
    }
    return {
      x: x,
      y: y
    };
  }
  function getAlignedX(vm, align) {
    return align === 'center' ? vm.x + vm.width / 2 : align === 'right' ? vm.x + vm.width - vm.xPadding : vm.x + vm.xPadding;
  }
  function getBeforeAfterBodyLines(callback) {
    return pushOrConcat([], splitNewlines(callback));
  }
  var exports$4 = core_element.extend({
    initialize: function () {
      this._model = getBaseModel(this._options);
      this._lastActive = [];
    },
    getTitle: function () {
      var me = this;
      var opts = me._options;
      var callbacks = opts.callbacks;
      var beforeTitle = callbacks.beforeTitle.apply(me, arguments);
      var title = callbacks.title.apply(me, arguments);
      var afterTitle = callbacks.afterTitle.apply(me, arguments);
      var lines = [];
      lines = pushOrConcat(lines, splitNewlines(beforeTitle));
      lines = pushOrConcat(lines, splitNewlines(title));
      lines = pushOrConcat(lines, splitNewlines(afterTitle));
      return lines;
    },
    getBeforeBody: function () {
      return getBeforeAfterBodyLines(this._options.callbacks.beforeBody.apply(this, arguments));
    },
    getBody: function (tooltipItems, data) {
      var me = this;
      var callbacks = me._options.callbacks;
      var bodyItems = [];
      helpers$1.each(tooltipItems, function (tooltipItem) {
        var bodyItem = {
          before: [],
          lines: [],
          after: []
        };
        pushOrConcat(bodyItem.before, splitNewlines(callbacks.beforeLabel.call(me, tooltipItem, data)));
        pushOrConcat(bodyItem.lines, callbacks.label.call(me, tooltipItem, data));
        pushOrConcat(bodyItem.after, splitNewlines(callbacks.afterLabel.call(me, tooltipItem, data)));
        bodyItems.push(bodyItem);
      });
      return bodyItems;
    },
    getAfterBody: function () {
      return getBeforeAfterBodyLines(this._options.callbacks.afterBody.apply(this, arguments));
    },
    getFooter: function () {
      var me = this;
      var callbacks = me._options.callbacks;
      var beforeFooter = callbacks.beforeFooter.apply(me, arguments);
      var footer = callbacks.footer.apply(me, arguments);
      var afterFooter = callbacks.afterFooter.apply(me, arguments);
      var lines = [];
      lines = pushOrConcat(lines, splitNewlines(beforeFooter));
      lines = pushOrConcat(lines, splitNewlines(footer));
      lines = pushOrConcat(lines, splitNewlines(afterFooter));
      return lines;
    },
    update: function (changed) {
      var me = this;
      var opts = me._options;
      var existingModel = me._model;
      var model = me._model = getBaseModel(opts);
      var active = me._active;
      var data = me._data;
      var alignment = {
        xAlign: existingModel.xAlign,
        yAlign: existingModel.yAlign
      };
      var backgroundPoint = {
        x: existingModel.x,
        y: existingModel.y
      };
      var tooltipSize = {
        width: existingModel.width,
        height: existingModel.height
      };
      var tooltipPosition = {
        x: existingModel.caretX,
        y: existingModel.caretY
      };
      var i, len;
      if (active.length) {
        model.opacity = 1;
        var labelColors = [];
        var labelTextColors = [];
        tooltipPosition = positioners[opts.position].call(me, active, me._eventPosition);
        var tooltipItems = [];
        for ((i = 0, len = active.length); i < len; ++i) {
          tooltipItems.push(createTooltipItem(active[i]));
        }
        if (opts.filter) {
          tooltipItems = tooltipItems.filter(function (a) {
            return opts.filter(a, data);
          });
        }
        if (opts.itemSort) {
          tooltipItems = tooltipItems.sort(function (a, b) {
            return opts.itemSort(a, b, data);
          });
        }
        helpers$1.each(tooltipItems, function (tooltipItem) {
          labelColors.push(opts.callbacks.labelColor.call(me, tooltipItem, me._chart));
          labelTextColors.push(opts.callbacks.labelTextColor.call(me, tooltipItem, me._chart));
        });
        model.title = me.getTitle(tooltipItems, data);
        model.beforeBody = me.getBeforeBody(tooltipItems, data);
        model.body = me.getBody(tooltipItems, data);
        model.afterBody = me.getAfterBody(tooltipItems, data);
        model.footer = me.getFooter(tooltipItems, data);
        model.x = tooltipPosition.x;
        model.y = tooltipPosition.y;
        model.caretPadding = opts.caretPadding;
        model.labelColors = labelColors;
        model.labelTextColors = labelTextColors;
        model.dataPoints = tooltipItems;
        tooltipSize = getTooltipSize(this, model);
        alignment = determineAlignment(this, tooltipSize);
        backgroundPoint = getBackgroundPoint(model, tooltipSize, alignment, me._chart);
      } else {
        model.opacity = 0;
      }
      model.xAlign = alignment.xAlign;
      model.yAlign = alignment.yAlign;
      model.x = backgroundPoint.x;
      model.y = backgroundPoint.y;
      model.width = tooltipSize.width;
      model.height = tooltipSize.height;
      model.caretX = tooltipPosition.x;
      model.caretY = tooltipPosition.y;
      me._model = model;
      if (changed && opts.custom) {
        opts.custom.call(me, model);
      }
      return me;
    },
    drawCaret: function (tooltipPoint, size) {
      var ctx = this._chart.ctx;
      var vm = this._view;
      var caretPosition = this.getCaretPosition(tooltipPoint, size, vm);
      ctx.lineTo(caretPosition.x1, caretPosition.y1);
      ctx.lineTo(caretPosition.x2, caretPosition.y2);
      ctx.lineTo(caretPosition.x3, caretPosition.y3);
    },
    getCaretPosition: function (tooltipPoint, size, vm) {
      var x1, x2, x3, y1, y2, y3;
      var caretSize = vm.caretSize;
      var cornerRadius = vm.cornerRadius;
      var xAlign = vm.xAlign;
      var yAlign = vm.yAlign;
      var ptX = tooltipPoint.x;
      var ptY = tooltipPoint.y;
      var width = size.width;
      var height = size.height;
      if (yAlign === 'center') {
        y2 = ptY + height / 2;
        if (xAlign === 'left') {
          x1 = ptX;
          x2 = x1 - caretSize;
          x3 = x1;
          y1 = y2 + caretSize;
          y3 = y2 - caretSize;
        } else {
          x1 = ptX + width;
          x2 = x1 + caretSize;
          x3 = x1;
          y1 = y2 - caretSize;
          y3 = y2 + caretSize;
        }
      } else {
        if (xAlign === 'left') {
          x2 = ptX + cornerRadius + caretSize;
          x1 = x2 - caretSize;
          x3 = x2 + caretSize;
        } else if (xAlign === 'right') {
          x2 = ptX + width - cornerRadius - caretSize;
          x1 = x2 - caretSize;
          x3 = x2 + caretSize;
        } else {
          x2 = vm.caretX;
          x1 = x2 - caretSize;
          x3 = x2 + caretSize;
        }
        if (yAlign === 'top') {
          y1 = ptY;
          y2 = y1 - caretSize;
          y3 = y1;
        } else {
          y1 = ptY + height;
          y2 = y1 + caretSize;
          y3 = y1;
          var tmp = x3;
          x3 = x1;
          x1 = tmp;
        }
      }
      return {
        x1: x1,
        x2: x2,
        x3: x3,
        y1: y1,
        y2: y2,
        y3: y3
      };
    },
    drawTitle: function (pt, vm, ctx) {
      var title = vm.title;
      var length = title.length;
      var titleFontSize, titleSpacing, i;
      if (length) {
        var rtlHelper = getRtlHelper(vm.rtl, vm.x, vm.width);
        pt.x = getAlignedX(vm, vm._titleAlign);
        ctx.textAlign = rtlHelper.textAlign(vm._titleAlign);
        ctx.textBaseline = 'middle';
        titleFontSize = vm.titleFontSize;
        titleSpacing = vm.titleSpacing;
        ctx.fillStyle = vm.titleFontColor;
        ctx.font = helpers$1.fontString(titleFontSize, vm._titleFontStyle, vm._titleFontFamily);
        for (i = 0; i < length; ++i) {
          ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFontSize / 2);
          pt.y += titleFontSize + titleSpacing;
          if (i + 1 === length) {
            pt.y += vm.titleMarginBottom - titleSpacing;
          }
        }
      }
    },
    drawBody: function (pt, vm, ctx) {
      var bodyFontSize = vm.bodyFontSize;
      var bodySpacing = vm.bodySpacing;
      var bodyAlign = vm._bodyAlign;
      var body = vm.body;
      var drawColorBoxes = vm.displayColors;
      var xLinePadding = 0;
      var colorX = drawColorBoxes ? getAlignedX(vm, 'left') : 0;
      var rtlHelper = getRtlHelper(vm.rtl, vm.x, vm.width);
      var fillLineOfText = function (line) {
        ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyFontSize / 2);
        pt.y += bodyFontSize + bodySpacing;
      };
      var bodyItem, textColor, labelColors, lines, i, j, ilen, jlen;
      var bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
      ctx.textAlign = bodyAlign;
      ctx.textBaseline = 'middle';
      ctx.font = helpers$1.fontString(bodyFontSize, vm._bodyFontStyle, vm._bodyFontFamily);
      pt.x = getAlignedX(vm, bodyAlignForCalculation);
      ctx.fillStyle = vm.bodyFontColor;
      helpers$1.each(vm.beforeBody, fillLineOfText);
      xLinePadding = drawColorBoxes && bodyAlignForCalculation !== 'right' ? bodyAlign === 'center' ? bodyFontSize / 2 + 1 : bodyFontSize + 2 : 0;
      for ((i = 0, ilen = body.length); i < ilen; ++i) {
        bodyItem = body[i];
        textColor = vm.labelTextColors[i];
        labelColors = vm.labelColors[i];
        ctx.fillStyle = textColor;
        helpers$1.each(bodyItem.before, fillLineOfText);
        lines = bodyItem.lines;
        for ((j = 0, jlen = lines.length); j < jlen; ++j) {
          if (drawColorBoxes) {
            var rtlColorX = rtlHelper.x(colorX);
            ctx.fillStyle = vm.legendColorBackground;
            ctx.fillRect(rtlHelper.leftForLtr(rtlColorX, bodyFontSize), pt.y, bodyFontSize, bodyFontSize);
            ctx.lineWidth = 1;
            ctx.strokeStyle = labelColors.borderColor;
            ctx.strokeRect(rtlHelper.leftForLtr(rtlColorX, bodyFontSize), pt.y, bodyFontSize, bodyFontSize);
            ctx.fillStyle = labelColors.backgroundColor;
            ctx.fillRect(rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), bodyFontSize - 2), pt.y + 1, bodyFontSize - 2, bodyFontSize - 2);
            ctx.fillStyle = textColor;
          }
          fillLineOfText(lines[j]);
        }
        helpers$1.each(bodyItem.after, fillLineOfText);
      }
      xLinePadding = 0;
      helpers$1.each(vm.afterBody, fillLineOfText);
      pt.y -= bodySpacing;
    },
    drawFooter: function (pt, vm, ctx) {
      var footer = vm.footer;
      var length = footer.length;
      var footerFontSize, i;
      if (length) {
        var rtlHelper = getRtlHelper(vm.rtl, vm.x, vm.width);
        pt.x = getAlignedX(vm, vm._footerAlign);
        pt.y += vm.footerMarginTop;
        ctx.textAlign = rtlHelper.textAlign(vm._footerAlign);
        ctx.textBaseline = 'middle';
        footerFontSize = vm.footerFontSize;
        ctx.fillStyle = vm.footerFontColor;
        ctx.font = helpers$1.fontString(footerFontSize, vm._footerFontStyle, vm._footerFontFamily);
        for (i = 0; i < length; ++i) {
          ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFontSize / 2);
          pt.y += footerFontSize + vm.footerSpacing;
        }
      }
    },
    drawBackground: function (pt, vm, ctx, tooltipSize) {
      ctx.fillStyle = vm.backgroundColor;
      ctx.strokeStyle = vm.borderColor;
      ctx.lineWidth = vm.borderWidth;
      var xAlign = vm.xAlign;
      var yAlign = vm.yAlign;
      var x = pt.x;
      var y = pt.y;
      var width = tooltipSize.width;
      var height = tooltipSize.height;
      var radius = vm.cornerRadius;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      if (yAlign === 'top') {
        this.drawCaret(pt, tooltipSize);
      }
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      if (yAlign === 'center' && xAlign === 'right') {
        this.drawCaret(pt, tooltipSize);
      }
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      if (yAlign === 'bottom') {
        this.drawCaret(pt, tooltipSize);
      }
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      if (yAlign === 'center' && xAlign === 'left') {
        this.drawCaret(pt, tooltipSize);
      }
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      if (vm.borderWidth > 0) {
        ctx.stroke();
      }
    },
    draw: function () {
      var ctx = this._chart.ctx;
      var vm = this._view;
      if (vm.opacity === 0) {
        return;
      }
      var tooltipSize = {
        width: vm.width,
        height: vm.height
      };
      var pt = {
        x: vm.x,
        y: vm.y
      };
      var opacity = Math.abs(vm.opacity < 1e-3) ? 0 : vm.opacity;
      var hasTooltipContent = vm.title.length || vm.beforeBody.length || vm.body.length || vm.afterBody.length || vm.footer.length;
      if (this._options.enabled && hasTooltipContent) {
        ctx.save();
        ctx.globalAlpha = opacity;
        this.drawBackground(pt, vm, ctx, tooltipSize);
        pt.y += vm.yPadding;
        helpers$1.rtl.overrideTextDirection(ctx, vm.textDirection);
        this.drawTitle(pt, vm, ctx);
        this.drawBody(pt, vm, ctx);
        this.drawFooter(pt, vm, ctx);
        helpers$1.rtl.restoreTextDirection(ctx, vm.textDirection);
        ctx.restore();
      }
    },
    handleEvent: function (e) {
      var me = this;
      var options = me._options;
      var changed = false;
      me._lastActive = me._lastActive || [];
      if (e.type === 'mouseout') {
        me._active = [];
      } else {
        me._active = me._chart.getElementsAtEventForMode(e, options.mode, options);
        if (options.reverse) {
          me._active.reverse();
        }
      }
      changed = !helpers$1.arrayEquals(me._active, me._lastActive);
      if (changed) {
        me._lastActive = me._active;
        if (options.enabled || options.custom) {
          me._eventPosition = {
            x: e.x,
            y: e.y
          };
          me.update(true);
          me.pivot();
        }
      }
      return changed;
    }
  });
  var positioners_1 = positioners;
  var core_tooltip = exports$4;
  core_tooltip.positioners = positioners_1;
  var valueOrDefault$9 = helpers$1.valueOrDefault;
  core_defaults._set('global', {
    elements: {},
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    hover: {
      onHover: null,
      mode: 'nearest',
      intersect: true,
      animationDuration: 400
    },
    onClick: null,
    maintainAspectRatio: true,
    responsive: true,
    responsiveAnimationDuration: 0
  });
  function mergeScaleConfig() {
    return helpers$1.merge(Object.create(null), [].slice.call(arguments), {
      merger: function (key, target, source, options) {
        if (key === 'xAxes' || key === 'yAxes') {
          var slen = source[key].length;
          var i, type, scale;
          if (!target[key]) {
            target[key] = [];
          }
          for (i = 0; i < slen; ++i) {
            scale = source[key][i];
            type = valueOrDefault$9(scale.type, key === 'xAxes' ? 'category' : 'linear');
            if (i >= target[key].length) {
              target[key].push({});
            }
            if (!target[key][i].type || scale.type && scale.type !== target[key][i].type) {
              helpers$1.merge(target[key][i], [core_scaleService.getScaleDefaults(type), scale]);
            } else {
              helpers$1.merge(target[key][i], scale);
            }
          }
        } else {
          helpers$1._merger(key, target, source, options);
        }
      }
    });
  }
  function mergeConfig() {
    return helpers$1.merge(Object.create(null), [].slice.call(arguments), {
      merger: function (key, target, source, options) {
        var tval = target[key] || Object.create(null);
        var sval = source[key];
        if (key === 'scales') {
          target[key] = mergeScaleConfig(tval, sval);
        } else if (key === 'scale') {
          target[key] = helpers$1.merge(tval, [core_scaleService.getScaleDefaults(sval.type), sval]);
        } else {
          helpers$1._merger(key, target, source, options);
        }
      }
    });
  }
  function initConfig(config) {
    config = config || Object.create(null);
    var data = config.data = config.data || ({});
    data.datasets = data.datasets || [];
    data.labels = data.labels || [];
    config.options = mergeConfig(core_defaults.global, core_defaults[config.type], config.options || ({}));
    return config;
  }
  function updateConfig(chart) {
    var newOptions = chart.options;
    helpers$1.each(chart.scales, function (scale) {
      core_layouts.removeBox(chart, scale);
    });
    newOptions = mergeConfig(core_defaults.global, core_defaults[chart.config.type], newOptions);
    chart.options = chart.config.options = newOptions;
    chart.ensureScalesHaveIDs();
    chart.buildOrUpdateScales();
    chart.tooltip._options = newOptions.tooltips;
    chart.tooltip.initialize();
  }
  function nextAvailableScaleId(axesOpts, prefix, index) {
    var id;
    var hasId = function (obj) {
      return obj.id === id;
    };
    do {
      id = prefix + index++;
    } while (helpers$1.findIndex(axesOpts, hasId) >= 0);
    return id;
  }
  function positionIsHorizontal(position) {
    return position === 'top' || position === 'bottom';
  }
  function compare2Level(l1, l2) {
    return function (a, b) {
      return a[l1] === b[l1] ? a[l2] - b[l2] : a[l1] - b[l1];
    };
  }
  var Chart = function (item, config) {
    this.construct(item, config);
    return this;
  };
  helpers$1.extend(Chart.prototype, {
    construct: function (item, config) {
      var me = this;
      config = initConfig(config);
      var context = platform.acquireContext(item, config);
      var canvas = context && context.canvas;
      var height = canvas && canvas.height;
      var width = canvas && canvas.width;
      me.id = helpers$1.uid();
      me.ctx = context;
      me.canvas = canvas;
      me.config = config;
      me.width = width;
      me.height = height;
      me.aspectRatio = height ? width / height : null;
      me.options = config.options;
      me._bufferedRender = false;
      me._layers = [];
      me.chart = me;
      me.controller = me;
      Chart.instances[me.id] = me;
      Object.defineProperty(me, 'data', {
        get: function () {
          return me.config.data;
        },
        set: function (value) {
          me.config.data = value;
        }
      });
      if (!context || !canvas) {
        console.error("Failed to create chart: can't acquire context from the given item");
        return;
      }
      me.initialize();
      me.update();
    },
    initialize: function () {
      var me = this;
      core_plugins.notify(me, 'beforeInit');
      helpers$1.retinaScale(me, me.options.devicePixelRatio);
      me.bindEvents();
      if (me.options.responsive) {
        me.resize(true);
      }
      me.initToolTip();
      core_plugins.notify(me, 'afterInit');
      return me;
    },
    clear: function () {
      helpers$1.canvas.clear(this);
      return this;
    },
    stop: function () {
      core_animations.cancelAnimation(this);
      return this;
    },
    resize: function (silent) {
      var me = this;
      var options = me.options;
      var canvas = me.canvas;
      var aspectRatio = options.maintainAspectRatio && me.aspectRatio || null;
      var newWidth = Math.max(0, Math.floor(helpers$1.getMaximumWidth(canvas)));
      var newHeight = Math.max(0, Math.floor(aspectRatio ? newWidth / aspectRatio : helpers$1.getMaximumHeight(canvas)));
      if (me.width === newWidth && me.height === newHeight) {
        return;
      }
      canvas.width = me.width = newWidth;
      canvas.height = me.height = newHeight;
      canvas.style.width = newWidth + 'px';
      canvas.style.height = newHeight + 'px';
      helpers$1.retinaScale(me, options.devicePixelRatio);
      if (!silent) {
        var newSize = {
          width: newWidth,
          height: newHeight
        };
        core_plugins.notify(me, 'resize', [newSize]);
        if (options.onResize) {
          options.onResize(me, newSize);
        }
        me.stop();
        me.update({
          duration: options.responsiveAnimationDuration
        });
      }
    },
    ensureScalesHaveIDs: function () {
      var options = this.options;
      var scalesOptions = options.scales || ({});
      var scaleOptions = options.scale;
      helpers$1.each(scalesOptions.xAxes, function (xAxisOptions, index) {
        if (!xAxisOptions.id) {
          xAxisOptions.id = nextAvailableScaleId(scalesOptions.xAxes, 'x-axis-', index);
        }
      });
      helpers$1.each(scalesOptions.yAxes, function (yAxisOptions, index) {
        if (!yAxisOptions.id) {
          yAxisOptions.id = nextAvailableScaleId(scalesOptions.yAxes, 'y-axis-', index);
        }
      });
      if (scaleOptions) {
        scaleOptions.id = scaleOptions.id || 'scale';
      }
    },
    buildOrUpdateScales: function () {
      var me = this;
      var options = me.options;
      var scales = me.scales || ({});
      var items = [];
      var updated = Object.keys(scales).reduce(function (obj, id) {
        obj[id] = false;
        return obj;
      }, {});
      if (options.scales) {
        items = items.concat((options.scales.xAxes || []).map(function (xAxisOptions) {
          return {
            options: xAxisOptions,
            dtype: 'category',
            dposition: 'bottom'
          };
        }), (options.scales.yAxes || []).map(function (yAxisOptions) {
          return {
            options: yAxisOptions,
            dtype: 'linear',
            dposition: 'left'
          };
        }));
      }
      if (options.scale) {
        items.push({
          options: options.scale,
          dtype: 'radialLinear',
          isDefault: true,
          dposition: 'chartArea'
        });
      }
      helpers$1.each(items, function (item) {
        var scaleOptions = item.options;
        var id = scaleOptions.id;
        var scaleType = valueOrDefault$9(scaleOptions.type, item.dtype);
        if (positionIsHorizontal(scaleOptions.position) !== positionIsHorizontal(item.dposition)) {
          scaleOptions.position = item.dposition;
        }
        updated[id] = true;
        var scale = null;
        if ((id in scales) && scales[id].type === scaleType) {
          scale = scales[id];
          scale.options = scaleOptions;
          scale.ctx = me.ctx;
          scale.chart = me;
        } else {
          var scaleClass = core_scaleService.getScaleConstructor(scaleType);
          if (!scaleClass) {
            return;
          }
          scale = new scaleClass({
            id: id,
            type: scaleType,
            options: scaleOptions,
            ctx: me.ctx,
            chart: me
          });
          scales[scale.id] = scale;
        }
        scale.mergeTicksOptions();
        if (item.isDefault) {
          me.scale = scale;
        }
      });
      helpers$1.each(updated, function (hasUpdated, id) {
        if (!hasUpdated) {
          delete scales[id];
        }
      });
      me.scales = scales;
      core_scaleService.addScalesToLayout(this);
    },
    buildOrUpdateControllers: function () {
      var me = this;
      var newControllers = [];
      var datasets = me.data.datasets;
      var i, ilen;
      for ((i = 0, ilen = datasets.length); i < ilen; i++) {
        var dataset = datasets[i];
        var meta = me.getDatasetMeta(i);
        var type = dataset.type || me.config.type;
        if (meta.type && meta.type !== type) {
          me.destroyDatasetMeta(i);
          meta = me.getDatasetMeta(i);
        }
        meta.type = type;
        meta.order = dataset.order || 0;
        meta.index = i;
        if (meta.controller) {
          meta.controller.updateIndex(i);
          meta.controller.linkScales();
        } else {
          var ControllerClass = controllers[meta.type];
          if (ControllerClass === undefined) {
            throw new Error('"' + meta.type + '" is not a chart type.');
          }
          meta.controller = new ControllerClass(me, i);
          newControllers.push(meta.controller);
        }
      }
      return newControllers;
    },
    resetElements: function () {
      var me = this;
      helpers$1.each(me.data.datasets, function (dataset, datasetIndex) {
        me.getDatasetMeta(datasetIndex).controller.reset();
      }, me);
    },
    reset: function () {
      this.resetElements();
      this.tooltip.initialize();
    },
    update: function (config) {
      var me = this;
      var i, ilen;
      if (!config || typeof config !== 'object') {
        config = {
          duration: config,
          lazy: arguments[1]
        };
      }
      updateConfig(me);
      core_plugins._invalidate(me);
      if (core_plugins.notify(me, 'beforeUpdate') === false) {
        return;
      }
      me.tooltip._data = me.data;
      var newControllers = me.buildOrUpdateControllers();
      for ((i = 0, ilen = me.data.datasets.length); i < ilen; i++) {
        me.getDatasetMeta(i).controller.buildOrUpdateElements();
      }
      me.updateLayout();
      if (me.options.animation && me.options.animation.duration) {
        helpers$1.each(newControllers, function (controller) {
          controller.reset();
        });
      }
      me.updateDatasets();
      me.tooltip.initialize();
      me.lastActive = [];
      core_plugins.notify(me, 'afterUpdate');
      me._layers.sort(compare2Level('z', '_idx'));
      if (me._bufferedRender) {
        me._bufferedRequest = {
          duration: config.duration,
          easing: config.easing,
          lazy: config.lazy
        };
      } else {
        me.render(config);
      }
    },
    updateLayout: function () {
      var me = this;
      if (core_plugins.notify(me, 'beforeLayout') === false) {
        return;
      }
      core_layouts.update(this, this.width, this.height);
      me._layers = [];
      helpers$1.each(me.boxes, function (box) {
        if (box._configure) {
          box._configure();
        }
        me._layers.push.apply(me._layers, box._layers());
      }, me);
      me._layers.forEach(function (item, index) {
        item._idx = index;
      });
      core_plugins.notify(me, 'afterScaleUpdate');
      core_plugins.notify(me, 'afterLayout');
    },
    updateDatasets: function () {
      var me = this;
      if (core_plugins.notify(me, 'beforeDatasetsUpdate') === false) {
        return;
      }
      for (var i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
        me.updateDataset(i);
      }
      core_plugins.notify(me, 'afterDatasetsUpdate');
    },
    updateDataset: function (index) {
      var me = this;
      var meta = me.getDatasetMeta(index);
      var args = {
        meta: meta,
        index: index
      };
      if (core_plugins.notify(me, 'beforeDatasetUpdate', [args]) === false) {
        return;
      }
      meta.controller._update();
      core_plugins.notify(me, 'afterDatasetUpdate', [args]);
    },
    render: function (config) {
      var me = this;
      if (!config || typeof config !== 'object') {
        config = {
          duration: config,
          lazy: arguments[1]
        };
      }
      var animationOptions = me.options.animation;
      var duration = valueOrDefault$9(config.duration, animationOptions && animationOptions.duration);
      var lazy = config.lazy;
      if (core_plugins.notify(me, 'beforeRender') === false) {
        return;
      }
      var onComplete = function (animation) {
        core_plugins.notify(me, 'afterRender');
        helpers$1.callback(animationOptions && animationOptions.onComplete, [animation], me);
      };
      if (animationOptions && duration) {
        var animation = new core_animation({
          numSteps: duration / 16.66,
          easing: config.easing || animationOptions.easing,
          render: function (chart, animationObject) {
            var easingFunction = helpers$1.easing.effects[animationObject.easing];
            var currentStep = animationObject.currentStep;
            var stepDecimal = currentStep / animationObject.numSteps;
            chart.draw(easingFunction(stepDecimal), stepDecimal, currentStep);
          },
          onAnimationProgress: animationOptions.onProgress,
          onAnimationComplete: onComplete
        });
        core_animations.addAnimation(me, animation, duration, lazy);
      } else {
        me.draw();
        onComplete(new core_animation({
          numSteps: 0,
          chart: me
        }));
      }
      return me;
    },
    draw: function (easingValue) {
      var me = this;
      var i, layers;
      me.clear();
      if (helpers$1.isNullOrUndef(easingValue)) {
        easingValue = 1;
      }
      me.transition(easingValue);
      if (me.width <= 0 || me.height <= 0) {
        return;
      }
      if (core_plugins.notify(me, 'beforeDraw', [easingValue]) === false) {
        return;
      }
      layers = me._layers;
      for (i = 0; i < layers.length && layers[i].z <= 0; ++i) {
        layers[i].draw(me.chartArea);
      }
      me.drawDatasets(easingValue);
      for (; i < layers.length; ++i) {
        layers[i].draw(me.chartArea);
      }
      me._drawTooltip(easingValue);
      core_plugins.notify(me, 'afterDraw', [easingValue]);
    },
    transition: function (easingValue) {
      var me = this;
      for (var i = 0, ilen = (me.data.datasets || []).length; i < ilen; ++i) {
        if (me.isDatasetVisible(i)) {
          me.getDatasetMeta(i).controller.transition(easingValue);
        }
      }
      me.tooltip.transition(easingValue);
    },
    _getSortedDatasetMetas: function (filterVisible) {
      var me = this;
      var datasets = me.data.datasets || [];
      var result = [];
      var i, ilen;
      for ((i = 0, ilen = datasets.length); i < ilen; ++i) {
        if (!filterVisible || me.isDatasetVisible(i)) {
          result.push(me.getDatasetMeta(i));
        }
      }
      result.sort(compare2Level('order', 'index'));
      return result;
    },
    _getSortedVisibleDatasetMetas: function () {
      return this._getSortedDatasetMetas(true);
    },
    drawDatasets: function (easingValue) {
      var me = this;
      var metasets, i;
      if (core_plugins.notify(me, 'beforeDatasetsDraw', [easingValue]) === false) {
        return;
      }
      metasets = me._getSortedVisibleDatasetMetas();
      for (i = metasets.length - 1; i >= 0; --i) {
        me.drawDataset(metasets[i], easingValue);
      }
      core_plugins.notify(me, 'afterDatasetsDraw', [easingValue]);
    },
    drawDataset: function (meta, easingValue) {
      var me = this;
      var args = {
        meta: meta,
        index: meta.index,
        easingValue: easingValue
      };
      if (core_plugins.notify(me, 'beforeDatasetDraw', [args]) === false) {
        return;
      }
      meta.controller.draw(easingValue);
      core_plugins.notify(me, 'afterDatasetDraw', [args]);
    },
    _drawTooltip: function (easingValue) {
      var me = this;
      var tooltip = me.tooltip;
      var args = {
        tooltip: tooltip,
        easingValue: easingValue
      };
      if (core_plugins.notify(me, 'beforeTooltipDraw', [args]) === false) {
        return;
      }
      tooltip.draw();
      core_plugins.notify(me, 'afterTooltipDraw', [args]);
    },
    getElementAtEvent: function (e) {
      return core_interaction.modes.single(this, e);
    },
    getElementsAtEvent: function (e) {
      return core_interaction.modes.label(this, e, {
        intersect: true
      });
    },
    getElementsAtXAxis: function (e) {
      return core_interaction.modes['x-axis'](this, e, {
        intersect: true
      });
    },
    getElementsAtEventForMode: function (e, mode, options) {
      var method = core_interaction.modes[mode];
      if (typeof method === 'function') {
        return method(this, e, options);
      }
      return [];
    },
    getDatasetAtEvent: function (e) {
      return core_interaction.modes.dataset(this, e, {
        intersect: true
      });
    },
    getDatasetMeta: function (datasetIndex) {
      var me = this;
      var dataset = me.data.datasets[datasetIndex];
      if (!dataset._meta) {
        dataset._meta = {};
      }
      var meta = dataset._meta[me.id];
      if (!meta) {
        meta = dataset._meta[me.id] = {
          type: null,
          data: [],
          dataset: null,
          controller: null,
          hidden: null,
          xAxisID: null,
          yAxisID: null,
          order: dataset.order || 0,
          index: datasetIndex
        };
      }
      return meta;
    },
    getVisibleDatasetCount: function () {
      var count = 0;
      for (var i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
        if (this.isDatasetVisible(i)) {
          count++;
        }
      }
      return count;
    },
    isDatasetVisible: function (datasetIndex) {
      var meta = this.getDatasetMeta(datasetIndex);
      return typeof meta.hidden === 'boolean' ? !meta.hidden : !this.data.datasets[datasetIndex].hidden;
    },
    generateLegend: function () {
      return this.options.legendCallback(this);
    },
    destroyDatasetMeta: function (datasetIndex) {
      var id = this.id;
      var dataset = this.data.datasets[datasetIndex];
      var meta = dataset._meta && dataset._meta[id];
      if (meta) {
        meta.controller.destroy();
        delete dataset._meta[id];
      }
    },
    destroy: function () {
      var me = this;
      var canvas = me.canvas;
      var i, ilen;
      me.stop();
      for ((i = 0, ilen = me.data.datasets.length); i < ilen; ++i) {
        me.destroyDatasetMeta(i);
      }
      if (canvas) {
        me.unbindEvents();
        helpers$1.canvas.clear(me);
        platform.releaseContext(me.ctx);
        me.canvas = null;
        me.ctx = null;
      }
      core_plugins.notify(me, 'destroy');
      delete Chart.instances[me.id];
    },
    toBase64Image: function () {
      return this.canvas.toDataURL.apply(this.canvas, arguments);
    },
    initToolTip: function () {
      var me = this;
      me.tooltip = new core_tooltip({
        _chart: me,
        _chartInstance: me,
        _data: me.data,
        _options: me.options.tooltips
      }, me);
    },
    bindEvents: function () {
      var me = this;
      var listeners = me._listeners = {};
      var listener = function () {
        me.eventHandler.apply(me, arguments);
      };
      helpers$1.each(me.options.events, function (type) {
        platform.addEventListener(me, type, listener);
        listeners[type] = listener;
      });
      if (me.options.responsive) {
        listener = function () {
          me.resize();
        };
        platform.addEventListener(me, 'resize', listener);
        listeners.resize = listener;
      }
    },
    unbindEvents: function () {
      var me = this;
      var listeners = me._listeners;
      if (!listeners) {
        return;
      }
      delete me._listeners;
      helpers$1.each(listeners, function (listener, type) {
        platform.removeEventListener(me, type, listener);
      });
    },
    updateHoverStyle: function (elements, mode, enabled) {
      var prefix = enabled ? 'set' : 'remove';
      var element, i, ilen;
      for ((i = 0, ilen = elements.length); i < ilen; ++i) {
        element = elements[i];
        if (element) {
          this.getDatasetMeta(element._datasetIndex).controller[prefix + 'HoverStyle'](element);
        }
      }
      if (mode === 'dataset') {
        this.getDatasetMeta(elements[0]._datasetIndex).controller['_' + prefix + 'DatasetHoverStyle']();
      }
    },
    eventHandler: function (e) {
      var me = this;
      var tooltip = me.tooltip;
      if (core_plugins.notify(me, 'beforeEvent', [e]) === false) {
        return;
      }
      me._bufferedRender = true;
      me._bufferedRequest = null;
      var changed = me.handleEvent(e);
      if (tooltip) {
        changed = tooltip._start ? tooltip.handleEvent(e) : changed | tooltip.handleEvent(e);
      }
      core_plugins.notify(me, 'afterEvent', [e]);
      var bufferedRequest = me._bufferedRequest;
      if (bufferedRequest) {
        me.render(bufferedRequest);
      } else if (changed && !me.animating) {
        me.stop();
        me.render({
          duration: me.options.hover.animationDuration,
          lazy: true
        });
      }
      me._bufferedRender = false;
      me._bufferedRequest = null;
      return me;
    },
    handleEvent: function (e) {
      var me = this;
      var options = me.options || ({});
      var hoverOptions = options.hover;
      var changed = false;
      me.lastActive = me.lastActive || [];
      if (e.type === 'mouseout') {
        me.active = [];
      } else {
        me.active = me.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions);
      }
      helpers$1.callback(options.onHover || options.hover.onHover, [e.native, me.active], me);
      if (e.type === 'mouseup' || e.type === 'click') {
        if (options.onClick) {
          options.onClick.call(me, e.native, me.active);
        }
      }
      if (me.lastActive.length) {
        me.updateHoverStyle(me.lastActive, hoverOptions.mode, false);
      }
      if (me.active.length && hoverOptions.mode) {
        me.updateHoverStyle(me.active, hoverOptions.mode, true);
      }
      changed = !helpers$1.arrayEquals(me.active, me.lastActive);
      me.lastActive = me.active;
      return changed;
    }
  });
  Chart.instances = {};
  var core_controller = Chart;
  Chart.Controller = Chart;
  Chart.types = {};
  helpers$1.configMerge = mergeConfig;
  helpers$1.scaleMerge = mergeScaleConfig;
  var core_helpers = function () {
    helpers$1.where = function (collection, filterCallback) {
      if (helpers$1.isArray(collection) && Array.prototype.filter) {
        return collection.filter(filterCallback);
      }
      var filtered = [];
      helpers$1.each(collection, function (item) {
        if (filterCallback(item)) {
          filtered.push(item);
        }
      });
      return filtered;
    };
    helpers$1.findIndex = Array.prototype.findIndex ? function (array, callback, scope) {
      return array.findIndex(callback, scope);
    } : function (array, callback, scope) {
      scope = scope === undefined ? array : scope;
      for (var i = 0, ilen = array.length; i < ilen; ++i) {
        if (callback.call(scope, array[i], i, array)) {
          return i;
        }
      }
      return -1;
    };
    helpers$1.findNextWhere = function (arrayToSearch, filterCallback, startIndex) {
      if (helpers$1.isNullOrUndef(startIndex)) {
        startIndex = -1;
      }
      for (var i = startIndex + 1; i < arrayToSearch.length; i++) {
        var currentItem = arrayToSearch[i];
        if (filterCallback(currentItem)) {
          return currentItem;
        }
      }
    };
    helpers$1.findPreviousWhere = function (arrayToSearch, filterCallback, startIndex) {
      if (helpers$1.isNullOrUndef(startIndex)) {
        startIndex = arrayToSearch.length;
      }
      for (var i = startIndex - 1; i >= 0; i--) {
        var currentItem = arrayToSearch[i];
        if (filterCallback(currentItem)) {
          return currentItem;
        }
      }
    };
    helpers$1.isNumber = function (n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    };
    helpers$1.almostEquals = function (x, y, epsilon) {
      return Math.abs(x - y) < epsilon;
    };
    helpers$1.almostWhole = function (x, epsilon) {
      var rounded = Math.round(x);
      return rounded - epsilon <= x && rounded + epsilon >= x;
    };
    helpers$1.max = function (array) {
      return array.reduce(function (max, value) {
        if (!isNaN(value)) {
          return Math.max(max, value);
        }
        return max;
      }, Number.NEGATIVE_INFINITY);
    };
    helpers$1.min = function (array) {
      return array.reduce(function (min, value) {
        if (!isNaN(value)) {
          return Math.min(min, value);
        }
        return min;
      }, Number.POSITIVE_INFINITY);
    };
    helpers$1.sign = Math.sign ? function (x) {
      return Math.sign(x);
    } : function (x) {
      x = +x;
      if (x === 0 || isNaN(x)) {
        return x;
      }
      return x > 0 ? 1 : -1;
    };
    helpers$1.toRadians = function (degrees) {
      return degrees * (Math.PI / 180);
    };
    helpers$1.toDegrees = function (radians) {
      return radians * (180 / Math.PI);
    };
    helpers$1._decimalPlaces = function (x) {
      if (!helpers$1.isFinite(x)) {
        return;
      }
      var e = 1;
      var p = 0;
      while (Math.round(x * e) / e !== x) {
        e *= 10;
        p++;
      }
      return p;
    };
    helpers$1.getAngleFromPoint = function (centrePoint, anglePoint) {
      var distanceFromXCenter = anglePoint.x - centrePoint.x;
      var distanceFromYCenter = anglePoint.y - centrePoint.y;
      var radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
      var angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
      if (angle < -0.5 * Math.PI) {
        angle += 2.0 * Math.PI;
      }
      return {
        angle: angle,
        distance: radialDistanceFromCenter
      };
    };
    helpers$1.distanceBetweenPoints = function (pt1, pt2) {
      return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
    };
    helpers$1.aliasPixel = function (pixelWidth) {
      return pixelWidth % 2 === 0 ? 0 : 0.5;
    };
    helpers$1._alignPixel = function (chart, pixel, width) {
      var devicePixelRatio = chart.currentDevicePixelRatio;
      var halfWidth = width / 2;
      return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
    };
    helpers$1.splineCurve = function (firstPoint, middlePoint, afterPoint, t) {
      var previous = firstPoint.skip ? middlePoint : firstPoint;
      var current = middlePoint;
      var next = afterPoint.skip ? middlePoint : afterPoint;
      var d01 = Math.sqrt(Math.pow(current.x - previous.x, 2) + Math.pow(current.y - previous.y, 2));
      var d12 = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
      var s01 = d01 / (d01 + d12);
      var s12 = d12 / (d01 + d12);
      s01 = isNaN(s01) ? 0 : s01;
      s12 = isNaN(s12) ? 0 : s12;
      var fa = t * s01;
      var fb = t * s12;
      return {
        previous: {
          x: current.x - fa * (next.x - previous.x),
          y: current.y - fa * (next.y - previous.y)
        },
        next: {
          x: current.x + fb * (next.x - previous.x),
          y: current.y + fb * (next.y - previous.y)
        }
      };
    };
    helpers$1.EPSILON = Number.EPSILON || 1e-14;
    helpers$1.splineCurveMonotone = function (points) {
      var pointsWithTangents = (points || []).map(function (point) {
        return {
          model: point._model,
          deltaK: 0,
          mK: 0
        };
      });
      var pointsLen = pointsWithTangents.length;
      var i, pointBefore, pointCurrent, pointAfter;
      for (i = 0; i < pointsLen; ++i) {
        pointCurrent = pointsWithTangents[i];
        if (pointCurrent.model.skip) {
          continue;
        }
        pointBefore = i > 0 ? pointsWithTangents[i - 1] : null;
        pointAfter = i < pointsLen - 1 ? pointsWithTangents[i + 1] : null;
        if (pointAfter && !pointAfter.model.skip) {
          var slopeDeltaX = pointAfter.model.x - pointCurrent.model.x;
          pointCurrent.deltaK = slopeDeltaX !== 0 ? (pointAfter.model.y - pointCurrent.model.y) / slopeDeltaX : 0;
        }
        if (!pointBefore || pointBefore.model.skip) {
          pointCurrent.mK = pointCurrent.deltaK;
        } else if (!pointAfter || pointAfter.model.skip) {
          pointCurrent.mK = pointBefore.deltaK;
        } else if (this.sign(pointBefore.deltaK) !== this.sign(pointCurrent.deltaK)) {
          pointCurrent.mK = 0;
        } else {
          pointCurrent.mK = (pointBefore.deltaK + pointCurrent.deltaK) / 2;
        }
      }
      var alphaK, betaK, tauK, squaredMagnitude;
      for (i = 0; i < pointsLen - 1; ++i) {
        pointCurrent = pointsWithTangents[i];
        pointAfter = pointsWithTangents[i + 1];
        if (pointCurrent.model.skip || pointAfter.model.skip) {
          continue;
        }
        if (helpers$1.almostEquals(pointCurrent.deltaK, 0, this.EPSILON)) {
          pointCurrent.mK = pointAfter.mK = 0;
          continue;
        }
        alphaK = pointCurrent.mK / pointCurrent.deltaK;
        betaK = pointAfter.mK / pointCurrent.deltaK;
        squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
        if (squaredMagnitude <= 9) {
          continue;
        }
        tauK = 3 / Math.sqrt(squaredMagnitude);
        pointCurrent.mK = alphaK * tauK * pointCurrent.deltaK;
        pointAfter.mK = betaK * tauK * pointCurrent.deltaK;
      }
      var deltaX;
      for (i = 0; i < pointsLen; ++i) {
        pointCurrent = pointsWithTangents[i];
        if (pointCurrent.model.skip) {
          continue;
        }
        pointBefore = i > 0 ? pointsWithTangents[i - 1] : null;
        pointAfter = i < pointsLen - 1 ? pointsWithTangents[i + 1] : null;
        if (pointBefore && !pointBefore.model.skip) {
          deltaX = (pointCurrent.model.x - pointBefore.model.x) / 3;
          pointCurrent.model.controlPointPreviousX = pointCurrent.model.x - deltaX;
          pointCurrent.model.controlPointPreviousY = pointCurrent.model.y - deltaX * pointCurrent.mK;
        }
        if (pointAfter && !pointAfter.model.skip) {
          deltaX = (pointAfter.model.x - pointCurrent.model.x) / 3;
          pointCurrent.model.controlPointNextX = pointCurrent.model.x + deltaX;
          pointCurrent.model.controlPointNextY = pointCurrent.model.y + deltaX * pointCurrent.mK;
        }
      }
    };
    helpers$1.nextItem = function (collection, index, loop) {
      if (loop) {
        return index >= collection.length - 1 ? collection[0] : collection[index + 1];
      }
      return index >= collection.length - 1 ? collection[collection.length - 1] : collection[index + 1];
    };
    helpers$1.previousItem = function (collection, index, loop) {
      if (loop) {
        return index <= 0 ? collection[collection.length - 1] : collection[index - 1];
      }
      return index <= 0 ? collection[0] : collection[index - 1];
    };
    helpers$1.niceNum = function (range, round) {
      var exponent = Math.floor(helpers$1.log10(range));
      var fraction = range / Math.pow(10, exponent);
      var niceFraction;
      if (round) {
        if (fraction < 1.5) {
          niceFraction = 1;
        } else if (fraction < 3) {
          niceFraction = 2;
        } else if (fraction < 7) {
          niceFraction = 5;
        } else {
          niceFraction = 10;
        }
      } else if (fraction <= 1.0) {
        niceFraction = 1;
      } else if (fraction <= 2) {
        niceFraction = 2;
      } else if (fraction <= 5) {
        niceFraction = 5;
      } else {
        niceFraction = 10;
      }
      return niceFraction * Math.pow(10, exponent);
    };
    helpers$1.requestAnimFrame = (function () {
      if (typeof window === 'undefined') {
        return function (callback) {
          callback();
        };
      }
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || (function (callback) {
        return window.setTimeout(callback, 1000 / 60);
      });
    })();
    helpers$1.getRelativePosition = function (evt, chart) {
      var mouseX, mouseY;
      var e = evt.originalEvent || evt;
      var canvas = evt.target || evt.srcElement;
      var boundingRect = canvas.getBoundingClientRect();
      var touches = e.touches;
      if (touches && touches.length > 0) {
        mouseX = touches[0].clientX;
        mouseY = touches[0].clientY;
      } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
      var paddingLeft = parseFloat(helpers$1.getStyle(canvas, 'padding-left'));
      var paddingTop = parseFloat(helpers$1.getStyle(canvas, 'padding-top'));
      var paddingRight = parseFloat(helpers$1.getStyle(canvas, 'padding-right'));
      var paddingBottom = parseFloat(helpers$1.getStyle(canvas, 'padding-bottom'));
      var width = boundingRect.right - boundingRect.left - paddingLeft - paddingRight;
      var height = boundingRect.bottom - boundingRect.top - paddingTop - paddingBottom;
      mouseX = Math.round((mouseX - boundingRect.left - paddingLeft) / width * canvas.width / chart.currentDevicePixelRatio);
      mouseY = Math.round((mouseY - boundingRect.top - paddingTop) / height * canvas.height / chart.currentDevicePixelRatio);
      return {
        x: mouseX,
        y: mouseY
      };
    };
    function parseMaxStyle(styleValue, node, parentProperty) {
      var valueInPixels;
      if (typeof styleValue === 'string') {
        valueInPixels = parseInt(styleValue, 10);
        if (styleValue.indexOf('%') !== -1) {
          valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
        }
      } else {
        valueInPixels = styleValue;
      }
      return valueInPixels;
    }
    function isConstrainedValue(value) {
      return value !== undefined && value !== null && value !== 'none';
    }
    function getConstraintDimension(domNode, maxStyle, percentageProperty) {
      var view = document.defaultView;
      var parentNode = helpers$1._getParentNode(domNode);
      var constrainedNode = view.getComputedStyle(domNode)[maxStyle];
      var constrainedContainer = view.getComputedStyle(parentNode)[maxStyle];
      var hasCNode = isConstrainedValue(constrainedNode);
      var hasCContainer = isConstrainedValue(constrainedContainer);
      var infinity = Number.POSITIVE_INFINITY;
      if (hasCNode || hasCContainer) {
        return Math.min(hasCNode ? parseMaxStyle(constrainedNode, domNode, percentageProperty) : infinity, hasCContainer ? parseMaxStyle(constrainedContainer, parentNode, percentageProperty) : infinity);
      }
      return 'none';
    }
    helpers$1.getConstraintWidth = function (domNode) {
      return getConstraintDimension(domNode, 'max-width', 'clientWidth');
    };
    helpers$1.getConstraintHeight = function (domNode) {
      return getConstraintDimension(domNode, 'max-height', 'clientHeight');
    };
    helpers$1._calculatePadding = function (container, padding, parentDimension) {
      padding = helpers$1.getStyle(container, padding);
      return padding.indexOf('%') > -1 ? parentDimension * parseInt(padding, 10) / 100 : parseInt(padding, 10);
    };
    helpers$1._getParentNode = function (domNode) {
      var parent = domNode.parentNode;
      if (parent && parent.toString() === '[object ShadowRoot]') {
        parent = parent.host;
      }
      return parent;
    };
    helpers$1.getMaximumWidth = function (domNode) {
      var container = helpers$1._getParentNode(domNode);
      if (!container) {
        return domNode.clientWidth;
      }
      var clientWidth = container.clientWidth;
      var paddingLeft = helpers$1._calculatePadding(container, 'padding-left', clientWidth);
      var paddingRight = helpers$1._calculatePadding(container, 'padding-right', clientWidth);
      var w = clientWidth - paddingLeft - paddingRight;
      var cw = helpers$1.getConstraintWidth(domNode);
      return isNaN(cw) ? w : Math.min(w, cw);
    };
    helpers$1.getMaximumHeight = function (domNode) {
      var container = helpers$1._getParentNode(domNode);
      if (!container) {
        return domNode.clientHeight;
      }
      var clientHeight = container.clientHeight;
      var paddingTop = helpers$1._calculatePadding(container, 'padding-top', clientHeight);
      var paddingBottom = helpers$1._calculatePadding(container, 'padding-bottom', clientHeight);
      var h = clientHeight - paddingTop - paddingBottom;
      var ch = helpers$1.getConstraintHeight(domNode);
      return isNaN(ch) ? h : Math.min(h, ch);
    };
    helpers$1.getStyle = function (el, property) {
      return el.currentStyle ? el.currentStyle[property] : document.defaultView.getComputedStyle(el, null).getPropertyValue(property);
    };
    helpers$1.retinaScale = function (chart, forceRatio) {
      var pixelRatio = chart.currentDevicePixelRatio = forceRatio || typeof window !== 'undefined' && window.devicePixelRatio || 1;
      if (pixelRatio === 1) {
        return;
      }
      var canvas = chart.canvas;
      var height = chart.height;
      var width = chart.width;
      canvas.height = height * pixelRatio;
      canvas.width = width * pixelRatio;
      chart.ctx.scale(pixelRatio, pixelRatio);
      if (!canvas.style.height && !canvas.style.width) {
        canvas.style.height = height + 'px';
        canvas.style.width = width + 'px';
      }
    };
    helpers$1.fontString = function (pixelSize, fontStyle, fontFamily) {
      return fontStyle + ' ' + pixelSize + 'px ' + fontFamily;
    };
    helpers$1.longestText = function (ctx, font, arrayOfThings, cache) {
      cache = cache || ({});
      var data = cache.data = cache.data || ({});
      var gc = cache.garbageCollect = cache.garbageCollect || [];
      if (cache.font !== font) {
        data = cache.data = {};
        gc = cache.garbageCollect = [];
        cache.font = font;
      }
      ctx.font = font;
      var longest = 0;
      var ilen = arrayOfThings.length;
      var i, j, jlen, thing, nestedThing;
      for (i = 0; i < ilen; i++) {
        thing = arrayOfThings[i];
        if (thing !== undefined && thing !== null && helpers$1.isArray(thing) !== true) {
          longest = helpers$1.measureText(ctx, data, gc, longest, thing);
        } else if (helpers$1.isArray(thing)) {
          for ((j = 0, jlen = thing.length); j < jlen; j++) {
            nestedThing = thing[j];
            if (nestedThing !== undefined && nestedThing !== null && !helpers$1.isArray(nestedThing)) {
              longest = helpers$1.measureText(ctx, data, gc, longest, nestedThing);
            }
          }
        }
      }
      var gcLen = gc.length / 2;
      if (gcLen > arrayOfThings.length) {
        for (i = 0; i < gcLen; i++) {
          delete data[gc[i]];
        }
        gc.splice(0, gcLen);
      }
      return longest;
    };
    helpers$1.measureText = function (ctx, data, gc, longest, string) {
      var textWidth = data[string];
      if (!textWidth) {
        textWidth = data[string] = ctx.measureText(string).width;
        gc.push(string);
      }
      if (textWidth > longest) {
        longest = textWidth;
      }
      return longest;
    };
    helpers$1.numberOfLabelLines = function (arrayOfThings) {
      var numberOfLines = 1;
      helpers$1.each(arrayOfThings, function (thing) {
        if (helpers$1.isArray(thing)) {
          if (thing.length > numberOfLines) {
            numberOfLines = thing.length;
          }
        }
      });
      return numberOfLines;
    };
    helpers$1.color = !chartjsColor ? function (value) {
      console.error('Color.js not found!');
      return value;
    } : function (value) {
      if (value instanceof CanvasGradient) {
        value = core_defaults.global.defaultColor;
      }
      return chartjsColor(value);
    };
    helpers$1.getHoverColor = function (colorValue) {
      return colorValue instanceof CanvasPattern || colorValue instanceof CanvasGradient ? colorValue : helpers$1.color(colorValue).saturate(0.5).darken(0.1).rgbString();
    };
  };
  function abstract() {
    throw new Error('This method is not implemented: either no adapter can ' + 'be found or an incomplete integration was provided.');
  }
  function DateAdapter(options) {
    this.options = options || ({});
  }
  helpers$1.extend(DateAdapter.prototype, {
    formats: abstract,
    parse: abstract,
    format: abstract,
    add: abstract,
    diff: abstract,
    startOf: abstract,
    endOf: abstract,
    _create: function (value) {
      return value;
    }
  });
  DateAdapter.override = function (members) {
    helpers$1.extend(DateAdapter.prototype, members);
  };
  var _date = DateAdapter;
  var core_adapters = {
    _date: _date
  };
  var core_ticks = {
    formatters: {
      values: function (value) {
        return helpers$1.isArray(value) ? value : '' + value;
      },
      linear: function (tickValue, index, ticks) {
        var delta = ticks.length > 3 ? ticks[2] - ticks[1] : ticks[1] - ticks[0];
        if (Math.abs(delta) > 1) {
          if (tickValue !== Math.floor(tickValue)) {
            delta = tickValue - Math.floor(tickValue);
          }
        }
        var logDelta = helpers$1.log10(Math.abs(delta));
        var tickString = '';
        if (tickValue !== 0) {
          var maxTick = Math.max(Math.abs(ticks[0]), Math.abs(ticks[ticks.length - 1]));
          if (maxTick < 1e-4) {
            var logTick = helpers$1.log10(Math.abs(tickValue));
            var numExponential = Math.floor(logTick) - Math.floor(logDelta);
            numExponential = Math.max(Math.min(numExponential, 20), 0);
            tickString = tickValue.toExponential(numExponential);
          } else {
            var numDecimal = -1 * Math.floor(logDelta);
            numDecimal = Math.max(Math.min(numDecimal, 20), 0);
            tickString = tickValue.toFixed(numDecimal);
          }
        } else {
          tickString = '0';
        }
        return tickString;
      },
      logarithmic: function (tickValue, index, ticks) {
        var remain = tickValue / Math.pow(10, Math.floor(helpers$1.log10(tickValue)));
        if (tickValue === 0) {
          return '0';
        } else if (remain === 1 || remain === 2 || remain === 5 || index === 0 || index === ticks.length - 1) {
          return tickValue.toExponential();
        }
        return '';
      }
    }
  };
  var isArray = helpers$1.isArray;
  var isNullOrUndef = helpers$1.isNullOrUndef;
  var valueOrDefault$a = helpers$1.valueOrDefault;
  var valueAtIndexOrDefault = helpers$1.valueAtIndexOrDefault;
  core_defaults._set('scale', {
    display: true,
    position: 'left',
    offset: false,
    gridLines: {
      display: true,
      color: 'rgba(0,0,0,0.1)',
      lineWidth: 1,
      drawBorder: true,
      drawOnChartArea: true,
      drawTicks: true,
      tickMarkLength: 10,
      zeroLineWidth: 1,
      zeroLineColor: 'rgba(0,0,0,0.25)',
      zeroLineBorderDash: [],
      zeroLineBorderDashOffset: 0.0,
      offsetGridLines: false,
      borderDash: [],
      borderDashOffset: 0.0
    },
    scaleLabel: {
      display: false,
      labelString: '',
      padding: {
        top: 4,
        bottom: 4
      }
    },
    ticks: {
      beginAtZero: false,
      minRotation: 0,
      maxRotation: 50,
      mirror: false,
      padding: 0,
      reverse: false,
      display: true,
      autoSkip: true,
      autoSkipPadding: 0,
      labelOffset: 0,
      callback: core_ticks.formatters.values,
      minor: {},
      major: {}
    }
  });
  function sample(arr, numItems) {
    var result = [];
    var increment = arr.length / numItems;
    var i = 0;
    var len = arr.length;
    for (; i < len; i += increment) {
      result.push(arr[Math.floor(i)]);
    }
    return result;
  }
  function getPixelForGridLine(scale, index, offsetGridLines) {
    var length = scale.getTicks().length;
    var validIndex = Math.min(index, length - 1);
    var lineValue = scale.getPixelForTick(validIndex);
    var start = scale._startPixel;
    var end = scale._endPixel;
    var epsilon = 1e-6;
    var offset;
    if (offsetGridLines) {
      if (length === 1) {
        offset = Math.max(lineValue - start, end - lineValue);
      } else if (index === 0) {
        offset = (scale.getPixelForTick(1) - lineValue) / 2;
      } else {
        offset = (lineValue - scale.getPixelForTick(validIndex - 1)) / 2;
      }
      lineValue += validIndex < index ? offset : -offset;
      if (lineValue < start - epsilon || lineValue > end + epsilon) {
        return;
      }
    }
    return lineValue;
  }
  function garbageCollect(caches, length) {
    helpers$1.each(caches, function (cache) {
      var gc = cache.gc;
      var gcLen = gc.length / 2;
      var i;
      if (gcLen > length) {
        for (i = 0; i < gcLen; ++i) {
          delete cache.data[gc[i]];
        }
        gc.splice(0, gcLen);
      }
    });
  }
  function computeLabelSizes(ctx, tickFonts, ticks, caches) {
    var length = ticks.length;
    var widths = [];
    var heights = [];
    var offsets = [];
    var widestLabelSize = 0;
    var highestLabelSize = 0;
    var i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel, widest, highest;
    for (i = 0; i < length; ++i) {
      label = ticks[i].label;
      tickFont = ticks[i].major ? tickFonts.major : tickFonts.minor;
      ctx.font = fontString = tickFont.string;
      cache = caches[fontString] = caches[fontString] || ({
        data: {},
        gc: []
      });
      lineHeight = tickFont.lineHeight;
      width = height = 0;
      if (!isNullOrUndef(label) && !isArray(label)) {
        width = helpers$1.measureText(ctx, cache.data, cache.gc, width, label);
        height = lineHeight;
      } else if (isArray(label)) {
        for ((j = 0, jlen = label.length); j < jlen; ++j) {
          nestedLabel = label[j];
          if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
            width = helpers$1.measureText(ctx, cache.data, cache.gc, width, nestedLabel);
            height += lineHeight;
          }
        }
      }
      widths.push(width);
      heights.push(height);
      offsets.push(lineHeight / 2);
      widestLabelSize = Math.max(width, widestLabelSize);
      highestLabelSize = Math.max(height, highestLabelSize);
    }
    garbageCollect(caches, length);
    widest = widths.indexOf(widestLabelSize);
    highest = heights.indexOf(highestLabelSize);
    function valueAt(idx) {
      return {
        width: widths[idx] || 0,
        height: heights[idx] || 0,
        offset: offsets[idx] || 0
      };
    }
    return {
      first: valueAt(0),
      last: valueAt(length - 1),
      widest: valueAt(widest),
      highest: valueAt(highest)
    };
  }
  function getTickMarkLength(options) {
    return options.drawTicks ? options.tickMarkLength : 0;
  }
  function getScaleLabelHeight(options) {
    var font, padding;
    if (!options.display) {
      return 0;
    }
    font = helpers$1.options._parseFont(options);
    padding = helpers$1.options.toPadding(options.padding);
    return font.lineHeight + padding.height;
  }
  function parseFontOptions(options, nestedOpts) {
    return helpers$1.extend(helpers$1.options._parseFont({
      fontFamily: valueOrDefault$a(nestedOpts.fontFamily, options.fontFamily),
      fontSize: valueOrDefault$a(nestedOpts.fontSize, options.fontSize),
      fontStyle: valueOrDefault$a(nestedOpts.fontStyle, options.fontStyle),
      lineHeight: valueOrDefault$a(nestedOpts.lineHeight, options.lineHeight)
    }), {
      color: helpers$1.options.resolve([nestedOpts.fontColor, options.fontColor, core_defaults.global.defaultFontColor])
    });
  }
  function parseTickFontOptions(options) {
    var minor = parseFontOptions(options, options.minor);
    var major = options.major.enabled ? parseFontOptions(options, options.major) : minor;
    return {
      minor: minor,
      major: major
    };
  }
  function nonSkipped(ticksToFilter) {
    var filtered = [];
    var item, index, len;
    for ((index = 0, len = ticksToFilter.length); index < len; ++index) {
      item = ticksToFilter[index];
      if (typeof item._index !== 'undefined') {
        filtered.push(item);
      }
    }
    return filtered;
  }
  function getEvenSpacing(arr) {
    var len = arr.length;
    var i, diff;
    if (len < 2) {
      return false;
    }
    for ((diff = arr[0], i = 1); i < len; ++i) {
      if (arr[i] - arr[i - 1] !== diff) {
        return false;
      }
    }
    return diff;
  }
  function calculateSpacing(majorIndices, ticks, axisLength, ticksLimit) {
    var evenMajorSpacing = getEvenSpacing(majorIndices);
    var spacing = (ticks.length - 1) / ticksLimit;
    var factors, factor, i, ilen;
    if (!evenMajorSpacing) {
      return Math.max(spacing, 1);
    }
    factors = helpers$1.math._factorize(evenMajorSpacing);
    for ((i = 0, ilen = factors.length - 1); i < ilen; i++) {
      factor = factors[i];
      if (factor > spacing) {
        return factor;
      }
    }
    return Math.max(spacing, 1);
  }
  function getMajorIndices(ticks) {
    var result = [];
    var i, ilen;
    for ((i = 0, ilen = ticks.length); i < ilen; i++) {
      if (ticks[i].major) {
        result.push(i);
      }
    }
    return result;
  }
  function skipMajors(ticks, majorIndices, spacing) {
    var count = 0;
    var next = majorIndices[0];
    var i, tick;
    spacing = Math.ceil(spacing);
    for (i = 0; i < ticks.length; i++) {
      tick = ticks[i];
      if (i === next) {
        tick._index = i;
        count++;
        next = majorIndices[count * spacing];
      } else {
        delete tick.label;
      }
    }
  }
  function skip(ticks, spacing, majorStart, majorEnd) {
    var start = valueOrDefault$a(majorStart, 0);
    var end = Math.min(valueOrDefault$a(majorEnd, ticks.length), ticks.length);
    var count = 0;
    var length, i, tick, next;
    spacing = Math.ceil(spacing);
    if (majorEnd) {
      length = majorEnd - majorStart;
      spacing = length / Math.floor(length / spacing);
    }
    next = start;
    while (next < 0) {
      count++;
      next = Math.round(start + count * spacing);
    }
    for (i = Math.max(start, 0); i < end; i++) {
      tick = ticks[i];
      if (i === next) {
        tick._index = i;
        count++;
        next = Math.round(start + count * spacing);
      } else {
        delete tick.label;
      }
    }
  }
  var Scale = core_element.extend({
    zeroLineIndex: 0,
    getPadding: function () {
      var me = this;
      return {
        left: me.paddingLeft || 0,
        top: me.paddingTop || 0,
        right: me.paddingRight || 0,
        bottom: me.paddingBottom || 0
      };
    },
    getTicks: function () {
      return this._ticks;
    },
    _getLabels: function () {
      var data = this.chart.data;
      return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
    },
    mergeTicksOptions: function () {},
    beforeUpdate: function () {
      helpers$1.callback(this.options.beforeUpdate, [this]);
    },
    update: function (maxWidth, maxHeight, margins) {
      var me = this;
      var tickOpts = me.options.ticks;
      var sampleSize = tickOpts.sampleSize;
      var i, ilen, labels, ticks, samplingEnabled;
      me.beforeUpdate();
      me.maxWidth = maxWidth;
      me.maxHeight = maxHeight;
      me.margins = helpers$1.extend({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }, margins);
      me._ticks = null;
      me.ticks = null;
      me._labelSizes = null;
      me._maxLabelLines = 0;
      me.longestLabelWidth = 0;
      me.longestTextCache = me.longestTextCache || ({});
      me._gridLineItems = null;
      me._labelItems = null;
      me.beforeSetDimensions();
      me.setDimensions();
      me.afterSetDimensions();
      me.beforeDataLimits();
      me.determineDataLimits();
      me.afterDataLimits();
      me.beforeBuildTicks();
      ticks = me.buildTicks() || [];
      ticks = me.afterBuildTicks(ticks) || ticks;
      if ((!ticks || !ticks.length) && me.ticks) {
        ticks = [];
        for ((i = 0, ilen = me.ticks.length); i < ilen; ++i) {
          ticks.push({
            value: me.ticks[i],
            major: false
          });
        }
      }
      me._ticks = ticks;
      samplingEnabled = sampleSize < ticks.length;
      labels = me._convertTicksToLabels(samplingEnabled ? sample(ticks, sampleSize) : ticks);
      me._configure();
      me.beforeCalculateTickRotation();
      me.calculateTickRotation();
      me.afterCalculateTickRotation();
      me.beforeFit();
      me.fit();
      me.afterFit();
      me._ticksToDraw = tickOpts.display && (tickOpts.autoSkip || tickOpts.source === 'auto') ? me._autoSkip(ticks) : ticks;
      if (samplingEnabled) {
        labels = me._convertTicksToLabels(me._ticksToDraw);
      }
      me.ticks = labels;
      me.afterUpdate();
      return me.minSize;
    },
    _configure: function () {
      var me = this;
      var reversePixels = me.options.ticks.reverse;
      var startPixel, endPixel;
      if (me.isHorizontal()) {
        startPixel = me.left;
        endPixel = me.right;
      } else {
        startPixel = me.top;
        endPixel = me.bottom;
        reversePixels = !reversePixels;
      }
      me._startPixel = startPixel;
      me._endPixel = endPixel;
      me._reversePixels = reversePixels;
      me._length = endPixel - startPixel;
    },
    afterUpdate: function () {
      helpers$1.callback(this.options.afterUpdate, [this]);
    },
    beforeSetDimensions: function () {
      helpers$1.callback(this.options.beforeSetDimensions, [this]);
    },
    setDimensions: function () {
      var me = this;
      if (me.isHorizontal()) {
        me.width = me.maxWidth;
        me.left = 0;
        me.right = me.width;
      } else {
        me.height = me.maxHeight;
        me.top = 0;
        me.bottom = me.height;
      }
      me.paddingLeft = 0;
      me.paddingTop = 0;
      me.paddingRight = 0;
      me.paddingBottom = 0;
    },
    afterSetDimensions: function () {
      helpers$1.callback(this.options.afterSetDimensions, [this]);
    },
    beforeDataLimits: function () {
      helpers$1.callback(this.options.beforeDataLimits, [this]);
    },
    determineDataLimits: helpers$1.noop,
    afterDataLimits: function () {
      helpers$1.callback(this.options.afterDataLimits, [this]);
    },
    beforeBuildTicks: function () {
      helpers$1.callback(this.options.beforeBuildTicks, [this]);
    },
    buildTicks: helpers$1.noop,
    afterBuildTicks: function (ticks) {
      var me = this;
      if (isArray(ticks) && ticks.length) {
        return helpers$1.callback(me.options.afterBuildTicks, [me, ticks]);
      }
      me.ticks = helpers$1.callback(me.options.afterBuildTicks, [me, me.ticks]) || me.ticks;
      return ticks;
    },
    beforeTickToLabelConversion: function () {
      helpers$1.callback(this.options.beforeTickToLabelConversion, [this]);
    },
    convertTicksToLabels: function () {
      var me = this;
      var tickOpts = me.options.ticks;
      me.ticks = me.ticks.map(tickOpts.userCallback || tickOpts.callback, this);
    },
    afterTickToLabelConversion: function () {
      helpers$1.callback(this.options.afterTickToLabelConversion, [this]);
    },
    beforeCalculateTickRotation: function () {
      helpers$1.callback(this.options.beforeCalculateTickRotation, [this]);
    },
    calculateTickRotation: function () {
      var me = this;
      var options = me.options;
      var tickOpts = options.ticks;
      var numTicks = me.getTicks().length;
      var minRotation = tickOpts.minRotation || 0;
      var maxRotation = tickOpts.maxRotation;
      var labelRotation = minRotation;
      var labelSizes, maxLabelWidth, maxLabelHeight, maxWidth, tickWidth, maxHeight, maxLabelDiagonal;
      if (!me._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !me.isHorizontal()) {
        me.labelRotation = minRotation;
        return;
      }
      labelSizes = me._getLabelSizes();
      maxLabelWidth = labelSizes.widest.width;
      maxLabelHeight = labelSizes.highest.height - labelSizes.highest.offset;
      maxWidth = Math.min(me.maxWidth, me.chart.width - maxLabelWidth);
      tickWidth = options.offset ? me.maxWidth / numTicks : maxWidth / (numTicks - 1);
      if (maxLabelWidth + 6 > tickWidth) {
        tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
        maxHeight = me.maxHeight - getTickMarkLength(options.gridLines) - tickOpts.padding - getScaleLabelHeight(options.scaleLabel);
        maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
        labelRotation = helpers$1.toDegrees(Math.min(Math.asin(Math.min((labelSizes.highest.height + 6) / tickWidth, 1)), Math.asin(Math.min(maxHeight / maxLabelDiagonal, 1)) - Math.asin(maxLabelHeight / maxLabelDiagonal)));
        labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
      }
      me.labelRotation = labelRotation;
    },
    afterCalculateTickRotation: function () {
      helpers$1.callback(this.options.afterCalculateTickRotation, [this]);
    },
    beforeFit: function () {
      helpers$1.callback(this.options.beforeFit, [this]);
    },
    fit: function () {
      var me = this;
      var minSize = me.minSize = {
        width: 0,
        height: 0
      };
      var chart = me.chart;
      var opts = me.options;
      var tickOpts = opts.ticks;
      var scaleLabelOpts = opts.scaleLabel;
      var gridLineOpts = opts.gridLines;
      var display = me._isVisible();
      var isBottom = opts.position === 'bottom';
      var isHorizontal = me.isHorizontal();
      if (isHorizontal) {
        minSize.width = me.maxWidth;
      } else if (display) {
        minSize.width = getTickMarkLength(gridLineOpts) + getScaleLabelHeight(scaleLabelOpts);
      }
      if (!isHorizontal) {
        minSize.height = me.maxHeight;
      } else if (display) {
        minSize.height = getTickMarkLength(gridLineOpts) + getScaleLabelHeight(scaleLabelOpts);
      }
      if (tickOpts.display && display) {
        var tickFonts = parseTickFontOptions(tickOpts);
        var labelSizes = me._getLabelSizes();
        var firstLabelSize = labelSizes.first;
        var lastLabelSize = labelSizes.last;
        var widestLabelSize = labelSizes.widest;
        var highestLabelSize = labelSizes.highest;
        var lineSpace = tickFonts.minor.lineHeight * 0.4;
        var tickPadding = tickOpts.padding;
        if (isHorizontal) {
          var isRotated = me.labelRotation !== 0;
          var angleRadians = helpers$1.toRadians(me.labelRotation);
          var cosRotation = Math.cos(angleRadians);
          var sinRotation = Math.sin(angleRadians);
          var labelHeight = sinRotation * widestLabelSize.width + cosRotation * (highestLabelSize.height - (isRotated ? highestLabelSize.offset : 0)) + (isRotated ? 0 : lineSpace);
          minSize.height = Math.min(me.maxHeight, minSize.height + labelHeight + tickPadding);
          var offsetLeft = me.getPixelForTick(0) - me.left;
          var offsetRight = me.right - me.getPixelForTick(me.getTicks().length - 1);
          var paddingLeft, paddingRight;
          if (isRotated) {
            paddingLeft = isBottom ? cosRotation * firstLabelSize.width + sinRotation * firstLabelSize.offset : sinRotation * (firstLabelSize.height - firstLabelSize.offset);
            paddingRight = isBottom ? sinRotation * (lastLabelSize.height - lastLabelSize.offset) : cosRotation * lastLabelSize.width + sinRotation * lastLabelSize.offset;
          } else {
            paddingLeft = firstLabelSize.width / 2;
            paddingRight = lastLabelSize.width / 2;
          }
          me.paddingLeft = Math.max((paddingLeft - offsetLeft) * me.width / (me.width - offsetLeft), 0) + 3;
          me.paddingRight = Math.max((paddingRight - offsetRight) * me.width / (me.width - offsetRight), 0) + 3;
        } else {
          var labelWidth = tickOpts.mirror ? 0 : widestLabelSize.width + tickPadding + lineSpace;
          minSize.width = Math.min(me.maxWidth, minSize.width + labelWidth);
          me.paddingTop = firstLabelSize.height / 2;
          me.paddingBottom = lastLabelSize.height / 2;
        }
      }
      me.handleMargins();
      if (isHorizontal) {
        me.width = me._length = chart.width - me.margins.left - me.margins.right;
        me.height = minSize.height;
      } else {
        me.width = minSize.width;
        me.height = me._length = chart.height - me.margins.top - me.margins.bottom;
      }
    },
    handleMargins: function () {
      var me = this;
      if (me.margins) {
        me.margins.left = Math.max(me.paddingLeft, me.margins.left);
        me.margins.top = Math.max(me.paddingTop, me.margins.top);
        me.margins.right = Math.max(me.paddingRight, me.margins.right);
        me.margins.bottom = Math.max(me.paddingBottom, me.margins.bottom);
      }
    },
    afterFit: function () {
      helpers$1.callback(this.options.afterFit, [this]);
    },
    isHorizontal: function () {
      var pos = this.options.position;
      return pos === 'top' || pos === 'bottom';
    },
    isFullWidth: function () {
      return this.options.fullWidth;
    },
    getRightValue: function (rawValue) {
      if (isNullOrUndef(rawValue)) {
        return NaN;
      }
      if ((typeof rawValue === 'number' || rawValue instanceof Number) && !isFinite(rawValue)) {
        return NaN;
      }
      if (rawValue) {
        if (this.isHorizontal()) {
          if (rawValue.x !== undefined) {
            return this.getRightValue(rawValue.x);
          }
        } else if (rawValue.y !== undefined) {
          return this.getRightValue(rawValue.y);
        }
      }
      return rawValue;
    },
    _convertTicksToLabels: function (ticks) {
      var me = this;
      var labels, i, ilen;
      me.ticks = ticks.map(function (tick) {
        return tick.value;
      });
      me.beforeTickToLabelConversion();
      labels = me.convertTicksToLabels(ticks) || me.ticks;
      me.afterTickToLabelConversion();
      for ((i = 0, ilen = ticks.length); i < ilen; ++i) {
        ticks[i].label = labels[i];
      }
      return labels;
    },
    _getLabelSizes: function () {
      var me = this;
      var labelSizes = me._labelSizes;
      if (!labelSizes) {
        me._labelSizes = labelSizes = computeLabelSizes(me.ctx, parseTickFontOptions(me.options.ticks), me.getTicks(), me.longestTextCache);
        me.longestLabelWidth = labelSizes.widest.width;
      }
      return labelSizes;
    },
    _parseValue: function (value) {
      var start, end, min, max;
      if (isArray(value)) {
        start = +this.getRightValue(value[0]);
        end = +this.getRightValue(value[1]);
        min = Math.min(start, end);
        max = Math.max(start, end);
      } else {
        value = +this.getRightValue(value);
        start = undefined;
        end = value;
        min = value;
        max = value;
      }
      return {
        min: min,
        max: max,
        start: start,
        end: end
      };
    },
    _getScaleLabel: function (rawValue) {
      var v = this._parseValue(rawValue);
      if (v.start !== undefined) {
        return '[' + v.start + ', ' + v.end + ']';
      }
      return +this.getRightValue(rawValue);
    },
    getLabelForIndex: helpers$1.noop,
    getPixelForValue: helpers$1.noop,
    getValueForPixel: helpers$1.noop,
    getPixelForTick: function (index) {
      var me = this;
      var offset = me.options.offset;
      var numTicks = me._ticks.length;
      var tickWidth = 1 / Math.max(numTicks - (offset ? 0 : 1), 1);
      return index < 0 || index > numTicks - 1 ? null : me.getPixelForDecimal(index * tickWidth + (offset ? tickWidth / 2 : 0));
    },
    getPixelForDecimal: function (decimal) {
      var me = this;
      if (me._reversePixels) {
        decimal = 1 - decimal;
      }
      return me._startPixel + decimal * me._length;
    },
    getDecimalForPixel: function (pixel) {
      var decimal = (pixel - this._startPixel) / this._length;
      return this._reversePixels ? 1 - decimal : decimal;
    },
    getBasePixel: function () {
      return this.getPixelForValue(this.getBaseValue());
    },
    getBaseValue: function () {
      var me = this;
      var min = me.min;
      var max = me.max;
      return me.beginAtZero ? 0 : min < 0 && max < 0 ? max : min > 0 && max > 0 ? min : 0;
    },
    _autoSkip: function (ticks) {
      var me = this;
      var tickOpts = me.options.ticks;
      var axisLength = me._length;
      var ticksLimit = tickOpts.maxTicksLimit || axisLength / me._tickSize() + 1;
      var majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
      var numMajorIndices = majorIndices.length;
      var first = majorIndices[0];
      var last = majorIndices[numMajorIndices - 1];
      var i, ilen, spacing, avgMajorSpacing;
      if (numMajorIndices > ticksLimit) {
        skipMajors(ticks, majorIndices, numMajorIndices / ticksLimit);
        return nonSkipped(ticks);
      }
      spacing = calculateSpacing(majorIndices, ticks, axisLength, ticksLimit);
      if (numMajorIndices > 0) {
        for ((i = 0, ilen = numMajorIndices - 1); i < ilen; i++) {
          skip(ticks, spacing, majorIndices[i], majorIndices[i + 1]);
        }
        avgMajorSpacing = numMajorIndices > 1 ? (last - first) / (numMajorIndices - 1) : null;
        skip(ticks, spacing, helpers$1.isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
        skip(ticks, spacing, last, helpers$1.isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
        return nonSkipped(ticks);
      }
      skip(ticks, spacing);
      return nonSkipped(ticks);
    },
    _tickSize: function () {
      var me = this;
      var optionTicks = me.options.ticks;
      var rot = helpers$1.toRadians(me.labelRotation);
      var cos = Math.abs(Math.cos(rot));
      var sin = Math.abs(Math.sin(rot));
      var labelSizes = me._getLabelSizes();
      var padding = optionTicks.autoSkipPadding || 0;
      var w = labelSizes ? labelSizes.widest.width + padding : 0;
      var h = labelSizes ? labelSizes.highest.height + padding : 0;
      return me.isHorizontal() ? h * cos > w * sin ? w / cos : h / sin : h * sin < w * cos ? h / cos : w / sin;
    },
    _isVisible: function () {
      var me = this;
      var chart = me.chart;
      var display = me.options.display;
      var i, ilen, meta;
      if (display !== 'auto') {
        return !!display;
      }
      for ((i = 0, ilen = chart.data.datasets.length); i < ilen; ++i) {
        if (chart.isDatasetVisible(i)) {
          meta = chart.getDatasetMeta(i);
          if (meta.xAxisID === me.id || meta.yAxisID === me.id) {
            return true;
          }
        }
      }
      return false;
    },
    _computeGridLineItems: function (chartArea) {
      var me = this;
      var chart = me.chart;
      var options = me.options;
      var gridLines = options.gridLines;
      var position = options.position;
      var offsetGridLines = gridLines.offsetGridLines;
      var isHorizontal = me.isHorizontal();
      var ticks = me._ticksToDraw;
      var ticksLength = ticks.length + (offsetGridLines ? 1 : 0);
      var tl = getTickMarkLength(gridLines);
      var items = [];
      var axisWidth = gridLines.drawBorder ? valueAtIndexOrDefault(gridLines.lineWidth, 0, 0) : 0;
      var axisHalfWidth = axisWidth / 2;
      var alignPixel = helpers$1._alignPixel;
      var alignBorderValue = function (pixel) {
        return alignPixel(chart, pixel, axisWidth);
      };
      var borderValue, i, tick, lineValue, alignedLineValue;
      var tx1, ty1, tx2, ty2, x1, y1, x2, y2, lineWidth, lineColor, borderDash, borderDashOffset;
      if (position === 'top') {
        borderValue = alignBorderValue(me.bottom);
        ty1 = me.bottom - tl;
        ty2 = borderValue - axisHalfWidth;
        y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
        y2 = chartArea.bottom;
      } else if (position === 'bottom') {
        borderValue = alignBorderValue(me.top);
        y1 = chartArea.top;
        y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
        ty1 = borderValue + axisHalfWidth;
        ty2 = me.top + tl;
      } else if (position === 'left') {
        borderValue = alignBorderValue(me.right);
        tx1 = me.right - tl;
        tx2 = borderValue - axisHalfWidth;
        x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
        x2 = chartArea.right;
      } else {
        borderValue = alignBorderValue(me.left);
        x1 = chartArea.left;
        x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
        tx1 = borderValue + axisHalfWidth;
        tx2 = me.left + tl;
      }
      for (i = 0; i < ticksLength; ++i) {
        tick = ticks[i] || ({});
        if (isNullOrUndef(tick.label) && i < ticks.length) {
          continue;
        }
        if (i === me.zeroLineIndex && options.offset === offsetGridLines) {
          lineWidth = gridLines.zeroLineWidth;
          lineColor = gridLines.zeroLineColor;
          borderDash = gridLines.zeroLineBorderDash || [];
          borderDashOffset = gridLines.zeroLineBorderDashOffset || 0.0;
        } else {
          lineWidth = valueAtIndexOrDefault(gridLines.lineWidth, i, 1);
          lineColor = valueAtIndexOrDefault(gridLines.color, i, 'rgba(0,0,0,0.1)');
          borderDash = gridLines.borderDash || [];
          borderDashOffset = gridLines.borderDashOffset || 0.0;
        }
        lineValue = getPixelForGridLine(me, tick._index || i, offsetGridLines);
        if (lineValue === undefined) {
          continue;
        }
        alignedLineValue = alignPixel(chart, lineValue, lineWidth);
        if (isHorizontal) {
          tx1 = tx2 = x1 = x2 = alignedLineValue;
        } else {
          ty1 = ty2 = y1 = y2 = alignedLineValue;
        }
        items.push({
          tx1: tx1,
          ty1: ty1,
          tx2: tx2,
          ty2: ty2,
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2,
          width: lineWidth,
          color: lineColor,
          borderDash: borderDash,
          borderDashOffset: borderDashOffset
        });
      }
      items.ticksLength = ticksLength;
      items.borderValue = borderValue;
      return items;
    },
    _computeLabelItems: function () {
      var me = this;
      var options = me.options;
      var optionTicks = options.ticks;
      var position = options.position;
      var isMirrored = optionTicks.mirror;
      var isHorizontal = me.isHorizontal();
      var ticks = me._ticksToDraw;
      var fonts = parseTickFontOptions(optionTicks);
      var tickPadding = optionTicks.padding;
      var tl = getTickMarkLength(options.gridLines);
      var rotation = -helpers$1.toRadians(me.labelRotation);
      var items = [];
      var i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
      if (position === 'top') {
        y = me.bottom - tl - tickPadding;
        textAlign = !rotation ? 'center' : 'left';
      } else if (position === 'bottom') {
        y = me.top + tl + tickPadding;
        textAlign = !rotation ? 'center' : 'right';
      } else if (position === 'left') {
        x = me.right - (isMirrored ? 0 : tl) - tickPadding;
        textAlign = isMirrored ? 'left' : 'right';
      } else {
        x = me.left + (isMirrored ? 0 : tl) + tickPadding;
        textAlign = isMirrored ? 'right' : 'left';
      }
      for ((i = 0, ilen = ticks.length); i < ilen; ++i) {
        tick = ticks[i];
        label = tick.label;
        if (isNullOrUndef(label)) {
          continue;
        }
        pixel = me.getPixelForTick(tick._index || i) + optionTicks.labelOffset;
        font = tick.major ? fonts.major : fonts.minor;
        lineHeight = font.lineHeight;
        lineCount = isArray(label) ? label.length : 1;
        if (isHorizontal) {
          x = pixel;
          textOffset = position === 'top' ? ((!rotation ? 0.5 : 1) - lineCount) * lineHeight : (!rotation ? 0.5 : 0) * lineHeight;
        } else {
          y = pixel;
          textOffset = (1 - lineCount) * lineHeight / 2;
        }
        items.push({
          x: x,
          y: y,
          rotation: rotation,
          label: label,
          font: font,
          textOffset: textOffset,
          textAlign: textAlign
        });
      }
      return items;
    },
    _drawGrid: function (chartArea) {
      var me = this;
      var gridLines = me.options.gridLines;
      if (!gridLines.display) {
        return;
      }
      var ctx = me.ctx;
      var chart = me.chart;
      var alignPixel = helpers$1._alignPixel;
      var axisWidth = gridLines.drawBorder ? valueAtIndexOrDefault(gridLines.lineWidth, 0, 0) : 0;
      var items = me._gridLineItems || (me._gridLineItems = me._computeGridLineItems(chartArea));
      var width, color, i, ilen, item;
      for ((i = 0, ilen = items.length); i < ilen; ++i) {
        item = items[i];
        width = item.width;
        color = item.color;
        if (width && color) {
          ctx.save();
          ctx.lineWidth = width;
          ctx.strokeStyle = color;
          if (ctx.setLineDash) {
            ctx.setLineDash(item.borderDash);
            ctx.lineDashOffset = item.borderDashOffset;
          }
          ctx.beginPath();
          if (gridLines.drawTicks) {
            ctx.moveTo(item.tx1, item.ty1);
            ctx.lineTo(item.tx2, item.ty2);
          }
          if (gridLines.drawOnChartArea) {
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(item.x2, item.y2);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
      if (axisWidth) {
        var firstLineWidth = axisWidth;
        var lastLineWidth = valueAtIndexOrDefault(gridLines.lineWidth, items.ticksLength - 1, 1);
        var borderValue = items.borderValue;
        var x1, x2, y1, y2;
        if (me.isHorizontal()) {
          x1 = alignPixel(chart, me.left, firstLineWidth) - firstLineWidth / 2;
          x2 = alignPixel(chart, me.right, lastLineWidth) + lastLineWidth / 2;
          y1 = y2 = borderValue;
        } else {
          y1 = alignPixel(chart, me.top, firstLineWidth) - firstLineWidth / 2;
          y2 = alignPixel(chart, me.bottom, lastLineWidth) + lastLineWidth / 2;
          x1 = x2 = borderValue;
        }
        ctx.lineWidth = axisWidth;
        ctx.strokeStyle = valueAtIndexOrDefault(gridLines.color, 0);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    },
    _drawLabels: function () {
      var me = this;
      var optionTicks = me.options.ticks;
      if (!optionTicks.display) {
        return;
      }
      var ctx = me.ctx;
      var items = me._labelItems || (me._labelItems = me._computeLabelItems());
      var i, j, ilen, jlen, item, tickFont, label, y;
      for ((i = 0, ilen = items.length); i < ilen; ++i) {
        item = items[i];
        tickFont = item.font;
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.font = tickFont.string;
        ctx.fillStyle = tickFont.color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = item.textAlign;
        label = item.label;
        y = item.textOffset;
        if (isArray(label)) {
          for ((j = 0, jlen = label.length); j < jlen; ++j) {
            ctx.fillText('' + label[j], 0, y);
            y += tickFont.lineHeight;
          }
        } else {
          ctx.fillText(label, 0, y);
        }
        ctx.restore();
      }
    },
    _drawTitle: function () {
      var me = this;
      var ctx = me.ctx;
      var options = me.options;
      var scaleLabel = options.scaleLabel;
      if (!scaleLabel.display) {
        return;
      }
      var scaleLabelFontColor = valueOrDefault$a(scaleLabel.fontColor, core_defaults.global.defaultFontColor);
      var scaleLabelFont = helpers$1.options._parseFont(scaleLabel);
      var scaleLabelPadding = helpers$1.options.toPadding(scaleLabel.padding);
      var halfLineHeight = scaleLabelFont.lineHeight / 2;
      var position = options.position;
      var rotation = 0;
      var scaleLabelX, scaleLabelY;
      if (me.isHorizontal()) {
        scaleLabelX = me.left + me.width / 2;
        scaleLabelY = position === 'bottom' ? me.bottom - halfLineHeight - scaleLabelPadding.bottom : me.top + halfLineHeight + scaleLabelPadding.top;
      } else {
        var isLeft = position === 'left';
        scaleLabelX = isLeft ? me.left + halfLineHeight + scaleLabelPadding.top : me.right - halfLineHeight - scaleLabelPadding.top;
        scaleLabelY = me.top + me.height / 2;
        rotation = isLeft ? -0.5 * Math.PI : 0.5 * Math.PI;
      }
      ctx.save();
      ctx.translate(scaleLabelX, scaleLabelY);
      ctx.rotate(rotation);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = scaleLabelFontColor;
      ctx.font = scaleLabelFont.string;
      ctx.fillText(scaleLabel.labelString, 0, 0);
      ctx.restore();
    },
    draw: function (chartArea) {
      var me = this;
      if (!me._isVisible()) {
        return;
      }
      me._drawGrid(chartArea);
      me._drawTitle();
      me._drawLabels();
    },
    _layers: function () {
      var me = this;
      var opts = me.options;
      var tz = opts.ticks && opts.ticks.z || 0;
      var gz = opts.gridLines && opts.gridLines.z || 0;
      if (!me._isVisible() || tz === gz || me.draw !== me._draw) {
        return [{
          z: tz,
          draw: function () {
            me.draw.apply(me, arguments);
          }
        }];
      }
      return [{
        z: gz,
        draw: function () {
          me._drawGrid.apply(me, arguments);
          me._drawTitle.apply(me, arguments);
        }
      }, {
        z: tz,
        draw: function () {
          me._drawLabels.apply(me, arguments);
        }
      }];
    },
    _getMatchingVisibleMetas: function (type) {
      var me = this;
      var isHorizontal = me.isHorizontal();
      return me.chart._getSortedVisibleDatasetMetas().filter(function (meta) {
        return (!type || meta.type === type) && (isHorizontal ? meta.xAxisID === me.id : meta.yAxisID === me.id);
      });
    }
  });
  Scale.prototype._draw = Scale.prototype.draw;
  var core_scale = Scale;
  var isNullOrUndef$1 = helpers$1.isNullOrUndef;
  var defaultConfig = {
    position: 'bottom'
  };
  var scale_category = core_scale.extend({
    determineDataLimits: function () {
      var me = this;
      var labels = me._getLabels();
      var ticksOpts = me.options.ticks;
      var min = ticksOpts.min;
      var max = ticksOpts.max;
      var minIndex = 0;
      var maxIndex = labels.length - 1;
      var findIndex;
      if (min !== undefined) {
        findIndex = labels.indexOf(min);
        if (findIndex >= 0) {
          minIndex = findIndex;
        }
      }
      if (max !== undefined) {
        findIndex = labels.indexOf(max);
        if (findIndex >= 0) {
          maxIndex = findIndex;
        }
      }
      me.minIndex = minIndex;
      me.maxIndex = maxIndex;
      me.min = labels[minIndex];
      me.max = labels[maxIndex];
    },
    buildTicks: function () {
      var me = this;
      var labels = me._getLabels();
      var minIndex = me.minIndex;
      var maxIndex = me.maxIndex;
      me.ticks = minIndex === 0 && maxIndex === labels.length - 1 ? labels : labels.slice(minIndex, maxIndex + 1);
    },
    getLabelForIndex: function (index, datasetIndex) {
      var me = this;
      var chart = me.chart;
      if (chart.getDatasetMeta(datasetIndex).controller._getValueScaleId() === me.id) {
        return me.getRightValue(chart.data.datasets[datasetIndex].data[index]);
      }
      return me._getLabels()[index];
    },
    _configure: function () {
      var me = this;
      var offset = me.options.offset;
      var ticks = me.ticks;
      core_scale.prototype._configure.call(me);
      if (!me.isHorizontal()) {
        me._reversePixels = !me._reversePixels;
      }
      if (!ticks) {
        return;
      }
      me._startValue = me.minIndex - (offset ? 0.5 : 0);
      me._valueRange = Math.max(ticks.length - (offset ? 0 : 1), 1);
    },
    getPixelForValue: function (value, index, datasetIndex) {
      var me = this;
      var valueCategory, labels, idx;
      if (!isNullOrUndef$1(index) && !isNullOrUndef$1(datasetIndex)) {
        value = me.chart.data.datasets[datasetIndex].data[index];
      }
      if (!isNullOrUndef$1(value)) {
        valueCategory = me.isHorizontal() ? value.x : value.y;
      }
      if (valueCategory !== undefined || value !== undefined && isNaN(index)) {
        labels = me._getLabels();
        value = helpers$1.valueOrDefault(valueCategory, value);
        idx = labels.indexOf(value);
        index = idx !== -1 ? idx : index;
        if (isNaN(index)) {
          index = value;
        }
      }
      return me.getPixelForDecimal((index - me._startValue) / me._valueRange);
    },
    getPixelForTick: function (index) {
      var ticks = this.ticks;
      return index < 0 || index > ticks.length - 1 ? null : this.getPixelForValue(ticks[index], index + this.minIndex);
    },
    getValueForPixel: function (pixel) {
      var me = this;
      var value = Math.round(me._startValue + me.getDecimalForPixel(pixel) * me._valueRange);
      return Math.min(Math.max(value, 0), me.ticks.length - 1);
    },
    getBasePixel: function () {
      return this.bottom;
    }
  });
  var _defaults = defaultConfig;
  scale_category._defaults = _defaults;
  var noop = helpers$1.noop;
  var isNullOrUndef$2 = helpers$1.isNullOrUndef;
  function generateTicks(generationOptions, dataRange) {
    var ticks = [];
    var MIN_SPACING = 1e-14;
    var stepSize = generationOptions.stepSize;
    var unit = stepSize || 1;
    var maxNumSpaces = generationOptions.maxTicks - 1;
    var min = generationOptions.min;
    var max = generationOptions.max;
    var precision = generationOptions.precision;
    var rmin = dataRange.min;
    var rmax = dataRange.max;
    var spacing = helpers$1.niceNum((rmax - rmin) / maxNumSpaces / unit) * unit;
    var factor, niceMin, niceMax, numSpaces;
    if (spacing < MIN_SPACING && isNullOrUndef$2(min) && isNullOrUndef$2(max)) {
      return [rmin, rmax];
    }
    numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
    if (numSpaces > maxNumSpaces) {
      spacing = helpers$1.niceNum(numSpaces * spacing / maxNumSpaces / unit) * unit;
    }
    if (stepSize || isNullOrUndef$2(precision)) {
      factor = Math.pow(10, helpers$1._decimalPlaces(spacing));
    } else {
      factor = Math.pow(10, precision);
      spacing = Math.ceil(spacing * factor) / factor;
    }
    niceMin = Math.floor(rmin / spacing) * spacing;
    niceMax = Math.ceil(rmax / spacing) * spacing;
    if (stepSize) {
      if (!isNullOrUndef$2(min) && helpers$1.almostWhole(min / spacing, spacing / 1000)) {
        niceMin = min;
      }
      if (!isNullOrUndef$2(max) && helpers$1.almostWhole(max / spacing, spacing / 1000)) {
        niceMax = max;
      }
    }
    numSpaces = (niceMax - niceMin) / spacing;
    if (helpers$1.almostEquals(numSpaces, Math.round(numSpaces), spacing / 1000)) {
      numSpaces = Math.round(numSpaces);
    } else {
      numSpaces = Math.ceil(numSpaces);
    }
    niceMin = Math.round(niceMin * factor) / factor;
    niceMax = Math.round(niceMax * factor) / factor;
    ticks.push(isNullOrUndef$2(min) ? niceMin : min);
    for (var j = 1; j < numSpaces; ++j) {
      ticks.push(Math.round((niceMin + j * spacing) * factor) / factor);
    }
    ticks.push(isNullOrUndef$2(max) ? niceMax : max);
    return ticks;
  }
  var scale_linearbase = core_scale.extend({
    getRightValue: function (value) {
      if (typeof value === 'string') {
        return +value;
      }
      return core_scale.prototype.getRightValue.call(this, value);
    },
    handleTickRangeOptions: function () {
      var me = this;
      var opts = me.options;
      var tickOpts = opts.ticks;
      if (tickOpts.beginAtZero) {
        var minSign = helpers$1.sign(me.min);
        var maxSign = helpers$1.sign(me.max);
        if (minSign < 0 && maxSign < 0) {
          me.max = 0;
        } else if (minSign > 0 && maxSign > 0) {
          me.min = 0;
        }
      }
      var setMin = tickOpts.min !== undefined || tickOpts.suggestedMin !== undefined;
      var setMax = tickOpts.max !== undefined || tickOpts.suggestedMax !== undefined;
      if (tickOpts.min !== undefined) {
        me.min = tickOpts.min;
      } else if (tickOpts.suggestedMin !== undefined) {
        if (me.min === null) {
          me.min = tickOpts.suggestedMin;
        } else {
          me.min = Math.min(me.min, tickOpts.suggestedMin);
        }
      }
      if (tickOpts.max !== undefined) {
        me.max = tickOpts.max;
      } else if (tickOpts.suggestedMax !== undefined) {
        if (me.max === null) {
          me.max = tickOpts.suggestedMax;
        } else {
          me.max = Math.max(me.max, tickOpts.suggestedMax);
        }
      }
      if (setMin !== setMax) {
        if (me.min >= me.max) {
          if (setMin) {
            me.max = me.min + 1;
          } else {
            me.min = me.max - 1;
          }
        }
      }
      if (me.min === me.max) {
        me.max++;
        if (!tickOpts.beginAtZero) {
          me.min--;
        }
      }
    },
    getTickLimit: function () {
      var me = this;
      var tickOpts = me.options.ticks;
      var stepSize = tickOpts.stepSize;
      var maxTicksLimit = tickOpts.maxTicksLimit;
      var maxTicks;
      if (stepSize) {
        maxTicks = Math.ceil(me.max / stepSize) - Math.floor(me.min / stepSize) + 1;
      } else {
        maxTicks = me._computeTickLimit();
        maxTicksLimit = maxTicksLimit || 11;
      }
      if (maxTicksLimit) {
        maxTicks = Math.min(maxTicksLimit, maxTicks);
      }
      return maxTicks;
    },
    _computeTickLimit: function () {
      return Number.POSITIVE_INFINITY;
    },
    handleDirectionalChanges: noop,
    buildTicks: function () {
      var me = this;
      var opts = me.options;
      var tickOpts = opts.ticks;
      var maxTicks = me.getTickLimit();
      maxTicks = Math.max(2, maxTicks);
      var numericGeneratorOptions = {
        maxTicks: maxTicks,
        min: tickOpts.min,
        max: tickOpts.max,
        precision: tickOpts.precision,
        stepSize: helpers$1.valueOrDefault(tickOpts.fixedStepSize, tickOpts.stepSize)
      };
      var ticks = me.ticks = generateTicks(numericGeneratorOptions, me);
      me.handleDirectionalChanges();
      me.max = helpers$1.max(ticks);
      me.min = helpers$1.min(ticks);
      if (tickOpts.reverse) {
        ticks.reverse();
        me.start = me.max;
        me.end = me.min;
      } else {
        me.start = me.min;
        me.end = me.max;
      }
    },
    convertTicksToLabels: function () {
      var me = this;
      me.ticksAsNumbers = me.ticks.slice();
      me.zeroLineIndex = me.ticks.indexOf(0);
      core_scale.prototype.convertTicksToLabels.call(me);
    },
    _configure: function () {
      var me = this;
      var ticks = me.getTicks();
      var start = me.min;
      var end = me.max;
      var offset;
      core_scale.prototype._configure.call(me);
      if (me.options.offset && ticks.length) {
        offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
        start -= offset;
        end += offset;
      }
      me._startValue = start;
      me._endValue = end;
      me._valueRange = end - start;
    }
  });
  var defaultConfig$1 = {
    position: 'left',
    ticks: {
      callback: core_ticks.formatters.linear
    }
  };
  var DEFAULT_MIN = 0;
  var DEFAULT_MAX = 1;
  function getOrCreateStack(stacks, stacked, meta) {
    var key = [meta.type, stacked === undefined && meta.stack === undefined ? meta.index : '', meta.stack].join('.');
    if (stacks[key] === undefined) {
      stacks[key] = {
        pos: [],
        neg: []
      };
    }
    return stacks[key];
  }
  function stackData(scale, stacks, meta, data) {
    var opts = scale.options;
    var stacked = opts.stacked;
    var stack = getOrCreateStack(stacks, stacked, meta);
    var pos = stack.pos;
    var neg = stack.neg;
    var ilen = data.length;
    var i, value;
    for (i = 0; i < ilen; ++i) {
      value = scale._parseValue(data[i]);
      if (isNaN(value.min) || isNaN(value.max) || meta.data[i].hidden) {
        continue;
      }
      pos[i] = pos[i] || 0;
      neg[i] = neg[i] || 0;
      if (opts.relativePoints) {
        pos[i] = 100;
      } else if (value.min < 0 || value.max < 0) {
        neg[i] += value.min;
      } else {
        pos[i] += value.max;
      }
    }
  }
  function updateMinMax(scale, meta, data) {
    var ilen = data.length;
    var i, value;
    for (i = 0; i < ilen; ++i) {
      value = scale._parseValue(data[i]);
      if (isNaN(value.min) || isNaN(value.max) || meta.data[i].hidden) {
        continue;
      }
      scale.min = Math.min(scale.min, value.min);
      scale.max = Math.max(scale.max, value.max);
    }
  }
  var scale_linear = scale_linearbase.extend({
    determineDataLimits: function () {
      var me = this;
      var opts = me.options;
      var chart = me.chart;
      var datasets = chart.data.datasets;
      var metasets = me._getMatchingVisibleMetas();
      var hasStacks = opts.stacked;
      var stacks = {};
      var ilen = metasets.length;
      var i, meta, data, values;
      me.min = Number.POSITIVE_INFINITY;
      me.max = Number.NEGATIVE_INFINITY;
      if (hasStacks === undefined) {
        for (i = 0; !hasStacks && i < ilen; ++i) {
          meta = metasets[i];
          hasStacks = meta.stack !== undefined;
        }
      }
      for (i = 0; i < ilen; ++i) {
        meta = metasets[i];
        data = datasets[meta.index].data;
        if (hasStacks) {
          stackData(me, stacks, meta, data);
        } else {
          updateMinMax(me, meta, data);
        }
      }
      helpers$1.each(stacks, function (stackValues) {
        values = stackValues.pos.concat(stackValues.neg);
        me.min = Math.min(me.min, helpers$1.min(values));
        me.max = Math.max(me.max, helpers$1.max(values));
      });
      me.min = helpers$1.isFinite(me.min) && !isNaN(me.min) ? me.min : DEFAULT_MIN;
      me.max = helpers$1.isFinite(me.max) && !isNaN(me.max) ? me.max : DEFAULT_MAX;
      me.handleTickRangeOptions();
    },
    _computeTickLimit: function () {
      var me = this;
      var tickFont;
      if (me.isHorizontal()) {
        return Math.ceil(me.width / 40);
      }
      tickFont = helpers$1.options._parseFont(me.options.ticks);
      return Math.ceil(me.height / tickFont.lineHeight);
    },
    handleDirectionalChanges: function () {
      if (!this.isHorizontal()) {
        this.ticks.reverse();
      }
    },
    getLabelForIndex: function (index, datasetIndex) {
      return this._getScaleLabel(this.chart.data.datasets[datasetIndex].data[index]);
    },
    getPixelForValue: function (value) {
      var me = this;
      return me.getPixelForDecimal((+me.getRightValue(value) - me._startValue) / me._valueRange);
    },
    getValueForPixel: function (pixel) {
      return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
    },
    getPixelForTick: function (index) {
      var ticks = this.ticksAsNumbers;
      if (index < 0 || index > ticks.length - 1) {
        return null;
      }
      return this.getPixelForValue(ticks[index]);
    }
  });
  var _defaults$1 = defaultConfig$1;
  scale_linear._defaults = _defaults$1;
  var valueOrDefault$b = helpers$1.valueOrDefault;
  var log10 = helpers$1.math.log10;
  function generateTicks$1(generationOptions, dataRange) {
    var ticks = [];
    var tickVal = valueOrDefault$b(generationOptions.min, Math.pow(10, Math.floor(log10(dataRange.min))));
    var endExp = Math.floor(log10(dataRange.max));
    var endSignificand = Math.ceil(dataRange.max / Math.pow(10, endExp));
    var exp, significand;
    if (tickVal === 0) {
      exp = Math.floor(log10(dataRange.minNotZero));
      significand = Math.floor(dataRange.minNotZero / Math.pow(10, exp));
      ticks.push(tickVal);
      tickVal = significand * Math.pow(10, exp);
    } else {
      exp = Math.floor(log10(tickVal));
      significand = Math.floor(tickVal / Math.pow(10, exp));
    }
    var precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
    do {
      ticks.push(tickVal);
      ++significand;
      if (significand === 10) {
        significand = 1;
        ++exp;
        precision = exp >= 0 ? 1 : precision;
      }
      tickVal = Math.round(significand * Math.pow(10, exp) * precision) / precision;
    } while (exp < endExp || exp === endExp && significand < endSignificand);
    var lastTick = valueOrDefault$b(generationOptions.max, tickVal);
    ticks.push(lastTick);
    return ticks;
  }
  var defaultConfig$2 = {
    position: 'left',
    ticks: {
      callback: core_ticks.formatters.logarithmic
    }
  };
  function nonNegativeOrDefault(value, defaultValue) {
    return helpers$1.isFinite(value) && value >= 0 ? value : defaultValue;
  }
  var scale_logarithmic = core_scale.extend({
    determineDataLimits: function () {
      var me = this;
      var opts = me.options;
      var chart = me.chart;
      var datasets = chart.data.datasets;
      var isHorizontal = me.isHorizontal();
      function IDMatches(meta) {
        return isHorizontal ? meta.xAxisID === me.id : meta.yAxisID === me.id;
      }
      var datasetIndex, meta, value, data, i, ilen;
      me.min = Number.POSITIVE_INFINITY;
      me.max = Number.NEGATIVE_INFINITY;
      me.minNotZero = Number.POSITIVE_INFINITY;
      var hasStacks = opts.stacked;
      if (hasStacks === undefined) {
        for (datasetIndex = 0; datasetIndex < datasets.length; datasetIndex++) {
          meta = chart.getDatasetMeta(datasetIndex);
          if (chart.isDatasetVisible(datasetIndex) && IDMatches(meta) && meta.stack !== undefined) {
            hasStacks = true;
            break;
          }
        }
      }
      if (opts.stacked || hasStacks) {
        var valuesPerStack = {};
        for (datasetIndex = 0; datasetIndex < datasets.length; datasetIndex++) {
          meta = chart.getDatasetMeta(datasetIndex);
          var key = [meta.type, opts.stacked === undefined && meta.stack === undefined ? datasetIndex : '', meta.stack].join('.');
          if (chart.isDatasetVisible(datasetIndex) && IDMatches(meta)) {
            if (valuesPerStack[key] === undefined) {
              valuesPerStack[key] = [];
            }
            data = datasets[datasetIndex].data;
            for ((i = 0, ilen = data.length); i < ilen; i++) {
              var values = valuesPerStack[key];
              value = me._parseValue(data[i]);
              if (isNaN(value.min) || isNaN(value.max) || meta.data[i].hidden || value.min < 0 || value.max < 0) {
                continue;
              }
              values[i] = values[i] || 0;
              values[i] += value.max;
            }
          }
        }
        helpers$1.each(valuesPerStack, function (valuesForType) {
          if (valuesForType.length > 0) {
            var minVal = helpers$1.min(valuesForType);
            var maxVal = helpers$1.max(valuesForType);
            me.min = Math.min(me.min, minVal);
            me.max = Math.max(me.max, maxVal);
          }
        });
      } else {
        for (datasetIndex = 0; datasetIndex < datasets.length; datasetIndex++) {
          meta = chart.getDatasetMeta(datasetIndex);
          if (chart.isDatasetVisible(datasetIndex) && IDMatches(meta)) {
            data = datasets[datasetIndex].data;
            for ((i = 0, ilen = data.length); i < ilen; i++) {
              value = me._parseValue(data[i]);
              if (isNaN(value.min) || isNaN(value.max) || meta.data[i].hidden || value.min < 0 || value.max < 0) {
                continue;
              }
              me.min = Math.min(value.min, me.min);
              me.max = Math.max(value.max, me.max);
              if (value.min !== 0) {
                me.minNotZero = Math.min(value.min, me.minNotZero);
              }
            }
          }
        }
      }
      me.min = helpers$1.isFinite(me.min) ? me.min : null;
      me.max = helpers$1.isFinite(me.max) ? me.max : null;
      me.minNotZero = helpers$1.isFinite(me.minNotZero) ? me.minNotZero : null;
      this.handleTickRangeOptions();
    },
    handleTickRangeOptions: function () {
      var me = this;
      var tickOpts = me.options.ticks;
      var DEFAULT_MIN = 1;
      var DEFAULT_MAX = 10;
      me.min = nonNegativeOrDefault(tickOpts.min, me.min);
      me.max = nonNegativeOrDefault(tickOpts.max, me.max);
      if (me.min === me.max) {
        if (me.min !== 0 && me.min !== null) {
          me.min = Math.pow(10, Math.floor(log10(me.min)) - 1);
          me.max = Math.pow(10, Math.floor(log10(me.max)) + 1);
        } else {
          me.min = DEFAULT_MIN;
          me.max = DEFAULT_MAX;
        }
      }
      if (me.min === null) {
        me.min = Math.pow(10, Math.floor(log10(me.max)) - 1);
      }
      if (me.max === null) {
        me.max = me.min !== 0 ? Math.pow(10, Math.floor(log10(me.min)) + 1) : DEFAULT_MAX;
      }
      if (me.minNotZero === null) {
        if (me.min > 0) {
          me.minNotZero = me.min;
        } else if (me.max < 1) {
          me.minNotZero = Math.pow(10, Math.floor(log10(me.max)));
        } else {
          me.minNotZero = DEFAULT_MIN;
        }
      }
    },
    buildTicks: function () {
      var me = this;
      var tickOpts = me.options.ticks;
      var reverse = !me.isHorizontal();
      var generationOptions = {
        min: nonNegativeOrDefault(tickOpts.min),
        max: nonNegativeOrDefault(tickOpts.max)
      };
      var ticks = me.ticks = generateTicks$1(generationOptions, me);
      me.max = helpers$1.max(ticks);
      me.min = helpers$1.min(ticks);
      if (tickOpts.reverse) {
        reverse = !reverse;
        me.start = me.max;
        me.end = me.min;
      } else {
        me.start = me.min;
        me.end = me.max;
      }
      if (reverse) {
        ticks.reverse();
      }
    },
    convertTicksToLabels: function () {
      this.tickValues = this.ticks.slice();
      core_scale.prototype.convertTicksToLabels.call(this);
    },
    getLabelForIndex: function (index, datasetIndex) {
      return this._getScaleLabel(this.chart.data.datasets[datasetIndex].data[index]);
    },
    getPixelForTick: function (index) {
      var ticks = this.tickValues;
      if (index < 0 || index > ticks.length - 1) {
        return null;
      }
      return this.getPixelForValue(ticks[index]);
    },
    _getFirstTickValue: function (value) {
      var exp = Math.floor(log10(value));
      var significand = Math.floor(value / Math.pow(10, exp));
      return significand * Math.pow(10, exp);
    },
    _configure: function () {
      var me = this;
      var start = me.min;
      var offset = 0;
      core_scale.prototype._configure.call(me);
      if (start === 0) {
        start = me._getFirstTickValue(me.minNotZero);
        offset = valueOrDefault$b(me.options.ticks.fontSize, core_defaults.global.defaultFontSize) / me._length;
      }
      me._startValue = log10(start);
      me._valueOffset = offset;
      me._valueRange = (log10(me.max) - log10(start)) / (1 - offset);
    },
    getPixelForValue: function (value) {
      var me = this;
      var decimal = 0;
      value = +me.getRightValue(value);
      if (value > me.min && value > 0) {
        decimal = (log10(value) - me._startValue) / me._valueRange + me._valueOffset;
      }
      return me.getPixelForDecimal(decimal);
    },
    getValueForPixel: function (pixel) {
      var me = this;
      var decimal = me.getDecimalForPixel(pixel);
      return decimal === 0 && me.min === 0 ? 0 : Math.pow(10, me._startValue + (decimal - me._valueOffset) * me._valueRange);
    }
  });
  var _defaults$2 = defaultConfig$2;
  scale_logarithmic._defaults = _defaults$2;
  var valueOrDefault$c = helpers$1.valueOrDefault;
  var valueAtIndexOrDefault$1 = helpers$1.valueAtIndexOrDefault;
  var resolve$4 = helpers$1.options.resolve;
  var defaultConfig$3 = {
    display: true,
    animate: true,
    position: 'chartArea',
    angleLines: {
      display: true,
      color: 'rgba(0,0,0,0.1)',
      lineWidth: 1,
      borderDash: [],
      borderDashOffset: 0.0
    },
    gridLines: {
      circular: false
    },
    ticks: {
      showLabelBackdrop: true,
      backdropColor: 'rgba(255,255,255,0.75)',
      backdropPaddingY: 2,
      backdropPaddingX: 2,
      callback: core_ticks.formatters.linear
    },
    pointLabels: {
      display: true,
      fontSize: 10,
      callback: function (label) {
        return label;
      }
    }
  };
  function getTickBackdropHeight(opts) {
    var tickOpts = opts.ticks;
    if (tickOpts.display && opts.display) {
      return valueOrDefault$c(tickOpts.fontSize, core_defaults.global.defaultFontSize) + tickOpts.backdropPaddingY * 2;
    }
    return 0;
  }
  function measureLabelSize(ctx, lineHeight, label) {
    if (helpers$1.isArray(label)) {
      return {
        w: helpers$1.longestText(ctx, ctx.font, label),
        h: label.length * lineHeight
      };
    }
    return {
      w: ctx.measureText(label).width,
      h: lineHeight
    };
  }
  function determineLimits(angle, pos, size, min, max) {
    if (angle === min || angle === max) {
      return {
        start: pos - size / 2,
        end: pos + size / 2
      };
    } else if (angle < min || angle > max) {
      return {
        start: pos - size,
        end: pos
      };
    }
    return {
      start: pos,
      end: pos + size
    };
  }
  function fitWithPointLabels(scale) {
    var plFont = helpers$1.options._parseFont(scale.options.pointLabels);
    var furthestLimits = {
      l: 0,
      r: scale.width,
      t: 0,
      b: scale.height - scale.paddingTop
    };
    var furthestAngles = {};
    var i, textSize, pointPosition;
    scale.ctx.font = plFont.string;
    scale._pointLabelSizes = [];
    var valueCount = scale.chart.data.labels.length;
    for (i = 0; i < valueCount; i++) {
      pointPosition = scale.getPointPosition(i, scale.drawingArea + 5);
      textSize = measureLabelSize(scale.ctx, plFont.lineHeight, scale.pointLabels[i]);
      scale._pointLabelSizes[i] = textSize;
      var angleRadians = scale.getIndexAngle(i);
      var angle = helpers$1.toDegrees(angleRadians) % 360;
      var hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
      var vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
      if (hLimits.start < furthestLimits.l) {
        furthestLimits.l = hLimits.start;
        furthestAngles.l = angleRadians;
      }
      if (hLimits.end > furthestLimits.r) {
        furthestLimits.r = hLimits.end;
        furthestAngles.r = angleRadians;
      }
      if (vLimits.start < furthestLimits.t) {
        furthestLimits.t = vLimits.start;
        furthestAngles.t = angleRadians;
      }
      if (vLimits.end > furthestLimits.b) {
        furthestLimits.b = vLimits.end;
        furthestAngles.b = angleRadians;
      }
    }
    scale.setReductions(scale.drawingArea, furthestLimits, furthestAngles);
  }
  function getTextAlignForAngle(angle) {
    if (angle === 0 || angle === 180) {
      return 'center';
    } else if (angle < 180) {
      return 'left';
    }
    return 'right';
  }
  function fillText(ctx, text, position, lineHeight) {
    var y = position.y + lineHeight / 2;
    var i, ilen;
    if (helpers$1.isArray(text)) {
      for ((i = 0, ilen = text.length); i < ilen; ++i) {
        ctx.fillText(text[i], position.x, y);
        y += lineHeight;
      }
    } else {
      ctx.fillText(text, position.x, y);
    }
  }
  function adjustPointPositionForLabelHeight(angle, textSize, position) {
    if (angle === 90 || angle === 270) {
      position.y -= textSize.h / 2;
    } else if (angle > 270 || angle < 90) {
      position.y -= textSize.h;
    }
  }
  function drawPointLabels(scale) {
    var ctx = scale.ctx;
    var opts = scale.options;
    var pointLabelOpts = opts.pointLabels;
    var tickBackdropHeight = getTickBackdropHeight(opts);
    var outerDistance = scale.getDistanceFromCenterForValue(opts.ticks.reverse ? scale.min : scale.max);
    var plFont = helpers$1.options._parseFont(pointLabelOpts);
    ctx.save();
    ctx.font = plFont.string;
    ctx.textBaseline = 'middle';
    for (var i = scale.chart.data.labels.length - 1; i >= 0; i--) {
      var extra = i === 0 ? tickBackdropHeight / 2 : 0;
      var pointLabelPosition = scale.getPointPosition(i, outerDistance + extra + 5);
      var pointLabelFontColor = valueAtIndexOrDefault$1(pointLabelOpts.fontColor, i, core_defaults.global.defaultFontColor);
      ctx.fillStyle = pointLabelFontColor;
      var angleRadians = scale.getIndexAngle(i);
      var angle = helpers$1.toDegrees(angleRadians);
      ctx.textAlign = getTextAlignForAngle(angle);
      adjustPointPositionForLabelHeight(angle, scale._pointLabelSizes[i], pointLabelPosition);
      fillText(ctx, scale.pointLabels[i], pointLabelPosition, plFont.lineHeight);
    }
    ctx.restore();
  }
  function drawRadiusLine(scale, gridLineOpts, radius, index) {
    var ctx = scale.ctx;
    var circular = gridLineOpts.circular;
    var valueCount = scale.chart.data.labels.length;
    var lineColor = valueAtIndexOrDefault$1(gridLineOpts.color, index - 1);
    var lineWidth = valueAtIndexOrDefault$1(gridLineOpts.lineWidth, index - 1);
    var pointPosition;
    if (!circular && !valueCount || !lineColor || !lineWidth) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    if (ctx.setLineDash) {
      ctx.setLineDash(gridLineOpts.borderDash || []);
      ctx.lineDashOffset = gridLineOpts.borderDashOffset || 0.0;
    }
    ctx.beginPath();
    if (circular) {
      ctx.arc(scale.xCenter, scale.yCenter, radius, 0, Math.PI * 2);
    } else {
      pointPosition = scale.getPointPosition(0, radius);
      ctx.moveTo(pointPosition.x, pointPosition.y);
      for (var i = 1; i < valueCount; i++) {
        pointPosition = scale.getPointPosition(i, radius);
        ctx.lineTo(pointPosition.x, pointPosition.y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function numberOrZero(param) {
    return helpers$1.isNumber(param) ? param : 0;
  }
  var scale_radialLinear = scale_linearbase.extend({
    setDimensions: function () {
      var me = this;
      me.width = me.maxWidth;
      me.height = me.maxHeight;
      me.paddingTop = getTickBackdropHeight(me.options) / 2;
      me.xCenter = Math.floor(me.width / 2);
      me.yCenter = Math.floor((me.height - me.paddingTop) / 2);
      me.drawingArea = Math.min(me.height - me.paddingTop, me.width) / 2;
    },
    determineDataLimits: function () {
      var me = this;
      var chart = me.chart;
      var min = Number.POSITIVE_INFINITY;
      var max = Number.NEGATIVE_INFINITY;
      helpers$1.each(chart.data.datasets, function (dataset, datasetIndex) {
        if (chart.isDatasetVisible(datasetIndex)) {
          var meta = chart.getDatasetMeta(datasetIndex);
          helpers$1.each(dataset.data, function (rawValue, index) {
            var value = +me.getRightValue(rawValue);
            if (isNaN(value) || meta.data[index].hidden) {
              return;
            }
            min = Math.min(value, min);
            max = Math.max(value, max);
          });
        }
      });
      me.min = min === Number.POSITIVE_INFINITY ? 0 : min;
      me.max = max === Number.NEGATIVE_INFINITY ? 0 : max;
      me.handleTickRangeOptions();
    },
    _computeTickLimit: function () {
      return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
    },
    convertTicksToLabels: function () {
      var me = this;
      scale_linearbase.prototype.convertTicksToLabels.call(me);
      me.pointLabels = me.chart.data.labels.map(function () {
        var label = helpers$1.callback(me.options.pointLabels.callback, arguments, me);
        return label || label === 0 ? label : '';
      });
    },
    getLabelForIndex: function (index, datasetIndex) {
      return +this.getRightValue(this.chart.data.datasets[datasetIndex].data[index]);
    },
    fit: function () {
      var me = this;
      var opts = me.options;
      if (opts.display && opts.pointLabels.display) {
        fitWithPointLabels(me);
      } else {
        me.setCenterPoint(0, 0, 0, 0);
      }
    },
    setReductions: function (largestPossibleRadius, furthestLimits, furthestAngles) {
      var me = this;
      var radiusReductionLeft = furthestLimits.l / Math.sin(furthestAngles.l);
      var radiusReductionRight = Math.max(furthestLimits.r - me.width, 0) / Math.sin(furthestAngles.r);
      var radiusReductionTop = -furthestLimits.t / Math.cos(furthestAngles.t);
      var radiusReductionBottom = -Math.max(furthestLimits.b - (me.height - me.paddingTop), 0) / Math.cos(furthestAngles.b);
      radiusReductionLeft = numberOrZero(radiusReductionLeft);
      radiusReductionRight = numberOrZero(radiusReductionRight);
      radiusReductionTop = numberOrZero(radiusReductionTop);
      radiusReductionBottom = numberOrZero(radiusReductionBottom);
      me.drawingArea = Math.min(Math.floor(largestPossibleRadius - (radiusReductionLeft + radiusReductionRight) / 2), Math.floor(largestPossibleRadius - (radiusReductionTop + radiusReductionBottom) / 2));
      me.setCenterPoint(radiusReductionLeft, radiusReductionRight, radiusReductionTop, radiusReductionBottom);
    },
    setCenterPoint: function (leftMovement, rightMovement, topMovement, bottomMovement) {
      var me = this;
      var maxRight = me.width - rightMovement - me.drawingArea;
      var maxLeft = leftMovement + me.drawingArea;
      var maxTop = topMovement + me.drawingArea;
      var maxBottom = me.height - me.paddingTop - bottomMovement - me.drawingArea;
      me.xCenter = Math.floor((maxLeft + maxRight) / 2 + me.left);
      me.yCenter = Math.floor((maxTop + maxBottom) / 2 + me.top + me.paddingTop);
    },
    getIndexAngle: function (index) {
      var chart = this.chart;
      var angleMultiplier = 360 / chart.data.labels.length;
      var options = chart.options || ({});
      var startAngle = options.startAngle || 0;
      var angle = (index * angleMultiplier + startAngle) % 360;
      return (angle < 0 ? angle + 360 : angle) * Math.PI * 2 / 360;
    },
    getDistanceFromCenterForValue: function (value) {
      var me = this;
      if (helpers$1.isNullOrUndef(value)) {
        return NaN;
      }
      var scalingFactor = me.drawingArea / (me.max - me.min);
      if (me.options.ticks.reverse) {
        return (me.max - value) * scalingFactor;
      }
      return (value - me.min) * scalingFactor;
    },
    getPointPosition: function (index, distanceFromCenter) {
      var me = this;
      var thisAngle = me.getIndexAngle(index) - Math.PI / 2;
      return {
        x: Math.cos(thisAngle) * distanceFromCenter + me.xCenter,
        y: Math.sin(thisAngle) * distanceFromCenter + me.yCenter
      };
    },
    getPointPositionForValue: function (index, value) {
      return this.getPointPosition(index, this.getDistanceFromCenterForValue(value));
    },
    getBasePosition: function (index) {
      var me = this;
      var min = me.min;
      var max = me.max;
      return me.getPointPositionForValue(index || 0, me.beginAtZero ? 0 : min < 0 && max < 0 ? max : min > 0 && max > 0 ? min : 0);
    },
    _drawGrid: function () {
      var me = this;
      var ctx = me.ctx;
      var opts = me.options;
      var gridLineOpts = opts.gridLines;
      var angleLineOpts = opts.angleLines;
      var lineWidth = valueOrDefault$c(angleLineOpts.lineWidth, gridLineOpts.lineWidth);
      var lineColor = valueOrDefault$c(angleLineOpts.color, gridLineOpts.color);
      var i, offset, position;
      if (opts.pointLabels.display) {
        drawPointLabels(me);
      }
      if (gridLineOpts.display) {
        helpers$1.each(me.ticks, function (label, index) {
          if (index !== 0) {
            offset = me.getDistanceFromCenterForValue(me.ticksAsNumbers[index]);
            drawRadiusLine(me, gridLineOpts, offset, index);
          }
        });
      }
      if (angleLineOpts.display && lineWidth && lineColor) {
        ctx.save();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = lineColor;
        if (ctx.setLineDash) {
          ctx.setLineDash(resolve$4([angleLineOpts.borderDash, gridLineOpts.borderDash, []]));
          ctx.lineDashOffset = resolve$4([angleLineOpts.borderDashOffset, gridLineOpts.borderDashOffset, 0.0]);
        }
        for (i = me.chart.data.labels.length - 1; i >= 0; i--) {
          offset = me.getDistanceFromCenterForValue(opts.ticks.reverse ? me.min : me.max);
          position = me.getPointPosition(i, offset);
          ctx.beginPath();
          ctx.moveTo(me.xCenter, me.yCenter);
          ctx.lineTo(position.x, position.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
    _drawLabels: function () {
      var me = this;
      var ctx = me.ctx;
      var opts = me.options;
      var tickOpts = opts.ticks;
      if (!tickOpts.display) {
        return;
      }
      var startAngle = me.getIndexAngle(0);
      var tickFont = helpers$1.options._parseFont(tickOpts);
      var tickFontColor = valueOrDefault$c(tickOpts.fontColor, core_defaults.global.defaultFontColor);
      var offset, width;
      ctx.save();
      ctx.font = tickFont.string;
      ctx.translate(me.xCenter, me.yCenter);
      ctx.rotate(startAngle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      helpers$1.each(me.ticks, function (label, index) {
        if (index === 0 && !tickOpts.reverse) {
          return;
        }
        offset = me.getDistanceFromCenterForValue(me.ticksAsNumbers[index]);
        if (tickOpts.showLabelBackdrop) {
          width = ctx.measureText(label).width;
          ctx.fillStyle = tickOpts.backdropColor;
          ctx.fillRect(-width / 2 - tickOpts.backdropPaddingX, -offset - tickFont.size / 2 - tickOpts.backdropPaddingY, width + tickOpts.backdropPaddingX * 2, tickFont.size + tickOpts.backdropPaddingY * 2);
        }
        ctx.fillStyle = tickFontColor;
        ctx.fillText(label, 0, -offset);
      });
      ctx.restore();
    },
    _drawTitle: helpers$1.noop
  });
  var _defaults$3 = defaultConfig$3;
  scale_radialLinear._defaults = _defaults$3;
  var deprecated$1 = helpers$1._deprecated;
  var resolve$5 = helpers$1.options.resolve;
  var valueOrDefault$d = helpers$1.valueOrDefault;
  var MIN_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;
  var MAX_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
  var INTERVALS = {
    millisecond: {
      common: true,
      size: 1,
      steps: 1000
    },
    second: {
      common: true,
      size: 1000,
      steps: 60
    },
    minute: {
      common: true,
      size: 60000,
      steps: 60
    },
    hour: {
      common: true,
      size: 3600000,
      steps: 24
    },
    day: {
      common: true,
      size: 86400000,
      steps: 30
    },
    week: {
      common: false,
      size: 604800000,
      steps: 4
    },
    month: {
      common: true,
      size: 2.628e9,
      steps: 12
    },
    quarter: {
      common: false,
      size: 7.884e9,
      steps: 4
    },
    year: {
      common: true,
      size: 3.154e10
    }
  };
  var UNITS = Object.keys(INTERVALS);
  function sorter(a, b) {
    return a - b;
  }
  function arrayUnique(items) {
    var hash = {};
    var out = [];
    var i, ilen, item;
    for ((i = 0, ilen = items.length); i < ilen; ++i) {
      item = items[i];
      if (!hash[item]) {
        hash[item] = true;
        out.push(item);
      }
    }
    return out;
  }
  function getMin(options) {
    return helpers$1.valueOrDefault(options.time.min, options.ticks.min);
  }
  function getMax(options) {
    return helpers$1.valueOrDefault(options.time.max, options.ticks.max);
  }
  function buildLookupTable(timestamps, min, max, distribution) {
    if (distribution === 'linear' || !timestamps.length) {
      return [{
        time: min,
        pos: 0
      }, {
        time: max,
        pos: 1
      }];
    }
    var table = [];
    var items = [min];
    var i, ilen, prev, curr, next;
    for ((i = 0, ilen = timestamps.length); i < ilen; ++i) {
      curr = timestamps[i];
      if (curr > min && curr < max) {
        items.push(curr);
      }
    }
    items.push(max);
    for ((i = 0, ilen = items.length); i < ilen; ++i) {
      next = items[i + 1];
      prev = items[i - 1];
      curr = items[i];
      if (prev === undefined || next === undefined || Math.round((next + prev) / 2) !== curr) {
        table.push({
          time: curr,
          pos: i / (ilen - 1)
        });
      }
    }
    return table;
  }
  function lookup(table, key, value) {
    var lo = 0;
    var hi = table.length - 1;
    var mid, i0, i1;
    while (lo >= 0 && lo <= hi) {
      mid = lo + hi >> 1;
      i0 = table[mid - 1] || null;
      i1 = table[mid];
      if (!i0) {
        return {
          lo: null,
          hi: i1
        };
      } else if (i1[key] < value) {
        lo = mid + 1;
      } else if (i0[key] > value) {
        hi = mid - 1;
      } else {
        return {
          lo: i0,
          hi: i1
        };
      }
    }
    return {
      lo: i1,
      hi: null
    };
  }
  function interpolate$1(table, skey, sval, tkey) {
    var range = lookup(table, skey, sval);
    var prev = !range.lo ? table[0] : !range.hi ? table[table.length - 2] : range.lo;
    var next = !range.lo ? table[1] : !range.hi ? table[table.length - 1] : range.hi;
    var span = next[skey] - prev[skey];
    var ratio = span ? (sval - prev[skey]) / span : 0;
    var offset = (next[tkey] - prev[tkey]) * ratio;
    return prev[tkey] + offset;
  }
  function toTimestamp(scale, input) {
    var adapter = scale._adapter;
    var options = scale.options.time;
    var parser = options.parser;
    var format = parser || options.format;
    var value = input;
    if (typeof parser === 'function') {
      value = parser(value);
    }
    if (!helpers$1.isFinite(value)) {
      value = typeof format === 'string' ? adapter.parse(value, format) : adapter.parse(value);
    }
    if (value !== null) {
      return +value;
    }
    if (!parser && typeof format === 'function') {
      value = format(input);
      if (!helpers$1.isFinite(value)) {
        value = adapter.parse(value);
      }
    }
    return value;
  }
  function parse(scale, input) {
    if (helpers$1.isNullOrUndef(input)) {
      return null;
    }
    var options = scale.options.time;
    var value = toTimestamp(scale, scale.getRightValue(input));
    if (value === null) {
      return value;
    }
    if (options.round) {
      value = +scale._adapter.startOf(value, options.round);
    }
    return value;
  }
  function determineUnitForAutoTicks(minUnit, min, max, capacity) {
    var ilen = UNITS.length;
    var i, interval, factor;
    for (i = UNITS.indexOf(minUnit); i < ilen - 1; ++i) {
      interval = INTERVALS[UNITS[i]];
      factor = interval.steps ? interval.steps : MAX_INTEGER;
      if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
        return UNITS[i];
      }
    }
    return UNITS[ilen - 1];
  }
  function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
    var i, unit;
    for (i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--) {
      unit = UNITS[i];
      if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
        return unit;
      }
    }
    return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
  }
  function determineMajorUnit(unit) {
    for (var i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i) {
      if (INTERVALS[UNITS[i]].common) {
        return UNITS[i];
      }
    }
  }
  function generate(scale, min, max, capacity) {
    var adapter = scale._adapter;
    var options = scale.options;
    var timeOpts = options.time;
    var minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, capacity);
    var stepSize = resolve$5([timeOpts.stepSize, timeOpts.unitStepSize, 1]);
    var weekday = minor === 'week' ? timeOpts.isoWeekday : false;
    var first = min;
    var ticks = [];
    var time;
    if (weekday) {
      first = +adapter.startOf(first, 'isoWeek', weekday);
    }
    first = +adapter.startOf(first, weekday ? 'day' : minor);
    if (adapter.diff(max, min, minor) > 100000 * stepSize) {
      throw min + ' and ' + max + ' are too far apart with stepSize of ' + stepSize + ' ' + minor;
    }
    for (time = first; time < max; time = +adapter.add(time, stepSize, minor)) {
      ticks.push(time);
    }
    if (time === max || options.bounds === 'ticks') {
      ticks.push(time);
    }
    return ticks;
  }
  function computeOffsets(table, ticks, min, max, options) {
    var start = 0;
    var end = 0;
    var first, last;
    if (options.offset && ticks.length) {
      first = interpolate$1(table, 'time', ticks[0], 'pos');
      if (ticks.length === 1) {
        start = 1 - first;
      } else {
        start = (interpolate$1(table, 'time', ticks[1], 'pos') - first) / 2;
      }
      last = interpolate$1(table, 'time', ticks[ticks.length - 1], 'pos');
      if (ticks.length === 1) {
        end = last;
      } else {
        end = (last - interpolate$1(table, 'time', ticks[ticks.length - 2], 'pos')) / 2;
      }
    }
    return {
      start: start,
      end: end,
      factor: 1 / (start + 1 + end)
    };
  }
  function setMajorTicks(scale, ticks, map, majorUnit) {
    var adapter = scale._adapter;
    var first = +adapter.startOf(ticks[0].value, majorUnit);
    var last = ticks[ticks.length - 1].value;
    var major, index;
    for (major = first; major <= last; major = +adapter.add(major, 1, majorUnit)) {
      index = map[major];
      if (index >= 0) {
        ticks[index].major = true;
      }
    }
    return ticks;
  }
  function ticksFromTimestamps(scale, values, majorUnit) {
    var ticks = [];
    var map = {};
    var ilen = values.length;
    var i, value;
    for (i = 0; i < ilen; ++i) {
      value = values[i];
      map[value] = i;
      ticks.push({
        value: value,
        major: false
      });
    }
    return ilen === 0 || !majorUnit ? ticks : setMajorTicks(scale, ticks, map, majorUnit);
  }
  var defaultConfig$4 = {
    position: 'bottom',
    distribution: 'linear',
    bounds: 'data',
    adapters: {},
    time: {
      parser: false,
      unit: false,
      round: false,
      displayFormat: false,
      isoWeekday: false,
      minUnit: 'millisecond',
      displayFormats: {}
    },
    ticks: {
      autoSkip: false,
      source: 'auto',
      major: {
        enabled: false
      }
    }
  };
  var scale_time = core_scale.extend({
    initialize: function () {
      this.mergeTicksOptions();
      core_scale.prototype.initialize.call(this);
    },
    update: function () {
      var me = this;
      var options = me.options;
      var time = options.time || (options.time = {});
      var adapter = me._adapter = new core_adapters._date(options.adapters.date);
      deprecated$1('time scale', time.format, 'time.format', 'time.parser');
      deprecated$1('time scale', time.min, 'time.min', 'ticks.min');
      deprecated$1('time scale', time.max, 'time.max', 'ticks.max');
      helpers$1.mergeIf(time.displayFormats, adapter.formats());
      return core_scale.prototype.update.apply(me, arguments);
    },
    getRightValue: function (rawValue) {
      if (rawValue && rawValue.t !== undefined) {
        rawValue = rawValue.t;
      }
      return core_scale.prototype.getRightValue.call(this, rawValue);
    },
    determineDataLimits: function () {
      var me = this;
      var chart = me.chart;
      var adapter = me._adapter;
      var options = me.options;
      var unit = options.time.unit || 'day';
      var min = MAX_INTEGER;
      var max = MIN_INTEGER;
      var timestamps = [];
      var datasets = [];
      var labels = [];
      var i, j, ilen, jlen, data, timestamp, labelsAdded;
      var dataLabels = me._getLabels();
      for ((i = 0, ilen = dataLabels.length); i < ilen; ++i) {
        labels.push(parse(me, dataLabels[i]));
      }
      for ((i = 0, ilen = (chart.data.datasets || []).length); i < ilen; ++i) {
        if (chart.isDatasetVisible(i)) {
          data = chart.data.datasets[i].data;
          if (helpers$1.isObject(data[0])) {
            datasets[i] = [];
            for ((j = 0, jlen = data.length); j < jlen; ++j) {
              timestamp = parse(me, data[j]);
              timestamps.push(timestamp);
              datasets[i][j] = timestamp;
            }
          } else {
            datasets[i] = labels.slice(0);
            if (!labelsAdded) {
              timestamps = timestamps.concat(labels);
              labelsAdded = true;
            }
          }
        } else {
          datasets[i] = [];
        }
      }
      if (labels.length) {
        min = Math.min(min, labels[0]);
        max = Math.max(max, labels[labels.length - 1]);
      }
      if (timestamps.length) {
        timestamps = ilen > 1 ? arrayUnique(timestamps).sort(sorter) : timestamps.sort(sorter);
        min = Math.min(min, timestamps[0]);
        max = Math.max(max, timestamps[timestamps.length - 1]);
      }
      min = parse(me, getMin(options)) || min;
      max = parse(me, getMax(options)) || max;
      min = min === MAX_INTEGER ? +adapter.startOf(Date.now(), unit) : min;
      max = max === MIN_INTEGER ? +adapter.endOf(Date.now(), unit) + 1 : max;
      me.min = Math.min(min, max);
      me.max = Math.max(min + 1, max);
      me._table = [];
      me._timestamps = {
        data: timestamps,
        datasets: datasets,
        labels: labels
      };
    },
    buildTicks: function () {
      var me = this;
      var min = me.min;
      var max = me.max;
      var options = me.options;
      var tickOpts = options.ticks;
      var timeOpts = options.time;
      var timestamps = me._timestamps;
      var ticks = [];
      var capacity = me.getLabelCapacity(min);
      var source = tickOpts.source;
      var distribution = options.distribution;
      var i, ilen, timestamp;
      if (source === 'data' || source === 'auto' && distribution === 'series') {
        timestamps = timestamps.data;
      } else if (source === 'labels') {
        timestamps = timestamps.labels;
      } else {
        timestamps = generate(me, min, max, capacity);
      }
      if (options.bounds === 'ticks' && timestamps.length) {
        min = timestamps[0];
        max = timestamps[timestamps.length - 1];
      }
      min = parse(me, getMin(options)) || min;
      max = parse(me, getMax(options)) || max;
      for ((i = 0, ilen = timestamps.length); i < ilen; ++i) {
        timestamp = timestamps[i];
        if (timestamp >= min && timestamp <= max) {
          ticks.push(timestamp);
        }
      }
      me.min = min;
      me.max = max;
      me._unit = timeOpts.unit || (tickOpts.autoSkip ? determineUnitForAutoTicks(timeOpts.minUnit, me.min, me.max, capacity) : determineUnitForFormatting(me, ticks.length, timeOpts.minUnit, me.min, me.max));
      me._majorUnit = !tickOpts.major.enabled || me._unit === 'year' ? undefined : determineMajorUnit(me._unit);
      me._table = buildLookupTable(me._timestamps.data, min, max, distribution);
      me._offsets = computeOffsets(me._table, ticks, min, max, options);
      if (tickOpts.reverse) {
        ticks.reverse();
      }
      return ticksFromTimestamps(me, ticks, me._majorUnit);
    },
    getLabelForIndex: function (index, datasetIndex) {
      var me = this;
      var adapter = me._adapter;
      var data = me.chart.data;
      var timeOpts = me.options.time;
      var label = data.labels && index < data.labels.length ? data.labels[index] : '';
      var value = data.datasets[datasetIndex].data[index];
      if (helpers$1.isObject(value)) {
        label = me.getRightValue(value);
      }
      if (timeOpts.tooltipFormat) {
        return adapter.format(toTimestamp(me, label), timeOpts.tooltipFormat);
      }
      if (typeof label === 'string') {
        return label;
      }
      return adapter.format(toTimestamp(me, label), timeOpts.displayFormats.datetime);
    },
    tickFormatFunction: function (time, index, ticks, format) {
      var me = this;
      var adapter = me._adapter;
      var options = me.options;
      var formats = options.time.displayFormats;
      var minorFormat = formats[me._unit];
      var majorUnit = me._majorUnit;
      var majorFormat = formats[majorUnit];
      var tick = ticks[index];
      var tickOpts = options.ticks;
      var major = majorUnit && majorFormat && tick && tick.major;
      var label = adapter.format(time, format ? format : major ? majorFormat : minorFormat);
      var nestedTickOpts = major ? tickOpts.major : tickOpts.minor;
      var formatter = resolve$5([nestedTickOpts.callback, nestedTickOpts.userCallback, tickOpts.callback, tickOpts.userCallback]);
      return formatter ? formatter(label, index, ticks) : label;
    },
    convertTicksToLabels: function (ticks) {
      var labels = [];
      var i, ilen;
      for ((i = 0, ilen = ticks.length); i < ilen; ++i) {
        labels.push(this.tickFormatFunction(ticks[i].value, i, ticks));
      }
      return labels;
    },
    getPixelForOffset: function (time) {
      var me = this;
      var offsets = me._offsets;
      var pos = interpolate$1(me._table, 'time', time, 'pos');
      return me.getPixelForDecimal((offsets.start + pos) * offsets.factor);
    },
    getPixelForValue: function (value, index, datasetIndex) {
      var me = this;
      var time = null;
      if (index !== undefined && datasetIndex !== undefined) {
        time = me._timestamps.datasets[datasetIndex][index];
      }
      if (time === null) {
        time = parse(me, value);
      }
      if (time !== null) {
        return me.getPixelForOffset(time);
      }
    },
    getPixelForTick: function (index) {
      var ticks = this.getTicks();
      return index >= 0 && index < ticks.length ? this.getPixelForOffset(ticks[index].value) : null;
    },
    getValueForPixel: function (pixel) {
      var me = this;
      var offsets = me._offsets;
      var pos = me.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
      var time = interpolate$1(me._table, 'pos', pos, 'time');
      return me._adapter._create(time);
    },
    _getLabelSize: function (label) {
      var me = this;
      var ticksOpts = me.options.ticks;
      var tickLabelWidth = me.ctx.measureText(label).width;
      var angle = helpers$1.toRadians(me.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
      var cosRotation = Math.cos(angle);
      var sinRotation = Math.sin(angle);
      var tickFontSize = valueOrDefault$d(ticksOpts.fontSize, core_defaults.global.defaultFontSize);
      return {
        w: tickLabelWidth * cosRotation + tickFontSize * sinRotation,
        h: tickLabelWidth * sinRotation + tickFontSize * cosRotation
      };
    },
    getLabelWidth: function (label) {
      return this._getLabelSize(label).w;
    },
    getLabelCapacity: function (exampleTime) {
      var me = this;
      var timeOpts = me.options.time;
      var displayFormats = timeOpts.displayFormats;
      var format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
      var exampleLabel = me.tickFormatFunction(exampleTime, 0, ticksFromTimestamps(me, [exampleTime], me._majorUnit), format);
      var size = me._getLabelSize(exampleLabel);
      var capacity = Math.floor(me.isHorizontal() ? me.width / size.w : me.height / size.h);
      if (me.options.offset) {
        capacity--;
      }
      return capacity > 0 ? capacity : 1;
    }
  });
  var _defaults$4 = defaultConfig$4;
  scale_time._defaults = _defaults$4;
  var scales = {
    category: scale_category,
    linear: scale_linear,
    logarithmic: scale_logarithmic,
    radialLinear: scale_radialLinear,
    time: scale_time
  };
  var FORMATS = {
    datetime: 'MMM D, YYYY, h:mm:ss a',
    millisecond: 'h:mm:ss.SSS a',
    second: 'h:mm:ss a',
    minute: 'h:mm a',
    hour: 'hA',
    day: 'MMM D',
    week: 'll',
    month: 'MMM YYYY',
    quarter: '[Q]Q - YYYY',
    year: 'YYYY'
  };
  core_adapters._date.override(typeof moment === 'function' ? {
    _id: 'moment',
    formats: function () {
      return FORMATS;
    },
    parse: function (value, format) {
      if (typeof value === 'string' && typeof format === 'string') {
        value = moment(value, format);
      } else if (!(value instanceof moment)) {
        value = moment(value);
      }
      return value.isValid() ? value.valueOf() : null;
    },
    format: function (time, format) {
      return moment(time).format(format);
    },
    add: function (time, amount, unit) {
      return moment(time).add(amount, unit).valueOf();
    },
    diff: function (max, min, unit) {
      return moment(max).diff(moment(min), unit);
    },
    startOf: function (time, unit, weekday) {
      time = moment(time);
      if (unit === 'isoWeek') {
        return time.isoWeekday(weekday).valueOf();
      }
      return time.startOf(unit).valueOf();
    },
    endOf: function (time, unit) {
      return moment(time).endOf(unit).valueOf();
    },
    _create: function (time) {
      return moment(time);
    }
  } : {});
  core_defaults._set('global', {
    plugins: {
      filler: {
        propagate: true
      }
    }
  });
  var mappers = {
    dataset: function (source) {
      var index = source.fill;
      var chart = source.chart;
      var meta = chart.getDatasetMeta(index);
      var visible = meta && chart.isDatasetVisible(index);
      var points = visible && meta.dataset._children || [];
      var length = points.length || 0;
      return !length ? null : function (point, i) {
        return i < length && points[i]._view || null;
      };
    },
    boundary: function (source) {
      var boundary = source.boundary;
      var x = boundary ? boundary.x : null;
      var y = boundary ? boundary.y : null;
      if (helpers$1.isArray(boundary)) {
        return function (point, i) {
          return boundary[i];
        };
      }
      return function (point) {
        return {
          x: x === null ? point.x : x,
          y: y === null ? point.y : y
        };
      };
    }
  };
  function decodeFill(el, index, count) {
    var model = el._model || ({});
    var fill = model.fill;
    var target;
    if (fill === undefined) {
      fill = !!model.backgroundColor;
    }
    if (fill === false || fill === null) {
      return false;
    }
    if (fill === true) {
      return 'origin';
    }
    target = parseFloat(fill, 10);
    if (isFinite(target) && Math.floor(target) === target) {
      if (fill[0] === '-' || fill[0] === '+') {
        target = index + target;
      }
      if (target === index || target < 0 || target >= count) {
        return false;
      }
      return target;
    }
    switch (fill) {
      case 'bottom':
        return 'start';
      case 'top':
        return 'end';
      case 'zero':
        return 'origin';
      case 'origin':
      case 'start':
      case 'end':
        return fill;
      default:
        return false;
    }
  }
  function computeLinearBoundary(source) {
    var model = source.el._model || ({});
    var scale = source.el._scale || ({});
    var fill = source.fill;
    var target = null;
    var horizontal;
    if (isFinite(fill)) {
      return null;
    }
    if (fill === 'start') {
      target = model.scaleBottom === undefined ? scale.bottom : model.scaleBottom;
    } else if (fill === 'end') {
      target = model.scaleTop === undefined ? scale.top : model.scaleTop;
    } else if (model.scaleZero !== undefined) {
      target = model.scaleZero;
    } else if (scale.getBasePixel) {
      target = scale.getBasePixel();
    }
    if (target !== undefined && target !== null) {
      if (target.x !== undefined && target.y !== undefined) {
        return target;
      }
      if (helpers$1.isFinite(target)) {
        horizontal = scale.isHorizontal();
        return {
          x: horizontal ? target : null,
          y: horizontal ? null : target
        };
      }
    }
    return null;
  }
  function computeCircularBoundary(source) {
    var scale = source.el._scale;
    var options = scale.options;
    var length = scale.chart.data.labels.length;
    var fill = source.fill;
    var target = [];
    var start, end, center, i, point;
    if (!length) {
      return null;
    }
    start = options.ticks.reverse ? scale.max : scale.min;
    end = options.ticks.reverse ? scale.min : scale.max;
    center = scale.getPointPositionForValue(0, start);
    for (i = 0; i < length; ++i) {
      point = fill === 'start' || fill === 'end' ? scale.getPointPositionForValue(i, fill === 'start' ? start : end) : scale.getBasePosition(i);
      if (options.gridLines.circular) {
        point.cx = center.x;
        point.cy = center.y;
        point.angle = scale.getIndexAngle(i) - Math.PI / 2;
      }
      target.push(point);
    }
    return target;
  }
  function computeBoundary(source) {
    var scale = source.el._scale || ({});
    if (scale.getPointPositionForValue) {
      return computeCircularBoundary(source);
    }
    return computeLinearBoundary(source);
  }
  function resolveTarget(sources, index, propagate) {
    var source = sources[index];
    var fill = source.fill;
    var visited = [index];
    var target;
    if (!propagate) {
      return fill;
    }
    while (fill !== false && visited.indexOf(fill) === -1) {
      if (!isFinite(fill)) {
        return fill;
      }
      target = sources[fill];
      if (!target) {
        return false;
      }
      if (target.visible) {
        return fill;
      }
      visited.push(fill);
      fill = target.fill;
    }
    return false;
  }
  function createMapper(source) {
    var fill = source.fill;
    var type = 'dataset';
    if (fill === false) {
      return null;
    }
    if (!isFinite(fill)) {
      type = 'boundary';
    }
    return mappers[type](source);
  }
  function isDrawable(point) {
    return point && !point.skip;
  }
  function drawArea(ctx, curve0, curve1, len0, len1) {
    var i, cx, cy, r;
    if (!len0 || !len1) {
      return;
    }
    ctx.moveTo(curve0[0].x, curve0[0].y);
    for (i = 1; i < len0; ++i) {
      helpers$1.canvas.lineTo(ctx, curve0[i - 1], curve0[i]);
    }
    if (curve1[0].angle !== undefined) {
      cx = curve1[0].cx;
      cy = curve1[0].cy;
      r = Math.sqrt(Math.pow(curve1[0].x - cx, 2) + Math.pow(curve1[0].y - cy, 2));
      for (i = len1 - 1; i > 0; --i) {
        ctx.arc(cx, cy, r, curve1[i].angle, curve1[i - 1].angle, true);
      }
      return;
    }
    ctx.lineTo(curve1[len1 - 1].x, curve1[len1 - 1].y);
    for (i = len1 - 1; i > 0; --i) {
      helpers$1.canvas.lineTo(ctx, curve1[i], curve1[i - 1], true);
    }
  }
  function doFill(ctx, points, mapper, view, color, loop) {
    var count = points.length;
    var span = view.spanGaps;
    var curve0 = [];
    var curve1 = [];
    var len0 = 0;
    var len1 = 0;
    var i, ilen, index, p0, p1, d0, d1, loopOffset;
    ctx.beginPath();
    for ((i = 0, ilen = count); i < ilen; ++i) {
      index = i % count;
      p0 = points[index]._view;
      p1 = mapper(p0, index, view);
      d0 = isDrawable(p0);
      d1 = isDrawable(p1);
      if (loop && loopOffset === undefined && d0) {
        loopOffset = i + 1;
        ilen = count + loopOffset;
      }
      if (d0 && d1) {
        len0 = curve0.push(p0);
        len1 = curve1.push(p1);
      } else if (len0 && len1) {
        if (!span) {
          drawArea(ctx, curve0, curve1, len0, len1);
          len0 = len1 = 0;
          curve0 = [];
          curve1 = [];
        } else {
          if (d0) {
            curve0.push(p0);
          }
          if (d1) {
            curve1.push(p1);
          }
        }
      }
    }
    drawArea(ctx, curve0, curve1, len0, len1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  var plugin_filler = {
    id: 'filler',
    afterDatasetsUpdate: function (chart, options) {
      var count = (chart.data.datasets || []).length;
      var propagate = options.propagate;
      var sources = [];
      var meta, i, el, source;
      for (i = 0; i < count; ++i) {
        meta = chart.getDatasetMeta(i);
        el = meta.dataset;
        source = null;
        if (el && el._model && el instanceof elements.Line) {
          source = {
            visible: chart.isDatasetVisible(i),
            fill: decodeFill(el, i, count),
            chart: chart,
            el: el
          };
        }
        meta.$filler = source;
        sources.push(source);
      }
      for (i = 0; i < count; ++i) {
        source = sources[i];
        if (!source) {
          continue;
        }
        source.fill = resolveTarget(sources, i, propagate);
        source.boundary = computeBoundary(source);
        source.mapper = createMapper(source);
      }
    },
    beforeDatasetsDraw: function (chart) {
      var metasets = chart._getSortedVisibleDatasetMetas();
      var ctx = chart.ctx;
      var meta, i, el, view, points, mapper, color;
      for (i = metasets.length - 1; i >= 0; --i) {
        meta = metasets[i].$filler;
        if (!meta || !meta.visible) {
          continue;
        }
        el = meta.el;
        view = el._view;
        points = el._children || [];
        mapper = meta.mapper;
        color = view.backgroundColor || core_defaults.global.defaultColor;
        if (mapper && color && points.length) {
          helpers$1.canvas.clipArea(ctx, chart.chartArea);
          doFill(ctx, points, mapper, view, color, el._loop);
          helpers$1.canvas.unclipArea(ctx);
        }
      }
    }
  };
  var getRtlHelper$1 = helpers$1.rtl.getRtlAdapter;
  var noop$1 = helpers$1.noop;
  var valueOrDefault$e = helpers$1.valueOrDefault;
  core_defaults._set('global', {
    legend: {
      display: true,
      position: 'top',
      align: 'center',
      fullWidth: true,
      reverse: false,
      weight: 1000,
      onClick: function (e, legendItem) {
        var index = legendItem.datasetIndex;
        var ci = this.chart;
        var meta = ci.getDatasetMeta(index);
        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
        ci.update();
      },
      onHover: null,
      onLeave: null,
      labels: {
        boxWidth: 40,
        padding: 10,
        generateLabels: function (chart) {
          var datasets = chart.data.datasets;
          var options = chart.options.legend || ({});
          var usePointStyle = options.labels && options.labels.usePointStyle;
          return chart._getSortedDatasetMetas().map(function (meta) {
            var style = meta.controller.getStyle(usePointStyle ? 0 : undefined);
            return {
              text: datasets[meta.index].label,
              fillStyle: style.backgroundColor,
              hidden: !chart.isDatasetVisible(meta.index),
              lineCap: style.borderCapStyle,
              lineDash: style.borderDash,
              lineDashOffset: style.borderDashOffset,
              lineJoin: style.borderJoinStyle,
              lineWidth: style.borderWidth,
              strokeStyle: style.borderColor,
              pointStyle: style.pointStyle,
              rotation: style.rotation,
              datasetIndex: meta.index
            };
          }, this);
        }
      }
    },
    legendCallback: function (chart) {
      var list = document.createElement('ul');
      var datasets = chart.data.datasets;
      var i, ilen, listItem, listItemSpan;
      list.setAttribute('class', chart.id + '-legend');
      for ((i = 0, ilen = datasets.length); i < ilen; i++) {
        listItem = list.appendChild(document.createElement('li'));
        listItemSpan = listItem.appendChild(document.createElement('span'));
        listItemSpan.style.backgroundColor = datasets[i].backgroundColor;
        if (datasets[i].label) {
          listItem.appendChild(document.createTextNode(datasets[i].label));
        }
      }
      return list.outerHTML;
    }
  });
  function getBoxWidth(labelOpts, fontSize) {
    return labelOpts.usePointStyle && labelOpts.boxWidth > fontSize ? fontSize : labelOpts.boxWidth;
  }
  var Legend = core_element.extend({
    initialize: function (config) {
      var me = this;
      helpers$1.extend(me, config);
      me.legendHitBoxes = [];
      me._hoveredItem = null;
      me.doughnutMode = false;
    },
    beforeUpdate: noop$1,
    update: function (maxWidth, maxHeight, margins) {
      var me = this;
      me.beforeUpdate();
      me.maxWidth = maxWidth;
      me.maxHeight = maxHeight;
      me.margins = margins;
      me.beforeSetDimensions();
      me.setDimensions();
      me.afterSetDimensions();
      me.beforeBuildLabels();
      me.buildLabels();
      me.afterBuildLabels();
      me.beforeFit();
      me.fit();
      me.afterFit();
      me.afterUpdate();
      return me.minSize;
    },
    afterUpdate: noop$1,
    beforeSetDimensions: noop$1,
    setDimensions: function () {
      var me = this;
      if (me.isHorizontal()) {
        me.width = me.maxWidth;
        me.left = 0;
        me.right = me.width;
      } else {
        me.height = me.maxHeight;
        me.top = 0;
        me.bottom = me.height;
      }
      me.paddingLeft = 0;
      me.paddingTop = 0;
      me.paddingRight = 0;
      me.paddingBottom = 0;
      me.minSize = {
        width: 0,
        height: 0
      };
    },
    afterSetDimensions: noop$1,
    beforeBuildLabels: noop$1,
    buildLabels: function () {
      var me = this;
      var labelOpts = me.options.labels || ({});
      var legendItems = helpers$1.callback(labelOpts.generateLabels, [me.chart], me) || [];
      if (labelOpts.filter) {
        legendItems = legendItems.filter(function (item) {
          return labelOpts.filter(item, me.chart.data);
        });
      }
      if (me.options.reverse) {
        legendItems.reverse();
      }
      me.legendItems = legendItems;
    },
    afterBuildLabels: noop$1,
    beforeFit: noop$1,
    fit: function () {
      var me = this;
      var opts = me.options;
      var labelOpts = opts.labels;
      var display = opts.display;
      var ctx = me.ctx;
      var labelFont = helpers$1.options._parseFont(labelOpts);
      var fontSize = labelFont.size;
      var hitboxes = me.legendHitBoxes = [];
      var minSize = me.minSize;
      var isHorizontal = me.isHorizontal();
      if (isHorizontal) {
        minSize.width = me.maxWidth;
        minSize.height = display ? 10 : 0;
      } else {
        minSize.width = display ? 10 : 0;
        minSize.height = me.maxHeight;
      }
      if (!display) {
        me.width = minSize.width = me.height = minSize.height = 0;
        return;
      }
      ctx.font = labelFont.string;
      if (isHorizontal) {
        var lineWidths = me.lineWidths = [0];
        var totalHeight = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        helpers$1.each(me.legendItems, function (legendItem, i) {
          var boxWidth = getBoxWidth(labelOpts, fontSize);
          var width = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
          if (i === 0 || lineWidths[lineWidths.length - 1] + width + 2 * labelOpts.padding > minSize.width) {
            totalHeight += fontSize + labelOpts.padding;
            lineWidths[lineWidths.length - (i > 0 ? 0 : 1)] = 0;
          }
          hitboxes[i] = {
            left: 0,
            top: 0,
            width: width,
            height: fontSize
          };
          lineWidths[lineWidths.length - 1] += width + labelOpts.padding;
        });
        minSize.height += totalHeight;
      } else {
        var vPadding = labelOpts.padding;
        var columnWidths = me.columnWidths = [];
        var columnHeights = me.columnHeights = [];
        var totalWidth = labelOpts.padding;
        var currentColWidth = 0;
        var currentColHeight = 0;
        helpers$1.each(me.legendItems, function (legendItem, i) {
          var boxWidth = getBoxWidth(labelOpts, fontSize);
          var itemWidth = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
          if (i > 0 && currentColHeight + fontSize + 2 * vPadding > minSize.height) {
            totalWidth += currentColWidth + labelOpts.padding;
            columnWidths.push(currentColWidth);
            columnHeights.push(currentColHeight);
            currentColWidth = 0;
            currentColHeight = 0;
          }
          currentColWidth = Math.max(currentColWidth, itemWidth);
          currentColHeight += fontSize + vPadding;
          hitboxes[i] = {
            left: 0,
            top: 0,
            width: itemWidth,
            height: fontSize
          };
        });
        totalWidth += currentColWidth;
        columnWidths.push(currentColWidth);
        columnHeights.push(currentColHeight);
        minSize.width += totalWidth;
      }
      me.width = minSize.width;
      me.height = minSize.height;
    },
    afterFit: noop$1,
    isHorizontal: function () {
      return this.options.position === 'top' || this.options.position === 'bottom';
    },
    draw: function () {
      var me = this;
      var opts = me.options;
      var labelOpts = opts.labels;
      var globalDefaults = core_defaults.global;
      var defaultColor = globalDefaults.defaultColor;
      var lineDefault = globalDefaults.elements.line;
      var legendHeight = me.height;
      var columnHeights = me.columnHeights;
      var legendWidth = me.width;
      var lineWidths = me.lineWidths;
      if (!opts.display) {
        return;
      }
      var rtlHelper = getRtlHelper$1(opts.rtl, me.left, me.minSize.width);
      var ctx = me.ctx;
      var fontColor = valueOrDefault$e(labelOpts.fontColor, globalDefaults.defaultFontColor);
      var labelFont = helpers$1.options._parseFont(labelOpts);
      var fontSize = labelFont.size;
      var cursor;
      ctx.textAlign = rtlHelper.textAlign('left');
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = fontColor;
      ctx.fillStyle = fontColor;
      ctx.font = labelFont.string;
      var boxWidth = getBoxWidth(labelOpts, fontSize);
      var hitboxes = me.legendHitBoxes;
      var drawLegendBox = function (x, y, legendItem) {
        if (isNaN(boxWidth) || boxWidth <= 0) {
          return;
        }
        ctx.save();
        var lineWidth = valueOrDefault$e(legendItem.lineWidth, lineDefault.borderWidth);
        ctx.fillStyle = valueOrDefault$e(legendItem.fillStyle, defaultColor);
        ctx.lineCap = valueOrDefault$e(legendItem.lineCap, lineDefault.borderCapStyle);
        ctx.lineDashOffset = valueOrDefault$e(legendItem.lineDashOffset, lineDefault.borderDashOffset);
        ctx.lineJoin = valueOrDefault$e(legendItem.lineJoin, lineDefault.borderJoinStyle);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = valueOrDefault$e(legendItem.strokeStyle, defaultColor);
        if (ctx.setLineDash) {
          ctx.setLineDash(valueOrDefault$e(legendItem.lineDash, lineDefault.borderDash));
        }
        if (labelOpts && labelOpts.usePointStyle) {
          var radius = boxWidth * Math.SQRT2 / 2;
          var centerX = rtlHelper.xPlus(x, boxWidth / 2);
          var centerY = y + fontSize / 2;
          helpers$1.canvas.drawPoint(ctx, legendItem.pointStyle, radius, centerX, centerY, legendItem.rotation);
        } else {
          ctx.fillRect(rtlHelper.leftForLtr(x, boxWidth), y, boxWidth, fontSize);
          if (lineWidth !== 0) {
            ctx.strokeRect(rtlHelper.leftForLtr(x, boxWidth), y, boxWidth, fontSize);
          }
        }
        ctx.restore();
      };
      var fillText = function (x, y, legendItem, textWidth) {
        var halfFontSize = fontSize / 2;
        var xLeft = rtlHelper.xPlus(x, boxWidth + halfFontSize);
        var yMiddle = y + halfFontSize;
        ctx.fillText(legendItem.text, xLeft, yMiddle);
        if (legendItem.hidden) {
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.moveTo(xLeft, yMiddle);
          ctx.lineTo(rtlHelper.xPlus(xLeft, textWidth), yMiddle);
          ctx.stroke();
        }
      };
      var alignmentOffset = function (dimension, blockSize) {
        switch (opts.align) {
          case 'start':
            return labelOpts.padding;
          case 'end':
            return dimension - blockSize;
          default:
            return (dimension - blockSize + labelOpts.padding) / 2;
        }
      };
      var isHorizontal = me.isHorizontal();
      if (isHorizontal) {
        cursor = {
          x: me.left + alignmentOffset(legendWidth, lineWidths[0]),
          y: me.top + labelOpts.padding,
          line: 0
        };
      } else {
        cursor = {
          x: me.left + labelOpts.padding,
          y: me.top + alignmentOffset(legendHeight, columnHeights[0]),
          line: 0
        };
      }
      helpers$1.rtl.overrideTextDirection(me.ctx, opts.textDirection);
      var itemHeight = fontSize + labelOpts.padding;
      helpers$1.each(me.legendItems, function (legendItem, i) {
        var textWidth = ctx.measureText(legendItem.text).width;
        var width = boxWidth + fontSize / 2 + textWidth;
        var x = cursor.x;
        var y = cursor.y;
        rtlHelper.setWidth(me.minSize.width);
        if (isHorizontal) {
          if (i > 0 && x + width + labelOpts.padding > me.left + me.minSize.width) {
            y = cursor.y += itemHeight;
            cursor.line++;
            x = cursor.x = me.left + alignmentOffset(legendWidth, lineWidths[cursor.line]);
          }
        } else if (i > 0 && y + itemHeight > me.top + me.minSize.height) {
          x = cursor.x = x + me.columnWidths[cursor.line] + labelOpts.padding;
          cursor.line++;
          y = cursor.y = me.top + alignmentOffset(legendHeight, columnHeights[cursor.line]);
        }
        var realX = rtlHelper.x(x);
        drawLegendBox(realX, y, legendItem);
        hitboxes[i].left = rtlHelper.leftForLtr(realX, hitboxes[i].width);
        hitboxes[i].top = y;
        fillText(realX, y, legendItem, textWidth);
        if (isHorizontal) {
          cursor.x += width + labelOpts.padding;
        } else {
          cursor.y += itemHeight;
        }
      });
      helpers$1.rtl.restoreTextDirection(me.ctx, opts.textDirection);
    },
    _getLegendItemAt: function (x, y) {
      var me = this;
      var i, hitBox, lh;
      if (x >= me.left && x <= me.right && y >= me.top && y <= me.bottom) {
        lh = me.legendHitBoxes;
        for (i = 0; i < lh.length; ++i) {
          hitBox = lh[i];
          if (x >= hitBox.left && x <= hitBox.left + hitBox.width && y >= hitBox.top && y <= hitBox.top + hitBox.height) {
            return me.legendItems[i];
          }
        }
      }
      return null;
    },
    handleEvent: function (e) {
      var me = this;
      var opts = me.options;
      var type = e.type === 'mouseup' ? 'click' : e.type;
      var hoveredItem;
      if (type === 'mousemove') {
        if (!opts.onHover && !opts.onLeave) {
          return;
        }
      } else if (type === 'click') {
        if (!opts.onClick) {
          return;
        }
      } else {
        return;
      }
      hoveredItem = me._getLegendItemAt(e.x, e.y);
      if (type === 'click') {
        if (hoveredItem && opts.onClick) {
          opts.onClick.call(me, e.native, hoveredItem);
        }
      } else {
        if (opts.onLeave && hoveredItem !== me._hoveredItem) {
          if (me._hoveredItem) {
            opts.onLeave.call(me, e.native, me._hoveredItem);
          }
          me._hoveredItem = hoveredItem;
        }
        if (opts.onHover && hoveredItem) {
          opts.onHover.call(me, e.native, hoveredItem);
        }
      }
    }
  });
  function createNewLegendAndAttach(chart, legendOpts) {
    var legend = new Legend({
      ctx: chart.ctx,
      options: legendOpts,
      chart: chart
    });
    core_layouts.configure(chart, legend, legendOpts);
    core_layouts.addBox(chart, legend);
    chart.legend = legend;
  }
  var plugin_legend = {
    id: 'legend',
    _element: Legend,
    beforeInit: function (chart) {
      var legendOpts = chart.options.legend;
      if (legendOpts) {
        createNewLegendAndAttach(chart, legendOpts);
      }
    },
    beforeUpdate: function (chart) {
      var legendOpts = chart.options.legend;
      var legend = chart.legend;
      if (legendOpts) {
        helpers$1.mergeIf(legendOpts, core_defaults.global.legend);
        if (legend) {
          core_layouts.configure(chart, legend, legendOpts);
          legend.options = legendOpts;
        } else {
          createNewLegendAndAttach(chart, legendOpts);
        }
      } else if (legend) {
        core_layouts.removeBox(chart, legend);
        delete chart.legend;
      }
    },
    afterEvent: function (chart, e) {
      var legend = chart.legend;
      if (legend) {
        legend.handleEvent(e);
      }
    }
  };
  var noop$2 = helpers$1.noop;
  core_defaults._set('global', {
    title: {
      display: false,
      fontStyle: 'bold',
      fullWidth: true,
      padding: 10,
      position: 'top',
      text: '',
      weight: 2000
    }
  });
  var Title = core_element.extend({
    initialize: function (config) {
      var me = this;
      helpers$1.extend(me, config);
      me.legendHitBoxes = [];
    },
    beforeUpdate: noop$2,
    update: function (maxWidth, maxHeight, margins) {
      var me = this;
      me.beforeUpdate();
      me.maxWidth = maxWidth;
      me.maxHeight = maxHeight;
      me.margins = margins;
      me.beforeSetDimensions();
      me.setDimensions();
      me.afterSetDimensions();
      me.beforeBuildLabels();
      me.buildLabels();
      me.afterBuildLabels();
      me.beforeFit();
      me.fit();
      me.afterFit();
      me.afterUpdate();
      return me.minSize;
    },
    afterUpdate: noop$2,
    beforeSetDimensions: noop$2,
    setDimensions: function () {
      var me = this;
      if (me.isHorizontal()) {
        me.width = me.maxWidth;
        me.left = 0;
        me.right = me.width;
      } else {
        me.height = me.maxHeight;
        me.top = 0;
        me.bottom = me.height;
      }
      me.paddingLeft = 0;
      me.paddingTop = 0;
      me.paddingRight = 0;
      me.paddingBottom = 0;
      me.minSize = {
        width: 0,
        height: 0
      };
    },
    afterSetDimensions: noop$2,
    beforeBuildLabels: noop$2,
    buildLabels: noop$2,
    afterBuildLabels: noop$2,
    beforeFit: noop$2,
    fit: function () {
      var me = this;
      var opts = me.options;
      var minSize = me.minSize = {};
      var isHorizontal = me.isHorizontal();
      var lineCount, textSize;
      if (!opts.display) {
        me.width = minSize.width = me.height = minSize.height = 0;
        return;
      }
      lineCount = helpers$1.isArray(opts.text) ? opts.text.length : 1;
      textSize = lineCount * helpers$1.options._parseFont(opts).lineHeight + opts.padding * 2;
      me.width = minSize.width = isHorizontal ? me.maxWidth : textSize;
      me.height = minSize.height = isHorizontal ? textSize : me.maxHeight;
    },
    afterFit: noop$2,
    isHorizontal: function () {
      var pos = this.options.position;
      return pos === 'top' || pos === 'bottom';
    },
    draw: function () {
      var me = this;
      var ctx = me.ctx;
      var opts = me.options;
      if (!opts.display) {
        return;
      }
      var fontOpts = helpers$1.options._parseFont(opts);
      var lineHeight = fontOpts.lineHeight;
      var offset = lineHeight / 2 + opts.padding;
      var rotation = 0;
      var top = me.top;
      var left = me.left;
      var bottom = me.bottom;
      var right = me.right;
      var maxWidth, titleX, titleY;
      ctx.fillStyle = helpers$1.valueOrDefault(opts.fontColor, core_defaults.global.defaultFontColor);
      ctx.font = fontOpts.string;
      if (me.isHorizontal()) {
        titleX = left + (right - left) / 2;
        titleY = top + offset;
        maxWidth = right - left;
      } else {
        titleX = opts.position === 'left' ? left + offset : right - offset;
        titleY = top + (bottom - top) / 2;
        maxWidth = bottom - top;
        rotation = Math.PI * (opts.position === 'left' ? -0.5 : 0.5);
      }
      ctx.save();
      ctx.translate(titleX, titleY);
      ctx.rotate(rotation);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var text = opts.text;
      if (helpers$1.isArray(text)) {
        var y = 0;
        for (var i = 0; i < text.length; ++i) {
          ctx.fillText(text[i], 0, y, maxWidth);
          y += lineHeight;
        }
      } else {
        ctx.fillText(text, 0, 0, maxWidth);
      }
      ctx.restore();
    }
  });
  function createNewTitleBlockAndAttach(chart, titleOpts) {
    var title = new Title({
      ctx: chart.ctx,
      options: titleOpts,
      chart: chart
    });
    core_layouts.configure(chart, title, titleOpts);
    core_layouts.addBox(chart, title);
    chart.titleBlock = title;
  }
  var plugin_title = {
    id: 'title',
    _element: Title,
    beforeInit: function (chart) {
      var titleOpts = chart.options.title;
      if (titleOpts) {
        createNewTitleBlockAndAttach(chart, titleOpts);
      }
    },
    beforeUpdate: function (chart) {
      var titleOpts = chart.options.title;
      var titleBlock = chart.titleBlock;
      if (titleOpts) {
        helpers$1.mergeIf(titleOpts, core_defaults.global.title);
        if (titleBlock) {
          core_layouts.configure(chart, titleBlock, titleOpts);
          titleBlock.options = titleOpts;
        } else {
          createNewTitleBlockAndAttach(chart, titleOpts);
        }
      } else if (titleBlock) {
        core_layouts.removeBox(chart, titleBlock);
        delete chart.titleBlock;
      }
    }
  };
  var plugins = {};
  var filler = plugin_filler;
  var legend = plugin_legend;
  var title = plugin_title;
  plugins.filler = filler;
  plugins.legend = legend;
  plugins.title = title;
  core_controller.helpers = helpers$1;
  core_helpers();
  core_controller._adapters = core_adapters;
  core_controller.Animation = core_animation;
  core_controller.animationService = core_animations;
  core_controller.controllers = controllers;
  core_controller.DatasetController = core_datasetController;
  core_controller.defaults = core_defaults;
  core_controller.Element = core_element;
  core_controller.elements = elements;
  core_controller.Interaction = core_interaction;
  core_controller.layouts = core_layouts;
  core_controller.platform = platform;
  core_controller.plugins = core_plugins;
  core_controller.Scale = core_scale;
  core_controller.scaleService = core_scaleService;
  core_controller.Ticks = core_ticks;
  core_controller.Tooltip = core_tooltip;
  core_controller.helpers.each(scales, function (scale, type) {
    core_controller.scaleService.registerScaleType(type, scale, scale._defaults);
  });
  for (var k in plugins) {
    if (plugins.hasOwnProperty(k)) {
      core_controller.plugins.register(plugins[k]);
    }
  }
  core_controller.platform.initialize();
  var src = core_controller;
  if (typeof window !== 'undefined') {
    window.Chart = core_controller;
  }
  core_controller.Chart = core_controller;
  core_controller.Legend = plugins.legend._element;
  core_controller.Title = plugins.title._element;
  core_controller.pluginService = core_controller.plugins;
  core_controller.PluginBase = core_controller.Element.extend({});
  core_controller.canvasHelpers = core_controller.helpers.canvas;
  core_controller.layoutService = core_controller.layouts;
  core_controller.LinearScaleBase = scale_linearbase;
  core_controller.helpers.each(['Bar', 'Bubble', 'Doughnut', 'Line', 'PolarArea', 'Radar', 'Scatter'], function (klass) {
    core_controller[klass] = function (ctx, cfg) {
      return new core_controller(ctx, core_controller.helpers.merge(cfg || ({}), {
        type: klass.charAt(0).toLowerCase() + klass.slice(1)
      }));
    };
  });
  return src;
});

}
}, function(){
__fuse.r(1)
const hmr = __fuse.r(2);
hmr.connect({"useCurrentURL":true})
})