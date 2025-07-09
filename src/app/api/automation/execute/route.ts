import { NextRequest, NextResponse } from 'next/server'
import { RuleExecutor } from '@/lib/automation/rule-executor'

// POST /api/automation/execute - Execute a specific automation rule
export async function POST(request: NextRequest) {
  try {
    const { ruleId } = await request.json()
    
    if (!ruleId) {
      return NextResponse.json({
        success: false,
        error: 'Rule ID is required'
      }, { status: 400 })
    }

    console.log(`🚀 API: Executing automation rule ${ruleId}`)
    
    const executor = new RuleExecutor()
    const result = await executor.executeRule(ruleId)
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Rule executed successfully - Generated ${result.contentGenerated} content items`
        : `Rule execution failed: ${result.error}`,
      data: {
        ruleId: result.ruleId,
        contentGenerated: result.contentGenerated,
        duration: result.duration,
        error: result.error
      }
    })
    
  } catch (error) {
    console.error('❌ Error in automation execute:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to execute automation rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 