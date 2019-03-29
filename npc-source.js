const fs = require('fs')
let races = JSON.parse(fs.readFileSync('./npc/race.json','utf8'))
let clazzes = JSON.parse(fs.readFileSync('./npc/class.json','utf8'))
let info = JSON.parse(fs.readFileSync('./npc/info.json','utf8'))
let spells = JSON.parse(fs.readFileSync('./npc/spells.json','utf8'))
module.exports = {"rollNPC": rollNPC}

let npc = {
    "race":{},
    "class":{},
    "level":1,
    "HP":0,
    "AC":10,
    "attributes":{
        "strength":0,
        "dexterity":0,
        "constitution":0,
        "intelligence":0,
        "wisdom":0,
        "charisma":0
    },
    "skills":[],
    "features":[]
}

function rollNPC(filenames) {
    
    if (Array.isArray(filenames)) {
        // args [minlevel, maxlevel, class, race, subclass] randomize any not given
        races = JSON.parse(fs.readFileSync(filenames[0],'utf8'))
        clazzes = JSON.parse(fs.readFileSync(filenames[1],'utf8'))
        info = JSON.parse(fs.readFileSync(filenames[2],'utf8'))
        spells = JSON.parse(fs.readFileSync(filenames[3],'utf8'))
    }
    let min = 1
    let max = 20
    // check if level arg, if not random level 1-20 (weighted)
    if (process.argv.length > 3) {
        min = process.argv[2] * 1
        max = process.argv[3] * 1
    }
    npc.level = getLevelWeighted(min,max)

    npc.proficiency = Math.floor((npc.level - 1) / 4) + 2

    rollRace()
    rollClass()
    rollStats()
    // TODO: rollWeapon()

    // obj output
    //console.log(npc)
    console.log()

    // build output string
    let npcStr = printNPC()
    
    console.log(npcStr)

    // TODO: write to file the log string too
    // TODO: option to write obj as JSON file
    // TODO: make script to do printNPC to a given npc's JSON file
    // TODO: name file lv_#_race_class and check for duplicates, increment a _# suffix
    // TODO: make node server output in browser
    // TODO: make the node server output look similar to a 5e character sheet

}

function rollRace() {
    // check if race arg, if not roll random race
    if (process.argv[5] && process.argv[5] != 'r') {
        for (let race of races) {
            if (process.argv[5].toLowerCase() == race.name.toLowerCase()) {
                npc.race = race
            }
        }
        // check if race exists, if not log error and roll random race
        if (!npc.race.name) {
            console.error(process.argv[5],'is not a race!')
            npc.race = races[getRandom(races.length)]
        }
    }
    else {
        npc.race = races[getRandom(races.length)]
    }

    npc.size = npc.race.size
    npc.speed = npc.race.speed
    if (npc.features.includes('Unarmored Movement')) npc.speed += 10
    npc.languages = npc.race.languages

    if (npc.race.features) {
        for (let feature of npc.race.features) {
            npc.features.push(feature)
        }
    }
    
    // check if subrace exists, if yes then roll random subrace
    if (npc.race.subraces) {
        npc.subrace = npc.race.subraces[getRandom(npc.race.subraces.length)]
    }
    if (npc.subrace && npc.subrace.languages) {
        for (let language of npc.subrace.languages) {
            npc.languages.push(language)
        }
    }
    if (npc.subrace && npc.subrace.features) {
        for (let feature of npc.subrace.features) {
            npc.features.push(feature)
        }
    }
    let any = npc.languages.filter((language)=>{return (language == 'any')})
    for (let i=0; i<any.length; i++) {
        if (npc.languages.length < info[0].length) {
            let language = info[0][getRandom(info[0].length)]
            while (npc.languages.includes(language)) {
                language = info[0][getRandom(info[0].length)]
            }
            npc.languages[npc.languages.indexOf('any')] = language
        }
    }
}

function rollClass() {
    // TODO: fighter, wizard, ranger,   warlock, cleric, sorceror, bard, monk
    // check if class arg
    // check if class exists, if not log error and roll random class
    if (process.argv[4] && process.argv[4] != 'r') {
        for (let clazz of clazzes) {
            if (process.argv[4].toLowerCase() == clazz.name.toLowerCase()) {
                npc.class = clazz
            }
        }
        if (!npc.class.name) {
            console.error(process.argv[4],'is not a class!')
            npc.class = clazzes[getRandom(clazzes.length)]
        }
    }
    else {
        npc.class = clazzes[getRandom(clazzes.length)]
    }

    if (npc.class.languages) {
        for (let language of npc.class.languages){
            npc.languages.push(language)
        }
    }

    
    for (let i=0; i<npc.level; i++) {
        let features = npc.class.features[i]
        if (features) {
            for (feature of features) {
                if (Array.isArray(feature)) {
                    npc.features.push(feature[getRandom(feature.length)])
                }
                else{
                    npc.features.push(feature)
                }            
            }
        }
    }

    // roll subclass
    if (npc.level >= npc.class.sublvl) {
    // check if subclass arg
    // check if subclass is in class, if not log error and roll random subclass   
        if (npc.class.subclass) {
            if (process.argv[6]) {
                for (let clazz of npc.class.subclass) {
                    if (process.argv[6].toLowerCase() == clazz.name.toLowerCase()) {
                        npc.subclass = clazz
                    }
                }
                if (!npc.subclass.name) {
                    console.error(process.argv[6],'is not a subclass!')
                    npc.subclass = npc.class.subclass[getRandom(npc.class.subclass.length)]
                }
            }
            else {
                npc.subclass = npc.class.subclass[getRandom(npc.class.subclass.length)]
            }
            if (npc.subclass.sub) {
                npc.sub = npc.subclass.sub[getRandom(npc.subclass.sub.length)]
            }
        }
    }
    

    // TODO: roll spells
    // first first, roll racial spells! racial cantrips are wizard
    // roll subclass spells first! Rule those out when rolling class spells
    let checkSpells = []
    npc.spells = [[],[],[],[],[],[],[],[],[],[]]
    if (npc.class.spells) {
        npc.spellSlots = npc.class.spells.slots[npc.level - 1]
    }
    else if (npc.subclass && npc.subclass.slots) {
        npc.spellSlots = npc.subclass.slots[npc.level - 1]
    }
    npc.racialSpells = []
    if (npc.race.spells) {
        for (let spell of npc.race.spells) {
            if (spell.spell == 'cantrip') {
                // roll cantrip to put in npc.spells
                let cantrip = spells.wizard[0][getRandom(spells.wizard[0].length)]
                npc.spells[0].push(cantrip)
                checkSpells.push(cantrip)
            }
            else {
                if (npc.level >= spell.lvl) {
                    npc.racialSpells.push(spell.spell)
                    checkSpells.push(spell.spell)
                }
            }
        }
    }
    if (npc.subrace && npc.subrace.spells) {
        for (let spell of npc.subrace.spells) {
            if (spell.spell == 'cantrip') {
                // roll cantrip to put in npc.spells
                let cantrip = spells.wizard[0][getRandom(spells.wizard[0].length)]
                npc.spells[0].push(cantrip)
                checkSpells.push(cantrip)
            }
            else {
                if (npc.level >= spell.lvl) {
                    npc.racialSpells.push(spell.spell)
                    checkSpells.push(spell.spell)
                }
            }
        }
    }

    // TODO: fighter and rogue use wizard spells
    // TODO: warlock's pact of the tome uses any class cantrips
    if (npc.subclass) {
        if (npc.subclass.spells) {
            let spellClass = (spells[npc.class.name])?npc.class.name:'wizard'
            for (let spell of npc.subclass.spells) {
                if (spell.spell == 'cantrip') {
                    // roll cantrip to put in npc.spells
                    
                    let cantrip = spells[spellClass][0][getRandom(spells.wizard[0].length)]
                    while (checkSpells.includes(cantrip)) {
                        cantrip = spells[spellClass][0][getRandom(spells.wizard[0].length)]
                    }
                    npc.spells[0].push(cantrip)
                    checkSpells.push(cantrip)
                }
                else {
                    if (npc.spellSlots.length-1 >= spell.lvl) {
                        npc.spells[spell.lvl].push(spell.spell)
                        checkSpells.push(spell.spell)
                    }
                }
            }
        }
        if (npc.subclass.spellClass) {
            let spellClass = npc.subclass.spellClass
            if (npc.subclass.known) {
                let spellsKnown = npc.subclass.known[npc.level-1]
                let i = 0
                for (let j=0; j<spellsKnown; j++) {
                    let spell = spells[spellClass][i][getRandom(spells[spellClass][i].length)]
                    while (checkSpells.includes(spell)) {
                        spell = spells[spellClass][i][getRandom(spells[spellClass][i].length)]
                    }
                    npc.spells[i].push(spell)
                    checkSpells.push(spell) 
                    i++
                    if (i >= npc.spellSlots.length) i = 0
                }
            }
            else {
                for (let i=0; i<npc.spellSlots.length; i++) {
                    for (let j=0; j<npc.spellSlots[i]; j++) {
                        let spell = spells[spellClass][i][getRandom(spells[spellClass][i].length)]
                        while (checkSpells.includes(spell)) {
                            spell = spells[spellClass][i][getRandom(spells[spellClass][i].length)]
                        }
                        npc.spells[i].push(spell)
                        checkSpells.push(spell)
                    }
                }
            }
        }
        if (npc.sub) {
            if (npc.sub.spells) {
                for (let level in npc.sub.spells) {
                    if (npc.spellSlots.length-1 >= level) {
                        for (let spell of npc.sub.spells[level]) {
                            npc.spells[level].push(spell)
                            checkSpells.push(spell)
                        }
                    }
                }
            }
        }
    }

    if (npc.class.spells) {
        if (npc.class.spells.known) {
            let spellsKnown = npc.class.spells.known[npc.level-1]
            let spellClass = npc.class.name.toLowerCase()
            let i = 0
            for (let j=0; j<spellsKnown; j++) {
                let spell = spells[spellClass][i][getRandom(spells[spellClass][i].length)]
                while (checkSpells.includes(spell)) {
                    spell = spells[spellClass][i][getRandom(spells[spellClass][i].length)]
                }
                npc.spells[i].push(spell)
                checkSpells.push(spell) 
                i++
                if (i >= npc.spellSlots.length) i = 0
            }
        }
        else {
            for (let i=0; i<npc.spellSlots.length; i++) {
                for (let j=0; j<npc.spellSlots[i]; j++) {
                    let spell = spells[npc.class.name.toLowerCase()][i][getRandom(spells[npc.class.name.toLowerCase()][i].length)]
                    while (checkSpells.includes(spell)) {
                        spell = spells[npc.class.name.toLowerCase()][i][getRandom(spells[npc.class.name.toLowerCase()][i].length)]
                    }
                    npc.spells[i].push(spell)
                    checkSpells.push(spell)
                }
            }
        }
    }

}

function rollStats() {
    let priorities = (npc.subclass && npc.subclass.priorities)?npc.subclass.priorities:npc.class.priorities
    // assign the array based on class's priorities
    let att = []
    for (let i=0; i<6; i++) {
        att.push(rollAtt())
    }
    att.sort((a,b) => {
                if (a > b) return 1
                else return -1
            })
    for (let stat of priorities) {
        npc.attributes[stat] = att.pop()
    }
    

    // add race bonuses
    let bonused = []
    for (let attribute in npc.race.scores) {
        if (attribute == 'any2') {
            if (!bonused.includes(priorities[0])){
                npc.attributes[priorities[0]]++
                npc.attributes[priorities[1]]++
            }
            else{
                npc.attributes[priorities[1]]++
                npc.attributes[priorities[2]]++
            }
        }
        else if (attribute == 'any') {
            if (!bonused.includes(priorities[0])){
                npc.attributes[priorities[0]]++
            }
            else{
                npc.attributes[priorities[1]]++
            }
        }
        else {
            npc.attributes[attribute] += npc.race.scores[attribute]
        }
        bonused.push(attribute)
    }

    if (npc.subrace) {
        for (let attribute in npc.subrace.scores) {
            npc.attributes[attribute] += npc.subrace.scores[attribute]
        }
    }

    // check for Ability Score Increase features and assign them using class stat priority
    let ASI = npc.features.filter((feature) => {return (feature == 'ASI')})
    npc.features = npc.features.filter((feature) => {return (feature != 'ASI')})
    for (let i=0; i<ASI.length; i++) {
        if (npc.attributes[priorities[0]] >= 20) {
            if (npc.attributes[priorities[1]] >= 20) {
                if (!npc.feats) npc.feats = []
                npc.feats.push(info[1][getRandom(info[1].length)])
            }
            else if (npc.attributes[priorities[1]] % 2 == 1) {
                npc.attributes[priorities[1]]++
                npc.attributes[priorities[2]]++
            }
            else {
                npc.attributes[priorities[1]] += 2
            }
        }
        else if (npc.attributes[priorities[0]] % 2 == 1) {
            npc.attributes[priorities[0]]++
            if (npc.attributes[priorities[1]] % 2 == 1) {
                npc.attributes[priorities[1]]++
            }
            else {
                if (npc.attributes[priorities[2]] % 2 == 1) {
                    npc.attributes[priorities[2]]++
                }
                else {
                    npc.attributes[priorities[1]]++
                }
            }
        }
        else {
            npc.attributes[priorities[0]] += 2
        }
    }


    // roll hp and ac and initiative
    if (npc.class.maxDex && (npc.class.maxDex <= modifier(npc.attributes.dexterity) || npc.class.maxDex === 0)){
        npc.AC = npc.class.ac + npc.class.maxDex
    }
    else {
        npc.AC = npc.class.ac + modifier(npc.attributes.dexterity)
    }
    if (npc.features.includes('Unarmored Defense') && npc.class.name == 'Barbarian') {
        npc.AC += modifier(npc.attributes.constitution)
    }
    if (npc.features.includes('Unarmored Defense') && npc.class.name == 'Monk') {
        npc.AC += modifier(npc.attributes.wisdom)
    }

    // TODO: tough feat
    npc.HP = npc.class.hp + (modifier(npc.attributes.constitution) * npc.level)
    for (let i=1; i<npc.level; i++) {
        npc.HP += getRandom(npc.class.hp) + 1
    }
    
    npc.initiative = modifier(npc.attributes.dexterity)
    if (npc.features.includes('Alert')) {
        npc.initiative += 5
    }
    if (npc.features.includes('Jack of all Trades')) {
        npc.initiative += Math.floor(npc.proficiency / 2)
    }
    else if (npc.features.includes('Remarkable Athlete')) {
        npc.initiative += Math.floor(npc.proficiency / 2)
    }


    // calculate skills

    // get skill profs
    let skills = []
    if (npc.race.skills) skills = npc.race.skills.slice()
    let classSkills = npc.class.skills.slice().filter((skill) => !skills.includes(skill))
    for (let i=0; i<classSkills[0]; i++) {
        let skill = classSkills[getRandom(classSkills.length - 1) + 1]
        if (!skills.includes(skill)) {
            skills.push(skill)
            let val = skill
            classSkills = classSkills.slice(0,classSkills.findIndex((s) => s == val)).join(',') + classSkills.slice(classSkills.findIndex((s) => s == val) + 1).join(',')
            classSkills = classSkills.split(',')
        }
    }
    npc.skills = skills

    for (let skill of npc.skills) {
        if (skill == 'any') {
            let any = info[2][getRandom(info[2].length)].name
            if (!npc.skills.includes(any)) {
                npc.skills.push(any)
            }
            else {
                while (!npc.skills.includes(any)) {
                    any = info[2][getRandom(info[2].length)].name
                }
                npc.skills.push(any)
            }
        }
    }
    npc.skills = npc.skills.filter((skill) => skill != 'any')

    if (npc.subclass && npc.class.subclass.skills) {
        npc.skills = npc.skills.slice().join(',') + npc.class.subclass.skills.slice().join(',')
        npc.skills = npc.skills.split(',')
    }

    // calc skill scores
    let skillObjs = info[2].slice()
    for (let skill of skillObjs) {
        if (npc.skills.includes(skill.name)) {
            skill.bonus = npc.proficiency + modifier(npc.attributes[skill.mod.toLowerCase()])
            skill.proficient = true
        }
        else {
            skill.bonus = modifier(npc.attributes[skill.mod.toLowerCase()])
        }
    }
    npc.skillScores = skillObjs

    // calculate saves
    npc.saves = {}
    for (let attribute in npc.attributes) {
        if (npc.class.saves.includes(attribute)) {
            npc.saves[attribute] = modifier(npc.attributes[attribute]) + npc.proficiency
        }
        else {
            npc.saves[attribute] = modifier(npc.attributes[attribute])
        }
    }
}

function rollAtt() { // rolls an attribute score
    let arr = []
    for (let i=0; i<4; i++) { // roll 4 d6 rolls and put in array
        arr.push(Math.ceil(Math.random() * 6))
    }
    arr.sort().reverse().pop() // drop lowest roll
    return arr.reduce((acc,cur) => acc = acc + cur) // sum rolls together
}

function getLevelWeighted(min,max) { // random level between min and max, odds favor lower end of range
    let num = min
    max = max - min
    for (let i=0; i<max; i++) { // increment level each loop
        if (Math.random() < 0.7) num++
        else { // 30% chance each loop of dropping out and no more incrementing
            return num
        }
    }
    return num
}

function getRandom(max) { // shorthand for getting a random int 0 to max-1
    return Math.floor(Math.random() * Math.floor(max))
}

function modifier(num) { // shorthand for converting an attribute score to its modifier bonus
    return Math.floor(num / 2) - 5
}

function printNPC() {
    // build output string
    npcStr = ''

    // main stats
    npcStr += ` ${npc.race.name} ${(npc.subrace)?'('+npc.subrace.name+')' : ''} ${npc.class.name} ${(npc.subclass)?'('+npc.subclass.name+')' : ''}    Level: ${npc.level}\n`
            + `\n Str: ${npc.attributes.strength}  ${(npc.attributes.strength<10)?' ':''} Save: ${npc.saves.strength}${(npc.saves.strength >= 10 || npc.saves.strength < 0)?'      ':'       '}HP: ${npc.HP}`
            + `\n Dex: ${npc.attributes.dexterity} ${(npc.attributes.dexterity<10)?' ':''}  Save: ${npc.saves.dexterity}${(npc.saves.dexterity >= 10 || npc.saves.dexterity < 0)?'      ':'       '}AC: ${npc.AC}`
            + `\n Con: ${npc.attributes.constitution} ${(npc.attributes.constitution<10)?' ':''}  Save: ${npc.saves.constitution}${(npc.saves.constitution >= 10 || npc.saves.constitution < 0)?'      ':'       '}Proficiency: ${npc.proficiency}`
            + `\n Int: ${npc.attributes.intelligence} ${(npc.attributes.intelligence<10)?' ':''}  Save: ${npc.saves.intelligence}${(npc.saves.intelligence >= 10 || npc.saves.intelligence < 0)?'      ':'       '}Initiative: ${npc.initiative}`
            + `\n Wis: ${npc.attributes.wisdom}  ${(npc.attributes.wisdom<10)?' ':''} Save: ${npc.saves.wisdom}${(npc.saves.wisdom >= 10 || npc.saves.wisdom < 0)?'      ':'       '}Speed: ${npc.speed}`
            + `\n Cha: ${npc.attributes.charisma} ${(npc.attributes.charisma<10)?' ':''}  Save: ${npc.saves.charisma}${(npc.saves.charisma >= 10 || npc.saves.charisma < 0)?'      ':'       '}Size: ${npc.size}`
            + '\n'

    // languages
    let langStr = ''
    for (let language of npc.languages) {
        langStr += `${language},`
    }
    langStr = langStr.split(',')
    langStr.pop()
    langStr = langStr.join(', ')
    npcStr += `\n Languages:\n ${langStr}\n`

    // class extras
    if (npc.class.extra) {
        for (let extra in npc.class.extra) {
            npcStr += `\n ${extra}: ${npc.class.extra[extra][npc.level-1]}`
        }
        npcStr += '\n'
    }

    // features
    npcStr += `\n Features: `
    for (let i=0; i<npc.features.length; i++) {
        npcStr += `${npc.features[i]?'\n '+npc.features[i]:''}`+
            `${(npc.features[++i])?', '+npc.features[i]:''}`+
            `${(npc.features[++i])?', '+npc.features[i]:''}`+
            `${(npc.features[++i])?', '+npc.features[i]:''}`
    }
    
    // subclass features
    if (npc.subclass) {
        npcStr += '\n\n Subclass Features:\n '
        let subStr = []
        let i = 0
        for (let key in npc.subclass.features) {
            if (npc.level >= key){
                subStr.push(`${npc.subclass.features[key]?npc.subclass.features[key]:''}`)
                if (((i+1) % 2) == 0) {
                    subStr[i] += '\n '
                    i++
                }
                else {
                    subStr[i++] += ', '
                }
            }
        }
        //subStr[i-1] = subStr[i-1].replace(',','')
        npcStr += subStr.join('')
    }

    // skills
    npcStr += `\n\n                Skills:`
    for (let i=0; i<npc.skillScores.length/2; i++) {
        let gap = ''
        for (let j=0; j<20-npc.skillScores[i].name.split('').length; j++) {
            gap += ' '
        }
        if (npc.skillScores[i].bonus >= 0) {
            gap += ' '
        }
        npcStr += `\n ${npc.skillScores[i].name} : ${npc.skillScores[i].bonus} ${gap} ${npc.skillScores[i+(npc.skillScores.length/2)].name} : ${npc.skillScores[i+(npc.skillScores.length/2)].bonus}`
    }

    // TODO: refactor how to display spells

    if (npc.spells[0][0] || npc.spells[1][0]) {
        npcStr += `\n\n Spells: (${(npc.class.spells)?npc.class.spells.mod:"Intelligence"})`
                        +` Attack: ${modifier(npc.attributes[(npc.class.spells)?npc.class.spells.mod:"intelligence"]) + npc.proficiency}`
                        +` DC: ${8 + modifier(npc.attributes[(npc.class.spells)?npc.class.spells.mod:"intelligence"]) + npc.proficiency}` 
                        + `\n Level  Slots  Spells`
        for (let slotLevel in npc.spells) {
            if (npc.spells[slotLevel][0]){
                npcStr += `\n  ${slotLevel}      ${(npc.spellSlots)?npc.spellSlots[slotLevel]:'0'}      ${(npc.spells)?npc.spells[slotLevel][0]:''}`
                if (!npc.spells || !npc.spells[slotLevel][1]) continue
                for (let i=1; i<npc.spells[slotLevel].length; i++) {
                    npcStr += `, ${npc.spells[slotLevel][i]}`
                    if ((i % 3) == 0) {
                        npcStr += `${(npc.spells[slotLevel][i+1])?'\n                '+npc.spells[slotLevel][++i]:''}`
                    }
                }
            }
        }
    }
    // console.log('\n'+npcStr)
    return npcStr
}