@echo off
setlocal
cd /d "%~dp0"
echo R51 inherited Node regression
where node >nul 2>&1
if errorlevel 1 (echo Node.js is required. & goto end)
node "%~dp0moya_r46_safe_to_buy_regression.js" "%~dp0index.html"
if errorlevel 1 goto fail
node "%~dp0moya_r46_dom_regression.js" "%~dp0index.html"
if errorlevel 1 goto fail
echo All inherited tests completed. Browser checks use R51_BROWSER_TEST.py.
goto end
:fail
echo TEST FAILURE
:end
pause
