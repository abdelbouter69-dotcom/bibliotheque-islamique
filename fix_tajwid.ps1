# Script de correction de l'agent Tajwid — a lancer depuis le dossier du repo
# Usage : .\fix_tajwid.ps1

$path = "bibliotheque_coran.html"

if (-not (Test-Path $path)) {
    Write-Host "ERREUR: $path introuvable dans ce dossier." -ForegroundColor Red
    exit 1
}

# Sauvegarde de securite avant modification
Copy-Item $path "$path.backup"
Write-Host "Sauvegarde creee : $path.backup" -ForegroundColor Cyan

$content = Get-Content -Path $path -Raw -Encoding UTF8

$old1 = "مصادرُك: تحفة الأطفال، متن الجزرية، الفوائد المكية، الشاطبية."
$new1 = "مصادرُك: تحفة الأطفال (الجمزوري)، متن الجزرية (ابن الجزري)، الفوائد المكية (السمنودي)، الشاطبية (الشاطبي)، معلّم التجويد (الجريسي)."

$old2 = "1. SOURCES : Ne cite JAMAIS un livre ou un titre dont tu n'es pas absolument certain. En cas de doute, ne cite AUCUNE source. N'invente jamais de titre, d'auteur ni de référence. Les seules sources autorisées : Matn Tuḥfat al-Aṭfāl (de Sulaymān al-Jamzūrī), al-Muqaddima al-Jazariyya (d'Ibn al-Jazarī), Muʿallim at-Tajwīd (de Khālid al-Jurayṣī). Ne les cite que si elles sont réellement pertinentes."
$new2 = "1. SOURCES : Ne cite JAMAIS un livre, un titre ou un auteur en dehors de cette liste fermee : Matn Tuhfat al-Atfal (Sulayman al-Jamzuri), al-Muqaddima al-Jazariyya (Ibn al-Jazari), al-Fawa'id al-Makkiyya (as-Samannudi), Hirz al-Amani / ash-Shatibiyya (ash-Shatibi), Mu'allim at-Tajwid (Khalid al-Jurayssi). N'invente jamais de titre, d'auteur ni de reference hors de cette liste. Le corpus Le Coran Phonetique fourni plus bas dans ce prompt est ta source directe pour les analogies phonetiques et les exemples deja cites (madd, qalqala, etc.) - utilise-le tel quel, sans le completer par des inventions. Si une source ne figure dans aucune des deux listes, ne la cite pas et dis que tu ne peux pas l'attribuer avec certitude.

9. EXEMPLES CORANIQUES HORS CORPUS : Pour tout mot ou verset qui n'est PAS deja cite dans le corpus Le Coran Phonetique ci-dessus, tu peux expliquer la regle de Tajwid qui s'applique, mais ne cite un numero de sourate/verset precis QUE si tu es absolument certain de son exactitude. En cas de doute sur la reference precise, explique la regle sans donner de reference chiffree plutot que d'inventer un numero de verset."

$found1 = $content.Contains($old1)
$found2 = $content.Contains($old2)

if (-not $found1) { Write-Host "ATTENTION: texte 1 (mesadrouk arabe) non trouve - verifie manuellement" -ForegroundColor Yellow }
if (-not $found2) { Write-Host "ATTENTION: texte 2 (regle SOURCES francaise) non trouve - verifie manuellement" -ForegroundColor Yellow }

$content = $content.Replace($old1, $new1)
$content = $content.Replace($old2, $new2)

Set-Content -Path $path -Value $content -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "Termine. Remplacement 1 applique : $found1" -ForegroundColor Green
Write-Host "Remplacement 2 applique : $found2" -ForegroundColor Green
Write-Host "Verifie le fichier avant de commit (git diff), puis :"
Write-Host "  git add bibliotheque_coran.html"
Write-Host "  git commit -m 'Fix tajwid agent source contradiction'"
Write-Host "  git push"
