# Script pour voir le contenu de la base de données
Write-Host "Contenu de la base de données FeedbackApp" -ForegroundColor Green
Write-Host "=" * 50

# Comptes employés
Write-Host "`n👥 Comptes employés :" -ForegroundColor Cyan
try {
    psql -U postgres -d feedback_app -c "SELECT id, name, email, role, created_at FROM employees;" -t
} catch {
    Write-Host "❌ Impossible de lire les employés" -ForegroundColor Red
}

# Commentaires
Write-Host "`n💬 Commentaires :" -ForegroundColor Cyan
try {
    psql -U postgres -d feedback_app -c "SELECT id, content, recipient_id, source, submitted_at, is_moderated FROM feedbacks ORDER BY submitted_at DESC;" -t
} catch {
    Write-Host "❌ Impossible de lire les commentaires" -ForegroundColor Red
}

# Statistiques
Write-Host "`n📊 Statistiques :" -ForegroundColor Cyan
try {
    $total = psql -U postgres -d feedback_app -c "SELECT COUNT(*) FROM feedbacks;" -t -A
    $moderated = psql -U postgres -d feedback_app -c "SELECT COUNT(*) FROM feedbacks WHERE is_moderated = true;" -t -A
    Write-Host "Total commentaires : $total"
    Write-Host "Commentaires modérés : $moderated"
} catch {
    Write-Host "❌ Impossible de calculer les statistiques" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50
Read-Host "Appuyez sur Entrée pour continuer"