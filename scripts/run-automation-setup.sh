#!/bin/bash

# Channel Automation System Database Setup Script
# Run this to set up all required tables and configurations

echo "🚀 Setting up Channel Automation System Database..."

# Supabase connection details
PROJECT_ID="ythsmnqclosoxiccchhh"
DATABASE_URL="postgresql://postgres:sbp_d918cfa5b6da11a4cf108c8dd4b497aeb441c585@db.ythsmnqclosoxiccchhh.supabase.co:5432/postgres"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client or use Supabase Dashboard."
    echo "💡 Alternative: Copy the SQL from scripts/setup-channel-automation-system.sql"
    echo "   and run it in Supabase Dashboard > SQL Editor"
    exit 1
fi

# Run the setup script
echo "🔧 Executing database setup..."
psql "$DATABASE_URL" -f scripts/setup-channel-automation-system.sql

if [ $? -eq 0 ]; then
    echo "✅ Channel Automation System setup completed successfully!"
    echo ""
    echo "📋 Created tables:"
    echo "   - manual_posts (for manual content scheduling)"
    echo "   - channel_automation_settings (channel-specific configs)"
    echo "   - content_execution_queue (execution management)"
    echo "   - automation_performance_metrics (analytics)"
    echo ""
    echo "🔧 Enhanced existing tables:"
    echo "   - automation_logs (added channel_id, execution_type, etc.)"
    echo ""
    echo "🔒 Security:"
    echo "   - RLS policies added to all tables"
    echo "   - Triggers for auto-updating timestamps"
    echo ""
    echo "📊 Added helper functions and views for easy data access"
    echo ""
    echo "🎯 Ready to use the new automation dashboard at:"
    echo "   /dashboard/channels/[id]/automation"
else
    echo "❌ Setup failed. Check the error messages above."
    echo "💡 Try running the SQL manually in Supabase Dashboard"
fi