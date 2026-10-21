#!/bin/bash
V="${VOLUME_DIR:-/data}"
mkdir -p "$V"
for f in economie.json niveaux.json membres.json; do
  if [ ! -f "$V/$f" ]; then
    if [ -f "$f" ]; then cp "$f" "$V/$f"; else echo "{}" > "$V/$f"; fi
  fi
  rm -f "$f"; ln -s "$V/$f" "$f"
done
[ -f "$V/rappels.json" ] || echo "[]" > "$V/rappels.json"
rm -f rappels.json; ln -s "$V/rappels.json" rappels.json
if [ ! -d "$V/data" ]; then
  if [ -d data ]; then cp -r data "$V/data"; else mkdir -p "$V/data"; fi
fi
rm -rf data; ln -s "$V/data" data
[ -n "$APPSTATE" ] && printf '%s' "$APPSTATE" > "$V/appstate.json"
[ -f "$V/appstate.json" ] && { rm -f appstate.json; ln -s "$V/appstate.json" appstate.json; }
[ -n "$GROQ_KEY" ] && printf '%s' "$GROQ_KEY" > groq.key
[ -n "$CLAUDE_KEY" ] && printf '%s' "$CLAUDE_KEY" > claude.key
exec node index.js
