# KENTRO Mailvorlage

Obsidian-Plugin für E-Mail-Vorlagen, die in Outlook gleich aussehen sollen, egal ob Outlook Classic oder Outlook im Web.

Ein Code-Block mit der Kennung `mail` wird als formatierter Text angezeigt und bekommt oben rechts einen Knopf **Kopieren**. Der Knopf kopiert den Text als E-Mail-HTML:

- echte Aufzählungen mit Unterpunkten
- Arial 12 pt, Schrift schwarz
- Links als Links
- zwischen Absätzen, Überschriften und Listen genau eine Leerzeile

Eingefügt wird in Outlook mit normalem Strg+V.

## Beispiel

````markdown
```mail
Hallo [VORNAME],

danke für deine Unterlagen.

**Was wir noch brauchen:**

- Grundrisse mit Bemaßung
- Heizkörperliste
	- Foto des Verteilers bei Fußbodenheizung

Link zum Uploadbereich: [Upload](https://example.com)
```
````

Ohne Plugin zeigt Obsidian den Block als normalen Code-Block. Die Vorlage bleibt lesbar, kopiert dann aber nur Klartext.

## Installation über BRAT (empfohlen)

1. In Obsidian unter Einstellungen › Community-Plugins das Plugin **BRAT** installieren und einschalten.
2. Befehlspalette (Strg+P): **BRAT: Add a beta plugin for testing**.
3. Repo eintragen: `ecpwr/obsidian-mailtooutlook`, bestätigen.
4. Unter Community-Plugins **KENTRO Mailvorlage** einschalten.

Updates holt BRAT danach selbst.

## Manuelle Installation

1. Aus dem neuesten Release `main.js`, `manifest.json` und `styles.css` herunterladen.
2. Im Vault den Ordner `.obsidian/plugins/kentro-mailvorlage/` anlegen und die drei Dateien hineinlegen.
3. In Obsidian unter Community-Plugins neu laden und **KENTRO Mailvorlage** einschalten.

## Lizenz

MIT
