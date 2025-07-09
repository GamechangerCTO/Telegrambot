import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getActiveSportsAPIs, getAllAPIKeys } from '@/lib/api-keys'

// GET - שליפת כל המפתחות הפעילים
export async function GET() {
  try {
    const apis = await getActiveSportsAPIs()
    
    // מחזירים רק מידע בסיסי, לא את המפתחות עצמם
    const safeApis = apis.map(api => ({
      name: api.name,
      api_url: api.api_url,
      is_active: api.is_active,
      priority: api.priority,
      daily_calls_used: api.daily_calls_used,
      daily_calls_limit: api.daily_calls_limit,
      rate_limit_per_hour: api.rate_limit_per_hour,
      last_called_at: api.last_called_at,
      has_key: !!api.api_key // רק אמת/שקר אם יש מפתח
    }))
    
    return NextResponse.json({
      success: true,
      apis: safeApis
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST - עדכון מפתח API
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiName, apiKey, isActive } = body
    
    if (!apiName) {
      return NextResponse.json(
        { success: false, error: 'API name is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // עדכון המפתח במסד הנתונים
    const { error } = await supabase
      .from('sports_apis')
      .update({
        api_key: apiKey,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('name', apiName)
    
    if (error) {
      console.error('Error updating API key:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update API key' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `API key for ${apiName} updated successfully`
    })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update API key' },
      { status: 500 }
    )
  }
}

// PUT - איפוס מונה הקריאות היומי (עבור כל ה-APIs)
export async function PUT() {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('sports_apis')
      .update({ daily_calls_used: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000') // עדכון של כולם
    
    if (error) {
      console.error('Error resetting daily calls:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to reset daily calls' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Daily API call counters reset successfully'
    })
  } catch (error) {
    console.error('Error resetting daily calls:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset daily calls' },
      { status: 500 }
    )
  }
} 