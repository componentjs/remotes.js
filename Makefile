BIN = ./node_modules/.bin/
SRC = $(shell find lib/*.js)
BUILD = $(subst lib,build,$(SRC))

build:
	@mkdir -p build
	@$(MAKE) $(BUILD)

build/%.js: lib/%.js
	@$(BIN)regenerator --include-runtime $< > $@

test tests:
	@$(BIN)mocha \
		--require should \
		--reporter spec \
		--harmony-generators \
		--bail

.PHONY: test tests