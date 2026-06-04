// Quick test script to verify categories are accessible
const BASE_URL = 'http://localhost:8080';

console.log('🧪 Testing Categories Endpoint...\n');

// Test 1: Public access (should succeed after backend fix)
console.log('Test 1: Trying public access to /categories...');
fetch(`${BASE_URL}/categories`)
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => {
    if (Array.isArray(data)) {
      console.log('✅ SUCCESS: Categories accessible without auth');
      console.log('📊 Found', data.length, 'categories');
      if (data.length > 0) {
        console.log('\n📋 Categories:');
        data.forEach(cat => console.log(`  - ${cat.name} (ID: ${cat.id})`));
      } else {
        console.log('\n⚠️  No categories created yet. Add some in Admin Dashboard → Categories');
      }
    } else if (data.status === 401) {
      console.log('❌ FAILED: Backend still requires authentication');
      console.log('\n🔧 You updated SecurityConfig.java but need to:');
      console.log('   1. Save the file');
      console.log('   2. Restart Spring Boot backend');
      console.log('   3. Run this test again\n');
      console.log('💡 Expected SecurityConfig change:');
      console.log('   .requestMatchers("/categories", "/categories/**").permitAll()');
    }
  })
  .catch(err => {
    console.error('❌ ERROR:', err.message);
    console.log('\n⚠️  Make sure backend is running on port 8080');
  });
