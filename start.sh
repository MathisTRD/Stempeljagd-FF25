#!/bin/bash
echo "🚀 Starte Stempeljagd Server..."
echo ""
echo "⚠️  SICHERHEITSHINWEIS:"
echo "   - Nur für lokale Netzwerke geeignet"
echo "   - Änderungen werden NICHT zwischen Geräten synchronisiert"
echo "   - Am besten: Ein Gerät als Hauptsteuerung verwenden"
echo ""
echo "📍 Öffne http://localhost:3000/main.html in deinem Browser"
echo "🌐 Andere Geräte im gleichen WiFi können zugreifen über:"
echo "   http://$(ifconfig | grep -E 'inet.*broadcast' | awk '{print $2}'):3000/main.html"
echo ""
echo "⏹️  Server stoppen mit Ctrl+C"
echo ""

python3 -m http.server 3000
