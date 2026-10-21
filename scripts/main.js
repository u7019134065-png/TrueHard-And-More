// TH+ | TrueHard & More — Mindustry v153
// Author: ЕЕее1406 | Release: 1.0.0

var settingKey = "eeee1406-matki-perenoschiki-enabled";
var hardSettingKey = "eeee1406-truehard-enabled";
var enabled = false;
var trueHard = false;
var checkedEnemies = {};
var breeders = {};
var creatingOffspring = false;
var suppressVikaOnce = false;
var scanTimer = 0;
var statusLabel = null;
var hardStatusLabel = null;
var hardHud = null;
var hardHudLabel = null;
var hudUpdateTimer = 0;
var runtimeErrorLogged = false;

// Localization: bundle.properties is the English source; language-specific bundles override it.
function loc(key){
    try{ return String(Core.bundle.get(key)); }catch(bundleError){ return key; }
}

// «Самки»
var carrierChance = 0.50;
var reproductionChance = 0.50;
var offspringCount = 5;
var vikaChance = 0.20;
var carrierColor = Color.valueOf("ff4fa3");
var offspringColor = Color.valueOf("ffad55");
var vikaColor = Color.valueOf("62eaff");
var chargeColor = Color.valueOf("ffc857");
var flightColor = Color.valueOf("b45cff");

// TrueHard / revive state. time is measured in game ticks (60 ticks = 1 second).
var lastStandData = {};
var livesByPlayer = {};
var coreHits = {};
var virtualCoreDestroyed = false;
var hardRulesApplied = false;
var savedCanGameOver = true;
var teamRuleSnapshots = {};
var hardUnitStats = {};
var coreSnapshots = {};
var coreSeenBullets = {};
var hardScanTimer = 0;
var hardCoreSafeHealth = 1.0e30;
var hardHudBuildAttempts = 0;
var lossInProgress = false;
var playerDeathsHandled = {};
var playerUnitOwners = {};
var lastControlledUnitByPlayer = {};
var hardRuleSnapshot = null;

var carrierEffect = extend(StatusEffect, "eeee1406-carrier-female", {});
carrierEffect.color = carrierColor;
carrierEffect.speedMultiplier = 0.65;
carrierEffect.reloadMultiplier = 0.60;
carrierEffect.permanent = true;
carrierEffect.show = false;
carrierEffect.applyEffect = Fx.spawn;
carrierEffect.applyColor = carrierColor;

var offspringEffect = extend(StatusEffect, "eeee1406-carrier-offspring", {});
offspringEffect.color = offspringColor;
offspringEffect.speedMultiplier = 0.65;
offspringEffect.reloadMultiplier = 0.60;
offspringEffect.permanent = true;
offspringEffect.show = false;
offspringEffect.applyEffect = Fx.spawn;
offspringEffect.applyColor = offspringColor;

var vikaEffect = extend(StatusEffect, "eeee1406-vika", {});
vikaEffect.color = vikaColor;
vikaEffect.speedMultiplier = 0.65;
vikaEffect.reloadMultiplier = 0.60;
vikaEffect.permanent = true;
vikaEffect.show = false;
vikaEffect.applyEffect = Fx.spawn;
vikaEffect.applyColor = vikaColor;

var chargeEffect = extend(StatusEffect, "eeee1406-energoneuron-charge", {});
chargeEffect.color = chargeColor;
chargeEffect.permanent = true;
chargeEffect.show = false;
chargeEffect.speedMultiplier = 0.75;
chargeEffect.reloadMultiplier = 0.75;
chargeEffect.applyEffect = Fx.spawn;
chargeEffect.applyColor = chargeColor;

var flightEffect = extend(StatusEffect, "eeee1406-letychiy-ishod", {});
flightEffect.color = flightColor;
flightEffect.speedMultiplier = 1.25;
flightEffect.reloadMultiplier = 1.10;
flightEffect.damageMultiplier = 1.08;
flightEffect.buildSpeedMultiplier = 30.0;
flightEffect.permanent = false;
flightEffect.show = true;
flightEffect.applyEffect = Fx.spawn;
flightEffect.applyColor = flightColor;

var trueHardEnemyEffect = extend(StatusEffect, "eeee1406-truehard-enemy-damage", {});
trueHardEnemyEffect.color = Color.valueOf("ff5544");
trueHardEnemyEffect.damageMultiplier = 1.0;
trueHardEnemyEffect.permanent = true;
trueHardEnemyEffect.show = false;

function isAuthority(){
    return Vars.net == null || !Vars.net.client();
}
function inGame(){
    return Vars.state != null && Vars.state.isGame();
}
function readNumber(entity, name){
    if(entity == null) return NaN;
    try{
        var value = entity[name];
        if(typeof value == "number") return value;
        if(typeof value == "function"){
            try{ value = entity[name](); if(typeof value == "number") return value; }catch(methodReadError){}
        }
    }catch(fieldReadError){}
    return NaN;
}
function readObject(entity, name){
    if(entity == null) return null;
    try{
        var value = entity[name];
        if(value != null && typeof value != "function") return value;
        if(typeof value == "function"){
            try{ value = entity[name](); if(value != null) return value; }catch(methodReadError){}
        }
    }catch(fieldReadError){}
    return null;
}
function writeNumber(entity, name, value){
    if(entity == null) return false;
    try{
        var member = entity[name];
        if(typeof member == "function"){
            entity[name](value);
            return true;
        }
    }catch(methodWriteError){}
    try{
        entity[name] = value;
        var check = readNumber(entity, name);
        return isNaN(check) || Math.abs(check - value) < 0.05;
    }catch(fieldWriteError){}
    return false;
}
function playerKey(player){
    if(player == null) return "none";
    var id = readNumber(player, "id");
    return isNaN(id) ? String(player) : String(id);
}
function unitKey(unit){
    if(unit == null) return "none";
    var id = readNumber(unit, "id");
    if(!isNaN(id)) return String(id);
    try{ return String(unit.hashCode()); }catch(hashError){}
    return String(unit);
}
function getUnitTeam(unit){ return readObject(unit, "team"); }
function getUnitType(unit){ return readObject(unit, "type"); }
function getUnitHealth(unit){ return readNumber(unit, "health"); }
function getUnitMaxHealth(unit){ return readNumber(unit, "maxHealth"); }
function setUnitHealth(unit, value){ return writeNumber(unit, "health", value); }
function setUnitMaxHealth(unit, value){ return writeNumber(unit, "maxHealth", value); }
function getUnitX(unit){ return readNumber(unit, "x"); }
function getUnitY(unit){ return readNumber(unit, "y"); }
function getUnitRotation(unit){ return readNumber(unit, "rotation"); }
function getBuildingHealth(build){ return readNumber(build, "health"); }
function getBuildingMaxHealth(build){ return readNumber(build, "maxHealth"); }
function setBuildingHealth(build, value){ return writeNumber(build, "health", value); }
function setBuildingMaxHealth(build, value){ return writeNumber(build, "maxHealth", value); }
function getBuildingX(build){ return readNumber(build, "x"); }
function getBuildingY(build){ return readNumber(build, "y"); }
function getBuildingTeam(build){ return readObject(build, "team"); }
function getBuildingBlock(build){ return readObject(build, "block"); }
function getBulletTeam(bullet){ return readObject(bullet, "team"); }

function isEnemy(unit){
    if(unit == null || Vars.state == null || Vars.state.rules == null) return false;
    if(unit.isPlayer()) return false;
    if(Vars.player != null && unit.team == Vars.player.team()) return false;
    if(getUnitTeam(unit) == Vars.state.rules.waveTeam) return true;
    if(Vars.player != null) return getUnitTeam(unit) != Vars.player.team();
    return false;
}
function showToast(message){
    if(!Vars.headless && Vars.ui != null && Vars.ui.hudfrag != null) Vars.ui.hudfrag.showToast(message);
}
function reportRuntimeError(context, error){
    if(runtimeErrorLogged) return;
    runtimeErrorLogged = true;
    print("[TH+ v1.0.0] " + context + ": " + error);
    if(inGame()) showToast(loc("thm.toast.runtime.error"));
}
function updateStatus(){
    if(statusLabel != null) statusLabel.setText(enabled ? loc("thm.status.carriers.enabled") : loc("thm.status.carriers.disabled"));
    if(hardStatusLabel != null) hardStatusLabel.setText(trueHard ? loc("thm.status.truehard.enabled") : loc("thm.status.truehard.disabled"));
}
function clearTrackedUnits(){
    checkedEnemies = {};
    breeders = {};
}
function setEnabled(value){
    enabled = value;
    Core.settings.put(settingKey, enabled);
    if(!enabled){
        Groups.unit.each(function(unit){
            unit.unapply(carrierEffect);
            unit.unapply(offspringEffect);
            unit.unapply(vikaEffect);
            unit.unapply(chargeEffect);
            unit.unapply(flightEffect);
        });
        clearTrackedUnits();
        lastStandData = {};
    }
    updateStatus();
}
function setTrueHard(value){
    if(trueHard == value){
        if(trueHard && inGame() && !hardRulesApplied) applyTrueHardRules();
        updateStatus(); updateHardHud();
        showToast(trueHard ? loc("thm.toast.truehard.active.short") : loc("thm.toast.truehard.disabled"));
        return;
    }
    if(trueHard && hardRulesApplied) restoreTrueHardRules();
    trueHard = value;
    Core.settings.put(hardSettingKey, trueHard);
    livesByPlayer = {};
    coreHits = {};
    coreSeenBullets = {};
    virtualCoreDestroyed = false;
    hardUnitStats = {};
    coreSnapshots = {};
    if(trueHard && inGame()){
        if(Vars.player != null) livesByPlayer[playerKey(Vars.player)] = 3;
        applyTrueHardRules();
    }
    updateStatus();
    updateHardHud();
    showToast(trueHard ? loc("thm.toast.truehard.active") : loc("thm.toast.truehard.disabled"));
}

function markAsCarrier(unit){
    if(unit == null || !isEnemy(unit)) return;
    checkedEnemies[unitKey(unit)] = true;
    breeders[unitKey(unit)] = true;
    unit.apply(carrierEffect);
    Fx.spawn.at(unit.x, unit.y, 0, carrierColor);
}
function markAsOffspring(unit){
    if(unit == null || !isEnemy(unit)) return;
    checkedEnemies[unitKey(unit)] = true;
    unit.apply(offspringEffect);
    Fx.spawn.at(unit.x, unit.y, 0, offspringColor);
}
function considerEnemy(unit){
    if(!enabled || !isAuthority() || !inGame() || unit == null || !isEnemy(unit)) return;
    var id = unitKey(unit);
    if(creatingOffspring){ markAsOffspring(unit); return; }
    if(checkedEnemies[id]) return;
    checkedEnemies[id] = true;
    if(unit.hasEffect(carrierEffect)){ breeders[id] = true; return; }
    if(unit.hasEffect(offspringEffect) || unit.hasEffect(vikaEffect)) return;
    if(Mathf.chance(carrierChance)) markAsCarrier(unit);
}
function spawnOffspring(dead){
    for(var i = 0; i < offspringCount; i++){
        var x = dead.x + Mathf.range(26);
        var y = dead.y + Mathf.range(26);
        var rotation = Mathf.random(360);
        var child = null;
        creatingOffspring = true;
        try{ child = dead.type.spawn(dead.team, x, y, rotation); }
        finally{ creatingOffspring = false; }
        if(child != null) markAsOffspring(child);
    }
    showToast(loc("thm.toast.carrier.burst"));
}

function makeReplacement(dead, player){
    if(dead == null || player == null) return null;
    var type = getUnitType(dead);
    var team = getUnitTeam(dead);
    var replacement = type.spawn(team, getUnitX(dead), getUnitY(dead), getUnitRotation(dead));
    if(replacement == null) return null;
    var replacementMax = getUnitMaxHealth(replacement);
    setUnitHealth(replacement, replacementMax * 1000.0);
    replacement.apply(chargeEffect, 8 * 60);
    suppressVikaOnce = true;
    try{ player.unit(replacement); }finally{ suppressVikaOnce = false; }
    return replacement;
}
function beginLastStand(dead, player, oldData){
    var replacement = makeReplacement(dead, player);
    if(replacement == null) return false;
    var data = oldData == null ? {player: player, unit: replacement, phase: "charge", time: 8 * 60} : oldData;
    data.player = player;
    data.unit = replacement;
    data.phase = "charge";
    lastStandData[unitKey(replacement)] = data;
    showToast(loc("thm.toast.energy.charge"));
    return true;
}
function ensureLives(player){
    var key = playerKey(player);
    if(livesByPlayer[key] == null) livesByPlayer[key] = 3;
    livesByPlayer[key] = Math.max(0, Math.min(3, livesByPlayer[key]));
    return livesByPlayer[key];
}
function playerHasBrokenCore(player){ return virtualCoreDestroyed; }
function finishGameAsLoss(){
    if(lossInProgress || Vars.state == null) return;
    lossInProgress = true;
    var winner = Team.derelict;
    try{
        if(Vars.state.rules != null){
            winner = Vars.state.rules.waveTeam;
            Vars.state.rules.canGameOver = true;
        }
    }catch(stateLossError){}
    try{
        if(Vars.state.rules != null && Vars.state.rules.sector != null){
            var sector = Vars.state.rules.sector;
            if(sector.info != null){
                sector.info.hasCore = false;
                sector.info.saveInfo();
            }
        }
    }catch(sectorLossError){
        print("[TH+ v1.0.0] Sector-loss persistence warning: " + sectorLossError);
    }
    var ended = false;
    try{
        if(Vars.logic != null){
            Vars.logic.gameOver(winner);
            ended = Vars.state.gameOver || !Vars.state.isGame();
        }
    }catch(logicLossError){ print("[TH+ v1.0.0] Native game-over warning: " + logicLossError); }
    if(!ended){
        try{ Events.fire(new GameOverEvent(winner)); }catch(eventLossError){}
        try{
            Vars.state.gameOver = true;
            Vars.state.won = false;
            if(Vars.ui != null && Vars.ui.restart != null) Vars.ui.restart.show(winner);
            ended = true;
        }catch(uiLossError){ print("[TH+ v1.0.0] Could not show defeat screen: " + uiLossError); }
    }
    showToast(loc("thm.toast.defeat"));
}
function rememberControlledPlayers(){
    try{
        Groups.player.each(function(player){
            if(player == null) return;
            var pkey = playerKey(player);
            if(livesByPlayer[pkey] == null && trueHard) livesByPlayer[pkey] = 3;
            var controlled = readObject(player, "unit");
            if(controlled != null){
                var ukey = unitKey(controlled);
                playerUnitOwners[ukey] = player;
                lastControlledUnitByPlayer[pkey] = controlled;
            }
        });
    }catch(rememberPlayerError){}
}
function findPlayerForDeadUnit(unit){
    if(unit == null) return null;
    var key = unitKey(unit);
    if(playerUnitOwners[key] != null) return playerUnitOwners[key];
    try{
        if(unit.isPlayer()){
            var direct = unit.getPlayer();
            if(direct != null) return direct;
        }
    }catch(directPlayerError){}
    var found = null;
    try{
        Groups.player.each(function(player){
            if(found != null || player == null) return;
            var controlled = readObject(player, "unit");
            if(controlled == unit) found = player;
        });
    }catch(groupPlayerError){}
    return found;
}
function handleFinalPlayerDeath(player){
    if(!trueHard || !isAuthority() || player == null) return;
    var key = playerKey(player);
    var deathStamp = String(key) + ":" + String(Math.floor(Number(Time.time)));
    if(playerDeathsHandled[deathStamp]) return;
    playerDeathsHandled[deathStamp] = true;
    var left = ensureLives(player);
    if(playerHasBrokenCore(player)){
        showToast(loc("thm.toast.core.death.loss"));
        finishGameAsLoss();
        return;
    }
    if(left <= 1){
        livesByPlayer[key] = 0;
        updateHardHud();
        showToast(loc("thm.toast.lives.empty"));
        finishGameAsLoss();
        return;
    }
    livesByPlayer[key] = left - 1;
    updateHardHud();
    showToast(loc("thm.toast.lives.left").replace("{0}", String(left - 1)));
}
function localLastStand(){
    if(Vars.player == null) return null;
    for(var id in lastStandData){
        var data = lastStandData[id];
        if(data != null && data.player == Vars.player) return data;
    }
    return null;
}
function updateLastStand(){
    for(var id in lastStandData){
        var data = lastStandData[id];
        if(data == null || data.unit == null){ delete lastStandData[id]; continue; }
        var unit = data.unit;
        if(!unit.isValid()) continue;
        if(data.phase == "charge"){
            if(unit.health < unit.maxHealth * 100.0) unit.health = unit.maxHealth * 100.0;
            data.time -= Time.delta;
            if(data.time <= 0){
                data.phase = "flight";
                data.time = 8 * 60;
                unit.health = unit.maxHealth;
                unit.unapply(chargeEffect);
                unit.apply(flightEffect, 8 * 60);
                Fx.spawn.at(unit.x, unit.y, 0, flightColor);
                showToast(loc("thm.toast.energy.burst"));
            }
        }else if(data.phase == "flight"){
            if(unit.maxHealth > 0) unit.heal(unit.maxHealth * 15.0 * Time.delta / 60.0);
            data.time -= Time.delta;
            if(data.time <= 0){
                data.phase = "finalizing";
                unit.unapply(flightEffect);
                showToast(loc("thm.toast.flight.end"));
                unit.kill();
            }
        }
    }
}

function localPlayerTeam(){
    if(Vars.player != null) return Vars.player.team();
    if(Vars.state != null && Vars.state.rules != null) return Vars.state.rules.defaultTeam;
    return Team.sharded;
}
function hardUnitMultiplier(unit){
    if(unit == null || getUnitTeam(unit) == Team.derelict) return 1.0;
    return getUnitTeam(unit) == localPlayerTeam() ? 0.50 : 1.50;
}
function originalTeamHealthFactor(team){
    if(hardRuleSnapshot == null) return 1.0;
    var entry = hardRuleSnapshot.teams[String(team.id)];
    if(entry == null || !(entry.health > 0)) return 1.0;
    return entry.health;
}
function originalGlobalHealthFactor(){
    return hardRuleSnapshot == null ? 1.0 : hardRuleSnapshot.globalHealth;
}
function applyTrueHardUnit(unit, freshSpawn){
    if(!trueHard || unit == null || getUnitTeam(unit) == Team.derelict) return;
    try{ if(unit.hasEffect(chargeEffect) || unit.hasEffect(flightEffect)) return; }catch(effectCheckError){}
    var currentHealth = getUnitHealth(unit);
    var currentMax = getUnitMaxHealth(unit);
    if(isNaN(currentHealth) || isNaN(currentMax) || currentHealth <= 0 || currentMax <= 0) return;
    var id = unitKey(unit);
    var team = getUnitTeam(unit);
    var type = getUnitType(unit);
    var enemy = team != localPlayerTeam();
    var factor = enemy ? 1.50 : 0.50;
    var old = hardUnitStats[id];
    var baseMax = old != null && old.unit == unit && old.team == team ? old.baseMax : Number(type == null ? NaN : type.health);
    if(!(baseMax > 0) || isNaN(baseMax)) baseMax = currentMax;
    var targetMax = Math.max(1, baseMax * originalGlobalHealthFactor() * originalTeamHealthFactor(team) * factor);
    if(old != null && old.unit == unit && old.team == team){
        if(Math.abs(currentMax - targetMax) > 0.5){
            var fractionOld = Math.max(0, Math.min(1, currentHealth / Math.max(1, currentMax)));
            setUnitMaxHealth(unit, targetMax);
            setUnitHealth(unit, Math.max(1, targetMax * fractionOld));
        }else if(currentHealth > targetMax){
            setUnitHealth(unit, targetMax);
        }
        if(enemy){ if(!unit.hasEffect(trueHardEnemyEffect)) unit.apply(trueHardEnemyEffect); }
        else unit.unapply(trueHardEnemyEffect);
        return;
    }
    var fraction = Math.max(0, Math.min(1, currentHealth / Math.max(1, currentMax)));
    hardUnitStats[id] = {unit: unit, team: team, baseMax: baseMax, scaledMax: targetMax, multiplier: factor};
    setUnitMaxHealth(unit, targetMax);
    setUnitHealth(unit, Math.max(1, freshSpawn ? targetMax : targetMax * fraction));
    var checkMax = getUnitMaxHealth(unit);
    if(isNaN(checkMax) || Math.abs(checkMax - targetMax) > 0.5){
        try{ unit.statusMaxHealth(targetMax); }catch(statusHealthError){}
    }
    if(enemy) unit.apply(trueHardEnemyEffect);
    else unit.unapply(trueHardEnemyEffect);
}
function restoreHardUnits(){
    for(var id in hardUnitStats){
        var snap = hardUnitStats[id];
        if(snap == null || snap.unit == null) continue;
        var unit = snap.unit;
        try{
            var curMax = getUnitMaxHealth(unit);
            var curHealth = getUnitHealth(unit);
            if(curHealth > 0){
                var ratio = curMax > 0 ? Math.max(0, Math.min(1, curHealth / curMax)) : 1;
                setUnitMaxHealth(unit, snap.baseMax);
                setUnitHealth(unit, Math.max(1, Math.min(snap.baseMax, snap.baseMax * ratio)));
            }
            unit.unapply(trueHardEnemyEffect);
        }catch(restoreUnitError){}
    }
    Groups.unit.each(function(unit){ if(unit != null) unit.unapply(trueHardEnemyEffect); });
    hardUnitStats = {};
}
function isCoreBlock(block){
    if(block == null) return false;
    var name = readObject(block, "name");
    if(name == null) return false;
    return String(name).toLowerCase().indexOf("core") >= 0;
}
function corePositionKey(build){
    return String(Math.round(getBuildingX(build))) + ":" + String(Math.round(getBuildingY(build)));
}
function keepCoreAlive(build){
    if(build == null) return;
    var block = getBuildingBlock(build);
    if(block == null || !isCoreBlock(block) || getBuildingTeam(build) != localPlayerTeam()) return;
    var key = corePositionKey(build);
    var snap = coreSnapshots[key];
    if(snap == null || snap.build != build){
        var currentMax = getBuildingMaxHealth(build), currentHealth = getBuildingHealth(build);
        coreSnapshots[key] = {build: build, maxHealth: currentMax, health: currentHealth};
    }
    setBuildingMaxHealth(build, hardCoreSafeHealth);
    setBuildingHealth(build, hardCoreSafeHealth);
}
function forEachFriendlyCore(callback){
    var team = localPlayerTeam();
    if(team == null) return;
    try{
        var cores = team.cores();
        for(var i = cores.size - 1; i >= 0; i--){
            var core = cores.get(i);
            if(core != null && core.block != null && isCoreBlock(core.block)) callback(core);
        }
    }catch(coreListError){}
}
function protectFriendlyCores(){
    if(!trueHard || !inGame()) return;
    forEachFriendlyCore(function(core){ keepCoreAlive(core); });
}
function hasEntries(map){
    for(var key in map){ return true; }
    return false;
}
function restoreTrueHardRules(){
    if(!hardRulesApplied && !hasEntries(hardUnitStats) && !hasEntries(coreSnapshots) && !hasEntries(teamRuleSnapshots)) return;
    restoreHardUnits();
    for(var key in coreSnapshots){
        var snap = coreSnapshots[key];
        if(snap == null || snap.build == null) continue;
        try{
            if(snap.build.isValid()){
                setBuildingMaxHealth(snap.build, snap.maxHealth);
                setBuildingHealth(snap.build, Math.max(1, Math.min(snap.maxHealth, snap.health)));
            }
        }catch(restoreCoreError){}
    }
    coreSnapshots = {};
    coreSeenBullets = {};
    try{
        if(Vars.state != null && Vars.state.rules != null){
            Vars.state.rules.canGameOver = savedCanGameOver;
            if(hardRuleSnapshot != null){
                var rules = Vars.state.rules;
                for(var i = 0; i < Team.all.length; i++){
                    var team = Team.all[i];
                    var entry = hardRuleSnapshot.teams[String(team.id)];
                    if(entry == null) continue;
                    var teamRules = rules.teams.get(team);
                    teamRules.unitHealthMultiplier = entry.health;
                    teamRules.unitDamageMultiplier = entry.damage;
                }
            }
        }
    }catch(restoreRuleError){ print("[TH+ v1.0.0] Rule restore warning: " + restoreRuleError); }
    hardRuleSnapshot = null;
    teamRuleSnapshots = {};
    hardRulesApplied = false;
}
function applyTrueHardRules(){
    if(!trueHard || !inGame() || !isAuthority() || hardRulesApplied) return;
    var rules = Vars.state.rules;
    savedCanGameOver = rules.canGameOver;
    rules.canGameOver = false;
    hardRuleSnapshot = {globalHealth: rules.unitHealthMultiplier, globalDamage: rules.unitDamageMultiplier, teams: {}};
    teamRuleSnapshots = {};
    var localTeam = localPlayerTeam();
    for(var i = 0; i < Team.all.length; i++){
        var team = Team.all[i];
        var teamRules = rules.teams.get(team);
        var snapshot = {health: teamRules.unitHealthMultiplier, damage: teamRules.unitDamageMultiplier};
        hardRuleSnapshot.teams[String(team.id)] = snapshot;
        teamRuleSnapshots[String(team.id)] = snapshot;
        teamRules.unitHealthMultiplier = snapshot.health * (team == localTeam ? 0.50 : 1.50);
        teamRules.unitDamageMultiplier = snapshot.damage * (team == localTeam ? 1.0 : 1.10);
    }
    hardUnitStats = {};
    coreSnapshots = {};
    coreSeenBullets = {};
    Groups.unit.each(function(unit){ applyTrueHardUnit(unit, false); });
    protectFriendlyCores();
    hardRulesApplied = true;
}

Events.on(UnitSpawnEvent, function(event){
    if(event == null) return;
    considerEnemy(event.unit);
    if(trueHard) applyTrueHardUnit(event.unit, true);
});
Events.on(UnitCreateEvent, function(event){
    if(event == null) return;
    considerEnemy(event.unit);
    if(trueHard) applyTrueHardUnit(event.unit, true);
});
Events.on(UnitUnloadEvent, function(event){
    if(event == null) return;
    considerEnemy(event.unit);
    if(trueHard) applyTrueHardUnit(event.unit, true);
});
Events.on(UnitDestroyEvent, function(event){
    if(event == null || event.unit == null) return;
    var dead = event.unit;
    var id = unitKey(dead);
    delete hardUnitStats[id];
    var player = null;
    var active = lastStandData[id];
    if(active != null){
        player = active.player;
        delete lastStandData[id];
        if(active.phase == "charge"){
            if(beginLastStand(dead, player, active)) return;
        }else{
            handleFinalPlayerDeath(player);
            return;
        }
    }else{
        player = findPlayerForDeadUnit(dead);
        delete playerUnitOwners[id];
        if(player != null){
            if(enabled && isAuthority() && inGame()){
                if(beginLastStand(dead, player, null)) return;
            }
            handleFinalPlayerDeath(player);
            return;
        }
    }
    var wasCarrier = breeders[id] === true;
    delete breeders[id];
    delete checkedEnemies[id];
    if(!enabled || !isAuthority() || !wasCarrier) return;
    if(Mathf.chance(reproductionChance)) spawnOffspring(dead);
});
Events.on(UnitChangeEvent, function(event){
    if(event == null || event.player == null || event.unit == null) return;
    var pkey = playerKey(event.player);
    var previousUnit = lastControlledUnitByPlayer[pkey];
    if(previousUnit != null && previousUnit != event.unit) delete playerUnitOwners[unitKey(previousUnit)];
    playerUnitOwners[unitKey(event.unit)] = event.player;
    lastControlledUnitByPlayer[pkey] = event.unit;
    if(trueHard){ ensureLives(event.player); applyTrueHardUnit(event.unit, false); }
    if(!enabled || !isAuthority()) return;
    if(suppressVikaOnce) return;
    if(event.unit.team != event.player.team()) return;
    if(event.unit.hasEffect(vikaEffect) || event.unit.hasEffect(flightEffect)) return;
    if(lastStandData[unitKey(event.unit)] != null) return;
    if(Mathf.chance(vikaChance)){
        event.unit.apply(vikaEffect);
        Fx.spawn.at(event.unit.x, event.unit.y, 0, vikaColor);
        showToast(loc("thm.toast.vika"));
    }
});

function registerCoreBulletHit(build, bullet){
    if(!trueHard || !isAuthority() || !inGame() || build == null || bullet == null || virtualCoreDestroyed) return;
    var block = getBuildingBlock(build);
    if(block == null || !isCoreBlock(block) || getBuildingTeam(build) != localPlayerTeam()) return;
    if(getBulletTeam(bullet) == getBuildingTeam(build)) return;
    var key = corePositionKey(build);
    if(coreSeenBullets[key] == null) coreSeenBullets[key] = {};
    var bid = readNumber(bullet, "id");
    var bulletKey = isNaN(bid) ? String(bullet) : String(bid);
    var now = Number(Time.time);
    var previous = coreSeenBullets[key][bulletKey];
    if(previous != null && previous.bullet == bullet && now - previous.time < 3) return;
    coreSeenBullets[key][bulletKey] = {bullet: bullet, time: now};
    for(var oldBullet in coreSeenBullets[key]){
        if(now - coreSeenBullets[key][oldBullet].time > 180) delete coreSeenBullets[key][oldBullet];
    }
    var hits = (coreHits[key] || 0) + 1;
    coreHits[key] = hits;
    if(hits >= 5){
        virtualCoreDestroyed = true;
        showToast(loc("thm.toast.core.destroyed"));
    }else{
        showToast(loc("thm.toast.core.hits").replace("{0}", String(hits)));
    }
    updateHardHud();
}
Events.on(BuildDamageEvent, function(event){
    if(!trueHard || !isAuthority() || !inGame() || event == null) return;
    var build = event.build;
    var bullet = event.source;
    if(build == null || !isCoreBlock(getBuildingBlock(build))) return;
    keepCoreAlive(build);
    registerCoreBulletHit(build, bullet);
});
Events.on(CoreChangeEvent, function(event){
    try{
        if(trueHard && isAuthority() && event != null && event.core != null){
            var changedCore = event.core;
            Time.run(2, function(){
                try{ if(trueHard && inGame()) keepCoreAlive(changedCore); }catch(coreChangeDeferredError){}
            });
        }
    }catch(coreChangeError){}
});
Events.on(BuildingBulletDestroyEvent, function(event){
    if(event == null || event.build == null) return;
    var build = event.build;
    var bullet = event.bullet;
    registerCoreBulletHit(build, bullet);
    if(trueHard && !virtualCoreDestroyed && getBuildingBlock(build) != null && isCoreBlock(getBuildingBlock(build)) && getBuildingTeam(build) == localPlayerTeam()){
        try{
            var tile = readObject(build, "tile");
            var block = getBuildingBlock(build);
            if(tile != null && tile.build == null && block != null){
                tile.setBlock(block, getBuildingTeam(build), readNumber(build, "rotation"));
                var restored = tile.build;
                if(restored != null) keepCoreAlive(restored);
            }else{
                keepCoreAlive(build);
            }
        }catch(coreFallbackError){}
    }
});

Events.run(Trigger.update, function(){
    try{
        if(!Vars.headless && (hardHud == null || hardHud.parent == null)) buildHardHud();
        if(!inGame() || !isAuthority()){
            updateHardHud();
            return;
        }
        if(trueHard) rememberControlledPlayers();
        if(enabled){
            scanTimer += Time.delta;
            if(scanTimer >= 30){
                scanTimer = 0;
                Groups.unit.each(function(unit){ considerEnemy(unit); });
            }
            updateLastStand();
        }
        if(trueHard && !hardRulesApplied) applyTrueHardRules();
        if(trueHard){
            hardScanTimer += Time.delta;
            if(hardScanTimer >= 4){
                hardScanTimer = 0;
                Groups.unit.each(function(unit){ applyTrueHardUnit(unit); });
            }
            protectFriendlyCores();
        }
        hudUpdateTimer += Time.delta;
        if(hudUpdateTimer >= 6){
            hudUpdateTimer = 0;
            updateHardHud();
        }
    }catch(updateError){ reportRuntimeError("update", updateError); }
});
Events.run(Trigger.drawOver, function(){
    if(!enabled || Vars.state == null || !Vars.state.isGame()) return;
    Groups.unit.each(function(unit){
        var color = null;
        var id = unitKey(unit);
        var stand = lastStandData[id];
        if(stand != null) color = stand.phase == "charge" ? chargeColor : flightColor;
        else if(unit.hasEffect(vikaEffect)) color = vikaColor;
        else if(unit.hasEffect(carrierEffect)) color = carrierColor;
        else if(unit.hasEffect(offspringEffect)) color = offspringColor;
        if(color == null) return;
        Draw.color(color);
        Lines.stroke(2.5);
        Lines.circle(unit.x, unit.y, unit.type.hitSize / 2 + 6);
    });
    Draw.reset();
});

function buildHardHud(){
    if(Vars.headless || Vars.ui == null || Vars.ui.hudGroup == null) return false;
    try{
        if(hardHud != null && hardHud.parent != null) return true;
        hardHud = new Table();
        hardHud.setFillParent(true);
        hardHud.top().right().pad(10);
        var screenWidth = 480;
        try{ screenWidth = Core.graphics.getWidth(); }catch(screenWidthError){}
        var labelWidth = Math.max(130, Math.min(250, screenWidth * 0.42));
        hardHudLabel = hardHud.add("", Styles.outlineLabel).width(labelWidth).wrap().left().get();
        Vars.ui.hudGroup.add(hardHud);
        hardHud.visible = false;
        hardHudBuildAttempts++;
        return true;
    }catch(hudCreateError){
        hardHud = null;
        hardHudLabel = null;
        if(hardHudBuildAttempts < 3) print("[TH+ v1.0.0] HUD creation attempt failed: " + hudCreateError);
        return false;
    }
}
function getDisplayedCoreHits(){
    var hits = 0;
    for(var key in coreHits) hits = Math.max(hits, coreHits[key] || 0);
    return Math.min(5, hits);
}
function updateHardHud(){
    if(hardHud == null || hardHud.parent == null || hardHudLabel == null) buildHardHud();
    if(hardHud == null || hardHudLabel == null || Vars.state == null) return;
    var localStand = localLastStand();
    var visible = Vars.state.isGame() && (trueHard || localStand != null);
    hardHud.visible = visible;
    if(!visible) return;
    var lines = [];
    if(trueHard){
        var left = Vars.player == null ? 3 : ensureLives(Vars.player);
        var hearts = "";
        for(var i = 0; i < 3; i++) hearts += (i < left ? "[scarlet]♥[] " : "[gray]♡[] ");
        lines.push(loc("thm.hud.title"));
        lines.push("[white]" + hearts + "[]");
        lines.push(loc("thm.hud.lives").replace("{0}", String(left)));
        lines.push(virtualCoreDestroyed
            ? loc("thm.hud.core.destroyed")
            : loc("thm.hud.core.hits").replace("{0}", String(getDisplayedCoreHits())));
    }
    if(localStand != null){
        if(localStand.phase == "charge") lines.push(loc("thm.hud.charge").replace("{0}", String(Math.max(0, Math.ceil(localStand.time / 60)))));
        else if(localStand.phase == "flight") lines.push(loc("thm.hud.flight").replace("{0}", String(Math.max(0, Math.ceil(localStand.time / 60)))));
    }
    hardHudLabel.setText(lines.join("\n"));
}
Events.on(WorldLoadBeginEvent, function(){
    try{ if(hardRulesApplied) restoreTrueHardRules(); }
    catch(worldBeginError){ reportRuntimeError("world-load begin", worldBeginError); }
});
Events.on(WorldLoadEvent, function(){
    try{
        clearTrackedUnits();
        scanTimer = 0;
        lastStandData = {};
        livesByPlayer = {};
        coreHits = {};
        coreSeenBullets = {};
        virtualCoreDestroyed = false;
        hardRulesApplied = false;
        teamRuleSnapshots = {};
        hardRuleSnapshot = null;
        hardUnitStats = {};
        coreSnapshots = {};
        hardScanTimer = 0;
        lossInProgress = false;
        playerDeathsHandled = {};
        playerUnitOwners = {};
        lastControlledUnitByPlayer = {};
        if(trueHard){
            Groups.player.each(function(player){ livesByPlayer[playerKey(player)] = 3; });
            if(Vars.player != null) livesByPlayer[playerKey(Vars.player)] = 3;
            hardRulesApplied = false;
        }
        updateHardHud();
    }catch(worldLoadError){
        print("[TH+ v1.0.0] World-load warning: " + worldLoadError);
        showToast(loc("thm.toast.init.error"));
    }
});
Events.on(ClientLoadEvent, function(){
    try{
        enabled = Core.settings.getBool(settingKey, false);
        trueHard = Core.settings.getBool(hardSettingKey, false);
        var dialog = new BaseDialog(loc("thm.menu.title"));
        statusLabel = dialog.cont.add("").pad(8).get();
        dialog.cont.row();
        dialog.cont.button(loc("thm.menu.carriers.enable"), function(){ setEnabled(true); }).size(280, 48).pad(4).row();
        dialog.cont.button(loc("thm.menu.carriers.disable"), function(){ setEnabled(false); }).size(280, 48).pad(4).row();
        dialog.cont.image(Tex.whiteui).color(Color.gray).height(2).growX().pad(8).row();
        hardStatusLabel = dialog.cont.add("").pad(8).get();
        dialog.cont.row();
        dialog.cont.button(loc("thm.menu.truehard.enable"), function(){ setTrueHard(true); }).size(280, 48).pad(4).row();
        dialog.cont.button(loc("thm.menu.truehard.disable"), function(){ setTrueHard(false); }).size(280, 48).pad(4).row();
        dialog.cont.add(loc("thm.menu.info")).width(300).wrap().pad(8);
        dialog.closeOnBack();
        updateStatus();
        try{ buildHardHud(); }
        catch(hudError){ print("[TH+ v1.0.0] HUD init warning: " + hudError); }
        Vars.ui.menufrag.addButton(loc("thm.menu.title"), function(){
            updateStatus();
            dialog.show();
        });
    }catch(clientLoadError){ reportRuntimeError("client-load UI", clientLoadError); }
});
