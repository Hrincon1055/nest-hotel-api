param(
    [switch]$OpenFirewall,
    [switch]$Rebuild,
    [switch]$SeedOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path (Split-Path -Parent $scriptRoot) 'vue-hotel'
$envPath = Join-Path $scriptRoot '.env'
$envExamplePath = Join-Path $scriptRoot '.env.example'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-EnvValue {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$DefaultValue
    )

    if (-not (Test-Path $FilePath)) {
        return $DefaultValue
    }

    $line = Get-Content $FilePath | Where-Object { $_ -match "^${Key}=" } | Select-Object -First 1
    if (-not $line) {
        return $DefaultValue
    }

    $value = ($line -split '=', 2)[1].Trim().Trim('"')
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $DefaultValue
    }

    return $value
}

function Get-PrimaryIPv4 {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike '127.*' -and
            $_.IPAddress -notlike '169.254.*' -and
            $_.PrefixOrigin -ne 'WellKnown'
        } |
        Sort-Object InterfaceMetric, SkipAsSource |
        Select-Object -ExpandProperty IPAddress -First 1

    if (-not $ip) {
        $ip = (
            ipconfig |
            Select-String 'IPv4' |
            ForEach-Object { ($_ -split ':')[-1].Trim() } |
            Where-Object { $_ -and $_ -notlike '127.*' } |
            Select-Object -First 1
        )
    }

    return $ip
}

function Ensure-FirewallRule {
    param(
        [string]$Name,
        [int]$Port
    )

    $ruleExists = netsh advfirewall firewall show rule name="$Name" | Out-String
    if ($ruleExists -match 'No rules match') {
        netsh advfirewall firewall add rule name="$Name" dir=in action=allow protocol=TCP localport=$Port | Out-Null
        Write-Host "Regla creada: $Name ($Port)" -ForegroundColor Green
        return
    }

    Write-Host "Regla ya existe: $Name ($Port)" -ForegroundColor Yellow
}

if (-not (Test-Path $frontendPath)) {
    throw "No se encontro la carpeta del frontend en: $frontendPath"
}

if (-not (Test-Path (Join-Path $frontendPath 'Dockerfile'))) {
    throw "No se encontro el Dockerfile del frontend en: $(Join-Path $frontendPath 'Dockerfile')"
}

if (-not (Test-CommandExists 'docker')) {
    throw 'Docker no esta instalado o no esta disponible en PATH.'
}

if (-not (Test-CommandExists 'docker-compose')) {
    throw 'docker-compose no esta instalado o no esta disponible en PATH.'
}

if (-not (Test-Path $envPath)) {
    if (-not (Test-Path $envExamplePath)) {
        throw 'No existe .env ni .env.example para inicializar variables.'
    }

    Copy-Item $envExamplePath $envPath
    Write-Host "Se creo .env a partir de .env.example. Revisa las credenciales antes de produccion." -ForegroundColor Yellow
}

Push-Location $scriptRoot
try {
    $appPort = Get-EnvValue -FilePath $envPath -Key 'APP_PORT' -DefaultValue '80'
    $apiPort = Get-EnvValue -FilePath $envPath -Key 'API_PORT' -DefaultValue '3000'
    $pgAdminPort = Get-EnvValue -FilePath $envPath -Key 'PGADMIN_PORT' -DefaultValue '5050'

    if ($SeedOnly) {
        Write-Step 'Ejecutando seed manual dentro del contenedor API'
        docker-compose up -d postgres api
        if ($LASTEXITCODE -ne 0) {
            throw 'No se pudieron iniciar postgres y api.'
        }

        docker-compose exec api npx prisma db seed --config prisma.config.ts
        if ($LASTEXITCODE -ne 0) {
            throw 'El seed manual fallo.'
        }
    }
    else {
        Write-Step 'Construyendo e iniciando los servicios'
        if ($Rebuild) {
            docker-compose up -d --build
        }
        else {
            docker-compose up -d --build
        }

        if ($LASTEXITCODE -ne 0) {
            throw 'El despliegue con docker-compose fallo.'
        }
    }

    if ($OpenFirewall) {
        Write-Step 'Abriendo reglas de firewall para acceso en red interna'
        Ensure-FirewallRule -Name 'Hotel Front 80' -Port ([int]$appPort)
        Ensure-FirewallRule -Name 'Hotel API 3000' -Port ([int]$apiPort)
        Ensure-FirewallRule -Name 'Hotel pgAdmin 5050' -Port ([int]$pgAdminPort)
    }

    Write-Step 'Estado actual de contenedores'
    docker-compose ps

    $ip = Get-PrimaryIPv4
    if (-not $ip) {
        $ip = 'IP_NO_DETECTADA'
    }

    Write-Step 'Accesos disponibles'
    Write-Host "Frontend local : http://localhost:$appPort" -ForegroundColor Green
    Write-Host "API local      : http://localhost:$apiPort/api/v1" -ForegroundColor Green
    Write-Host "Swagger local  : http://localhost:$appPort/docs" -ForegroundColor Green
    Write-Host "pgAdmin local  : http://localhost:$pgAdminPort" -ForegroundColor Green
    Write-Host "Frontend red   : http://$ip`:$appPort" -ForegroundColor Green
    Write-Host "API red        : http://$ip`:$apiPort/api/v1" -ForegroundColor Green
    Write-Host "Swagger red    : http://$ip`:$appPort/docs" -ForegroundColor Green

    Write-Step 'Usuarios de prueba'
    Write-Host 'admin@hotel.com / Admin123!' -ForegroundColor Yellow
    Write-Host 'manager@hotel.com / Manager123!' -ForegroundColor Yellow
    Write-Host 'reception@hotel.com / Reception123!' -ForegroundColor Yellow
    Write-Host 'housekeeping@hotel.com / Housekeeping123!' -ForegroundColor Yellow
}
finally {
    Pop-Location
}