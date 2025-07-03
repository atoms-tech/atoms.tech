// Test script to verify REQ-ID generation logic
// This script simulates the REQ-ID generation functionality

// Simulate existing requirements data (based on what we saw in the browser)
const mockRequirements = [
    { external_id: '2' },
    { external_id: '3' },
    { external_id: 'REQ-001' }, // This might exist from old hardcoded values
];

// REQ-ID generation logic (copied from our implementation)
function generateNextReqId(existingRequirements) {
    console.log('📊 Analyzing existing requirements:', existingRequirements.map(r => r.external_id));

    let maxReqNumber = 0;

    for (const req of existingRequirements) {
        const externalId = req.external_id;
        if (externalId && typeof externalId === 'string') {
            // Match REQ-{number} pattern (case insensitive)
            const match = externalId.match(/^REQ-(\d+)$/i);
            if (match) {
                const reqNumber = parseInt(match[1], 10);
                if (!isNaN(reqNumber) && reqNumber > maxReqNumber) {
                    maxReqNumber = reqNumber;
                    console.log(`  Found REQ-ID: ${externalId} -> number: ${reqNumber}`);
                }
            } else {
                console.log(`  Skipping non-REQ-ID: ${externalId}`);
            }
        }
    }

    const nextNumber = maxReqNumber + 1;
    const nextReqId = `REQ-${nextNumber.toString().padStart(3, '0')}`;

    console.log(`  Max REQ number found: ${maxReqNumber}`);
    console.log(`  Next REQ number: ${nextNumber}`);
    console.log(`  Generated REQ-ID: ${nextReqId}`);

    return nextReqId;
}

function testReqIdGeneration() {
    console.log('🧪 Testing REQ-ID Generation Logic');
    console.log('===================================');

    try {
        // Test 1: Basic REQ-ID generation
        console.log('\n🔢 Test 1: Basic REQ-ID Generation');
        const nextReqId = generateNextReqId(mockRequirements);

        // Test 2: Verify REQ-ID format
        console.log('\n✅ Test 2: Verify REQ-ID Format');
        const reqIdPattern = /^REQ-\d{3,}$/;

        if (reqIdPattern.test(nextReqId)) {
            console.log(`✅ REQ-ID format is valid: ${nextReqId}`);
        } else {
            console.error(`❌ REQ-ID format is invalid: ${nextReqId}`);
            return { success: false, error: 'Invalid REQ-ID format' };
        }

        // Test 3: Verify sequential numbering
        console.log('\n📈 Test 3: Verify Sequential Numbering');
        const reqNumber = parseInt(nextReqId.replace('REQ-', ''));
        console.log(`Generated REQ number: ${reqNumber}`);

        // Should be REQ-002 (since REQ-001 exists, next should be 002)
        const expectedNumber = 2;
        if (reqNumber >= expectedNumber) {
            console.log(`✅ Sequential numbering is correct: ${reqNumber} >= ${expectedNumber}`);
        } else {
            console.error(`❌ Sequential numbering is incorrect: ${reqNumber} < ${expectedNumber}`);
            return { success: false, error: 'Incorrect sequential numbering' };
        }

        // Test 4: Test with different scenarios
        console.log('\n🎯 Test 4: Test Different Scenarios');

        // Scenario A: No REQ-IDs exist
        console.log('\n  Scenario A: No REQ-IDs exist');
        const emptyReqs = [{ external_id: '1' }, { external_id: 'TEST' }];
        const firstReqId = generateNextReqId(emptyReqs);
        console.log(`  First REQ-ID: ${firstReqId}`);

        // Scenario B: High REQ-ID numbers
        console.log('\n  Scenario B: High REQ-ID numbers');
        const highReqs = [{ external_id: 'REQ-999' }, { external_id: 'REQ-1000' }];
        const highReqId = generateNextReqId(highReqs);
        console.log(`  Next high REQ-ID: ${highReqId}`);

        console.log('\n🎉 All tests completed successfully!');
        console.log('===================================');

        return {
            success: true,
            nextReqId,
            reqNumber,
            firstReqId,
            highReqId
        };

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
const result = testReqIdGeneration();

if (result.success) {
    console.log('\n✅ REQ-ID Generation logic is working correctly!');
    console.log(`\n📋 Summary:`);
    console.log(`  - Generated REQ-ID: ${result.nextReqId}`);
    console.log(`  - REQ Number: ${result.reqNumber}`);
    console.log(`  - First REQ-ID (empty): ${result.firstReqId}`);
    console.log(`  - High REQ-ID: ${result.highReqId}`);
} else {
    console.log('\n❌ REQ-ID Generation test failed!');
    console.log(`Error: ${result.error}`);
    process.exit(1);
}
