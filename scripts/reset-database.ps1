param(
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Path $PSScriptRoot -Parent
$locationChanged = $false

Write-Host ""
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host " NUCLEO - RESET COMPLETO DO BANCO" -ForegroundColor White
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host ""

$apiConnection = @(
    Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue
)

if ($apiConnection.Count -gt 0) {
    Write-Host "A API esta ativa na porta 8090." -ForegroundColor Red
    Write-Host ""
    Write-Host "Pare a API com Ctrl+C antes de limpar o banco." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not $Force) {
    Write-Host "ATENCAO:" -ForegroundColor Yellow
    Write-Host "Todos os dados das tabelas de negocio serao excluidos."
    Write-Host "A estrutura e o historico do Flyway serao preservados."
    Write-Host ""

    $confirmation = Read-Host "Digite LIMPAR para confirmar"

    if ($confirmation -cne "LIMPAR") {
        Write-Host ""
        Write-Host "Operacao cancelada." -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
}

try {
    Push-Location $projectRoot
    $locationChanged = $true

    Write-Host ""
    Write-Host "Validando o Docker Compose..." -ForegroundColor Cyan

    $services = @(docker compose config --services)

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel validar o Docker Compose."
    }

    if ($services -notcontains "postgres") {
        throw "O servico postgres nao foi encontrado no compose."
    }

    Write-Host "Iniciando o PostgreSQL..." -ForegroundColor Cyan

    docker compose up -d postgres

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel iniciar o PostgreSQL."
    }

    $resetSql = 'DO $$ DECLARE tables_to_truncate text; BEGIN SELECT string_agg(format(''%I.%I'', schemaname, tablename), '', '') INTO tables_to_truncate FROM pg_tables WHERE schemaname = ''public'' AND tablename <> ''flyway_schema_history''; IF tables_to_truncate IS NOT NULL THEN EXECUTE ''TRUNCATE TABLE '' || tables_to_truncate || '' RESTART IDENTITY CASCADE''; END IF; END $$;'

    Write-Host ""
    Write-Host "Limpando as tabelas..." -ForegroundColor Cyan

    $resetSql | docker compose exec -T postgres sh -c 'database_user="${POSTGRES_USER:-postgres}"; database_name="${POSTGRES_DB:-nucleo}"; psql -v ON_ERROR_STOP=1 -U "$database_user" -d "$database_name"'

    if ($LASTEXITCODE -ne 0) {
        throw "O PostgreSQL retornou erro durante a limpeza."
    }

    $verificationSql = 'SELECT tablename FROM pg_tables WHERE schemaname = ''public'' AND tablename <> ''flyway_schema_history'' ORDER BY tablename;'

    Write-Host ""
    Write-Host "Tabelas de negocio preservadas e esvaziadas:" -ForegroundColor Cyan

    $verificationSql | docker compose exec -T postgres sh -c 'database_user="${POSTGRES_USER:-postgres}"; database_name="${POSTGRES_DB:-nucleo}"; psql -v ON_ERROR_STOP=1 -U "$database_user" -d "$database_name"'

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel verificar as tabelas."
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host " BANCO LIMPO COM SUCESSO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Preservado:" -ForegroundColor White
    Write-Host " - Estrutura das tabelas"
    Write-Host " - Constraints e indices"
    Write-Host " - Historico do Flyway"
    Write-Host ""
    Write-Host "Removido:" -ForegroundColor White
    Write-Host " - Usuarios"
    Write-Host " - Familias e membros"
    Write-Host " - Convites"
    Write-Host " - Agenda e lembretes"
    Write-Host " - Listas e itens de compras"
    Write-Host " - Dados financeiros"
    Write-Host " - Notificacoes e preferencias"
    Write-Host " - Eventos de auditoria"
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "Falha ao limpar o banco:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    if ($locationChanged) {
        Pop-Location
    }
}