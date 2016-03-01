#include <node.h>

namespace demo{
  using v8::FunctionCallbackInfo;
  using v8::Isolate;
  using v8::Local;
  using v8::Object;
  using v8::String;
  using v8::Value;

  void Method(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    args.GetReturnValue().Set(String::NewFromUtf8(isolate, "Hello world from demo"));
  }

  // All Node.js Addons must export an initialization function with
  // the pattern
  void initDemo(Local<Object> exports) {
    NODE_SET_METHOD(exports, "demo", Method);
  }
  NODE_MODULE(demo, initDemo)

}
