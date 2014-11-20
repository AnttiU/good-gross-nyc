
aws s3 cp output/ s3://elih.co/good-gross-nyc --recursive --exclude "data/*" --exclude "js/*" --exclude "css/*"
aws s3 cp --content-encoding "gzip" output/js s3://elih.co/good-gross-nyc/js --recursive
aws s3 cp --content-encoding "gzip" output/data s3://elih.co/good-gross-nyc/data --recursive
aws s3 cp --content-encoding "gzip" output/css s3://elih.co/good-gross-nyc/css --recursive