# Admin Login Test Script for PowerShell
# Run with: .\test-admin.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Admin Backend Health Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$backends = @(
    @{ Name = "Spring Boot"; Url = "http://localhost:8080"; Email = "admin@bookstore.com"; Password = "Admin@123" },
    @{ Name = "Mock API"; Url = "http://localhost:5050"; Email = "admin@example.com"; Password = "Admin123" }
)

function Test-Backend {
    param($Backend)
    
    Write-Host "[Testing $($Backend.Name) at $($Backend.Url)]" -ForegroundColor Blue
    
    # Test 1: Connectivity
    Write-Host "`n1. Testing connectivity..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$($Backend.Url)/actuator/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✓ Backend is reachable" -ForegroundColor Green
    } catch {
        try {
            $response = Invoke-WebRequest -Uri $Backend.Url -Method GET -TimeoutSec 5 -ErrorAction Stop
            Write-Host "   ✓ Backend is reachable" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ Cannot connect: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "   → Make sure $($Backend.Name) is running" -ForegroundColor Yellow
            return $false
        }
    }
    
    # Test 2: Admin Login
    Write-Host "`n2. Testing admin login..." -ForegroundColor Yellow
    try {
        $body = @{
            email = $Backend.Email
            password = $Backend.Password
        }
        
        $loginResponse = Invoke-RestMethod -Uri "$($Backend.Url)/admin/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/x-www-form-urlencoded" `
            -ErrorAction Stop
        
        Write-Host "   ✓ Login successful!" -ForegroundColor Green
        
        # Check for JWT token
        $token = $loginResponse.jwtToken ?? $loginResponse.token ?? $loginResponse.accessToken
        if ($token) {
            Write-Host "   ✓ JWT token received: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Green
            
            # Test 3: Dashboard with Token
            Write-Host "`n3. Testing dashboard access..." -ForegroundColor Yellow
            try {
                $headers = @{
                    Authorization = "Bearer $token"
                    Accept = "application/json"
                }
                
                $dashResponse = Invoke-RestMethod -Uri "$($Backend.Url)/admin/dashboard" `
                    -Method GET `
                    -Headers $headers `
                    -ErrorAction Stop
                
                Write-Host "   ✓ Dashboard accessible!" -ForegroundColor Green
                Write-Host "   ✓ Response received successfully" -ForegroundColor Green
                return $true
            } catch {
                $statusCode = $_.Exception.Response.StatusCode.Value__
                Write-Host "   ✗ Dashboard request failed (Status: $statusCode)" -ForegroundColor Red
                
                if ($statusCode -eq 401) {
                    Write-Host "   → Token authentication failed" -ForegroundColor Yellow
                } elseif ($statusCode -eq 404) {
                    Write-Host "   → Dashboard endpoint not found" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "   ⚠ Login successful but no JWT token" -ForegroundColor Yellow
            Write-Host "   Response: $($loginResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Host "   ✗ Login failed (Status: $statusCode)" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "   → Endpoint not found - create AdminController" -ForegroundColor Yellow
        } elseif ($statusCode -eq 401) {
            Write-Host "   → Invalid credentials or admin user doesn't exist" -ForegroundColor Yellow
        } elseif ($statusCode -eq 403) {
            Write-Host "   → Access forbidden - check CORS configuration" -ForegroundColor Yellow
        }
    }
    
    # Test 4: CORS Check
    Write-Host "`n4. Checking CORS configuration..." -ForegroundColor Yellow
    try {
        $headers = @{
            Origin = "http://localhost:3000"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type,Authorization"
        }
        
        $corsResponse = Invoke-WebRequest -Uri "$($Backend.Url)/admin/login" `
            -Method OPTIONS `
            -Headers $headers `
            -ErrorAction Stop
        
        $allowOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
        if ($allowOrigin) {
            Write-Host "   ✓ CORS enabled: $allowOrigin" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ CORS headers not found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠ Could not test CORS: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    return $false
}

# Test each backend
$success = $false
foreach ($backend in $backends) {
    Write-Host "`n========================================`n" -ForegroundColor Cyan
    $result = Test-Backend -Backend $backend
    if ($result) {
        $success = $true
        Write-Host "`n✓ SUCCESS! $($backend.Name) is working!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Cyan
        Write-Host "  1. Start React app: npm start" -ForegroundColor White
        Write-Host "  2. Go to: http://localhost:3000/admin/login" -ForegroundColor White
        Write-Host "  3. Login with: $($backend.Email) / $($backend.Password)" -ForegroundColor White
        break
    }
}

if (-not $success) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "✗ No backend is accessible" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Cyan
    Write-Host "  Spring Boot Backend:" -ForegroundColor Yellow
    Write-Host "    mvn spring-boot:run" -ForegroundColor White
    Write-Host "    (or) .\mvnw spring-boot:run" -ForegroundColor White
    Write-Host "`n  Mock API Server:" -ForegroundColor Yellow
    Write-Host "    node mock-api/server.js" -ForegroundColor White
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
