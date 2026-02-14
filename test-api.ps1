# API Test Script
# This PowerShell script tests all the key API endpoints

Write-Host "🧪 Starting POS SaaS API Tests..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"
$tenantHeader = @{ "x-tenant-subdomain" = "demo" }
$contentType = @{ "Content-Type" = "application/json" }

# Test Results
$tests = @()

function Test-API {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $allHeaders = $tenantHeader + $Headers
        
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $allHeaders
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.Headers += $contentType
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  ✅ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
            $script:tests += @{ Name = $Name; Status = "PASS"; Code = $response.StatusCode }
            return $response
        } else {
            Write-Host "  ❌ FAIL - Expected: $ExpectedStatus, Got: $($response.StatusCode)" -ForegroundColor Red
            $script:tests += @{ Name = $Name; Status = "FAIL"; Code = $response.StatusCode }
            return $null
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  ✅ PASS - Status: $statusCode" -ForegroundColor Green
            $script:tests += @{ Name = $Name; Status = "PASS"; Code = $statusCode }
        } else {
            Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:tests += @{ Name = $Name; Status = "FAIL"; Error = $_.Exception.Message }
        }
        return $null
    }
    
    Write-Host ""
}

# Test 1: Health Check
Write-Host "`n📌 Test Suite 1: Basic Health Checks" -ForegroundColor Magenta
Write-Host "=" * 50
Test-API -Name "API Health Check" -Method GET -Endpoint ""

# Test 2: Authentication
Write-Host "`n📌 Test Suite 2: Authentication" -ForegroundColor Magenta
Write-Host "=" * 50

$loginBody = @{
    employeeId = "EMP001"
    pin = "1234"
}
$loginResponse = Test-API -Name "PIN Login (Valid Credentials)" -Method POST -Endpoint "/auth/pin-login" -Body $loginBody

$token = $null
if ($loginResponse) {
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.accessToken
    Write-Host "  🔑 Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Cyan
}

$authHeaders = @{ "Authorization" = "Bearer $token" }

# Test with invalid credentials
$invalidLogin = @{
    employeeId = "EMP001"
    pin = "9999"
}
Test-API -Name "PIN Login (Invalid Credentials)" -Method POST -Endpoint "/auth/pin-login" -Body $invalidLogin -ExpectedStatus 401

# Test 3: Categories
Write-Host "`n📌 Test Suite 3: Categories API" -ForegroundColor Magenta
Write-Host "=" * 50

$categoriesResponse = Test-API -Name "Get All Categories" -Method GET -Endpoint "/categories" -Headers $authHeaders
$categoriesTreeResponse = Test-API -Name "Get Categories Tree" -Method GET -Endpoint "/categories/tree" -Headers $authHeaders

if ($categoriesResponse) {
    $categories = $categoriesResponse.Content | ConvertFrom-Json
    Write-Host "  📊 Found $($categories.Count) categories" -ForegroundColor Cyan
}

# Create a test category
$timestamp = Get-Date -Format "HHmmss"
$newCategory = @{
    name = "test-category-$timestamp"
    displayName = "Test Category"
    description = "Created by automated test"
    color = "#FF5733"
    sortOrder = 999
    isActive = $true
}
$createCatResponse = Test-API -Name "Create Category" -Method POST -Endpoint "/categories" -Headers $authHeaders -Body $newCategory -ExpectedStatus 201

$testCategoryId = $null
if ($createCatResponse) {
    $createdCat = $createCatResponse.Content | ConvertFrom-Json
    $testCategoryId = $createdCat.id
    Write-Host "  🆔 Created category ID: $testCategoryId" -ForegroundColor Cyan
}

# Get specific category
if ($testCategoryId) {
    Test-API -Name "Get Category by ID" -Method GET -Endpoint "/categories/$testCategoryId" -Headers $authHeaders
    
    # Update category
    $updateCategory = @{
        displayName = "Updated Test Category"
        description = "Updated by automated test"
    }
    Test-API -Name "Update Category" -Method PUT -Endpoint "/categories/$testCategoryId" -Headers $authHeaders -Body $updateCategory
    
    # Delete category
    Test-API -Name "Delete Category" -Method DELETE -Endpoint "/categories/$testCategoryId" -Headers $authHeaders
}

# Test 4: Products
Write-Host "`n📌 Test Suite 4: Products API" -ForegroundColor Magenta
Write-Host "=" * 50

$productsResponse = Test-API -Name "Get All Products" -Method GET -Endpoint "/products" -Headers $authHeaders

if ($productsResponse) {
    $products = $productsResponse.Content | ConvertFrom-Json
    Write-Host "  📦 Found $($products.Count) products" -ForegroundColor Cyan
    
    if ($products.Count -gt 0) {
        $testProductId = $products[0].id
        Write-Host "  🆔 Using product ID: $testProductId" -ForegroundColor Cyan
        
        # Get product details
        Test-API -Name "Get Product by ID" -Method GET -Endpoint "/products/$testProductId" -Headers $authHeaders
        
        # Get product modifiers
        Test-API -Name "Get Product Modifiers" -Method GET -Endpoint "/modifiers/products/$testProductId/groups" -Headers $authHeaders
    }
}

# Test 5: Modifiers
Write-Host "`n📌 Test Suite 5: Modifiers API" -ForegroundColor Magenta
Write-Host "=" * 50

$modifierGroupsResponse = Test-API -Name "Get All Modifier Groups" -Method GET -Endpoint "/modifiers/groups" -Headers $authHeaders

if ($modifierGroupsResponse) {
    $groups = $modifierGroupsResponse.Content | ConvertFrom-Json
    Write-Host "  🔧 Found $($groups.Count) modifier groups" -ForegroundColor Cyan
}

$modifiersResponse = Test-API -Name "Get All Modifiers" -Method GET -Endpoint "/modifiers" -Headers $authHeaders

if ($modifiersResponse) {
    $modifiers = $modifiersResponse.Content | ConvertFrom-Json
    Write-Host "  ⚙️  Found $($modifiers.Count) modifiers" -ForegroundColor Cyan
}

# Test 6: Combos
Write-Host "`n📌 Test Suite 6: Combos API" -ForegroundColor Magenta
Write-Host "=" * 50

Test-API -Name "Get All Combos" -Method GET -Endpoint "/combos" -Headers $authHeaders

# Test 7: Menu
Write-Host "`n📌 Test Suite 7: Menu API" -ForegroundColor Magenta
Write-Host "=" * 50

Test-API -Name "Get POS Menu" -Method GET -Endpoint "/menu/pos" -Headers $authHeaders
Test-API -Name "Get Products List" -Method GET -Endpoint "/menu/products-list" -Headers $authHeaders

# Test Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan
Write-Host ""

$passed = ($tests | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($tests | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $tests.Count

Write-Host "Total Tests:  $total" -ForegroundColor White
Write-Host "Passed:       $passed ✅" -ForegroundColor Green
Write-Host "Failed:       $failed ❌" -ForegroundColor Red
Write-Host ""

$passRate = [math]::Round(($passed / $total) * 100, 2)
Write-Host "Pass Rate:    $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 50) { "Yellow" } else { "Red" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $tests | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  • $($_.Name)" -ForegroundColor Red
        if ($_.Error) {
            Write-Host "    Error: $($_.Error)" -ForegroundColor DarkRed
        }
    }
    Write-Host ""
}

Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host ""

# Export results to JSON
$results = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    summary = @{
        total = $total
        passed = $passed
        failed = $failed
        passRate = $passRate
    }
    tests = $tests
}

$results | ConvertTo-Json -Depth 10 | Out-File "test-results.json"
Write-Host "📄 Results saved to test-results.json" -ForegroundColor Green
