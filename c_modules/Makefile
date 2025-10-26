# Makefile for Dynamic Stock Analyzer C Modules

CC = gcc
CFLAGS = -Wall -Wextra -O3 -fPIC -std=c11 -Iinclude
LDFLAGS = -shared -lm

# Detect OS
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    SHARED_EXT = dll
    CC = gcc
    LDFLAGS = -shared -lm -Wl,--out-implib,$(LIB_DIR)/libdsa.lib
    RM = del /Q
    MKDIR = if not exist $(subst /,\,$(1)) mkdir $(subst /,\,$(1))
    RMDIR = if exist $(subst /,\,$(1)) rmdir /S /Q $(subst /,\,$(1))
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Darwin)
        DETECTED_OS := macOS
        SHARED_EXT = dylib
        LDFLAGS += -dynamiclib -install_name @rpath/libdsa.$(SHARED_EXT)
    else
        DETECTED_OS := Linux
        SHARED_EXT = so
    endif
    RM = rm -f
    RMDIR = rm -rf
    MKDIR = mkdir -p
endif

# Directories
SRC_DIR = src
INC_DIR = include
OBJ_DIR = obj
LIB_DIR = lib
TEST_DIR = tests

# Source files
SOURCES = $(SRC_DIR)/stock_span.c $(SRC_DIR)/segment_tree.c $(SRC_DIR)/sliding_window.c
OBJECTS = $(SOURCES:$(SRC_DIR)/%.c=$(OBJ_DIR)/%.o)
HEADERS = $(INC_DIR)/stock_span.h $(INC_DIR)/segment_tree.h $(INC_DIR)/sliding_window.h

# Targets
LIB_NAME = libdsa
SHARED_LIB = $(LIB_DIR)/$(LIB_NAME).$(SHARED_EXT)
TEST_HARNESS = $(TEST_DIR)/harness

.PHONY: all clean test install directories

all: directories $(SHARED_LIB)

directories:
	@$(call MKDIR,$(OBJ_DIR))
	@$(call MKDIR,$(LIB_DIR))

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(SHARED_LIB): $(OBJECTS)
	$(CC) $(LDFLAGS) -o $@ $^
	@echo "Built shared library: $(SHARED_LIB) for $(DETECTED_OS)"

# Build test harness
test: directories $(SHARED_LIB)
	$(CC) $(CFLAGS) -L$(LIB_DIR) -o $(TEST_HARNESS) $(TEST_DIR)/harness.c -ldsa -lm
	@echo "Built test harness: $(TEST_HARNESS)"
	@echo "Run with: LD_LIBRARY_PATH=./lib ./$(TEST_HARNESS) <input.csv>"

# Install headers and library (optional)
install: $(SHARED_LIB)
	@echo "Installing to /usr/local/lib and /usr/local/include"
	sudo cp $(SHARED_LIB) /usr/local/lib/
	sudo cp $(HEADERS) /usr/local/include/
	@echo "Installation complete. Run 'sudo ldconfig' on Linux."

clean:
	@$(call RMDIR,$(OBJ_DIR))
	@$(call RMDIR,$(LIB_DIR))
ifeq ($(OS),Windows_NT)
	@if exist $(subst /,\,$(TEST_HARNESS)).exe $(RM) $(subst /,\,$(TEST_HARNESS)).exe
else
	@$(RM) $(TEST_HARNESS)
endif
	@echo "Cleaned build artifacts"

# Help target
help:
	@echo "Dynamic Stock Analyzer - Makefile Targets:"
	@echo "  make all       - Build shared library (libdsa.so or libdsa.dylib)"
	@echo "  make test      - Build test harness"
	@echo "  make clean     - Remove build artifacts"
	@echo "  make install   - Install library and headers system-wide"
	@echo ""
	@echo "Usage after build:"
	@echo "  Linux:   LD_LIBRARY_PATH=./lib ./tests/harness prices.csv"
	@echo "  macOS:   DYLD_LIBRARY_PATH=./lib ./tests/harness prices.csv"
	@echo ""
	@echo "Compile your own programs:"
	@echo "  $(CC) -Iinclude -Llib myprogram.c -ldsa -lm"
