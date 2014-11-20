COMPILER=~/closure-compiler/compiler.jar

rm -rf output/*

mkdir -p output/js

echo "Compiling"
java -jar $COMPILER \
        --js='deps/js/closure-library/closure/goog/**.js' \
        --js='deps/js/elih/**.js' \
        --closure_entry_point elih.util \
         --closure_entry_point elih.math \
         --closure_entry_point goog.dom.ViewportSizeMonitor \
        --compilation_level SIMPLE \
         --only_closure_dependencies \
        > output/js/deps.js

cat js/d3.v3.min.js >> output/js/deps.js
cat js/crossfilter.v1.min.js >> output/js/deps.js

cp js/constants.js output/js/constants.js
cp js/main.js output/js/main.js
cp js/charts.js output/js/charts.js


cp index.html output/index.html
sed -i '' 's/\<script src="deps\/js\/closure-library\/closure\/goog\/base.js"\>\<\/script\>//g' output/index.html

cp -r css output/
cp -r data output/
cp -r images output/

for file in output/js/*; do gzip "$file"; done
for file in output/js/*; do mv "$file" "${file/.gz/}"; done
for file in output/data/*; do gzip "$file"; done
for file in output/data/*; do mv "$file" "${file/.gz/}"; done
for file in output/css/*; do gzip "$file"; done
for file in output/css/*; do mv "$file" "${file/.gz/}"; done


echo "Done"

