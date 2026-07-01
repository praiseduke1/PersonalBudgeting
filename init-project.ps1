# init-project.ps1
# Skrip otomatisasi inisialisasi awal untuk React + Vite + TypeScript dan Supabase.
# Jalankan skrip ini dari terminal PowerShell di folder proyek Anda.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Inisialisasi Proyek SaaS Personal Budgeting (Vite+React)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Memeriksa keberadaan Node.js dan npm secara global atau lokasi default
Write-Host ""
Write-Host "[1/4] Memeriksa instalasi Node.js dan npm..." -ForegroundColor Yellow

$defaultNodePath = "C:\Program Files\nodejs"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (Test-Path "$defaultNodePath\node.exe") {
        Write-Host "Menemukan Node.js di lokasi default: $defaultNodePath. Menambahkan ke PATH sesi ini..." -ForegroundColor Cyan
        $env:Path = "$defaultNodePath;" + $env:Path
    }
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    $npmVer = npm -v
    Write-Host "[OK] Node.js ditemukan: $nodeVer" -ForegroundColor Green
    Write-Host "[OK] npm ditemukan: $npmVer" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Node.js/npm TIDAK ditemukan di PATH sistem Anda!" -ForegroundColor Red
    Write-Host "Silakan unduh dan instal Node.js terlebih dahulu dari https://nodejs.org/" -ForegroundColor Yellow
    Exit 1
}


# 2. Membuat Struktur Folder Tambahan yang Kosong (bila belum ada)
Write-Host ""
Write-Host "[2/4] Membuat struktur folder proyek..." -ForegroundColor Yellow
$folders = @(
    "src/assets",
    "src/components/common",
    "src/components/dashboard",
    "src/hooks",
    "src/utils",
    "supabase/migrations"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "[OK] Folder dibuat: $folder" -ForegroundColor Green
    } else {
        Write-Host "[OK] Folder sudah ada: $folder" -ForegroundColor DarkGreen
    }
}

# 3. Menginstal Dependensi Proyek menggunakan npm
Write-Host ""
Write-Host "[3/4] Menginstal dependensi proyek dari package.json..." -ForegroundColor Yellow
Write-Host "Menjalankan 'npm install'..." -ForegroundColor Gray
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Instalasi dependensi berhasil!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Gagal menginstal dependensi. Pastikan Anda terhubung ke internet." -ForegroundColor Red
    Exit 1
}

# 4. Menyalin File Kredensial Environment
Write-Host ""
Write-Host "[4/4] Konfigurasi variabel lingkungan..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "[OK] File .env disalin dari .env.example. Silakan edit file .env untuk memasukkan kredensial Supabase Anda." -ForegroundColor Green
} else {
    Write-Host "[OK] File .env sudah ada." -ForegroundColor DarkGreen
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Proyek Berhasil Diinisialisasi!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Untuk menjalankan server pengembangan lokal, gunakan perintah:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
