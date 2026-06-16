@echo off
echo Configuration de la base de données FeedbackApp...
echo.

REM Créer la base de données
echo Création de la base de données...
createdb -U postgres feedback_app
if %errorlevel% neq 0 (
    echo Erreur lors de la création de la base de données
    pause
    exit /b 1
)

REM Créer l'utilisateur
echo Création de l'utilisateur...
psql -U postgres -c "CREATE USER feedback_user WITH PASSWORD 'feedback_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE feedback_app TO feedback_user;"

REM Exécuter le script d'initialisation
echo Initialisation des tables...
psql -U postgres -d feedback_app -f "../database/init.sql"

echo.
echo ✅ Base de données configurée avec succès !
echo.
echo Informations de connexion :
echo - Base de données : feedback_app
echo - Utilisateur : feedback_user
echo - Mot de passe : feedback_password
echo - Host : localhost:5432
echo.
pause