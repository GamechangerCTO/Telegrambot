import { NextRequest, NextResponse } from 'next/server'
import { smartPushEngine } from '@/lib/content/smart-push-engine'

/**
 * 🔄 Smart Push Queue Processor API
 * 
 * GET /api/smart-push/process - מעבד את התור החכם
 * 
 * עמוד זה נועד להיקרא על ידי:
 * - Cron job מתוזמן
 * - Webhook חיצוני  
 * - Trigger מניהול
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Smart Push Queue Processor: Starting...')
    
    // עיבוד התור
    const result = await smartPushEngine.processQueue()
    
    console.log(`✅ Queue processing completed: ${result.successful}/${result.processed} successful`)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed
      },
      message: `Processed ${result.processed} queue items: ${result.successful} successful, ${result.failed} failed`
    })

  } catch (error) {
    console.error('❌ Smart Push Queue Processor error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { force = false } = body
    
    console.log(`🔄 Smart Push Queue Processor: Starting (force: ${force})...`)
    
    // עיבוד התור
    const result = await smartPushEngine.processQueue()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed
      },
      force_mode: force,
      message: `Processed ${result.processed} queue items`
    })

  } catch (error) {
    console.error('❌ Smart Push Queue Processor error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 