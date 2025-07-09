-- Fix missing user_profiles table
-- This script creates the user_profiles table that's referenced in AuthContext

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'bot_manager' CHECK (role IN ('super_admin', 'manager', 'bot_manager')),
    full_name TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile  
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
    ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Policy: Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles"
    ON user_profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Policy: Allow upsert for new users (used in AuthContext)
CREATE POLICY "Allow upsert for authenticated users"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create profile on user creation
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert default super admin profile if not exists
INSERT INTO user_profiles (id, email, role, full_name)
SELECT 
    id,
    email,
    'super_admin',
    COALESCE(raw_user_meta_data->>'full_name', 'Super Admin')
FROM auth.users 
WHERE email = 'triroars@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    updated_at = NOW();

COMMENT ON TABLE user_profiles IS 'User profile information with role-based access control';
COMMENT ON COLUMN user_profiles.role IS 'User role: super_admin, manager, or bot_manager';
COMMENT ON COLUMN user_profiles.organization_id IS 'Organization the user belongs to (null for super_admin)'; 