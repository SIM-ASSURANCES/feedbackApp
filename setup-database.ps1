# Script PowerShell pour configurer la base de données FeedbackApp
Write-Host "Configuration de la base de données FeedbackApp..." -ForegroundColor Green
Write-Host ""

# Vérifier si PostgreSQL est installé
try {
    $psqlVersion = psql --version 2>$null
    Write-Host "PostgreSQL trouvé : $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer PostgreSQL depuis https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

# Créer la base de données
Write-Host "Création de la base de données..." -ForegroundColor Yellow
try {
    createdb -U postgres feedback_app
    Write-Host "✅ Base de données 'feedback_app' créée" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la création de la base de données : $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

# Créer l'utilisateur
Write-Host "Création de l'utilisateur..." -ForegroundColor Yellow
try {
    psql -U postgres -c "CREATE USER feedback_user WITH PASSWORD 'feedback_password';" 2>$null
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE feedback_app TO feedback_user;" 2>$null
    Write-Host "✅ Utilisateur 'feedback_user' créé" -ForegroundColor Green
} catch {
    Write-Host "⚠️ L'utilisateur existe peut-être déjà, continuation..." -ForegroundColor Yellow
}

# Exécuter le script d'initialisation
Write-Host "Initialisation des tables..." -ForegroundColor Yellow
try {
    $initPath = Join-Path $PSScriptRoot "database\init.sql"
    psql -U postgres -d feedback_app -f $initPath
    Write-Host "✅ Tables initialisées" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de l'initialisation : $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Base de données configurée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "Informations de connexion :" -ForegroundColor Cyan
Write-Host "- Base de données : feedback_app"
Write-Host "- Utilisateur : feedback_user"
Write-Host "- Mot de passe : feedback_password"
Write-Host "- Host : localhost:5432"
Write-Host ""
Read-Host "Appuyez sur Entrée pour continuer"