/**
 * Native N-API bindings placeholder for Node.js integration.
 * 
 * This file provides minimal structure for future N-API bindings.
 * To complete integration:
 * 1. Include node_api.h
 * 2. Implement wrapper functions that convert napi_value to C types
 * 3. Register all functions in Init()
 * 4. Create binding.gyp for node-gyp compilation
 * 
 * Example wrapper pattern:
 * 
 * napi_value CalculateStockSpan(napi_env env, napi_callback_info info) {
 *     size_t argc = 1;
 *     napi_value args[1];
 *     napi_get_cb_info(env, info, &argc, args, NULL, NULL);
 *     
 *     // Extract TypedArray
 *     bool is_typedarray;
 *     napi_is_typedarray(env, args[0], &is_typedarray);
 *     
 *     void* data;
 *     size_t length;
 *     napi_typedarray_type type;
 *     napi_get_typedarray_info(env, args[0], &type, &length, &data, NULL, NULL);
 *     
 *     // Call C function
 *     int* spans = NULL;
 *     char err[256];
 *     int result = calculateStockSpan((double*)data, length, &spans, err, sizeof(err));
 *     
 *     if (result != 0) {
 *         napi_throw_error(env, NULL, err);
 *         return NULL;
 *     }
 *     
 *     // Create output array
 *     napi_value output;
 *     napi_create_array_with_length(env, length, &output);
 *     for (size_t i = 0; i < length; i++) {
 *         napi_value val;
 *         napi_create_int32(env, spans[i], &val);
 *         napi_set_element(env, output, i, val);
 *     }
 *     
 *     free(spans);
 *     return output;
 * }
 * 
 * NAPI_MODULE_INIT() {
 *     napi_value fn;
 *     napi_create_function(env, NULL, 0, CalculateStockSpan, NULL, &fn);
 *     napi_set_named_property(env, exports, "calculateStockSpan", fn);
 *     return exports;
 * }
 */

#include "stock_span.h"
#include "segment_tree.h"
#include "sliding_window.h"

// Placeholder - include actual N-API implementation when integrating with Node.js
// Requires: #include <node_api.h>

/*
 * To build N-API module:
 * 1. Create binding.gyp in project root
 * 2. Run: node-gyp configure
 * 3. Run: node-gyp build
 * 4. Require in Node: const dsa = require('./build/Release/dsa.node');
 */
