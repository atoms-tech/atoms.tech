#!/usr/bin/env node

// REQ-ID Generation Demo Script
// This script demonstrates the automatic REQ-ID generation functionality

console.log('🎯 REQ-ID Generation Demo');
console.log('='.repeat(50));

// REQ-ID validation function (copied from implementation)
function isValidReqIdFormat(reqId) {
    return /^REQ-\d{3,}$/.test(reqId);
}

// Generate next REQ-ID (simplified version)
function generateNextReqId(existingIds) {
    const numbers = existingIds
        .map(id => {
            const match = id.match(/^REQ-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);

    let nextNumber = 1;
    if (numbers.length > 0) {
        const maxNumber = Math.max(...numbers);
        nextNumber = maxNumber + 1;
    }

    return `REQ-${nextNumber.toString().padStart(3, '0')}`;
}

// Demo scenarios
console.log('\n📋 1. Format Validation Tests:');
console.log('-'.repeat(30));
const testIds = ['REQ-001', 'REQ-123', 'INVALID', 'REQ-1', 'REQ-12345', 'req-001', 'REQ-ABC'];
testIds.forEach(id => {
    const isValid = isValidReqIdFormat(id);
    console.log(`${isValid ? '✅' : '❌'} "${id}": ${isValid ? 'VALID' : 'INVALID'}`);
});

console.log('\n🔢 2. Sequential Generation:');
console.log('-'.repeat(30));
const mockExistingIds = ['REQ-001', 'REQ-002', 'REQ-005', 'REQ-010'];
console.log(`Existing IDs: ${mockExistingIds.join(', ')}`);
const nextId = generateNextReqId(mockExistingIds);
console.log(`Next generated ID: ${nextId}`);

console.log('\n🕳️ 3. Gap Handling:');
console.log('-'.repeat(30));
const gappedIds = ['REQ-001', 'REQ-003', 'REQ-007'];
console.log(`IDs with gaps: ${gappedIds.join(', ')}`);
const nextGapId = generateNextReqId(gappedIds);
console.log(`Next ID (doesn't fill gaps): ${nextGapId}`);

console.log('\n🔄 4. Sequential Generation Demo:');
console.log('-'.repeat(30));
let currentIds = ['REQ-001', 'REQ-002'];
console.log(`Starting with: ${currentIds.join(', ')}`);
for (let i = 0; i < 5; i++) {
    const newId = generateNextReqId(currentIds);
    currentIds.push(newId);
    console.log(`Generated: ${newId} | Current list: ${currentIds.join(', ')}`);
}

console.log('\n🏗️ 5. Edge Cases:');
console.log('-'.repeat(30));
console.log(`Empty project: ${generateNextReqId([])}`);
console.log(`Single item: ${generateNextReqId(['REQ-005'])}`);
console.log(`Large numbers: ${generateNextReqId(['REQ-999'])}`);

console.log('\n✨ 6. Implementation Features:');
console.log('-'.repeat(30));
console.log('• Automatic REQ-ID generation on requirement creation');
console.log('• Project-scoped uniqueness (prevents duplicates across projects)');
console.log('• Format validation (REQ-XXX pattern with zero-padding)');
console.log('• Sequential numbering (always increments from highest)');
console.log('• Gap handling (doesn\'t fill gaps, maintains sequence)');
console.log('• Concurrent creation handling with retry logic');
console.log('• Fallback to timestamp-based IDs if retries fail');
console.log('• Backward compatibility with existing requirements');

console.log('\n🛠️ 7. Files Modified:');
console.log('-'.repeat(30));
console.log('• src/lib/utils/reqIdGenerator.ts - REQ-ID generation utilities');
console.log('• src/hooks/mutations/useRequirementMutations.ts - Updated create mutation');
console.log('• src/components/custom/BlockCanvas/hooks/useRequirementActions.ts - Updated table actions');

console.log('\n🎉 8. Benefits:');
console.log('-'.repeat(30));
console.log('• Users no longer need to manually create REQ-IDs');
console.log('• Eliminates risk of duplicate REQ-IDs');
console.log('• Consistent formatting across all requirements');
console.log('• Better requirement organization and traceability');
console.log('• Improved user experience in requirement management');

console.log('\n' + '='.repeat(50));
console.log('✅ REQ-ID Generation Demo Complete!');
console.log('🚀 Feature ready for production use');
