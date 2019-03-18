let fs = require('fs')
let weapons = JSON.parse(fs.readFileSync('./weapons.json', 'utf8'))
let effects = JSON.parse(fs.readFileSync('./effects.json', 'utf8'))
let details = JSON.parse(fs.readFileSync('./details.json', 'utf8'))
let armors = JSON.parse(fs.readFileSync('./armors.json', 'utf8'))
let miscs = JSON.parse(fs.readFileSync('./misc.json', 'utf8'))
let effectMod = 1
let curseMod = 0

// Main program
if (process.argv.length > 2 && process.argv[2].toLowerCase().includes('h')) {
    console.log('------------------------------------------------------------------------')
    console.log('A D&D 5e loot generator.')
    console.log('Usage: node loot.js # t s')
    console.log('No arguments will give 1 random item of any type.')
    console.log('# = number of items to generate.')
    console.log('t = type of item(s) to generate.')
    console.log('s = any number of sub-types of item(s) to generate, seperated by spaces.')
    console.log('------------------------------------------------------------------------')
}
if (process.argv.length > 3) {
    if (process.argv[3].toLowerCase().includes('w')) rollWeapon()
    else if (process.argv[3].toLowerCase().includes('a')) rollArmor()
    else if (process.argv[3].toLowerCase().includes('m')) rollMisc()
    else {
        console.error(process.argv[3],' is not a type of loot!')
        process.exit()
    }
}
else {
    if (Math.random() < 0.66) rollWeapon()
    else if (Math.random() < 0.66) rollArmor()
    else rollMisc()
}

function rollMisc() {
    let num = process.argv[2]
    if (!num) num =1

    for (let i=0; i<num; i++) {
        let misc
        if (process.argv.length > 4) {
            type = process.argv[i+4]
            misc = rollMiscType(type)
        }
        else {
            misc = rollMiscType()
        }

        // Roll effects
        let buff = rollEffect()

        misc.effect = buff.effect
        misc.curse = buff.curse
        misc.material = buff.material.type
        misc.cost += buff.material.cost

        if (misc.curse == '') misc.cost = (misc.cost * effectMod) + (125 * effectMod)
        else {
            misc.cost = misc.cost + (200 * effectMod) + (125 * curseMod)
        }
        misc.cost = Math.floor(misc.cost)
        if (misc.cost < 0) misc.cost = 100 - (curseMod * 20)
        
        effectMod = 1
        curseMod = 1

        console.log(i+1,misc)
        console.log()
    }
}

function rollArmor() {
    let num = process.argv[2]
    if (!num) num = 1

    for (let i=0; i<num; i++) {
        let armor
        if (process.argv.length > 4) {
            type = process.argv[i+4]
            armor = rollArmorType(type)
        }
        else {
            armor = rollArmorType()
        }

        // Roll effects
        let buff = rollEffect()
        while (buff.raw.includes('dice') || buff.raw.includes('Attack') || buff.raw.includes('+# to $')) {
            buff = rollEffect()
        }
        armor.effect = buff.effect
        armor.curse = buff.curse
        armor.material = buff.material.type
        armor.cost += buff.material.cost

        if (armor.curse == '') armor.cost = (armor.cost * effectMod) + (120 * effectMod)
        else {
            armor.cost = armor.cost + (120 * effectMod) + (75 * curseMod)
        }
        armor.cost = Math.floor(armor.cost)
        if (armor.cost < 0) armor.cost = 20 - curseMod
        
        effectMod = 1
        curseMod = 1

        console.log(i+1,armor)
        console.log()
    }
}

function rollWeapon() {
    let num = process.argv[2]
    if (!num) num = 1

    for (let i=0; i<num; i++) {
        let weapon
        if (process.argv.length > 4) { // User gave us type(s) of weapons to generate
            type = process.argv[i+4]
            weapon = rollMelee(type)
            if (!weapon) weapon = rollRanged(type)
            if (!weapon){
                if (Math.random() < 0.7) {
                    weapon = rollMelee()
                }
                else {
                    weapon = rollRanged()
                }
            }
            
        }
        else { // User didn't give us a type of weapon to generate
            if (Math.random() < 0.8) {
                weapon = rollMelee()
            }
            else {
                weapon = rollRanged()
            }
            
        }

        // Roll effects
        let buff = rollEffect()
        while (buff.raw.includes('damage taken') || buff.raw.includes('AC') || buff.raw.includes('HP')) {
            buff = rollEffect()
        }
        weapon.effect = buff.effect
        weapon.curse = buff.curse
        weapon.material = buff.material.type
        weapon.cost += buff.material.cost

        if (weapon.effect.includes('dice')) {
            effectMod += 4
            weapon.dice += 1
        }

        // Calculate cost
        if (weapon.curse == '') weapon.cost = (weapon.cost * effectMod) + (150 * effectMod)
        else {
            weapon.cost = (weapon.cost * effectMod) + (100 * effectMod) + (50 * curseMod)
        }
        weapon.cost = Math.floor(weapon.cost)
        if (weapon.cost < 0) weapon.cost = 20 - curseMod
        
        effectMod = 1
        curseMod = 1
        
        console.log(i+1,weapon)
        console.log()
    }
}

function rollMiscType(key) {
    if (key) {
        for (misc of miscs) {
            if (misc.name == key) {
                return misc
            }
        }
        console.error(key,' is not misc type!')
        return miscs[getRandom(miscs.length)]
    }
    else {
        return miscs[getRandom(miscs.length)]
    }
}

function rollArmorType(key) {
    if (key) {
        for (armor of armors) {
            if (armor.name == key) {
                return armor
            }
        }
        console.error(key,' is not an armor type!')
        return armors[getRandom(armors.length)]
    }
    else {
        return armors[getRandom(armors.length)]
    }
}

function rollMelee(key) {
    if (key) {
        for (weapon of weapons[0]) {
            if (weapon.name == key) {
                return weapon
            }
        }
        return false
    }
    else {
        return weapons[0][getRandom(weapons[0].length)]
    }
}

function rollRanged(key) {
    if (key) {
        for (weapon of weapons[1]) {
            if (weapon.name == key) {
                return weapon
            }
        }
        console.log(key,' is not a weapon!')
        return false
    }
    else {
        return weapons[1][getRandom(weapons[1].length)]
    }
}

function rollEffect() {
    let buff = {}
    let effect = effects[0][getRandom(effects[0].length)]
    buff.effect = effect.effect
    buff.raw = effect.effect
    buff.curse = effect.curse
    buff.material = details[5][getRandom(details[5].length)]


    if (effect.curse && effect.curse != 1) {
        // there's a curse
        buff.effect = rollDetails(buff.effect, 1)
        buff.curse = rollDetails(buff.curse, -1)
        return buff
    }

    if (effect.curse == 1) {
        // curse required
        buff.curse = effects[1][getRandom(effects[1].length)].curse
        buff.effect = rollDetails(buff.effect, 1)
        buff.curse = rollDetails(buff.curse, -1)
        return buff
    }

    // random curse
    if (Math.random() < 0.2) {
        buff.curse = effects[1][getRandom(effects[1].length)].curse
        buff.curse = rollDetails(buff.curse, -1)
    }
    else {
        buff.curse = ''
    }

    buff.effect = rollDetails(buff.effect, 1)
    return buff

}

function rollDetails(str, mod) {
    let rolled = false
    if (str.includes('?')) {
        str = str.replace('?', details[0][getRandom(details[0].length)])
    }
    if (str.includes('%')) {
        str = str.replace('%', (getRandomNumberWeighted(5,mod) * 5) + '%')
        rolled = true
    }
    if (str.includes('$')) {
        str = str.replace('$', details[1][getRandom(details[1].length)])
        if (mod > 0) mod = mod * 1.5
        else mod = mod * 1.25
    }
    if (str.includes('!')) {
        str = str.replace('!', details[2][getRandom(details[2].length)])
        curseMod += -2.5
        rolled = true
    }
    if (str.includes('@')) {
        str = str.replace('@', details[3][getRandom(details[3].length)])
        effectMod += 4
        rolled = true
    }
    if (str.includes('^')) {
        str = str.replace('^', details[4][getRandom(details[4].length)])
        mod = mod * 4
    }
    if (str.includes('#')) {
        if (str.includes('$')) str = str.replace('#', getRandomNumberWeighted(3,mod))
        else if (str.includes('Attack')) {
            mod = mod * 3
            str = str.replace('#', getRandomNumberWeighted(3, mod))
        }
        else if (str.includes('DC')) {
            mod = mod * 2
            str = str.replace('#', getRandomNumberWeighted(2, mod))
        }
        else if (str.includes('AC')) {
            mod = mod * 1.5
            str = str.replace('#', getRandomNumberWeighted(4,mod))
        }
        else if (str.includes('Max HP')) {
            str = str.replace('#' , getRandomNumberWeighted(4,mod) * (Math.floor(Math.random() * 4) + 1))
        }
        else str = str.replace('#', getRandomNumberWeighted(4,mod))
        rolled = true
    }
    if (str.includes('proficient')) {
        if (mod < 0) curseMod += -3
        else effectMod += 2
        rolled = true
    }

    if (!rolled) { // Plain text buff
        if (mod < 0) curseMod += -2
        else effectMod += 1.5
    }

    return str
}

function getRandomNumberWeighted(max,mod) {
    let num = 1
    let costMod = 0
    for (let i=0; i<max; i++) {
        if (Math.random() < 0.5) num++
        else {
            costMod += mod * num * 0.5;
            (mod > 0) ? effectMod += costMod : curseMod += costMod
            return num
        }
    }
    costMod += mod * num * 0.5;
    (mod > 0) ? effectMod += costMod : curseMod += costMod
    return num
}

function getRandom(max) {
    return Math.floor(Math.random() * Math.floor(max))
}