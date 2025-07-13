#!/usr/bin/env node

/**
 * Test script for MCP connection to Supabase PostgreSQL
 */

const { spawn } = require('child_process');

console.log('🔍 Testing MCP Server connection...');

const connectionString = "postgresql://postgres:sbp_d918cfa5b6da11a4cf108c8dd4b497aeb441c585@db.ythsmnqclosoxiccchhh.supabase.co:5432/postgres";

// Test the MCP server with our configuration
const mcp = spawn('npx', ['@modelcontextprotocol/server-postgres', connectionString], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

mcp.stdout.on('data', (data) => {
  output += data.toString();
  console.log('📊 MCP Output:', data.toString());
});

mcp.stderr.on('data', (data) => {
  console.error('❌ MCP Error:', data.toString());
});

mcp.on('close', (code) => {
  console.log(`\n🏁 MCP Server process exited with code ${code}`);
  
  if (code === 0) {
    console.log('✅ MCP Server connection successful!');
  } else {
    console.log('❌ MCP Server connection failed.');
    console.log('\n📋 Possible issues:');
    console.log('1. Service role key might be incorrect');
    console.log('2. Database connection format might be wrong');
    console.log('3. Supabase might require different credentials');
    console.log('\n💡 Try getting the correct connection string from:');
    console.log('   Supabase Dashboard > Settings > Database > Connection String');
  }
});

// Send a test message after a delay
setTimeout(() => {
  console.log('📤 Sending test message to MCP server...');
  
  const testMessage = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  }) + '\n';
  
  mcp.stdin.write(testMessage);
}, 1000);

// Clean exit after 5 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - stopping MCP server...');
  mcp.kill();
}, 5000); 