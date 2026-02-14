# API Test Script - Simple Version
Write-Host "Starting POS SaaS API Tests..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"
$tenantHeader = @{ "x-tenant-subdomain" = "demo" }

$passed = 0
$failed = 0

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    Write-Host "`nTesting: $Name" -ForegroundColor Yellow
    
    try {
        $allHeaders = $tenantHeader + $Headers
        
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $allHeaders
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.Headers += @{ "Content-Type" = "application/json" }
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        Write-Host "PASS - Status: $($response.StatusCode)" -ForegroundColor Green
        $script:passed++
        return $response
    }
    catch {
        Write-Host "FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

Write-Host "`n=== Test Suite 1: Basic Health ===" -ForegroundColor Magenta
Test-Endpoint -Name "API Health Check" -Method GET -Endpoint ""

Write-Host "`n=== Test Suite 2: Authentication ===" -ForegroundColor Magenta
$loginBody = @{
    employeeId = "EMP-001"
    pin = "1234"
}
$loginResponse = Test-Endpoint -Name "PIN Login" -Method POST -Endpoint "/auth/pin-login" -Body $loginBody

$token = $null
if ($loginResponse) {
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.accessToken
    Write-Host "Token obtained successfully" -ForegroundColor Cyan
}

$authHeaders = @{ "Authorization" = "Bearer $token" }

Write-Host "`n=== Test Suite 3: Categories ===" -ForegroundColor Magenta
Test-Endpoint -Name "Get All Categories" -Method GET -Endpoint "/categories" -Headers $authHeaders
Test-Endpoint -Name "Get Categories Tree" -Method GET -Endpoint "/categories/tree" -Headers $authHeaders

Write-Host "`n=== Test Suite 4: Products ===" -ForegroundColor Magenta
$productsResponse = Test-Endpoint -Name "Get All Products" -Method GET -Endpoint "/products" -Headers $authHeaders

if ($productsResponse) {
    $products = $productsResponse.Content | ConvertFrom-Json
    Write-Host "Found $($products.Count) products" -ForegroundColor Cyan
    
    if ($products.Count -gt 0) {
        $productId = $products[0].id
        Test-Endpoint -Name "Get Product by ID" -Method GET -Endpoint "/products/$productId" -Headers $authHeaders
        Test-Endpoint -Name "Get Product Modifiers" -Method GET -Endpoint "/modifiers/products/$productId/groups" -Headers $authHeaders
    }
}

Write-Host "`n=== Test Suite 5: Modifiers ===" -ForegroundColor Magenta
Test-Endpoint -Name "Get Modifier Groups" -Method GET -Endpoint "/modifiers/groups" -Headers $authHeaders
Test-Endpoint -Name "Get Modifiers" -Method GET -Endpoint "/modifiers" -Headers $authHeaders

Write-Host "`n=== Test Suite 6: Menu ===" -ForegroundColor Magenta
Test-Endpoint -Name "Get POS Menu" -Method GET -Endpoint "/menu/pos" -Headers $authHeaders

Write-Host "`n" -NoNewline
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
$total = $passed + $failed
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
$passRate = [math]::Round(($passed / $total) * 100, 2)
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Red" })
Write-Host ""
