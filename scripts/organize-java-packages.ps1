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

$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

$featureDirectories = @(
    "br\com\nucleo\api\agenda",
    "br\com\nucleo\api\finance",
    "br\com\nucleo\api\family",
    "br\com\nucleo\api\auth",
    "br\com\nucleo\api\identity\user"
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

function Get-RelativePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FullPath
    )

    $rootUri = New-Object System.Uri(
        $repositoryRoot.TrimEnd("\") + "\"
    )

    $fileUri = New-Object System.Uri($FullPath)

    return [System.Uri]::UnescapeDataString(
        $rootUri.MakeRelativeUri($fileUri).ToString()
    ).Replace("/", "\")
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
    Write-Host "Nenhum arquivo direto encontrado para reorganização."
    Write-Host "A estrutura pode já ter sido organizada."
    exit 0
}

$duplicateTypes = $movementPlan |
    Group-Object TypeName |
    Where-Object Count -gt 1

if ($duplicateTypes) {
    $names = $duplicateTypes.Name -join ", "

    throw "Existem tipos duplicados no plano: $names"
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
    Write-Host "Simulação concluída. Nenhum arquivo foi alterado."
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
Faça commit antes de aplicar a reorganização.

Execute:
git add .
git commit -m "chore: add package organization script"
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

    $relativeSource = Get-RelativePath $item.SourcePath
    $relativeDestination = Get-RelativePath `
        $item.DestinationPath

    & git `
        -C $repositoryRoot `
        mv `
        -- `
        $relativeSource `
        $relativeDestination

    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao mover $relativeSource"
    }
}

foreach ($item in $movementPlan) {
    $content = [System.IO.File]::ReadAllText(
        $item.DestinationPath
    )

    $packagePattern =
        "(?m)^\s*package\s+" +
        [regex]::Escape($item.OldPackage) +
        "\s*;"

    $newPackageDeclaration =
        "package $($item.NewPackage);"

    $updatedContent = [regex]::Replace(
        $content,
        $packagePattern,
        $newPackageDeclaration,
        1
    )

    Write-Utf8File `
        -Path $item.DestinationPath `
        -Content $updatedContent
}

$allJavaFiles = Get-ChildItem `
    -Path $allJavaRoot `
    -Filter "*.java" `
    -File `
    -Recurse

foreach ($javaFile in $allJavaFiles) {
    $content = [System.IO.File]::ReadAllText(
        $javaFile.FullName
    )

    foreach ($item in $movementPlan) {
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
            Sort-Object `
            -Unique

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
            throw "Package não encontrado em $($javaFile.FullName)"
        }

        $insertionPosition =
            $packageMatch.Index +
            $packageMatch.Length

        $importBlock =
            $newline +
            $newline +
            ($importsToAdd -join $newline)

        $content = $content.Insert(
            $insertionPosition,
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
Write-Host "Próximos comandos:"
Write-Host "cd C:\nucleo\apps\api"
Write-Host ".\mvnw.cmd clean test"