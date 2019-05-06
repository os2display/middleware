#!/bin/bash

echo 'npm audit packages...'
echo '---------------------'
echo ''

# Install main modules
npm audit

# Install plugin dependencies.
for folder in plugins/*; do
  if [ -d $folder ]; then
    cd $folder

    echo '------------------------------------------'
    echo ''
    echo $folder

    npm audit
    cd ../..
  fi
done
