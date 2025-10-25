#!/bin/bash

# verify_no_sample_data.sh
# Searches repository for potential sample/fake data violations
# Does NOT delete anything - only reports findings for manual review

set -e

REPORT_FILE="verify_report.txt"
VIOLATION_COUNT=0

echo "================================================" > "$REPORT_FILE"
echo "Dynamic Stock Analyzer - Sample Data Verification" >> "$REPORT_FILE"
echo "Executed: $(date)" >> "$REPORT_FILE"
echo "================================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to search and report
search_pattern() {
    local pattern="$1"
    local description="$2"
    local exclude_dirs="node_modules|\.git|dist|build|coverage|cache|logs|\.github"
    
    echo "Checking: $description" >> "$REPORT_FILE"
    
    # Use grep with line numbers, exclude binary files and specified directories
    matches=$(grep -rn --exclude-dir={node_modules,.git,dist,build,coverage,cache,logs,.github} \
              --exclude="*.lock" \
              --exclude="*.json.map" \
              --exclude="verify_report.txt" \
              -I "$pattern" . 2>/dev/null || true)
    
    if [ -n "$matches" ]; then
        echo "  ⚠️  POTENTIAL VIOLATIONS FOUND:" >> "$REPORT_FILE"
        echo "$matches" | head -20 >> "$REPORT_FILE"
        if [ $(echo "$matches" | wc -l) -gt 20 ]; then
            echo "  ... and $(($(echo "$matches" | wc -l) - 20)) more matches" >> "$REPORT_FILE"
        fi
        VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
        echo "" >> "$REPORT_FILE"
    else
        echo "  ✓ No violations found" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
}

# Check for common sample data indicators
echo "=== Checking for Sample/Fake Data Keywords ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Keywords that might indicate sample data
search_pattern "dummy" "Dummy data keyword"
search_pattern "sample.*data" "Sample data keyword"
search_pattern "example.*data" "Example data keyword"
search_pattern "mock.*prices" "Mock prices keyword"
search_pattern "fake.*data" "Fake data keyword"
search_pattern "test.*data.*=" "Test data assignments"

# Check for hardcoded stock symbols with prices (common pattern)
echo "=== Checking for Hardcoded Stock Data ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

search_pattern "AAPL.*:.*[0-9]{2,}" "AAPL with numeric data"
search_pattern "GOOGL.*:.*[0-9]{2,}" "GOOGL with numeric data"
search_pattern "MSFT.*:.*[0-9]{2,}" "MSFT with numeric data"
search_pattern "TSLA.*:.*[0-9]{2,}" "TSLA with numeric data"
search_pattern "RELIANCE.*:.*[0-9]{2,}" "RELIANCE with numeric data"

# Check for hardcoded OHLC data structures
search_pattern "open.*:.*[0-9]+.*close.*:.*[0-9]+" "OHLC data structures"
search_pattern "\{.*price.*:.*[0-9]{2,}.*\}" "Price object literals"

# Check for arrays of prices
search_pattern "\[[0-9]+,\s*[0-9]+,\s*[0-9]+,\s*[0-9]+,\s*[0-9]+" "Price arrays (5+ numbers)"

# Check for CSV data embedded in code
search_pattern "date,open,high,low,close" "CSV headers in code"
search_pattern "[0-9]{4}-[0-9]{2}-[0-9]{2},[0-9]+\.[0-9]+,[0-9]+\.[0-9]+" "CSV data rows"

# Check for JSON with market data
search_pattern '"symbol".*:.*".*".*"price".*:.*[0-9]+' "JSON symbol+price objects"

# Check test files specifically
echo "=== Checking Test Files ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

test_files=$(find . -path "*/node_modules" -prune -o -name "*.test.*" -type f -print 2>/dev/null || true)
if [ -n "$test_files" ]; then
    echo "Test files found (manual review recommended):" >> "$REPORT_FILE"
    echo "$test_files" | while read -r file; do
        # Check if test file contains numeric data that might be market data
        if grep -q "\[[0-9][0-9.,:]*\]" "$file" 2>/dev/null; then
            echo "  ⚠️  $file - contains numeric arrays" >> "$REPORT_FILE"
            VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
        else
            echo "  ✓ $file - appears clean" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
fi

# Check for embedded CSV files
echo "=== Checking for CSV Files ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

csv_files=$(find . -path "*/node_modules" -prune -o -path "*/.git" -prune -o -name "*.csv" -type f -print 2>/dev/null || true)
if [ -n "$csv_files" ]; then
    echo "  ⚠️  VIOLATION: CSV files found in repository:" >> "$REPORT_FILE"
    echo "$csv_files" >> "$REPORT_FILE"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    echo "" >> "$REPORT_FILE"
else
    echo "  ✓ No CSV files found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Check for example environment files with values
echo "=== Checking Environment Files ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

env_example_files=$(find . -name ".env.example" -type f 2>/dev/null || true)
if [ -n "$env_example_files" ]; then
    echo "$env_example_files" | while read -r file; do
        # Check for lines with = followed by actual values (not empty or comments)
        violations=$(grep -n "^[A-Z_]*=.." "$file" 2>/dev/null || true)
        if [ -n "$violations" ]; then
            echo "  ⚠️  $file contains values:" >> "$REPORT_FILE"
            echo "$violations" >> "$REPORT_FILE"
            VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
        else
            echo "  ✓ $file - variable names only" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
fi

# Check documentation for embedded responses
echo "=== Checking Documentation ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

readme_files=$(find . -path "*/node_modules" -prune -o -name "README*.md" -o -name "*.md" -type f -print 2>/dev/null || true)
if [ -n "$readme_files" ]; then
    echo "$readme_files" | while read -r file; do
        # Check for JSON blocks with price data
        if grep -q '\`\`\`json.*"price".*:.*[0-9]' "$file" 2>/dev/null; then
            echo "  ⚠️  $file - contains JSON with price data" >> "$REPORT_FILE"
            VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
        else
            echo "  ✓ $file - no sample responses" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
fi

# Check for common test data file names
echo "=== Checking for Test Data Files ===" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

test_data_files=$(find . -path "*/node_modules" -prune -o -path "*/.git" -prune -o \
    \( -name "*sample*" -o -name "*dummy*" -o -name "*fixture*" -o -name "*mock*" \) \
    -type f -print 2>/dev/null | grep -v ".test." | grep -v "node_modules" || true)

if [ -n "$test_data_files" ]; then
    echo "  ⚠️  Files with sample/mock naming found (review required):" >> "$REPORT_FILE"
    echo "$test_data_files" >> "$REPORT_FILE"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    echo "" >> "$REPORT_FILE"
else
    echo "  ✓ No suspicious file names found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Final summary
echo "================================================" >> "$REPORT_FILE"
echo "VERIFICATION SUMMARY" >> "$REPORT_FILE"
echo "================================================" >> "$REPORT_FILE"

if [ $VIOLATION_COUNT -eq 0 ]; then
    echo "✅ PASSED: No sample data violations detected" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Repository appears clean of hardcoded market data." >> "$REPORT_FILE"
    exit_code=0
else
    echo "⚠️  REVIEW REQUIRED: $VIOLATION_COUNT potential violations found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Manual review required for flagged items." >> "$REPORT_FILE"
    echo "Violations may be false positives (e.g., documentation examples)." >> "$REPORT_FILE"
    echo "Ensure no actual market data is embedded in repository." >> "$REPORT_FILE"
    exit_code=1
fi

echo "" >> "$REPORT_FILE"
echo "Report saved to: $REPORT_FILE" >> "$REPORT_FILE"

# Output to console
cat "$REPORT_FILE"

exit $exit_code
