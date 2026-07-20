#!/usr/bin/env bash
#
# Active la recherche de GIF dans Pulsar (bouton GIF de la zone de saisie).
#
# Google a fermé l'ancienne API Tenor et sa clé de démo publique. Il faut
# désormais une clé gratuite propre :
#   1. Aller sur https://console.cloud.google.com/apis/library/tenor.googleapis.com
#   2. Créer (ou choisir) un projet, puis « Activer » l'API Tenor.
#   3. Menu « Identifiants » > « Créer des identifiants » > « Clé API ».
#   4. Copier la clé (elle commence souvent par AIza...).
#
# La clé est saisie à l'aveugle : elle n'apparaît pas à l'écran et ne finit
# ni dans l'historique du shell ni dans les journaux.
#
# Usage (sur le serveur) :  ssh -t root@167.233.98.220 'bash /opt/pulsar/deploy/set-tenor-key.sh'
#
set -euo pipefail

ENV_FILE=/opt/pulsar/server/.env

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier introuvable : $ENV_FILE" >&2
  exit 1
fi

# Sans vrai terminal, la saisie masquée est IMPOSSIBLE : c'est la machine de
# l'utilisateur qui afficherait les caractères. On refuse plutôt que d'exposer.
if [ ! -t 0 ]; then
  echo "ERREUR : ce script exige un terminal interactif, sinon la cle" >&2
  echo "s'afficherait en clair a l'ecran." >&2
  echo "" >&2
  echo "Relancez avec l'option -t :" >&2
  echo "  ssh -t root@167.233.98.220 'bash /opt/pulsar/deploy/set-tenor-key.sh'" >&2
  exit 1
fi

echo "Activation des GIF (Tenor) pour Pulsar"
echo ""
echo "Collez votre cle API Tenor puis appuyez sur Entree."
echo "(Elle ne s'affichera pas : c'est normal, tapez ou collez a l'aveugle.)"
printf "Cle Tenor : "
read -rs TENOR_KEY
echo ""

if [ -z "$TENOR_KEY" ]; then
  echo "Aucune cle saisie. Rien n'a ete modifie." >&2
  exit 1
fi

# Copie de sécurité avant toute modification.
cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%s)"

# Retire l'ancienne ligne s'il y en avait une, pour remplacer au lieu d'empiler.
TMP=$(mktemp)
grep -vE '^(TENOR_API_KEY=|# GIF \(Tenor\))' "$ENV_FILE" > "$TMP" || true
mv "$TMP" "$ENV_FILE"

{
  echo ""
  echo "# GIF (Tenor). Configuré le $(date '+%d/%m/%Y a %H:%M')."
  echo "TENOR_API_KEY=$TENOR_KEY"
} >> "$ENV_FILE"

chown pulsar:pulsar "$ENV_FILE"
chmod 600 "$ENV_FILE"

systemctl restart pulsar
sleep 3

if systemctl is-active --quiet pulsar; then
  echo ""
  echo "Termine. Pulsar a redemarre et les GIF sont actifs."
  echo "Verification : la cle enregistree fait ${#TENOR_KEY} caracteres."
  echo ""
  echo "Testez sur https://join-pulsar.com : le bouton GIF doit afficher des resultats."
else
  echo "ATTENTION : Pulsar n'a pas redemarre correctement." >&2
  echo "Regardez :  journalctl -u pulsar -n 30 --no-pager" >&2
  exit 1
fi
