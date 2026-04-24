$modon = Get-Content 'logo_b64.txt' -Raw
$insite = Get-Content 'logo_insite_b64.txt' -Raw
$template = Get-Content 'src/lib/mailTemplates.template.ts' -Raw

$final = $template.Replace('__MODON_B64__', $modon.Trim())
$final = $final.Replace('__INSITE_B64__', $insite.Trim())

$final | Set-Content 'src/lib/mailTemplates.ts' -Encoding Ascii
