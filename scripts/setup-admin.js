/**
 * 🛠️ Setup Admin Script
 * Creates the first super admin user for the system
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Make sure .env.local exists and contains these variables');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Service key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSuperAdmin() {
  try {
    console.log('🔧 Setting up super admin user...\n');

    // Check if any super admin exists
    const { data: existingAdmins, error: adminCheckError } = await supabase
      .from('managers')
      .select('*')
      .eq('role', 'super_admin');

    if (adminCheckError) {
      throw adminCheckError;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ Super admin already exists:');
      existingAdmins.forEach(admin => {
        console.log(`   📧 ${admin.email} (${admin.name})`);
      });
      console.log('\n💡 If you need to create additional admins, use the super admin panel.');
      return;
    }

    // Admin details
    const adminEmail = 'triroars@gmail.com';
    const adminPassword = 'admin123456'; // Should be changed after first login
    const adminName = 'Super Administrator';

    console.log('📧 Creating super admin account...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'super_admin'
      }
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ Auth user created successfully');

    // Create manager record
    const { data: managerData, error: managerError } = await supabase
      .from('managers')
      .insert({
        user_id: authData.user.id,
        email: adminEmail,
        name: adminName,
        role: 'super_admin',
        preferred_language: 'en',
        is_active: true
      })
      .select()
      .single();

    if (managerError) {
      throw managerError;
    }

    console.log('✅ Manager record created successfully\n');

    console.log('🎉 Super admin setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('👑 Role: Super Administrator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change the default password immediately after first login');
    console.log('   2. Enable 2FA if available');
    console.log('   3. Never share these credentials');
    console.log('   4. Use the super admin panel to create additional users\n');

    console.log('🌐 Access the admin panel at:');
    console.log('   📱 Login: /auth/login');
    console.log('   👑 Super Admin: /super-admin');

  } catch (error) {
    console.error('❌ Error setting up super admin:', error.message);
    
    if (error.message?.includes('User already registered')) {
      console.log('\n💡 User already exists. Trying to update manager record...');
      
      try {
        // Get user by email
        const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
        
        if (getUserError) throw getUserError;
        
        const user = users.users.find(u => u.email === 'triroars@gmail.com');
        
        if (user) {
          // Check if manager record exists
          const { data: existingManager, error: managerCheckError } = await supabase
            .from('managers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (managerCheckError && managerCheckError.code !== 'PGRST116') {
            throw managerCheckError;
          }

          if (!existingManager) {
            // Create manager record
            const { error: createManagerError } = await supabase
              .from('managers')
              .insert({
                user_id: user.id,
                email: 'triroars@gmail.com',
                name: 'Super Administrator',
                role: 'super_admin',
                preferred_language: 'en',
                is_active: true
              });

            if (createManagerError) throw createManagerError;
            
            console.log('✅ Manager record created for existing user');
          } else {
            // Update to super admin if not already
            if (existingManager.role !== 'super_admin') {
              const { error: updateError } = await supabase
                .from('managers')
                .update({ role: 'super_admin' })
                .eq('id', existingManager.id);

              if (updateError) throw updateError;
              
              console.log('✅ Manager role updated to super_admin');
            } else {
              console.log('✅ Super admin is already set up correctly');
            }
          }
        }
      } catch (updateError) {
        console.error('❌ Error updating manager record:', updateError.message);
      }
    }
    
    process.exit(1);
  }
}

// Run the setup
setupSuperAdmin(); 