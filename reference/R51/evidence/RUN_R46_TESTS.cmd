@echo off
setlocal
cd /d "%~dp0"
echo MOYA R46 Liability-Reconciliation Candidate Checks
echo ================================================
where node >nul 2>&1
if errorlevel 1 (
 echo ERROR: Node.js is not installed or is not on PATH.
 goto finish
)
node --version
echo.
node "%~dp0moya_r46_safe_to_buy_regression.js" "%~dp0index.html"
if errorlevel 1 goto failed
echo.
node "%~dp0moya_r46_dom_regression.js" "%~dp0index.html"
if errorlevel 1 goto failed
echo.
echo R46 local calculation and DOM-adapter checks completed.
echo The DOM adapter is not a real-browser audit.
goto finish
:failed
echo TEST FAILURE. Copy the output above.
:finish
echo.
pause
