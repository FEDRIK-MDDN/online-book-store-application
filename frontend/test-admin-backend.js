// Backend Health Check & Admin Login Tester
// Run this with: node test-admin-backend.js

const http = require('http');
const https = require('https');

const BACKEND_URLS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : {},
            rawData: data
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: {},
            rawData: data,
            parseError: err.message
          });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testBackendHealth(baseUrl) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`Testing Backend: ${baseUrl}`, 'cyan');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');

  // Test 1: Basic connectivity
  log('\n[1] Testing basic connectivity...', 'blue');
  try {
    const response = await makeRequest(`${baseUrl}/actuator/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    if (response.status === 200 || response.status === 404) {
      log(`✓ Backend is reachable (Status: ${response.status})`, 'green');
    } else {
      log(`✗ Unexpected status: ${response.status}`, 'yellow');
    }
  } catch (err) {
    log(`✗ Cannot connect: ${err.message}`, 'red');
    log(`  → Make sure Spring Boot is running on port 8080`, 'yellow');
    return false;
  }

  // Test 2: Test admin login endpoint
  log('\n[2] Testing admin login endpoint...', 'blue');
  try {
    const loginData = new URLSearchParams({
      email: 'admin@bookstore.com',
      password: 'Admin@123'
    }).toString();

    const response = await makeRequest(`${baseUrl}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: loginData
    });

    if (response.status === 200) {
      log(`✓ Admin login successful!`, 'green');
      if (response.data.jwtToken) {
        log(`✓ JWT token received: ${response.data.jwtToken.substring(0, 20)}...`, 'green');
        
        // Test 3: Test dashboard with token
        log('\n[3] Testing admin dashboard with token...', 'blue');
        try {
          const dashResponse = await makeRequest(`${baseUrl}/admin/dashboard`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${response.data.jwtToken}`,
              'Accept': 'application/json'
            }
          });

          if (dashResponse.status === 200) {
            log(`✓ Dashboard accessible!`, 'green');
            log(`✓ Response: ${JSON.stringify(dashResponse.data).substring(0, 100)}...`, 'green');
          } else {
            log(`✗ Dashboard returned status ${dashResponse.status}`, 'red');
          }
        } catch (err) {
          log(`✗ Dashboard request failed: ${err.message}`, 'red');
        }
      } else {
        log(`⚠ Login successful but no JWT token in response`, 'yellow');
        log(`  Response: ${JSON.stringify(response.data)}`, 'yellow');
      }
    } else if (response.status === 404) {
      log(`✗ Endpoint not found (404)`, 'red');
      log(`  → The /admin/login endpoint doesn't exist in your backend`, 'yellow');
      log(`  → Create AdminController with @PostMapping("/admin/login")`, 'yellow');
    } else if (response.status === 401) {
      log(`✗ Invalid credentials (401)`, 'red');
      log(`  → Check if admin user exists in database`, 'yellow');
      log(`  → Verify AdminBootstrap ran on startup`, 'yellow');
    } else if (response.status === 403) {
      log(`✗ Access forbidden (403)`, 'red');
      log(`  → CORS might be blocking the request`, 'yellow');
      log(`  → Check SecurityConfig and CorsConfig`, 'yellow');
    } else {
      log(`✗ Unexpected status: ${response.status}`, 'red');
      log(`  Response: ${response.rawData}`, 'yellow');
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      log(`✗ Connection refused`, 'red');
      log(`  → Backend is not running on ${baseUrl}`, 'yellow');
    } else {
      log(`✗ Request failed: ${err.message}`, 'red');
    }
    return false;
  }

  // Test 4: CORS check
  log('\n[4] Checking CORS configuration...', 'blue');
  try {
    const response = await makeRequest(`${baseUrl}/admin/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });

    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      log(`✓ CORS enabled: ${corsHeaders}`, 'green');
      const allowedMethods = response.headers['access-control-allow-methods'];
      log(`  Allowed methods: ${allowedMethods || 'not specified'}`, 'cyan');
      const allowedHeaders = response.headers['access-control-allow-headers'];
      log(`  Allowed headers: ${allowedHeaders || 'not specified'}`, 'cyan');
    } else {
      log(`✗ CORS not configured`, 'red');
      log(`  → Add CorsConfig class to your backend`, 'yellow');
      log(`  → See BACKEND_SETUP.md for configuration`, 'yellow');
    }
  } catch (err) {
    log(`⚠ Could not test CORS: ${err.message}`, 'yellow');
  }

  return true;
}

async function main() {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('     Admin Backend Health Check & Login Tester     ', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  let success = false;
  for (const url of BACKEND_URLS) {
    const result = await testBackendHealth(url);
    if (result) {
      success = true;
      break;
    }
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  if (success) {
    log('✓ Backend is working!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Start your React app: npm start', 'blue');
    log('2. Navigate to: http://localhost:3000/admin/login', 'blue');
    log('3. Login with: admin@bookstore.com / Admin@123', 'blue');
  } else {
    log('✗ Backend is not accessible', 'red');
    log('\nTroubleshooting steps:', 'cyan');
    log('1. Make sure Spring Boot is running:', 'yellow');
    log('   mvn spring-boot:run  (or)  ./mvnw spring-boot:run', 'yellow');
    log('2. Check if it\'s listening on port 8080', 'yellow');
    log('3. Look for "Started Application" in the logs', 'yellow');
    log('4. Check for any startup errors', 'yellow');
  }
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

main().catch(err => {
  log(`\n✗ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
