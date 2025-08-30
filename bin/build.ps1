# PowerShell script to generate an optimized client build of BrowserQuest

$BUILDDIR = "..\client-build"
$PROJECTDIR = "..\client\js"
$CURDIR = Get-Location

Write-Host "Deleting previous build directory"
if (Test-Path $BUILDDIR) {
    Remove-Item -Recurse -Force $BUILDDIR
}

Write-Host "Building client with RequireJS"
Set-Location $PROJECTDIR
& node "..\..\bin\r.js" -o build.js
Set-Location $CURDIR

Write-Host "Removing unnecessary js files from the build directory"
$filesToRemove = @(
    "mapworker.js"
)

$jsDir = Join-Path $BUILDDIR "js"
if (Test-Path $jsDir) {
    Get-ChildItem -Path $jsDir -Recurse -File | Where-Object {
        $filesToRemove -contains $_.Name
    } | Remove-Item -Force
}

Write-Host "Copying required shared files"
$sharedSourceDir = "..\shared"
$sharedBuildDir = Join-Path $BUILDDIR "shared"
if (Test-Path $sharedSourceDir) {
    Copy-Item -Path $sharedSourceDir -Destination $sharedBuildDir -Recurse -Force
}

Write-Host "Copying config files"
$configSourceDir = "..\client\config"
$configBuildDir = Join-Path $BUILDDIR "config"
if (Test-Path $configSourceDir) {
    Copy-Item -Path $configSourceDir -Destination $configBuildDir -Recurse -Force
    # Copy template config as the main config if it doesn't exist
    $configBuildJsonPath = Join-Path $configBuildDir "config_build.json"
    $configTemplatePath = Join-Path $configBuildDir "config_build.json-dist"
    if (-not (Test-Path $configBuildJsonPath) -and (Test-Path $configTemplatePath)) {
        Copy-Item -Path $configTemplatePath -Destination $configBuildJsonPath -Force
    }
}

Write-Host "Moving build.txt to current dir"
$buildTxtPath = Join-Path $BUILDDIR "build.txt"
if (Test-Path $buildTxtPath) {
    Move-Item $buildTxtPath $CURDIR -Force
}

Write-Host "Build complete"