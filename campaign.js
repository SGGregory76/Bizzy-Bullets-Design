// campaign.js

// 1. Data structures (monsters, NPCs, locations, quests, loot tables)

const MONSTERS = {
  "Goblin Scout": {
    cr: 0.25,
    hp: "2d6+2",
    ac: 15,
    traits: ["Nimble Escape", "Pack Tactics"],
    lootTable: ["5 sp", "1d4 arrows", "goblin tooth necklace"]
  },
  "Goblin Captain": {
    cr: 1,
    hp: "4d8+4",
    ac: 17,
    traits: ["Leadership (goblins within 30 ft)"],
    lootTable: ["20 gp", "Shortsword (fine steel)", "Goblin Captain’s Banner"]
  },
  "Owlbear": {
    cr: 3,
    hp: "7d10+14",
    ac: 13,
    traits: ["Keen Sight", "Multiattack"],
    lootTable: ["Owlbear feather (rare alchemy ingredient)", "50 gp (for hide)"]
  },
  // …add as many monsters as you like…
};

const NPCS = {
  "Elaria Silverleaf": {
    role: "Elven Ranger",
    stats: { str: 10, dex: 18, con: 12, int: 14, wis: 16, cha: 11 },
    gear: ["Longbow +1", "Quiver (20 arrows)", "Cloak of Elvenkind"],
    personality: "Stoic, but secretly mourning her lost kingdom"
  },
  "Brom Ironfist": {
    role: "Dwarven Blacksmith",
    stats: { str: 16, dex: 10, con: 18, int: 12, wis: 13, cha: 9 },
    gear: ["Smith’s Tools", "Warhammer", "Blacksmith Apron"],
    personality: "Gruff exterior, heart of gold"
  },
  // …etc…
};

const LOCATIONS = {
  "Whispering Woods": {
    type: "Forest",
    description: "A mist-filled forest where the trees seem to whisper secrets at dusk.",
    monsters: ["Goblin Scout", "Owlbear"],
    hazards: ["Dense fog (–2 to perception)", "Hidden quicksand pits"],
    loot: ["Herb: Whispermoss (heals 1d4 HP)"]
  },
  "Stormpeak Keep": {
    type: "Abandoned Fortress",
    description: "A ruined keep on a cliff, battered by storms for decades.",
    monsters: ["Goblin Captain", "Owlbear"],
    traps: [
      "Collapsing battlement (DEX save DC 13 or fall 2d6 bludgeoning)",
      "Poisoned arrow trap (CON save DC 12 or 1d8 poison)"
    ],
    loot: [
      "Ancient banner (worth 100 gp to collectors)",
      "Chest with 200 gp hidden inside"
    ]
  },
  // …plus more…
};

const QUESTS = [
  {
    title: "The Goblin Menace",
    objective:
      "Clear out the goblin camp in the Whispering Woods before they raid local farms.",
    levelRange: [1, 3],
    location: "Whispering Woods",
    reward: "50 gp each + a magic trinket"
  },
  {
    title: "Secrets of Stormpeak Keep",
    objective:
      "Investigate Stormpeak Keep to find the source of the undead sightings.",
    levelRange: [3, 5],
    location: "Stormpeak Keep",
    reward: "150 gp each + rare scroll of Fireball"
  },
  // …etc…
];

const LOOT = {
  common: ["10 gp", "Healing Potion (1d4+1 HP)", "Dagger +1"],
  uncommon: [
    "Cloak of Elvenkind",
    "Boots of Striding and Springing",
    "Ring of Protection +1"
  ],
  rare: ["+1 Longsword", "Wand of Web (7 charges)", "Bag of Holding"],
  very_rare: ["+2 Plate Armor", "Staff of Fire (10 charges)", "Vorpal Sword"],
  legendary: ["+3 Flame Tongue Sword", "Rod of Lordly Might", "Cloak of Invisibility"]
};

// 2. Dice-roller utility (e.g. “2d6+3” → random number)
function rollDice(formula) {
  // Basic parser: "2d6+3"
  const [dicePart, bonusPart] = formula.split("+");
  const [num, die] = dicePart.split("d").map(Number);
  const bonus = bonusPart ? parseInt(bonusPart, 10) : 0;
  let total = 0;
  for (let i = 0; i < num; i++) {
    total += Math.floor(Math.random() * die) + 1;
  }
  return total + bonus;
}

// 3. Generate a monster instance (with rolled HP, one random loot)
function generateMonsterInstance(name) {
  const m = MONSTERS[name];
  const hp = rollDice(m.hp);
  const loot = m.lootTable[Math.floor(Math.random() * m.lootTable.length)];
  return {
    name,
    cr: m.cr,
    hp,
    ac: m.ac,
    traits: m.traits,
    loot
  };
}

// 4. Generate an NPC (shallow copy)
function generateNPC(name) {
  const n = Object.assign({}, NPCS[name]);
  n.name = name;
  return n;
}

// 5. Generate an encounter for a location & party level
function generateEncounter(locationName, partyLevel) {
  const loc = LOCATIONS[locationName];
  // filter monsters by CR ≤ partyLevel
  let possible = loc.monsters.filter((mName) => MONSTERS[mName].cr <= partyLevel);
  if (possible.length === 0) {
    possible = loc.monsters; // fallback
  }
  const numMonsters = 1 + Math.floor(Math.random() * 3); // 1–3 monsters
  const encounterList = [];
  for (let i = 0; i < numMonsters; i++) {
    const pick = possible[Math.floor(Math.random() * possible.length)];
    encounterList.push(generateMonsterInstance(pick));
  }
  return {
    location: locationName,
    description: loc.description,
    encounter: encounterList,
    hazards: loc.hazards || [],
    traps: loc.traps || [],
    loot: loc.loot[Math.floor(Math.random() * loc.loot.length)]
  };
}

// 6. Pick a random quest for the party level
function pickRandomQuest(partyLevel) {
  const candidates = QUESTS.filter(
    (q) => partyLevel >= q.levelRange[0] && partyLevel <= q.levelRange[1]
  );
  return candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : QUESTS[Math.floor(Math.random() * QUESTS.length)];
}

// 7. Generate random treasure item
function generateTreasure(tier) {
  const pool = LOOT[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

// 8. Build a full campaign (with multiple quests)
function buildCampaign(partyLevel = 2, numQuests = 3) {
  const campaign = {
    title: `Auto-Generated Campaign (Lvl ${partyLevel})`,
    quests: [],
    encounters: [],
    npcs: [],
    treasures: []
  };

  for (let i = 0; i < numQuests; i++) {
    const quest = pickRandomQuest(partyLevel);
    campaign.quests.push(quest);

    const encounter = generateEncounter(quest.location, partyLevel);
    campaign.encounters.push(encounter);

    // pick a random NPC (just pick any key from NPCS)
    const npcNames = Object.keys(NPCS);
    const npcPick = npcNames[Math.floor(Math.random() * npcNames.length)];
    campaign.npcs.push(generateNPC(npcPick));

    // random treasure tier (for example: common/uncommon/rare)
    const tiers = ["common", "uncommon", "rare"];
    const tierPick = tiers[Math.floor(Math.random() * tiers.length)];
    campaign.treasures.push({
      quest: quest.title,
      item: generateTreasure(tierPick)
    });
  }
  return campaign;
}

// 9. Expose a function to print the campaign as JSON in the page
function showCampaign() {
  const levelInput = parseInt(document.getElementById("partyLevel").value, 10) || 1;
  const questsInput = parseInt(document.getElementById("numQuests").value, 10) || 1;
  const camp = buildCampaign(levelInput, questsInput);
  document.getElementById("output").textContent = JSON.stringify(camp, null, 2);
}
