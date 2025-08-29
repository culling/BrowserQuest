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
    "game.js", "home.js", "log.js", "require-jquery.js", 
    "modernizr.js", "css3-mediaqueries.js", "mapworker.js", 
    "detect.js", "underscore.min.js", "text.js"
)

$jsDir = Join-Path $BUILDDIR "js"
if (Test-Path $jsDir) {
    Get-ChildItem -Path $jsDir -Recurse -File | Where-Object {
        $filesToRemove -contains $_.Name
    } | Remove-Item -Force
}

Write-Host "Removing sprites directory"
$spritesDir = Join-Path $BUILDDIR "sprites"
if (Test-Path $spritesDir) {
    Remove-Item -Recurse -Force $spritesDir
}

Write-Host "Removing config directory"
$configDir = Join-Path $BUILDDIR "config"
if (Test-Path $configDir) {
    Remove-Item -Recurse -Force $configDir
}

Write-Host "Moving build.txt to current dir"
$buildTxtPath = Join-Path $BUILDDIR "build.txt"
if (Test-Path $buildTxtPath) {
    Move-Item $buildTxtPath $CURDIR -Force
}

Write-Host "Build complete"