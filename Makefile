BIN = ./node_modules/.bin/
NODE ?= node

test:
	@$(NODE) $(BIN)mocha \
		--timeout 4000 \
		--require should \
		--reporter spec \
		--harmony-generators \
		--bail

.PHONY: test