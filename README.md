# ✦ TH+ — TrueHard & More

<p align="center">
  <img src="icon.png" alt="TH+ mod icon" width="220">
</p>

<p align="center"><strong>A harder survival run for Mindustry v153.</strong></p>

<p align="center">
  <a href="README.ru.md">🇷🇺 Русский</a> ·
  <a href="README.uk.md">🇺🇦 Українська</a> ·
  <a href="README.zh-CN.md">🇨🇳 简体中文</a> ·
  <a href="README.md">🇬🇧 English</a>
</p>

![Mindustry](https://img.shields.io/badge/Mindustry-v153-5BD8FF?style=for-the-badge)
![Version](https://img.shields.io/badge/Mod-v1.0.0-FF4FA3?style=for-the-badge)
![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20RU%20%7C%20UK%20%7C%20ZH--CN-FFC857?style=for-the-badge)

**TH+** combines enemy carriers, a temporary last-stand power, and an optional TrueHard ruleset. The English bundle is the default; Russian, Ukrainian, and Simplified Chinese translations are included.

## Features

### 🧬 Enemy carriers
- With the feature enabled, an eligible enemy has a **50% chance** to become a carrier.
- When a carrier dies, there is a **50% chance** to release **five units of the same type**.
- Carriers and offspring move more slowly and reload more slowly. Player-controlled and allied units are excluded from carrier mutation.
- The separate “Vika” mutation may affect a player-controlled unit after a change/respawn (20% chance in the current script).

### ⚡ Flight of Last Resort
- When the sequence is triggered, an **8-second** energoneuron countdown precedes an energy burst.
- The burst restores health and enables an **8-second** empowered phase: +25% speed, +10% reload, +8% damage, 30× building speed, and very strong regeneration.
- The effect ends with a final death.

### ☠️ Optional TrueHard mode
- **Three lives** are shown in the in-game HUD.
- Player-team units: **−50% max health**. Enemy units: **+50% max health** and **+10% damage**.
- The friendly core tracks five distinct enemy projectile hits. After the fifth hit it is marked destroyed; if the player dies afterward, the sector is lost even if a life remains.

## Install

1. Download the ZIP from the repository's **Releases** page, or download the source and ZIP its contents with `mod.hjson` at the archive root.
2. In Mindustry, open **Settings → Game Data → Mods** (menu wording can vary by platform) and import the ZIP.
3. Enable **TH+ — TrueHard & More**. Open the **TH+** button in the main menu, then enable Carriers and/or TrueHard.
4. Restart the game if Mindustry requests it.

## Languages

| Language | Bundle |
|---|---|
| English (default) | `bundles/bundle.properties` |
| Русский | `bundles/bundle_ru.properties` |
| Українська | `bundles/bundle_uk_UA.properties` |
| 简体中文 | `bundles/bundle_zh_CN.properties` |

The bundle files follow Mindustry's mod localization convention. Menu labels, HUD text, status messages, and gameplay toasts use bundle keys.

## Compatibility and testing

- Target: **Mindustry v153**.
- Mod scripts: JavaScript (Mindustry's bundled Rhino environment).
- The archive and JavaScript syntax can be checked outside the game, but the exact runtime behavior must be tested in Mindustry v153 on each target platform. In particular, the death/respawn sequence and projectile/core interception deserve in-game validation. Please attach the game log when reporting a crash.

## Credits

- **Author:** ЕЕее1406
- **Project:** TrueHard and More
- **Game:** Mindustry by Anuken and contributors

## Contributing

Bug reports and translation improvements are welcome. Please include your Mindustry version, platform, steps to reproduce, and the relevant part of the game log.
