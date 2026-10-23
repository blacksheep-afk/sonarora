@echo off
setlocal
cd /d "%~dp0"
echo MOYA R51 portable browser regression
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0r51_release_gate_check.py" %* > "%~dp0R51_BROWSER_RESULTS.txt" 2>&1
) else (
  python "%~dp0r51_release_gate_check.py" %* > "%~dp0R51_BROWSER_RESULTS.txt" 2>&1
)
set "TEST_EXIT=%ERRORLEVEL%"
type "%~dp0R51_BROWSER_RESULTS.txt"
echo.
if not "%TEST_EXIT%"=="0" (
  echo BROWSER CHECK FAILED - exit code %TEST_EXIT%
) else (
  echo BROWSER CHECK PASSED
)
echo.
pause
exit /b %TEST_EXIT%
