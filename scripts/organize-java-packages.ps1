param(
    [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..")
)

$mainJavaRoot = Join-Path `
    $repositoryRoot `
    "apps\api\src\main\java"

$allJavaRoot = Join-Path `
    $repositoryRoot `
    "apps\api\src"

$utf8WithoutBom =
    New-Object System.Text.UTF8Encoding($false)

$featureDirectories = @(
    "br\com\nucleo\api\agenda",
    "br\com\nucleo\api\finance",
    "br\com\nucleo\api\family",
    "br\com\nucleo\api\auth",
    "br\com\nucleo\api\shopping",
    "br\com\nucleo\api\identity\user",
    "br\com\nucleo\api\identity\profile",
    "br\com\nucleo\api\security"
)

function Get-Layer {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName
    )

    if ($TypeName -match "Controller$") {
        return "controller"
    }

    if ($TypeName -match "Repository$") {
        return "repository"
    }

    if (
        $TypeName -match "Service$" -or
        $TypeName -match "Generator$"
    ) {
        return "service"
    }

    if (
        $TypeName -match "Request$" -or
        $TypeName -match "Response$"
    ) {
        return "dto"
    }

    if ($TypeName -match "Filter$") {
        return "filter"
    }

    if (
        $TypeName -match "Writer$" -or
        $TypeName -match "Handler$" -or
        $TypeName -match "EntryPoint$"
    ) {
        return "handler"
    }

    if (
        $TypeName -match "Config$" -or
        $TypeName -match "Configuration$" -or
        $TypeName -match "Properties$"
    ) {
        return "config"
    }

    return "domain"
}

function Get-PackageName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $match = [regex]::Match(
        $Content,
        "(?m)^\s*package\s+([a-zA-Z0-9_.]+)\s*;"
    )

    if (-not $match.Success) {
        throw "Declaração package não encontrada."
    }

    return $match.Groups[1].Value
}

function Write-Utf8File {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $utf8WithoutBom
    )
}

$movementPlan = @()

foreach ($featureDirectory in $featureDirectories) {
    $featurePath = Join-Path `
        $mainJavaRoot `
        $featureDirectory

    if (-not (Test-Path $featurePath)) {
        continue
    }

    $files = Get-ChildItem `
        -Path $featurePath `
        -Filter "*.java" `
        -File

    foreach ($file in $files) {
        $content = [System.IO.File]::ReadAllText(
            $file.FullName
        )

        $oldPackage = Get-PackageName $content
        $typeName = $file.BaseName
        $layer = Get-Layer $typeName
        $newPackage = "$oldPackage.$layer"

        $destinationDirectory = Join-Path `
            $featurePath `
            $layer

        $destinationPath = Join-Path `
            $destinationDirectory `
            $file.Name

        $movementPlan += [PSCustomObject]@{
            TypeName = $typeName
            Layer = $layer
            OldPackage = $oldPackage
            NewPackage = $newPackage
            OldQualifiedName = "$oldPackage.$typeName"
            NewQualifiedName = "$newPackage.$typeName"
            SourcePath = $file.FullName
            DestinationDirectory = $destinationDirectory
            DestinationPath = $destinationPath
        }
    }
}

if ($movementPlan.Count -eq 0) {
    Write-Host ""
    Write-Host "Nenhum arquivo pendente de organização."
    Write-Host "A estrutura já está organizada."
    exit 0
}

$duplicateTypes = $movementPlan |
    Group-Object TypeName |
    Where-Object Count -gt 1

if ($duplicateTypes) {
    $names = $duplicateTypes.Name -join ", "
    throw "Existem tipos duplicados: $names"
}

Write-Host ""
Write-Host "Plano de reorganização:"
Write-Host ""

$movementPlan |
    Sort-Object OldPackage, Layer, TypeName |
    Format-Table `
        TypeName,
        Layer,
        OldPackage,
        NewPackage `
        -AutoSize

if (-not $Apply) {
    Write-Host ""
    Write-Host "Simulação concluída."
    Write-Host "Nenhum arquivo foi alterado."
    Write-Host ""
    Write-Host "Para aplicar:"
    Write-Host ".\scripts\organize-java-packages.ps1 -Apply"
    exit 0
}

$gitStatus = & git `
    -C $repositoryRoot `
    status `
    --porcelain

if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível consultar o Git."
}

if ($gitStatus) {
    throw @"
O repositório possui alterações pendentes.
Faça commit antes de executar com -Apply.
"@
}

foreach ($item in $movementPlan) {
    if (Test-Path $item.DestinationPath) {
        throw "O destino já existe: $($item.DestinationPath)"
    }

    New-Item `
        -Path $item.DestinationDirectory `
        -ItemType Directory `
        -Force |
        Out-Null

    Move-Item `
        -LiteralPath $item.SourcePath `
        -Destination $item.DestinationPath
}

foreach ($item in $movementPlan) {
    $content = [System.IO.File]::ReadAllText(
        $item.DestinationPath
    )

    $packagePattern =
        "(?m)^\s*package\s+" +
        [regex]::Escape($item.OldPackage) +
        "\s*;"

    $content = [regex]::Replace(
        $content,
        $packagePattern,
        "package $($item.NewPackage);",
        1
    )

    Write-Utf8File `
        -Path $item.DestinationPath `
        -Content $content
}

$replacementPlan = $movementPlan |
    Sort-Object `
        { $_.OldQualifiedName.Length } `
        -Descending

$allJavaFiles = Get-ChildItem `
    -Path $allJavaRoot `
    -Filter "*.java" `
    -File `
    -Recurse

foreach ($javaFile in $allJavaFiles) {
    $content = [System.IO.File]::ReadAllText(
        $javaFile.FullName
    )

    foreach ($item in $replacementPlan) {
        $content = $content.Replace(
            $item.OldQualifiedName,
            $item.NewQualifiedName
        )
    }

    $currentPackage = Get-PackageName $content
    $currentTypeName = $javaFile.BaseName
    $importsToAdd = @()

    foreach ($item in $movementPlan) {
        if ($currentTypeName -eq $item.TypeName) {
            continue
        }

        if ($currentPackage -eq $item.NewPackage) {
            continue
        }

        $typePattern =
            "\b" +
            [regex]::Escape($item.TypeName) +
            "\b"

        if (-not [regex]::IsMatch(
            $content,
            $typePattern
        )) {
            continue
        }

        $importPattern =
            "(?m)^\s*import\s+" +
            [regex]::Escape($item.NewQualifiedName) +
            "\s*;"

        if ([regex]::IsMatch(
            $content,
            $importPattern
        )) {
            continue
        }

        $importsToAdd +=
            "import $($item.NewQualifiedName);"
    }

    if ($importsToAdd.Count -gt 0) {
        $importsToAdd = $importsToAdd |
            Sort-Object -Unique

        $newline = if ($content.Contains("`r`n")) {
            "`r`n"
        } else {
            "`n"
        }

        $packageMatch = [regex]::Match(
            $content,
            "(?m)^\s*package\s+[a-zA-Z0-9_.]+\s*;"
        )

        if (-not $packageMatch.Success) {
            throw "Package não encontrado: $($javaFile.FullName)"
        }

        $position =
            $packageMatch.Index +
            $packageMatch.Length

        $importBlock =
            $newline +
            $newline +
            ($importsToAdd -join $newline)

        $content = $content.Insert(
            $position,
            $importBlock
        )
    }

    Write-Utf8File `
        -Path $javaFile.FullName `
        -Content $content
}

Write-Host ""
Write-Host "Reorganização aplicada com sucesso."
Write-Host ""
Write-Host "Execute agora:"
Write-Host "cd C:\nucleo\apps\api"
Write-Host ".\mvnw.cmd clean test"