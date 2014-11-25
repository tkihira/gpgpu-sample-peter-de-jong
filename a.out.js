// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      // Module is the only 'upvar', which we provide directly. We also provide FS for legacy support.
      var evalled = eval('(function(Module, FS) { return function(' + args.join(',') + '){ ' + source + ' } })')(Module, typeof FS !== 'undefined' ? FS : null);
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          (((codePoint - 0x10000) / 0x400)|0) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try {
      func = eval('_' + ident); // explicit lookup
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var stack = 0;
  var JSfuncs = {
    'stackSave' : function() {
      stack = Runtime.stackSave();
    },
    'stackRestore' : function() {
      Runtime.stackRestore(stack);
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args) {
    var func = getCFunc(ident);
    var cArgs = [];
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) JSfuncs['stackRestore']();
    return ret;
  }

  var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }
  var JSsource = {};
  for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
      // Elements of toCsource are arrays of three items:
      // the code, and the return value
      JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
  }

  
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      funcstr += JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=' + convertCode.returnValue + ';';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    if (!numericArgs) {
      // If we had a stack, restore it
      funcstr += JSsource['stackRestore'].body + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["cwrap"] = cwrap;
Module["ccall"] = ccall;


function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;


function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;


function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;


function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  var final = func;
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    final = parse();
  } catch(e) {
    final += '?';
  }
  if (final.indexOf('?') >= 0 && !hasLibcxxabi) {
    Runtime.warnOnce('warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  }
  return final;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module['stackTrace'] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    Module.printErr('Exiting runtime. Any attempt to access the compiled C code may fail from now. If you want to keep the runtime alive, set Module["noExitRuntime"] = true or build with -s NO_EXIT_RUNTIME=1');
  }
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))>>0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[(((buffer)+(i))>>0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))>>0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===





STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(2097739);
  /* global initializers */ __ATINIT__.push();
  

/* memory initializer */ allocate([154,153,153,153,153,153,5,192,10,215,163,112,61,10,183,191,133,235,81,184,30,133,235,191,154,153,153,153,153,153,1,192], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


   
  Module["_i64Add"] = _i64Add;

  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

   
  Module["_memset"] = _memset;

   
  Module["_bitshift64Lshr"] = _bitshift64Lshr;

  function _abort() {
      Module['abort']();
    }

   
  Module["_strlen"] = _strlen;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _cos=Math_cos;

  var _llvm_pow_f64=Math_pow;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function ___errno_location() {
      return ___errno_state;
    }

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.buffer.byteLength which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (node.contents && node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
  
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
  
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) { // Can we just reuse the buffer we are given?
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperty(node, "usedBytes", {
            get: function() { return this.contents.length; }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  var _sin=Math_sin;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

  var Math_min = Math.min;
  // EMSCRIPTEN_START_ASM
  var asm = (function(global, env, buffer) {
    'almost asm';
    
    var HEAP8 = new global.Int8Array(buffer);
    var HEAP16 = new global.Int16Array(buffer);
    var HEAP32 = new global.Int32Array(buffer);
    var HEAPU8 = new global.Uint8Array(buffer);
    var HEAPU16 = new global.Uint16Array(buffer);
    var HEAPU32 = new global.Uint32Array(buffer);
    var HEAPF32 = new global.Float32Array(buffer);
    var HEAPF64 = new global.Float64Array(buffer);

  
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;
  var ctlz_i8=env.ctlz_i8|0;

    var __THREW__ = 0;
    var threwValue = 0;
    var setjmpId = 0;
    var undef = 0;
    var nan = +env.NaN, inf = +env.Infinity;
    var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;
  
    var tempRet0 = 0;
    var tempRet1 = 0;
    var tempRet2 = 0;
    var tempRet3 = 0;
    var tempRet4 = 0;
    var tempRet5 = 0;
    var tempRet6 = 0;
    var tempRet7 = 0;
    var tempRet8 = 0;
    var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var Math_min=env.min;
  var _sin=env._sin;
  var _fflush=env._fflush;
  var _llvm_pow_f64=env._llvm_pow_f64;
  var _cos=env._cos;
  var _abort=env._abort;
  var ___setErrNo=env.___setErrNo;
  var _sbrk=env._sbrk;
  var _time=env._time;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _sysconf=env._sysconf;
  var ___errno_location=env.___errno_location;
  var tempFloat = 0.0;

  // EMSCRIPTEN_START_FUNCS
  function stackAlloc(size) {
    size = size|0;
    var ret = 0;
    ret = STACKTOP;
    STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
if ((STACKTOP|0) >= (STACK_MAX|0)) abort();

    return ret|0;
  }
  function stackSave() {
    return STACKTOP|0;
  }
  function stackRestore(top) {
    top = top|0;
    STACKTOP = top;
  }

  function setThrew(threw, value) {
    threw = threw|0;
    value = value|0;
    if ((__THREW__|0) == 0) {
      __THREW__ = threw;
      threwValue = value;
    }
  }
  function copyTempFloat(ptr) {
    ptr = ptr|0;
    HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
    HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
    HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
    HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  }
  function copyTempDouble(ptr) {
    ptr = ptr|0;
    HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
    HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
    HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
    HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
    HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
    HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
    HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
    HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
  }
  function setTempRet0(value) {
    value = value|0;
    tempRet0 = value;
  }
  function getTempRet0() {
    return tempRet0|0;
  }
  
function _randomize() {
 var $call = 0, $call1 = 0, $call11 = 0, $call6 = 0, $conv = 0.0, $conv12 = 0.0, $conv2 = 0.0, $conv7 = 0.0, $div = 0.0, $div13 = 0.0, $div3 = 0.0, $div8 = 0.0, $mul = 0.0, $mul14 = 0.0, $mul4 = 0.0, $mul9 = 0.0, $sub = 0.0, $sub10 = 0.0, $sub15 = 0.0, $sub5 = 0.0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 $call = (_rand()|0);
 $conv = (+($call|0));
 $div = $conv / 2147483647.0;
 $mul = $div * 6.0;
 $sub = $mul - 3.0;
 HEAPF64[8>>3] = $sub;
 $call1 = (_rand()|0);
 $conv2 = (+($call1|0));
 $div3 = $conv2 / 2147483647.0;
 $mul4 = $div3 * 6.0;
 $sub5 = $mul4 - 3.0;
 HEAPF64[16>>3] = $sub5;
 $call6 = (_rand()|0);
 $conv7 = (+($call6|0));
 $div8 = $conv7 / 2147483647.0;
 $mul9 = $div8 * 6.0;
 $sub10 = $mul9 - 3.0;
 HEAPF64[24>>3] = $sub10;
 $call11 = (_rand()|0);
 $conv12 = (+($call11|0));
 $div13 = $conv12 / 2147483647.0;
 $mul14 = $div13 * 6.0;
 $sub15 = $mul14 - 3.0;
 HEAPF64[32>>3] = $sub15;
 STACKTOP = sp;return;
}
function _initialize() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $arrayidx = 0, $arrayidx1 = 0, $call = 0, $call4 = 0, $call7 = 0, $cmp = 0, $conv = 0.0, $conv8 = 0.0, $div = 0.0, $div9 = 0.0, $i = 0, $inc = 0, $mul = 0.0, $mul10 = 0.0;
 var $mul11 = 0.0, $mul5 = 0.0, $tobool = 0, $tobool2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = HEAP32[40>>2]|0;
 $tobool = ($0|0)!=(0);
 if (!($tobool)) {
  HEAP32[40>>2] = 1;
  $call = (_time((0|0))|0);
  _srand($call);
 }
 $i = 0;
 while(1) {
  $1 = $i;
  $cmp = ($1|0)<(262144);
  if (!($cmp)) {
   break;
  }
  $2 = $i;
  $arrayidx = (48 + ($2<<2)|0);
  HEAP32[$arrayidx>>2] = 0;
  $3 = $i;
  $arrayidx1 = (1048624 + ($3<<2)|0);
  HEAP32[$arrayidx1>>2] = 0;
  $4 = $i;
  $inc = (($4) + 1)|0;
  $i = $inc;
 }
 _randomize();
 HEAP32[2097200>>2] = 0;
 HEAPF64[2097208>>3] = 0.0;
 HEAPF64[2097216>>3] = 0.0;
 $5 = HEAP32[2097224>>2]|0;
 $tobool2 = ($5|0)!=(0);
 if (!($tobool2)) {
  $call4 = (_rand()|0);
  $conv = (+($call4|0));
  $div = $conv / 2147483647.0;
  $mul = $div * 3.141592653589793116;
  $mul5 = $mul * 2.0;
  HEAPF64[2097232>>3] = $mul5;
 }
 $call7 = (_rand()|0);
 $conv8 = (+($call7|0));
 $div9 = $conv8 / 2147483647.0;
 $mul10 = $div9 * 3.141592653589793116;
 $mul11 = $mul10 * 2.0;
 HEAPF64[2097232>>3] = $mul11;
 STACKTOP = sp;return;
}
function _makeColor($ratio,$rag,$flag) {
 $ratio = +$ratio;
 $rag = +$rag;
 $flag = $flag|0;
 var $0 = 0.0, $1 = 0, $10 = 0.0, $11 = 0.0, $12 = 0.0, $13 = 0.0, $14 = 0.0, $15 = 0.0, $16 = 0.0, $17 = 0.0, $18 = 0.0, $19 = 0.0, $2 = 0.0, $20 = 0.0, $21 = 0.0, $22 = 0.0, $23 = 0.0, $24 = 0.0, $25 = 0.0, $26 = 0.0;
 var $27 = 0.0, $28 = 0.0, $29 = 0.0, $3 = 0.0, $30 = 0.0, $31 = 0.0, $32 = 0.0, $33 = 0.0, $34 = 0.0, $35 = 0.0, $36 = 0.0, $37 = 0.0, $38 = 0.0, $39 = 0.0, $4 = 0.0, $40 = 0, $5 = 0.0, $6 = 0.0, $7 = 0.0, $8 = 0.0;
 var $9 = 0.0, $add = 0.0, $b = 0.0, $c = 0.0, $cmp = 0, $cmp10 = 0, $cmp3 = 0, $cmp7 = 0, $conv = 0, $conv14 = 0.0, $conv26 = 0, $conv37 = 0, $conv41 = 0, $conv46 = 0, $div = 0.0, $div15 = 0.0, $f = 0.0, $flag$addr = 0, $g = 0.0, $h1 = 0.0;
 var $mul = 0.0, $mul18 = 0.0, $mul19 = 0.0, $mul21 = 0.0, $mul23 = 0.0, $mul25 = 0.0, $mul34 = 0.0, $mul36 = 0.0, $mul38 = 0.0, $mul40 = 0.0, $mul43 = 0.0, $mul45 = 0.0, $or = 0, $or47 = 0, $p = 0.0, $q = 0.0, $r = 0.0, $rag$addr = 0.0, $ratio$addr = 0.0, $retval = 0;
 var $s = 0.0, $shl = 0, $shl42 = 0, $sub = 0.0, $sub12 = 0.0, $sub16 = 0.0, $sub17 = 0.0, $sub2 = 0.0, $sub20 = 0.0, $sub22 = 0.0, $sub24 = 0.0, $sub32 = 0.0, $sub33 = 0.0, $sub35 = 0.0, $sub39 = 0.0, $sub44 = 0.0, $t = 0.0, $tobool = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ratio$addr = $ratio;
 $rag$addr = $rag;
 $flag$addr = $flag;
 $0 = $ratio$addr;
 $cmp = $0 > 1.0;
 if ($cmp) {
  $ratio$addr = 1.0;
 }
 $1 = $flag$addr;
 $tobool = ($1|0)!=(0);
 if ($tobool) {
  $2 = $ratio$addr;
  $sub = 1.0 - $2;
  $3 = (+Math_pow((+$sub),150.0));
  $sub2 = 1.0 - $3;
  $c = $sub2;
  $4 = $c;
  $cmp3 = $4 == 0.0;
  if ($cmp3) {
   $retval = 0;
   $40 = $retval;
   STACKTOP = sp;return ($40|0);
  } else {
   $retval = 16777215;
   $40 = $retval;
   STACKTOP = sp;return ($40|0);
  }
 }
 $5 = $rag$addr;
 $cmp7 = $5 < 0.0;
 if ($cmp7) {
  $6 = $rag$addr;
  $add = $6 + 6.283185307179586232;
  $rag$addr = $add;
 }
 $7 = $rag$addr;
 $cmp10 = $7 >= 6.283185307179586232;
 if ($cmp10) {
  $8 = $rag$addr;
  $sub12 = $8 - 6.283185307179586232;
  $rag$addr = $sub12;
 }
 $9 = $rag$addr;
 $mul = $9 * 3.0;
 $div = $mul / 3.141592653589793116;
 $conv = (~~(($div)));
 $conv14 = (+($conv|0));
 $h1 = $conv14;
 $s = 1.0;
 $10 = $rag$addr;
 $div15 = $10 / 1.04719755119659763132;
 $11 = $h1;
 $sub16 = $div15 - $11;
 $f = $sub16;
 $12 = $s;
 $sub17 = 1.0 - $12;
 $mul18 = 1.0 * $sub17;
 $p = $mul18;
 $13 = $f;
 $14 = $s;
 $mul19 = $13 * $14;
 $sub20 = 1.0 - $mul19;
 $mul21 = 1.0 * $sub20;
 $q = $mul21;
 $15 = $f;
 $sub22 = 1.0 - $15;
 $16 = $s;
 $mul23 = $sub22 * $16;
 $sub24 = 1.0 - $mul23;
 $mul25 = 1.0 * $sub24;
 $t = $mul25;
 $17 = $h1;
 $conv26 = (~~(($17)));
 switch ($conv26|0) {
 case 0:  {
  $r = 1.0;
  $18 = $t;
  $g = $18;
  $19 = $p;
  $b = $19;
  break;
 }
 case 1:  {
  $20 = $q;
  $r = $20;
  $g = 1.0;
  $21 = $p;
  $b = $21;
  break;
 }
 case 2:  {
  $22 = $p;
  $r = $22;
  $g = 1.0;
  $23 = $t;
  $b = $23;
  break;
 }
 case 3:  {
  $24 = $p;
  $r = $24;
  $25 = $q;
  $g = $25;
  $b = 1.0;
  break;
 }
 case 4:  {
  $26 = $t;
  $r = $26;
  $27 = $p;
  $g = $27;
  $b = 1.0;
  break;
 }
 case 5:  {
  $r = 1.0;
  $28 = $p;
  $g = $28;
  $b = 1.0;
  break;
 }
 default: {
 }
 }
 $29 = $ratio$addr;
 $sub32 = 1.0 - $29;
 $30 = (+Math_pow((+$sub32),150.0));
 $sub33 = 1.0 - $30;
 $c = $sub33;
 $31 = $c;
 $32 = $r;
 $mul34 = $32 * 1.5;
 $sub35 = 3.0 - $mul34;
 $33 = (+Math_pow((+$31),(+$sub35)));
 $mul36 = $33 * 255.0;
 $conv37 = (~~(($mul36)));
 $shl = $conv37 << 16;
 $34 = $c;
 $35 = $g;
 $mul38 = $35 * 1.5;
 $sub39 = 3.0 - $mul38;
 $36 = (+Math_pow((+$34),(+$sub39)));
 $mul40 = $36 * 255.0;
 $conv41 = (~~(($mul40)));
 $shl42 = $conv41 << 8;
 $or = $shl | $shl42;
 $37 = $c;
 $38 = $b;
 $mul43 = $38 * 1.5;
 $sub44 = 3.0 - $mul43;
 $39 = (+Math_pow((+$37),(+$sub44)));
 $mul45 = $39 * 255.0;
 $conv46 = (~~(($mul45)));
 $or47 = $or | $conv46;
 $retval = $or47;
 $40 = $retval;
 STACKTOP = sp;return ($40|0);
}
function _show($flag) {
 $flag = $flag|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0.0, $5 = 0.0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $arrayidx = 0, $arrayidx2 = 0, $c = 0, $call = 0, $cmp = 0, $cmp5 = 0;
 var $conv = 0.0, $conv1 = 0.0, $conv4 = 0.0, $div = 0.0, $flag$addr = 0, $i = 0, $inc = 0, $inc3 = 0, $mul = 0, $pixels = 0, $ratio = 0.0, $retval = 0, $sub = 0, $tobool = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $flag$addr = $flag;
 $pixels = 0;
 $i = 0;
 while(1) {
  $0 = $i;
  $cmp = ($0|0)<(262144);
  if (!($cmp)) {
   break;
  }
  $1 = $i;
  $arrayidx = (48 + ($1<<2)|0);
  $2 = HEAP32[$arrayidx>>2]|0;
  $mul = $2<<9;
  $conv = (+($mul|0));
  $3 = HEAP32[2097200>>2]|0;
  $sub = (($3) - 10000)|0;
  $conv1 = (+($sub|0));
  $div = $conv / $conv1;
  $ratio = $div;
  $4 = $ratio;
  $5 = +HEAPF64[2097232>>3];
  $6 = $flag$addr;
  $call = (_makeColor($4,$5,$6)|0);
  $c = $call;
  $7 = $c;
  $8 = $i;
  $arrayidx2 = (1048624 + ($8<<2)|0);
  HEAP32[$arrayidx2>>2] = $7;
  $9 = $c;
  $tobool = ($9|0)!=(0);
  if ($tobool) {
   $10 = $pixels;
   $inc = (($10) + 1)|0;
   $pixels = $inc;
  }
  $11 = $i;
  $inc3 = (($11) + 1)|0;
  $i = $inc3;
 }
 $12 = $pixels;
 $conv4 = (+($12|0));
 $cmp5 = $conv4 < 1310.72000000000002728;
 if ($cmp5) {
  HEAP32[2097224>>2] = 0;
  _initialize();
  $retval = 1;
  $13 = $retval;
  STACKTOP = sp;return ($13|0);
 } else {
  $retval = 0;
  $13 = $retval;
  STACKTOP = sp;return ($13|0);
 }
 return 0|0;
}
function _getPixel($pos) {
 $pos = $pos|0;
 var $0 = 0, $1 = 0, $arrayidx = 0, $pos$addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $pos$addr = $pos;
 $0 = $pos$addr;
 $arrayidx = (1048624 + ($0<<2)|0);
 $1 = HEAP32[$arrayidx>>2]|0;
 STACKTOP = sp;return ($1|0);
}
function _generation() {
 var $0 = 0, $1 = 0, $10 = 0.0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0.0, $15 = 0.0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0.0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0.0, $8 = 0.0;
 var $9 = 0.0, $add = 0.0, $add13 = 0.0, $add17 = 0, $arrayidx = 0, $call = 0.0, $call22 = 0, $call28 = 0, $call3 = 0.0, $call5 = 0.0, $call7 = 0.0, $cmp = 0, $cmp1 = 0, $cmp19 = 0, $cmp9 = 0, $conv = 0, $conv15 = 0, $div = 0.0, $div12 = 0.0, $i = 0;
 var $inc = 0, $inc18 = 0, $inc27 = 0, $mul = 0.0, $mul11 = 0.0, $mul14 = 0.0, $mul16 = 0, $mul2 = 0.0, $mul4 = 0.0, $mul6 = 0.0, $nx = 0.0, $ny = 0.0, $pos = 0, $retval = 0, $sub = 0.0, $sub8 = 0.0, $tobool = 0, $tobool29 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $i = 0;
 while(1) {
  $0 = $i;
  $cmp = ($0|0)<(5000000);
  if (!($cmp)) {
   label = 13;
   break;
  }
  $1 = HEAP32[2097200>>2]|0;
  $cmp1 = ($1|0)>=(5000000);
  if ($cmp1) {
   label = 4;
   break;
  }
  $2 = HEAP32[2097200>>2]|0;
  $inc = (($2) + 1)|0;
  HEAP32[2097200>>2] = $inc;
  $3 = +HEAPF64[8>>3];
  $4 = +HEAPF64[2097216>>3];
  $mul = $3 * $4;
  $call = (+Math_sin((+$mul)));
  $5 = +HEAPF64[16>>3];
  $6 = +HEAPF64[2097208>>3];
  $mul2 = $5 * $6;
  $call3 = (+Math_cos((+$mul2)));
  $sub = $call - $call3;
  $nx = $sub;
  $7 = +HEAPF64[24>>3];
  $8 = +HEAPF64[2097208>>3];
  $mul4 = $7 * $8;
  $call5 = (+Math_sin((+$mul4)));
  $9 = +HEAPF64[32>>3];
  $10 = +HEAPF64[2097216>>3];
  $mul6 = $9 * $10;
  $call7 = (+Math_cos((+$mul6)));
  $sub8 = $call5 - $call7;
  $ny = $sub8;
  $11 = $nx;
  HEAPF64[2097208>>3] = $11;
  $12 = $ny;
  HEAPF64[2097216>>3] = $12;
  $13 = HEAP32[2097200>>2]|0;
  $cmp9 = ($13|0)>=(10000);
  if ($cmp9) {
   $14 = $nx;
   $div = $14 / 4.0;
   $add = $div + 0.5;
   $mul11 = $add * 512.0;
   $conv = (~~(($mul11)));
   $15 = $ny;
   $div12 = $15 / 4.0;
   $add13 = $div12 + 0.5;
   $mul14 = $add13 * 512.0;
   $conv15 = (~~(($mul14)));
   $mul16 = $conv15<<9;
   $add17 = (($conv) + ($mul16))|0;
   $pos = $add17;
   $16 = $pos;
   $arrayidx = (48 + ($16<<2)|0);
   $17 = HEAP32[$arrayidx>>2]|0;
   $inc18 = (($17) + 1)|0;
   HEAP32[$arrayidx>>2] = $inc18;
   $18 = HEAP32[2097200>>2]|0;
   $cmp19 = ($18|0)==(10000);
   if ($cmp19) {
    $call22 = (_show(1)|0);
    $tobool = ($call22|0)!=(0);
    if ($tobool) {
     label = 8;
     break;
    }
   }
  }
  $19 = $i;
  $inc27 = (($19) + 1)|0;
  $i = $inc27;
 }
 if ((label|0) == 4) {
  HEAP32[2097224>>2] = 1;
  _initialize();
  $retval = 0;
  $20 = $retval;
  STACKTOP = sp;return ($20|0);
 }
 else if ((label|0) == 8) {
  $retval = 0;
  $20 = $retval;
  STACKTOP = sp;return ($20|0);
 }
 else if ((label|0) == 13) {
  $call28 = (_show(0)|0);
  $tobool29 = ($call28|0)!=(0);
  if ($tobool29) {
   $retval = 0;
   $20 = $retval;
   STACKTOP = sp;return ($20|0);
  } else {
   $retval = 1;
   $20 = $retval;
   STACKTOP = sp;return ($20|0);
  }
 }
 return 0|0;
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i144 = 0, $$pre$i66$i = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i145Z2D = 0, $$pre$phi$i67$iZ2D = 0, $$pre$phi$iZ2D = 0, $$pre$phiZ2D = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0;
 var $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0;
 var $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0;
 var $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0;
 var $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0;
 var $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0;
 var $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0;
 var $215 = 0, $216 = 0, $217 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F$0$i$i = 0, $F104$0 = 0, $F197$0$i = 0, $F224$0$i$i = 0, $F289$0$i = 0, $I252$0$i$i = 0, $I315$0$i = 0, $I57$0$c$i$i = 0, $I57$0$i$i = 0, $K105$017$i$i = 0, $K305$043$i$i = 0, $K372$024$i = 0;
 var $R$0$i = 0, $R$0$i$i = 0, $R$0$i135 = 0, $R$1$i = 0, $R$1$i$i = 0, $R$1$i137 = 0, $RP$0$i = 0, $RP$0$i$i = 0, $RP$0$i134 = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i69$i = 0, $T$016$i$i = 0, $T$023$i = 0, $T$042$i$i = 0, $add$i = 0, $add$i$i = 0, $add$i113 = 0, $add$i147 = 0, $add$ptr$i = 0;
 var $add$ptr$i$i = 0, $add$ptr$i$i$i = 0, $add$ptr$i10$i$i = 0, $add$ptr$i11$i = 0, $add$ptr$i126 = 0, $add$ptr$i160 = 0, $add$ptr$i22$i = 0, $add$ptr$i37$i = 0, $add$ptr$sum$i$i = 0, $add$ptr$sum$i141172 = 0, $add$ptr$sum$i173 = 0, $add$ptr$sum1$i = 0, $add$ptr$sum1$i142 = 0, $add$ptr$sum10$i = 0, $add$ptr$sum104 = 0, $add$ptr$sum11$i = 0, $add$ptr$sum12$i = 0, $add$ptr$sum13$i = 0, $add$ptr$sum14$i = 0, $add$ptr$sum2$i = 0;
 var $add$ptr$sum3$i = 0, $add$ptr$sum4$i = 0, $add$ptr$sum5$i = 0, $add$ptr$sum6$i = 0, $add$ptr$sum7$i = 0, $add$ptr$sum8$i = 0, $add$ptr$sum9$i = 0, $add$ptr14$i$i = 0, $add$ptr16$i$i = 0, $add$ptr16$sum$i$i = 0, $add$ptr16$sum23$i$i = 0, $add$ptr16$sum25$i$i = 0, $add$ptr16$sum2627$i$i = 0, $add$ptr16$sum2829$i$i = 0, $add$ptr16$sum3031$i$i = 0, $add$ptr16$sum32$i$i = 0, $add$ptr16$sum4$i$i = 0, $add$ptr16$sum56$i$i = 0, $add$ptr16$sum7$i$i = 0, $add$ptr165 = 0;
 var $add$ptr165$sum = 0, $add$ptr168 = 0, $add$ptr17$i$i = 0, $add$ptr17$sum$i$i = 0, $add$ptr17$sum10$i$i = 0, $add$ptr17$sum11$i$i = 0, $add$ptr17$sum12$i$i = 0, $add$ptr17$sum13$i$i = 0, $add$ptr17$sum16$i$i = 0, $add$ptr17$sum17$i$i = 0, $add$ptr17$sum18$i$i = 0, $add$ptr17$sum19$i$i = 0, $add$ptr17$sum20$i$i = 0, $add$ptr17$sum21$i$i = 0, $add$ptr17$sum22$i$i = 0, $add$ptr17$sum23$i$i = 0, $add$ptr17$sum33$i$i = 0, $add$ptr17$sum34$i$i = 0, $add$ptr17$sum35$i$i = 0, $add$ptr17$sum8$i$i = 0;
 var $add$ptr17$sum9$i$i = 0, $add$ptr177$sum = 0, $add$ptr181 = 0, $add$ptr181$sum$i = 0, $add$ptr186$i = 0, $add$ptr190 = 0, $add$ptr190$i = 0, $add$ptr190$sum = 0, $add$ptr196 = 0, $add$ptr2$sum$i$i = 0, $add$ptr2$sum1$i$i = 0, $add$ptr205$i$i = 0, $add$ptr212$i$i = 0, $add$ptr224$i = 0, $add$ptr224$sum$i = 0, $add$ptr224$sum131$i = 0, $add$ptr224$sum132$i = 0, $add$ptr224$sum133$i = 0, $add$ptr224$sum134$i = 0, $add$ptr224$sum135$i = 0;
 var $add$ptr224$sum136$i = 0, $add$ptr224$sum137$i = 0, $add$ptr224$sum138$i = 0, $add$ptr224$sum139$i = 0, $add$ptr224$sum140$i = 0, $add$ptr224$sum141$i = 0, $add$ptr224$sum142$i = 0, $add$ptr224$sum143$i = 0, $add$ptr225$i = 0, $add$ptr2418$i$i = 0, $add$ptr2420$i$i = 0, $add$ptr255$i = 0, $add$ptr255$sum$i = 0, $add$ptr262$i = 0, $add$ptr272$sum$i = 0, $add$ptr281$i = 0, $add$ptr3$i$i = 0, $add$ptr30$i$i = 0, $add$ptr30$i52$i = 0, $add$ptr30$sum$i$i = 0;
 var $add$ptr368$i$i = 0, $add$ptr4$i$i = 0, $add$ptr4$i$i$i = 0, $add$ptr4$i28$i = 0, $add$ptr4$i43$i = 0, $add$ptr4$sum$i$i = 0, $add$ptr4$sum$i$i$i = 0, $add$ptr4$sum$i31$i = 0, $add$ptr4$sum$i49$i = 0, $add$ptr4$sum1$i$i = 0, $add$ptr4$sum1415$i$i = 0, $add$ptr436$i = 0, $add$ptr5$i$i = 0, $add$ptr6$sum$i$i = 0, $add$ptr6$sum$i$i$i = 0, $add$ptr6$sum$i33$i = 0, $add$ptr7$i$i = 0, $add$ptr82$i$i = 0, $add$ptr95 = 0, $add$ptr95$sum102 = 0;
 var $add$ptr98 = 0, $add10$i = 0, $add107$i = 0, $add13$i = 0, $add137$i = 0, $add14$i = 0, $add143 = 0, $add147$i = 0, $add17$i = 0, $add17$i150 = 0, $add177$i = 0, $add18$i = 0, $add19$i = 0, $add2 = 0, $add20$i = 0, $add206$i$i = 0, $add209$i = 0, $add212$i = 0, $add22$i = 0, $add243$i = 0;
 var $add26$i$i = 0, $add267$i = 0, $add269$i$i = 0, $add274$i$i = 0, $add278$i$i = 0, $add280$i$i = 0, $add283$i$i = 0, $add336$i = 0, $add341$i = 0, $add345$i = 0, $add347$i = 0, $add350$i = 0, $add43$i = 0, $add48$i = 0, $add50 = 0, $add51$i = 0, $add54 = 0, $add58 = 0, $add62 = 0, $add64 = 0;
 var $add74$i = 0, $add74$i$i = 0, $add77$i = 0, $add79$i$i = 0, $add8 = 0, $add81$i = 0, $add83$i$i = 0, $add85$i = 0, $add85$i$i = 0, $add88$i$i = 0, $add89$i = 0, $add9$i = 0, $add91$i = 0, $add98$i = 0, $and = 0, $and$i = 0, $and$i$i = 0, $and$i$i$i = 0, $and$i110 = 0, $and$i12$i = 0;
 var $and$i14$i = 0, $and$i23$i = 0, $and$i38$i = 0, $and101$i = 0, $and103$i = 0, $and106 = 0, $and11$i = 0, $and119$i$i = 0, $and11914$i$i = 0, $and12$i = 0, $and13$i = 0, $and13$i$i = 0, $and133$i$i = 0, $and14 = 0, $and144 = 0, $and17$i = 0, $and191$i = 0, $and193$i = 0, $and199$i = 0, $and209$i$i = 0;
 var $and21$i = 0, $and21$i116 = 0, $and227$i$i = 0, $and233$i = 0, $and26$i = 0, $and264$i$i = 0, $and268$i$i = 0, $and273$i$i = 0, $and282$i$i = 0, $and291$i = 0, $and295$i$i = 0, $and3$i = 0, $and3$i$i = 0, $and3$i$i$i = 0, $and3$i25$i = 0, $and3$i40$i = 0, $and30$i = 0, $and318$i$i = 0, $and31840$i$i = 0, $and32$i = 0;
 var $and32$i$i = 0, $and33$i$i = 0, $and330$i = 0, $and335$i = 0, $and340$i = 0, $and349$i = 0, $and362$i = 0, $and37$i$i = 0, $and386$i = 0, $and38621$i = 0, $and39$i = 0, $and4 = 0, $and40$i$i = 0, $and41 = 0, $and43 = 0, $and46 = 0, $and46$i = 0, $and49 = 0, $and49$i$i = 0, $and53 = 0;
 var $and57 = 0, $and6$i = 0, $and6$i$i = 0, $and6$i44$i = 0, $and61 = 0, $and63$i = 0, $and67$i = 0, $and69$i$i = 0, $and7 = 0, $and7$i$i = 0, $and72$i = 0, $and73$i$i = 0, $and74 = 0, $and76$i = 0, $and77$$i = 0, $and77$i = 0, $and78$i$i = 0, $and8$i = 0, $and80$i = 0, $and84$i = 0;
 var $and87$i$i = 0, $and88$i = 0, $and9$i = 0, $and96$i$i = 0, $and99$i = 0, $arrayidx = 0, $arrayidx$i = 0, $arrayidx$i$i = 0, $arrayidx$i117 = 0, $arrayidx$i21$i = 0, $arrayidx$i57$i = 0, $arrayidx$sum = 0, $arrayidx$sum$i$i = 0, $arrayidx$sum$pre$i$i = 0, $arrayidx$sum1$i$i = 0, $arrayidx$sum9$i$i = 0, $arrayidx103 = 0, $arrayidx103$i$i = 0, $arrayidx103$sum$pre = 0, $arrayidx103$sum103 = 0;
 var $arrayidx105$i = 0, $arrayidx107$i$i = 0, $arrayidx112$i = 0, $arrayidx113$i = 0, $arrayidx121$i = 0, $arrayidx123$i$i = 0, $arrayidx126$i$i = 0, $arrayidx137$i = 0, $arrayidx143$i$i = 0, $arrayidx148$i = 0, $arrayidx150$i = 0, $arrayidx151$i$i = 0, $arrayidx154$i = 0, $arrayidx154$i131 = 0, $arrayidx160$i = 0, $arrayidx164$i = 0, $arrayidx165$i = 0, $arrayidx178$i$i = 0, $arrayidx183$i = 0, $arrayidx184$i$i = 0;
 var $arrayidx195$i$i = 0, $arrayidx196$i = 0, $arrayidx196$sum$pre$i = 0, $arrayidx196$sum2$i = 0, $arrayidx203$i = 0, $arrayidx211$i = 0, $arrayidx223$i$i = 0, $arrayidx223$sum$pre$i$i = 0, $arrayidx223$sum24$i$i = 0, $arrayidx227$i = 0, $arrayidx23$i = 0, $arrayidx238$i = 0, $arrayidx244$i = 0, $arrayidx255$i = 0, $arrayidx27$i = 0, $arrayidx287$i$i = 0, $arrayidx288$i = 0, $arrayidx288$sum$pre$i = 0, $arrayidx288$sum15$i = 0, $arrayidx290$i$i = 0;
 var $arrayidx325$i$i = 0, $arrayidx354$i = 0, $arrayidx357$i = 0, $arrayidx393$i = 0, $arrayidx40$i = 0, $arrayidx44$i = 0, $arrayidx61$i = 0, $arrayidx65$i = 0, $arrayidx66 = 0, $arrayidx66$sum = 0, $arrayidx71$i = 0, $arrayidx75$i = 0, $arrayidx91$i$i = 0, $arrayidx92$i$i = 0, $arrayidx93$i = 0, $arrayidx94$i = 0, $arrayidx96$i$i = 0, $bk = 0, $bk$i = 0, $bk$i$i = 0;
 var $bk$i128 = 0, $bk$i55$i = 0, $bk102$i$i = 0, $bk122 = 0, $bk124 = 0, $bk135$i = 0, $bk139$i$i = 0, $bk155$i$i = 0, $bk158$i$i = 0, $bk218$i = 0, $bk220$i = 0, $bk246$i$i = 0, $bk248$i$i = 0, $bk302$i$i = 0, $bk310$i = 0, $bk312$i = 0, $bk338$i$i = 0, $bk357$i$i = 0, $bk360$i$i = 0, $bk369$i = 0;
 var $bk406$i = 0, $bk425$i = 0, $bk428$i = 0, $bk43$i$i = 0, $bk47$i = 0, $bk55$i$i = 0, $bk67$i$i = 0, $bk74$i$i = 0, $bk78 = 0, $bk82$i$i = 0, $br$0$i = 0, $call$i$i = 0, $call104$i = 0, $call128$i = 0, $call129$i = 0, $call265$i = 0, $call34$$i = 0, $call34$i = 0, $call6$i$i = 0, $call65$i = 0;
 var $call80$$i = 0, $call80$i = 0, $child$i$i = 0, $child166$i$i = 0, $child289$i$i = 0, $child289$sum$i$i = 0, $child356$i = 0, $child356$sum$i = 0, $cmp = 0, $cmp$i = 0, $cmp$i$i$i = 0, $cmp$i107 = 0, $cmp$i11$i$i = 0, $cmp$i13$i = 0, $cmp$i146 = 0, $cmp$i15$i = 0, $cmp$i24$i = 0, $cmp$i39$i = 0, $cmp$i9$i = 0, $cmp1 = 0;
 var $cmp1$i = 0, $cmp1$i$i = 0, $cmp10 = 0, $cmp100$i$i = 0, $cmp101$i = 0, $cmp102$i = 0, $cmp104$i$i = 0, $cmp105$i = 0, $cmp106$i = 0, $cmp106$i$i = 0, $cmp107$i = 0, $cmp108$i$i = 0, $cmp112$i$i = 0, $cmp113 = 0, $cmp114$i = 0, $cmp115$i = 0, $cmp115$i162 = 0, $cmp118$i = 0, $cmp12$i = 0, $cmp120$i = 0;
 var $cmp120$i$i = 0, $cmp120$i63$i = 0, $cmp12015$i$i = 0, $cmp122$i = 0, $cmp124$i = 0, $cmp124$i$i = 0, $cmp126$i = 0, $cmp127$i = 0, $cmp128 = 0, $cmp128$i$i = 0, $cmp130$i = 0, $cmp132$i = 0, $cmp133$i$i = 0, $cmp134$i = 0, $cmp136$i = 0, $cmp137$i$i = 0, $cmp138 = 0, $cmp138$i = 0, $cmp138$i164 = 0, $cmp139$i = 0;
 var $cmp142$i = 0, $cmp144$i$i = 0, $cmp145 = 0, $cmp147$i$i = 0, $cmp148$i = 0, $cmp15 = 0, $cmp15$i = 0, $cmp150$i$i = 0, $cmp151$i = 0, $cmp154$i = 0, $cmp155 = 0, $cmp155$i = 0, $cmp155$i132 = 0, $cmp156$i = 0, $cmp156$i$i = 0, $cmp159$i = 0, $cmp159$i166 = 0, $cmp16 = 0, $cmp160$i$i = 0, $cmp161 = 0;
 var $cmp161$i = 0, $cmp165$i = 0, $cmp168$i$i = 0, $cmp170$i = 0, $cmp172$i$i = 0, $cmp174$i = 0, $cmp179$i = 0, $cmp183 = 0, $cmp183$i = 0, $cmp184$i = 0, $cmp185$i$i = 0, $cmp187$i = 0, $cmp189$i$i = 0, $cmp19$i = 0, $cmp191$i = 0, $cmp197$i = 0, $cmp2$i$i = 0, $cmp2$i$i$i = 0, $cmp20$i$i = 0, $cmp200$i = 0;
 var $cmp204$i = 0, $cmp206$i = 0, $cmp208$i = 0, $cmp21$i = 0, $cmp215$i = 0, $cmp215$i$i = 0, $cmp216$i = 0, $cmp220$i = 0, $cmp221$i = 0, $cmp225$i = 0, $cmp228$i = 0, $cmp232$i = 0, $cmp236$i$i = 0, $cmp24$i = 0, $cmp24$i$i = 0, $cmp245$i = 0, $cmp249$i = 0, $cmp250$i = 0, $cmp254$i$i = 0, $cmp258$i$i = 0;
 var $cmp26$i = 0, $cmp264$i = 0, $cmp27$i$i = 0, $cmp2719$i$i = 0, $cmp28$i = 0, $cmp28$i$i = 0, $cmp283$i = 0, $cmp29 = 0, $cmp29$i = 0, $cmp3$i$i = 0, $cmp300$i = 0, $cmp306$i$i = 0, $cmp31 = 0, $cmp318$i = 0, $cmp319$i$i = 0, $cmp31941$i$i = 0, $cmp32$i = 0, $cmp32$i152 = 0, $cmp322$i = 0, $cmp327$i$i = 0;
 var $cmp33$i = 0, $cmp332$i$i = 0, $cmp34$i = 0, $cmp34$i$i = 0, $cmp346$i$i = 0, $cmp35$i = 0, $cmp35$i154 = 0, $cmp350$i$i = 0, $cmp36$i = 0, $cmp36$i$i = 0, $cmp373$i = 0, $cmp38$i$i = 0, $cmp387$i = 0, $cmp38722$i = 0, $cmp395$i = 0, $cmp40$i = 0, $cmp40$i155 = 0, $cmp400$i = 0, $cmp41$i$i = 0, $cmp414$i = 0;
 var $cmp418$i = 0, $cmp42$i$i = 0, $cmp44$i$i = 0, $cmp45$i = 0, $cmp45$i123 = 0, $cmp46$i = 0, $cmp46$i$i = 0, $cmp46$i59$i = 0, $cmp48$i = 0, $cmp49$i = 0, $cmp5 = 0, $cmp51$i = 0, $cmp52$i = 0, $cmp54$i = 0, $cmp54$i$i = 0, $cmp54$i156 = 0, $cmp56$i = 0, $cmp57$i = 0, $cmp57$i$i = 0, $cmp59$i$i = 0;
 var $cmp60$i = 0, $cmp60$i$i = 0, $cmp62$i = 0, $cmp63$i = 0, $cmp63$i$i = 0, $cmp64$i = 0, $cmp66$i = 0, $cmp66$i158 = 0, $cmp7$i$i = 0, $cmp70 = 0, $cmp72$i = 0, $cmp75$i$i = 0, $cmp76 = 0, $cmp76$i = 0, $cmp78$i = 0, $cmp79 = 0, $cmp81$i = 0, $cmp81$i$i = 0, $cmp82$i = 0, $cmp83$i$i = 0;
 var $cmp86$i = 0, $cmp86$i$i = 0, $cmp88$i = 0, $cmp9$i$i = 0, $cmp90$i = 0, $cmp90$i161 = 0, $cmp93$i = 0, $cmp95$i = 0, $cmp96$i = 0, $cmp9626$i = 0, $cmp97$i$i = 0, $cmp99 = 0, $cond = 0, $cond$i = 0, $cond$i$i = 0, $cond$i$i$i = 0, $cond$i17$i = 0, $cond$i27$i = 0, $cond$i42$i = 0, $cond$v$0$i = 0;
 var $cond115$i$i = 0, $cond13$i$i = 0, $cond15$i$i = 0, $cond18$i = 0, $cond315$i$i = 0, $cond37$i$i = 0, $cond382$i = 0, $cond4$i = 0, $cond6$i = 0, $exitcond$i$i = 0, $fd$i = 0, $fd$i$i = 0, $fd$i129 = 0, $fd103$i$i = 0, $fd123 = 0, $fd138$i = 0, $fd140$i$i = 0, $fd145$i$i = 0, $fd157$i$i = 0, $fd219$i = 0;
 var $fd247$i$i = 0, $fd303$i$i = 0, $fd311$i = 0, $fd339$i$i = 0, $fd344$i$i = 0, $fd359$i$i = 0, $fd370$i = 0, $fd407$i = 0, $fd412$i = 0, $fd427$i = 0, $fd50$i = 0, $fd54$i$i = 0, $fd59$i$i = 0, $fd68$pre$i$i = 0, $fd68$pre$phi$i$iZ2D = 0, $fd69 = 0, $fd78$i$i = 0, $fd85$i$i = 0, $fd9 = 0, $head = 0;
 var $head$i = 0, $head$i$i = 0, $head$i$i$i = 0, $head$i122 = 0, $head$i18$i = 0, $head$i32$i = 0, $head$i50$i = 0, $head118$i$i = 0, $head11813$i$i = 0, $head167 = 0, $head172 = 0, $head176 = 0, $head178 = 0, $head179$i = 0, $head182$i = 0, $head187$i = 0, $head189$i = 0, $head192 = 0, $head195 = 0, $head208$i$i = 0;
 var $head211$i$i = 0, $head23$i$i = 0, $head25 = 0, $head258$i = 0, $head261$i = 0, $head270$i = 0, $head273$i = 0, $head278$i = 0, $head280$i = 0, $head29$i = 0, $head29$i$i = 0, $head31$i$i = 0, $head317$i$i = 0, $head31739$i$i = 0, $head32$i$i = 0, $head34$i$i = 0, $head385$i = 0, $head38520$i = 0, $head7$i$i = 0, $head7$i$i$i = 0;
 var $head7$i34$i = 0, $head94 = 0, $head97 = 0, $head98$i = 0, $i$02$i$i = 0, $idx$0$i = 0, $inc$i$i = 0, $index$i = 0, $index$i$i = 0, $index$i138 = 0, $index$i64$i = 0, $index288$i$i = 0, $index355$i = 0, $mem$0 = 0, $nb$0 = 0, $neg = 0, $neg$i = 0, $neg$i$i = 0, $neg$i139 = 0, $neg$i149 = 0;
 var $neg100$i = 0, $neg13 = 0, $neg132$i$i = 0, $neg45$i = 0, $neg73 = 0, $next$i = 0, $next$i$i = 0, $next$i$i$i = 0, $next228$i = 0, $notlhs$i = 0, $notrhs$i = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i157 = 0, $or$cond1$i = 0, $or$cond16$i = 0, $or$cond2$i = 0, $or$cond3$i = 0, $or$cond4$i = 0, $or$cond6$not$i = 0;
 var $or$cond7$i = 0, $or$cond8$i = 0, $or$cond93$i = 0, $or$i = 0, $or$i$i = 0, $or$i$i$i = 0, $or$i163 = 0, $or$i30$i = 0, $or101$i$i = 0, $or110 = 0, $or166 = 0, $or171 = 0, $or175 = 0, $or178$i = 0, $or179 = 0, $or183$i = 0, $or186$i = 0, $or188$i = 0, $or19$i$i = 0, $or191 = 0;
 var $or194 = 0, $or204$i = 0, $or210$i$i = 0, $or22$i$i = 0, $or23 = 0, $or232$i$i = 0, $or257$i = 0, $or26 = 0, $or260$i = 0, $or269$i = 0, $or274$i = 0, $or277$i = 0, $or279$i = 0, $or28$i$i = 0, $or296$i = 0, $or300$i$i = 0, $or33$i$i = 0, $or367$i = 0, $or40 = 0, $or44$i$i = 0;
 var $or93 = 0, $or96 = 0, $parent$i = 0, $parent$i$i = 0, $parent$i127 = 0, $parent$i61$i = 0, $parent135$i = 0, $parent138$i$i = 0, $parent149$i = 0, $parent159$i$i = 0, $parent165$i$i = 0, $parent166$i = 0, $parent179$i$i = 0, $parent196$i$i = 0, $parent225$i = 0, $parent239$i = 0, $parent256$i = 0, $parent301$i$i = 0, $parent337$i$i = 0, $parent361$i$i = 0;
 var $parent368$i = 0, $parent405$i = 0, $parent429$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i120 = 0, $rsize$1$i = 0, $rsize$2$i = 0, $rsize$3$lcssa$i = 0, $rsize$328$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sflags190$i = 0, $sflags232$i = 0, $shl = 0, $shl$i = 0, $shl$i$i = 0, $shl$i111 = 0, $shl$i20$i = 0, $shl$i56$i = 0;
 var $shl102 = 0, $shl105 = 0, $shl116$i$i = 0, $shl12 = 0, $shl127$i$i = 0, $shl131$i$i = 0, $shl15$i = 0, $shl18$i = 0, $shl191$i = 0, $shl195$i = 0, $shl198$i = 0, $shl22 = 0, $shl221$i$i = 0, $shl226$i$i = 0, $shl265$i$i = 0, $shl270$i$i = 0, $shl276$i$i = 0, $shl279$i$i = 0, $shl287$i = 0, $shl290$i = 0;
 var $shl294$i$i = 0, $shl31$i = 0, $shl316$i$i = 0, $shl326$i$i = 0, $shl332$i = 0, $shl337$i = 0, $shl343$i = 0, $shl346$i = 0, $shl35 = 0, $shl361$i = 0, $shl37 = 0, $shl383$i = 0, $shl39$i$i = 0, $shl394$i = 0, $shl48$i$i = 0, $shl52$i = 0, $shl59$i = 0, $shl65 = 0, $shl70$i$i = 0, $shl72 = 0;
 var $shl75$i$i = 0, $shl81$i$i = 0, $shl84$i$i = 0, $shl9$i = 0, $shl90 = 0, $shl95$i$i = 0, $shr = 0, $shr$i = 0, $shr$i$i = 0, $shr$i106 = 0, $shr$i54$i = 0, $shr101 = 0, $shr11$i = 0, $shr11$i114 = 0, $shr110$i$i = 0, $shr12$i = 0, $shr123$i$i = 0, $shr15$i = 0, $shr16$i = 0, $shr16$i115 = 0;
 var $shr19$i = 0, $shr194$i = 0, $shr20$i = 0, $shr214$i$i = 0, $shr253$i$i = 0, $shr263$i$i = 0, $shr267$i$i = 0, $shr27$i = 0, $shr272$i$i = 0, $shr277$i$i = 0, $shr281$i$i = 0, $shr282$i = 0, $shr3 = 0, $shr310$i$i = 0, $shr317$i = 0, $shr322$i$i = 0, $shr329$i = 0, $shr334$i = 0, $shr339$i = 0, $shr344$i = 0;
 var $shr348$i = 0, $shr377$i = 0, $shr390$i = 0, $shr4$i = 0, $shr41$i = 0, $shr45 = 0, $shr47 = 0, $shr48 = 0, $shr5$i = 0, $shr5$i109 = 0, $shr51 = 0, $shr52 = 0, $shr55 = 0, $shr56 = 0, $shr58$i$i = 0, $shr59 = 0, $shr60 = 0, $shr63 = 0, $shr68$i$i = 0, $shr7$i = 0;
 var $shr7$i112 = 0, $shr71$i = 0, $shr72$i$i = 0, $shr74$i = 0, $shr75$i = 0, $shr77$i$i = 0, $shr78$i = 0, $shr79$i = 0, $shr8$i = 0, $shr82$i = 0, $shr82$i$i = 0, $shr83$i = 0, $shr86$i = 0, $shr86$i$i = 0, $shr87$i = 0, $shr90$i = 0, $size$i$i = 0, $size$i$i$i = 0, $size185$i = 0, $size242$i = 0;
 var $sizebits$0$i = 0, $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$0109$i = 0, $sp$1105$i = 0, $ssize$0$$i = 0, $ssize$0$i = 0, $ssize$1$i = 0, $ssize$2$i = 0, $sub = 0, $sub$i = 0, $sub$i$i = 0, $sub$i105 = 0, $sub$i148 = 0, $sub$ptr$lhs$cast$i = 0, $sub$ptr$lhs$cast$i$i = 0, $sub$ptr$lhs$cast$i46$i = 0, $sub$ptr$rhs$cast$i = 0, $sub$ptr$rhs$cast$i$i = 0, $sub$ptr$rhs$cast$i47$i = 0;
 var $sub$ptr$sub$i = 0, $sub$ptr$sub$i$i = 0, $sub$ptr$sub$i48$i = 0, $sub$ptr$sub$tsize$1$i = 0, $sub10$i = 0, $sub100$i = 0, $sub100$rsize$3$i = 0, $sub109$i = 0, $sub113$i$i = 0, $sub117$i = 0, $sub14$i = 0, $sub159 = 0, $sub16$i$i = 0, $sub169$i = 0, $sub18$i$i = 0, $sub187 = 0, $sub2$i = 0, $sub22$i = 0, $sub253$i = 0, $sub262$i$i = 0;
 var $sub266$i$i = 0, $sub271$i$i = 0, $sub275$i$i = 0, $sub30$i = 0, $sub31$i = 0, $sub31$rsize$0$i = 0, $sub313$i$i = 0, $sub328$i = 0, $sub33$i = 0, $sub333$i = 0, $sub338$i = 0, $sub342$i = 0, $sub38$i = 0, $sub380$i = 0, $sub4$i = 0, $sub42 = 0, $sub44 = 0, $sub47$i = 0, $sub5$i$i = 0, $sub5$i$i$i = 0;
 var $sub5$i29$i = 0, $sub6$i = 0, $sub62$i = 0, $sub66$i = 0, $sub67$i$i = 0, $sub69$i = 0, $sub71$i$i = 0, $sub76$i$i = 0, $sub80$i$i = 0, $sub91 = 0, $sub96$i = 0, $t$0$i = 0, $t$0$i119 = 0, $t$1$i = 0, $t$2$ph$i = 0, $t$2$v$3$i = 0, $t$227$i = 0, $tbase$0$i = 0, $tbase$291$i = 0, $tobool$i$i = 0;
 var $tobool107 = 0, $tobool192$i = 0, $tobool200$i = 0, $tobool228$i$i = 0, $tobool234$i = 0, $tobool27$i = 0, $tobool292$i = 0, $tobool296$i$i = 0, $tobool363$i = 0, $tobool97$i$i = 0, $tsize$0$i = 0, $tsize$0748284$i = 0, $tsize$1$i = 0, $tsize$290$i = 0, $v$0$i = 0, $v$0$i121 = 0, $v$1$i = 0, $v$2$i = 0, $v$3$lcssa$i = 0, $v$329$i = 0;
 var $xor$i$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $cmp = ($bytes>>>0)<(245);
 do {
  if ($cmp) {
   $cmp1 = ($bytes>>>0)<(11);
   if ($cmp1) {
    $cond = 16;
   } else {
    $add2 = (($bytes) + 11)|0;
    $and = $add2 & -8;
    $cond = $and;
   }
   $shr = $cond >>> 3;
   $0 = HEAP32[2097240>>2]|0;
   $shr3 = $0 >>> $shr;
   $and4 = $shr3 & 3;
   $cmp5 = ($and4|0)==(0);
   if (!($cmp5)) {
    $neg = $shr3 & 1;
    $and7 = $neg ^ 1;
    $add8 = (($and7) + ($shr))|0;
    $shl = $add8 << 1;
    $arrayidx = ((2097240 + ($shl<<2)|0) + 40|0);
    $arrayidx$sum = (($shl) + 2)|0;
    $1 = ((2097240 + ($arrayidx$sum<<2)|0) + 40|0);
    $2 = HEAP32[$1>>2]|0;
    $fd9 = (($2) + 8|0);
    $3 = HEAP32[$fd9>>2]|0;
    $cmp10 = ($arrayidx|0)==($3|0);
    do {
     if ($cmp10) {
      $shl12 = 1 << $add8;
      $neg13 = $shl12 ^ -1;
      $and14 = $0 & $neg13;
      HEAP32[2097240>>2] = $and14;
     } else {
      $4 = HEAP32[((2097240 + 16|0))>>2]|0;
      $cmp15 = ($3>>>0)<($4>>>0);
      if ($cmp15) {
       _abort();
       // unreachable;
      }
      $bk = (($3) + 12|0);
      $5 = HEAP32[$bk>>2]|0;
      $cmp16 = ($5|0)==($2|0);
      if ($cmp16) {
       HEAP32[$bk>>2] = $arrayidx;
       HEAP32[$1>>2] = $3;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $shl22 = $add8 << 3;
    $or23 = $shl22 | 3;
    $head = (($2) + 4|0);
    HEAP32[$head>>2] = $or23;
    $add$ptr$sum104 = $shl22 | 4;
    $head25 = (($2) + ($add$ptr$sum104)|0);
    $6 = HEAP32[$head25>>2]|0;
    $or26 = $6 | 1;
    HEAP32[$head25>>2] = $or26;
    $mem$0 = $fd9;
    STACKTOP = sp;return ($mem$0|0);
   }
   $7 = HEAP32[((2097240 + 8|0))>>2]|0;
   $cmp29 = ($cond>>>0)>($7>>>0);
   if ($cmp29) {
    $cmp31 = ($shr3|0)==(0);
    if (!($cmp31)) {
     $shl35 = $shr3 << $shr;
     $shl37 = 2 << $shr;
     $sub = (0 - ($shl37))|0;
     $or40 = $shl37 | $sub;
     $and41 = $shl35 & $or40;
     $sub42 = (0 - ($and41))|0;
     $and43 = $and41 & $sub42;
     $sub44 = (($and43) + -1)|0;
     $shr45 = $sub44 >>> 12;
     $and46 = $shr45 & 16;
     $shr47 = $sub44 >>> $and46;
     $shr48 = $shr47 >>> 5;
     $and49 = $shr48 & 8;
     $add50 = $and49 | $and46;
     $shr51 = $shr47 >>> $and49;
     $shr52 = $shr51 >>> 2;
     $and53 = $shr52 & 4;
     $add54 = $add50 | $and53;
     $shr55 = $shr51 >>> $and53;
     $shr56 = $shr55 >>> 1;
     $and57 = $shr56 & 2;
     $add58 = $add54 | $and57;
     $shr59 = $shr55 >>> $and57;
     $shr60 = $shr59 >>> 1;
     $and61 = $shr60 & 1;
     $add62 = $add58 | $and61;
     $shr63 = $shr59 >>> $and61;
     $add64 = (($add62) + ($shr63))|0;
     $shl65 = $add64 << 1;
     $arrayidx66 = ((2097240 + ($shl65<<2)|0) + 40|0);
     $arrayidx66$sum = (($shl65) + 2)|0;
     $8 = ((2097240 + ($arrayidx66$sum<<2)|0) + 40|0);
     $9 = HEAP32[$8>>2]|0;
     $fd69 = (($9) + 8|0);
     $10 = HEAP32[$fd69>>2]|0;
     $cmp70 = ($arrayidx66|0)==($10|0);
     do {
      if ($cmp70) {
       $shl72 = 1 << $add64;
       $neg73 = $shl72 ^ -1;
       $and74 = $0 & $neg73;
       HEAP32[2097240>>2] = $and74;
      } else {
       $11 = HEAP32[((2097240 + 16|0))>>2]|0;
       $cmp76 = ($10>>>0)<($11>>>0);
       if ($cmp76) {
        _abort();
        // unreachable;
       }
       $bk78 = (($10) + 12|0);
       $12 = HEAP32[$bk78>>2]|0;
       $cmp79 = ($12|0)==($9|0);
       if ($cmp79) {
        HEAP32[$bk78>>2] = $arrayidx66;
        HEAP32[$8>>2] = $10;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $shl90 = $add64 << 3;
     $sub91 = (($shl90) - ($cond))|0;
     $or93 = $cond | 3;
     $head94 = (($9) + 4|0);
     HEAP32[$head94>>2] = $or93;
     $add$ptr95 = (($9) + ($cond)|0);
     $or96 = $sub91 | 1;
     $add$ptr95$sum102 = $cond | 4;
     $head97 = (($9) + ($add$ptr95$sum102)|0);
     HEAP32[$head97>>2] = $or96;
     $add$ptr98 = (($9) + ($shl90)|0);
     HEAP32[$add$ptr98>>2] = $sub91;
     $13 = HEAP32[((2097240 + 8|0))>>2]|0;
     $cmp99 = ($13|0)==(0);
     if (!($cmp99)) {
      $14 = HEAP32[((2097240 + 20|0))>>2]|0;
      $shr101 = $13 >>> 3;
      $shl102 = $shr101 << 1;
      $arrayidx103 = ((2097240 + ($shl102<<2)|0) + 40|0);
      $15 = HEAP32[2097240>>2]|0;
      $shl105 = 1 << $shr101;
      $and106 = $15 & $shl105;
      $tobool107 = ($and106|0)==(0);
      if ($tobool107) {
       $or110 = $15 | $shl105;
       HEAP32[2097240>>2] = $or110;
       $arrayidx103$sum$pre = (($shl102) + 2)|0;
       $$pre = ((2097240 + ($arrayidx103$sum$pre<<2)|0) + 40|0);
       $$pre$phiZ2D = $$pre;$F104$0 = $arrayidx103;
      } else {
       $arrayidx103$sum103 = (($shl102) + 2)|0;
       $16 = ((2097240 + ($arrayidx103$sum103<<2)|0) + 40|0);
       $17 = HEAP32[$16>>2]|0;
       $18 = HEAP32[((2097240 + 16|0))>>2]|0;
       $cmp113 = ($17>>>0)<($18>>>0);
       if ($cmp113) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $16;$F104$0 = $17;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $14;
      $bk122 = (($F104$0) + 12|0);
      HEAP32[$bk122>>2] = $14;
      $fd123 = (($14) + 8|0);
      HEAP32[$fd123>>2] = $F104$0;
      $bk124 = (($14) + 12|0);
      HEAP32[$bk124>>2] = $arrayidx103;
     }
     HEAP32[((2097240 + 8|0))>>2] = $sub91;
     HEAP32[((2097240 + 20|0))>>2] = $add$ptr95;
     $mem$0 = $fd69;
     STACKTOP = sp;return ($mem$0|0);
    }
    $19 = HEAP32[((2097240 + 4|0))>>2]|0;
    $cmp128 = ($19|0)==(0);
    if ($cmp128) {
     $nb$0 = $cond;
    } else {
     $sub$i = (0 - ($19))|0;
     $and$i = $19 & $sub$i;
     $sub2$i = (($and$i) + -1)|0;
     $shr$i = $sub2$i >>> 12;
     $and3$i = $shr$i & 16;
     $shr4$i = $sub2$i >>> $and3$i;
     $shr5$i = $shr4$i >>> 5;
     $and6$i = $shr5$i & 8;
     $add$i = $and6$i | $and3$i;
     $shr7$i = $shr4$i >>> $and6$i;
     $shr8$i = $shr7$i >>> 2;
     $and9$i = $shr8$i & 4;
     $add10$i = $add$i | $and9$i;
     $shr11$i = $shr7$i >>> $and9$i;
     $shr12$i = $shr11$i >>> 1;
     $and13$i = $shr12$i & 2;
     $add14$i = $add10$i | $and13$i;
     $shr15$i = $shr11$i >>> $and13$i;
     $shr16$i = $shr15$i >>> 1;
     $and17$i = $shr16$i & 1;
     $add18$i = $add14$i | $and17$i;
     $shr19$i = $shr15$i >>> $and17$i;
     $add20$i = (($add18$i) + ($shr19$i))|0;
     $arrayidx$i = ((2097240 + ($add20$i<<2)|0) + 304|0);
     $20 = HEAP32[$arrayidx$i>>2]|0;
     $head$i = (($20) + 4|0);
     $21 = HEAP32[$head$i>>2]|0;
     $and21$i = $21 & -8;
     $sub22$i = (($and21$i) - ($cond))|0;
     $rsize$0$i = $sub22$i;$t$0$i = $20;$v$0$i = $20;
     while(1) {
      $arrayidx23$i = (($t$0$i) + 16|0);
      $22 = HEAP32[$arrayidx23$i>>2]|0;
      $cmp$i = ($22|0)==(0|0);
      if ($cmp$i) {
       $arrayidx27$i = (($t$0$i) + 20|0);
       $23 = HEAP32[$arrayidx27$i>>2]|0;
       $cmp28$i = ($23|0)==(0|0);
       if ($cmp28$i) {
        break;
       } else {
        $cond6$i = $23;
       }
      } else {
       $cond6$i = $22;
      }
      $head29$i = (($cond6$i) + 4|0);
      $24 = HEAP32[$head29$i>>2]|0;
      $and30$i = $24 & -8;
      $sub31$i = (($and30$i) - ($cond))|0;
      $cmp32$i = ($sub31$i>>>0)<($rsize$0$i>>>0);
      $sub31$rsize$0$i = $cmp32$i ? $sub31$i : $rsize$0$i;
      $cond$v$0$i = $cmp32$i ? $cond6$i : $v$0$i;
      $rsize$0$i = $sub31$rsize$0$i;$t$0$i = $cond6$i;$v$0$i = $cond$v$0$i;
     }
     $25 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp33$i = ($v$0$i>>>0)<($25>>>0);
     if ($cmp33$i) {
      _abort();
      // unreachable;
     }
     $add$ptr$i = (($v$0$i) + ($cond)|0);
     $cmp35$i = ($v$0$i>>>0)<($add$ptr$i>>>0);
     if (!($cmp35$i)) {
      _abort();
      // unreachable;
     }
     $parent$i = (($v$0$i) + 24|0);
     $26 = HEAP32[$parent$i>>2]|0;
     $bk$i = (($v$0$i) + 12|0);
     $27 = HEAP32[$bk$i>>2]|0;
     $cmp40$i = ($27|0)==($v$0$i|0);
     do {
      if ($cmp40$i) {
       $arrayidx61$i = (($v$0$i) + 20|0);
       $31 = HEAP32[$arrayidx61$i>>2]|0;
       $cmp62$i = ($31|0)==(0|0);
       if ($cmp62$i) {
        $arrayidx65$i = (($v$0$i) + 16|0);
        $32 = HEAP32[$arrayidx65$i>>2]|0;
        $cmp66$i = ($32|0)==(0|0);
        if ($cmp66$i) {
         $R$1$i = 0;
         break;
        } else {
         $R$0$i = $32;$RP$0$i = $arrayidx65$i;
        }
       } else {
        $R$0$i = $31;$RP$0$i = $arrayidx61$i;
       }
       while(1) {
        $arrayidx71$i = (($R$0$i) + 20|0);
        $33 = HEAP32[$arrayidx71$i>>2]|0;
        $cmp72$i = ($33|0)==(0|0);
        if (!($cmp72$i)) {
         $R$0$i = $33;$RP$0$i = $arrayidx71$i;
         continue;
        }
        $arrayidx75$i = (($R$0$i) + 16|0);
        $34 = HEAP32[$arrayidx75$i>>2]|0;
        $cmp76$i = ($34|0)==(0|0);
        if ($cmp76$i) {
         break;
        } else {
         $R$0$i = $34;$RP$0$i = $arrayidx75$i;
        }
       }
       $cmp81$i = ($RP$0$i>>>0)<($25>>>0);
       if ($cmp81$i) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$RP$0$i>>2] = 0;
        $R$1$i = $R$0$i;
        break;
       }
      } else {
       $fd$i = (($v$0$i) + 8|0);
       $28 = HEAP32[$fd$i>>2]|0;
       $cmp45$i = ($28>>>0)<($25>>>0);
       if ($cmp45$i) {
        _abort();
        // unreachable;
       }
       $bk47$i = (($28) + 12|0);
       $29 = HEAP32[$bk47$i>>2]|0;
       $cmp48$i = ($29|0)==($v$0$i|0);
       if (!($cmp48$i)) {
        _abort();
        // unreachable;
       }
       $fd50$i = (($27) + 8|0);
       $30 = HEAP32[$fd50$i>>2]|0;
       $cmp51$i = ($30|0)==($v$0$i|0);
       if ($cmp51$i) {
        HEAP32[$bk47$i>>2] = $27;
        HEAP32[$fd50$i>>2] = $28;
        $R$1$i = $27;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $cmp90$i = ($26|0)==(0|0);
     do {
      if (!($cmp90$i)) {
       $index$i = (($v$0$i) + 28|0);
       $35 = HEAP32[$index$i>>2]|0;
       $arrayidx94$i = ((2097240 + ($35<<2)|0) + 304|0);
       $36 = HEAP32[$arrayidx94$i>>2]|0;
       $cmp95$i = ($v$0$i|0)==($36|0);
       if ($cmp95$i) {
        HEAP32[$arrayidx94$i>>2] = $R$1$i;
        $cond4$i = ($R$1$i|0)==(0|0);
        if ($cond4$i) {
         $shl$i = 1 << $35;
         $neg$i = $shl$i ^ -1;
         $37 = HEAP32[((2097240 + 4|0))>>2]|0;
         $and103$i = $37 & $neg$i;
         HEAP32[((2097240 + 4|0))>>2] = $and103$i;
         break;
        }
       } else {
        $38 = HEAP32[((2097240 + 16|0))>>2]|0;
        $cmp107$i = ($26>>>0)<($38>>>0);
        if ($cmp107$i) {
         _abort();
         // unreachable;
        }
        $arrayidx113$i = (($26) + 16|0);
        $39 = HEAP32[$arrayidx113$i>>2]|0;
        $cmp114$i = ($39|0)==($v$0$i|0);
        if ($cmp114$i) {
         HEAP32[$arrayidx113$i>>2] = $R$1$i;
        } else {
         $arrayidx121$i = (($26) + 20|0);
         HEAP32[$arrayidx121$i>>2] = $R$1$i;
        }
        $cmp126$i = ($R$1$i|0)==(0|0);
        if ($cmp126$i) {
         break;
        }
       }
       $40 = HEAP32[((2097240 + 16|0))>>2]|0;
       $cmp130$i = ($R$1$i>>>0)<($40>>>0);
       if ($cmp130$i) {
        _abort();
        // unreachable;
       }
       $parent135$i = (($R$1$i) + 24|0);
       HEAP32[$parent135$i>>2] = $26;
       $arrayidx137$i = (($v$0$i) + 16|0);
       $41 = HEAP32[$arrayidx137$i>>2]|0;
       $cmp138$i = ($41|0)==(0|0);
       do {
        if (!($cmp138$i)) {
         $42 = HEAP32[((2097240 + 16|0))>>2]|0;
         $cmp142$i = ($41>>>0)<($42>>>0);
         if ($cmp142$i) {
          _abort();
          // unreachable;
         } else {
          $arrayidx148$i = (($R$1$i) + 16|0);
          HEAP32[$arrayidx148$i>>2] = $41;
          $parent149$i = (($41) + 24|0);
          HEAP32[$parent149$i>>2] = $R$1$i;
          break;
         }
        }
       } while(0);
       $arrayidx154$i = (($v$0$i) + 20|0);
       $43 = HEAP32[$arrayidx154$i>>2]|0;
       $cmp155$i = ($43|0)==(0|0);
       if (!($cmp155$i)) {
        $44 = HEAP32[((2097240 + 16|0))>>2]|0;
        $cmp159$i = ($43>>>0)<($44>>>0);
        if ($cmp159$i) {
         _abort();
         // unreachable;
        } else {
         $arrayidx165$i = (($R$1$i) + 20|0);
         HEAP32[$arrayidx165$i>>2] = $43;
         $parent166$i = (($43) + 24|0);
         HEAP32[$parent166$i>>2] = $R$1$i;
         break;
        }
       }
      }
     } while(0);
     $cmp174$i = ($rsize$0$i>>>0)<(16);
     if ($cmp174$i) {
      $add177$i = (($rsize$0$i) + ($cond))|0;
      $or178$i = $add177$i | 3;
      $head179$i = (($v$0$i) + 4|0);
      HEAP32[$head179$i>>2] = $or178$i;
      $add$ptr181$sum$i = (($add177$i) + 4)|0;
      $head182$i = (($v$0$i) + ($add$ptr181$sum$i)|0);
      $45 = HEAP32[$head182$i>>2]|0;
      $or183$i = $45 | 1;
      HEAP32[$head182$i>>2] = $or183$i;
     } else {
      $or186$i = $cond | 3;
      $head187$i = (($v$0$i) + 4|0);
      HEAP32[$head187$i>>2] = $or186$i;
      $or188$i = $rsize$0$i | 1;
      $add$ptr$sum$i173 = $cond | 4;
      $head189$i = (($v$0$i) + ($add$ptr$sum$i173)|0);
      HEAP32[$head189$i>>2] = $or188$i;
      $add$ptr$sum1$i = (($rsize$0$i) + ($cond))|0;
      $add$ptr190$i = (($v$0$i) + ($add$ptr$sum1$i)|0);
      HEAP32[$add$ptr190$i>>2] = $rsize$0$i;
      $46 = HEAP32[((2097240 + 8|0))>>2]|0;
      $cmp191$i = ($46|0)==(0);
      if (!($cmp191$i)) {
       $47 = HEAP32[((2097240 + 20|0))>>2]|0;
       $shr194$i = $46 >>> 3;
       $shl195$i = $shr194$i << 1;
       $arrayidx196$i = ((2097240 + ($shl195$i<<2)|0) + 40|0);
       $48 = HEAP32[2097240>>2]|0;
       $shl198$i = 1 << $shr194$i;
       $and199$i = $48 & $shl198$i;
       $tobool200$i = ($and199$i|0)==(0);
       if ($tobool200$i) {
        $or204$i = $48 | $shl198$i;
        HEAP32[2097240>>2] = $or204$i;
        $arrayidx196$sum$pre$i = (($shl195$i) + 2)|0;
        $$pre$i = ((2097240 + ($arrayidx196$sum$pre$i<<2)|0) + 40|0);
        $$pre$phi$iZ2D = $$pre$i;$F197$0$i = $arrayidx196$i;
       } else {
        $arrayidx196$sum2$i = (($shl195$i) + 2)|0;
        $49 = ((2097240 + ($arrayidx196$sum2$i<<2)|0) + 40|0);
        $50 = HEAP32[$49>>2]|0;
        $51 = HEAP32[((2097240 + 16|0))>>2]|0;
        $cmp208$i = ($50>>>0)<($51>>>0);
        if ($cmp208$i) {
         _abort();
         // unreachable;
        } else {
         $$pre$phi$iZ2D = $49;$F197$0$i = $50;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $47;
       $bk218$i = (($F197$0$i) + 12|0);
       HEAP32[$bk218$i>>2] = $47;
       $fd219$i = (($47) + 8|0);
       HEAP32[$fd219$i>>2] = $F197$0$i;
       $bk220$i = (($47) + 12|0);
       HEAP32[$bk220$i>>2] = $arrayidx196$i;
      }
      HEAP32[((2097240 + 8|0))>>2] = $rsize$0$i;
      HEAP32[((2097240 + 20|0))>>2] = $add$ptr$i;
     }
     $add$ptr225$i = (($v$0$i) + 8|0);
     $mem$0 = $add$ptr225$i;
     STACKTOP = sp;return ($mem$0|0);
    }
   } else {
    $nb$0 = $cond;
   }
  } else {
   $cmp138 = ($bytes>>>0)>(4294967231);
   if ($cmp138) {
    $nb$0 = -1;
   } else {
    $add143 = (($bytes) + 11)|0;
    $and144 = $add143 & -8;
    $52 = HEAP32[((2097240 + 4|0))>>2]|0;
    $cmp145 = ($52|0)==(0);
    if ($cmp145) {
     $nb$0 = $and144;
    } else {
     $sub$i105 = (0 - ($and144))|0;
     $shr$i106 = $add143 >>> 8;
     $cmp$i107 = ($shr$i106|0)==(0);
     if ($cmp$i107) {
      $idx$0$i = 0;
     } else {
      $cmp1$i = ($and144>>>0)>(16777215);
      if ($cmp1$i) {
       $idx$0$i = 31;
      } else {
       $sub4$i = (($shr$i106) + 1048320)|0;
       $shr5$i109 = $sub4$i >>> 16;
       $and$i110 = $shr5$i109 & 8;
       $shl$i111 = $shr$i106 << $and$i110;
       $sub6$i = (($shl$i111) + 520192)|0;
       $shr7$i112 = $sub6$i >>> 16;
       $and8$i = $shr7$i112 & 4;
       $add$i113 = $and8$i | $and$i110;
       $shl9$i = $shl$i111 << $and8$i;
       $sub10$i = (($shl9$i) + 245760)|0;
       $shr11$i114 = $sub10$i >>> 16;
       $and12$i = $shr11$i114 & 2;
       $add13$i = $add$i113 | $and12$i;
       $sub14$i = (14 - ($add13$i))|0;
       $shl15$i = $shl9$i << $and12$i;
       $shr16$i115 = $shl15$i >>> 15;
       $add17$i = (($sub14$i) + ($shr16$i115))|0;
       $shl18$i = $add17$i << 1;
       $add19$i = (($add17$i) + 7)|0;
       $shr20$i = $and144 >>> $add19$i;
       $and21$i116 = $shr20$i & 1;
       $add22$i = $and21$i116 | $shl18$i;
       $idx$0$i = $add22$i;
      }
     }
     $arrayidx$i117 = ((2097240 + ($idx$0$i<<2)|0) + 304|0);
     $53 = HEAP32[$arrayidx$i117>>2]|0;
     $cmp24$i = ($53|0)==(0|0);
     L126: do {
      if ($cmp24$i) {
       $rsize$2$i = $sub$i105;$t$1$i = 0;$v$2$i = 0;
      } else {
       $cmp26$i = ($idx$0$i|0)==(31);
       if ($cmp26$i) {
        $cond$i = 0;
       } else {
        $shr27$i = $idx$0$i >>> 1;
        $sub30$i = (25 - ($shr27$i))|0;
        $cond$i = $sub30$i;
       }
       $shl31$i = $and144 << $cond$i;
       $rsize$0$i120 = $sub$i105;$rst$0$i = 0;$sizebits$0$i = $shl31$i;$t$0$i119 = $53;$v$0$i121 = 0;
       while(1) {
        $head$i122 = (($t$0$i119) + 4|0);
        $54 = HEAP32[$head$i122>>2]|0;
        $and32$i = $54 & -8;
        $sub33$i = (($and32$i) - ($and144))|0;
        $cmp34$i = ($sub33$i>>>0)<($rsize$0$i120>>>0);
        if ($cmp34$i) {
         $cmp36$i = ($and32$i|0)==($and144|0);
         if ($cmp36$i) {
          $rsize$2$i = $sub33$i;$t$1$i = $t$0$i119;$v$2$i = $t$0$i119;
          break L126;
         } else {
          $rsize$1$i = $sub33$i;$v$1$i = $t$0$i119;
         }
        } else {
         $rsize$1$i = $rsize$0$i120;$v$1$i = $v$0$i121;
        }
        $arrayidx40$i = (($t$0$i119) + 20|0);
        $55 = HEAP32[$arrayidx40$i>>2]|0;
        $shr41$i = $sizebits$0$i >>> 31;
        $arrayidx44$i = ((($t$0$i119) + ($shr41$i<<2)|0) + 16|0);
        $56 = HEAP32[$arrayidx44$i>>2]|0;
        $cmp45$i123 = ($55|0)==(0|0);
        $cmp46$i = ($55|0)==($56|0);
        $or$cond$i = $cmp45$i123 | $cmp46$i;
        $rst$1$i = $or$cond$i ? $rst$0$i : $55;
        $cmp49$i = ($56|0)==(0|0);
        $shl52$i = $sizebits$0$i << 1;
        if ($cmp49$i) {
         $rsize$2$i = $rsize$1$i;$t$1$i = $rst$1$i;$v$2$i = $v$1$i;
         break;
        } else {
         $rsize$0$i120 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $shl52$i;$t$0$i119 = $56;$v$0$i121 = $v$1$i;
        }
       }
      }
     } while(0);
     $cmp54$i = ($t$1$i|0)==(0|0);
     $cmp56$i = ($v$2$i|0)==(0|0);
     $or$cond16$i = $cmp54$i & $cmp56$i;
     if ($or$cond16$i) {
      $shl59$i = 2 << $idx$0$i;
      $sub62$i = (0 - ($shl59$i))|0;
      $or$i = $shl59$i | $sub62$i;
      $and63$i = $52 & $or$i;
      $cmp64$i = ($and63$i|0)==(0);
      if ($cmp64$i) {
       $nb$0 = $and144;
       break;
      }
      $sub66$i = (0 - ($and63$i))|0;
      $and67$i = $and63$i & $sub66$i;
      $sub69$i = (($and67$i) + -1)|0;
      $shr71$i = $sub69$i >>> 12;
      $and72$i = $shr71$i & 16;
      $shr74$i = $sub69$i >>> $and72$i;
      $shr75$i = $shr74$i >>> 5;
      $and76$i = $shr75$i & 8;
      $add77$i = $and76$i | $and72$i;
      $shr78$i = $shr74$i >>> $and76$i;
      $shr79$i = $shr78$i >>> 2;
      $and80$i = $shr79$i & 4;
      $add81$i = $add77$i | $and80$i;
      $shr82$i = $shr78$i >>> $and80$i;
      $shr83$i = $shr82$i >>> 1;
      $and84$i = $shr83$i & 2;
      $add85$i = $add81$i | $and84$i;
      $shr86$i = $shr82$i >>> $and84$i;
      $shr87$i = $shr86$i >>> 1;
      $and88$i = $shr87$i & 1;
      $add89$i = $add85$i | $and88$i;
      $shr90$i = $shr86$i >>> $and88$i;
      $add91$i = (($add89$i) + ($shr90$i))|0;
      $arrayidx93$i = ((2097240 + ($add91$i<<2)|0) + 304|0);
      $57 = HEAP32[$arrayidx93$i>>2]|0;
      $t$2$ph$i = $57;
     } else {
      $t$2$ph$i = $t$1$i;
     }
     $cmp9626$i = ($t$2$ph$i|0)==(0|0);
     if ($cmp9626$i) {
      $rsize$3$lcssa$i = $rsize$2$i;$v$3$lcssa$i = $v$2$i;
     } else {
      $rsize$328$i = $rsize$2$i;$t$227$i = $t$2$ph$i;$v$329$i = $v$2$i;
      while(1) {
       $head98$i = (($t$227$i) + 4|0);
       $58 = HEAP32[$head98$i>>2]|0;
       $and99$i = $58 & -8;
       $sub100$i = (($and99$i) - ($and144))|0;
       $cmp101$i = ($sub100$i>>>0)<($rsize$328$i>>>0);
       $sub100$rsize$3$i = $cmp101$i ? $sub100$i : $rsize$328$i;
       $t$2$v$3$i = $cmp101$i ? $t$227$i : $v$329$i;
       $arrayidx105$i = (($t$227$i) + 16|0);
       $59 = HEAP32[$arrayidx105$i>>2]|0;
       $cmp106$i = ($59|0)==(0|0);
       if (!($cmp106$i)) {
        $rsize$328$i = $sub100$rsize$3$i;$t$227$i = $59;$v$329$i = $t$2$v$3$i;
        continue;
       }
       $arrayidx112$i = (($t$227$i) + 20|0);
       $60 = HEAP32[$arrayidx112$i>>2]|0;
       $cmp96$i = ($60|0)==(0|0);
       if ($cmp96$i) {
        $rsize$3$lcssa$i = $sub100$rsize$3$i;$v$3$lcssa$i = $t$2$v$3$i;
        break;
       } else {
        $rsize$328$i = $sub100$rsize$3$i;$t$227$i = $60;$v$329$i = $t$2$v$3$i;
       }
      }
     }
     $cmp115$i = ($v$3$lcssa$i|0)==(0|0);
     if ($cmp115$i) {
      $nb$0 = $and144;
     } else {
      $61 = HEAP32[((2097240 + 8|0))>>2]|0;
      $sub117$i = (($61) - ($and144))|0;
      $cmp118$i = ($rsize$3$lcssa$i>>>0)<($sub117$i>>>0);
      if ($cmp118$i) {
       $62 = HEAP32[((2097240 + 16|0))>>2]|0;
       $cmp120$i = ($v$3$lcssa$i>>>0)<($62>>>0);
       if ($cmp120$i) {
        _abort();
        // unreachable;
       }
       $add$ptr$i126 = (($v$3$lcssa$i) + ($and144)|0);
       $cmp122$i = ($v$3$lcssa$i>>>0)<($add$ptr$i126>>>0);
       if (!($cmp122$i)) {
        _abort();
        // unreachable;
       }
       $parent$i127 = (($v$3$lcssa$i) + 24|0);
       $63 = HEAP32[$parent$i127>>2]|0;
       $bk$i128 = (($v$3$lcssa$i) + 12|0);
       $64 = HEAP32[$bk$i128>>2]|0;
       $cmp127$i = ($64|0)==($v$3$lcssa$i|0);
       do {
        if ($cmp127$i) {
         $arrayidx150$i = (($v$3$lcssa$i) + 20|0);
         $68 = HEAP32[$arrayidx150$i>>2]|0;
         $cmp151$i = ($68|0)==(0|0);
         if ($cmp151$i) {
          $arrayidx154$i131 = (($v$3$lcssa$i) + 16|0);
          $69 = HEAP32[$arrayidx154$i131>>2]|0;
          $cmp155$i132 = ($69|0)==(0|0);
          if ($cmp155$i132) {
           $R$1$i137 = 0;
           break;
          } else {
           $R$0$i135 = $69;$RP$0$i134 = $arrayidx154$i131;
          }
         } else {
          $R$0$i135 = $68;$RP$0$i134 = $arrayidx150$i;
         }
         while(1) {
          $arrayidx160$i = (($R$0$i135) + 20|0);
          $70 = HEAP32[$arrayidx160$i>>2]|0;
          $cmp161$i = ($70|0)==(0|0);
          if (!($cmp161$i)) {
           $R$0$i135 = $70;$RP$0$i134 = $arrayidx160$i;
           continue;
          }
          $arrayidx164$i = (($R$0$i135) + 16|0);
          $71 = HEAP32[$arrayidx164$i>>2]|0;
          $cmp165$i = ($71|0)==(0|0);
          if ($cmp165$i) {
           break;
          } else {
           $R$0$i135 = $71;$RP$0$i134 = $arrayidx164$i;
          }
         }
         $cmp170$i = ($RP$0$i134>>>0)<($62>>>0);
         if ($cmp170$i) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$0$i134>>2] = 0;
          $R$1$i137 = $R$0$i135;
          break;
         }
        } else {
         $fd$i129 = (($v$3$lcssa$i) + 8|0);
         $65 = HEAP32[$fd$i129>>2]|0;
         $cmp132$i = ($65>>>0)<($62>>>0);
         if ($cmp132$i) {
          _abort();
          // unreachable;
         }
         $bk135$i = (($65) + 12|0);
         $66 = HEAP32[$bk135$i>>2]|0;
         $cmp136$i = ($66|0)==($v$3$lcssa$i|0);
         if (!($cmp136$i)) {
          _abort();
          // unreachable;
         }
         $fd138$i = (($64) + 8|0);
         $67 = HEAP32[$fd138$i>>2]|0;
         $cmp139$i = ($67|0)==($v$3$lcssa$i|0);
         if ($cmp139$i) {
          HEAP32[$bk135$i>>2] = $64;
          HEAP32[$fd138$i>>2] = $65;
          $R$1$i137 = $64;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $cmp179$i = ($63|0)==(0|0);
       do {
        if (!($cmp179$i)) {
         $index$i138 = (($v$3$lcssa$i) + 28|0);
         $72 = HEAP32[$index$i138>>2]|0;
         $arrayidx183$i = ((2097240 + ($72<<2)|0) + 304|0);
         $73 = HEAP32[$arrayidx183$i>>2]|0;
         $cmp184$i = ($v$3$lcssa$i|0)==($73|0);
         if ($cmp184$i) {
          HEAP32[$arrayidx183$i>>2] = $R$1$i137;
          $cond18$i = ($R$1$i137|0)==(0|0);
          if ($cond18$i) {
           $shl191$i = 1 << $72;
           $neg$i139 = $shl191$i ^ -1;
           $74 = HEAP32[((2097240 + 4|0))>>2]|0;
           $and193$i = $74 & $neg$i139;
           HEAP32[((2097240 + 4|0))>>2] = $and193$i;
           break;
          }
         } else {
          $75 = HEAP32[((2097240 + 16|0))>>2]|0;
          $cmp197$i = ($63>>>0)<($75>>>0);
          if ($cmp197$i) {
           _abort();
           // unreachable;
          }
          $arrayidx203$i = (($63) + 16|0);
          $76 = HEAP32[$arrayidx203$i>>2]|0;
          $cmp204$i = ($76|0)==($v$3$lcssa$i|0);
          if ($cmp204$i) {
           HEAP32[$arrayidx203$i>>2] = $R$1$i137;
          } else {
           $arrayidx211$i = (($63) + 20|0);
           HEAP32[$arrayidx211$i>>2] = $R$1$i137;
          }
          $cmp216$i = ($R$1$i137|0)==(0|0);
          if ($cmp216$i) {
           break;
          }
         }
         $77 = HEAP32[((2097240 + 16|0))>>2]|0;
         $cmp220$i = ($R$1$i137>>>0)<($77>>>0);
         if ($cmp220$i) {
          _abort();
          // unreachable;
         }
         $parent225$i = (($R$1$i137) + 24|0);
         HEAP32[$parent225$i>>2] = $63;
         $arrayidx227$i = (($v$3$lcssa$i) + 16|0);
         $78 = HEAP32[$arrayidx227$i>>2]|0;
         $cmp228$i = ($78|0)==(0|0);
         do {
          if (!($cmp228$i)) {
           $79 = HEAP32[((2097240 + 16|0))>>2]|0;
           $cmp232$i = ($78>>>0)<($79>>>0);
           if ($cmp232$i) {
            _abort();
            // unreachable;
           } else {
            $arrayidx238$i = (($R$1$i137) + 16|0);
            HEAP32[$arrayidx238$i>>2] = $78;
            $parent239$i = (($78) + 24|0);
            HEAP32[$parent239$i>>2] = $R$1$i137;
            break;
           }
          }
         } while(0);
         $arrayidx244$i = (($v$3$lcssa$i) + 20|0);
         $80 = HEAP32[$arrayidx244$i>>2]|0;
         $cmp245$i = ($80|0)==(0|0);
         if (!($cmp245$i)) {
          $81 = HEAP32[((2097240 + 16|0))>>2]|0;
          $cmp249$i = ($80>>>0)<($81>>>0);
          if ($cmp249$i) {
           _abort();
           // unreachable;
          } else {
           $arrayidx255$i = (($R$1$i137) + 20|0);
           HEAP32[$arrayidx255$i>>2] = $80;
           $parent256$i = (($80) + 24|0);
           HEAP32[$parent256$i>>2] = $R$1$i137;
           break;
          }
         }
        }
       } while(0);
       $cmp264$i = ($rsize$3$lcssa$i>>>0)<(16);
       L204: do {
        if ($cmp264$i) {
         $add267$i = (($rsize$3$lcssa$i) + ($and144))|0;
         $or269$i = $add267$i | 3;
         $head270$i = (($v$3$lcssa$i) + 4|0);
         HEAP32[$head270$i>>2] = $or269$i;
         $add$ptr272$sum$i = (($add267$i) + 4)|0;
         $head273$i = (($v$3$lcssa$i) + ($add$ptr272$sum$i)|0);
         $82 = HEAP32[$head273$i>>2]|0;
         $or274$i = $82 | 1;
         HEAP32[$head273$i>>2] = $or274$i;
        } else {
         $or277$i = $and144 | 3;
         $head278$i = (($v$3$lcssa$i) + 4|0);
         HEAP32[$head278$i>>2] = $or277$i;
         $or279$i = $rsize$3$lcssa$i | 1;
         $add$ptr$sum$i141172 = $and144 | 4;
         $head280$i = (($v$3$lcssa$i) + ($add$ptr$sum$i141172)|0);
         HEAP32[$head280$i>>2] = $or279$i;
         $add$ptr$sum1$i142 = (($rsize$3$lcssa$i) + ($and144))|0;
         $add$ptr281$i = (($v$3$lcssa$i) + ($add$ptr$sum1$i142)|0);
         HEAP32[$add$ptr281$i>>2] = $rsize$3$lcssa$i;
         $shr282$i = $rsize$3$lcssa$i >>> 3;
         $cmp283$i = ($rsize$3$lcssa$i>>>0)<(256);
         if ($cmp283$i) {
          $shl287$i = $shr282$i << 1;
          $arrayidx288$i = ((2097240 + ($shl287$i<<2)|0) + 40|0);
          $83 = HEAP32[2097240>>2]|0;
          $shl290$i = 1 << $shr282$i;
          $and291$i = $83 & $shl290$i;
          $tobool292$i = ($and291$i|0)==(0);
          do {
           if ($tobool292$i) {
            $or296$i = $83 | $shl290$i;
            HEAP32[2097240>>2] = $or296$i;
            $arrayidx288$sum$pre$i = (($shl287$i) + 2)|0;
            $$pre$i144 = ((2097240 + ($arrayidx288$sum$pre$i<<2)|0) + 40|0);
            $$pre$phi$i145Z2D = $$pre$i144;$F289$0$i = $arrayidx288$i;
           } else {
            $arrayidx288$sum15$i = (($shl287$i) + 2)|0;
            $84 = ((2097240 + ($arrayidx288$sum15$i<<2)|0) + 40|0);
            $85 = HEAP32[$84>>2]|0;
            $86 = HEAP32[((2097240 + 16|0))>>2]|0;
            $cmp300$i = ($85>>>0)<($86>>>0);
            if (!($cmp300$i)) {
             $$pre$phi$i145Z2D = $84;$F289$0$i = $85;
             break;
            }
            _abort();
            // unreachable;
           }
          } while(0);
          HEAP32[$$pre$phi$i145Z2D>>2] = $add$ptr$i126;
          $bk310$i = (($F289$0$i) + 12|0);
          HEAP32[$bk310$i>>2] = $add$ptr$i126;
          $add$ptr$sum13$i = (($and144) + 8)|0;
          $fd311$i = (($v$3$lcssa$i) + ($add$ptr$sum13$i)|0);
          HEAP32[$fd311$i>>2] = $F289$0$i;
          $add$ptr$sum14$i = (($and144) + 12)|0;
          $bk312$i = (($v$3$lcssa$i) + ($add$ptr$sum14$i)|0);
          HEAP32[$bk312$i>>2] = $arrayidx288$i;
          break;
         }
         $shr317$i = $rsize$3$lcssa$i >>> 8;
         $cmp318$i = ($shr317$i|0)==(0);
         if ($cmp318$i) {
          $I315$0$i = 0;
         } else {
          $cmp322$i = ($rsize$3$lcssa$i>>>0)>(16777215);
          if ($cmp322$i) {
           $I315$0$i = 31;
          } else {
           $sub328$i = (($shr317$i) + 1048320)|0;
           $shr329$i = $sub328$i >>> 16;
           $and330$i = $shr329$i & 8;
           $shl332$i = $shr317$i << $and330$i;
           $sub333$i = (($shl332$i) + 520192)|0;
           $shr334$i = $sub333$i >>> 16;
           $and335$i = $shr334$i & 4;
           $add336$i = $and335$i | $and330$i;
           $shl337$i = $shl332$i << $and335$i;
           $sub338$i = (($shl337$i) + 245760)|0;
           $shr339$i = $sub338$i >>> 16;
           $and340$i = $shr339$i & 2;
           $add341$i = $add336$i | $and340$i;
           $sub342$i = (14 - ($add341$i))|0;
           $shl343$i = $shl337$i << $and340$i;
           $shr344$i = $shl343$i >>> 15;
           $add345$i = (($sub342$i) + ($shr344$i))|0;
           $shl346$i = $add345$i << 1;
           $add347$i = (($add345$i) + 7)|0;
           $shr348$i = $rsize$3$lcssa$i >>> $add347$i;
           $and349$i = $shr348$i & 1;
           $add350$i = $and349$i | $shl346$i;
           $I315$0$i = $add350$i;
          }
         }
         $arrayidx354$i = ((2097240 + ($I315$0$i<<2)|0) + 304|0);
         $add$ptr$sum2$i = (($and144) + 28)|0;
         $index355$i = (($v$3$lcssa$i) + ($add$ptr$sum2$i)|0);
         HEAP32[$index355$i>>2] = $I315$0$i;
         $add$ptr$sum3$i = (($and144) + 16)|0;
         $child356$i = (($v$3$lcssa$i) + ($add$ptr$sum3$i)|0);
         $child356$sum$i = (($and144) + 20)|0;
         $arrayidx357$i = (($v$3$lcssa$i) + ($child356$sum$i)|0);
         HEAP32[$arrayidx357$i>>2] = 0;
         HEAP32[$child356$i>>2] = 0;
         $87 = HEAP32[((2097240 + 4|0))>>2]|0;
         $shl361$i = 1 << $I315$0$i;
         $and362$i = $87 & $shl361$i;
         $tobool363$i = ($and362$i|0)==(0);
         if ($tobool363$i) {
          $or367$i = $87 | $shl361$i;
          HEAP32[((2097240 + 4|0))>>2] = $or367$i;
          HEAP32[$arrayidx354$i>>2] = $add$ptr$i126;
          $add$ptr$sum4$i = (($and144) + 24)|0;
          $parent368$i = (($v$3$lcssa$i) + ($add$ptr$sum4$i)|0);
          HEAP32[$parent368$i>>2] = $arrayidx354$i;
          $add$ptr$sum5$i = (($and144) + 12)|0;
          $bk369$i = (($v$3$lcssa$i) + ($add$ptr$sum5$i)|0);
          HEAP32[$bk369$i>>2] = $add$ptr$i126;
          $add$ptr$sum6$i = (($and144) + 8)|0;
          $fd370$i = (($v$3$lcssa$i) + ($add$ptr$sum6$i)|0);
          HEAP32[$fd370$i>>2] = $add$ptr$i126;
          break;
         }
         $88 = HEAP32[$arrayidx354$i>>2]|0;
         $cmp373$i = ($I315$0$i|0)==(31);
         if ($cmp373$i) {
          $cond382$i = 0;
         } else {
          $shr377$i = $I315$0$i >>> 1;
          $sub380$i = (25 - ($shr377$i))|0;
          $cond382$i = $sub380$i;
         }
         $head38520$i = (($88) + 4|0);
         $89 = HEAP32[$head38520$i>>2]|0;
         $and38621$i = $89 & -8;
         $cmp38722$i = ($and38621$i|0)==($rsize$3$lcssa$i|0);
         L225: do {
          if ($cmp38722$i) {
           $T$0$lcssa$i = $88;
          } else {
           $shl383$i = $rsize$3$lcssa$i << $cond382$i;
           $K372$024$i = $shl383$i;$T$023$i = $88;
           while(1) {
            $shr390$i = $K372$024$i >>> 31;
            $arrayidx393$i = ((($T$023$i) + ($shr390$i<<2)|0) + 16|0);
            $90 = HEAP32[$arrayidx393$i>>2]|0;
            $cmp395$i = ($90|0)==(0|0);
            if ($cmp395$i) {
             break;
            }
            $shl394$i = $K372$024$i << 1;
            $head385$i = (($90) + 4|0);
            $91 = HEAP32[$head385$i>>2]|0;
            $and386$i = $91 & -8;
            $cmp387$i = ($and386$i|0)==($rsize$3$lcssa$i|0);
            if ($cmp387$i) {
             $T$0$lcssa$i = $90;
             break L225;
            } else {
             $K372$024$i = $shl394$i;$T$023$i = $90;
            }
           }
           $92 = HEAP32[((2097240 + 16|0))>>2]|0;
           $cmp400$i = ($arrayidx393$i>>>0)<($92>>>0);
           if ($cmp400$i) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$arrayidx393$i>>2] = $add$ptr$i126;
            $add$ptr$sum10$i = (($and144) + 24)|0;
            $parent405$i = (($v$3$lcssa$i) + ($add$ptr$sum10$i)|0);
            HEAP32[$parent405$i>>2] = $T$023$i;
            $add$ptr$sum11$i = (($and144) + 12)|0;
            $bk406$i = (($v$3$lcssa$i) + ($add$ptr$sum11$i)|0);
            HEAP32[$bk406$i>>2] = $add$ptr$i126;
            $add$ptr$sum12$i = (($and144) + 8)|0;
            $fd407$i = (($v$3$lcssa$i) + ($add$ptr$sum12$i)|0);
            HEAP32[$fd407$i>>2] = $add$ptr$i126;
            break L204;
           }
          }
         } while(0);
         $fd412$i = (($T$0$lcssa$i) + 8|0);
         $93 = HEAP32[$fd412$i>>2]|0;
         $94 = HEAP32[((2097240 + 16|0))>>2]|0;
         $cmp414$i = ($T$0$lcssa$i>>>0)<($94>>>0);
         if ($cmp414$i) {
          _abort();
          // unreachable;
         }
         $cmp418$i = ($93>>>0)<($94>>>0);
         if ($cmp418$i) {
          _abort();
          // unreachable;
         } else {
          $bk425$i = (($93) + 12|0);
          HEAP32[$bk425$i>>2] = $add$ptr$i126;
          HEAP32[$fd412$i>>2] = $add$ptr$i126;
          $add$ptr$sum7$i = (($and144) + 8)|0;
          $fd427$i = (($v$3$lcssa$i) + ($add$ptr$sum7$i)|0);
          HEAP32[$fd427$i>>2] = $93;
          $add$ptr$sum8$i = (($and144) + 12)|0;
          $bk428$i = (($v$3$lcssa$i) + ($add$ptr$sum8$i)|0);
          HEAP32[$bk428$i>>2] = $T$0$lcssa$i;
          $add$ptr$sum9$i = (($and144) + 24)|0;
          $parent429$i = (($v$3$lcssa$i) + ($add$ptr$sum9$i)|0);
          HEAP32[$parent429$i>>2] = 0;
          break;
         }
        }
       } while(0);
       $add$ptr436$i = (($v$3$lcssa$i) + 8|0);
       $mem$0 = $add$ptr436$i;
       STACKTOP = sp;return ($mem$0|0);
      } else {
       $nb$0 = $and144;
      }
     }
    }
   }
  }
 } while(0);
 $95 = HEAP32[((2097240 + 8|0))>>2]|0;
 $cmp155 = ($nb$0>>>0)>($95>>>0);
 if (!($cmp155)) {
  $sub159 = (($95) - ($nb$0))|0;
  $96 = HEAP32[((2097240 + 20|0))>>2]|0;
  $cmp161 = ($sub159>>>0)>(15);
  if ($cmp161) {
   $add$ptr165 = (($96) + ($nb$0)|0);
   HEAP32[((2097240 + 20|0))>>2] = $add$ptr165;
   HEAP32[((2097240 + 8|0))>>2] = $sub159;
   $or166 = $sub159 | 1;
   $add$ptr165$sum = (($nb$0) + 4)|0;
   $head167 = (($96) + ($add$ptr165$sum)|0);
   HEAP32[$head167>>2] = $or166;
   $add$ptr168 = (($96) + ($95)|0);
   HEAP32[$add$ptr168>>2] = $sub159;
   $or171 = $nb$0 | 3;
   $head172 = (($96) + 4|0);
   HEAP32[$head172>>2] = $or171;
  } else {
   HEAP32[((2097240 + 8|0))>>2] = 0;
   HEAP32[((2097240 + 20|0))>>2] = 0;
   $or175 = $95 | 3;
   $head176 = (($96) + 4|0);
   HEAP32[$head176>>2] = $or175;
   $add$ptr177$sum = (($95) + 4)|0;
   $head178 = (($96) + ($add$ptr177$sum)|0);
   $97 = HEAP32[$head178>>2]|0;
   $or179 = $97 | 1;
   HEAP32[$head178>>2] = $or179;
  }
  $add$ptr181 = (($96) + 8|0);
  $mem$0 = $add$ptr181;
  STACKTOP = sp;return ($mem$0|0);
 }
 $98 = HEAP32[((2097240 + 12|0))>>2]|0;
 $cmp183 = ($nb$0>>>0)<($98>>>0);
 if ($cmp183) {
  $sub187 = (($98) - ($nb$0))|0;
  HEAP32[((2097240 + 12|0))>>2] = $sub187;
  $99 = HEAP32[((2097240 + 24|0))>>2]|0;
  $add$ptr190 = (($99) + ($nb$0)|0);
  HEAP32[((2097240 + 24|0))>>2] = $add$ptr190;
  $or191 = $sub187 | 1;
  $add$ptr190$sum = (($nb$0) + 4)|0;
  $head192 = (($99) + ($add$ptr190$sum)|0);
  HEAP32[$head192>>2] = $or191;
  $or194 = $nb$0 | 3;
  $head195 = (($99) + 4|0);
  HEAP32[$head195>>2] = $or194;
  $add$ptr196 = (($99) + 8|0);
  $mem$0 = $add$ptr196;
  STACKTOP = sp;return ($mem$0|0);
 }
 $100 = HEAP32[2097712>>2]|0;
 $cmp$i146 = ($100|0)==(0);
 do {
  if ($cmp$i146) {
   $call$i$i = (_sysconf(30)|0);
   $sub$i$i = (($call$i$i) + -1)|0;
   $and$i$i = $sub$i$i & $call$i$i;
   $cmp1$i$i = ($and$i$i|0)==(0);
   if ($cmp1$i$i) {
    HEAP32[((2097712 + 8|0))>>2] = $call$i$i;
    HEAP32[((2097712 + 4|0))>>2] = $call$i$i;
    HEAP32[((2097712 + 12|0))>>2] = -1;
    HEAP32[((2097712 + 16|0))>>2] = -1;
    HEAP32[((2097712 + 20|0))>>2] = 0;
    HEAP32[((2097240 + 444|0))>>2] = 0;
    $call6$i$i = (_time((0|0))|0);
    $xor$i$i = $call6$i$i & -16;
    $and7$i$i = $xor$i$i ^ 1431655768;
    HEAP32[2097712>>2] = $and7$i$i;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $add$i147 = (($nb$0) + 48)|0;
 $101 = HEAP32[((2097712 + 8|0))>>2]|0;
 $sub$i148 = (($nb$0) + 47)|0;
 $add9$i = (($101) + ($sub$i148))|0;
 $neg$i149 = (0 - ($101))|0;
 $and11$i = $add9$i & $neg$i149;
 $cmp12$i = ($and11$i>>>0)>($nb$0>>>0);
 if (!($cmp12$i)) {
  $mem$0 = 0;
  STACKTOP = sp;return ($mem$0|0);
 }
 $102 = HEAP32[((2097240 + 440|0))>>2]|0;
 $cmp15$i = ($102|0)==(0);
 if (!($cmp15$i)) {
  $103 = HEAP32[((2097240 + 432|0))>>2]|0;
  $add17$i150 = (($103) + ($and11$i))|0;
  $cmp19$i = ($add17$i150>>>0)<=($103>>>0);
  $cmp21$i = ($add17$i150>>>0)>($102>>>0);
  $or$cond1$i = $cmp19$i | $cmp21$i;
  if ($or$cond1$i) {
   $mem$0 = 0;
   STACKTOP = sp;return ($mem$0|0);
  }
 }
 $104 = HEAP32[((2097240 + 444|0))>>2]|0;
 $and26$i = $104 & 4;
 $tobool27$i = ($and26$i|0)==(0);
 L269: do {
  if ($tobool27$i) {
   $105 = HEAP32[((2097240 + 24|0))>>2]|0;
   $cmp29$i = ($105|0)==(0|0);
   L271: do {
    if ($cmp29$i) {
     label = 182;
    } else {
     $sp$0$i$i = ((2097240 + 448|0));
     while(1) {
      $106 = HEAP32[$sp$0$i$i>>2]|0;
      $cmp$i9$i = ($106>>>0)>($105>>>0);
      if (!($cmp$i9$i)) {
       $size$i$i = (($sp$0$i$i) + 4|0);
       $107 = HEAP32[$size$i$i>>2]|0;
       $add$ptr$i$i = (($106) + ($107)|0);
       $cmp2$i$i = ($add$ptr$i$i>>>0)>($105>>>0);
       if ($cmp2$i$i) {
        break;
       }
      }
      $next$i$i = (($sp$0$i$i) + 8|0);
      $108 = HEAP32[$next$i$i>>2]|0;
      $cmp3$i$i = ($108|0)==(0|0);
      if ($cmp3$i$i) {
       label = 182;
       break L271;
      } else {
       $sp$0$i$i = $108;
      }
     }
     $cmp32$i152 = ($sp$0$i$i|0)==(0|0);
     if ($cmp32$i152) {
      label = 182;
     } else {
      $113 = HEAP32[((2097240 + 12|0))>>2]|0;
      $add74$i = (($add9$i) - ($113))|0;
      $and77$i = $add74$i & $neg$i149;
      $cmp78$i = ($and77$i>>>0)<(2147483647);
      if ($cmp78$i) {
       $call80$i = (_sbrk(($and77$i|0))|0);
       $114 = HEAP32[$sp$0$i$i>>2]|0;
       $115 = HEAP32[$size$i$i>>2]|0;
       $add$ptr$i160 = (($114) + ($115)|0);
       $cmp82$i = ($call80$i|0)==($add$ptr$i160|0);
       $and77$$i = $cmp82$i ? $and77$i : 0;
       $call80$$i = $cmp82$i ? $call80$i : (-1);
       $br$0$i = $call80$i;$ssize$1$i = $and77$i;$tbase$0$i = $call80$$i;$tsize$0$i = $and77$$i;
       label = 191;
      } else {
       $tsize$0748284$i = 0;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 182) {
     $call34$i = (_sbrk(0)|0);
     $cmp35$i154 = ($call34$i|0)==((-1)|0);
     if ($cmp35$i154) {
      $tsize$0748284$i = 0;
     } else {
      $109 = $call34$i;
      $110 = HEAP32[((2097712 + 4|0))>>2]|0;
      $sub38$i = (($110) + -1)|0;
      $and39$i = $sub38$i & $109;
      $cmp40$i155 = ($and39$i|0)==(0);
      if ($cmp40$i155) {
       $ssize$0$i = $and11$i;
      } else {
       $add43$i = (($sub38$i) + ($109))|0;
       $neg45$i = (0 - ($110))|0;
       $and46$i = $add43$i & $neg45$i;
       $sub47$i = (($and11$i) - ($109))|0;
       $add48$i = (($sub47$i) + ($and46$i))|0;
       $ssize$0$i = $add48$i;
      }
      $111 = HEAP32[((2097240 + 432|0))>>2]|0;
      $add51$i = (($111) + ($ssize$0$i))|0;
      $cmp52$i = ($ssize$0$i>>>0)>($nb$0>>>0);
      $cmp54$i156 = ($ssize$0$i>>>0)<(2147483647);
      $or$cond$i157 = $cmp52$i & $cmp54$i156;
      if ($or$cond$i157) {
       $112 = HEAP32[((2097240 + 440|0))>>2]|0;
       $cmp57$i = ($112|0)==(0);
       if (!($cmp57$i)) {
        $cmp60$i = ($add51$i>>>0)<=($111>>>0);
        $cmp63$i = ($add51$i>>>0)>($112>>>0);
        $or$cond2$i = $cmp60$i | $cmp63$i;
        if ($or$cond2$i) {
         $tsize$0748284$i = 0;
         break;
        }
       }
       $call65$i = (_sbrk(($ssize$0$i|0))|0);
       $cmp66$i158 = ($call65$i|0)==($call34$i|0);
       $ssize$0$$i = $cmp66$i158 ? $ssize$0$i : 0;
       $call34$$i = $cmp66$i158 ? $call34$i : (-1);
       $br$0$i = $call65$i;$ssize$1$i = $ssize$0$i;$tbase$0$i = $call34$$i;$tsize$0$i = $ssize$0$$i;
       label = 191;
      } else {
       $tsize$0748284$i = 0;
      }
     }
    }
   } while(0);
   L291: do {
    if ((label|0) == 191) {
     $sub109$i = (0 - ($ssize$1$i))|0;
     $cmp86$i = ($tbase$0$i|0)==((-1)|0);
     if (!($cmp86$i)) {
      $tbase$291$i = $tbase$0$i;$tsize$290$i = $tsize$0$i;
      label = 202;
      break L269;
     }
     $cmp88$i = ($br$0$i|0)!=((-1)|0);
     $cmp90$i161 = ($ssize$1$i>>>0)<(2147483647);
     $or$cond3$i = $cmp88$i & $cmp90$i161;
     $cmp93$i = ($ssize$1$i>>>0)<($add$i147>>>0);
     $or$cond4$i = $or$cond3$i & $cmp93$i;
     do {
      if ($or$cond4$i) {
       $116 = HEAP32[((2097712 + 8|0))>>2]|0;
       $sub96$i = (($sub$i148) - ($ssize$1$i))|0;
       $add98$i = (($sub96$i) + ($116))|0;
       $neg100$i = (0 - ($116))|0;
       $and101$i = $add98$i & $neg100$i;
       $cmp102$i = ($and101$i>>>0)<(2147483647);
       if ($cmp102$i) {
        $call104$i = (_sbrk(($and101$i|0))|0);
        $cmp105$i = ($call104$i|0)==((-1)|0);
        if ($cmp105$i) {
         (_sbrk(($sub109$i|0))|0);
         $tsize$0748284$i = $tsize$0$i;
         break L291;
        } else {
         $add107$i = (($and101$i) + ($ssize$1$i))|0;
         $ssize$2$i = $add107$i;
         break;
        }
       } else {
        $ssize$2$i = $ssize$1$i;
       }
      } else {
       $ssize$2$i = $ssize$1$i;
      }
     } while(0);
     $cmp115$i162 = ($br$0$i|0)==((-1)|0);
     if ($cmp115$i162) {
      $tsize$0748284$i = $tsize$0$i;
     } else {
      $tbase$291$i = $br$0$i;$tsize$290$i = $ssize$2$i;
      label = 202;
      break L269;
     }
    }
   } while(0);
   $117 = HEAP32[((2097240 + 444|0))>>2]|0;
   $or$i163 = $117 | 4;
   HEAP32[((2097240 + 444|0))>>2] = $or$i163;
   $tsize$1$i = $tsize$0748284$i;
   label = 199;
  } else {
   $tsize$1$i = 0;
   label = 199;
  }
 } while(0);
 if ((label|0) == 199) {
  $cmp124$i = ($and11$i>>>0)<(2147483647);
  if ($cmp124$i) {
   $call128$i = (_sbrk(($and11$i|0))|0);
   $call129$i = (_sbrk(0)|0);
   $notlhs$i = ($call128$i|0)!=((-1)|0);
   $notrhs$i = ($call129$i|0)!=((-1)|0);
   $or$cond6$not$i = $notrhs$i & $notlhs$i;
   $cmp134$i = ($call128$i>>>0)<($call129$i>>>0);
   $or$cond7$i = $or$cond6$not$i & $cmp134$i;
   if ($or$cond7$i) {
    $sub$ptr$lhs$cast$i = $call129$i;
    $sub$ptr$rhs$cast$i = $call128$i;
    $sub$ptr$sub$i = (($sub$ptr$lhs$cast$i) - ($sub$ptr$rhs$cast$i))|0;
    $add137$i = (($nb$0) + 40)|0;
    $cmp138$i164 = ($sub$ptr$sub$i>>>0)>($add137$i>>>0);
    $sub$ptr$sub$tsize$1$i = $cmp138$i164 ? $sub$ptr$sub$i : $tsize$1$i;
    if ($cmp138$i164) {
     $tbase$291$i = $call128$i;$tsize$290$i = $sub$ptr$sub$tsize$1$i;
     label = 202;
    }
   }
  }
 }
 if ((label|0) == 202) {
  $118 = HEAP32[((2097240 + 432|0))>>2]|0;
  $add147$i = (($118) + ($tsize$290$i))|0;
  HEAP32[((2097240 + 432|0))>>2] = $add147$i;
  $119 = HEAP32[((2097240 + 436|0))>>2]|0;
  $cmp148$i = ($add147$i>>>0)>($119>>>0);
  if ($cmp148$i) {
   HEAP32[((2097240 + 436|0))>>2] = $add147$i;
  }
  $120 = HEAP32[((2097240 + 24|0))>>2]|0;
  $cmp154$i = ($120|0)==(0|0);
  L311: do {
   if ($cmp154$i) {
    $121 = HEAP32[((2097240 + 16|0))>>2]|0;
    $cmp156$i = ($121|0)==(0|0);
    $cmp159$i166 = ($tbase$291$i>>>0)<($121>>>0);
    $or$cond8$i = $cmp156$i | $cmp159$i166;
    if ($or$cond8$i) {
     HEAP32[((2097240 + 16|0))>>2] = $tbase$291$i;
    }
    HEAP32[((2097240 + 448|0))>>2] = $tbase$291$i;
    HEAP32[((2097240 + 452|0))>>2] = $tsize$290$i;
    HEAP32[((2097240 + 460|0))>>2] = 0;
    $122 = HEAP32[2097712>>2]|0;
    HEAP32[((2097240 + 36|0))>>2] = $122;
    HEAP32[((2097240 + 32|0))>>2] = -1;
    $i$02$i$i = 0;
    while(1) {
     $shl$i$i = $i$02$i$i << 1;
     $arrayidx$i$i = ((2097240 + ($shl$i$i<<2)|0) + 40|0);
     $arrayidx$sum$i$i = (($shl$i$i) + 3)|0;
     $123 = ((2097240 + ($arrayidx$sum$i$i<<2)|0) + 40|0);
     HEAP32[$123>>2] = $arrayidx$i$i;
     $arrayidx$sum1$i$i = (($shl$i$i) + 2)|0;
     $124 = ((2097240 + ($arrayidx$sum1$i$i<<2)|0) + 40|0);
     HEAP32[$124>>2] = $arrayidx$i$i;
     $inc$i$i = (($i$02$i$i) + 1)|0;
     $exitcond$i$i = ($inc$i$i|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $i$02$i$i = $inc$i$i;
     }
    }
    $sub169$i = (($tsize$290$i) + -40)|0;
    $add$ptr$i11$i = (($tbase$291$i) + 8|0);
    $125 = $add$ptr$i11$i;
    $and$i12$i = $125 & 7;
    $cmp$i13$i = ($and$i12$i|0)==(0);
    if ($cmp$i13$i) {
     $cond$i$i = 0;
    } else {
     $126 = (0 - ($125))|0;
     $and3$i$i = $126 & 7;
     $cond$i$i = $and3$i$i;
    }
    $add$ptr4$i$i = (($tbase$291$i) + ($cond$i$i)|0);
    $sub5$i$i = (($sub169$i) - ($cond$i$i))|0;
    HEAP32[((2097240 + 24|0))>>2] = $add$ptr4$i$i;
    HEAP32[((2097240 + 12|0))>>2] = $sub5$i$i;
    $or$i$i = $sub5$i$i | 1;
    $add$ptr4$sum$i$i = (($cond$i$i) + 4)|0;
    $head$i$i = (($tbase$291$i) + ($add$ptr4$sum$i$i)|0);
    HEAP32[$head$i$i>>2] = $or$i$i;
    $add$ptr6$sum$i$i = (($tsize$290$i) + -36)|0;
    $head7$i$i = (($tbase$291$i) + ($add$ptr6$sum$i$i)|0);
    HEAP32[$head7$i$i>>2] = 40;
    $127 = HEAP32[((2097712 + 16|0))>>2]|0;
    HEAP32[((2097240 + 28|0))>>2] = $127;
   } else {
    $sp$0109$i = ((2097240 + 448|0));
    while(1) {
     $128 = HEAP32[$sp$0109$i>>2]|0;
     $size185$i = (($sp$0109$i) + 4|0);
     $129 = HEAP32[$size185$i>>2]|0;
     $add$ptr186$i = (($128) + ($129)|0);
     $cmp187$i = ($tbase$291$i|0)==($add$ptr186$i|0);
     if ($cmp187$i) {
      label = 214;
      break;
     }
     $next$i = (($sp$0109$i) + 8|0);
     $130 = HEAP32[$next$i>>2]|0;
     $cmp183$i = ($130|0)==(0|0);
     if ($cmp183$i) {
      break;
     } else {
      $sp$0109$i = $130;
     }
    }
    if ((label|0) == 214) {
     $sflags190$i = (($sp$0109$i) + 12|0);
     $131 = HEAP32[$sflags190$i>>2]|0;
     $and191$i = $131 & 8;
     $tobool192$i = ($and191$i|0)==(0);
     if ($tobool192$i) {
      $cmp200$i = ($120>>>0)>=($128>>>0);
      $cmp206$i = ($120>>>0)<($tbase$291$i>>>0);
      $or$cond93$i = $cmp200$i & $cmp206$i;
      if ($or$cond93$i) {
       $add209$i = (($129) + ($tsize$290$i))|0;
       HEAP32[$size185$i>>2] = $add209$i;
       $132 = HEAP32[((2097240 + 12|0))>>2]|0;
       $add212$i = (($132) + ($tsize$290$i))|0;
       $add$ptr$i22$i = (($120) + 8|0);
       $133 = $add$ptr$i22$i;
       $and$i23$i = $133 & 7;
       $cmp$i24$i = ($and$i23$i|0)==(0);
       if ($cmp$i24$i) {
        $cond$i27$i = 0;
       } else {
        $134 = (0 - ($133))|0;
        $and3$i25$i = $134 & 7;
        $cond$i27$i = $and3$i25$i;
       }
       $add$ptr4$i28$i = (($120) + ($cond$i27$i)|0);
       $sub5$i29$i = (($add212$i) - ($cond$i27$i))|0;
       HEAP32[((2097240 + 24|0))>>2] = $add$ptr4$i28$i;
       HEAP32[((2097240 + 12|0))>>2] = $sub5$i29$i;
       $or$i30$i = $sub5$i29$i | 1;
       $add$ptr4$sum$i31$i = (($cond$i27$i) + 4)|0;
       $head$i32$i = (($120) + ($add$ptr4$sum$i31$i)|0);
       HEAP32[$head$i32$i>>2] = $or$i30$i;
       $add$ptr6$sum$i33$i = (($add212$i) + 4)|0;
       $head7$i34$i = (($120) + ($add$ptr6$sum$i33$i)|0);
       HEAP32[$head7$i34$i>>2] = 40;
       $135 = HEAP32[((2097712 + 16|0))>>2]|0;
       HEAP32[((2097240 + 28|0))>>2] = $135;
       break;
      }
     }
    }
    $136 = HEAP32[((2097240 + 16|0))>>2]|0;
    $cmp215$i = ($tbase$291$i>>>0)<($136>>>0);
    if ($cmp215$i) {
     HEAP32[((2097240 + 16|0))>>2] = $tbase$291$i;
    }
    $add$ptr224$i = (($tbase$291$i) + ($tsize$290$i)|0);
    $sp$1105$i = ((2097240 + 448|0));
    while(1) {
     $137 = HEAP32[$sp$1105$i>>2]|0;
     $cmp225$i = ($137|0)==($add$ptr224$i|0);
     if ($cmp225$i) {
      label = 224;
      break;
     }
     $next228$i = (($sp$1105$i) + 8|0);
     $138 = HEAP32[$next228$i>>2]|0;
     $cmp221$i = ($138|0)==(0|0);
     if ($cmp221$i) {
      break;
     } else {
      $sp$1105$i = $138;
     }
    }
    if ((label|0) == 224) {
     $sflags232$i = (($sp$1105$i) + 12|0);
     $139 = HEAP32[$sflags232$i>>2]|0;
     $and233$i = $139 & 8;
     $tobool234$i = ($and233$i|0)==(0);
     if ($tobool234$i) {
      HEAP32[$sp$1105$i>>2] = $tbase$291$i;
      $size242$i = (($sp$1105$i) + 4|0);
      $140 = HEAP32[$size242$i>>2]|0;
      $add243$i = (($140) + ($tsize$290$i))|0;
      HEAP32[$size242$i>>2] = $add243$i;
      $add$ptr$i37$i = (($tbase$291$i) + 8|0);
      $141 = $add$ptr$i37$i;
      $and$i38$i = $141 & 7;
      $cmp$i39$i = ($and$i38$i|0)==(0);
      if ($cmp$i39$i) {
       $cond$i42$i = 0;
      } else {
       $142 = (0 - ($141))|0;
       $and3$i40$i = $142 & 7;
       $cond$i42$i = $and3$i40$i;
      }
      $add$ptr4$i43$i = (($tbase$291$i) + ($cond$i42$i)|0);
      $add$ptr224$sum$i = (($tsize$290$i) + 8)|0;
      $add$ptr5$i$i = (($tbase$291$i) + ($add$ptr224$sum$i)|0);
      $143 = $add$ptr5$i$i;
      $and6$i44$i = $143 & 7;
      $cmp7$i$i = ($and6$i44$i|0)==(0);
      if ($cmp7$i$i) {
       $cond15$i$i = 0;
      } else {
       $144 = (0 - ($143))|0;
       $and13$i$i = $144 & 7;
       $cond15$i$i = $and13$i$i;
      }
      $add$ptr224$sum131$i = (($cond15$i$i) + ($tsize$290$i))|0;
      $add$ptr16$i$i = (($tbase$291$i) + ($add$ptr224$sum131$i)|0);
      $sub$ptr$lhs$cast$i46$i = $add$ptr16$i$i;
      $sub$ptr$rhs$cast$i47$i = $add$ptr4$i43$i;
      $sub$ptr$sub$i48$i = (($sub$ptr$lhs$cast$i46$i) - ($sub$ptr$rhs$cast$i47$i))|0;
      $add$ptr4$sum$i49$i = (($cond$i42$i) + ($nb$0))|0;
      $add$ptr17$i$i = (($tbase$291$i) + ($add$ptr4$sum$i49$i)|0);
      $sub18$i$i = (($sub$ptr$sub$i48$i) - ($nb$0))|0;
      $or19$i$i = $nb$0 | 3;
      $add$ptr4$sum1$i$i = (($cond$i42$i) + 4)|0;
      $head$i50$i = (($tbase$291$i) + ($add$ptr4$sum1$i$i)|0);
      HEAP32[$head$i50$i>>2] = $or19$i$i;
      $145 = HEAP32[((2097240 + 24|0))>>2]|0;
      $cmp20$i$i = ($add$ptr16$i$i|0)==($145|0);
      L348: do {
       if ($cmp20$i$i) {
        $146 = HEAP32[((2097240 + 12|0))>>2]|0;
        $add$i$i = (($146) + ($sub18$i$i))|0;
        HEAP32[((2097240 + 12|0))>>2] = $add$i$i;
        HEAP32[((2097240 + 24|0))>>2] = $add$ptr17$i$i;
        $or22$i$i = $add$i$i | 1;
        $add$ptr17$sum35$i$i = (($add$ptr4$sum$i49$i) + 4)|0;
        $head23$i$i = (($tbase$291$i) + ($add$ptr17$sum35$i$i)|0);
        HEAP32[$head23$i$i>>2] = $or22$i$i;
       } else {
        $147 = HEAP32[((2097240 + 20|0))>>2]|0;
        $cmp24$i$i = ($add$ptr16$i$i|0)==($147|0);
        if ($cmp24$i$i) {
         $148 = HEAP32[((2097240 + 8|0))>>2]|0;
         $add26$i$i = (($148) + ($sub18$i$i))|0;
         HEAP32[((2097240 + 8|0))>>2] = $add26$i$i;
         HEAP32[((2097240 + 20|0))>>2] = $add$ptr17$i$i;
         $or28$i$i = $add26$i$i | 1;
         $add$ptr17$sum33$i$i = (($add$ptr4$sum$i49$i) + 4)|0;
         $head29$i$i = (($tbase$291$i) + ($add$ptr17$sum33$i$i)|0);
         HEAP32[$head29$i$i>>2] = $or28$i$i;
         $add$ptr17$sum34$i$i = (($add26$i$i) + ($add$ptr4$sum$i49$i))|0;
         $add$ptr30$i52$i = (($tbase$291$i) + ($add$ptr17$sum34$i$i)|0);
         HEAP32[$add$ptr30$i52$i>>2] = $add26$i$i;
         break;
        }
        $add$ptr16$sum$i$i = (($tsize$290$i) + 4)|0;
        $add$ptr224$sum132$i = (($add$ptr16$sum$i$i) + ($cond15$i$i))|0;
        $head32$i$i = (($tbase$291$i) + ($add$ptr224$sum132$i)|0);
        $149 = HEAP32[$head32$i$i>>2]|0;
        $and33$i$i = $149 & 3;
        $cmp34$i$i = ($and33$i$i|0)==(1);
        if ($cmp34$i$i) {
         $and37$i$i = $149 & -8;
         $shr$i54$i = $149 >>> 3;
         $cmp38$i$i = ($149>>>0)<(256);
         L356: do {
          if ($cmp38$i$i) {
           $add$ptr16$sum3031$i$i = $cond15$i$i | 8;
           $add$ptr224$sum142$i = (($add$ptr16$sum3031$i$i) + ($tsize$290$i))|0;
           $fd$i$i = (($tbase$291$i) + ($add$ptr224$sum142$i)|0);
           $150 = HEAP32[$fd$i$i>>2]|0;
           $add$ptr16$sum32$i$i = (($tsize$290$i) + 12)|0;
           $add$ptr224$sum143$i = (($add$ptr16$sum32$i$i) + ($cond15$i$i))|0;
           $bk$i55$i = (($tbase$291$i) + ($add$ptr224$sum143$i)|0);
           $151 = HEAP32[$bk$i55$i>>2]|0;
           $shl$i56$i = $shr$i54$i << 1;
           $arrayidx$i57$i = ((2097240 + ($shl$i56$i<<2)|0) + 40|0);
           $cmp41$i$i = ($150|0)==($arrayidx$i57$i|0);
           do {
            if (!($cmp41$i$i)) {
             $152 = HEAP32[((2097240 + 16|0))>>2]|0;
             $cmp42$i$i = ($150>>>0)<($152>>>0);
             if ($cmp42$i$i) {
              _abort();
              // unreachable;
             }
             $bk43$i$i = (($150) + 12|0);
             $153 = HEAP32[$bk43$i$i>>2]|0;
             $cmp44$i$i = ($153|0)==($add$ptr16$i$i|0);
             if ($cmp44$i$i) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $cmp46$i59$i = ($151|0)==($150|0);
           if ($cmp46$i59$i) {
            $shl48$i$i = 1 << $shr$i54$i;
            $neg$i$i = $shl48$i$i ^ -1;
            $154 = HEAP32[2097240>>2]|0;
            $and49$i$i = $154 & $neg$i$i;
            HEAP32[2097240>>2] = $and49$i$i;
            break;
           }
           $cmp54$i$i = ($151|0)==($arrayidx$i57$i|0);
           do {
            if ($cmp54$i$i) {
             $fd68$pre$i$i = (($151) + 8|0);
             $fd68$pre$phi$i$iZ2D = $fd68$pre$i$i;
            } else {
             $155 = HEAP32[((2097240 + 16|0))>>2]|0;
             $cmp57$i$i = ($151>>>0)<($155>>>0);
             if ($cmp57$i$i) {
              _abort();
              // unreachable;
             }
             $fd59$i$i = (($151) + 8|0);
             $156 = HEAP32[$fd59$i$i>>2]|0;
             $cmp60$i$i = ($156|0)==($add$ptr16$i$i|0);
             if ($cmp60$i$i) {
              $fd68$pre$phi$i$iZ2D = $fd59$i$i;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $bk67$i$i = (($150) + 12|0);
           HEAP32[$bk67$i$i>>2] = $151;
           HEAP32[$fd68$pre$phi$i$iZ2D>>2] = $150;
          } else {
           $add$ptr16$sum23$i$i = $cond15$i$i | 24;
           $add$ptr224$sum133$i = (($add$ptr16$sum23$i$i) + ($tsize$290$i))|0;
           $parent$i61$i = (($tbase$291$i) + ($add$ptr224$sum133$i)|0);
           $157 = HEAP32[$parent$i61$i>>2]|0;
           $add$ptr16$sum4$i$i = (($tsize$290$i) + 12)|0;
           $add$ptr224$sum134$i = (($add$ptr16$sum4$i$i) + ($cond15$i$i))|0;
           $bk74$i$i = (($tbase$291$i) + ($add$ptr224$sum134$i)|0);
           $158 = HEAP32[$bk74$i$i>>2]|0;
           $cmp75$i$i = ($158|0)==($add$ptr16$i$i|0);
           do {
            if ($cmp75$i$i) {
             $add$ptr16$sum56$i$i = $cond15$i$i | 16;
             $add$ptr224$sum140$i = (($add$ptr16$sum$i$i) + ($add$ptr16$sum56$i$i))|0;
             $arrayidx96$i$i = (($tbase$291$i) + ($add$ptr224$sum140$i)|0);
             $163 = HEAP32[$arrayidx96$i$i>>2]|0;
             $cmp97$i$i = ($163|0)==(0|0);
             if ($cmp97$i$i) {
              $add$ptr224$sum141$i = (($add$ptr16$sum56$i$i) + ($tsize$290$i))|0;
              $child$i$i = (($tbase$291$i) + ($add$ptr224$sum141$i)|0);
              $164 = HEAP32[$child$i$i>>2]|0;
              $cmp100$i$i = ($164|0)==(0|0);
              if ($cmp100$i$i) {
               $R$1$i$i = 0;
               break;
              } else {
               $R$0$i$i = $164;$RP$0$i$i = $child$i$i;
              }
             } else {
              $R$0$i$i = $163;$RP$0$i$i = $arrayidx96$i$i;
             }
             while(1) {
              $arrayidx103$i$i = (($R$0$i$i) + 20|0);
              $165 = HEAP32[$arrayidx103$i$i>>2]|0;
              $cmp104$i$i = ($165|0)==(0|0);
              if (!($cmp104$i$i)) {
               $R$0$i$i = $165;$RP$0$i$i = $arrayidx103$i$i;
               continue;
              }
              $arrayidx107$i$i = (($R$0$i$i) + 16|0);
              $166 = HEAP32[$arrayidx107$i$i>>2]|0;
              $cmp108$i$i = ($166|0)==(0|0);
              if ($cmp108$i$i) {
               break;
              } else {
               $R$0$i$i = $166;$RP$0$i$i = $arrayidx107$i$i;
              }
             }
             $167 = HEAP32[((2097240 + 16|0))>>2]|0;
             $cmp112$i$i = ($RP$0$i$i>>>0)<($167>>>0);
             if ($cmp112$i$i) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP$0$i$i>>2] = 0;
              $R$1$i$i = $R$0$i$i;
              break;
             }
            } else {
             $add$ptr16$sum2829$i$i = $cond15$i$i | 8;
             $add$ptr224$sum135$i = (($add$ptr16$sum2829$i$i) + ($tsize$290$i))|0;
             $fd78$i$i = (($tbase$291$i) + ($add$ptr224$sum135$i)|0);
             $159 = HEAP32[$fd78$i$i>>2]|0;
             $160 = HEAP32[((2097240 + 16|0))>>2]|0;
             $cmp81$i$i = ($159>>>0)<($160>>>0);
             if ($cmp81$i$i) {
              _abort();
              // unreachable;
             }
             $bk82$i$i = (($159) + 12|0);
             $161 = HEAP32[$bk82$i$i>>2]|0;
             $cmp83$i$i = ($161|0)==($add$ptr16$i$i|0);
             if (!($cmp83$i$i)) {
              _abort();
              // unreachable;
             }
             $fd85$i$i = (($158) + 8|0);
             $162 = HEAP32[$fd85$i$i>>2]|0;
             $cmp86$i$i = ($162|0)==($add$ptr16$i$i|0);
             if ($cmp86$i$i) {
              HEAP32[$bk82$i$i>>2] = $158;
              HEAP32[$fd85$i$i>>2] = $159;
              $R$1$i$i = $158;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $cmp120$i63$i = ($157|0)==(0|0);
           if ($cmp120$i63$i) {
            break;
           }
           $add$ptr16$sum25$i$i = (($tsize$290$i) + 28)|0;
           $add$ptr224$sum136$i = (($add$ptr16$sum25$i$i) + ($cond15$i$i))|0;
           $index$i64$i = (($tbase$291$i) + ($add$ptr224$sum136$i)|0);
           $168 = HEAP32[$index$i64$i>>2]|0;
           $arrayidx123$i$i = ((2097240 + ($168<<2)|0) + 304|0);
           $169 = HEAP32[$arrayidx123$i$i>>2]|0;
           $cmp124$i$i = ($add$ptr16$i$i|0)==($169|0);
           do {
            if ($cmp124$i$i) {
             HEAP32[$arrayidx123$i$i>>2] = $R$1$i$i;
             $cond37$i$i = ($R$1$i$i|0)==(0|0);
             if (!($cond37$i$i)) {
              break;
             }
             $shl131$i$i = 1 << $168;
             $neg132$i$i = $shl131$i$i ^ -1;
             $170 = HEAP32[((2097240 + 4|0))>>2]|0;
             $and133$i$i = $170 & $neg132$i$i;
             HEAP32[((2097240 + 4|0))>>2] = $and133$i$i;
             break L356;
            } else {
             $171 = HEAP32[((2097240 + 16|0))>>2]|0;
             $cmp137$i$i = ($157>>>0)<($171>>>0);
             if ($cmp137$i$i) {
              _abort();
              // unreachable;
             }
             $arrayidx143$i$i = (($157) + 16|0);
             $172 = HEAP32[$arrayidx143$i$i>>2]|0;
             $cmp144$i$i = ($172|0)==($add$ptr16$i$i|0);
             if ($cmp144$i$i) {
              HEAP32[$arrayidx143$i$i>>2] = $R$1$i$i;
             } else {
              $arrayidx151$i$i = (($157) + 20|0);
              HEAP32[$arrayidx151$i$i>>2] = $R$1$i$i;
             }
             $cmp156$i$i = ($R$1$i$i|0)==(0|0);
             if ($cmp156$i$i) {
              break L356;
             }
            }
           } while(0);
           $173 = HEAP32[((2097240 + 16|0))>>2]|0;
           $cmp160$i$i = ($R$1$i$i>>>0)<($173>>>0);
           if ($cmp160$i$i) {
            _abort();
            // unreachable;
           }
           $parent165$i$i = (($R$1$i$i) + 24|0);
           HEAP32[$parent165$i$i>>2] = $157;
           $add$ptr16$sum2627$i$i = $cond15$i$i | 16;
           $add$ptr224$sum137$i = (($add$ptr16$sum2627$i$i) + ($tsize$290$i))|0;
           $child166$i$i = (($tbase$291$i) + ($add$ptr224$sum137$i)|0);
           $174 = HEAP32[$child166$i$i>>2]|0;
           $cmp168$i$i = ($174|0)==(0|0);
           do {
            if (!($cmp168$i$i)) {
             $175 = HEAP32[((2097240 + 16|0))>>2]|0;
             $cmp172$i$i = ($174>>>0)<($175>>>0);
             if ($cmp172$i$i) {
              _abort();
              // unreachable;
             } else {
              $arrayidx178$i$i = (($R$1$i$i) + 16|0);
              HEAP32[$arrayidx178$i$i>>2] = $174;
              $parent179$i$i = (($174) + 24|0);
              HEAP32[$parent179$i$i>>2] = $R$1$i$i;
              break;
             }
            }
           } while(0);
           $add$ptr224$sum138$i = (($add$ptr16$sum$i$i) + ($add$ptr16$sum2627$i$i))|0;
           $arrayidx184$i$i = (($tbase$291$i) + ($add$ptr224$sum138$i)|0);
           $176 = HEAP32[$arrayidx184$i$i>>2]|0;
           $cmp185$i$i = ($176|0)==(0|0);
           if ($cmp185$i$i) {
            break;
           }
           $177 = HEAP32[((2097240 + 16|0))>>2]|0;
           $cmp189$i$i = ($176>>>0)<($177>>>0);
           if ($cmp189$i$i) {
            _abort();
            // unreachable;
           } else {
            $arrayidx195$i$i = (($R$1$i$i) + 20|0);
            HEAP32[$arrayidx195$i$i>>2] = $176;
            $parent196$i$i = (($176) + 24|0);
            HEAP32[$parent196$i$i>>2] = $R$1$i$i;
            break;
           }
          }
         } while(0);
         $add$ptr16$sum7$i$i = $and37$i$i | $cond15$i$i;
         $add$ptr224$sum139$i = (($add$ptr16$sum7$i$i) + ($tsize$290$i))|0;
         $add$ptr205$i$i = (($tbase$291$i) + ($add$ptr224$sum139$i)|0);
         $add206$i$i = (($and37$i$i) + ($sub18$i$i))|0;
         $oldfirst$0$i$i = $add$ptr205$i$i;$qsize$0$i$i = $add206$i$i;
        } else {
         $oldfirst$0$i$i = $add$ptr16$i$i;$qsize$0$i$i = $sub18$i$i;
        }
        $head208$i$i = (($oldfirst$0$i$i) + 4|0);
        $178 = HEAP32[$head208$i$i>>2]|0;
        $and209$i$i = $178 & -2;
        HEAP32[$head208$i$i>>2] = $and209$i$i;
        $or210$i$i = $qsize$0$i$i | 1;
        $add$ptr17$sum$i$i = (($add$ptr4$sum$i49$i) + 4)|0;
        $head211$i$i = (($tbase$291$i) + ($add$ptr17$sum$i$i)|0);
        HEAP32[$head211$i$i>>2] = $or210$i$i;
        $add$ptr17$sum8$i$i = (($qsize$0$i$i) + ($add$ptr4$sum$i49$i))|0;
        $add$ptr212$i$i = (($tbase$291$i) + ($add$ptr17$sum8$i$i)|0);
        HEAP32[$add$ptr212$i$i>>2] = $qsize$0$i$i;
        $shr214$i$i = $qsize$0$i$i >>> 3;
        $cmp215$i$i = ($qsize$0$i$i>>>0)<(256);
        if ($cmp215$i$i) {
         $shl221$i$i = $shr214$i$i << 1;
         $arrayidx223$i$i = ((2097240 + ($shl221$i$i<<2)|0) + 40|0);
         $179 = HEAP32[2097240>>2]|0;
         $shl226$i$i = 1 << $shr214$i$i;
         $and227$i$i = $179 & $shl226$i$i;
         $tobool228$i$i = ($and227$i$i|0)==(0);
         do {
          if ($tobool228$i$i) {
           $or232$i$i = $179 | $shl226$i$i;
           HEAP32[2097240>>2] = $or232$i$i;
           $arrayidx223$sum$pre$i$i = (($shl221$i$i) + 2)|0;
           $$pre$i66$i = ((2097240 + ($arrayidx223$sum$pre$i$i<<2)|0) + 40|0);
           $$pre$phi$i67$iZ2D = $$pre$i66$i;$F224$0$i$i = $arrayidx223$i$i;
          } else {
           $arrayidx223$sum24$i$i = (($shl221$i$i) + 2)|0;
           $180 = ((2097240 + ($arrayidx223$sum24$i$i<<2)|0) + 40|0);
           $181 = HEAP32[$180>>2]|0;
           $182 = HEAP32[((2097240 + 16|0))>>2]|0;
           $cmp236$i$i = ($181>>>0)<($182>>>0);
           if (!($cmp236$i$i)) {
            $$pre$phi$i67$iZ2D = $180;$F224$0$i$i = $181;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i67$iZ2D>>2] = $add$ptr17$i$i;
         $bk246$i$i = (($F224$0$i$i) + 12|0);
         HEAP32[$bk246$i$i>>2] = $add$ptr17$i$i;
         $add$ptr17$sum22$i$i = (($add$ptr4$sum$i49$i) + 8)|0;
         $fd247$i$i = (($tbase$291$i) + ($add$ptr17$sum22$i$i)|0);
         HEAP32[$fd247$i$i>>2] = $F224$0$i$i;
         $add$ptr17$sum23$i$i = (($add$ptr4$sum$i49$i) + 12)|0;
         $bk248$i$i = (($tbase$291$i) + ($add$ptr17$sum23$i$i)|0);
         HEAP32[$bk248$i$i>>2] = $arrayidx223$i$i;
         break;
        }
        $shr253$i$i = $qsize$0$i$i >>> 8;
        $cmp254$i$i = ($shr253$i$i|0)==(0);
        do {
         if ($cmp254$i$i) {
          $I252$0$i$i = 0;
         } else {
          $cmp258$i$i = ($qsize$0$i$i>>>0)>(16777215);
          if ($cmp258$i$i) {
           $I252$0$i$i = 31;
           break;
          }
          $sub262$i$i = (($shr253$i$i) + 1048320)|0;
          $shr263$i$i = $sub262$i$i >>> 16;
          $and264$i$i = $shr263$i$i & 8;
          $shl265$i$i = $shr253$i$i << $and264$i$i;
          $sub266$i$i = (($shl265$i$i) + 520192)|0;
          $shr267$i$i = $sub266$i$i >>> 16;
          $and268$i$i = $shr267$i$i & 4;
          $add269$i$i = $and268$i$i | $and264$i$i;
          $shl270$i$i = $shl265$i$i << $and268$i$i;
          $sub271$i$i = (($shl270$i$i) + 245760)|0;
          $shr272$i$i = $sub271$i$i >>> 16;
          $and273$i$i = $shr272$i$i & 2;
          $add274$i$i = $add269$i$i | $and273$i$i;
          $sub275$i$i = (14 - ($add274$i$i))|0;
          $shl276$i$i = $shl270$i$i << $and273$i$i;
          $shr277$i$i = $shl276$i$i >>> 15;
          $add278$i$i = (($sub275$i$i) + ($shr277$i$i))|0;
          $shl279$i$i = $add278$i$i << 1;
          $add280$i$i = (($add278$i$i) + 7)|0;
          $shr281$i$i = $qsize$0$i$i >>> $add280$i$i;
          $and282$i$i = $shr281$i$i & 1;
          $add283$i$i = $and282$i$i | $shl279$i$i;
          $I252$0$i$i = $add283$i$i;
         }
        } while(0);
        $arrayidx287$i$i = ((2097240 + ($I252$0$i$i<<2)|0) + 304|0);
        $add$ptr17$sum9$i$i = (($add$ptr4$sum$i49$i) + 28)|0;
        $index288$i$i = (($tbase$291$i) + ($add$ptr17$sum9$i$i)|0);
        HEAP32[$index288$i$i>>2] = $I252$0$i$i;
        $add$ptr17$sum10$i$i = (($add$ptr4$sum$i49$i) + 16)|0;
        $child289$i$i = (($tbase$291$i) + ($add$ptr17$sum10$i$i)|0);
        $child289$sum$i$i = (($add$ptr4$sum$i49$i) + 20)|0;
        $arrayidx290$i$i = (($tbase$291$i) + ($child289$sum$i$i)|0);
        HEAP32[$arrayidx290$i$i>>2] = 0;
        HEAP32[$child289$i$i>>2] = 0;
        $183 = HEAP32[((2097240 + 4|0))>>2]|0;
        $shl294$i$i = 1 << $I252$0$i$i;
        $and295$i$i = $183 & $shl294$i$i;
        $tobool296$i$i = ($and295$i$i|0)==(0);
        if ($tobool296$i$i) {
         $or300$i$i = $183 | $shl294$i$i;
         HEAP32[((2097240 + 4|0))>>2] = $or300$i$i;
         HEAP32[$arrayidx287$i$i>>2] = $add$ptr17$i$i;
         $add$ptr17$sum11$i$i = (($add$ptr4$sum$i49$i) + 24)|0;
         $parent301$i$i = (($tbase$291$i) + ($add$ptr17$sum11$i$i)|0);
         HEAP32[$parent301$i$i>>2] = $arrayidx287$i$i;
         $add$ptr17$sum12$i$i = (($add$ptr4$sum$i49$i) + 12)|0;
         $bk302$i$i = (($tbase$291$i) + ($add$ptr17$sum12$i$i)|0);
         HEAP32[$bk302$i$i>>2] = $add$ptr17$i$i;
         $add$ptr17$sum13$i$i = (($add$ptr4$sum$i49$i) + 8)|0;
         $fd303$i$i = (($tbase$291$i) + ($add$ptr17$sum13$i$i)|0);
         HEAP32[$fd303$i$i>>2] = $add$ptr17$i$i;
         break;
        }
        $184 = HEAP32[$arrayidx287$i$i>>2]|0;
        $cmp306$i$i = ($I252$0$i$i|0)==(31);
        if ($cmp306$i$i) {
         $cond315$i$i = 0;
        } else {
         $shr310$i$i = $I252$0$i$i >>> 1;
         $sub313$i$i = (25 - ($shr310$i$i))|0;
         $cond315$i$i = $sub313$i$i;
        }
        $head31739$i$i = (($184) + 4|0);
        $185 = HEAP32[$head31739$i$i>>2]|0;
        $and31840$i$i = $185 & -8;
        $cmp31941$i$i = ($and31840$i$i|0)==($qsize$0$i$i|0);
        L445: do {
         if ($cmp31941$i$i) {
          $T$0$lcssa$i69$i = $184;
         } else {
          $shl316$i$i = $qsize$0$i$i << $cond315$i$i;
          $K305$043$i$i = $shl316$i$i;$T$042$i$i = $184;
          while(1) {
           $shr322$i$i = $K305$043$i$i >>> 31;
           $arrayidx325$i$i = ((($T$042$i$i) + ($shr322$i$i<<2)|0) + 16|0);
           $186 = HEAP32[$arrayidx325$i$i>>2]|0;
           $cmp327$i$i = ($186|0)==(0|0);
           if ($cmp327$i$i) {
            break;
           }
           $shl326$i$i = $K305$043$i$i << 1;
           $head317$i$i = (($186) + 4|0);
           $187 = HEAP32[$head317$i$i>>2]|0;
           $and318$i$i = $187 & -8;
           $cmp319$i$i = ($and318$i$i|0)==($qsize$0$i$i|0);
           if ($cmp319$i$i) {
            $T$0$lcssa$i69$i = $186;
            break L445;
           } else {
            $K305$043$i$i = $shl326$i$i;$T$042$i$i = $186;
           }
          }
          $188 = HEAP32[((2097240 + 16|0))>>2]|0;
          $cmp332$i$i = ($arrayidx325$i$i>>>0)<($188>>>0);
          if ($cmp332$i$i) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$arrayidx325$i$i>>2] = $add$ptr17$i$i;
           $add$ptr17$sum19$i$i = (($add$ptr4$sum$i49$i) + 24)|0;
           $parent337$i$i = (($tbase$291$i) + ($add$ptr17$sum19$i$i)|0);
           HEAP32[$parent337$i$i>>2] = $T$042$i$i;
           $add$ptr17$sum20$i$i = (($add$ptr4$sum$i49$i) + 12)|0;
           $bk338$i$i = (($tbase$291$i) + ($add$ptr17$sum20$i$i)|0);
           HEAP32[$bk338$i$i>>2] = $add$ptr17$i$i;
           $add$ptr17$sum21$i$i = (($add$ptr4$sum$i49$i) + 8)|0;
           $fd339$i$i = (($tbase$291$i) + ($add$ptr17$sum21$i$i)|0);
           HEAP32[$fd339$i$i>>2] = $add$ptr17$i$i;
           break L348;
          }
         }
        } while(0);
        $fd344$i$i = (($T$0$lcssa$i69$i) + 8|0);
        $189 = HEAP32[$fd344$i$i>>2]|0;
        $190 = HEAP32[((2097240 + 16|0))>>2]|0;
        $cmp346$i$i = ($T$0$lcssa$i69$i>>>0)<($190>>>0);
        if ($cmp346$i$i) {
         _abort();
         // unreachable;
        }
        $cmp350$i$i = ($189>>>0)<($190>>>0);
        if ($cmp350$i$i) {
         _abort();
         // unreachable;
        } else {
         $bk357$i$i = (($189) + 12|0);
         HEAP32[$bk357$i$i>>2] = $add$ptr17$i$i;
         HEAP32[$fd344$i$i>>2] = $add$ptr17$i$i;
         $add$ptr17$sum16$i$i = (($add$ptr4$sum$i49$i) + 8)|0;
         $fd359$i$i = (($tbase$291$i) + ($add$ptr17$sum16$i$i)|0);
         HEAP32[$fd359$i$i>>2] = $189;
         $add$ptr17$sum17$i$i = (($add$ptr4$sum$i49$i) + 12)|0;
         $bk360$i$i = (($tbase$291$i) + ($add$ptr17$sum17$i$i)|0);
         HEAP32[$bk360$i$i>>2] = $T$0$lcssa$i69$i;
         $add$ptr17$sum18$i$i = (($add$ptr4$sum$i49$i) + 24)|0;
         $parent361$i$i = (($tbase$291$i) + ($add$ptr17$sum18$i$i)|0);
         HEAP32[$parent361$i$i>>2] = 0;
         break;
        }
       }
      } while(0);
      $add$ptr4$sum1415$i$i = $cond$i42$i | 8;
      $add$ptr368$i$i = (($tbase$291$i) + ($add$ptr4$sum1415$i$i)|0);
      $mem$0 = $add$ptr368$i$i;
      STACKTOP = sp;return ($mem$0|0);
     }
    }
    $sp$0$i$i$i = ((2097240 + 448|0));
    while(1) {
     $191 = HEAP32[$sp$0$i$i$i>>2]|0;
     $cmp$i$i$i = ($191>>>0)>($120>>>0);
     if (!($cmp$i$i$i)) {
      $size$i$i$i = (($sp$0$i$i$i) + 4|0);
      $192 = HEAP32[$size$i$i$i>>2]|0;
      $add$ptr$i$i$i = (($191) + ($192)|0);
      $cmp2$i$i$i = ($add$ptr$i$i$i>>>0)>($120>>>0);
      if ($cmp2$i$i$i) {
       break;
      }
     }
     $next$i$i$i = (($sp$0$i$i$i) + 8|0);
     $193 = HEAP32[$next$i$i$i>>2]|0;
     $sp$0$i$i$i = $193;
    }
    $add$ptr$sum$i$i = (($192) + -47)|0;
    $add$ptr2$sum$i$i = (($192) + -39)|0;
    $add$ptr3$i$i = (($191) + ($add$ptr2$sum$i$i)|0);
    $194 = $add$ptr3$i$i;
    $and$i14$i = $194 & 7;
    $cmp$i15$i = ($and$i14$i|0)==(0);
    if ($cmp$i15$i) {
     $cond$i17$i = 0;
    } else {
     $195 = (0 - ($194))|0;
     $and6$i$i = $195 & 7;
     $cond$i17$i = $and6$i$i;
    }
    $add$ptr2$sum1$i$i = (($add$ptr$sum$i$i) + ($cond$i17$i))|0;
    $add$ptr7$i$i = (($191) + ($add$ptr2$sum1$i$i)|0);
    $add$ptr82$i$i = (($120) + 16|0);
    $cmp9$i$i = ($add$ptr7$i$i>>>0)<($add$ptr82$i$i>>>0);
    $cond13$i$i = $cmp9$i$i ? $120 : $add$ptr7$i$i;
    $add$ptr14$i$i = (($cond13$i$i) + 8|0);
    $sub16$i$i = (($tsize$290$i) + -40)|0;
    $add$ptr$i10$i$i = (($tbase$291$i) + 8|0);
    $196 = $add$ptr$i10$i$i;
    $and$i$i$i = $196 & 7;
    $cmp$i11$i$i = ($and$i$i$i|0)==(0);
    if ($cmp$i11$i$i) {
     $cond$i$i$i = 0;
    } else {
     $197 = (0 - ($196))|0;
     $and3$i$i$i = $197 & 7;
     $cond$i$i$i = $and3$i$i$i;
    }
    $add$ptr4$i$i$i = (($tbase$291$i) + ($cond$i$i$i)|0);
    $sub5$i$i$i = (($sub16$i$i) - ($cond$i$i$i))|0;
    HEAP32[((2097240 + 24|0))>>2] = $add$ptr4$i$i$i;
    HEAP32[((2097240 + 12|0))>>2] = $sub5$i$i$i;
    $or$i$i$i = $sub5$i$i$i | 1;
    $add$ptr4$sum$i$i$i = (($cond$i$i$i) + 4)|0;
    $head$i$i$i = (($tbase$291$i) + ($add$ptr4$sum$i$i$i)|0);
    HEAP32[$head$i$i$i>>2] = $or$i$i$i;
    $add$ptr6$sum$i$i$i = (($tsize$290$i) + -36)|0;
    $head7$i$i$i = (($tbase$291$i) + ($add$ptr6$sum$i$i$i)|0);
    HEAP32[$head7$i$i$i>>2] = 40;
    $198 = HEAP32[((2097712 + 16|0))>>2]|0;
    HEAP32[((2097240 + 28|0))>>2] = $198;
    $head$i18$i = (($cond13$i$i) + 4|0);
    HEAP32[$head$i18$i>>2] = 27;
    ;HEAP32[$add$ptr14$i$i+0>>2]=HEAP32[((2097240 + 448|0))+0>>2]|0;HEAP32[$add$ptr14$i$i+4>>2]=HEAP32[((2097240 + 448|0))+4>>2]|0;HEAP32[$add$ptr14$i$i+8>>2]=HEAP32[((2097240 + 448|0))+8>>2]|0;HEAP32[$add$ptr14$i$i+12>>2]=HEAP32[((2097240 + 448|0))+12>>2]|0;
    HEAP32[((2097240 + 448|0))>>2] = $tbase$291$i;
    HEAP32[((2097240 + 452|0))>>2] = $tsize$290$i;
    HEAP32[((2097240 + 460|0))>>2] = 0;
    HEAP32[((2097240 + 456|0))>>2] = $add$ptr14$i$i;
    $add$ptr2418$i$i = (($cond13$i$i) + 28|0);
    HEAP32[$add$ptr2418$i$i>>2] = 7;
    $199 = (($cond13$i$i) + 32|0);
    $cmp2719$i$i = ($199>>>0)<($add$ptr$i$i$i>>>0);
    if ($cmp2719$i$i) {
     $add$ptr2420$i$i = $add$ptr2418$i$i;
     while(1) {
      $200 = (($add$ptr2420$i$i) + 4|0);
      HEAP32[$200>>2] = 7;
      $201 = (($add$ptr2420$i$i) + 8|0);
      $cmp27$i$i = ($201>>>0)<($add$ptr$i$i$i>>>0);
      if ($cmp27$i$i) {
       $add$ptr2420$i$i = $200;
      } else {
       break;
      }
     }
    }
    $cmp28$i$i = ($cond13$i$i|0)==($120|0);
    if (!($cmp28$i$i)) {
     $sub$ptr$lhs$cast$i$i = $cond13$i$i;
     $sub$ptr$rhs$cast$i$i = $120;
     $sub$ptr$sub$i$i = (($sub$ptr$lhs$cast$i$i) - ($sub$ptr$rhs$cast$i$i))|0;
     $add$ptr30$i$i = (($120) + ($sub$ptr$sub$i$i)|0);
     $add$ptr30$sum$i$i = (($sub$ptr$sub$i$i) + 4)|0;
     $head31$i$i = (($120) + ($add$ptr30$sum$i$i)|0);
     $202 = HEAP32[$head31$i$i>>2]|0;
     $and32$i$i = $202 & -2;
     HEAP32[$head31$i$i>>2] = $and32$i$i;
     $or33$i$i = $sub$ptr$sub$i$i | 1;
     $head34$i$i = (($120) + 4|0);
     HEAP32[$head34$i$i>>2] = $or33$i$i;
     HEAP32[$add$ptr30$i$i>>2] = $sub$ptr$sub$i$i;
     $shr$i$i = $sub$ptr$sub$i$i >>> 3;
     $cmp36$i$i = ($sub$ptr$sub$i$i>>>0)<(256);
     if ($cmp36$i$i) {
      $shl$i20$i = $shr$i$i << 1;
      $arrayidx$i21$i = ((2097240 + ($shl$i20$i<<2)|0) + 40|0);
      $203 = HEAP32[2097240>>2]|0;
      $shl39$i$i = 1 << $shr$i$i;
      $and40$i$i = $203 & $shl39$i$i;
      $tobool$i$i = ($and40$i$i|0)==(0);
      do {
       if ($tobool$i$i) {
        $or44$i$i = $203 | $shl39$i$i;
        HEAP32[2097240>>2] = $or44$i$i;
        $arrayidx$sum$pre$i$i = (($shl$i20$i) + 2)|0;
        $$pre$i$i = ((2097240 + ($arrayidx$sum$pre$i$i<<2)|0) + 40|0);
        $$pre$phi$i$iZ2D = $$pre$i$i;$F$0$i$i = $arrayidx$i21$i;
       } else {
        $arrayidx$sum9$i$i = (($shl$i20$i) + 2)|0;
        $204 = ((2097240 + ($arrayidx$sum9$i$i<<2)|0) + 40|0);
        $205 = HEAP32[$204>>2]|0;
        $206 = HEAP32[((2097240 + 16|0))>>2]|0;
        $cmp46$i$i = ($205>>>0)<($206>>>0);
        if (!($cmp46$i$i)) {
         $$pre$phi$i$iZ2D = $204;$F$0$i$i = $205;
         break;
        }
        _abort();
        // unreachable;
       }
      } while(0);
      HEAP32[$$pre$phi$i$iZ2D>>2] = $120;
      $bk$i$i = (($F$0$i$i) + 12|0);
      HEAP32[$bk$i$i>>2] = $120;
      $fd54$i$i = (($120) + 8|0);
      HEAP32[$fd54$i$i>>2] = $F$0$i$i;
      $bk55$i$i = (($120) + 12|0);
      HEAP32[$bk55$i$i>>2] = $arrayidx$i21$i;
      break;
     }
     $shr58$i$i = $sub$ptr$sub$i$i >>> 8;
     $cmp59$i$i = ($shr58$i$i|0)==(0);
     if ($cmp59$i$i) {
      $I57$0$i$i = 0;
     } else {
      $cmp63$i$i = ($sub$ptr$sub$i$i>>>0)>(16777215);
      if ($cmp63$i$i) {
       $I57$0$i$i = 31;
      } else {
       $sub67$i$i = (($shr58$i$i) + 1048320)|0;
       $shr68$i$i = $sub67$i$i >>> 16;
       $and69$i$i = $shr68$i$i & 8;
       $shl70$i$i = $shr58$i$i << $and69$i$i;
       $sub71$i$i = (($shl70$i$i) + 520192)|0;
       $shr72$i$i = $sub71$i$i >>> 16;
       $and73$i$i = $shr72$i$i & 4;
       $add74$i$i = $and73$i$i | $and69$i$i;
       $shl75$i$i = $shl70$i$i << $and73$i$i;
       $sub76$i$i = (($shl75$i$i) + 245760)|0;
       $shr77$i$i = $sub76$i$i >>> 16;
       $and78$i$i = $shr77$i$i & 2;
       $add79$i$i = $add74$i$i | $and78$i$i;
       $sub80$i$i = (14 - ($add79$i$i))|0;
       $shl81$i$i = $shl75$i$i << $and78$i$i;
       $shr82$i$i = $shl81$i$i >>> 15;
       $add83$i$i = (($sub80$i$i) + ($shr82$i$i))|0;
       $shl84$i$i = $add83$i$i << 1;
       $add85$i$i = (($add83$i$i) + 7)|0;
       $shr86$i$i = $sub$ptr$sub$i$i >>> $add85$i$i;
       $and87$i$i = $shr86$i$i & 1;
       $add88$i$i = $and87$i$i | $shl84$i$i;
       $I57$0$i$i = $add88$i$i;
      }
     }
     $arrayidx91$i$i = ((2097240 + ($I57$0$i$i<<2)|0) + 304|0);
     $index$i$i = (($120) + 28|0);
     $I57$0$c$i$i = $I57$0$i$i;
     HEAP32[$index$i$i>>2] = $I57$0$c$i$i;
     $arrayidx92$i$i = (($120) + 20|0);
     HEAP32[$arrayidx92$i$i>>2] = 0;
     $207 = (($120) + 16|0);
     HEAP32[$207>>2] = 0;
     $208 = HEAP32[((2097240 + 4|0))>>2]|0;
     $shl95$i$i = 1 << $I57$0$i$i;
     $and96$i$i = $208 & $shl95$i$i;
     $tobool97$i$i = ($and96$i$i|0)==(0);
     if ($tobool97$i$i) {
      $or101$i$i = $208 | $shl95$i$i;
      HEAP32[((2097240 + 4|0))>>2] = $or101$i$i;
      HEAP32[$arrayidx91$i$i>>2] = $120;
      $parent$i$i = (($120) + 24|0);
      HEAP32[$parent$i$i>>2] = $arrayidx91$i$i;
      $bk102$i$i = (($120) + 12|0);
      HEAP32[$bk102$i$i>>2] = $120;
      $fd103$i$i = (($120) + 8|0);
      HEAP32[$fd103$i$i>>2] = $120;
      break;
     }
     $209 = HEAP32[$arrayidx91$i$i>>2]|0;
     $cmp106$i$i = ($I57$0$i$i|0)==(31);
     if ($cmp106$i$i) {
      $cond115$i$i = 0;
     } else {
      $shr110$i$i = $I57$0$i$i >>> 1;
      $sub113$i$i = (25 - ($shr110$i$i))|0;
      $cond115$i$i = $sub113$i$i;
     }
     $head11813$i$i = (($209) + 4|0);
     $210 = HEAP32[$head11813$i$i>>2]|0;
     $and11914$i$i = $210 & -8;
     $cmp12015$i$i = ($and11914$i$i|0)==($sub$ptr$sub$i$i|0);
     L499: do {
      if ($cmp12015$i$i) {
       $T$0$lcssa$i$i = $209;
      } else {
       $shl116$i$i = $sub$ptr$sub$i$i << $cond115$i$i;
       $K105$017$i$i = $shl116$i$i;$T$016$i$i = $209;
       while(1) {
        $shr123$i$i = $K105$017$i$i >>> 31;
        $arrayidx126$i$i = ((($T$016$i$i) + ($shr123$i$i<<2)|0) + 16|0);
        $211 = HEAP32[$arrayidx126$i$i>>2]|0;
        $cmp128$i$i = ($211|0)==(0|0);
        if ($cmp128$i$i) {
         break;
        }
        $shl127$i$i = $K105$017$i$i << 1;
        $head118$i$i = (($211) + 4|0);
        $212 = HEAP32[$head118$i$i>>2]|0;
        $and119$i$i = $212 & -8;
        $cmp120$i$i = ($and119$i$i|0)==($sub$ptr$sub$i$i|0);
        if ($cmp120$i$i) {
         $T$0$lcssa$i$i = $211;
         break L499;
        } else {
         $K105$017$i$i = $shl127$i$i;$T$016$i$i = $211;
        }
       }
       $213 = HEAP32[((2097240 + 16|0))>>2]|0;
       $cmp133$i$i = ($arrayidx126$i$i>>>0)<($213>>>0);
       if ($cmp133$i$i) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$arrayidx126$i$i>>2] = $120;
        $parent138$i$i = (($120) + 24|0);
        HEAP32[$parent138$i$i>>2] = $T$016$i$i;
        $bk139$i$i = (($120) + 12|0);
        HEAP32[$bk139$i$i>>2] = $120;
        $fd140$i$i = (($120) + 8|0);
        HEAP32[$fd140$i$i>>2] = $120;
        break L311;
       }
      }
     } while(0);
     $fd145$i$i = (($T$0$lcssa$i$i) + 8|0);
     $214 = HEAP32[$fd145$i$i>>2]|0;
     $215 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp147$i$i = ($T$0$lcssa$i$i>>>0)<($215>>>0);
     if ($cmp147$i$i) {
      _abort();
      // unreachable;
     }
     $cmp150$i$i = ($214>>>0)<($215>>>0);
     if ($cmp150$i$i) {
      _abort();
      // unreachable;
     } else {
      $bk155$i$i = (($214) + 12|0);
      HEAP32[$bk155$i$i>>2] = $120;
      HEAP32[$fd145$i$i>>2] = $120;
      $fd157$i$i = (($120) + 8|0);
      HEAP32[$fd157$i$i>>2] = $214;
      $bk158$i$i = (($120) + 12|0);
      HEAP32[$bk158$i$i>>2] = $T$0$lcssa$i$i;
      $parent159$i$i = (($120) + 24|0);
      HEAP32[$parent159$i$i>>2] = 0;
      break;
     }
    }
   }
  } while(0);
  $216 = HEAP32[((2097240 + 12|0))>>2]|0;
  $cmp250$i = ($216>>>0)>($nb$0>>>0);
  if ($cmp250$i) {
   $sub253$i = (($216) - ($nb$0))|0;
   HEAP32[((2097240 + 12|0))>>2] = $sub253$i;
   $217 = HEAP32[((2097240 + 24|0))>>2]|0;
   $add$ptr255$i = (($217) + ($nb$0)|0);
   HEAP32[((2097240 + 24|0))>>2] = $add$ptr255$i;
   $or257$i = $sub253$i | 1;
   $add$ptr255$sum$i = (($nb$0) + 4)|0;
   $head258$i = (($217) + ($add$ptr255$sum$i)|0);
   HEAP32[$head258$i>>2] = $or257$i;
   $or260$i = $nb$0 | 3;
   $head261$i = (($217) + 4|0);
   HEAP32[$head261$i>>2] = $or260$i;
   $add$ptr262$i = (($217) + 8|0);
   $mem$0 = $add$ptr262$i;
   STACKTOP = sp;return ($mem$0|0);
  }
 }
 $call265$i = (___errno_location()|0);
 HEAP32[$call265$i>>2] = 12;
 $mem$0 = 0;
 STACKTOP = sp;return ($mem$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$pre = 0, $$pre$phiZ2D = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $8 = 0;
 var $9 = 0, $F502$0 = 0, $I526$0 = 0, $I526$0$c = 0, $K575$0270 = 0, $R$0 = 0, $R$1 = 0, $R327$0 = 0, $R327$1 = 0, $RP$0 = 0, $RP355$0 = 0, $T$0$lcssa = 0, $T$0269 = 0, $add$ptr = 0, $add$ptr$sum = 0, $add$ptr$sum230 = 0, $add$ptr16 = 0, $add$ptr16$sum = 0, $add$ptr16$sum251 = 0, $add$ptr16$sum252 = 0;
 var $add$ptr16$sum253 = 0, $add$ptr16$sum254 = 0, $add$ptr16$sum255 = 0, $add$ptr16$sum256 = 0, $add$ptr16$sum257 = 0, $add$ptr16$sum258 = 0, $add$ptr257 = 0, $add$ptr477 = 0, $add$ptr490 = 0, $add$ptr6 = 0, $add$ptr6$sum = 0, $add$ptr6$sum232 = 0, $add$ptr6$sum233234 = 0, $add$ptr6$sum235 = 0, $add$ptr6$sum243 = 0, $add$ptr6$sum244 = 0, $add$ptr6$sum247248 = 0, $add$ptr6$sum249 = 0, $add17 = 0, $add243 = 0;
 var $add254 = 0, $add262 = 0, $add542 = 0, $add547 = 0, $add551 = 0, $add553 = 0, $add556 = 0, $and = 0, $and140 = 0, $and210 = 0, $and215 = 0, $and229 = 0, $and237 = 0, $and261 = 0, $and296 = 0, $and405 = 0, $and46 = 0, $and487 = 0, $and5 = 0, $and504 = 0;
 var $and537 = 0, $and541 = 0, $and546 = 0, $and555 = 0, $and566 = 0, $and584 = 0, $and584267 = 0, $and8 = 0, $arrayidx = 0, $arrayidx108 = 0, $arrayidx113 = 0, $arrayidx130 = 0, $arrayidx149 = 0, $arrayidx157 = 0, $arrayidx182 = 0, $arrayidx188 = 0, $arrayidx198 = 0, $arrayidx274 = 0, $arrayidx357 = 0, $arrayidx369 = 0;
 var $arrayidx374 = 0, $arrayidx395 = 0, $arrayidx414 = 0, $arrayidx422 = 0, $arrayidx449 = 0, $arrayidx455 = 0, $arrayidx465 = 0, $arrayidx501 = 0, $arrayidx501$sum$pre = 0, $arrayidx501$sum242 = 0, $arrayidx559 = 0, $arrayidx562 = 0, $arrayidx591 = 0, $arrayidx99 = 0, $bk = 0, $bk270 = 0, $bk281 = 0, $bk316 = 0, $bk328 = 0, $bk338 = 0;
 var $bk34 = 0, $bk521 = 0, $bk523 = 0, $bk572 = 0, $bk603 = 0, $bk620 = 0, $bk623 = 0, $bk66 = 0, $bk73 = 0, $bk82 = 0, $child = 0, $child$sum = 0, $child171 = 0, $child171$sum = 0, $child356 = 0, $child356$sum = 0, $child438 = 0, $child438$sum = 0, $cmp = 0, $cmp$i = 0;
 var $cmp1 = 0, $cmp100 = 0, $cmp104 = 0, $cmp109 = 0, $cmp114 = 0, $cmp118 = 0, $cmp127 = 0, $cmp13 = 0, $cmp131 = 0, $cmp143 = 0, $cmp150 = 0, $cmp162 = 0, $cmp165 = 0, $cmp173 = 0, $cmp176 = 0, $cmp18 = 0, $cmp189 = 0, $cmp192 = 0, $cmp2 = 0, $cmp211 = 0;
 var $cmp22 = 0, $cmp225 = 0, $cmp240 = 0, $cmp246 = 0, $cmp25 = 0, $cmp251 = 0, $cmp264 = 0, $cmp275 = 0, $cmp278 = 0, $cmp282 = 0, $cmp29 = 0, $cmp291 = 0, $cmp300 = 0, $cmp303 = 0, $cmp307 = 0, $cmp31 = 0, $cmp329 = 0, $cmp335 = 0, $cmp339 = 0, $cmp343 = 0;
 var $cmp35 = 0, $cmp358 = 0, $cmp363 = 0, $cmp370 = 0, $cmp375 = 0, $cmp381 = 0, $cmp390 = 0, $cmp396 = 0, $cmp408 = 0, $cmp415 = 0, $cmp42 = 0, $cmp427 = 0, $cmp430 = 0, $cmp440 = 0, $cmp443 = 0, $cmp456 = 0, $cmp459 = 0, $cmp479 = 0, $cmp494 = 0, $cmp50 = 0;
 var $cmp511 = 0, $cmp528 = 0, $cmp53 = 0, $cmp532 = 0, $cmp57 = 0, $cmp576 = 0, $cmp585 = 0, $cmp585268 = 0, $cmp593 = 0, $cmp597 = 0, $cmp610 = 0, $cmp613 = 0, $cmp628 = 0, $cmp74 = 0, $cmp80 = 0, $cmp83 = 0, $cmp87 = 0, $cond = 0, $cond263 = 0, $cond264 = 0;
 var $dec = 0, $fd = 0, $fd268 = 0, $fd306 = 0, $fd317$pre = 0, $fd317$pre$phiZ2D = 0, $fd333 = 0, $fd342 = 0, $fd522 = 0, $fd56 = 0, $fd573 = 0, $fd604 = 0, $fd609 = 0, $fd622 = 0, $fd67$pre = 0, $fd67$pre$phiZ2D = 0, $fd78 = 0, $fd86 = 0, $head = 0, $head209 = 0;
 var $head216 = 0, $head228 = 0, $head245 = 0, $head256 = 0, $head476 = 0, $head489 = 0, $head583 = 0, $head583266 = 0, $index = 0, $index394 = 0, $index560 = 0, $neg = 0, $neg139 = 0, $neg295 = 0, $neg404 = 0, $next4$i = 0, $or = 0, $or244 = 0, $or255 = 0, $or475 = 0;
 var $or488 = 0, $or508 = 0, $or570 = 0, $p$0 = 0, $parent = 0, $parent170 = 0, $parent183 = 0, $parent199 = 0, $parent326 = 0, $parent437 = 0, $parent450 = 0, $parent466 = 0, $parent571 = 0, $parent602 = 0, $parent624 = 0, $psize$0 = 0, $psize$1 = 0, $shl = 0, $shl138 = 0, $shl273 = 0;
 var $shl294 = 0, $shl403 = 0, $shl45 = 0, $shl500 = 0, $shl503 = 0, $shl538 = 0, $shl543 = 0, $shl549 = 0, $shl552 = 0, $shl565 = 0, $shl582 = 0, $shl592 = 0, $shr = 0, $shr263 = 0, $shr493 = 0, $shr527 = 0, $shr536 = 0, $shr540 = 0, $shr545 = 0, $shr550 = 0;
 var $shr554 = 0, $shr578 = 0, $shr588 = 0, $sp$0$i = 0, $sp$0$in$i = 0, $sub = 0, $sub539 = 0, $sub544 = 0, $sub548 = 0, $sub581 = 0, $tobool230 = 0, $tobool238 = 0, $tobool505 = 0, $tobool567 = 0, $tobool9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $cmp = ($mem|0)==(0|0);
 if ($cmp) {
  STACKTOP = sp;return;
 }
 $add$ptr = (($mem) + -8|0);
 $0 = HEAP32[((2097240 + 16|0))>>2]|0;
 $cmp1 = ($add$ptr>>>0)<($0>>>0);
 if ($cmp1) {
  _abort();
  // unreachable;
 }
 $head = (($mem) + -4|0);
 $1 = HEAP32[$head>>2]|0;
 $and = $1 & 3;
 $cmp2 = ($and|0)==(1);
 if ($cmp2) {
  _abort();
  // unreachable;
 }
 $and5 = $1 & -8;
 $add$ptr$sum = (($and5) + -8)|0;
 $add$ptr6 = (($mem) + ($add$ptr$sum)|0);
 $and8 = $1 & 1;
 $tobool9 = ($and8|0)==(0);
 do {
  if ($tobool9) {
   $2 = HEAP32[$add$ptr>>2]|0;
   $cmp13 = ($and|0)==(0);
   if ($cmp13) {
    STACKTOP = sp;return;
   }
   $add$ptr$sum230 = (-8 - ($2))|0;
   $add$ptr16 = (($mem) + ($add$ptr$sum230)|0);
   $add17 = (($2) + ($and5))|0;
   $cmp18 = ($add$ptr16>>>0)<($0>>>0);
   if ($cmp18) {
    _abort();
    // unreachable;
   }
   $3 = HEAP32[((2097240 + 20|0))>>2]|0;
   $cmp22 = ($add$ptr16|0)==($3|0);
   if ($cmp22) {
    $add$ptr6$sum = (($and5) + -4)|0;
    $head209 = (($mem) + ($add$ptr6$sum)|0);
    $28 = HEAP32[$head209>>2]|0;
    $and210 = $28 & 3;
    $cmp211 = ($and210|0)==(3);
    if (!($cmp211)) {
     $p$0 = $add$ptr16;$psize$0 = $add17;
     break;
    }
    HEAP32[((2097240 + 8|0))>>2] = $add17;
    $29 = HEAP32[$head209>>2]|0;
    $and215 = $29 & -2;
    HEAP32[$head209>>2] = $and215;
    $or = $add17 | 1;
    $add$ptr16$sum = (($add$ptr$sum230) + 4)|0;
    $head216 = (($mem) + ($add$ptr16$sum)|0);
    HEAP32[$head216>>2] = $or;
    HEAP32[$add$ptr6>>2] = $add17;
    STACKTOP = sp;return;
   }
   $shr = $2 >>> 3;
   $cmp25 = ($2>>>0)<(256);
   if ($cmp25) {
    $add$ptr16$sum257 = (($add$ptr$sum230) + 8)|0;
    $fd = (($mem) + ($add$ptr16$sum257)|0);
    $4 = HEAP32[$fd>>2]|0;
    $add$ptr16$sum258 = (($add$ptr$sum230) + 12)|0;
    $bk = (($mem) + ($add$ptr16$sum258)|0);
    $5 = HEAP32[$bk>>2]|0;
    $shl = $shr << 1;
    $arrayidx = ((2097240 + ($shl<<2)|0) + 40|0);
    $cmp29 = ($4|0)==($arrayidx|0);
    if (!($cmp29)) {
     $cmp31 = ($4>>>0)<($0>>>0);
     if ($cmp31) {
      _abort();
      // unreachable;
     }
     $bk34 = (($4) + 12|0);
     $6 = HEAP32[$bk34>>2]|0;
     $cmp35 = ($6|0)==($add$ptr16|0);
     if (!($cmp35)) {
      _abort();
      // unreachable;
     }
    }
    $cmp42 = ($5|0)==($4|0);
    if ($cmp42) {
     $shl45 = 1 << $shr;
     $neg = $shl45 ^ -1;
     $7 = HEAP32[2097240>>2]|0;
     $and46 = $7 & $neg;
     HEAP32[2097240>>2] = $and46;
     $p$0 = $add$ptr16;$psize$0 = $add17;
     break;
    }
    $cmp50 = ($5|0)==($arrayidx|0);
    if ($cmp50) {
     $fd67$pre = (($5) + 8|0);
     $fd67$pre$phiZ2D = $fd67$pre;
    } else {
     $cmp53 = ($5>>>0)<($0>>>0);
     if ($cmp53) {
      _abort();
      // unreachable;
     }
     $fd56 = (($5) + 8|0);
     $8 = HEAP32[$fd56>>2]|0;
     $cmp57 = ($8|0)==($add$ptr16|0);
     if ($cmp57) {
      $fd67$pre$phiZ2D = $fd56;
     } else {
      _abort();
      // unreachable;
     }
    }
    $bk66 = (($4) + 12|0);
    HEAP32[$bk66>>2] = $5;
    HEAP32[$fd67$pre$phiZ2D>>2] = $4;
    $p$0 = $add$ptr16;$psize$0 = $add17;
    break;
   }
   $add$ptr16$sum251 = (($add$ptr$sum230) + 24)|0;
   $parent = (($mem) + ($add$ptr16$sum251)|0);
   $9 = HEAP32[$parent>>2]|0;
   $add$ptr16$sum252 = (($add$ptr$sum230) + 12)|0;
   $bk73 = (($mem) + ($add$ptr16$sum252)|0);
   $10 = HEAP32[$bk73>>2]|0;
   $cmp74 = ($10|0)==($add$ptr16|0);
   do {
    if ($cmp74) {
     $child$sum = (($add$ptr$sum230) + 20)|0;
     $arrayidx99 = (($mem) + ($child$sum)|0);
     $14 = HEAP32[$arrayidx99>>2]|0;
     $cmp100 = ($14|0)==(0|0);
     if ($cmp100) {
      $add$ptr16$sum253 = (($add$ptr$sum230) + 16)|0;
      $child = (($mem) + ($add$ptr16$sum253)|0);
      $15 = HEAP32[$child>>2]|0;
      $cmp104 = ($15|0)==(0|0);
      if ($cmp104) {
       $R$1 = 0;
       break;
      } else {
       $R$0 = $15;$RP$0 = $child;
      }
     } else {
      $R$0 = $14;$RP$0 = $arrayidx99;
     }
     while(1) {
      $arrayidx108 = (($R$0) + 20|0);
      $16 = HEAP32[$arrayidx108>>2]|0;
      $cmp109 = ($16|0)==(0|0);
      if (!($cmp109)) {
       $R$0 = $16;$RP$0 = $arrayidx108;
       continue;
      }
      $arrayidx113 = (($R$0) + 16|0);
      $17 = HEAP32[$arrayidx113>>2]|0;
      $cmp114 = ($17|0)==(0|0);
      if ($cmp114) {
       break;
      } else {
       $R$0 = $17;$RP$0 = $arrayidx113;
      }
     }
     $cmp118 = ($RP$0>>>0)<($0>>>0);
     if ($cmp118) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$RP$0>>2] = 0;
      $R$1 = $R$0;
      break;
     }
    } else {
     $add$ptr16$sum256 = (($add$ptr$sum230) + 8)|0;
     $fd78 = (($mem) + ($add$ptr16$sum256)|0);
     $11 = HEAP32[$fd78>>2]|0;
     $cmp80 = ($11>>>0)<($0>>>0);
     if ($cmp80) {
      _abort();
      // unreachable;
     }
     $bk82 = (($11) + 12|0);
     $12 = HEAP32[$bk82>>2]|0;
     $cmp83 = ($12|0)==($add$ptr16|0);
     if (!($cmp83)) {
      _abort();
      // unreachable;
     }
     $fd86 = (($10) + 8|0);
     $13 = HEAP32[$fd86>>2]|0;
     $cmp87 = ($13|0)==($add$ptr16|0);
     if ($cmp87) {
      HEAP32[$bk82>>2] = $10;
      HEAP32[$fd86>>2] = $11;
      $R$1 = $10;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $cmp127 = ($9|0)==(0|0);
   if ($cmp127) {
    $p$0 = $add$ptr16;$psize$0 = $add17;
   } else {
    $add$ptr16$sum254 = (($add$ptr$sum230) + 28)|0;
    $index = (($mem) + ($add$ptr16$sum254)|0);
    $18 = HEAP32[$index>>2]|0;
    $arrayidx130 = ((2097240 + ($18<<2)|0) + 304|0);
    $19 = HEAP32[$arrayidx130>>2]|0;
    $cmp131 = ($add$ptr16|0)==($19|0);
    if ($cmp131) {
     HEAP32[$arrayidx130>>2] = $R$1;
     $cond263 = ($R$1|0)==(0|0);
     if ($cond263) {
      $shl138 = 1 << $18;
      $neg139 = $shl138 ^ -1;
      $20 = HEAP32[((2097240 + 4|0))>>2]|0;
      $and140 = $20 & $neg139;
      HEAP32[((2097240 + 4|0))>>2] = $and140;
      $p$0 = $add$ptr16;$psize$0 = $add17;
      break;
     }
    } else {
     $21 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp143 = ($9>>>0)<($21>>>0);
     if ($cmp143) {
      _abort();
      // unreachable;
     }
     $arrayidx149 = (($9) + 16|0);
     $22 = HEAP32[$arrayidx149>>2]|0;
     $cmp150 = ($22|0)==($add$ptr16|0);
     if ($cmp150) {
      HEAP32[$arrayidx149>>2] = $R$1;
     } else {
      $arrayidx157 = (($9) + 20|0);
      HEAP32[$arrayidx157>>2] = $R$1;
     }
     $cmp162 = ($R$1|0)==(0|0);
     if ($cmp162) {
      $p$0 = $add$ptr16;$psize$0 = $add17;
      break;
     }
    }
    $23 = HEAP32[((2097240 + 16|0))>>2]|0;
    $cmp165 = ($R$1>>>0)<($23>>>0);
    if ($cmp165) {
     _abort();
     // unreachable;
    }
    $parent170 = (($R$1) + 24|0);
    HEAP32[$parent170>>2] = $9;
    $add$ptr16$sum255 = (($add$ptr$sum230) + 16)|0;
    $child171 = (($mem) + ($add$ptr16$sum255)|0);
    $24 = HEAP32[$child171>>2]|0;
    $cmp173 = ($24|0)==(0|0);
    do {
     if (!($cmp173)) {
      $25 = HEAP32[((2097240 + 16|0))>>2]|0;
      $cmp176 = ($24>>>0)<($25>>>0);
      if ($cmp176) {
       _abort();
       // unreachable;
      } else {
       $arrayidx182 = (($R$1) + 16|0);
       HEAP32[$arrayidx182>>2] = $24;
       $parent183 = (($24) + 24|0);
       HEAP32[$parent183>>2] = $R$1;
       break;
      }
     }
    } while(0);
    $child171$sum = (($add$ptr$sum230) + 20)|0;
    $arrayidx188 = (($mem) + ($child171$sum)|0);
    $26 = HEAP32[$arrayidx188>>2]|0;
    $cmp189 = ($26|0)==(0|0);
    if ($cmp189) {
     $p$0 = $add$ptr16;$psize$0 = $add17;
    } else {
     $27 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp192 = ($26>>>0)<($27>>>0);
     if ($cmp192) {
      _abort();
      // unreachable;
     } else {
      $arrayidx198 = (($R$1) + 20|0);
      HEAP32[$arrayidx198>>2] = $26;
      $parent199 = (($26) + 24|0);
      HEAP32[$parent199>>2] = $R$1;
      $p$0 = $add$ptr16;$psize$0 = $add17;
      break;
     }
    }
   }
  } else {
   $p$0 = $add$ptr;$psize$0 = $and5;
  }
 } while(0);
 $cmp225 = ($p$0>>>0)<($add$ptr6>>>0);
 if (!($cmp225)) {
  _abort();
  // unreachable;
 }
 $add$ptr6$sum249 = (($and5) + -4)|0;
 $head228 = (($mem) + ($add$ptr6$sum249)|0);
 $30 = HEAP32[$head228>>2]|0;
 $and229 = $30 & 1;
 $tobool230 = ($and229|0)==(0);
 if ($tobool230) {
  _abort();
  // unreachable;
 }
 $and237 = $30 & 2;
 $tobool238 = ($and237|0)==(0);
 if ($tobool238) {
  $31 = HEAP32[((2097240 + 24|0))>>2]|0;
  $cmp240 = ($add$ptr6|0)==($31|0);
  if ($cmp240) {
   $32 = HEAP32[((2097240 + 12|0))>>2]|0;
   $add243 = (($32) + ($psize$0))|0;
   HEAP32[((2097240 + 12|0))>>2] = $add243;
   HEAP32[((2097240 + 24|0))>>2] = $p$0;
   $or244 = $add243 | 1;
   $head245 = (($p$0) + 4|0);
   HEAP32[$head245>>2] = $or244;
   $33 = HEAP32[((2097240 + 20|0))>>2]|0;
   $cmp246 = ($p$0|0)==($33|0);
   if (!($cmp246)) {
    STACKTOP = sp;return;
   }
   HEAP32[((2097240 + 20|0))>>2] = 0;
   HEAP32[((2097240 + 8|0))>>2] = 0;
   STACKTOP = sp;return;
  }
  $34 = HEAP32[((2097240 + 20|0))>>2]|0;
  $cmp251 = ($add$ptr6|0)==($34|0);
  if ($cmp251) {
   $35 = HEAP32[((2097240 + 8|0))>>2]|0;
   $add254 = (($35) + ($psize$0))|0;
   HEAP32[((2097240 + 8|0))>>2] = $add254;
   HEAP32[((2097240 + 20|0))>>2] = $p$0;
   $or255 = $add254 | 1;
   $head256 = (($p$0) + 4|0);
   HEAP32[$head256>>2] = $or255;
   $add$ptr257 = (($p$0) + ($add254)|0);
   HEAP32[$add$ptr257>>2] = $add254;
   STACKTOP = sp;return;
  }
  $and261 = $30 & -8;
  $add262 = (($and261) + ($psize$0))|0;
  $shr263 = $30 >>> 3;
  $cmp264 = ($30>>>0)<(256);
  do {
   if ($cmp264) {
    $fd268 = (($mem) + ($and5)|0);
    $36 = HEAP32[$fd268>>2]|0;
    $add$ptr6$sum247248 = $and5 | 4;
    $bk270 = (($mem) + ($add$ptr6$sum247248)|0);
    $37 = HEAP32[$bk270>>2]|0;
    $shl273 = $shr263 << 1;
    $arrayidx274 = ((2097240 + ($shl273<<2)|0) + 40|0);
    $cmp275 = ($36|0)==($arrayidx274|0);
    if (!($cmp275)) {
     $38 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp278 = ($36>>>0)<($38>>>0);
     if ($cmp278) {
      _abort();
      // unreachable;
     }
     $bk281 = (($36) + 12|0);
     $39 = HEAP32[$bk281>>2]|0;
     $cmp282 = ($39|0)==($add$ptr6|0);
     if (!($cmp282)) {
      _abort();
      // unreachable;
     }
    }
    $cmp291 = ($37|0)==($36|0);
    if ($cmp291) {
     $shl294 = 1 << $shr263;
     $neg295 = $shl294 ^ -1;
     $40 = HEAP32[2097240>>2]|0;
     $and296 = $40 & $neg295;
     HEAP32[2097240>>2] = $and296;
     break;
    }
    $cmp300 = ($37|0)==($arrayidx274|0);
    if ($cmp300) {
     $fd317$pre = (($37) + 8|0);
     $fd317$pre$phiZ2D = $fd317$pre;
    } else {
     $41 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp303 = ($37>>>0)<($41>>>0);
     if ($cmp303) {
      _abort();
      // unreachable;
     }
     $fd306 = (($37) + 8|0);
     $42 = HEAP32[$fd306>>2]|0;
     $cmp307 = ($42|0)==($add$ptr6|0);
     if ($cmp307) {
      $fd317$pre$phiZ2D = $fd306;
     } else {
      _abort();
      // unreachable;
     }
    }
    $bk316 = (($36) + 12|0);
    HEAP32[$bk316>>2] = $37;
    HEAP32[$fd317$pre$phiZ2D>>2] = $36;
   } else {
    $add$ptr6$sum232 = (($and5) + 16)|0;
    $parent326 = (($mem) + ($add$ptr6$sum232)|0);
    $43 = HEAP32[$parent326>>2]|0;
    $add$ptr6$sum233234 = $and5 | 4;
    $bk328 = (($mem) + ($add$ptr6$sum233234)|0);
    $44 = HEAP32[$bk328>>2]|0;
    $cmp329 = ($44|0)==($add$ptr6|0);
    do {
     if ($cmp329) {
      $child356$sum = (($and5) + 12)|0;
      $arrayidx357 = (($mem) + ($child356$sum)|0);
      $49 = HEAP32[$arrayidx357>>2]|0;
      $cmp358 = ($49|0)==(0|0);
      if ($cmp358) {
       $add$ptr6$sum235 = (($and5) + 8)|0;
       $child356 = (($mem) + ($add$ptr6$sum235)|0);
       $50 = HEAP32[$child356>>2]|0;
       $cmp363 = ($50|0)==(0|0);
       if ($cmp363) {
        $R327$1 = 0;
        break;
       } else {
        $R327$0 = $50;$RP355$0 = $child356;
       }
      } else {
       $R327$0 = $49;$RP355$0 = $arrayidx357;
      }
      while(1) {
       $arrayidx369 = (($R327$0) + 20|0);
       $51 = HEAP32[$arrayidx369>>2]|0;
       $cmp370 = ($51|0)==(0|0);
       if (!($cmp370)) {
        $R327$0 = $51;$RP355$0 = $arrayidx369;
        continue;
       }
       $arrayidx374 = (($R327$0) + 16|0);
       $52 = HEAP32[$arrayidx374>>2]|0;
       $cmp375 = ($52|0)==(0|0);
       if ($cmp375) {
        break;
       } else {
        $R327$0 = $52;$RP355$0 = $arrayidx374;
       }
      }
      $53 = HEAP32[((2097240 + 16|0))>>2]|0;
      $cmp381 = ($RP355$0>>>0)<($53>>>0);
      if ($cmp381) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP355$0>>2] = 0;
       $R327$1 = $R327$0;
       break;
      }
     } else {
      $fd333 = (($mem) + ($and5)|0);
      $45 = HEAP32[$fd333>>2]|0;
      $46 = HEAP32[((2097240 + 16|0))>>2]|0;
      $cmp335 = ($45>>>0)<($46>>>0);
      if ($cmp335) {
       _abort();
       // unreachable;
      }
      $bk338 = (($45) + 12|0);
      $47 = HEAP32[$bk338>>2]|0;
      $cmp339 = ($47|0)==($add$ptr6|0);
      if (!($cmp339)) {
       _abort();
       // unreachable;
      }
      $fd342 = (($44) + 8|0);
      $48 = HEAP32[$fd342>>2]|0;
      $cmp343 = ($48|0)==($add$ptr6|0);
      if ($cmp343) {
       HEAP32[$bk338>>2] = $44;
       HEAP32[$fd342>>2] = $45;
       $R327$1 = $44;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $cmp390 = ($43|0)==(0|0);
    if (!($cmp390)) {
     $add$ptr6$sum243 = (($and5) + 20)|0;
     $index394 = (($mem) + ($add$ptr6$sum243)|0);
     $54 = HEAP32[$index394>>2]|0;
     $arrayidx395 = ((2097240 + ($54<<2)|0) + 304|0);
     $55 = HEAP32[$arrayidx395>>2]|0;
     $cmp396 = ($add$ptr6|0)==($55|0);
     if ($cmp396) {
      HEAP32[$arrayidx395>>2] = $R327$1;
      $cond264 = ($R327$1|0)==(0|0);
      if ($cond264) {
       $shl403 = 1 << $54;
       $neg404 = $shl403 ^ -1;
       $56 = HEAP32[((2097240 + 4|0))>>2]|0;
       $and405 = $56 & $neg404;
       HEAP32[((2097240 + 4|0))>>2] = $and405;
       break;
      }
     } else {
      $57 = HEAP32[((2097240 + 16|0))>>2]|0;
      $cmp408 = ($43>>>0)<($57>>>0);
      if ($cmp408) {
       _abort();
       // unreachable;
      }
      $arrayidx414 = (($43) + 16|0);
      $58 = HEAP32[$arrayidx414>>2]|0;
      $cmp415 = ($58|0)==($add$ptr6|0);
      if ($cmp415) {
       HEAP32[$arrayidx414>>2] = $R327$1;
      } else {
       $arrayidx422 = (($43) + 20|0);
       HEAP32[$arrayidx422>>2] = $R327$1;
      }
      $cmp427 = ($R327$1|0)==(0|0);
      if ($cmp427) {
       break;
      }
     }
     $59 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp430 = ($R327$1>>>0)<($59>>>0);
     if ($cmp430) {
      _abort();
      // unreachable;
     }
     $parent437 = (($R327$1) + 24|0);
     HEAP32[$parent437>>2] = $43;
     $add$ptr6$sum244 = (($and5) + 8)|0;
     $child438 = (($mem) + ($add$ptr6$sum244)|0);
     $60 = HEAP32[$child438>>2]|0;
     $cmp440 = ($60|0)==(0|0);
     do {
      if (!($cmp440)) {
       $61 = HEAP32[((2097240 + 16|0))>>2]|0;
       $cmp443 = ($60>>>0)<($61>>>0);
       if ($cmp443) {
        _abort();
        // unreachable;
       } else {
        $arrayidx449 = (($R327$1) + 16|0);
        HEAP32[$arrayidx449>>2] = $60;
        $parent450 = (($60) + 24|0);
        HEAP32[$parent450>>2] = $R327$1;
        break;
       }
      }
     } while(0);
     $child438$sum = (($and5) + 12)|0;
     $arrayidx455 = (($mem) + ($child438$sum)|0);
     $62 = HEAP32[$arrayidx455>>2]|0;
     $cmp456 = ($62|0)==(0|0);
     if (!($cmp456)) {
      $63 = HEAP32[((2097240 + 16|0))>>2]|0;
      $cmp459 = ($62>>>0)<($63>>>0);
      if ($cmp459) {
       _abort();
       // unreachable;
      } else {
       $arrayidx465 = (($R327$1) + 20|0);
       HEAP32[$arrayidx465>>2] = $62;
       $parent466 = (($62) + 24|0);
       HEAP32[$parent466>>2] = $R327$1;
       break;
      }
     }
    }
   }
  } while(0);
  $or475 = $add262 | 1;
  $head476 = (($p$0) + 4|0);
  HEAP32[$head476>>2] = $or475;
  $add$ptr477 = (($p$0) + ($add262)|0);
  HEAP32[$add$ptr477>>2] = $add262;
  $64 = HEAP32[((2097240 + 20|0))>>2]|0;
  $cmp479 = ($p$0|0)==($64|0);
  if ($cmp479) {
   HEAP32[((2097240 + 8|0))>>2] = $add262;
   STACKTOP = sp;return;
  } else {
   $psize$1 = $add262;
  }
 } else {
  $and487 = $30 & -2;
  HEAP32[$head228>>2] = $and487;
  $or488 = $psize$0 | 1;
  $head489 = (($p$0) + 4|0);
  HEAP32[$head489>>2] = $or488;
  $add$ptr490 = (($p$0) + ($psize$0)|0);
  HEAP32[$add$ptr490>>2] = $psize$0;
  $psize$1 = $psize$0;
 }
 $shr493 = $psize$1 >>> 3;
 $cmp494 = ($psize$1>>>0)<(256);
 if ($cmp494) {
  $shl500 = $shr493 << 1;
  $arrayidx501 = ((2097240 + ($shl500<<2)|0) + 40|0);
  $65 = HEAP32[2097240>>2]|0;
  $shl503 = 1 << $shr493;
  $and504 = $65 & $shl503;
  $tobool505 = ($and504|0)==(0);
  if ($tobool505) {
   $or508 = $65 | $shl503;
   HEAP32[2097240>>2] = $or508;
   $arrayidx501$sum$pre = (($shl500) + 2)|0;
   $$pre = ((2097240 + ($arrayidx501$sum$pre<<2)|0) + 40|0);
   $$pre$phiZ2D = $$pre;$F502$0 = $arrayidx501;
  } else {
   $arrayidx501$sum242 = (($shl500) + 2)|0;
   $66 = ((2097240 + ($arrayidx501$sum242<<2)|0) + 40|0);
   $67 = HEAP32[$66>>2]|0;
   $68 = HEAP32[((2097240 + 16|0))>>2]|0;
   $cmp511 = ($67>>>0)<($68>>>0);
   if ($cmp511) {
    _abort();
    // unreachable;
   } else {
    $$pre$phiZ2D = $66;$F502$0 = $67;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $p$0;
  $bk521 = (($F502$0) + 12|0);
  HEAP32[$bk521>>2] = $p$0;
  $fd522 = (($p$0) + 8|0);
  HEAP32[$fd522>>2] = $F502$0;
  $bk523 = (($p$0) + 12|0);
  HEAP32[$bk523>>2] = $arrayidx501;
  STACKTOP = sp;return;
 }
 $shr527 = $psize$1 >>> 8;
 $cmp528 = ($shr527|0)==(0);
 if ($cmp528) {
  $I526$0 = 0;
 } else {
  $cmp532 = ($psize$1>>>0)>(16777215);
  if ($cmp532) {
   $I526$0 = 31;
  } else {
   $sub = (($shr527) + 1048320)|0;
   $shr536 = $sub >>> 16;
   $and537 = $shr536 & 8;
   $shl538 = $shr527 << $and537;
   $sub539 = (($shl538) + 520192)|0;
   $shr540 = $sub539 >>> 16;
   $and541 = $shr540 & 4;
   $add542 = $and541 | $and537;
   $shl543 = $shl538 << $and541;
   $sub544 = (($shl543) + 245760)|0;
   $shr545 = $sub544 >>> 16;
   $and546 = $shr545 & 2;
   $add547 = $add542 | $and546;
   $sub548 = (14 - ($add547))|0;
   $shl549 = $shl543 << $and546;
   $shr550 = $shl549 >>> 15;
   $add551 = (($sub548) + ($shr550))|0;
   $shl552 = $add551 << 1;
   $add553 = (($add551) + 7)|0;
   $shr554 = $psize$1 >>> $add553;
   $and555 = $shr554 & 1;
   $add556 = $and555 | $shl552;
   $I526$0 = $add556;
  }
 }
 $arrayidx559 = ((2097240 + ($I526$0<<2)|0) + 304|0);
 $index560 = (($p$0) + 28|0);
 $I526$0$c = $I526$0;
 HEAP32[$index560>>2] = $I526$0$c;
 $arrayidx562 = (($p$0) + 20|0);
 HEAP32[$arrayidx562>>2] = 0;
 $69 = (($p$0) + 16|0);
 HEAP32[$69>>2] = 0;
 $70 = HEAP32[((2097240 + 4|0))>>2]|0;
 $shl565 = 1 << $I526$0;
 $and566 = $70 & $shl565;
 $tobool567 = ($and566|0)==(0);
 L199: do {
  if ($tobool567) {
   $or570 = $70 | $shl565;
   HEAP32[((2097240 + 4|0))>>2] = $or570;
   HEAP32[$arrayidx559>>2] = $p$0;
   $parent571 = (($p$0) + 24|0);
   HEAP32[$parent571>>2] = $arrayidx559;
   $bk572 = (($p$0) + 12|0);
   HEAP32[$bk572>>2] = $p$0;
   $fd573 = (($p$0) + 8|0);
   HEAP32[$fd573>>2] = $p$0;
  } else {
   $71 = HEAP32[$arrayidx559>>2]|0;
   $cmp576 = ($I526$0|0)==(31);
   if ($cmp576) {
    $cond = 0;
   } else {
    $shr578 = $I526$0 >>> 1;
    $sub581 = (25 - ($shr578))|0;
    $cond = $sub581;
   }
   $head583266 = (($71) + 4|0);
   $72 = HEAP32[$head583266>>2]|0;
   $and584267 = $72 & -8;
   $cmp585268 = ($and584267|0)==($psize$1|0);
   L205: do {
    if ($cmp585268) {
     $T$0$lcssa = $71;
    } else {
     $shl582 = $psize$1 << $cond;
     $K575$0270 = $shl582;$T$0269 = $71;
     while(1) {
      $shr588 = $K575$0270 >>> 31;
      $arrayidx591 = ((($T$0269) + ($shr588<<2)|0) + 16|0);
      $73 = HEAP32[$arrayidx591>>2]|0;
      $cmp593 = ($73|0)==(0|0);
      if ($cmp593) {
       break;
      }
      $shl592 = $K575$0270 << 1;
      $head583 = (($73) + 4|0);
      $74 = HEAP32[$head583>>2]|0;
      $and584 = $74 & -8;
      $cmp585 = ($and584|0)==($psize$1|0);
      if ($cmp585) {
       $T$0$lcssa = $73;
       break L205;
      } else {
       $K575$0270 = $shl592;$T$0269 = $73;
      }
     }
     $75 = HEAP32[((2097240 + 16|0))>>2]|0;
     $cmp597 = ($arrayidx591>>>0)<($75>>>0);
     if ($cmp597) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$arrayidx591>>2] = $p$0;
      $parent602 = (($p$0) + 24|0);
      HEAP32[$parent602>>2] = $T$0269;
      $bk603 = (($p$0) + 12|0);
      HEAP32[$bk603>>2] = $p$0;
      $fd604 = (($p$0) + 8|0);
      HEAP32[$fd604>>2] = $p$0;
      break L199;
     }
    }
   } while(0);
   $fd609 = (($T$0$lcssa) + 8|0);
   $76 = HEAP32[$fd609>>2]|0;
   $77 = HEAP32[((2097240 + 16|0))>>2]|0;
   $cmp610 = ($T$0$lcssa>>>0)<($77>>>0);
   if ($cmp610) {
    _abort();
    // unreachable;
   }
   $cmp613 = ($76>>>0)<($77>>>0);
   if ($cmp613) {
    _abort();
    // unreachable;
   } else {
    $bk620 = (($76) + 12|0);
    HEAP32[$bk620>>2] = $p$0;
    HEAP32[$fd609>>2] = $p$0;
    $fd622 = (($p$0) + 8|0);
    HEAP32[$fd622>>2] = $76;
    $bk623 = (($p$0) + 12|0);
    HEAP32[$bk623>>2] = $T$0$lcssa;
    $parent624 = (($p$0) + 24|0);
    HEAP32[$parent624>>2] = 0;
    break;
   }
  }
 } while(0);
 $78 = HEAP32[((2097240 + 32|0))>>2]|0;
 $dec = (($78) + -1)|0;
 HEAP32[((2097240 + 32|0))>>2] = $dec;
 $cmp628 = ($dec|0)==(0);
 if ($cmp628) {
  $sp$0$in$i = ((2097240 + 456|0));
 } else {
  STACKTOP = sp;return;
 }
 while(1) {
  $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
  $cmp$i = ($sp$0$i|0)==(0|0);
  $next4$i = (($sp$0$i) + 8|0);
  if ($cmp$i) {
   break;
  } else {
   $sp$0$in$i = $next4$i;
  }
 }
 HEAP32[((2097240 + 32|0))>>2] = -1;
 STACKTOP = sp;return;
}
function _srand($s) {
 $s = $s|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $sub = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $sub = (($s) + -1)|0;
 $0 = 2097736;
 $1 = $0;
 HEAP32[$1>>2] = $sub;
 $2 = (($0) + 4)|0;
 $3 = $2;
 HEAP32[$3>>2] = 0;
 STACKTOP = sp;return;
}
function _rand() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = 2097736;
 $1 = $0;
 $2 = HEAP32[$1>>2]|0;
 $3 = (($0) + 4)|0;
 $4 = $3;
 $5 = HEAP32[$4>>2]|0;
 $6 = (___muldi3(($2|0),($5|0),1284865837,1481765933)|0);
 $7 = tempRet0;
 $8 = (_i64Add(($6|0),($7|0),1,0)|0);
 $9 = tempRet0;
 $10 = 2097736;
 $11 = $10;
 HEAP32[$11>>2] = $8;
 $12 = (($10) + 4)|0;
 $13 = $12;
 HEAP32[$13>>2] = $9;
 $14 = (_bitshift64Lshr(($8|0),($9|0),33)|0);
 $15 = tempRet0;
 STACKTOP = sp;return ($14|0);
}
function runPostSets() {
 
}
function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return ((tempRet0 = h,l|0)|0);
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
}
function _strlen(ptr) {
    ptr = ptr|0;
    var curr = 0;
    curr = ptr;
    while (((HEAP8[((curr)>>0)])|0)) {
      curr = (curr + 1)|0;
    }
    return (curr - ptr)|0;
}
function _memcpy(dest, src, num) {

    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return ((tempRet0 = h,l|0)|0);
  }
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
  }
function _bitshift64Ashr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = (high|0) < 0 ? -1 : 0;
    return (high >> (bits - 32))|0;
  }
function _llvm_ctlz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((ctlz_i8)+(x >>> 24))>>0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((ctlz_i8)+((x >> 16)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((ctlz_i8)+((x >> 8)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((ctlz_i8)+(x&0xff))>>0)])|0) + 24)|0;
  }

function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((cttz_i8)+(x & 0xff))>>0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 8)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 16)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((cttz_i8)+(x >>> 24))>>0)])|0) + 24)|0;
  }

// ======== compiled code from system/lib/compiler-rt , see readme therein
function ___muldsi3($a, $b) {
  $a = $a | 0;
  $b = $b | 0;
  var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
  $1 = $a & 65535;
  $2 = $b & 65535;
  $3 = Math_imul($2, $1) | 0;
  $6 = $a >>> 16;
  $8 = ($3 >>> 16) + (Math_imul($2, $6) | 0) | 0;
  $11 = $b >>> 16;
  $12 = Math_imul($11, $1) | 0;
  return (tempRet0 = (($8 >>> 16) + (Math_imul($11, $6) | 0) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, 0 | ($8 + $12 << 16 | $3 & 65535)) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $7$0 = 0, $7$1 = 0, $8$0 = 0, $10$0 = 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  $7$0 = $2$0 ^ $1$0;
  $7$1 = $2$1 ^ $1$1;
  $8$0 = ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, 0) | 0;
  $10$0 = _i64Subtract($8$0 ^ $7$0, tempRet0 ^ $7$1, $7$0, $7$1) | 0;
  return (tempRet0 = tempRet0, $10$0) | 0;
}
function ___remdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $10$0 = 0, $10$1 = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 8 | 0;
  $rem = __stackBase__ | 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, $rem) | 0;
  $10$0 = _i64Subtract(HEAP32[$rem >> 2] ^ $1$0, HEAP32[$rem + 4 >> 2] ^ $1$1, $1$0, $1$1) | 0;
  $10$1 = tempRet0;
  STACKTOP = __stackBase__;
  return (tempRet0 = $10$1, $10$0) | 0;
}
function ___muldi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0, $2 = 0;
  $x_sroa_0_0_extract_trunc = $a$0;
  $y_sroa_0_0_extract_trunc = $b$0;
  $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
  $1$1 = tempRet0;
  $2 = Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0;
  return (tempRet0 = ((Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $2 | 0) + $1$1 | $1$1 & 0, 0 | $1$0 & -1) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0;
  $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
  return (tempRet0 = tempRet0, $1$0) | 0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 8 | 0;
  $rem = __stackBase__ | 0;
  ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
  STACKTOP = __stackBase__;
  return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  $rem = $rem | 0;
  var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
  $n_sroa_0_0_extract_trunc = $a$0;
  $n_sroa_1_4_extract_shift$0 = $a$1;
  $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
  $d_sroa_0_0_extract_trunc = $b$0;
  $d_sroa_1_4_extract_shift$0 = $b$1;
  $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
  if (($n_sroa_1_4_extract_trunc | 0) == 0) {
    $4 = ($rem | 0) != 0;
    if (($d_sroa_1_4_extract_trunc | 0) == 0) {
      if ($4) {
        HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
        HEAP32[$rem + 4 >> 2] = 0;
      }
      $_0$1 = 0;
      $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$4) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    }
  }
  $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
  do {
    if (($d_sroa_0_0_extract_trunc | 0) == 0) {
      if ($17) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
          HEAP32[$rem + 4 >> 2] = 0;
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      if (($n_sroa_0_0_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0;
          HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
      if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
        }
        $_0$1 = 0;
        $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $49 = _llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0;
      $51 = $49 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
      if ($51 >>> 0 <= 30) {
        $57 = $51 + 1 | 0;
        $58 = 31 - $51 | 0;
        $sr_1_ph = $57;
        $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
        $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
        $q_sroa_0_1_ph = 0;
        $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
        break;
      }
      if (($rem | 0) == 0) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = 0 | $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$17) {
        $117 = _llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0;
        $119 = $117 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        if ($119 >>> 0 <= 31) {
          $125 = $119 + 1 | 0;
          $126 = 31 - $119 | 0;
          $130 = $119 - 31 >> 31;
          $sr_1_ph = $125;
          $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
          $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
          $q_sroa_0_1_ph = 0;
          $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
          break;
        }
        if (($rem | 0) == 0) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
      if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
        $86 = (_llvm_ctlz_i32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
        $88 = $86 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        $89 = 64 - $88 | 0;
        $91 = 32 - $88 | 0;
        $92 = $91 >> 31;
        $95 = $88 - 32 | 0;
        $105 = $95 >> 31;
        $sr_1_ph = $88;
        $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
        $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
        $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
        $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
        break;
      }
      if (($rem | 0) != 0) {
        HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
        HEAP32[$rem + 4 >> 2] = 0;
      }
      if (($d_sroa_0_0_extract_trunc | 0) == 1) {
        $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$0 = 0 | $a$0 & -1;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
        $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
        $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
    }
  } while (0);
  if (($sr_1_ph | 0) == 0) {
    $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
    $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
    $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
    $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = 0;
  } else {
    $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
    $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
    $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0, $d_sroa_0_0_insert_insert99$1, -1, -1) | 0;
    $137$1 = tempRet0;
    $q_sroa_1_1198 = $q_sroa_1_1_ph;
    $q_sroa_0_1199 = $q_sroa_0_1_ph;
    $r_sroa_1_1200 = $r_sroa_1_1_ph;
    $r_sroa_0_1201 = $r_sroa_0_1_ph;
    $sr_1202 = $sr_1_ph;
    $carry_0203 = 0;
    while (1) {
      $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
      $149 = $carry_0203 | $q_sroa_0_1199 << 1;
      $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
      $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
      _i64Subtract($137$0, $137$1, $r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1) | 0;
      $150$1 = tempRet0;
      $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
      $152 = $151$0 & 1;
      $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1, $151$0 & $d_sroa_0_0_insert_insert99$0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1) | 0;
      $r_sroa_0_0_extract_trunc = $154$0;
      $r_sroa_1_4_extract_trunc = tempRet0;
      $155 = $sr_1202 - 1 | 0;
      if (($155 | 0) == 0) {
        break;
      } else {
        $q_sroa_1_1198 = $147;
        $q_sroa_0_1199 = $149;
        $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
        $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
        $sr_1202 = $155;
        $carry_0203 = $152;
      }
    }
    $q_sroa_1_1_lcssa = $147;
    $q_sroa_0_1_lcssa = $149;
    $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
    $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = $152;
  }
  $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
  $q_sroa_0_0_insert_ext75$1 = 0;
  $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
  if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
    HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
  }
  $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
  $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
}
// =======================================================================



// EMSCRIPTEN_END_FUNCS

    

  // EMSCRIPTEN_END_FUNCS
  

    return { _strlen: _strlen, _free: _free, _i64Add: _i64Add, _initialize: _initialize, _memset: _memset, _generation: _generation, _malloc: _malloc, _memcpy: _memcpy, _getPixel: _getPixel, _bitshift64Lshr: _bitshift64Lshr, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0 };
  })
  // EMSCRIPTEN_END_ASM
  ({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "min": Math_min, "_sin": _sin, "_fflush": _fflush, "_llvm_pow_f64": _llvm_pow_f64, "_cos": _cos, "_abort": _abort, "___setErrNo": ___setErrNo, "_sbrk": _sbrk, "_time": _time, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sysconf": _sysconf, "___errno_location": ___errno_location, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity }, buffer);
  var real__strlen = asm["_strlen"]; asm["_strlen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__strlen.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__i64Add.apply(null, arguments);
};

var real__initialize = asm["_initialize"]; asm["_initialize"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__initialize.apply(null, arguments);
};

var real__generation = asm["_generation"]; asm["_generation"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__generation.apply(null, arguments);
};

var real__getPixel = asm["_getPixel"]; asm["_getPixel"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__getPixel.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__bitshift64Lshr.apply(null, arguments);
};

var real_runPostSets = asm["runPostSets"]; asm["runPostSets"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_runPostSets.apply(null, arguments);
};
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _initialize = Module["_initialize"] = asm["_initialize"];
var _memset = Module["_memset"] = asm["_memset"];
var _generation = Module["_generation"] = asm["_generation"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _getPixel = Module["_getPixel"] = asm["_getPixel"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
  
  Runtime.stackAlloc = asm['stackAlloc'];
  Runtime.stackSave = asm['stackSave'];
  Runtime.stackRestore = asm['stackRestore'];
  Runtime.setTempRet0 = asm['setTempRet0'];
  Runtime.getTempRet0 = asm['getTempRet0'];
  

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (typeof Module['locateFile'] === 'function') {
    memoryInitializer = Module['locateFile'](memoryInitializer);
  } else if (Module['memoryInitializerPrefixURL']) {
    memoryInitializer = Module['memoryInitializerPrefixURL'] + memoryInitializer;
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      for (var i = 0; i < data.length; i++) {
        assert(HEAPU8[STATIC_BASE + i] === 0, "area for memory initializer should not have been touched before it's loaded");
      }
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so not exiting');
    return;
  }

  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  if (ENVIRONMENT_IS_NODE) {
    // Work around a node.js bug where stdout buffer is not flushed at process exit:
    // Instead of process.exit() directly, wait for stdout flush event.
    // See https://github.com/joyent/node/issues/1669 and https://github.com/kripken/emscripten/issues/2582
    // Workaround is based on https://github.com/RReverser/acorn/commit/50ab143cecc9ed71a2d66f78b4aec3bb2e9844f6
    process['stdout']['once']('drain', function () {
      process['exit'](status);
    });
    console.log(' '); // Make sure to print something to force the drain event to occur, in case the stdout buffer was empty.
    // Work around another node bug where sometimes 'drain' is never fired - make another effort
    // to emit the exit status, after a significant delay (if node hasn't fired drain by then, give up)
    setTimeout(function() {
      process['exit'](status);
    }, 500);
  } else
  if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



