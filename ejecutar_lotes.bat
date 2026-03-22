@echo off
echo ========================================
echo EJECUTANDO SCRAPING POR LOTES
echo ========================================

set LOTE_SIZE=200
set TOTAL_LOTES=11
set PAUSA=10

for /L %%i in (1,1,%TOTAL_LOTES%) do (
    set /a OFFSET=(%%i-1)*%LOTE_SIZE%
    
    echo.
    echo ========================================
    echo LOTE %%i de %TOTAL_LOTES%
    echo Offset: !OFFSET!, Limite: %LOTE_SIZE%
    echo ========================================
    
    python scrape_products_v3_improved.py --limit=%LOTE_SIZE% --offset=!OFFSET! --batch=%%i
    
    if %%i LSS %TOTAL_LOTES% (
        echo.
        echo Pausa de %PAUSA% segundos...
        timeout /t %PAUSA% /nobreak >nul
    )
)

echo.
echo ========================================
echo ¡PROCESO COMPLETADO!
echo ========================================
echo Archivos generados:
for /L %%i in (1,1,%TOTAL_LOTES%) do (
    echo   - productos_enriquecidos_v3_batch%%i.json
    echo   - LISTADO_ENRIQUECIDO_V3_batch%%i.xlsx
)
pause