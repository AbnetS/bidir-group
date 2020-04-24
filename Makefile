TEST = test/*.js

build-docs:
	npm run docs

serve:
	npm start

test:
	npm run test

build-container:
	bash ./build.sh

migrate-data:
	node _migrate/index.js

.PHONY: test serve build-docs
