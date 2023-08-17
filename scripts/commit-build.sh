#!/bin/bash

set -euo pipefail

export GIT_AUTHOR_NAME=WDQSGuiBuilder
export GIT_COMMITTER_NAME=WDQSGuiBuilder
export GIT_AUTHOR_EMAIL=wdqs-gui-build@lists.wikimedia.org
export GIT_COMMITTER_EMAIL=wdqs-gui-build@lists.wikimedia.org
# Make a commit (to be pushed to Gerrit by the Jenkins job)
lastrev=$(git rev-parse HEAD)
message=$(git log -1 --pretty=%B | grep -v Change-Id)
git -C ./build add -A
git -C ./build \
	-c user.name="WDQSGuiBuilder" \
	-c user.email="wdqs-gui-build@lists.wikimedia.org" \
	commit \
		-m "Merging from ${lastrev}" \
		-m "${message}"
