BIN = ./node_modules/.bin/
SRC = $(shell find lib -name "*.js")
BUILD = $(subst lib,build,$(SRC))

build:
	@mkdir -p build/remotes
	@$(MAKE) $(BUILD)

build/%.js: lib/%.js
	@$(BIN)regenerator --include-runtime $< > $@

clean:
	@rm -rf build

test tests:
	@$(BIN)mocha \
		--require should \
		--reporter spec \
		--harmony-generators \
		--bail

.PHONY: test tests build clean