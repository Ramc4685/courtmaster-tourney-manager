#!/bin/bash

# Coverage Baseline Analysis Script
# Generates baseline coverage report and identifies files below 40% coverage

set -e

echo "🔍 Running baseline coverage analysis..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create docs directory if it doesn't exist
mkdir -p docs

# Run coverage analysis
echo "📊 Generating coverage report..."
npm run test:coverage

# Check if coverage directory exists
if [ ! -d "coverage" ]; then
    echo "❌ Coverage directory not found. Make sure tests ran successfully."
    exit 1
fi

# Extract coverage data from HTML report
COVERAGE_HTML="coverage/index.html"
if [ ! -f "$COVERAGE_HTML" ]; then
    echo "❌ Coverage HTML report not found at $COVERAGE_HTML"
    exit 1
fi

# Create baseline report
BASELINE_REPORT="docs/test-coverage-baseline.md"
echo "📝 Creating baseline report at $BASELINE_REPORT..."

cat > "$BASELINE_REPORT" << 'EOF'
# Test Coverage Baseline Report

Generated on: $(date)

## Overview

This report identifies files with coverage below 40% that should be prioritized for testing to achieve the 80% coverage goal.

## Coverage Summary

### Critical Files (< 40% Coverage)

The following files require immediate attention to improve test coverage:

EOF

# Parse coverage data and identify low coverage files
echo "🔍 Analyzing coverage data..."

# Create temporary file for low coverage files
LOW_COVERAGE_FILES=$(mktemp)

# Extract coverage percentages from JSON report if available
if [ -f "coverage/coverage-summary.json" ]; then
    echo "📊 Using JSON coverage report for analysis..."
    
    # Parse JSON and find files with low coverage
    node -e "
    const fs = require('fs');
    const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
    
    const lowCoverageFiles = [];
    
    Object.entries(coverage).forEach(([file, data]) => {
        if (file === 'total') return;
        
        const lines = data.lines?.pct || 0;
        const branches = data.branches?.pct || 0;
        const functions = data.functions?.pct || 0;
        const statements = data.statements?.pct || 0;
        
        const avgCoverage = (lines + branches + functions + statements) / 4;
        
        if (avgCoverage < 40) {
            lowCoverageFiles.push({
                file: file.replace(process.cwd() + '/', ''),
                lines,
                branches,
                functions,
                statements,
                average: Math.round(avgCoverage * 100) / 100
            });
        }
    });
    
    // Sort by average coverage (lowest first)
    lowCoverageFiles.sort((a, b) => a.average - b.average);
    
    console.log('LOW_COVERAGE_COUNT=' + lowCoverageFiles.length);
    
    lowCoverageFiles.forEach(file => {
        console.log(\`| \${file.file} | \${file.lines}% | \${file.branches}% | \${file.functions}% | \${file.statements}% | \${file.average}% |\`);
    });
    " > "$LOW_COVERAGE_FILES"
    
    # Extract the count
    LOW_COVERAGE_COUNT=$(grep "LOW_COVERAGE_COUNT=" "$LOW_COVERAGE_FILES" | cut -d'=' -f2)
    
    # Add table to report
    cat >> "$BASELINE_REPORT" << EOF

| File | Lines | Branches | Functions | Statements | Average |
|------|-------|----------|-----------|------------|---------|
EOF
    
    # Add low coverage files (excluding the count line)
    grep -v "LOW_COVERAGE_COUNT=" "$LOW_COVERAGE_FILES" >> "$BASELINE_REPORT"
    
else
    echo "⚠️  JSON coverage report not found, using basic analysis..."
    LOW_COVERAGE_COUNT="Unknown"
    
    cat >> "$BASELINE_REPORT" << EOF

*Note: Detailed coverage analysis requires JSON report. Run \`npm run test:coverage\` to generate detailed metrics.*

EOF
fi

# Add testing priorities section
cat >> "$BASELINE_REPORT" << EOF

## Testing Priorities

### High Priority (Immediate Action Required)

1. **Sport Rules & Scoring Logic**
   - \`src/services/rules/\` - Core business logic for tournament scoring
   - \`src/utils/scoringRules.ts\` - Scoring validation and calculations
   - \`src/services/tournament/formats/\` - Tournament bracket generation

2. **Service Layer**
   - \`src/services/tournament/TournamentService.ts\` - Tournament management
   - \`src/services/\` - Core business services

3. **Utility Functions**
   - \`src/utils/tournamentUtils.ts\` - Tournament helper functions
   - \`src/utils/\` - General utility functions

### Medium Priority

1. **UI Components**
   - \`src/components/scoring/\` - Scoring interface components
   - \`src/components/tournament/\` - Tournament management UI

2. **Integration Workflows**
   - End-to-end tournament creation and scoring
   - Multi-sport tournament scenarios

### Testing Strategy

- **Unit Tests (70%)**: Focus on business logic, rules, and utilities
- **Integration Tests (20%)**: Test complete workflows and service interactions
- **Component Tests (10%)**: Test UI behavior and user interactions

### Coverage Goals

- **Target**: 80% overall coverage
- **Minimum per file**: 60% for critical business logic
- **Timeline**: Achieve target within current development cycle

## Next Steps

1. Run \`npm run test:coverage\` to get current baseline
2. Focus on high-priority files first
3. Create unit tests for sport rules and scoring logic
4. Add integration tests for tournament workflows
5. Monitor coverage improvements with each test addition

## Commands

\`\`\`bash
# Run all tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test pattern
npm run test -- --run src/test/unit/rules

# Generate coverage report only
npm run test:coverage -- --reporter=html
\`\`\`

---

*Report generated by \`scripts/coverage-baseline.sh\`*
*Last updated: $(date)*
EOF

# Clean up temporary file
rm -f "$LOW_COVERAGE_FILES"

echo ""
echo -e "${GREEN}✅ Baseline coverage report generated!${NC}"
echo -e "${BLUE}📄 Report saved to: $BASELINE_REPORT${NC}"

if [ "$LOW_COVERAGE_COUNT" != "Unknown" ]; then
    echo -e "${YELLOW}📊 Found $LOW_COVERAGE_COUNT files with coverage below 40%${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Next steps:${NC}"
echo "1. Review the baseline report: $BASELINE_REPORT"
echo "2. Start with high-priority files (sport rules, scoring logic)"
echo "3. Run 'npm run test:coverage' to track progress"
echo "4. Focus on achieving 80% overall coverage"

echo ""
echo -e "${GREEN}🚀 Ready to start comprehensive testing!${NC}"
