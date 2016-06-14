#!/bin/bash
GERRIT=gerrit.wikimedia.org
REPO=wikidata/query/gui-deploy
DEPLOY_REPO=https://$GERRIT/r/$REPO
BRANCH=production
set -e
cd `dirname $0`/..
git remote update
git pull
lastrev=$(git rev-parse HEAD)
message=$(git log -1 --pretty=%B)
newmessage=$(cat <<END
Merging from $lastrev:

$message
END
)
#echo "$newmessage"
rm -fr dist dist-production
npm install
grunt build
git clone --branch $BRANCH --single-branch $DEPLOY_REPO dist-production
# make sure the repo content mirrors the current dist directory
rsync -av --exclude .git --delete dist/ dist-production/
rm -fr dist
# Make new commit
pushd dist-production
git add -A
git commit -m "$newmessage"
cat > .gitreview <<END
[gerrit]
host=$GERRIT
port=29418
project=$REPO.git
defaultbranch=$BRANCH
defaultrebase=0
END
git review
popd
rm -rf dist-production
