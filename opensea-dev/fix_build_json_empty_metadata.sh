#!/bin/bash

directory="./build/contracts" # Specify the directory to search
substring_to_replace='"metadata": "",' # Specify the substring to replace
replacement='' # Specify the replacement text

# Function to replace the substring in a file
replace_substring_in_file() {
  local file="$1"
  temp_file=$(mktemp)
  sed "s/$substring_to_replace/$replacement/g" "$file" > "$temp_file"
  cat "$temp_file" > "$file"
  rm "$temp_file"
}

# Function to process a directory recursively
process_directory() {
  local dir="$1"
  find "$dir" -type f -print0 | while IFS= read -r -d $'\0' file; do
    replace_substring_in_file "$file"
    echo "Replaced '$substring_to_replace' with '$replacement' in file: $file"
  done
}

process_directory "$directory"
