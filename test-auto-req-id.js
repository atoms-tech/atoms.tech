// Test script to verify auto REQ-ID generation
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydogoylwenufckscqijp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkb2dveWx3ZW51ZmNrc2NxaWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MzUxNjYsImV4cCI6MjA1MjMxMTE2Nn0.Oy0K0aalki4e4b5h8caHYdWxZVKB6IWDDYQ3zvCUu4Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateNextReqId(documentId) {
    try {
        // Query all existing requirements in the document to find the highest REQ-ID
        const { data: requirements, error } = await supabase
            .from('requirements')
            .select('external_id')
            .eq('document_id', documentId)
            .not('external_id', 'is', null)
            .not('is_deleted', 'eq', true);

        if (error) {
            console.error('Error fetching existing REQ-IDs:', error);
            return 'REQ-001';
        }

        // Extract numeric parts from existing REQ-IDs
        const existingNumbers = [];
        
        if (requirements && requirements.length > 0) {
            requirements.forEach((req) => {
                if (req.external_id) {
                    // Match REQ-XXX pattern and extract the number
                    const match = req.external_id.match(/^REQ-(\d+)$/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (!isNaN(num)) {
                            existingNumbers.push(num);
                        }
                    }
                }
            });
        }

        // Find the next available number
        let nextNumber = 1;
        if (existingNumbers.length > 0) {
            existingNumbers.sort((a, b) => a - b);
            nextNumber = Math.max(...existingNumbers) + 1;
        }

        // Format as REQ-XXX with zero padding
        const formattedNumber = nextNumber.toString().padStart(3, '0');
        return `REQ-${formattedNumber}`;

    } catch (error) {
        console.error('Unexpected error in generateNextReqId:', error);
        return 'REQ-001';
    }
}

async function testAutoReqIdGeneration() {
    console.log('🧪 Testing Auto REQ-ID Generation...\n');
    
    const documentId = '0a93b9bd-b018-4596-aceb-fcec02403ede'; // Real document ID
    
    // Test 1: Check existing requirements
    console.log('📋 Step 1: Checking existing requirements...');
    const { data: existingReqs, error: fetchError } = await supabase
        .from('requirements')
        .select('external_id, name')
        .eq('document_id', documentId)
        .not('is_deleted', 'eq', true);
    
    if (fetchError) {
        console.error('❌ Error fetching requirements:', fetchError);
        return;
    }
    
    console.log('Existing requirements:');
    existingReqs.forEach(req => {
        console.log(`  - External ID: "${req.external_id}", Name: "${req.name}"`);
    });
    
    // Test 2: Generate next REQ-ID
    console.log('\n🎯 Step 2: Generating next REQ-ID...');
    const nextReqId = await generateNextReqId(documentId);
    console.log(`Generated REQ-ID: ${nextReqId}`);
    
    // Test 3: Validate format
    console.log('\n✅ Step 3: Validating format...');
    const isValidFormat = /^REQ-\d{3}$/.test(nextReqId);
    console.log(`Format validation: ${isValidFormat ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 4: Check uniqueness
    console.log('\n🔍 Step 4: Checking uniqueness...');
    const isDuplicate = existingReqs.some(req => req.external_id === nextReqId);
    console.log(`Uniqueness check: ${!isDuplicate ? '✅ UNIQUE' : '❌ DUPLICATE'}`);
    
    console.log('\n🎉 Test completed!');
    console.log(`\nSummary:`);
    console.log(`- Generated REQ-ID: ${nextReqId}`);
    console.log(`- Format valid: ${isValidFormat ? 'YES' : 'NO'}`);
    console.log(`- Is unique: ${!isDuplicate ? 'YES' : 'NO'}`);
    console.log(`- Ready for use: ${isValidFormat && !isDuplicate ? '✅ YES' : '❌ NO'}`);
}

// Run the test
testAutoReqIdGeneration().catch(console.error);
