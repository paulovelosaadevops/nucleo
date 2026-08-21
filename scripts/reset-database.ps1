param(
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path `
    -Path $PSScriptRoot `
    -Parent

$developmentComposePath = Join-Path `
    $projectRoot `
    "compose.yaml"

$locationChanged = $false

function Stop-WithMessage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host ""
    Write-Host $Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" `
    -ForegroundColor DarkGray
Write-Host " NUCLEO - RESET DO BANCO LOCAL" `
    -ForegroundColor White
Write-Host "========================================" `
    -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $developmentComposePath)) {
    Stop-WithMessage `
        "O arquivo compose.yaml de desenvolvimento nao foi encontrado."
}

$activeProfiles = @(
    $env:SPRING_PROFILES_ACTIVE
    $env:SPRING_PROFILES_INCLUDE
    $env:COMPOSE_PROFILES
) |
Where-Object {
    -not [string]::IsNullOrWhiteSpace($_)
}

$profileText = $activeProfiles -join ","

if (
    $profileText -match
    "(?i)(^|[,\s;])prod(uction)?($|[,\s;])"
) {
    Stop-WithMessage `
        "Reset bloqueado: um perfil de producao esta ativo."
}

if (
    -not [string]::IsNullOrWhiteSpace(
        $env:COMPOSE_FILE
    ) -and
    $env:COMPOSE_FILE -match "(?i)production"
) {
    Stop-WithMessage `
        "Reset bloqueado: COMPOSE_FILE aponta para producao."
}

$productionContainers = @(
    docker ps `
        --filter `
        "label=com.docker.compose.project=nucleo-production" `
        --format "{{.Names}}" `
        2>$null
)

if ($productionContainers.Count -gt 0) {
    Write-Host `
        "Containers de producao encontrados:" `
        -ForegroundColor Red

    $productionContainers |
    ForEach-Object {
        Write-Host " - $_" -ForegroundColor Red
    }

    Stop-WithMessage `
        "Reset bloqueado enquanto a producao estiver ativa."
}

$apiConnections = @(
    Get-NetTCPConnection `
        -LocalPort 8090 `
        -State Listen `
        -ErrorAction SilentlyContinue

    Get-NetTCPConnection `
        -LocalPort 8091 `
        -State Listen `
        -ErrorAction SilentlyContinue
)

if ($apiConnections.Count -gt 0) {
    Stop-WithMessage `
        "A API esta ativa. Pare a API com Ctrl+C antes de limpar o banco."
}

if (-not $Force) {
    Write-Host "ATENCAO:" -ForegroundColor Yellow
    Write-Host `
        "Todos os dados do banco LOCAL serao excluidos."
    Write-Host `
        "A estrutura e o historico do Flyway serao preservados."
    Write-Host ""

    $confirmation = Read-Host `
        "Digite LIMPAR BANCO LOCAL para confirmar"

    if (
        $confirmation -cne
        "LIMPAR BANCO LOCAL"
    ) {
        Write-Host ""
        Write-Host `
            "Operacao cancelada." `
            -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
}

try {
    Push-Location $projectRoot
    $locationChanged = $true

    $composeArguments = @(
        "compose"
        "-f"
        $developmentComposePath
        "--project-directory"
        $projectRoot
    )

    Write-Host ""
    Write-Host `
        "Validando o ambiente local..." `
        -ForegroundColor Cyan

    $services = @(
        & docker @composeArguments config --services
    )

    if ($LASTEXITCODE -ne 0) {
        throw `
            "Nao foi possivel validar o Docker Compose local."
    }

    if ($services -notcontains "postgres") {
        throw `
            "O servico postgres nao foi encontrado no compose local."
    }

    Write-Host `
        "Iniciando o PostgreSQL local..." `
        -ForegroundColor Cyan

    & docker @composeArguments up -d postgres

    if ($LASTEXITCODE -ne 0) {
        throw `
            "Nao foi possivel iniciar o PostgreSQL local."
    }

    $databaseCommand = @'
database_user="${POSTGRES_USER:-postgres}"
database_name="${POSTGRES_DB:-nucleo}"
psql \
    -v ON_ERROR_STOP=1 \
    -U "$database_user" \
    -d "$database_name"
'@

    $resetSql = @'
DO $$
DECLARE
    tables_to_truncate text;
BEGIN
    SELECT string_agg(
        format('%I.%I', schemaname, tablename),
        ', '
    )
    INTO tables_to_truncate
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> 'flyway_schema_history';

    IF tables_to_truncate IS NOT NULL THEN
        EXECUTE
            'TRUNCATE TABLE '
            || tables_to_truncate
            || ' RESTART IDENTITY CASCADE';
    END IF;
END
$$;
'@

    Write-Host ""
    Write-Host `
        "Limpando as tabelas locais..." `
        -ForegroundColor Cyan

    $resetSql |
    & docker @composeArguments `
        exec `
        -T `
        postgres `
        sh `
        -c `
        $databaseCommand

    if ($LASTEXITCODE -ne 0) {
        throw `
            "O PostgreSQL retornou erro durante a limpeza."
    }

    $verificationSql = @'
SELECT
    tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename <> 'flyway_schema_history'
ORDER BY tablename;
'@

    Write-Host ""
    Write-Host `
        "Tabelas locais preservadas e esvaziadas:" `
        -ForegroundColor Cyan

    $verificationSql |
    & docker @composeArguments `
        exec `
        -T `
        postgres `
        sh `
        -c `
        $databaseCommand

    if ($LASTEXITCODE -ne 0) {
        throw `
            "Nao foi possivel verificar as tabelas."
    }

    Write-Host ""
    Write-Host "========================================" `
        -ForegroundColor DarkGray
    Write-Host " BANCO LOCAL LIMPO COM SUCESSO" `
        -ForegroundColor Green
    Write-Host "========================================" `
        -ForegroundColor DarkGray
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
    Write-Host `
        "Falha ao limpar o banco local:" `
        -ForegroundColor Red

    Write-Host `
        $_.Exception.Message `
        -ForegroundColor Red

    Write-Host ""
    exit 1
} finally {
    if ($locationChanged) {
        Pop-Location
    }
}