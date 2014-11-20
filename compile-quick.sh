COMPILER=~/closure-compiler/compiler.jar

mkdir -p output/js

python ~/closure-library/closure/bin/build/depswriter.py  \
            --root_with_prefix="js/ ../../../" \
            --root_with_prefix="deps/js/ ../../../" \
    > js/deps.js

cat js/d3.v3.js >> js/deps.js
cat js/crossfilter.v1.js >> js/deps.js

echo "Done"