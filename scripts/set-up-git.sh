#!/bin/bash

set -euo pipefail

git clone "https://gerrit.wikimedia.org/r/wikidata/query/gui-deploy" ./build
git -C ./build \
	remote set-url --push origin \
	ssh://wdqsguibuilder@gerrit.wikimedia.org:29418/wikidata/query/gui-deploy
curl -Lo ./build/.git/hooks/commit-msg https://gerrit.wikimedia.org/r/tools/hooks/commit-msg
chmod +x ./build/.git/hooks/commit-msg
# Empty the build dir (excluding sites, .git, and BC for config), preparing for the new build
find ./build/ -maxdepth 1 \
	! -wholename "./build/" \
	! -wholename "./build/sites" \
	! -wholename "./#!build/custom-config.json" \
	! -wholename "./build/.git*" \
	-exec rm -r {} +
