param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern("^SEC-[0-9]{2}(\.[0-9]+)?$")]
    [string]$Sprint,

    [switch]$Visual,
    [switch]$Commit
)

$ErrorActionPreference = "Stop"

Set-Location (Split-Path $PSScriptRoot -Parent)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportDir = Join-Path $PWD ".qa-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$report = Join-Path $reportDir "$Sprint-$timestamp.log"

function Invoke-Gate {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host "`nRUNNING: $Name" -ForegroundColor Cyan

    $timer = [Diagnostics.Stopwatch]::StartNew()

    & $Command

    $exitCode = $LASTEXITCODE
    $timer.Stop()

    if ($exitCode -ne 0) {
        throw "$Name FAILED (exit $exitCode)"
    }

    Write-Host "PASSED: $Name ($($timer.Elapsed))" -ForegroundColor Green
}

Start-Transcript -Path $report

try {
    if ((git branch --show-current) -ne "production/hardening") {
        throw "Incorrect branch. Development stopped."
    }

    Write-Host "`nCHEMO IN COMFORT - $Sprint" -ForegroundColor Cyan

    git status -sb
    git log -1 --oneline

    Invoke-Gate "Git whitespace validation" {
        git diff --check
    }

    Invoke-Gate "Dependency installation" {
        npm.cmd ci
    }

    Invoke-Gate "Security audit" {
        npm.cmd audit --audit-level=high
    }

    Invoke-Gate "Lint" {
        npm.cmd run lint
    }

    Invoke-Gate "TypeScript validation" {
        npm.cmd run typecheck
    }

    Invoke-Gate "Unit tests and coverage" {
        npm.cmd run test:coverage
    }

    Invoke-Gate "Production build" {
        npm.cmd run build
    }

    Invoke-Gate "Bundle budget" {
        node scripts/check-bundle.mjs
    }

    Remove-Item Env:CIC_VISUAL -ErrorAction SilentlyContinue

    Invoke-Gate "Production regression" {
        npx.cmd playwright test --config=playwright.production.config.ts --workers=1 --retries=0
    }

    if ($Visual) {
        $env:CIC_VISUAL = "1"

        Invoke-Gate "Visual regression" {
            npx.cmd playwright test --config=playwright.production.config.ts tests/e2e/visual.spec.ts --workers=1 --retries=0
        }
    }

    Write-Host "`nALL REQUESTED QUALITY GATES PASSED" -ForegroundColor Green

    if ($Commit) {
        git status --short

        Write-Host "`nReview the changed files before committing." -ForegroundColor Yellow

        $approval = Read-Host "Type APPROVE to commit and push"

        if ($approval -ne "APPROVE") {
            throw "Commit not approved."
        }

        Invoke-Gate "Stage tracked changes" {
            git add -u
        }

        Invoke-Gate "Staged whitespace validation" {
            git diff --cached --check
        }

        Invoke-Gate "Commit" {
            git commit -m "security: $Sprint validated implementation"
        }

        Invoke-Gate "Push" {
            git push -u origin production/hardening
        }
    }

    Write-Host "`nSPRINT VALIDATION COMPLETE" -ForegroundColor Green
}
catch {
    Write-Host "`nAUTOMATION STOPPED: $_" -ForegroundColor Red
    throw
}
finally {
    Remove-Item Env:CIC_VISUAL -ErrorAction SilentlyContinue
    Write-Host "`nReport: $report"
    Stop-Transcript
}
