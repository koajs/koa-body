TESTS = test.js
REPORTER = spec
TIMEOUT = 2000
MOCHA_OPTS =

clean:
	@sudo rm -rf /tmp/*

test: node_modules
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--harmony-generators \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		$(MOCHA_OPTS) \
		$(TESTS)

start: test
	node --harmony example.js

.PHONY: test start