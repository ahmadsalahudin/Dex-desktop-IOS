@echo off
cd /d "%~dp0"
echo.
echo Pocket Desktop preview
 echo On this computer, open: http://localhost:8080
 echo On an iPhone on the same Wi-Fi, open http://YOUR_WINDOWS_IP:8080
 echo Run ipconfig in another terminal to find your IPv4 address.
 echo Press Ctrl+C in this window to stop the preview.
echo.
py -3 -m http.server 8080 --bind 0.0.0.0 --directory app
pause
