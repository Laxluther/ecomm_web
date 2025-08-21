@echo off
echo Creating database dump for deployment...

REM Set your database credentials
set DB_HOST=localhost
set DB_USER=root
set DB_NAME=ecommerce_db

REM Create dump with all necessary options for deployment
mysqldump -h %DB_HOST% -u %DB_USER% -p ^
    --databases %DB_NAME% ^
    --single-transaction ^
    --routines ^
    --triggers ^
    --add-drop-database ^
    --create-options ^
    --disable-keys ^
    --extended-insert ^
    --quick ^
    --lock-tables=false ^
    > database_dump.sql

if %ERRORLEVEL% EQU 0 (
    echo Database dump created successfully: database_dump.sql
    echo File size:
    dir database_dump.sql | find "database_dump.sql"
) else (
    echo Error creating database dump
    exit /b 1
)

pause