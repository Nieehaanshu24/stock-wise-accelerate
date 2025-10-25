/**
 * N-API bindings for Dynamic Stock Analyzer C modules
 * 
 * Wraps C functions with Node-API (N-API) for JavaScript/TypeScript access.
 * Handles type conversions, memory management, and error propagation.
 */

#include <napi.h>
#include <cstring>
#include <cmath>

extern "C" {
  #include "stock_span.h"
  #include "segment_tree.h"
  #include "sliding_window.h"
}

// Error buffer size for C function calls
#define ERR_BUF_SIZE 512

/**
 * Helper: Convert C error to JS exception
 */
static void ThrowCError(Napi::Env env, int errorCode, const char* errorMsg) {
  std::string fullMsg = "C Module Error (code " + std::to_string(errorCode) + "): " + errorMsg;
  Napi::Error::New(env, fullMsg).ThrowAsJavaScriptException();
}

/**
 * Wrapper: calculateStockSpan
 * Input: Float64Array prices
 * Output: Int32Array spans
 */
Napi::Value CalculateStockSpan(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Validate arguments
  if (info.Length() < 1 || !info[0].IsTypedArray()) {
    Napi::TypeError::New(env, "Expected Float64Array as first argument").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Float64Array inputArray = info[0].As<Napi::Float64Array>();
  size_t length = inputArray.ElementLength();
  
  if (length == 0) {
    Napi::TypeError::New(env, "Input array cannot be empty").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Get pointer to input data
  double* prices = reinterpret_cast<double*>(inputArray.ArrayBuffer().Data());
  prices += inputArray.ByteOffset() / sizeof(double);
  
  // Call C function
  int* spans = nullptr;
  char errBuf[ERR_BUF_SIZE] = {0};
  
  int result = calculateStockSpan(prices, length, &spans, errBuf, ERR_BUF_SIZE);
  
  if (result != 0) {
    ThrowCError(env, result, errBuf);
    return env.Null();
  }
  
  // Copy result to JS Int32Array
  Napi::Int32Array outputArray = Napi::Int32Array::New(env, length);
  int32_t* outputData = reinterpret_cast<int32_t*>(outputArray.ArrayBuffer().Data());
  outputData += outputArray.ByteOffset() / sizeof(int32_t);
  
  for (size_t i = 0; i < length; i++) {
    outputData[i] = spans[i];
  }
  
  // Free C allocation
  free(spans);
  
  return outputArray;
}

/**
 * Wrapper: buildSegmentTree
 * Input: Float64Array prices
 * Output: Number (opaque handle as external)
 */
Napi::Value BuildSegmentTree(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsTypedArray()) {
    Napi::TypeError::New(env, "Expected Float64Array as first argument").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Float64Array inputArray = info[0].As<Napi::Float64Array>();
  size_t length = inputArray.ElementLength();
  
  if (length == 0) {
    Napi::TypeError::New(env, "Input array cannot be empty").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  double* prices = reinterpret_cast<double*>(inputArray.ArrayBuffer().Data());
  prices += inputArray.ByteOffset() / sizeof(double);
  
  void* treeHandle = nullptr;
  char errBuf[ERR_BUF_SIZE] = {0};
  
  int result = buildSegmentTree(prices, length, &treeHandle, errBuf, ERR_BUF_SIZE);
  
  if (result != 0) {
    ThrowCError(env, result, errBuf);
    return env.Null();
  }
  
  // Return handle as external (wrapped pointer)
  return Napi::External<void>::New(env, treeHandle);
}

/**
 * Wrapper: querySegmentTree
 * Input: External handle, number ql, number qr
 * Output: Object {min, max, avg, variance}
 */
Napi::Value QuerySegmentTree(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3 || !info[0].IsExternal() || !info[1].IsNumber() || !info[2].IsNumber()) {
    Napi::TypeError::New(env, "Expected (External, Number, Number)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  void* treeHandle = info[0].As<Napi::External<void>>().Data();
  size_t ql = info[1].As<Napi::Number>().Uint32Value();
  size_t qr = info[2].As<Napi::Number>().Uint32Value();
  
  double min, max, avg, variance;
  char errBuf[ERR_BUF_SIZE] = {0};
  
  int result = querySegmentTree(treeHandle, ql, qr, &min, &max, &avg, &variance, errBuf, ERR_BUF_SIZE);
  
  if (result != 0) {
    ThrowCError(env, result, errBuf);
    return env.Null();
  }
  
  Napi::Object resultObj = Napi::Object::New(env);
  resultObj.Set("min", Napi::Number::New(env, min));
  resultObj.Set("max", Napi::Number::New(env, max));
  resultObj.Set("avg", Napi::Number::New(env, avg));
  resultObj.Set("variance", Napi::Number::New(env, variance));
  
  return resultObj;
}

/**
 * Wrapper: freeSegmentTree
 * Input: External handle
 * Output: undefined
 */
Napi::Value FreeSegmentTree(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsExternal()) {
    Napi::TypeError::New(env, "Expected External handle").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  void* treeHandle = info[0].As<Napi::External<void>>().Data();
  freeSegmentTree(treeHandle);
  
  return env.Undefined();
}

/**
 * Wrapper: analyzeSlidingWindow
 * Input: Float64Array prices, Number windowSize
 * Output: External handle
 */
Napi::Value AnalyzeSlidingWindow(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsTypedArray() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected (Float64Array, Number)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Float64Array inputArray = info[0].As<Napi::Float64Array>();
  size_t length = inputArray.ElementLength();
  size_t windowSize = info[1].As<Napi::Number>().Uint32Value();
  
  if (length == 0 || windowSize == 0) {
    Napi::TypeError::New(env, "Invalid array length or window size").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  double* prices = reinterpret_cast<double*>(inputArray.ArrayBuffer().Data());
  prices += inputArray.ByteOffset() / sizeof(double);
  
  void* windowHandle = nullptr;
  char errBuf[ERR_BUF_SIZE] = {0};
  
  int result = analyzeSlidingWindow(prices, length, windowSize, &windowHandle, errBuf, ERR_BUF_SIZE);
  
  if (result != 0) {
    ThrowCError(env, result, errBuf);
    return env.Null();
  }
  
  return Napi::External<void>::New(env, windowHandle);
}

/**
 * Wrapper: getWindowResult
 * Input: External handle, Number idx
 * Output: Object {max, min, avg, pattern}
 */
Napi::Value GetWindowResult(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsExternal() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected (External, Number)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  void* windowHandle = info[0].As<Napi::External<void>>().Data();
  size_t idx = info[1].As<Napi::Number>().Uint32Value();
  
  double max, min, avg;
  char pattern[64] = {0};
  char errBuf[ERR_BUF_SIZE] = {0};
  
  int result = getWindowResult(windowHandle, idx, &max, &min, &avg, pattern, sizeof(pattern), errBuf, ERR_BUF_SIZE);
  
  if (result != 0) {
    ThrowCError(env, result, errBuf);
    return env.Null();
  }
  
  Napi::Object resultObj = Napi::Object::New(env);
  resultObj.Set("max", Napi::Number::New(env, max));
  resultObj.Set("min", Napi::Number::New(env, min));
  resultObj.Set("avg", Napi::Number::New(env, avg));
  resultObj.Set("pattern", Napi::String::New(env, pattern));
  
  return resultObj;
}

/**
 * Wrapper: freeWindowResult
 * Input: External handle
 * Output: undefined
 */
Napi::Value FreeWindowResult(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsExternal()) {
    Napi::TypeError::New(env, "Expected External handle").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  void* windowHandle = info[0].As<Napi::External<void>>().Data();
  freeWindowResult(windowHandle);
  
  return env.Undefined();
}

/**
 * Module initialization
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("calculateStockSpan", Napi::Function::New(env, CalculateStockSpan));
  exports.Set("buildSegmentTree", Napi::Function::New(env, BuildSegmentTree));
  exports.Set("querySegmentTree", Napi::Function::New(env, QuerySegmentTree));
  exports.Set("freeSegmentTree", Napi::Function::New(env, FreeSegmentTree));
  exports.Set("analyzeSlidingWindow", Napi::Function::New(env, AnalyzeSlidingWindow));
  exports.Set("getWindowResult", Napi::Function::New(env, GetWindowResult));
  exports.Set("freeWindowResult", Napi::Function::New(env, FreeWindowResult));
  
  return exports;
}

NODE_API_MODULE(dsa_native, Init)
