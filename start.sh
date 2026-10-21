#!/bin/bash
cd ~/bot-messenger
while true; do
  node index.js
  echo "Bot arrêté, redémarrage dans 10 s..."
  sleep 10
done
