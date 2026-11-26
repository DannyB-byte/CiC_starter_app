$ErrorActionPreference = "Continue"

Set-Location (Split-Path $PSScriptRoot -Parent)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportDir = "test-results/repository-audit-$timestamp"

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$results = [System.Collections.Generic.List[object]]::new()

$checks = @(
    @{ Name = "Git status"; Command = "git status --short"; Log = "01-git-status.txt" }
    @{ Name = "Dependency integrity"; Command = "npm ls --all"; Log = "02-dependencies.txt" }
    @{ Name = "Security audit"; Command = "npm audit"; Log = "03-security.txt" }
    @{ Name = "ESLint"; Command = "npm run lint"; Log = "04-eslint.txt" }
    @{ Name = "TypeScript"; Command = "npm run typecheck"; Log = "05-typescript.txt" }
    @{ Name = "Production build"; Command = "npm run build"; Log = "06-build.txt" }
    @{ Name = "Unit tests"; Command = "npm run test:unit"; Log = "07-unit-tests.txt" }
    @{ Name = "Test coverage"; Command = "npm run test:coverage"; Log = "08-coverage.txt" }
    @{ Name = "Browser regression"; Command = "npm run test:e2e"; Log = "09-browser-tests.txt" }
)

@(
    "Date: $(Get-Date)"
    "Node: $(node -v)"
    "npm: $(npm.cmd -v)"
    "Project: $(Get-Location)"
) | Set-Content "$reportDir/environment.txt"

foreach ($check in $checks) {

    Write-Host "`n====================================" -ForegroundColor Cyan
    Write-Host $check.Name -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan

    $timer = [System.Diagnostics.Stopwatch]::StartNew()

    cmd.exe /d /c "$($check.Command) 2>&1" |
        Tee-Object -FilePath "$reportDir/$($check.Log)"

    $exitCode = $LASTEXITCODE
    $timer.Stop()

    $status = if ($exitCode -eq 0) {
        "PASS"
    } else {
        "FAIL"
    }

    $results.Add([PSCustomObject]@{
        Check = $check.Name
        Status = $status
        ExitCode = $exitCode
        Seconds = [math]::Round($timer.Elapsed.TotalSeconds, 2)
        Log = $check.Log
    })

    if ($exitCode -eq 0) {
        Write-Host "[PASS] $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $($check.Name)" -ForegroundColor Red
    }
}

if (Test-Path "test-results/results.json") {
    Copy-Item "test-results/results.json" "$reportDir/playwright-results.json" -Force
}

$results.ToArray() |
    ConvertTo-Json -Depth 10 |
    Set-Content "$reportDir/summary.json"

$results |
    Format-Table -AutoSize |
    Out-String |
    Set-Content "$reportDir/summary.txt"

$passed = @($results | Where-Object Status -eq "PASS").Count
$failed = @($results | Where-Object Status -eq "FAIL").Count

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "FINAL REPOSITORY VALIDATION REPORT" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$results | Format-Table -AutoSize

Write-Host "Total checks: $($results.Count)"
Write-Host "Passed checks: $passed" -ForegroundColor Green
Write-Host "Failed checks: $failed" -ForegroundColor Red
Write-Host "Reports: $reportDir"

if ($results.Count -ne $checks.Count) {
    Write-Host "ERROR: Incomplete validation report." -ForegroundColor Red
    exit 2
}

if ($failed -gt 0) {
    exit 1
}

exit 0
