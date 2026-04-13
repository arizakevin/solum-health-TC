#!/usr/bin/env bash

# This script generates PNG and JPG versions of the PDF sample documents
# to test extraction accuracy across different formats.

echo "Generating diverse formats from sample documents using ImageMagick..."

mkdir -p sample-documents/formats

# Find all PDFs in sample-documents (excluding the newly created formats directory)
count=0
for file in sample-documents/*.pdf; do
  if [ ! -f "$file" ]; then continue; fi

  name=$(basename "$file" .pdf)
  echo "Converting $name..."

  # Convert the first page to PNG
  sips -s format png "$file" -Z 2048 --out "sample-documents/formats/$name.png"
  
  # Convert the first page to JPG
  sips -s format jpeg -s formatOptions 85 "$file" -Z 2048 --out "sample-documents/formats/$name.jpg"
  
  count=$((count + 1))
done

echo "Successfully converted $count documents into sample-documents/formats/"
