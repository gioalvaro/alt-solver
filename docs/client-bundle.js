"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
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

  // stub-builtin:fs
  var require_fs = __commonJS({
    "stub-builtin:fs"(exports, module) {
      module.exports = {};
    }
  });

  // stub-builtin:path
  var require_path = __commonJS({
    "stub-builtin:path"(exports, module) {
      module.exports = {};
    }
  });

  // node_modules/.pnpm/highs@1.8.0/node_modules/highs/build/highs.js
  var require_highs = __commonJS({
    "node_modules/.pnpm/highs@1.8.0/node_modules/highs/build/highs.js"(exports, module) {
      var Module = (() => {
        var _scriptName = typeof document != "undefined" ? document.currentScript?.src : void 0;
        if (typeof __filename != "undefined")
          _scriptName = _scriptName || __filename;
        return function(moduleArg = {}) {
          var moduleRtn;
          var g = moduleArg, aa, k, ba = new Promise((a, b) => {
            aa = a;
            k = b;
          }), ca = "object" == typeof window, da = "undefined" != typeof WorkerGlobalScope, m = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node && "renderer" != process.type;
          const q = [], ea = [];
          g.print = (a) => q.push(a);
          g.printErr = (a) => ea.push(a);
          var fa = Object.assign({}, g), ha = "./this.program", u = (a, b) => {
            throw b;
          }, v = "", ia, w;
          if (m) {
            var fs = require_fs(), ja = require_path();
            v = __dirname + "/";
            w = (a) => {
              a = ka(a) ? new URL(a) : ja.normalize(a);
              return fs.readFileSync(a);
            };
            ia = (a) => {
              a = ka(a) ? new URL(a) : ja.normalize(a);
              return new Promise((b, c) => {
                fs.readFile(a, void 0, (d, e) => {
                  d ? c(d) : b(e.buffer);
                });
              });
            };
            !g.thisProgram && 1 < process.argv.length && (ha = process.argv[1].replace(/\\/g, "/"));
            process.argv.slice(2);
            u = (a, b) => {
              process.exitCode = a;
              throw b;
            };
          } else if (ca || da)
            da ? v = self.location.href : "undefined" != typeof document && document.currentScript && (v = document.currentScript.src), _scriptName && (v = _scriptName), v = v.startsWith("blob:") ? "" : v.substr(0, v.replace(/[?#].*/, "").lastIndexOf("/") + 1), da && (w = (a) => {
              var b = new XMLHttpRequest();
              b.open("GET", a, false);
              b.responseType = "arraybuffer";
              b.send(null);
              return new Uint8Array(b.response);
            }), ia = (a) => ka(a) ? new Promise((b, c) => {
              var d = new XMLHttpRequest();
              d.open("GET", a, true);
              d.responseType = "arraybuffer";
              d.onload = () => {
                200 == d.status || 0 == d.status && d.response ? b(d.response) : c(d.status);
              };
              d.onerror = c;
              d.send(null);
            }) : fetch(a, { credentials: "same-origin" }).then((b) => b.ok ? b.arrayBuffer() : Promise.reject(Error(b.status + " : " + b.url)));
          var la = g.print || console.log.bind(console), x = g.printErr || console.error.bind(console);
          Object.assign(g, fa);
          fa = null;
          g.thisProgram && (ha = g.thisProgram);
          var oa = g.wasmBinary, pa, qa = false, ra, y, z, sa, A, B;
          function ta() {
            var a = pa.buffer;
            g.HEAP8 = y = new Int8Array(a);
            g.HEAP16 = sa = new Int16Array(a);
            g.HEAPU8 = z = new Uint8Array(a);
            g.HEAPU16 = new Uint16Array(a);
            g.HEAP32 = A = new Int32Array(a);
            g.HEAPU32 = B = new Uint32Array(a);
            g.HEAPF32 = new Float32Array(a);
            g.HEAPF64 = new Float64Array(a);
          }
          var ua = [], va = [], wa = [];
          function xa() {
            var a = g.preRun.shift();
            ua.unshift(a);
          }
          var C = 0, ya = null, D = null;
          function za(a) {
            g.onAbort?.(a);
            a = "Aborted(" + a + ")";
            x(a);
            qa = true;
            a = new WebAssembly.RuntimeError(a + ". Build with -sASSERTIONS for more info.");
            k(a);
            throw a;
          }
          var Aa = (a) => a.startsWith("data:application/octet-stream;base64,"), ka = (a) => a.startsWith("file://"), Ba;
          function Ca(a) {
            if (a == Ba && oa)
              return new Uint8Array(oa);
            if (w)
              return w(a);
            throw "both async and sync fetching of the wasm failed";
          }
          function Da(a) {
            return oa ? Promise.resolve().then(() => Ca(a)) : ia(a).then((b) => new Uint8Array(b), () => Ca(a));
          }
          function Ea(a, b, c) {
            return Da(a).then((d) => WebAssembly.instantiate(d, b)).then(c, (d) => {
              x(`failed to asynchronously prepare wasm: ${d}`);
              za(d);
            });
          }
          function Fa(a, b) {
            var c = Ba;
            return oa || "function" != typeof WebAssembly.instantiateStreaming || Aa(c) || ka(c) || m || "function" != typeof fetch ? Ea(c, a, b) : fetch(c, { credentials: "same-origin" }).then((d) => WebAssembly.instantiateStreaming(d, a).then(b, function(e) {
              x(`wasm streaming compile failed: ${e}`);
              x("falling back to ArrayBuffer instantiation");
              return Ea(c, a, b);
            }));
          }
          var E, Ga;
          class Ha {
            name = "ExitStatus";
            constructor(a) {
              this.message = `Program terminated with exit(${a})`;
              this.status = a;
            }
          }
          var Ia = (a) => {
            for (; 0 < a.length; )
              a.shift()(g);
          }, Ja = g.noExitRuntime || true;
          class Ka {
            constructor(a) {
              this.aa = a - 24;
            }
          }
          var La = 0, Ma = 0, G = () => {
            var a = A[+F >> 2];
            F += 4;
            return a;
          }, Na = (a, b) => {
            for (var c = 0, d = a.length - 1; 0 <= d; d--) {
              var e = a[d];
              "." === e ? a.splice(d, 1) : ".." === e ? (a.splice(d, 1), c++) : c && (a.splice(d, 1), c--);
            }
            if (b)
              for (; c; c--)
                a.unshift("..");
            return a;
          }, H = (a) => {
            var b = "/" === a.charAt(0), c = "/" === a.substr(-1);
            (a = Na(a.split("/").filter((d) => !!d), !b).join("/")) || b || (a = ".");
            a && c && (a += "/");
            return (b ? "/" : "") + a;
          }, Oa = (a) => {
            var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
            a = b[0];
            b = b[1];
            if (!a && !b)
              return ".";
            b &&= b.substr(0, b.length - 1);
            return a + b;
          }, Pa = (a) => {
            if ("/" === a)
              return "/";
            a = H(a);
            a = a.replace(/\/$/, "");
            var b = a.lastIndexOf("/");
            return -1 === b ? a : a.substr(b + 1);
          }, Qa = () => {
            if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues)
              return (c) => crypto.getRandomValues(c);
            if (m)
              try {
                var a = __require("crypto");
                if (a.randomFillSync)
                  return (c) => a.randomFillSync(c);
                var b = a.randomBytes;
                return (c) => (c.set(b(c.byteLength)), c);
              } catch (c) {
              }
            za("initRandomDevice");
          }, Ra = (a) => (Ra = Qa())(a), Sa = (...a) => {
            for (var b = "", c = false, d = a.length - 1; -1 <= d && !c; d--) {
              c = 0 <= d ? a[d] : "/";
              if ("string" != typeof c)
                throw new TypeError("Arguments to path.resolve must be strings");
              if (!c)
                return "";
              b = c + "/" + b;
              c = "/" === c.charAt(0);
            }
            b = Na(b.split("/").filter((e) => !!e), !c).join("/");
            return (c ? "/" : "") + b || ".";
          }, Ta = "undefined" != typeof TextDecoder ? new TextDecoder() : void 0, I = (a, b = 0) => {
            for (var c = b + NaN, d = b; a[d] && !(d >= c); )
              ++d;
            if (16 < d - b && a.buffer && Ta)
              return Ta.decode(a.subarray(b, d));
            for (c = ""; b < d; ) {
              var e = a[b++];
              if (e & 128) {
                var f = a[b++] & 63;
                if (192 == (e & 224))
                  c += String.fromCharCode((e & 31) << 6 | f);
                else {
                  var h = a[b++] & 63;
                  e = 224 == (e & 240) ? (e & 15) << 12 | f << 6 | h : (e & 7) << 18 | f << 12 | h << 6 | a[b++] & 63;
                  65536 > e ? c += String.fromCharCode(e) : (e -= 65536, c += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023));
                }
              } else
                c += String.fromCharCode(e);
            }
            return c;
          }, Ua = [], Va = (a) => {
            for (var b = 0, c = 0; c < a.length; ++c) {
              var d = a.charCodeAt(c);
              127 >= d ? b++ : 2047 >= d ? b += 2 : 55296 <= d && 57343 >= d ? (b += 4, ++c) : b += 3;
            }
            return b;
          }, J = (a, b, c, d) => {
            if (!(0 < d))
              return 0;
            var e = c;
            d = c + d - 1;
            for (var f = 0; f < a.length; ++f) {
              var h = a.charCodeAt(f);
              if (55296 <= h && 57343 >= h) {
                var n = a.charCodeAt(++f);
                h = 65536 + ((h & 1023) << 10) | n & 1023;
              }
              if (127 >= h) {
                if (c >= d)
                  break;
                b[c++] = h;
              } else {
                if (2047 >= h) {
                  if (c + 1 >= d)
                    break;
                  b[c++] = 192 | h >> 6;
                } else {
                  if (65535 >= h) {
                    if (c + 2 >= d)
                      break;
                    b[c++] = 224 | h >> 12;
                  } else {
                    if (c + 3 >= d)
                      break;
                    b[c++] = 240 | h >> 18;
                    b[c++] = 128 | h >> 12 & 63;
                  }
                  b[c++] = 128 | h >> 6 & 63;
                }
                b[c++] = 128 | h & 63;
              }
            }
            b[c] = 0;
            return c - e;
          }, Wa = [];
          function Xa(a, b) {
            Wa[a] = { input: [], output: [], V: b };
            Ya(a, Za);
          }
          var Za = { open(a) {
            var b = Wa[a.node.rdev];
            if (!b)
              throw new K(43);
            a.tty = b;
            a.seekable = false;
          }, close(a) {
            a.tty.V.fsync(a.tty);
          }, fsync(a) {
            a.tty.V.fsync(a.tty);
          }, read(a, b, c, d) {
            if (!a.tty || !a.tty.V.ma)
              throw new K(60);
            for (var e = 0, f = 0; f < d; f++) {
              try {
                var h = a.tty.V.ma(a.tty);
              } catch (n) {
                throw new K(29);
              }
              if (void 0 === h && 0 === e)
                throw new K(6);
              if (null === h || void 0 === h)
                break;
              e++;
              b[c + f] = h;
            }
            e && (a.node.timestamp = Date.now());
            return e;
          }, write(a, b, c, d) {
            if (!a.tty || !a.tty.V.ga)
              throw new K(60);
            try {
              for (var e = 0; e < d; e++)
                a.tty.V.ga(a.tty, b[c + e]);
            } catch (f) {
              throw new K(29);
            }
            d && (a.node.timestamp = Date.now());
            return e;
          } }, $a = { ma() {
            a: {
              if (!Ua.length) {
                var a = null;
                if (m) {
                  var b = Buffer.alloc(256), c = 0, d = process.stdin.fd;
                  try {
                    c = fs.readSync(d, b, 0, 256);
                  } catch (e) {
                    if (e.toString().includes("EOF"))
                      c = 0;
                    else
                      throw e;
                  }
                  0 < c && (a = b.slice(0, c).toString("utf-8"));
                } else
                  "undefined" != typeof window && "function" == typeof window.prompt && (a = window.prompt("Input: "), null !== a && (a += "\n"));
                if (!a) {
                  a = null;
                  break a;
                }
                b = Array(Va(a) + 1);
                a = J(a, b, 0, b.length);
                b.length = a;
                Ua = b;
              }
              a = Ua.shift();
            }
            return a;
          }, ga(a, b) {
            null === b || 10 === b ? (la(I(a.output)), a.output = []) : 0 != b && a.output.push(b);
          }, fsync(a) {
            a.output && 0 < a.output.length && (la(I(a.output)), a.output = []);
          }, wa() {
            return { Fa: 25856, Ha: 5, Ea: 191, Ga: 35387, Da: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
          }, xa() {
            return 0;
          }, ya() {
            return [24, 80];
          } }, ab = { ga(a, b) {
            null === b || 10 === b ? (x(I(a.output)), a.output = []) : 0 != b && a.output.push(b);
          }, fsync(a) {
            a.output && 0 < a.output.length && (x(I(a.output)), a.output = []);
          } };
          function bb(a, b) {
            var c = a.O ? a.O.length : 0;
            c >= b || (b = Math.max(b, c * (1048576 > c ? 2 : 1.125) >>> 0), 0 != c && (b = Math.max(b, 256)), c = a.O, a.O = new Uint8Array(b), 0 < a.R && a.O.set(c.subarray(0, a.R), 0));
          }
          var M = { S: null, U() {
            return M.createNode(null, "/", 16895, 0);
          }, createNode(a, b, c, d) {
            if (24576 === (c & 61440) || 4096 === (c & 61440))
              throw new K(63);
            M.S || (M.S = { dir: { node: { W: M.N.W, T: M.N.T, lookup: M.N.lookup, Z: M.N.Z, rename: M.N.rename, unlink: M.N.unlink, rmdir: M.N.rmdir, readdir: M.N.readdir, symlink: M.N.symlink }, stream: { Y: M.P.Y } }, file: { node: { W: M.N.W, T: M.N.T }, stream: { Y: M.P.Y, read: M.P.read, write: M.P.write, ia: M.P.ia, oa: M.P.oa, qa: M.P.qa } }, link: { node: { W: M.N.W, T: M.N.T, readlink: M.N.readlink }, stream: {} }, ja: {
              node: { W: M.N.W, T: M.N.T },
              stream: cb
            } });
            c = db(a, b, c, d);
            16384 === (c.mode & 61440) ? (c.N = M.S.dir.node, c.P = M.S.dir.stream, c.O = {}) : 32768 === (c.mode & 61440) ? (c.N = M.S.file.node, c.P = M.S.file.stream, c.R = 0, c.O = null) : 40960 === (c.mode & 61440) ? (c.N = M.S.link.node, c.P = M.S.link.stream) : 8192 === (c.mode & 61440) && (c.N = M.S.ja.node, c.P = M.S.ja.stream);
            c.timestamp = Date.now();
            a && (a.O[b] = c, a.timestamp = c.timestamp);
            return c;
          }, Ja(a) {
            return a.O ? a.O.subarray ? a.O.subarray(0, a.R) : new Uint8Array(a.O) : new Uint8Array(0);
          }, N: { W(a) {
            var b = {};
            b.dev = 8192 === (a.mode & 61440) ? a.id : 1;
            b.ino = a.id;
            b.mode = a.mode;
            b.nlink = 1;
            b.uid = 0;
            b.gid = 0;
            b.rdev = a.rdev;
            b.size = 16384 === (a.mode & 61440) ? 4096 : 32768 === (a.mode & 61440) ? a.R : 40960 === (a.mode & 61440) ? a.link.length : 0;
            b.atime = new Date(a.timestamp);
            b.mtime = new Date(a.timestamp);
            b.ctime = new Date(a.timestamp);
            b.ta = 4096;
            b.blocks = Math.ceil(b.size / b.ta);
            return b;
          }, T(a, b) {
            void 0 !== b.mode && (a.mode = b.mode);
            void 0 !== b.timestamp && (a.timestamp = b.timestamp);
            if (void 0 !== b.size && (b = b.size, a.R != b))
              if (0 == b)
                a.O = null, a.R = 0;
              else {
                var c = a.O;
                a.O = new Uint8Array(b);
                c && a.O.set(c.subarray(
                  0,
                  Math.min(b, a.R)
                ));
                a.R = b;
              }
          }, lookup() {
            throw eb[44];
          }, Z(a, b, c, d) {
            return M.createNode(a, b, c, d);
          }, rename(a, b, c) {
            if (16384 === (a.mode & 61440)) {
              try {
                var d = fb(b, c);
              } catch (f) {
              }
              if (d)
                for (var e in d.O)
                  throw new K(55);
            }
            delete a.parent.O[a.name];
            a.parent.timestamp = Date.now();
            a.name = c;
            b.O[c] = a;
            b.timestamp = a.parent.timestamp;
          }, unlink(a, b) {
            delete a.O[b];
            a.timestamp = Date.now();
          }, rmdir(a, b) {
            var c = fb(a, b), d;
            for (d in c.O)
              throw new K(55);
            delete a.O[b];
            a.timestamp = Date.now();
          }, readdir(a) {
            var b = [".", ".."], c;
            for (c of Object.keys(a.O))
              b.push(c);
            return b;
          }, symlink(a, b, c) {
            a = M.createNode(a, b, 41471, 0);
            a.link = c;
            return a;
          }, readlink(a) {
            if (40960 !== (a.mode & 61440))
              throw new K(28);
            return a.link;
          } }, P: { read(a, b, c, d, e) {
            var f = a.node.O;
            if (e >= a.node.R)
              return 0;
            a = Math.min(a.node.R - e, d);
            if (8 < a && f.subarray)
              b.set(f.subarray(e, e + a), c);
            else
              for (d = 0; d < a; d++)
                b[c + d] = f[e + d];
            return a;
          }, write(a, b, c, d, e, f) {
            b.buffer === y.buffer && (f = false);
            if (!d)
              return 0;
            a = a.node;
            a.timestamp = Date.now();
            if (b.subarray && (!a.O || a.O.subarray)) {
              if (f)
                return a.O = b.subarray(c, c + d), a.R = d;
              if (0 === a.R && 0 === e)
                return a.O = b.slice(c, c + d), a.R = d;
              if (e + d <= a.R)
                return a.O.set(b.subarray(c, c + d), e), d;
            }
            bb(a, e + d);
            if (a.O.subarray && b.subarray)
              a.O.set(b.subarray(c, c + d), e);
            else
              for (f = 0; f < d; f++)
                a.O[e + f] = b[c + f];
            a.R = Math.max(a.R, e + d);
            return d;
          }, Y(a, b, c) {
            1 === c ? b += a.position : 2 === c && 32768 === (a.node.mode & 61440) && (b += a.node.R);
            if (0 > b)
              throw new K(28);
            return b;
          }, ia(a, b, c) {
            bb(a.node, b + c);
            a.node.R = Math.max(a.node.R, b + c);
          }, oa(a, b, c, d, e) {
            if (32768 !== (a.node.mode & 61440))
              throw new K(43);
            a = a.node.O;
            if (e & 2 || !a || a.buffer !== y.buffer) {
              d = true;
              za();
              e = void 0;
              if (!e)
                throw new K(48);
              if (a) {
                if (0 < c || c + b < a.length)
                  a = a.subarray ? a.subarray(c, c + b) : Array.prototype.slice.call(a, c, c + b);
                y.set(a, e);
              }
            } else
              d = false, e = a.byteOffset;
            return { aa: e, Ca: d };
          }, qa(a, b, c, d) {
            M.P.write(a, b, 0, d, c, false);
            return 0;
          } } }, gb = (a, b) => {
            var c = 0;
            a && (c |= 365);
            b && (c |= 146);
            return c;
          }, hb = null, ib = {}, N = [], jb = 1, O = null, kb = false, lb = true, K = class {
            name = "ErrnoError";
            constructor(a) {
              this.X = a;
            }
          }, eb = {}, mb = {}, nb = class {
            da = {};
            node = null;
            get object() {
              return this.node;
            }
            set object(a) {
              this.node = a;
            }
            get flags() {
              return this.da.flags;
            }
            set flags(a) {
              this.da.flags = a;
            }
            get position() {
              return this.da.position;
            }
            set position(a) {
              this.da.position = a;
            }
          }, ob = class {
            N = {};
            P = {};
            ba = 365;
            ea = 146;
            $ = null;
            constructor(a, b, c, d) {
              a ||= this;
              this.parent = a;
              this.U = a.U;
              this.id = jb++;
              this.name = b;
              this.mode = c;
              this.rdev = d;
            }
            get read() {
              return (this.mode & this.ba) === this.ba;
            }
            set read(a) {
              a ? this.mode |= this.ba : this.mode &= ~this.ba;
            }
            get write() {
              return (this.mode & this.ea) === this.ea;
            }
            set write(a) {
              a ? this.mode |= this.ea : this.mode &= ~this.ea;
            }
          };
          function P(a, b = {}) {
            a = Sa(a);
            if (!a)
              return { path: "", node: null };
            b = Object.assign({ la: true, ha: 0 }, b);
            if (8 < b.ha)
              throw new K(32);
            a = a.split("/").filter((h) => !!h);
            for (var c = hb, d = "/", e = 0; e < a.length; e++) {
              var f = e === a.length - 1;
              if (f && b.parent)
                break;
              c = fb(c, a[e]);
              d = H(d + "/" + a[e]);
              c.$ && (!f || f && b.la) && (c = c.$.root);
              if (!f || b.ka) {
                for (f = 0; 40960 === (c.mode & 61440); )
                  if (c = pb(d), d = Sa(Oa(d), c), c = P(d, { ha: b.ha + 1 }).node, 40 < f++)
                    throw new K(32);
              }
            }
            return { path: d, node: c };
          }
          function qb(a) {
            for (var b; ; ) {
              if (a === a.parent)
                return a = a.U.pa, b ? "/" !== a[a.length - 1] ? `${a}/${b}` : a + b : a;
              b = b ? `${a.name}/${b}` : a.name;
              a = a.parent;
            }
          }
          function rb(a, b) {
            for (var c = 0, d = 0; d < b.length; d++)
              c = (c << 5) - c + b.charCodeAt(d) | 0;
            return (a + c >>> 0) % O.length;
          }
          function fb(a, b) {
            var c = 16384 === (a.mode & 61440) ? (c = sb(a, "x")) ? c : a.N.lookup ? 0 : 2 : 54;
            if (c)
              throw new K(c);
            for (c = O[rb(a.id, b)]; c; c = c.Aa) {
              var d = c.name;
              if (c.parent.id === a.id && d === b)
                return c;
            }
            return a.N.lookup(a, b);
          }
          function db(a, b, c, d) {
            a = new ob(a, b, c, d);
            b = rb(a.parent.id, a.name);
            a.Aa = O[b];
            return O[b] = a;
          }
          function tb(a) {
            var b = ["r", "w", "rw"][a & 3];
            a & 512 && (b += "w");
            return b;
          }
          function sb(a, b) {
            if (lb)
              return 0;
            if (!b.includes("r") || a.mode & 292) {
              if (b.includes("w") && !(a.mode & 146) || b.includes("x") && !(a.mode & 73))
                return 2;
            } else
              return 2;
            return 0;
          }
          function ub(a, b) {
            try {
              return fb(a, b), 20;
            } catch (c) {
            }
            return sb(a, "wx");
          }
          function Q(a) {
            a = N[a];
            if (!a)
              throw new K(8);
            return a;
          }
          function vb(a, b = -1) {
            a = Object.assign(new nb(), a);
            if (-1 == b)
              a: {
                for (b = 0; 4096 >= b; b++)
                  if (!N[b])
                    break a;
                throw new K(33);
              }
            a.fd = b;
            return N[b] = a;
          }
          function wb(a, b = -1) {
            a = vb(a, b);
            a.P?.Ia?.(a);
            return a;
          }
          var cb = { open(a) {
            a.P = ib[a.node.rdev].P;
            a.P.open?.(a);
          }, Y() {
            throw new K(70);
          } };
          function Ya(a, b) {
            ib[a] = { P: b };
          }
          function xb(a, b) {
            var c = "/" === b;
            if (c && hb)
              throw new K(10);
            if (!c && b) {
              var d = P(b, { la: false });
              b = d.path;
              d = d.node;
              if (d.$)
                throw new K(10);
              if (16384 !== (d.mode & 61440))
                throw new K(54);
            }
            b = { type: a, Ka: {}, pa: b, za: [] };
            a = a.U(b);
            a.U = b;
            b.root = a;
            c ? hb = a : d && (d.$ = b, d.U && d.U.za.push(b));
          }
          function yb(a, b, c) {
            var d = P(a, { parent: true }).node;
            a = Pa(a);
            if (!a || "." === a || ".." === a)
              throw new K(28);
            var e = ub(d, a);
            if (e)
              throw new K(e);
            if (!d.N.Z)
              throw new K(63);
            return d.N.Z(d, a, b, c);
          }
          function R(a) {
            return yb(a, 16895, 0);
          }
          function zb(a, b, c) {
            "undefined" == typeof c && (c = b, b = 438);
            yb(a, b | 8192, c);
          }
          function Ab(a, b) {
            if (!Sa(a))
              throw new K(44);
            var c = P(b, { parent: true }).node;
            if (!c)
              throw new K(44);
            b = Pa(b);
            var d = ub(c, b);
            if (d)
              throw new K(d);
            if (!c.N.symlink)
              throw new K(63);
            c.N.symlink(c, b, a);
          }
          function pb(a) {
            a = P(a).node;
            if (!a)
              throw new K(44);
            if (!a.N.readlink)
              throw new K(28);
            return Sa(qb(a.parent), a.N.readlink(a));
          }
          function T(a, b, c) {
            if ("" === a)
              throw new K(44);
            if ("string" == typeof b) {
              var d = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }[b];
              if ("undefined" == typeof d)
                throw Error(`Unknown file open mode: ${b}`);
              b = d;
            }
            c = b & 64 ? ("undefined" == typeof c ? 438 : c) & 4095 | 32768 : 0;
            if ("object" == typeof a)
              var e = a;
            else {
              a = H(a);
              try {
                e = P(a, { ka: !(b & 131072) }).node;
              } catch (f) {
              }
            }
            d = false;
            if (b & 64)
              if (e) {
                if (b & 128)
                  throw new K(20);
              } else
                e = yb(a, c, 0), d = true;
            if (!e)
              throw new K(44);
            8192 === (e.mode & 61440) && (b &= -513);
            if (b & 65536 && 16384 !== (e.mode & 61440))
              throw new K(54);
            if (!d && (c = e ? 40960 === (e.mode & 61440) ? 32 : 16384 === (e.mode & 61440) && ("r" !== tb(b) || b & 512) ? 31 : sb(e, tb(b)) : 44))
              throw new K(c);
            if (b & 512 && !d) {
              c = e;
              c = "string" == typeof c ? P(c, { ka: true }).node : c;
              if (!c.N.T)
                throw new K(63);
              if (16384 === (c.mode & 61440))
                throw new K(31);
              if (32768 !== (c.mode & 61440))
                throw new K(28);
              if (d = sb(c, "w"))
                throw new K(d);
              c.N.T(c, { size: 0, timestamp: Date.now() });
            }
            b &= -131713;
            e = vb({ node: e, path: qb(e), flags: b, seekable: true, position: 0, P: e.P, Ba: [], error: false });
            e.P.open && e.P.open(e);
            !g.logReadFiles || b & 1 || a in mb || (mb[a] = 1);
            return e;
          }
          function Bb(a) {
            if (null === a.fd)
              throw new K(8);
            a.fa && (a.fa = null);
            try {
              a.P.close && a.P.close(a);
            } catch (b) {
              throw b;
            } finally {
              N[a.fd] = null;
            }
            a.fd = null;
          }
          function Cb(a, b, c) {
            if (null === a.fd)
              throw new K(8);
            if (!a.seekable || !a.P.Y)
              throw new K(70);
            if (0 != c && 1 != c && 2 != c)
              throw new K(28);
            a.position = a.P.Y(a, b, c);
            a.Ba = [];
          }
          function Db(a, b, c, d, e, f) {
            if (0 > d || 0 > e)
              throw new K(28);
            if (null === a.fd)
              throw new K(8);
            if (0 === (a.flags & 2097155))
              throw new K(8);
            if (16384 === (a.node.mode & 61440))
              throw new K(31);
            if (!a.P.write)
              throw new K(28);
            a.seekable && a.flags & 1024 && Cb(a, 0, 2);
            var h = "undefined" != typeof e;
            if (!h)
              e = a.position;
            else if (!a.seekable)
              throw new K(70);
            b = a.P.write(a, b, c, d, e, f);
            h || (a.position += b);
            return b;
          }
          function Eb(a) {
            var b = {};
            b.flags = b.flags || 577;
            var c = T("m.lp", b.flags, b.mode);
            if ("string" == typeof a) {
              var d = new Uint8Array(Va(a) + 1);
              a = J(a, d, 0, d.length);
              Db(c, d, 0, a, void 0, b.ua);
            } else if (ArrayBuffer.isView(a))
              Db(c, a, 0, a.byteLength, void 0, b.ua);
            else
              throw Error("Unsupported data type");
            Bb(c);
          }
          function V(a, b, c) {
            a = H("/dev/" + a);
            var d = gb(!!b, !!c);
            V.na ?? (V.na = 64);
            var e = V.na++ << 8 | 0;
            Ya(e, { open(f) {
              f.seekable = false;
            }, close() {
              c?.buffer?.length && c(10);
            }, read(f, h, n, r) {
              for (var l = 0, p = 0; p < r; p++) {
                try {
                  var t2 = b();
                } catch (S) {
                  throw new K(29);
                }
                if (void 0 === t2 && 0 === l)
                  throw new K(6);
                if (null === t2 || void 0 === t2)
                  break;
                l++;
                h[n + p] = t2;
              }
              l && (f.node.timestamp = Date.now());
              return l;
            }, write(f, h, n, r) {
              for (var l = 0; l < r; l++)
                try {
                  c(h[n + l]);
                } catch (p) {
                  throw new K(29);
                }
              r && (f.node.timestamp = Date.now());
              return l;
            } });
            zb(a, d, e);
          }
          var W = {}, F = void 0, Fb = 0, X = {}, Gb = (a) => {
            ra = a;
            Ja || 0 < Fb || (g.onExit?.(a), qa = true);
            u(a, new Ha(a));
          }, Hb = (a) => {
            if (!qa)
              try {
                if (a(), !(Ja || 0 < Fb))
                  try {
                    ra = a = ra, Gb(a);
                  } catch (b) {
                    b instanceof Ha || "unwind" == b || u(1, b);
                  }
              } catch (b) {
                b instanceof Ha || "unwind" == b || u(1, b);
              }
          }, Ib = {}, Kb = () => {
            if (!Jb) {
              var a = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", _: ha || "./this.program" }, b;
              for (b in Ib)
                void 0 === Ib[b] ? delete a[b] : a[b] = Ib[b];
              var c = [];
              for (b in a)
                c.push(`${b}=${a[b]}`);
              Jb = c;
            }
            return Jb;
          }, Jb, Ob = (a, b, c, d) => {
            var e = { string: (l) => {
              var p = 0;
              if (null !== l && void 0 !== l && 0 !== l) {
                p = Va(l) + 1;
                var t2 = Lb(p);
                J(l, z, t2, p);
                p = t2;
              }
              return p;
            }, array: (l) => {
              var p = Lb(l.length);
              y.set(l, p);
              return p;
            } };
            a = g["_" + a];
            var f = [], h = 0;
            if (d)
              for (var n = 0; n < d.length; n++) {
                var r = e[c[n]];
                r ? (0 === h && (h = Mb()), f[n] = r(d[n])) : f[n] = d[n];
              }
            c = a(...f);
            return c = function(l) {
              0 !== h && Nb(h);
              return "string" === b ? l ? I(z, l) : "" : "boolean" === b ? !!l : l;
            }(c);
          };
          [44].forEach((a) => {
            eb[a] = new K(a);
            eb[a].stack = "<generic error, no stack>";
          });
          O = Array(4096);
          xb(M, "/");
          R("/tmp");
          R("/home");
          R("/home/web_user");
          (function() {
            R("/dev");
            Ya(259, { read: () => 0, write: (d, e, f, h) => h });
            zb("/dev/null", 259);
            Xa(1280, $a);
            Xa(1536, ab);
            zb("/dev/tty", 1280);
            zb("/dev/tty1", 1536);
            var a = new Uint8Array(1024), b = 0, c = () => {
              0 === b && (b = Ra(a).byteLength);
              return a[--b];
            };
            V("random", c);
            V("urandom", c);
            R("/dev/shm");
            R("/dev/shm/tmp");
          })();
          (function() {
            R("/proc");
            var a = R("/proc/self");
            R("/proc/self/fd");
            xb({ U() {
              var b = db(a, "fd", 16895, 73);
              b.N = { lookup(c, d) {
                var e = Q(+d);
                c = { parent: null, U: { pa: "fake" }, N: { readlink: () => e.path } };
                return c.parent = c;
              } };
              return b;
            } }, "/proc/self/fd");
          })();
          var Qb = {
            a: (a, b, c) => {
              var d = new Ka(a);
              B[d.aa + 16 >> 2] = 0;
              B[d.aa + 4 >> 2] = b;
              B[d.aa + 8 >> 2] = c;
              La = a;
              Ma++;
              throw La;
            },
            d: function(a, b, c) {
              F = c;
              try {
                var d = Q(a);
                switch (b) {
                  case 0:
                    var e = G();
                    if (0 > e)
                      break;
                    for (; N[e]; )
                      e++;
                    return wb(d, e).fd;
                  case 1:
                  case 2:
                    return 0;
                  case 3:
                    return d.flags;
                  case 4:
                    return e = G(), d.flags |= e, 0;
                  case 12:
                    return e = G(), sa[e + 0 >> 1] = 2, 0;
                  case 13:
                  case 14:
                    return 0;
                }
                return -28;
              } catch (f) {
                if ("undefined" == typeof W || "ErrnoError" !== f.name)
                  throw f;
                return -f.X;
              }
            },
            g: function(a, b, c) {
              F = c;
              try {
                var d = Q(a);
                switch (b) {
                  case 21509:
                    return d.tty ? 0 : -59;
                  case 21505:
                    if (!d.tty)
                      return -59;
                    if (d.tty.V.wa) {
                      a = [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                      var e = G();
                      A[e >> 2] = 25856;
                      A[e + 4 >> 2] = 5;
                      A[e + 8 >> 2] = 191;
                      A[e + 12 >> 2] = 35387;
                      for (var f = 0; 32 > f; f++)
                        y[e + f + 17] = a[f] || 0;
                    }
                    return 0;
                  case 21510:
                  case 21511:
                  case 21512:
                    return d.tty ? 0 : -59;
                  case 21506:
                  case 21507:
                  case 21508:
                    if (!d.tty)
                      return -59;
                    if (d.tty.V.xa)
                      for (e = G(), a = [], f = 0; 32 > f; f++)
                        a.push(y[e + f + 17]);
                    return 0;
                  case 21519:
                    if (!d.tty)
                      return -59;
                    e = G();
                    return A[e >> 2] = 0;
                  case 21520:
                    return d.tty ? -28 : -59;
                  case 21531:
                    e = G();
                    if (!d.P.va)
                      throw new K(59);
                    return d.P.va(d, b, e);
                  case 21523:
                    if (!d.tty)
                      return -59;
                    d.tty.V.ya && (f = [24, 80], e = G(), sa[e >> 1] = f[0], sa[e + 2 >> 1] = f[1]);
                    return 0;
                  case 21524:
                    return d.tty ? 0 : -59;
                  case 21515:
                    return d.tty ? 0 : -59;
                  default:
                    return -28;
                }
              } catch (h) {
                if ("undefined" == typeof W || "ErrnoError" !== h.name)
                  throw h;
                return -h.X;
              }
            },
            h: function(a, b, c, d) {
              F = d;
              try {
                b = b ? I(z, b) : "";
                var e = b;
                if ("/" === e.charAt(0))
                  b = e;
                else {
                  var f = -100 === a ? "/" : Q(a).path;
                  if (0 == e.length)
                    throw new K(44);
                  b = H(f + "/" + e);
                }
                var h = d ? G() : 0;
                return T(
                  b,
                  c,
                  h
                ).fd;
              } catch (n) {
                if ("undefined" == typeof W || "ErrnoError" !== n.name)
                  throw n;
                return -n.X;
              }
            },
            k: () => {
              za("");
            },
            o: () => 1,
            t: (a, b, c) => z.copyWithin(a, b, b + c),
            m: () => {
              Ja = false;
              Fb = 0;
            },
            n: (a, b) => {
              X[a] && (clearTimeout(X[a].id), delete X[a]);
              if (!b)
                return 0;
              var c = setTimeout(() => {
                delete X[a];
                Hb(() => Pb(a, performance.now()));
              }, b);
              X[a] = { id: c, La: b };
              return 0;
            },
            p: (a, b, c, d) => {
              var e = (/* @__PURE__ */ new Date()).getFullYear(), f = new Date(e, 0, 1).getTimezoneOffset();
              e = new Date(e, 6, 1).getTimezoneOffset();
              B[a >> 2] = 60 * Math.max(f, e);
              A[b >> 2] = Number(f != e);
              b = (h) => {
                var n = Math.abs(h);
                return `UTC${0 <= h ? "-" : "+"}${String(Math.floor(n / 60)).padStart(2, "0")}${String(n % 60).padStart(2, "0")}`;
              };
              a = b(f);
              b = b(e);
              e < f ? (J(a, z, c, 17), J(b, z, d, 17)) : (J(a, z, d, 17), J(b, z, c, 17));
            },
            e: () => Date.now(),
            c: () => performance.now(),
            u: (a) => {
              var b = z.length;
              a >>>= 0;
              if (2147483648 < a)
                return false;
              for (var c = 1; 4 >= c; c *= 2) {
                var d = b * (1 + 0.2 / c);
                d = Math.min(d, a + 100663296);
                a: {
                  d = (Math.min(2147483648, 65536 * Math.ceil(Math.max(a, d) / 65536)) - pa.buffer.byteLength + 65535) / 65536 | 0;
                  try {
                    pa.grow(d);
                    ta();
                    var e = 1;
                    break a;
                  } catch (f) {
                  }
                  e = void 0;
                }
                if (e)
                  return true;
              }
              return false;
            },
            q: (a, b) => {
              var c = 0;
              Kb().forEach((d, e) => {
                var f = b + c;
                e = B[a + 4 * e >> 2] = f;
                for (f = 0; f < d.length; ++f)
                  y[e++] = d.charCodeAt(f);
                y[e] = 0;
                c += d.length + 1;
              });
              return 0;
            },
            r: (a, b) => {
              var c = Kb();
              B[a >> 2] = c.length;
              var d = 0;
              c.forEach((e) => d += e.length + 1);
              B[b >> 2] = d;
              return 0;
            },
            b: (a) => {
              ra = a;
              Gb(a);
            },
            f: function(a) {
              try {
                var b = Q(a);
                Bb(b);
                return 0;
              } catch (c) {
                if ("undefined" == typeof W || "ErrnoError" !== c.name)
                  throw c;
                return c.X;
              }
            },
            s: function(a, b, c, d) {
              try {
                a: {
                  var e = Q(a);
                  a = b;
                  for (var f, h = b = 0; h < c; h++) {
                    var n = B[a >> 2], r = B[a + 4 >> 2];
                    a += 8;
                    var l = e, p = f, t2 = y;
                    if (0 > r || 0 > p)
                      throw new K(28);
                    if (null === l.fd)
                      throw new K(8);
                    if (1 === (l.flags & 2097155))
                      throw new K(8);
                    if (16384 === (l.node.mode & 61440))
                      throw new K(31);
                    if (!l.P.read)
                      throw new K(28);
                    var S = "undefined" != typeof p;
                    if (!S)
                      p = l.position;
                    else if (!l.seekable)
                      throw new K(70);
                    var ma = l.P.read(l, t2, n, r, p);
                    S || (l.position += ma);
                    var L = ma;
                    if (0 > L) {
                      var na = -1;
                      break a;
                    }
                    b += L;
                    if (L < r)
                      break;
                    "undefined" != typeof f && (f += L);
                  }
                  na = b;
                }
                B[d >> 2] = na;
                return 0;
              } catch (U) {
                if ("undefined" == typeof W || "ErrnoError" !== U.name)
                  throw U;
                return U.X;
              }
            },
            j: function(a, b, c, d, e) {
              b = c + 2097152 >>> 0 < 4194305 - !!b ? (b >>> 0) + 4294967296 * c : NaN;
              try {
                if (isNaN(b))
                  return 61;
                var f = Q(a);
                Cb(f, b, d);
                Ga = [f.position >>> 0, (E = f.position, 1 <= +Math.abs(E) ? 0 < E ? +Math.floor(E / 4294967296) >>> 0 : ~~+Math.ceil((E - +(~~E >>> 0)) / 4294967296) >>> 0 : 0)];
                A[e >> 2] = Ga[0];
                A[e + 4 >> 2] = Ga[1];
                f.fa && 0 === b && 0 === d && (f.fa = null);
                return 0;
              } catch (h) {
                if ("undefined" == typeof W || "ErrnoError" !== h.name)
                  throw h;
                return h.X;
              }
            },
            i: function(a, b, c, d) {
              try {
                a: {
                  var e = Q(a);
                  a = b;
                  for (var f, h = b = 0; h < c; h++) {
                    var n = B[a >> 2], r = B[a + 4 >> 2];
                    a += 8;
                    var l = Db(e, y, n, r, f);
                    if (0 > l) {
                      var p = -1;
                      break a;
                    }
                    b += l;
                    if (l < r)
                      break;
                    "undefined" != typeof f && (f += l);
                  }
                  p = b;
                }
                B[d >> 2] = p;
                return 0;
              } catch (t2) {
                if ("undefined" == typeof W || "ErrnoError" !== t2.name)
                  throw t2;
                return t2.X;
              }
            },
            l: Gb
          }, Y = function() {
            function a(c) {
              Y = c.exports;
              pa = Y.v;
              ta();
              va.unshift(Y.w);
              C--;
              g.monitorRunDependencies?.(C);
              0 == C && (null !== ya && (clearInterval(ya), ya = null), D && (c = D, D = null, c()));
              return Y;
            }
            var b = { a: Qb };
            C++;
            g.monitorRunDependencies?.(C);
            if (g.instantiateWasm)
              try {
                return g.instantiateWasm(b, a);
              } catch (c) {
                x(`Module.instantiateWasm callback failed with error: ${c}`), k(c);
              }
            Ba ??= Aa("highs.wasm") ? "highs.wasm" : g.locateFile ? g.locateFile("highs.wasm", v) : v + "highs.wasm";
            Fa(b, function(c) {
              a(c.instance);
            }).catch(k);
            return {};
          }(), Rb = g._Highs_create = () => (Rb = g._Highs_create = Y.x)(), Sb = g._Highs_destroy = (a) => (Sb = g._Highs_destroy = Y.y)(a), Tb = g._Highs_run = (a) => (Tb = g._Highs_run = Y.z)(a);
          g._Highs_readModel = (a, b) => (g._Highs_readModel = Y.A)(a, b);
          g._Highs_writeSolution = (a, b) => (g._Highs_writeSolution = Y.B)(a, b);
          g._Highs_writeSolutionPretty = (a, b) => (g._Highs_writeSolutionPretty = Y.C)(a, b);
          g._Highs_setBoolOptionValue = (a, b, c) => (g._Highs_setBoolOptionValue = Y.D)(a, b, c);
          g._Highs_setIntOptionValue = (a, b, c) => (g._Highs_setIntOptionValue = Y.E)(a, b, c);
          g._Highs_setDoubleOptionValue = (a, b, c) => (g._Highs_setDoubleOptionValue = Y.F)(a, b, c);
          g._Highs_setStringOptionValue = (a, b, c) => (g._Highs_setStringOptionValue = Y.G)(a, b, c);
          var Ub = g._Highs_getModelStatus = (a) => (Ub = g._Highs_getModelStatus = Y.H)(a);
          g._Highs_call = (a, b, c, d, e, f, h, n, r, l, p, t2, S, ma, L, na, U, $b) => (g._Highs_call = Y.I)(a, b, c, d, e, f, h, n, r, l, p, t2, S, ma, L, na, U, $b);
          var Pb = (a, b) => (Pb = Y.J)(a, b), Nb = (a) => (Nb = Y.K)(a), Lb = (a) => (Lb = Y.L)(a), Mb = () => (Mb = Y.M)();
          g.cwrap = (a, b, c, d) => {
            var e = !c || c.every((f) => "number" === f || "boolean" === f);
            return "string" !== b && e && !d ? g["_" + a] : (...f) => Ob(a, b, c, f);
          };
          var Vb;
          D = function Wb() {
            Vb || Xb();
            Vb || (D = Wb);
          };
          function Xb() {
            function a() {
              if (!Vb && (Vb = true, g.calledRun = true, !qa)) {
                if (!g.noFSInit && !kb) {
                  var b, c;
                  kb = true;
                  d ??= g.stdin;
                  b ??= g.stdout;
                  c ??= g.stderr;
                  d ? V("stdin", d) : Ab("/dev/tty", "/dev/stdin");
                  b ? V("stdout", null, b) : Ab("/dev/tty", "/dev/stdout");
                  c ? V("stderr", null, c) : Ab("/dev/tty1", "/dev/stderr");
                  T("/dev/stdin", 0);
                  T("/dev/stdout", 1);
                  T("/dev/stderr", 1);
                }
                lb = false;
                Ia(va);
                aa(g);
                g.onRuntimeInitialized?.();
                if (g.postRun)
                  for ("function" == typeof g.postRun && (g.postRun = [g.postRun]); g.postRun.length; ) {
                    var d = g.postRun.shift();
                    wa.unshift(d);
                  }
                Ia(wa);
              }
            }
            if (!(0 < C)) {
              if (g.preRun)
                for ("function" == typeof g.preRun && (g.preRun = [g.preRun]); g.preRun.length; )
                  xa();
              Ia(ua);
              0 < C || (g.setStatus ? (g.setStatus("Running..."), setTimeout(() => {
                setTimeout(() => g.setStatus(""), 1);
                a();
              }, 1)) : a());
            }
          }
          if (g.preInit)
            for ("function" == typeof g.preInit && (g.preInit = [g.preInit]); 0 < g.preInit.length; )
              g.preInit.pop()();
          Xb();
          g.ra = g.cwrap("Highs_readModel", "number", ["number", "string"]);
          const Yb = g.cwrap("Highs_setIntOptionValue", "number", ["number", "string", "number"]), Zb = g.cwrap("Highs_setDoubleOptionValue", "number", ["number", "string", "number"]), ac = g.cwrap("Highs_setStringOptionValue", "number", ["number", "string", "string"]), bc = g.cwrap("Highs_setBoolOptionValue", "number", ["number", "string", "number"]);
          g.sa = g.cwrap("Highs_writeSolutionPretty", "number", ["number", "string"]);
          const cc = { 0: "Not Set", 1: "Load error", 2: "Model error", 3: "Presolve error", 4: "Solve error", 5: "Postsolve error", 6: "Empty", 7: "Optimal", 8: "Infeasible", 9: "Primal infeasible or unbounded", 10: "Unbounded", 11: "Bound on objective reached", 12: "Target for objective reached", 13: "Time limit reached", 14: "Iteration limit reached", 15: "Unknown" };
          g.solve = function(a, b) {
            Eb(a);
            const c = Rb();
            dc(() => g.ra(c, "m.lp"), "read LP model (see http://web.mit.edu/lpsolve/doc/CPLEX-format.htm)");
            a = b || {};
            for (const d in a) {
              const e = a[d];
              b = typeof e;
              let f;
              if ("number" === b)
                f = ec;
              else if ("boolean" === b)
                f = bc;
              else if ("string" === b)
                f = ac;
              else
                throw Error(`Unsupported option value type ${e} for '${d}'`);
              dc(() => f(c, d, e), `set option '${d}'`);
            }
            dc(() => Tb(c), "solve the problem");
            a = cc[Ub(c, 0)] || "Unknown";
            q.length = 0;
            dc(() => g.sa(c, ""), "write and extract solution");
            Sb(c);
            a = fc(a);
            q.length = 0;
            ea.length = 0;
            return a;
          };
          function ec(a, b, c) {
            let d = Zb(a, b, c);
            -1 === d && c === (c | 0) && (d = Yb(a, b, c));
            return d;
          }
          function Z(a) {
            return "inf" === a ? 1 / 0 : "-inf" === a ? -1 / 0 : +a;
          }
          const gc = { Index: (a) => parseInt(a), Lower: Z, Upper: Z, Primal: Z, Dual: Z };
          function hc(a, b) {
            const c = b.match(/[^\s]+/g) || [], d = {};
            for (let f = 0; f < c.length; f++) {
              if (f >= a.length)
                throw Error("Unable to parse solution line: " + b);
              var e = c[f];
              const h = a[f], n = gc[h];
              e = n ? n(e) : e;
              d[h] = e;
            }
            return d;
          }
          function fc(a) {
            if (3 > q.length)
              throw Error("Unable to parse solution. Too few lines.");
            let b = ic(q[1], q[2]);
            a = { Status: a, Columns: {}, Rows: [], ObjectiveValue: NaN };
            for (var c = 2; "Rows" != q[c]; c++) {
              const d = hc(b, q[c]);
              d.Type || (d.Type = "Continuous");
              a.Columns[d.Name] = d;
            }
            b = ic(q[c + 1], q[c + 2]);
            for (c += 2; "" != q[c]; c++)
              a.Rows.push(hc(b, q[c]));
            a.ObjectiveValue = Z(q[c + 3].match(/Objective value: (.+)/)[1]);
            return a;
          }
          function ic(a, b) {
            return [...a.matchAll(/[^\s]+/g)].filter((c) => " " !== b[c.index] || " " !== b[c.index + c[0].length - 1]).map((c) => c[0]);
          }
          function dc(a, b) {
            let c;
            try {
              c = a();
            } catch (d) {
              c = d;
            }
            if (0 !== c && 1 !== c)
              throw Error("Unable to " + b + ". HiGHS error " + c);
          }
          moduleRtn = ba;
          return moduleRtn;
        };
      })();
      if (typeof exports === "object" && typeof module === "object")
        module.exports = Module;
      else if (typeof define === "function" && define["amd"])
        define([], () => Module);
    }
  });

  // src/shared/a1.ts
  var CELL = /\$?[A-Z]{1,3}\$?[1-9][0-9]{0,6}/;
  var SHEET_UNQUOTED = /[A-Za-z_][A-Za-z0-9_]*/;
  var SHEET_QUOTED = /'[^']+'/;
  var SHEET = new RegExp(`(?:${SHEET_QUOTED.source}|${SHEET_UNQUOTED.source})`);
  var FULL = new RegExp(
    `^(?:(${SHEET.source})!)?(${CELL.source})(?::(${CELL.source}))?$`
  );
  function isValidA1(ref) {
    return FULL.test(ref);
  }

  // src/shared/constants.ts
  var SCHEMA_VERSION = 1;
  var DEFAULT_OPTIONS = {
    assumeNonNegative: true,
    timeLimitSec: 100,
    iterLimit: null,
    mipGap: 1e-4,
    integerTolerance: 1e-6
  };

  // src/shared/model-schema.ts
  function blankModelDocument(sheetId, _sheetName) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      version: SCHEMA_VERSION,
      sheetId,
      objective: { cellA1: "", sense: "MIN", targetValue: null },
      variables: { rangeA1: "", names: [], assumeNonNegative: true },
      constraints: [],
      options: { ...DEFAULT_OPTIONS },
      meta: { createdAt: now, updatedAt: now, solvedAt: null, locale: "es" }
    };
  }
  function validateModelDocument(doc) {
    const errors = [];
    if (!doc || typeof doc !== "object")
      return { ok: false, errors: ["root must be an object"] };
    const d = doc;
    if (d.version !== SCHEMA_VERSION)
      errors.push(`version must be ${SCHEMA_VERSION}`);
    if (typeof d.sheetId !== "number")
      errors.push("sheetId must be a number");
    const obj = d.objective;
    if (!obj) {
      errors.push("objective missing");
    } else {
      if (typeof obj.cellA1 !== "string" || obj.cellA1 !== "" && !isValidA1(obj.cellA1)) {
        errors.push("objective.cellA1 must be empty or valid A1");
      }
      if (obj.sense !== "MAX" && obj.sense !== "MIN" && obj.sense !== "TARGET") {
        errors.push("objective.sense must be MAX|MIN|TARGET");
      }
      if (obj.sense === "TARGET" && typeof obj.targetValue !== "number") {
        errors.push("objective.targetValue required when sense=TARGET");
      }
    }
    const vars = d.variables;
    if (!vars) {
      errors.push("variables missing");
    } else {
      if (typeof vars.rangeA1 !== "string" || vars.rangeA1 !== "" && !isValidA1(vars.rangeA1)) {
        errors.push("variables.rangeA1 must be empty or valid A1");
      }
      if (!Array.isArray(vars.names))
        errors.push("variables.names must be array");
      if (typeof vars.assumeNonNegative !== "boolean")
        errors.push("variables.assumeNonNegative must be boolean");
    }
    const cons = d.constraints;
    if (!Array.isArray(cons)) {
      errors.push("constraints must be array");
    } else {
      cons.forEach((c, i) => {
        const cc = c;
        if (typeof cc.lhsA1 !== "string" || !isValidA1(cc.lhsA1)) {
          errors.push(`constraints[${i}].lhsA1 invalid`);
        }
        if (cc.op === "<=" || cc.op === "=" || cc.op === ">=") {
          if (cc.type !== "linear")
            errors.push(`constraints[${i}].type must be 'linear' for op ${cc.op}`);
          if (typeof cc.rhsA1OrValue !== "string" || cc.rhsA1OrValue === "") {
            errors.push(`constraints[${i}].rhsA1OrValue required`);
          }
        } else if (cc.op === "int" || cc.op === "bin") {
        } else {
          errors.push(`constraints[${i}].op invalid`);
        }
      });
    }
    const opt = d.options;
    if (!opt) {
      errors.push("options missing");
    } else {
      if (typeof opt.assumeNonNegative !== "boolean")
        errors.push("options.assumeNonNegative must be boolean");
      if (typeof opt.timeLimitSec !== "number" || opt.timeLimitSec <= 0) {
        errors.push("options.timeLimitSec must be > 0");
      }
      if (opt.iterLimit !== null && (typeof opt.iterLimit !== "number" || opt.iterLimit <= 0)) {
        errors.push("options.iterLimit must be null or > 0");
      }
      if (typeof opt.mipGap !== "number" || opt.mipGap < 0)
        errors.push("options.mipGap must be \u2265 0");
      if (typeof opt.integerTolerance !== "number" || opt.integerTolerance <= 0) {
        errors.push("options.integerTolerance must be > 0");
      }
    }
    return errors.length === 0 ? { ok: true } : { ok: false, errors };
  }

  // src/client/state/model-draft.ts
  var ModelDraft = class _ModelDraft {
    doc;
    constructor(doc) {
      this.doc = doc;
    }
    static fromBlank(sheetId, sheetName) {
      return new _ModelDraft(blankModelDocument(sheetId, sheetName));
    }
    static fromJson(raw) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }
      const v = validateModelDocument(parsed);
      if (!v.ok)
        return null;
      return new _ModelDraft(parsed);
    }
    toDocument() {
      return this.doc;
    }
    toJson() {
      return JSON.stringify(this.doc);
    }
    touch() {
      this.doc.meta.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    setObjective(o) {
      this.doc.objective = { ...o };
      this.touch();
    }
    setVariables(v) {
      this.doc.variables = { ...v };
      this.touch();
    }
    setOptions(o) {
      this.doc.options = { ...this.doc.options, ...o };
      this.touch();
    }
    addConstraint(c) {
      this.doc.constraints.push(c);
      this.touch();
    }
    updateConstraint(index, c) {
      if (index < 0 || index >= this.doc.constraints.length) {
        throw new Error(`updateConstraint: index ${index} out of bounds`);
      }
      this.doc.constraints[index] = c;
      this.touch();
    }
    removeConstraint(index) {
      if (index < 0 || index >= this.doc.constraints.length) {
        throw new Error(`removeConstraint: index ${index} out of bounds`);
      }
      this.doc.constraints.splice(index, 1);
      this.touch();
    }
  };

  // src/client/i18n/es.json
  var es_default = {
    "dialog.title": "AltSolver \u2014 Par\xE1metros",
    "label.objective": "Celda objetivo",
    "label.sense": "Optimizar",
    "sense.max": "M\xE1x",
    "sense.min": "M\xEDn",
    "sense.target": "Valor de",
    "label.variables": "Celdas de variables",
    "label.constraints": "Sujeto a las restricciones",
    "btn.add": "Agregar",
    "btn.edit": "Cambiar",
    "btn.remove": "Eliminar",
    "btn.resetAll": "Restablecer todo",
    "label.assumeNonNegative": "Convertir variables sin restricciones en no negativas",
    "label.method": "M\xE9todo de resoluci\xF3n",
    "method.simplexLp": "Simplex LP (HiGHS)",
    "btn.options": "Opciones\u2026",
    "btn.cancel": "Cerrar",
    "btn.solve": "Resolver",
    "btn.solve.disabled": "Pr\xF3ximamente (MVP-0.1)",
    "btn.save": "Guardar modelo",
    "btn.load": "Cargar/Guardar",
    "constraint.modal.title": "Restricci\xF3n",
    "constraint.lhs": "Referencia de la celda",
    "constraint.op": "Restricci\xF3n",
    "constraint.rhs": "Valor",
    "constraint.intHint": "Las celdas referenciadas deben ser variables enteras.",
    "constraint.binHint": "Las celdas referenciadas deben ser variables binarias (0/1).",
    "options.modal.title": "Opciones del Solver",
    "options.timeLimit": "Tiempo m\xE1ximo (s)",
    "options.iterLimit": "Iteraciones m\xE1ximas (vac\xEDo = sin l\xEDmite)",
    "options.mipGap": "Gap MIP relativo",
    "options.integerTolerance": "Tolerancia entera",
    "msg.saved": "Modelo guardado",
    "msg.invalidA1": "Referencia inv\xE1lida",
    "msg.targetValueRequired": "Indic\xE1 el valor objetivo",
    "err.objective_empty": "Defin\xED la celda objetivo antes de resolver.",
    "err.variables_empty": "Defin\xED al menos una celda de variable.",
    "err.a1_invalid": "Referencia inv\xE1lida.",
    "err.eval_not_number": "La celda {cell} no devuelve un n\xFAmero (valor: {value}). Revis\xE1 la f\xF3rmula.",
    "err.var_has_formula": "Las celdas de variables no pueden contener f\xF3rmulas. Encontradas: {cells}.",
    "err.linearity_warning": "El modelo no parece lineal en la celda {cell}. Los resultados podr\xEDan ser incorrectos.",
    "err.integrality_outside_vars": "La restricci\xF3n {reason} apunta a una celda fuera del rango de variables.",
    "err.solver_infeasible": "El modelo no tiene soluci\xF3n factible. Revis\xE1 restricciones contradictorias.",
    "err.solver_unbounded": "La funci\xF3n objetivo es no acotada. Probablemente falta una cota superior en alguna variable.",
    "err.solver_time_limit_feasible": "Soluci\xF3n encontrada pero no \xF3ptima (se agot\xF3 el tiempo). Gap actual: {gap}.",
    "err.solver_time_limit_no_feasible": "Se agot\xF3 el tiempo sin encontrar una soluci\xF3n factible. Prob\xE1 aumentar el tiempo m\xE1ximo en Opciones.",
    "err.solver_error": "Error interno del solver.",
    "err.rpc_failed": "Error de comunicaci\xF3n con la hoja. Reintentando\u2026",
    "err.wasm_load_failed": "El navegador no pudo cargar el motor de c\xE1lculo. Prob\xE1 refrescar o usar Chrome/Firefox actualizado.",
    "err.quota_exceeded": "Google limit\xF3 las operaciones del add-on. Esper\xE1 unos minutos."
  };

  // src/client/i18n/i18n.ts
  var bundles = { es: es_default };
  var active = bundles.es;
  function setLocale(locale) {
    const lang = (locale || "es").slice(0, 2);
    active = bundles[lang] ?? bundles.es;
  }
  function t(key) {
    return active[key] ?? key;
  }

  // src/client/rpc/server-bridge.ts
  function call(fnName, ...args) {
    return new Promise((resolve, reject) => {
      const runner = google.script.run.withSuccessHandler((r) => resolve(r)).withFailureHandler((err) => reject(err));
      runner[fnName](...args);
    });
  }
  function getActiveSheetContext() {
    return call("getActiveSheetContext");
  }
  function saveModel(jsonString) {
    return call("saveModel", jsonString);
  }
  function getActiveRangeA1() {
    return call("getActiveRangeA1");
  }
  function extractLinearForm(modelDoc) {
    return call("extractLinearForm", modelDoc);
  }
  function writeResults(req) {
    return call("writeResults", req);
  }
  function restoreSnapshot(modelDoc, snapshot) {
    return call("restoreSnapshot", modelDoc, snapshot);
  }
  function preflight(modelDoc) {
    return call("preflight", modelDoc);
  }
  function listTemplates() {
    return call("listTemplates");
  }
  function insertTemplate(id) {
    return call("insertTemplate", id);
  }
  function applyHighlights(prevSnapshot, items) {
    return call("applyHighlights", prevSnapshot, items);
  }
  function clearHighlights(snapshot) {
    return call("clearHighlights", snapshot);
  }

  // src/client/ui/range-picker.ts
  function makeRangePicker(input, button) {
    let inflight = false;
    const originalLabel = button.innerHTML;
    return {
      isPicking() {
        return inflight;
      },
      async toggle() {
        if (inflight)
          return;
        inflight = true;
        button.classList.add("capturing");
        button.setAttribute("aria-disabled", "true");
        button.innerHTML = '<span class="pick-spinner"></span>';
        const oldTitle = button.title;
        button.title = "Leyendo selecci\xF3n\u2026";
        try {
          const a1 = await getActiveRangeA1();
          if (a1) {
            input.value = a1;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        } catch {
        } finally {
          inflight = false;
          button.classList.remove("capturing");
          button.removeAttribute("aria-disabled");
          button.innerHTML = originalLabel;
          button.title = oldTitle || "Capturar selecci\xF3n de la hoja";
        }
      }
    };
  }

  // src/client/ui/constraint-modal.ts
  var OPS = ["<=", "=", ">=", "int", "bin"];
  function openConstraintModal(parent, opts) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${t("constraint.modal.title")}">
      <h2>${t("constraint.modal.title")}</h2>
      <div class="row">
        <label for="lhs">${t("constraint.lhs")}</label>
        <div class="input-row">
          <input id="lhs" type="text" autocomplete="off" />
          <button type="button" data-action="pick-lhs">\u2316</button>
        </div>
        <div class="hint" id="lhsError"></div>
      </div>
      <div class="row">
        <label for="op">${t("constraint.op")}</label>
        <select id="op">
          ${OPS.map((o) => `<option value="${o}">${o}</option>`).join("")}
        </select>
      </div>
      <div class="row" id="rhsRow">
        <label for="rhs">${t("constraint.rhs")}</label>
        <div class="input-row">
          <input id="rhs" type="text" autocomplete="off" />
          <button type="button" data-action="pick-rhs">\u2316</button>
        </div>
        <div class="hint" id="rhsError"></div>
      </div>
      <div class="row" id="opHint" style="display:none;"></div>
      <div class="actions">
        <button type="button" data-action="cancel">${t("btn.cancel")}</button>
        <button type="button" data-action="accept" class="primary">OK</button>
      </div>
    </div>
  `;
    parent.appendChild(overlay);
    const lhs = overlay.querySelector("#lhs");
    const op = overlay.querySelector("#op");
    const rhs = overlay.querySelector("#rhs");
    const rhsRow = overlay.querySelector("#rhsRow");
    const opHint = overlay.querySelector("#opHint");
    const lhsError = overlay.querySelector("#lhsError");
    const rhsError = overlay.querySelector("#rhsError");
    if (opts.initial) {
      lhs.value = opts.initial.lhsA1;
      op.value = opts.initial.op;
      if (opts.initial.op !== "int" && opts.initial.op !== "bin") {
        rhs.value = opts.initial.rhsA1OrValue;
      }
    }
    function applyOpVisibility() {
      const o = op.value;
      if (o === "int") {
        rhsRow.style.display = "none";
        opHint.style.display = "";
        opHint.textContent = t("constraint.intHint");
      } else if (o === "bin") {
        rhsRow.style.display = "none";
        opHint.style.display = "";
        opHint.textContent = t("constraint.binHint");
      } else {
        rhsRow.style.display = "";
        opHint.style.display = "none";
      }
    }
    applyOpVisibility();
    op.addEventListener("change", applyOpVisibility);
    const lhsPickBtn = overlay.querySelector('[data-action="pick-lhs"]');
    const rhsPickBtn = overlay.querySelector('[data-action="pick-rhs"]');
    const lhsPicker = makeRangePicker(lhs, lhsPickBtn);
    const rhsPicker = makeRangePicker(rhs, rhsPickBtn);
    overlay.addEventListener("click", async (e) => {
      const target = e.target;
      const action = target.dataset.action;
      if (action === "pick-lhs") {
        await lhsPicker.toggle();
      } else if (action === "pick-rhs") {
        await rhsPicker.toggle();
      } else if (action === "cancel") {
        overlay.remove();
        opts.onCancel?.();
      } else if (action === "accept") {
        if (!validate())
          return;
        opts.onAccept(build());
        overlay.remove();
      }
    });
    function validate() {
      let valid = true;
      if (!isValidA1(lhs.value)) {
        lhsError.textContent = t("msg.invalidA1");
        valid = false;
      } else {
        lhsError.textContent = "";
      }
      const o = op.value;
      if (o !== "int" && o !== "bin") {
        const isA1 = isValidA1(rhs.value);
        const isNumber = rhs.value.trim() !== "" && !Number.isNaN(Number(rhs.value));
        if (!isA1 && !isNumber) {
          rhsError.textContent = t("msg.invalidA1");
          valid = false;
        } else {
          rhsError.textContent = "";
        }
      }
      return valid;
    }
    function build() {
      const o = op.value;
      if (o === "int" || o === "bin") {
        return { lhsA1: lhs.value, op: o };
      }
      return { lhsA1: lhs.value, op: o, rhsA1OrValue: rhs.value, type: "linear" };
    }
  }

  // src/client/ui/constraints-list.ts
  function mountConstraintsList(host, opts) {
    host.innerHTML = `
    <div class="constraints">
      <div class="list" role="list"></div>
      <div class="list-actions">
        <button type="button" data-action="add">+ ${t("btn.add")}</button>
        <button type="button" data-action="edit">${t("btn.edit")}</button>
        <button type="button" data-action="remove">${t("btn.remove")}</button>
      </div>
    </div>
  `;
    const list = host.querySelector(".list");
    let selectedIndex = null;
    function render() {
      const items = opts.getList();
      list.innerHTML = items.map((c, i) => {
        const rhs = "rhsA1OrValue" in c ? `   ${c.op}   ${c.rhsA1OrValue}` : `   ${c.op}`;
        return `
          <div class="constraint-row" data-index="${i}" role="listitem"
               aria-selected="${i === selectedIndex}">
            <span>${escapeHtml(c.lhsA1)}${escapeHtml(rhs)}</span>
          </div>
        `;
      }).join("");
      list.querySelectorAll(".constraint-row").forEach((row) => {
        row.addEventListener("click", () => {
          selectedIndex = Number(row.dataset.index);
          render();
          const c = opts.getList()[selectedIndex] ?? null;
          opts.onSelect?.(selectedIndex, c);
        });
      });
    }
    host.addEventListener("click", (e) => {
      const target = e.target;
      const action = target.dataset.action;
      if (action === "add") {
        openConstraintModal(opts.parent, {
          onAccept: (c) => {
            opts.onAdd(c);
            render();
          }
        });
      } else if (action === "edit") {
        if (selectedIndex === null)
          return;
        const idx = selectedIndex;
        openConstraintModal(opts.parent, {
          initial: opts.getList()[idx] ?? void 0,
          onAccept: (c) => {
            opts.onUpdate(idx, c);
            render();
          }
        });
      } else if (action === "remove") {
        if (selectedIndex === null)
          return;
        opts.onRemove(selectedIndex);
        selectedIndex = null;
        opts.onSelect?.(null, null);
        render();
      }
    });
    render();
    return { render };
  }
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // src/client/ui/options-modal.ts
  function openOptionsModal(parent, opts) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${t("options.modal.title")}">
      <h2>${t("options.modal.title")}</h2>
      <div class="row">
        <label for="timeLimit">${t("options.timeLimit")}</label>
        <input id="timeLimit" type="number" min="1" step="1" value="${opts.initial.timeLimitSec}" />
      </div>
      <div class="row">
        <label for="iterLimit">${t("options.iterLimit")}</label>
        <input id="iterLimit" type="number" min="1" step="1" value="${opts.initial.iterLimit ?? ""}" />
      </div>
      <div class="row">
        <label for="mipGap">${t("options.mipGap")}</label>
        <input id="mipGap" type="number" min="0" step="0.0001" value="${opts.initial.mipGap}" />
      </div>
      <div class="row">
        <label for="intTol">${t("options.integerTolerance")}</label>
        <input id="intTol" type="number" min="0.0000001" step="0.0000001" value="${opts.initial.integerTolerance}" />
      </div>
      <div class="actions">
        <button type="button" data-action="cancel">${t("btn.cancel")}</button>
        <button type="button" data-action="accept" class="primary">OK</button>
      </div>
    </div>
  `;
    parent.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      const target = e.target;
      if (target.dataset.action === "cancel") {
        overlay.remove();
        opts.onCancel?.();
      } else if (target.dataset.action === "accept") {
        const time = Number(overlay.querySelector("#timeLimit").value);
        const iterStr = overlay.querySelector("#iterLimit").value;
        const iter = iterStr === "" ? null : Number(iterStr);
        const gap = Number(overlay.querySelector("#mipGap").value);
        const intTol = Number(overlay.querySelector("#intTol").value);
        opts.onAccept({
          assumeNonNegative: opts.initial.assumeNonNegative,
          timeLimitSec: time,
          iterLimit: iter,
          mipGap: gap,
          integerTolerance: intTol
        });
        overlay.remove();
      }
    });
  }

  // src/client/ui/templates-modal.ts
  function openTemplatesModal(parent, opts) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="Insertar ejemplo">
      <h2>\u{1F4CB} Insertar ejemplo</h2>
      <div class="muted small" style="margin-bottom:12px;">
        Crea una hoja nueva con un modelo listo para resolver. No toca lo que ya ten\xE9s.
      </div>
      <div id="templatesList" class="templates-list">
        <div class="muted small" style="text-align:center;padding:24px;">Cargando\u2026</div>
      </div>
      <div class="actions">
        <button type="button" data-action="cancel">${t("btn.cancel")}</button>
      </div>
    </div>
  `;
    parent.appendChild(overlay);
    const listEl = overlay.querySelector("#templatesList");
    let inflight = false;
    listTemplates().then((tpls) => {
      renderList(tpls);
    }).catch((err) => {
      listEl.innerHTML = `<div class="muted small" style="color:#d93025;">Error: ${escapeHtml2(err.message)}</div>`;
    });
    function renderList(tpls) {
      if (tpls.length === 0) {
        listEl.innerHTML = '<div class="muted small" style="text-align:center;">No hay templates disponibles.</div>';
        return;
      }
      listEl.innerHTML = tpls.map(
        (tpl) => `
        <button type="button" class="template-card" data-template-id="${escapeHtml2(tpl.id)}">
          <div class="template-label">${escapeHtml2(tpl.label)}</div>
          <div class="template-summary muted small">${escapeHtml2(tpl.summary)}</div>
        </button>
      `
      ).join("");
    }
    overlay.addEventListener("click", async (e) => {
      if (inflight)
        return;
      const target = e.target;
      if (target.dataset.action === "cancel") {
        overlay.remove();
        opts.onCancel?.();
        return;
      }
      const card = target.closest("[data-template-id]");
      if (card) {
        inflight = true;
        const id = card.dataset.templateId;
        card.classList.add("loading");
        listEl.querySelectorAll(".template-card").forEach((c) => {
          if (c !== card)
            c.setAttribute("disabled", "true");
        });
        try {
          const res = await insertTemplate(id);
          overlay.remove();
          await opts.onApplied(res.modelJson, res.sheetName);
        } catch (err) {
          card.classList.remove("loading");
          card.removeAttribute("disabled");
          alert("AltSolver \u2014 No se pudo insertar el ejemplo: " + err.message);
          inflight = false;
        }
      }
    });
  }
  function escapeHtml2(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // src/client/ui/highlight.ts
  var COLORS = {
    objective: "#cfe2ff",
    variables: "#d1f0d9",
    constraint: "#fde6c8"
  };
  var DEBOUNCE_MS = 180;
  var HighlightCoordinator = class {
    snapshot = null;
    inflight = null;
    debounceTimer = null;
    pendingRanges = null;
    pendingRole = null;
    highlight(role, rangesA1) {
      this.pendingRole = role;
      this.pendingRanges = rangesA1.filter((r) => r && r.trim() !== "");
      this.scheduleFlush();
    }
    clear() {
      this.pendingRole = null;
      this.pendingRanges = [];
      this.scheduleFlush();
    }
    /** Synchronous clear meant for "page is unloading" — no debounce. */
    clearNow() {
      if (this.debounceTimer != null) {
        window.clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      const snap = this.snapshot;
      this.snapshot = null;
      if (snap) {
        clearHighlights(snap).catch(() => {
        });
      }
    }
    scheduleFlush() {
      if (this.debounceTimer != null)
        window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        this.debounceTimer = null;
        void this.flush();
      }, DEBOUNCE_MS);
    }
    async flush() {
      if (this.inflight) {
        await this.inflight.catch(() => {
        });
      }
      const role = this.pendingRole;
      const ranges = this.pendingRanges ?? [];
      this.pendingRole = null;
      this.pendingRanges = null;
      const color = role ? COLORS[role] : null;
      const items = ranges.map((r) => ({ rangeA1: r, color }));
      const prev = this.snapshot;
      this.inflight = applyHighlights(prev, items).then((snap) => {
        this.snapshot = snap;
      }).catch((e) => {
        console.warn("[AltSolver] highlight failed:", e);
      }).finally(() => {
        this.inflight = null;
      });
      await this.inflight;
    }
  };

  // src/client/solver/highs-loader.ts
  var WASM_URL = "https://gioalvaro.github.io/alt-solver/highs.wasm";
  var modulePromise = null;
  async function getHighs() {
    if (modulePromise)
      return modulePromise;
    modulePromise = (async () => {
      const highsMod = await Promise.resolve().then(() => __toESM(require_highs(), 1));
      const res = await fetch(WASM_URL, { credentials: "omit" });
      if (!res.ok) {
        throw new Error(`AltSolver: no se pudo descargar el motor (HTTP ${res.status} desde ${WASM_URL}). Verific\xE1 tu conexi\xF3n a internet.`);
      }
      const wasmBytes = new Uint8Array(await res.arrayBuffer());
      const mod = await highsMod.default({
        wasmBinary: wasmBytes,
        locateFile: (file) => file
      });
      return mod;
    })();
    return modulePromise;
  }

  // src/client/solver/model-builder.ts
  function toLpFormat(lf) {
    const sanitizedNames = lf.vars.map((v, i) => safeName(v.name, i));
    const lines = [];
    lines.push(lf.objective.sense === "MAX" ? "Maximize" : "Minimize");
    lines.push(" obj: " + writeLinearExpr(lf.objective.coefs, sanitizedNames));
    lines.push("Subject To");
    lf.rows.forEach((row, idx) => {
      const expr = writeLinearExpr(row.coefs, sanitizedNames);
      const opStr = row.op === "=" ? "=" : row.op;
      lines.push(` c${idx + 1}: ${expr} ${opStr} ${formatNumber(row.rhs)}`);
    });
    const INF = 1e30;
    const isPosInf = (x) => x === Infinity || x >= INF;
    const isNegInf = (x) => x === -Infinity || x <= -INF;
    const boundLines = [];
    lf.vars.forEach((v, i) => {
      const name = sanitizedNames[i];
      if (isNegInf(v.lower) && isPosInf(v.upper)) {
        boundLines.push(` ${name} free`);
        return;
      }
      if (v.lower !== 0) {
        if (isNegInf(v.lower))
          boundLines.push(` -inf <= ${name}`);
        else
          boundLines.push(` ${formatNumber(v.lower)} <= ${name}`);
      }
      if (!isPosInf(v.upper)) {
        boundLines.push(` ${name} <= ${formatNumber(v.upper)}`);
      }
    });
    if (boundLines.length > 0) {
      lines.push("Bounds");
      lines.push(...boundLines);
    }
    const binaries = lf.vars.map((v, i) => ({ v, i })).filter(({ v }) => v.integral && v.lower === 0 && v.upper === 1).map(({ i }) => sanitizedNames[i]);
    if (binaries.length > 0) {
      lines.push("Binary");
      lines.push(" " + binaries.join(" "));
    }
    const generals = lf.vars.map((v, i) => ({ v, i })).filter(({ v }) => v.integral && !(v.lower === 0 && v.upper === 1)).map(({ i }) => sanitizedNames[i]);
    if (generals.length > 0) {
      lines.push("General");
      lines.push(" " + generals.join(" "));
    }
    lines.push("End");
    return lines.join("\n");
  }
  function writeLinearExpr(coefs, names) {
    const terms = [];
    coefs.forEach((c, i) => {
      if (c === 0)
        return;
      const name = names[i];
      if (terms.length === 0) {
        terms.push(`${formatNumber(c)} ${name}`);
      } else {
        const sign = c >= 0 ? "+" : "-";
        terms.push(`${sign} ${formatNumber(Math.abs(c))} ${name}`);
      }
    });
    return terms.length === 0 ? "0" : terms.join(" ");
  }
  function formatNumber(x) {
    if (!isFinite(x))
      return x > 0 ? "+inf" : "-inf";
    return Number(x.toPrecision(15)).toString();
  }
  var VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
  function safeName(name, index) {
    if (VALID_NAME.test(name))
      return name;
    return `x_${index + 1}`;
  }

  // src/client/solver/solve-status.ts
  function mapStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (s === "optimal")
      return "optimal";
    if (s.includes("infeasible"))
      return "infeasible";
    if (s.includes("unbounded"))
      return "unbounded";
    if (s.includes("time limit"))
      return "time_limit";
    if (s.includes("iteration limit"))
      return "iter_limit";
    return "error";
  }
  function mapRowStatus(s) {
    if (!s)
      return "free";
    const l = s.toLowerCase();
    if (l === "bs" || l.includes("basic"))
      return "basic";
    if (l === "lb" || l.includes("lower"))
      return "lower";
    if (l === "ub" || l.includes("upper"))
      return "upper";
    if (l === "eq" || l === "fx" || l.includes("equal") || l.includes("fixed"))
      return "upper";
    return "free";
  }

  // src/client/solver/ranging.ts
  function basisOf(raw, n) {
    const cols = new Array(n).fill("");
    Object.values(raw.Columns || {}).forEach((c) => {
      if (c.Index >= 0 && c.Index < n)
        cols[c.Index] = c.Status;
    });
    const rows = (raw.Rows || []).map((r) => r.Status);
    return { cols, rows };
  }
  function sameBasis(a, b) {
    if (a.cols.length !== b.cols.length || a.rows.length !== b.rows.length)
      return false;
    for (let i = 0; i < a.cols.length; i++)
      if (a.cols[i] !== b.cols[i])
        return false;
    for (let i = 0; i < a.rows.length; i++)
      if (a.rows[i] !== b.rows[i])
        return false;
    return true;
  }
  function computeRanging(highs, lf, baseResult, opts) {
    const n = lf.vars.length;
    const m = lf.rows.length;
    const baseBasis = basisOf(baseResult, n);
    function solveAndCheckBasis(perturbedLf) {
      const lp = toLpFormat(perturbedLf);
      let result;
      try {
        result = highs.solve(lp, opts);
      } catch {
        return false;
      }
      if (mapStatus(result.Status) !== "optimal")
        return false;
      return sameBasis(baseBasis, basisOf(result, n));
    }
    function bisectMaxDelta(test, scale) {
      const upperLimit = scale * 1e3;
      if (test(upperLimit))
        return Infinity;
      if (!test(0))
        return 0;
      let lo = 0;
      let hi = upperLimit;
      for (let iter = 0; iter < 25; iter++) {
        const mid = (lo + hi) / 2;
        if (test(mid))
          lo = mid;
        else
          hi = mid;
        if (hi - lo < 1e-6 * scale)
          break;
      }
      return lo;
    }
    function cloneLf() {
      return JSON.parse(JSON.stringify(lf));
    }
    const varRangeUp = new Array(n).fill(0);
    const varRangeDown = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const c0 = lf.objective.coefs[i] ?? 0;
      const scale = Math.max(Math.abs(c0), 1);
      varRangeUp[i] = bisectMaxDelta((d) => {
        const lf2 = cloneLf();
        lf2.objective.coefs[i] = c0 + d;
        return solveAndCheckBasis(lf2);
      }, scale);
      varRangeDown[i] = bisectMaxDelta((d) => {
        const lf2 = cloneLf();
        lf2.objective.coefs[i] = c0 - d;
        return solveAndCheckBasis(lf2);
      }, scale);
    }
    const rowRangeUp = new Array(m).fill(0);
    const rowRangeDown = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
      const b0 = lf.rows[j]?.rhs ?? 0;
      const scale = Math.max(Math.abs(b0), 1);
      rowRangeUp[j] = bisectMaxDelta((d) => {
        const lf2 = cloneLf();
        const row = lf2.rows[j];
        if (row)
          row.rhs = b0 + d;
        return solveAndCheckBasis(lf2);
      }, scale);
      rowRangeDown[j] = bisectMaxDelta((d) => {
        const lf2 = cloneLf();
        const row = lf2.rows[j];
        if (row)
          row.rhs = b0 - d;
        return solveAndCheckBasis(lf2);
      }, scale);
    }
    return { varRangeUp, varRangeDown, rowRangeUp, rowRangeDown };
  }

  // src/client/solver/diagnostics.ts
  function diagnoseInfeasibility(highs, lf, opts) {
    function isInfeasible(rowIndices) {
      const lf2 = cloneLfSlim(lf, rowIndices);
      let raw;
      try {
        raw = highs.solve(toLpFormat(lf2), opts);
      } catch {
        return true;
      }
      return mapStatus(raw.Status) === "infeasible";
    }
    let active2 = lf.rows.map((_, i) => i);
    if (!isInfeasible(active2)) {
      return { iis: [], suggestions: ["No se detect\xF3 conflicto entre restricciones."] };
    }
    for (let i = 0; i < lf.rows.length; i++) {
      const trimmed = active2.filter((j) => j !== i);
      if (isInfeasible(trimmed)) {
        active2 = trimmed;
      }
    }
    const iis = active2.map((idx) => {
      const row = lf.rows[idx];
      return {
        index: idx,
        name: row.name,
        lhsA1: row.lhsA1,
        op: row.op,
        rhs: row.rhs
      };
    });
    const suggestions = [];
    if (iis.length === 1) {
      suggestions.push(
        "La restricci\xF3n " + iis[0].name + " (" + iis[0].lhsA1 + " " + iis[0].op + " " + iis[0].rhs + ") no puede satisfacerse junto a las cotas de no negatividad. Revis\xE1 su lado derecho o el sentido de la desigualdad."
      );
    } else if (iis.length === 2) {
      suggestions.push(
        "Las restricciones " + iis[0].name + " y " + iis[1].name + " son mutuamente incompatibles. Probablemente una pide un m\xEDnimo que la otra proh\xEDbe \u2014 relajar el lado derecho de cualquiera de las dos deber\xEDa volver el modelo factible."
      );
    } else {
      const names = iis.map(function(c) {
        return c.name;
      }).join(", ");
      suggestions.push(
        "Las siguientes restricciones forman un conflicto: " + names + ". Conviene revisar cada lado derecho \u2014 alguno est\xE1 fijando un valor que el resto no puede cumplir."
      );
    }
    return { iis, suggestions };
  }
  function diagnoseUnboundedness(highs, lf, opts) {
    const M = 1e9;
    const lf2 = JSON.parse(JSON.stringify(lf));
    for (const v of lf2.vars) {
      if (v.upper >= 1e30)
        v.upper = M;
      if (v.lower <= -1e30)
        v.lower = -M;
    }
    let raw;
    try {
      raw = highs.solve(toLpFormat(lf2), opts);
    } catch {
      return {
        growingVars: [],
        suggestions: ["No se pudo identificar las variables que crecen sin l\xEDmite."]
      };
    }
    if (mapStatus(raw.Status) !== "optimal") {
      return {
        growingVars: [],
        suggestions: ["El modelo sigue sin tener una soluci\xF3n acotada incluso con cotas grandes."]
      };
    }
    const cols = Object.values(raw.Columns || {}).sort((a, b) => a.Index - b.Index);
    const growingVars = [];
    const tol = M * 1e-3;
    cols.forEach((col, i) => {
      if (i >= lf.vars.length)
        return;
      const v = lf.vars[i];
      if (Math.abs(col.Primal - M) < tol) {
        growingVars.push({ index: i, name: v.name, cellA1: v.cellA1, direction: "up" });
      } else if (Math.abs(col.Primal + M) < tol) {
        growingVars.push({ index: i, name: v.name, cellA1: v.cellA1, direction: "down" });
      }
    });
    const suggestions = [];
    if (growingVars.length === 0) {
      suggestions.push("No se identific\xF3 una variable espec\xEDfica que crezca sin l\xEDmite.");
    } else if (growingVars.length === 1) {
      const g = growingVars[0];
      suggestions.push(
        "La variable " + g.name + " (" + g.cellA1 + ") puede crecer indefinidamente mejorando el objetivo. Agreg\xE1 una cota superior (por ejemplo " + g.name + " \u2264 100) o una restricci\xF3n que la limite."
      );
    } else {
      const varNames = growingVars.map(function(g) {
        return g.name + " (" + g.cellA1 + ")";
      }).join(", ");
      suggestions.push(
        "Las variables " + varNames + " pueden crecer juntas sin l\xEDmite mejorando el objetivo. Falta una restricci\xF3n que limite su combinaci\xF3n \u2014 prob\xE1 agregar una cota a su suma o a cada una."
      );
    }
    return { growingVars, suggestions };
  }
  function cloneLfSlim(lf, rowIndices) {
    const set = new Set(rowIndices);
    return {
      vars: lf.vars.map((v) => ({ ...v })),
      objective: { ...lf.objective, coefs: [...lf.objective.coefs] },
      rows: lf.rows.filter((_, i) => set.has(i)).map((r) => ({ ...r, coefs: [...r.coefs] }))
    };
  }

  // src/client/solver/solve.ts
  async function runSolve(lf, opts) {
    const highs = await getHighs();
    const lp = toLpFormat(lf);
    console.warn("[AltSolver] LP file sent to HiGHS:\n" + lp);
    console.warn("[AltSolver] LinearForm:", JSON.stringify(lf, null, 2));
    const t0 = performance.now();
    let raw;
    try {
      raw = highs.solve(lp, {
        time_limit: opts.timeLimitSec,
        mip_rel_gap: opts.mipRelGap
      });
      console.warn("[AltSolver] Raw HiGHS result:", JSON.stringify(raw, null, 2));
    } catch (e) {
      console.error("[AltSolver] HiGHS threw:", e);
      return {
        status: "error",
        objective: 0,
        variables: [],
        rows: [],
        iterations: 0,
        time: (performance.now() - t0) / 1e3,
        isMip: lf.vars.some((v) => v.integral),
        message: `HiGHS exception: ${e.message || String(e)}`
      };
    }
    const elapsed = (performance.now() - t0) / 1e3;
    const status = mapStatus(raw.Status);
    const isMip = lf.vars.some((v) => v.integral);
    const rawStatusMessage = status === "error" ? `HiGHS: ${raw.Status || "sin status"}` : void 0;
    const cols = Object.values(raw.Columns || {}).sort((a, b) => a.Index - b.Index);
    let ranging = null;
    if (!isMip && status === "optimal") {
      try {
        ranging = computeRanging(highs, lf, raw, {
          time_limit: opts.timeLimitSec,
          mip_rel_gap: opts.mipRelGap
        });
      } catch (e) {
        console.warn("[AltSolver] ranging computation failed:", e);
      }
    }
    const variables = lf.vars.map((v, i) => {
      const col = cols[i];
      return {
        name: v.name,
        primal: col?.Primal ?? v.originalValue,
        dual: !isMip && col != null ? col.Dual : null,
        rangeUp: ranging?.varRangeUp[i] ?? null,
        rangeDown: ranging?.varRangeDown[i] ?? null
      };
    });
    const rows = lf.rows.map((row, j) => {
      const r = raw.Rows?.[j];
      return {
        name: row.name,
        primal: r?.Primal ?? row.lhsOriginalValue,
        dual: !isMip && r != null ? r.Dual : null,
        status: mapRowStatus(r?.Status),
        rangeUp: ranging?.rowRangeUp[j] ?? null,
        rangeDown: ranging?.rowRangeDown[j] ?? null
      };
    });
    let infeasibilityIIS;
    let infeasibilitySuggestions;
    let unboundedVars;
    let unboundedSuggestions;
    if (status === "infeasible" && !isMip) {
      try {
        const d = diagnoseInfeasibility(highs, lf, { time_limit: opts.timeLimitSec, mip_rel_gap: opts.mipRelGap });
        infeasibilityIIS = d.iis;
        infeasibilitySuggestions = d.suggestions;
      } catch (e) {
        console.warn("[AltSolver] Infeasibility diagnosis failed:", e);
      }
    }
    if (status === "unbounded" && !isMip) {
      try {
        const d = diagnoseUnboundedness(highs, lf, { time_limit: opts.timeLimitSec, mip_rel_gap: opts.mipRelGap });
        unboundedVars = d.growingVars;
        unboundedSuggestions = d.suggestions;
      } catch (e) {
        console.warn("[AltSolver] Unboundedness diagnosis failed:", e);
      }
    }
    return {
      status,
      objective: raw.ObjectiveValue ?? 0,
      variables,
      rows,
      iterations: 0,
      time: elapsed,
      isMip,
      message: rawStatusMessage,
      infeasibilityIIS,
      infeasibilitySuggestions,
      unboundedVars,
      unboundedSuggestions
    };
  }

  // src/client/reports/answer.ts
  function buildAnswerMatrix(lf, sr, ctx) {
    const rows = [];
    rows.push(["AltSolver \xB7 Informe de Respuesta"]);
    rows.push([`Hoja ${ctx.sheetName} \xB7 ${ctx.timestamp} \xB7 z = ${formatNum(sr.objective)}`]);
    rows.push([]);
    rows.push(["Resumen del solver", "", "", ""]);
    rows.push(["Motor", sr.isMip ? "Simplex + Branch-and-Bound (HiGHS)" : "Simplex LP (HiGHS)", "Tiempo", `${sr.time.toFixed(3)} s`]);
    rows.push(["Soluci\xF3n", solutionLabel(sr), "Iteraciones", sr.iterations]);
    rows.push([]);
    rows.push(["Funci\xF3n objetivo"]);
    rows.push(["Celda", "Nombre", "Valor inicial", "Valor final"]);
    rows.push([lf.objective.cellA1, lf.objective.name, lf.objective.originalValue, sr.objective]);
    rows.push([]);
    rows.push(["Variables de decisi\xF3n"]);
    rows.push(["Celda", "Nombre", "Valor inicial", "Valor final", "Tipo"]);
    lf.vars.forEach((v, i) => {
      const tipo = v.integral ? v.lower === 0 && v.upper === 1 ? "Binaria" : "Entera" : "Continua";
      rows.push([v.cellA1, v.name, v.originalValue, sr.variables[i]?.primal ?? 0, tipo]);
    });
    rows.push([]);
    rows.push(["Restricciones"]);
    rows.push(["Celda", "Nombre", "Valor", "F\xF3rmula", "Estado", "Holgura"]);
    lf.rows.forEach((row, j) => {
      const srRow = sr.rows[j];
      const formula = `${row.lhsA1}${row.op}${formatNum(row.rhs)}`;
      const isBinding = bindingTest(srRow);
      const slack = slackValue(row.op, srRow?.primal ?? 0, row.rhs);
      rows.push([
        row.lhsA1,
        row.name,
        srRow?.primal ?? 0,
        formula,
        isBinding ? "\u25CF Vinculante" : "\u25CB No vinculante",
        slack
      ]);
    });
    return rows;
  }
  function solutionLabel(sr) {
    switch (sr.status) {
      case "optimal":
        return "\xD3ptima";
      case "time_limit":
        return "No \xF3ptima (tiempo agotado)";
      case "iter_limit":
        return "No \xF3ptima (iteraciones agotadas)";
      case "infeasible":
        return "Infactible";
      case "unbounded":
        return "No acotada";
      case "error":
        return "Error";
    }
  }
  function bindingTest(srRow) {
    if (!srRow)
      return false;
    return srRow.status === "upper" || srRow.status === "lower";
  }
  function slackValue(op, lhs, rhs) {
    if (op === "<=")
      return rhs - lhs;
    if (op === ">=")
      return lhs - rhs;
    return Math.abs(lhs - rhs);
  }
  function formatNum(x) {
    return Number(x.toPrecision(6)).toString();
  }

  // src/client/reports/sensitivity.ts
  function buildSensitivityMatrix(lf, sr, ctx) {
    if (sr.isMip)
      return null;
    const rows = [];
    rows.push(["AltSolver \xB7 Informe de Sensibilidad"]);
    rows.push([`Hoja ${ctx.sheetName} \xB7 ${ctx.timestamp} \xB7 z = ${formatNum2(sr.objective)}`]);
    rows.push([]);
    rows.push(["Variables de decisi\xF3n"]);
    rows.push(["Celda", "Nombre", "Valor final", "Costo reducido", "Coef. objetivo", "Incremento admisible", "Decremento admisible"]);
    lf.vars.forEach((v, i) => {
      const sv = sr.variables[i];
      rows.push([
        v.cellA1,
        v.name,
        sv?.primal ?? 0,
        sv?.dual ?? 0,
        lf.objective.coefs[i] ?? 0,
        fmtRange(sv?.rangeUp),
        fmtRange(sv?.rangeDown)
      ]);
    });
    rows.push([]);
    rows.push(["Restricciones"]);
    rows.push(["Celda", "Nombre", "Valor final", "Precio sombra", "Lado derecho", "Incremento admisible", "Decremento admisible"]);
    lf.rows.forEach((row, j) => {
      const sRow = sr.rows[j];
      rows.push([
        row.lhsA1,
        row.name,
        sRow?.primal ?? 0,
        sRow?.dual ?? 0,
        row.rhs,
        fmtRange(sRow?.rangeUp),
        fmtRange(sRow?.rangeDown)
      ]);
    });
    return rows;
  }
  function formatNum2(x) {
    return Number(x.toPrecision(6)).toString();
  }
  function fmtRange(x) {
    if (x === null || x === void 0)
      return "\u221E";
    if (!isFinite(x))
      return "\u221E";
    return x;
  }

  // src/client/reports/graphical.ts
  function buildGraphicalPng(lf, sr) {
    if (lf.vars.length !== 2 || sr.isMip || sr.status !== "optimal")
      return null;
    if (sr.variables.length !== 2)
      return null;
    const xName = lf.vars[0].name;
    const yName = lf.vars[1].name;
    const halfPlanes = lf.rows.map((r) => ({
      a: r.coefs[0] ?? 0,
      b: r.coefs[1] ?? 0,
      rhs: r.rhs,
      op: r.op
    }));
    if (lf.vars[0].lower === 0)
      halfPlanes.push({ a: 1, b: 0, rhs: 0, op: ">=" });
    if (lf.vars[1].lower === 0)
      halfPlanes.push({ a: 0, b: 1, rhs: 0, op: ">=" });
    const TOL = 1e-7;
    const candidates = [];
    for (let i = 0; i < halfPlanes.length; i++) {
      for (let j = i + 1; j < halfPlanes.length; j++) {
        const A = halfPlanes[i];
        const B = halfPlanes[j];
        const det = A.a * B.b - A.b * B.a;
        if (Math.abs(det) < TOL)
          continue;
        const x = (A.rhs * B.b - B.rhs * A.b) / det;
        const y = (A.a * B.rhs - B.a * A.rhs) / det;
        if (!isFinite(x) || !isFinite(y))
          continue;
        candidates.push({ x, y });
      }
    }
    const vertices = dedupe(
      candidates.filter((p) => halfPlanes.every((h) => satisfies(h.a * p.x + h.b * p.y, h.op, h.rhs, 1e-5))),
      1e-5
    );
    if (vertices.length === 0)
      return null;
    const cx0 = vertices.reduce((s, p) => s + p.x, 0) / vertices.length;
    const cy0 = vertices.reduce((s, p) => s + p.y, 0) / vertices.length;
    vertices.sort((p, q) => Math.atan2(p.y - cy0, p.x - cx0) - Math.atan2(q.y - cy0, q.x - cx0));
    let xMin = Math.min(0, ...vertices.map((v) => v.x));
    let xMax = Math.max(...vertices.map((v) => v.x));
    let yMin = Math.min(0, ...vertices.map((v) => v.y));
    let yMax = Math.max(...vertices.map((v) => v.y));
    const xPad = (xMax - xMin) * 0.18 || 1;
    const yPad = (yMax - yMin) * 0.18 || 1;
    xMin -= xPad * 0.3;
    xMax += xPad;
    yMin -= yPad * 0.3;
    yMax += yPad;
    const W = 1e3;
    const H = 750;
    const PAD_L = 80;
    const PAD_R = 200;
    const PAD_T = 60;
    const PAD_B = 70;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return null;
    const sx = (x) => PAD_L + (x - xMin) / (xMax - xMin) * plotW;
    const sy = (y) => PAD_T + plotH - (y - yMin) / (yMax - yMin) * plotH;
    const COLORS2 = ["#1a73e8", "#137333", "#9334E8", "#B06000", "#C5221F", "#00838F"];
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#202124";
    ctx.font = '500 20px "Google Sans", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AltSolver \xB7 Soluci\xF3n gr\xE1fica", W / 2, 34);
    const xStep = niceStep(xMax - xMin);
    const yStep = niceStep(yMax - yMin);
    ctx.strokeStyle = "#f1f3f4";
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
      ctx.beginPath();
      ctx.moveTo(sx(x), PAD_T);
      ctx.lineTo(sx(x), PAD_T + plotH);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
      ctx.beginPath();
      ctx.moveTo(PAD_L, sy(y));
      ctx.lineTo(PAD_L + plotW, sy(y));
      ctx.stroke();
    }
    if (vertices.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(sx(vertices[0].x), sy(vertices[0].y));
      for (let i = 1; i < vertices.length; i++)
        ctx.lineTo(sx(vertices[i].x), sy(vertices[i].y));
      ctx.closePath();
      ctx.fillStyle = "rgba(26,115,232,0.14)";
      ctx.fill();
      ctx.strokeStyle = "rgba(26,115,232,0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const drawnLines = [];
    lf.rows.forEach((row, idx) => {
      const a = row.coefs[0] ?? 0;
      const b = row.coefs[1] ?? 0;
      const seg = lineSegmentInBox(a, b, row.rhs, xMin, xMax, yMin, yMax);
      if (!seg)
        return;
      const color = COLORS2[idx % COLORS2.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(sx(seg[0].x), sy(seg[0].y));
      ctx.lineTo(sx(seg[1].x), sy(seg[1].y));
      ctx.stroke();
      ctx.globalAlpha = 1;
      drawnLines.push({ name: row.name || `c${idx + 1}`, color });
    });
    const c0 = lf.objective.coefs[0] ?? 0;
    const c1 = lf.objective.coefs[1] ?? 0;
    if (Math.abs(c0) + Math.abs(c1) > TOL) {
      const zOpt = sr.objective;
      const levels = [
        { z: zOpt * 0.4, color: "#bdc1c6", dash: [3, 6], width: 1, alpha: 0.6 },
        { z: zOpt * 0.7, color: "#9aa0a6", dash: [3, 6], width: 1, alpha: 0.7 },
        { z: zOpt, color: "#202124", dash: [6, 4], width: 2, alpha: 0.85 }
      ];
      for (const lv of levels) {
        const seg = lineSegmentInBox(c0, c1, lv.z, xMin, xMax, yMin, yMax);
        if (!seg)
          continue;
        ctx.strokeStyle = lv.color;
        ctx.lineWidth = lv.width;
        ctx.globalAlpha = lv.alpha;
        ctx.setLineDash(lv.dash);
        ctx.beginPath();
        ctx.moveTo(sx(seg[0].x), sy(seg[0].y));
        ctx.lineTo(sx(seg[1].x), sy(seg[1].y));
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    const cVx = vertices.reduce((s, p) => s + p.x, 0) / vertices.length;
    const cVy = vertices.reduce((s, p) => s + p.y, 0) / vertices.length;
    ctx.font = '12px "Google Sans", Arial, sans-serif';
    ctx.textBaseline = "alphabetic";
    for (const v of vertices) {
      ctx.fillStyle = "#3c4043";
      ctx.beginPath();
      ctx.arc(sx(v.x), sy(v.y), 4, 0, Math.PI * 2);
      ctx.fill();
      const dx = v.x - cVx;
      const dy = v.y - cVy;
      const norm = Math.hypot(dx, dy) || 1;
      const lx = sx(v.x) + dx / norm * 18;
      const ly = sy(v.y) - dy / norm * 18;
      ctx.fillStyle = "#5f6368";
      ctx.textAlign = dx >= 0 ? "left" : "right";
      ctx.fillText(`(${trimNum(v.x)}, ${trimNum(v.y)})`, lx, ly);
    }
    const optX = sr.variables[0].primal;
    const optY = sr.variables[1].primal;
    drawStar(ctx, sx(optX), sy(optY), 11, "#1a73e8", "white", 1.8);
    const labelOffsetX = optX > (xMin + xMax) / 2 ? -16 : 16;
    const labelOffsetY = optY > (yMin + yMax) / 2 ? 24 : -16;
    ctx.fillStyle = "#1a73e8";
    ctx.font = '500 15px "Google Sans", Arial, sans-serif';
    ctx.textAlign = labelOffsetX > 0 ? "left" : "right";
    ctx.fillText(`\xD3ptimo \xB7 z = ${trimNum(sr.objective)}`, sx(optX) + labelOffsetX, sy(optY) + labelOffsetY);
    ctx.strokeStyle = "#202124";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD_L, sy(0));
    ctx.lineTo(PAD_L + plotW, sy(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(0), PAD_T);
    ctx.lineTo(sx(0), PAD_T + plotH);
    ctx.stroke();
    ctx.fillStyle = "#5f6368";
    ctx.font = '12px "Google Sans", Arial, sans-serif';
    ctx.textAlign = "center";
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
      ctx.fillText(trimNum(x), sx(x), PAD_T + plotH + 22);
    }
    ctx.textAlign = "right";
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
      ctx.fillText(trimNum(y), PAD_L - 10, sy(y) + 4);
    }
    ctx.fillStyle = "#202124";
    ctx.font = '500 15px "Google Sans", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(xName, PAD_L + plotW / 2, H - 22);
    ctx.save();
    ctx.translate(22, PAD_T + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yName, 0, 0);
    ctx.restore();
    const legendX = PAD_L + plotW + 24;
    let legendY = PAD_T + 8;
    ctx.fillStyle = "#202124";
    ctx.font = '500 13px "Google Sans", Arial, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("Referencias", legendX, legendY);
    legendY += 22;
    ctx.fillStyle = "rgba(26,115,232,0.14)";
    ctx.fillRect(legendX, legendY - 10, 18, 12);
    ctx.strokeStyle = "rgba(26,115,232,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY - 10, 18, 12);
    ctx.fillStyle = "#3c4043";
    ctx.font = '12px "Google Sans", Arial, sans-serif';
    ctx.fillText("Regi\xF3n factible", legendX + 26, legendY);
    legendY += 22;
    for (const dl of drawnLines) {
      ctx.strokeStyle = dl.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY - 4);
      ctx.lineTo(legendX + 18, legendY - 4);
      ctx.stroke();
      ctx.fillStyle = "#3c4043";
      ctx.fillText(dl.name, legendX + 26, legendY);
      legendY += 20;
    }
    drawStar(ctx, legendX + 9, legendY - 4, 7, "#1a73e8", "white", 1.5);
    ctx.fillStyle = "#3c4043";
    ctx.fillText("\xD3ptimo", legendX + 26, legendY);
    legendY += 22;
    ctx.strokeStyle = "#202124";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY - 4);
    ctx.lineTo(legendX + 18, legendY - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#3c4043";
    ctx.fillText(`z = ${trimNum(sr.objective)}`, legendX + 26, legendY);
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1] ?? "";
    return base64;
  }
  function drawStar(ctx, cx, cy, r, fill, stroke, strokeWidth) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 5 * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0)
        ctx.moveTo(x, y);
      else
        ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  function satisfies(lhs, op, rhs, tol) {
    if (op === "<=")
      return lhs <= rhs + tol;
    if (op === ">=")
      return lhs >= rhs - tol;
    return Math.abs(lhs - rhs) <= tol;
  }
  function dedupe(vs, tol) {
    const out = [];
    for (const v of vs) {
      if (!out.some((u) => Math.abs(u.x - v.x) < tol && Math.abs(u.y - v.y) < tol))
        out.push(v);
    }
    return out;
  }
  function lineSegmentInBox(a, b, c, xMin, xMax, yMin, yMax) {
    const pts = [];
    if (Math.abs(b) > 1e-12) {
      const y1 = (c - a * xMin) / b;
      if (y1 >= yMin - 1e-9 && y1 <= yMax + 1e-9)
        pts.push({ x: xMin, y: y1 });
      const y2 = (c - a * xMax) / b;
      if (y2 >= yMin - 1e-9 && y2 <= yMax + 1e-9)
        pts.push({ x: xMax, y: y2 });
    }
    if (Math.abs(a) > 1e-12) {
      const x1 = (c - b * yMin) / a;
      if (x1 >= xMin - 1e-9 && x1 <= xMax + 1e-9)
        pts.push({ x: x1, y: yMin });
      const x2 = (c - b * yMax) / a;
      if (x2 >= xMin - 1e-9 && x2 <= xMax + 1e-9)
        pts.push({ x: x2, y: yMax });
    }
    const uniq = dedupe(pts, 1e-6);
    if (uniq.length < 2)
      return null;
    return [uniq[0], uniq[uniq.length - 1]];
  }
  function niceStep(range) {
    if (range <= 0 || !isFinite(range))
      return 1;
    const rough = range / 8;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    let step;
    if (norm < 1.5)
      step = 1;
    else if (norm < 3)
      step = 2;
    else if (norm < 7)
      step = 5;
    else
      step = 10;
    return step * mag;
  }
  function trimNum(x) {
    if (Math.abs(x) < 1e-9)
      return "0";
    return Number(x.toPrecision(4)).toString();
  }

  // src/client/errors/error-messages.ts
  var TEMPLATES = {
    objective_empty: "err.objective_empty",
    variables_empty: "err.variables_empty",
    a1_invalid: "err.a1_invalid",
    eval_not_number: "err.eval_not_number",
    var_has_formula: "err.var_has_formula",
    linearity_warning: "err.linearity_warning",
    integrality_outside_vars: "err.integrality_outside_vars",
    solver_infeasible: "err.solver_infeasible",
    solver_unbounded: "err.solver_unbounded",
    solver_time_limit_feasible: "err.solver_time_limit_feasible",
    solver_time_limit_no_feasible: "err.solver_time_limit_no_feasible",
    solver_error: "err.solver_error",
    rpc_failed: "err.rpc_failed",
    wasm_load_failed: "err.wasm_load_failed",
    quota_exceeded: "err.quota_exceeded"
  };
  function errorMessage(code, params) {
    const template = t(TEMPLATES[code]);
    return interpolate(template, params);
  }
  function interpolate(template, params) {
    return template.replace("{cell}", params.cell ?? "").replace("{value}", params.value ?? "").replace("{cells}", (params.cells ?? []).join(", ")).replace("{reason}", params.reason ?? "").replace("{gap}", params.gap != null ? `${(params.gap * 100).toFixed(2)}%` : "");
  }

  // src/client/ui/results-modal.ts
  function openResultsModal(parent, opts) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay results-overlay";
    const banner = bannerHtml(opts.sr);
    const diagnostic = diagnosticHtml(opts.sr);
    const objective = objectiveHtml(opts.sr, opts.lf);
    const summary = summaryHtml(opts.sr, opts.lf);
    const choices = choicesHtml(opts.sr);
    overlay.innerHTML = `
    <div class="modal modal-results" role="dialog" aria-label="Resultados del Solver">
      ${banner}
      ${diagnostic}
      ${objective}
      ${summary}
      ${choices}
      <div class="actions">
        <button type="button" data-action="cancel">${t("btn.cancel")}</button>
        <button type="button" data-action="accept" class="primary">Aceptar</button>
      </div>
    </div>
  `;
    parent.appendChild(overlay);
    overlay.addEventListener("click", async (e) => {
      const action = e.target.dataset.action;
      if (action === "cancel") {
        overlay.remove();
        opts.onCancel?.();
      } else if (action === "accept") {
        const keepEl = overlay.querySelector('input[name="keep"]:checked');
        const keep = keepEl?.value === "keep";
        const writeAnswer = overlay.querySelector("#chk-answer")?.checked ?? true;
        const writeSensitivity = overlay.querySelector("#chk-sensitivity")?.checked ?? false;
        const writeGraphical = overlay.querySelector("#chk-graphical")?.checked ?? false;
        overlay.remove();
        await opts.onAccept({ keepSolution: keep, writeAnswer, writeSensitivity, writeGraphical });
      }
    });
  }
  function diagnosticHtml(sr) {
    if (sr.status === "infeasible" && sr.infeasibilityIIS && sr.infeasibilityIIS.length > 0) {
      const items = sr.infeasibilityIIS.map(
        (c) => `<li><strong>${escapeHtml3(c.name)}</strong> <span class="muted">(${escapeHtml3(c.lhsA1)} ${escapeHtml3(c.op)} ${formatNum3(c.rhs)})</span></li>`
      ).join("");
      const sugg = (sr.infeasibilitySuggestions ?? []).map((s) => `<div class="diag-sugg">${escapeHtml3(s)}</div>`).join("");
      return `
      <div class="diagnostic diag-err">
        <div class="diag-title">Restricciones en conflicto</div>
        <ul class="diag-list">${items}</ul>
        ${sugg}
      </div>
    `;
    }
    if (sr.status === "unbounded" && sr.unboundedVars && sr.unboundedVars.length > 0) {
      const items = sr.unboundedVars.map(
        (v) => `<li><strong>${escapeHtml3(v.name)}</strong> <span class="muted">(${escapeHtml3(v.cellA1)})</span></li>`
      ).join("");
      const sugg = (sr.unboundedSuggestions ?? []).map((s) => `<div class="diag-sugg">${escapeHtml3(s)}</div>`).join("");
      return `
      <div class="diagnostic diag-err">
        <div class="diag-title">Variables sin cota superior</div>
        <ul class="diag-list">${items}</ul>
        ${sugg}
      </div>
    `;
    }
    return "";
  }
  function formatNum3(x) {
    return Number(x.toPrecision(6)).toString();
  }
  function bannerHtml(sr) {
    const cls = sr.status === "optimal" ? "banner-ok" : sr.status === "infeasible" || sr.status === "unbounded" || sr.status === "error" ? "banner-err" : "banner-warn";
    const title = sr.status === "optimal" ? "AltSolver encontr\xF3 una soluci\xF3n" : sr.status === "infeasible" ? errorMessage("solver_infeasible", {}) : sr.status === "unbounded" ? errorMessage("solver_unbounded", {}) : sr.status === "time_limit" ? errorMessage("solver_time_limit_feasible", { gap: sr.mipGap ?? 0 }) : sr.status === "error" ? errorMessage("solver_error", {}) : "Resultado del Solver";
    const detail = sr.message ? `<div class="banner-detail">${escapeHtml3(sr.message)}</div>` : "";
    return `<div class="banner ${cls}"><span class="dot"></span><strong>${escapeHtml3(title)}</strong></div>${detail}`;
  }
  function objectiveHtml(sr, lf) {
    if (sr.status !== "optimal" && sr.status !== "time_limit")
      return "";
    const value = sr.objective.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const orig = lf.objective.originalValue;
    const delta = sr.objective - orig;
    const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
    return `
    <div class="section">
      <div class="muted small">Valor objetivo</div>
      <div class="big-number">${escapeHtml3(value)} <span class="delta">${escapeHtml3(deltaStr)}</span></div>
      <div class="muted small">${escapeHtml3(lf.objective.name)}</div>
    </div>
  `;
  }
  function summaryHtml(sr, lf) {
    const integers = lf.vars.filter((v) => v.integral).length;
    const continuous = lf.vars.length - integers;
    const binding = sr.rows.filter((r) => r.status === "upper" || r.status === "lower").length;
    return `
    <div class="section">
      <div class="muted small">Resumen</div>
      <table class="kv">
        <tr><td>Estado</td><td>${escapeHtml3(statusLabel(sr.status))}</td></tr>
        <tr><td>Motor</td><td>${escapeHtml3(sr.isMip ? "Simplex + B&B (HiGHS)" : "Simplex LP (HiGHS)")}</td></tr>
        <tr><td>Tiempo</td><td>${(sr.time * 1e3).toFixed(0)} ms</td></tr>
        <tr><td>Variables</td><td>${continuous} continuas, ${integers} enteras</td></tr>
        <tr><td>Restricciones</td><td>${lf.rows.length} (${binding} vinculantes)</td></tr>
      </table>
    </div>
  `;
  }
  function choicesHtml(sr) {
    const isFeasible = sr.status === "optimal" || sr.status === "time_limit";
    if (!isFeasible)
      return "";
    const sensitivityDisabled = sr.isMip ? "disabled" : "";
    const sensitivityNote = sr.isMip ? '<div class="muted small">No disponible para problemas enteros (igual que Excel).</div>' : "";
    const canGraph = sr.variables.length === 2 && !sr.isMip;
    const graphicalRow = canGraph ? `<br/><label><input id="chk-graphical" type="checkbox" checked /> Soluci\xF3n gr\xE1fica</label>
       <div class="muted small">Plot de la regi\xF3n factible, v\xE9rtices, y nivel objetivo (s\xF3lo 2 variables).</div>` : "";
    return `
    <div class="section">
      <div class="muted small">Soluci\xF3n</div>
      <label><input type="radio" name="keep" value="keep" checked /> Conservar la soluci\xF3n en la hoja</label><br/>
      <label><input type="radio" name="keep" value="restore" /> Restaurar los valores originales</label>
    </div>
    <div class="section">
      <div class="muted small">Informes a generar</div>
      <label><input id="chk-answer" type="checkbox" checked /> Respuesta</label><br/>
      <label><input id="chk-sensitivity" type="checkbox" ${sr.isMip ? "" : "checked"} ${sensitivityDisabled} /> Sensibilidad</label>
      ${sensitivityNote}
      ${graphicalRow}
    </div>
  `;
  }
  function statusLabel(s) {
    if (s === "optimal")
      return "\xD3ptimo";
    if (s === "infeasible")
      return "Infactible";
    if (s === "unbounded")
      return "No acotado";
    if (s === "time_limit")
      return "No \xF3ptimo (tiempo)";
    if (s === "iter_limit")
      return "No \xF3ptimo (iteraciones)";
    return "Error";
  }
  function escapeHtml3(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // src/client/ui/solve-flow-checks.ts
  function emptyLpDiagnostic(lf) {
    const TOL = 1e-12;
    const objHasCoef = lf.objective.coefs.some((c) => Math.abs(c) > TOL);
    const allRowsZero = lf.rows.length > 0 && lf.rows.every(
      (r) => r.coefs.every((c) => Math.abs(c) <= TOL)
    );
    if (!objHasCoef && allRowsZero) {
      return "Ni el objetivo ni las restricciones dependen de las variables. Las celdas LHS (" + lf.rows.map((r) => r.lhsA1).join(", ") + ") y la celda objetivo (" + lf.objective.cellA1 + ") probablemente contienen constantes en lugar de f\xF3rmulas que multipliquen los coeficientes por las variables. Por ejemplo: =SUMPRODUCT(coeficientes, variables).";
    }
    if (allRowsZero) {
      return "Ninguna de las restricciones depende de las variables. Las celdas " + lf.rows.map((r) => r.lhsA1).join(", ") + " probablemente contienen constantes en lugar de f\xF3rmulas. Necesit\xE1s f\xF3rmulas como =SUMPRODUCT(coeficientes, variables) o =B7*B2 + C7*C2.";
    }
    return null;
  }

  // src/client/ui/solve-flow.ts
  var lastSolveCache = null;
  async function runSolveFlow(host, draft) {
    const modelDoc = draft.toDocument();
    const overlay = document.createElement("div");
    overlay.className = "solving-overlay";
    overlay.innerHTML = `
    <div class="spinner"></div>
    <div class="muted" id="solvePhase">Validando modelo\u2026</div>
    <div class="muted small" id="solveHint">Esto puede tardar algunos segundos. La hoja se va a actualizar mientras AltSolver mide los coeficientes de cada variable.</div>
  `;
    host.appendChild(overlay);
    const phaseEl = overlay.querySelector("#solvePhase");
    const setPhase = (msg) => {
      phaseEl.textContent = msg;
    };
    try {
      setPhase("Validando modelo\u2026");
      const pre = await preflight(modelDoc);
      if (pre == null) {
        throw new Error("El servidor no devolvi\xF3 respuesta. \xBFRefrescaste la hoja despu\xE9s del \xFAltimo push?");
      }
      if (!pre.validation.ok) {
        throw new Error((pre.validation.errors ?? ["Error de validaci\xF3n"]).join("\n"));
      }
      const fingerprint = pre.fingerprint;
      let lf;
      let sr;
      let snapshot;
      let graphicalPngBase64 = null;
      let graphicalError = null;
      let cacheHit = false;
      if (fingerprint && lastSolveCache && lastSolveCache.fingerprint === fingerprint) {
        setPhase("Modelo sin cambios \u2014 usando resultado anterior\u2026");
        lf = lastSolveCache.lf;
        sr = lastSolveCache.sr;
        snapshot = lastSolveCache.snapshot;
        graphicalPngBase64 = lastSolveCache.graphicalPngBase64;
        graphicalError = lastSolveCache.graphicalError;
        cacheHit = true;
      } else {
        setPhase("Extrayendo coeficientes del modelo (esto es lo m\xE1s lento)\u2026");
        const ex = await extractLinearForm(modelDoc);
        if (ex == null) {
          throw new Error("La extracci\xF3n no devolvi\xF3 respuesta. Probablemente el modelo contiene valores infinitos o NaN que la RPC no puede serializar.");
        }
        if (!ex.ok || !ex.linearForm) {
          throw new Error((ex.errors ?? ["Error de extracci\xF3n"]).join("\n"));
        }
        lf = ex.linearForm;
        snapshot = ex.snapshot;
        const emptyMsg = emptyLpDiagnostic(lf);
        if (emptyMsg)
          throw new Error(emptyMsg);
        setPhase("Cargando motor (HiGHS) y resolviendo\u2026");
        sr = await runSolve(lf, {
          timeLimitSec: modelDoc.options.timeLimitSec,
          mipRelGap: modelDoc.options.mipGap
        });
        setPhase("Listo. Preparando reportes\u2026");
        try {
          graphicalPngBase64 = buildGraphicalPng(lf, sr);
          if (!graphicalPngBase64) {
            graphicalError = "No se pudo construir la soluci\xF3n gr\xE1fica (s\xF3lo soportada para 2 variables continuas con regi\xF3n factible no vac\xEDa).";
          }
        } catch (e) {
          graphicalError = "Error al renderizar el gr\xE1fico: " + e.message;
          console.error("[AltSolver] buildGraphicalPng threw:", e);
        }
        if (fingerprint) {
          lastSolveCache = { fingerprint, lf, sr, snapshot, graphicalPngBase64, graphicalError };
        }
      }
      const ctx = {
        sheetName: "",
        timestamp: (/* @__PURE__ */ new Date()).toLocaleString("es-AR")
      };
      const answerMatrix = buildAnswerMatrix(lf, sr, ctx);
      const sensitivityMatrix = buildSensitivityMatrix(lf, sr, ctx);
      if (cacheHit) {
        console.warn("[AltSolver] Cache hit \u2014 skipping extraction and solve.");
      }
      overlay.remove();
      openResultsModal(host, {
        lf,
        sr,
        onAccept: async (choice) => {
          const reqOverlay = document.createElement("div");
          reqOverlay.className = "solving-overlay";
          reqOverlay.innerHTML = `<div class="spinner"></div><div class="muted">Escribiendo reportes\u2026</div>`;
          host.appendChild(reqOverlay);
          try {
            if (!choice.keepSolution) {
              await restoreSnapshot(modelDoc, snapshot);
            }
            if (choice.keepSolution || choice.writeAnswer || choice.writeSensitivity || choice.writeGraphical) {
              await writeResults({
                modelDoc,
                solveResult: {
                  variableValuesFlat: sr.variables.map((v) => v.primal),
                  objectiveValue: sr.objective,
                  isMip: sr.isMip
                },
                answerMatrix: choice.writeAnswer ? answerMatrix : null,
                sensitivityMatrix: choice.writeSensitivity ? sensitivityMatrix : null,
                graphicalPngBase64,
                graphicalError,
                snapshot,
                keepSolution: choice.keepSolution,
                writeReports: {
                  answer: choice.writeAnswer,
                  sensitivity: choice.writeSensitivity,
                  graphical: choice.writeGraphical
                }
              });
            }
          } finally {
            reqOverlay.remove();
          }
          try {
            google.script.host?.close?.();
          } catch {
          }
        },
        onCancel: async () => {
          await restoreSnapshot(modelDoc, snapshot);
        }
      });
    } catch (e) {
      overlay.remove();
      alert(`AltSolver \u2014 ${e.message}`);
    }
  }

  // src/client/ui/toast.ts
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = "opacity 0.2s";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  // src/client/ui/form.ts
  function mountForm(host, opts) {
    const doc = opts.draft.toDocument();
    host.innerHTML = `
    <div class="sidebar-header">
      <button type="button" class="ghost" data-action="load-example">\u{1F4CB} Insertar ejemplo</button>
    </div>
    <form id="solverForm" autocomplete="off">
      <div class="section-label">Funci\xF3n objetivo</div>

      <div class="field">
        <label for="objCell">${t("label.objective")}</label>
        <div class="input-row">
          <input id="objCell" type="text" value="${esc(doc.objective.cellA1)}" placeholder="Ej: B12" />
          <button type="button" class="pick-btn" data-action="pick-obj" title="Seleccion\xE1 un rango en la hoja">\u2316</button>
        </div>
        <div class="hint" id="objError"></div>
      </div>

      <fieldset class="field">
        <legend>${t("label.sense")}</legend>
        <label><input type="radio" name="sense" value="MAX" ${doc.objective.sense === "MAX" ? "checked" : ""} /> ${t("sense.max")}</label>
        <label><input type="radio" name="sense" value="MIN" ${doc.objective.sense === "MIN" ? "checked" : ""} /> ${t("sense.min")}</label>
        <label>
          <input type="radio" name="sense" value="TARGET" ${doc.objective.sense === "TARGET" ? "checked" : ""} />
          ${t("sense.target")}:
          <input id="targetValue" type="number" step="any" value="${doc.objective.targetValue ?? ""}" />
        </label>
      </fieldset>

      <div class="section-label">Variables de decisi\xF3n</div>

      <div class="field">
        <label for="varsRange">${t("label.variables")}</label>
        <div class="input-row">
          <input id="varsRange" type="text" value="${esc(doc.variables.rangeA1)}" placeholder="Ej: B3:B7" />
          <button type="button" class="pick-btn" data-action="pick-vars" title="Seleccion\xE1 un rango en la hoja">\u2316</button>
        </div>
        <div class="hint" id="varsError"></div>
        <div id="varsSummary" class="summary-inline"></div>
      </div>

      <div class="section-label">Restricciones</div>

      <div class="field">
        <div id="constraintsHost"></div>
      </div>

      <div class="section-label">Opciones</div>

      <div class="field">
        <label><input id="assumeNN" type="checkbox" ${doc.options.assumeNonNegative ? "checked" : ""} />
          ${t("label.assumeNonNegative")}</label>
      </div>

      <div class="field">
        <label for="method">${t("label.method")}</label>
        <div class="input-row">
          <select id="method" style="flex:1;"><option value="simplexLp" selected>${t("method.simplexLp")}</option></select>
          <button type="button" data-action="options">\u2699 ${t("btn.options")}</button>
        </div>
        <div id="optsSummary" class="options-summary"></div>
      </div>

      <div class="actions">
        <button type="button" data-action="save">\u{1F4BE} ${t("btn.save")}</button>
        <div class="right">
          <button type="button" data-action="solve" class="primary">\u25B6 ${t("btn.solve")}</button>
        </div>
      </div>
      <div id="savedMessage" class="msg" style="display:none;">${t("msg.saved")}</div>
    </form>
  `;
    const objCell = host.querySelector("#objCell");
    const varsRange = host.querySelector("#varsRange");
    const objError = host.querySelector("#objError");
    const varsError = host.querySelector("#varsError");
    const assumeNN = host.querySelector("#assumeNN");
    const targetValue = host.querySelector("#targetValue");
    const constraintsHost = host.querySelector("#constraintsHost");
    const objPickBtn = host.querySelector('[data-action="pick-obj"]');
    const varsPickBtn = host.querySelector('[data-action="pick-vars"]');
    const varsSummary = host.querySelector("#varsSummary");
    const optsSummary = host.querySelector("#optsSummary");
    const objPicker = makeRangePicker(objCell, objPickBtn);
    const varsPicker = makeRangePicker(varsRange, varsPickBtn);
    const highlighter = new HighlightCoordinator();
    window.addEventListener("beforeunload", () => highlighter.clearNow());
    function refreshHighlight(role, input) {
      const v = input.value;
      if (v && isValidA1(v))
        highlighter.highlight(role, [v]);
      else
        highlighter.clear();
    }
    objCell.addEventListener("focus", () => refreshHighlight("objective", objCell));
    objCell.addEventListener("input", () => refreshHighlight("objective", objCell));
    varsRange.addEventListener("focus", () => refreshHighlight("variables", varsRange));
    varsRange.addEventListener("input", () => refreshHighlight("variables", varsRange));
    objCell.addEventListener("blur", () => highlighter.clear());
    varsRange.addEventListener("blur", () => highlighter.clear());
    window.addEventListener("pagehide", () => highlighter.clearNow());
    function updateVarsSummary() {
      const r = varsRange.value;
      if (r === "" || !isValidA1(r)) {
        varsSummary.textContent = "";
        return;
      }
      const m = r.match(/(\$?[A-Z]+\$?[1-9][0-9]{0,6})(?::(\$?[A-Z]+\$?[1-9][0-9]{0,6}))?$/);
      if (!m) {
        varsSummary.textContent = "";
        return;
      }
      const start = m[1].replace(/\$/g, "");
      const end = m[2] ? m[2].replace(/\$/g, "") : start;
      const parse = (s2) => {
        const mm = s2.match(/^([A-Z]+)([0-9]+)$/);
        if (!mm)
          return null;
        const col = mm[1].split("").reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
        const row = Number(mm[2]);
        return [row, col];
      };
      const s = parse(start);
      const e = parse(end);
      if (!s || !e) {
        varsSummary.textContent = "";
        return;
      }
      const count = (Math.abs(e[0] - s[0]) + 1) * (Math.abs(e[1] - s[1]) + 1);
      varsSummary.textContent = `${count} ${count === 1 ? "variable detectada" : "variables detectadas"}`;
    }
    function updateOptsSummary() {
      const o = opts.draft.toDocument().options;
      optsSummary.innerHTML = `<span class="chip">Tiempo m\xE1x ${o.timeLimitSec}s</span><span class="chip">Gap MIP ${(o.mipGap * 100).toFixed(2)}%</span><span class="chip">Tol entera ${o.integerTolerance}</span>`;
    }
    updateVarsSummary();
    updateOptsSummary();
    mountConstraintsList(constraintsHost, {
      parent: host,
      getList: () => opts.draft.toDocument().constraints,
      onAdd: (c) => opts.draft.addConstraint(c),
      onUpdate: (i, c) => opts.draft.updateConstraint(i, c),
      onRemove: (i) => opts.draft.removeConstraint(i),
      onSelect: (_i, c) => {
        if (!c) {
          highlighter.clear();
          return;
        }
        const ranges = [c.lhsA1];
        if ("rhsA1OrValue" in c)
          ranges.push(c.rhsA1OrValue);
        highlighter.highlight("constraint", ranges);
      }
    });
    function syncObjective() {
      const cell = objCell.value;
      const senseInput = host.querySelector('input[name="sense"]:checked');
      const sense = senseInput?.value ?? "MIN";
      const tv = sense === "TARGET" ? Number(targetValue.value) : null;
      objError.textContent = cell !== "" && !isValidA1(cell) ? t("msg.invalidA1") : "";
      opts.draft.setObjective({ cellA1: cell, sense, targetValue: tv });
    }
    function syncVariables() {
      const r = varsRange.value;
      varsError.textContent = r !== "" && !isValidA1(r) ? t("msg.invalidA1") : "";
      opts.draft.setVariables({
        rangeA1: r,
        names: [],
        assumeNonNegative: assumeNN.checked
      });
      updateVarsSummary();
    }
    objCell.addEventListener("change", syncObjective);
    varsRange.addEventListener("change", syncVariables);
    assumeNN.addEventListener("change", syncVariables);
    targetValue.addEventListener("change", syncObjective);
    host.querySelectorAll('input[name="sense"]').forEach((r) => {
      r.addEventListener("change", syncObjective);
    });
    host.addEventListener("click", async (e) => {
      const target = e.target;
      const action = target.dataset.action;
      if (action === "pick-obj") {
        await objPicker.toggle();
        syncObjective();
      } else if (action === "pick-vars") {
        await varsPicker.toggle();
        syncVariables();
      } else if (action === "options") {
        openOptionsModal(host, {
          initial: opts.draft.toDocument().options,
          onAccept: (newOpts) => {
            opts.draft.setOptions(newOpts);
            updateOptsSummary();
          }
        });
      } else if (action === "save") {
        await opts.onSave();
        showToast(t("msg.saved"));
      } else if (action === "load-example") {
        openTemplatesModal(host, {
          onApplied: async () => {
            showToast("Ejemplo insertado \u2014 cargando modelo\u2026");
            await reloadApp();
          }
        });
      } else if (action === "solve") {
        highlighter.clearNow();
        await runSolveFlow(host, opts.draft);
      }
    });
  }
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // src/client/app.ts
  var lastRoot = null;
  async function mountApp(root2) {
    lastRoot = root2;
    root2.innerHTML = `<div class="loading">${t("dialog.title")}\u2026</div>`;
    let ctx;
    try {
      ctx = await getActiveSheetContext();
    } catch (e) {
      root2.innerHTML = `<div class="error">Error: ${e.message}</div>`;
      return;
    }
    setLocale(ctx.locale);
    const draft = ctx.json ? ModelDraft.fromJson(ctx.json) ?? ModelDraft.fromBlank(ctx.sheetId, ctx.sheetName) : ModelDraft.fromBlank(ctx.sheetId, ctx.sheetName);
    mountForm(root2, {
      draft,
      onSave: async () => {
        await saveModel(draft.toJson());
      }
    });
    void getHighs().catch((e) => {
      console.warn("[AltSolver] HiGHS warmup failed (will retry on solve):", e);
    });
  }
  async function reloadApp() {
    if (lastRoot)
      await mountApp(lastRoot);
  }

  // src/client/index.ts
  var root = document.getElementById("app");
  if (!root) {
    document.body.innerHTML = '<div style="color:#d93025;padding:24px;font-family:Roboto,sans-serif">AltSolver: #app element not found</div>';
  } else {
    mountApp(root).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      root.innerHTML = `<div style="color:#d93025;padding:24px;font-family:Roboto,sans-serif">AltSolver \u2014 Error de inicializaci\xF3n: ${msg}</div>`;
    });
  }
})();
