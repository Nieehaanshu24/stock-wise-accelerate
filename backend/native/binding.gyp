{
  "targets": [
    {
      "target_name": "dsa_native",
      "sources": [
        "src/native_binding.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "../../c_modules/include"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "libraries": [
        "-L../../c_modules/lib",
        "-ldsa"
      ],
      "conditions": [
        [
          "OS=='mac'",
          {
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "10.15",
              "OTHER_LDFLAGS": [
                "-Wl,-rpath,@loader_path/../../c_modules/lib"
              ]
            }
          }
        ],
        [
          "OS=='linux'",
          {
            "cflags": ["-fexceptions"],
            "cflags_cc": ["-fexceptions"],
            "ldflags": [
              "-Wl,-rpath,'$$ORIGIN/../../c_modules/lib'"
            ]
          }
        ]
      ]
    }
  ]
}
