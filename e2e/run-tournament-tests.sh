#!/bin/bash

# CourtMaster Tournament Management E2E Test Runner
# Comprehensive test suite covering complete tournament lifecycle

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TIMEOUT=300000  # 5 minutes per test
RETRIES=2
PARALLEL_WORKERS=1  # Run sequentially for data integrity

echo -e "${BLUE}🏆 CourtMaster Tournament Management E2E Test Suite${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# Function to run a test file with error handling
run_test() {
    local test_file=$1
    local test_name=$2

    echo -e "${YELLOW}🧪 Running ${test_name}...${NC}"

    if npx playwright test "${test_file}" \
        --timeout="${TIMEOUT}" \
        --retries="${RETRIES}" \
        --workers="${PARALLEL_WORKERS}" \
        --reporter=line; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        return 1
    fi
}

# Function to run test suites
run_test_suite() {
    local suite_name=$1
    shift
    local tests=("$@")

    echo -e "${BLUE}📋 ${suite_name}${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"

    local passed=0
    local failed=0

    for test in "${tests[@]}"; do
        local test_file="e2e/tests/${test}"
        local test_name=$(basename "${test}" .spec.ts)

        if run_test "${test_file}" "${test_name}"; then
            ((passed++))
        else
            ((failed++))
        fi
        echo ""
    done

    echo -e "${BLUE}📊 ${suite_name} Results: ${GREEN}${passed} passed${NC}, ${RED}${failed} failed${NC}"
    echo ""

    return $failed
}

# Check if application is running
echo -e "${YELLOW}🔍 Checking application status...${NC}"
if curl -f http://localhost:3000/health >/dev/null 2>&1 || curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is running${NC}"
else
    echo -e "${YELLOW}⚠️  Application not detected. Starting development server...${NC}"
    npm run dev &
    DEV_PID=$!

    # Wait for application to start
    echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Application started successfully${NC}"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Application failed to start${NC}"
            exit 1
        fi
    done
fi

echo ""

# Parse command line arguments
RUN_ALL=true
RUN_WORKFLOW=false
RUN_INDIVIDUAL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --workflow-only)
            RUN_ALL=false
            RUN_WORKFLOW=true
            shift
            ;;
        --individual-only)
            RUN_ALL=false
            RUN_INDIVIDUAL=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --workflow-only     Run only the complete workflow test"
            echo "  --individual-only   Run only individual module tests"
            echo "  --help             Show this help message"
            echo ""
            echo "Default: Run all tests"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Track overall results
TOTAL_PASSED=0
TOTAL_FAILED=0

# Run Complete Workflow Test (Comprehensive End-to-End)
if [[ "$RUN_ALL" == true || "$RUN_WORKFLOW" == true ]]; then
    echo -e "${BLUE}🚀 COMPLETE TOURNAMENT WORKFLOW TESTS${NC}"
    echo -e "${BLUE}====================================${NC}"

    workflow_tests=(
        "00-complete-workflow.spec.ts"
    )

    if run_test_suite "Complete Workflow Tests" "${workflow_tests[@]}"; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
fi

# Run Individual Module Tests
if [[ "$RUN_ALL" == true || "$RUN_INDIVIDUAL" == true ]]; then
    # 1. Tournament Creation Tests
    creation_tests=(
        "01-tournament-creation.spec.ts"
    )

    if run_test_suite "Tournament Creation Module" "${creation_tests[@]}"; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi

    # 2. Player Management Tests
    player_tests=(
        "02-player-management.spec.ts"
    )

    if run_test_suite "Player Management Module" "${player_tests[@]}"; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi

    # 3. Court Assignment Tests
    court_tests=(
        "03-court-assignment.spec.ts"
    )

    if run_test_suite "Court Assignment Module" "${court_tests[@]}"; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi

    # 4. Scheduling Tests
    scheduling_tests=(
        "04-scheduling.spec.ts"
    )

    if run_test_suite "Scheduling Module" "${scheduling_tests[@]}"; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi

    # 5. Scoring Tests
    scoring_tests=(
        "05-scoring.spec.ts"
    )

    if run_test_suite "Scoring Module" "${scoring_tests[@]}"; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi

    # 6. Tournament Completion Tests
    completion_tests=(
        "06-tournament-completion.spec.ts"
    )

    if run_test_suite "Tournament Completion Module" "${completion_tests[@]}"; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
fi

# Final Results Summary
echo -e "${BLUE}🏁 FINAL TEST RESULTS${NC}"
echo -e "${BLUE}====================${NC}"
echo -e "${GREEN}✅ Test Suites Passed: ${TOTAL_PASSED}${NC}"
echo -e "${RED}❌ Test Suites Failed: ${TOTAL_FAILED}${NC}"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Tournament management system is fully functional.${NC}"
    echo ""
    echo -e "${GREEN}✅ Verified Functionality:${NC}"
    echo -e "${GREEN}   • Tournament Creation Wizard${NC}"
    echo -e "${GREEN}   • Player/Team Registration${NC}"
    echo -e "${GREEN}   • Court Management${NC}"
    echo -e "${GREEN}   • Match Scheduling${NC}"
    echo -e "${GREEN}   • Score Entry & Validation${NC}"
    echo -e "${GREEN}   • Tournament Progression${NC}"
    echo -e "${GREEN}   • Results & Completion${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the detailed output above.${NC}"
    echo ""
    echo -e "${YELLOW}📝 Troubleshooting Tips:${NC}"
    echo -e "${YELLOW}   • Check application is running on http://localhost:3000${NC}"
    echo -e "${YELLOW}   • Verify demo credentials work: demoadmin@example.com / demopassword${NC}"
    echo -e "${YELLOW}   • Ensure database/mock services are configured${NC}"
    echo -e "${YELLOW}   • Check browser console for JavaScript errors${NC}"
    echo ""
    exit 1
fi

# Cleanup
if [ ! -z "$DEV_PID" ]; then
    echo -e "${YELLOW}🧹 Stopping development server...${NC}"
    kill $DEV_PID 2>/dev/null || true
fi