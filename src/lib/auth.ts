import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from './supabase'

// סיסמה ברירת מחדל למנהלים חדשים
const DEFAULT_PASSWORD_LENGTH = 12

// יצירת סיסמה רנדומלית
export function generateRandomPassword(length: number = DEFAULT_PASSWORD_LENGTH): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // דרישות מינימום לסיסמה חזקה
  password += 'A' // אות גדולה
  password += 'a' // אות קטנה  
  password += '1' // מספר
  password += '!' // תו מיוחד
  
  // השלמת הסיסמה עם תווים רנדומליים
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  // ערבוב התווים
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// הצפנת סיסמה
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltRounds = 12
  const salt = await bcrypt.genSalt(saltRounds)
  const hash = await bcrypt.hash(password, salt)
  
  return { hash, salt }
}

// בדיקת סיסמה
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// יצירת JWT token
export function generateJWT(managerId: string, email: string): string {
  const payload = {
    managerId,
    email,
    type: 'manager_session'
  }
  
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
  
  return jwt.sign(payload, secret, {
    expiresIn: '24h',
    issuer: 'telegram-bot-manager',
    subject: managerId
  })
}

// יצירת refresh token
export function generateRefreshToken(): string {
  return bcrypt.genSaltSync(16) + Date.now().toString(36)
}

// אימות JWT token
export function verifyJWT(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    const payload = jwt.verify(token, secret)
    
    return { valid: true, payload }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid token'
    }
  }
}

// בדיקת חוזק סיסמה
export function validatePasswordStrength(password: string): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// רישום ניסיון התחברות
export async function logLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  managerId?: string,
  failureReason?: string
) {
  const supabase = createClient()
  
  // מציאת organization_id דרך המנהל
  let organizationId = null
  if (managerId) {
    const { data: manager } = await supabase
      .from('managers')
      .select(`
        user:users(organization_id)
      `)
      .eq('id', managerId)
      .single()
    
    organizationId = manager?.user?.organization_id
  }
  
  await supabase
    .from('manager_login_attempts')
    .insert({
      manager_id: managerId,
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
      failure_reason: failureReason,
      organization_id: organizationId
    })
}

// עדכון מספר ניסיונות התחברות כושלים
export async function updateFailedLoginAttempts(managerId: string, increment: boolean = true) {
  const supabase = createClient()
  
  if (increment) {
    // הגדלת מספר ניסיונות כושלים
    const { data: manager } = await supabase
      .from('managers')
      .select('login_attempts')
      .eq('id', managerId)
      .single()
    
    const newAttempts = (manager?.login_attempts || 0) + 1
    const shouldLock = newAttempts >= 5 // נעילה אחרי 5 ניסיונות
    
    const updateData: any = {
      login_attempts: newAttempts
    }
    
    if (shouldLock) {
      // נעילת החשבון ל-30 דקות
      updateData.account_locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }
    
    await supabase
      .from('managers')
      .update(updateData)
      .eq('id', managerId)
    
    return { locked: shouldLock, attempts: newAttempts }
  } else {
    // איפוס ניסיונות אחרי התחברות מצליחה
    await supabase
      .from('managers')
      .update({
        login_attempts: 0,
        account_locked_until: null,
        last_login_at: new Date().toISOString()
      })
      .eq('id', managerId)
    
    return { locked: false, attempts: 0 }
  }
}

// יצירת session למנהל
export async function createManagerSession(
  managerId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const supabase = createClient()
  
  // יצירת tokens
  const sessionToken = generateJWT(managerId, '')
  const refreshToken = generateRefreshToken()
  
  // שמירת הסשן במסד הנתונים
  const { data: session, error } = await supabase
    .from('manager_sessions')
    .insert({
      manager_id: managerId,
      session_token: sessionToken,
      refresh_token: refreshToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 שעות
      device_info: userAgent ? { user_agent: userAgent } : null
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }
  
  return {
    sessionToken,
    refreshToken,
    expiresAt: session.expires_at
  }
}

// בדיקת תוקף session
export async function validateManagerSession(sessionToken: string) {
  const supabase = createClient()
  
  // אימות ה-JWT
  const jwtResult = verifyJWT(sessionToken)
  if (!jwtResult.valid) {
    return { valid: false, error: 'Invalid token' }
  }
  
  // בדיקה במסד הנתונים
  const { data: session } = await supabase
    .from('manager_sessions')
    .select(`
      *,
      manager:managers(
        id, name, email, is_active, approval_status,
        user:users(id, organization_id, role)
      )
    `)
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .single()
  
  if (!session) {
    return { valid: false, error: 'Session not found' }
  }
  
  // בדיקת תוקף
  if (new Date(session.expires_at) < new Date()) {
    return { valid: false, error: 'Session expired' }
  }
  
  // בדיקת סטטוס המנהל
  if (!session.manager.is_active || session.manager.approval_status !== 'approved') {
    return { valid: false, error: 'Manager account is not active' }
  }
  
  // עדכון last_accessed_at
  await supabase
    .from('manager_sessions')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', session.id)
  
  return {
    valid: true,
    session,
    manager: session.manager
  }
} 