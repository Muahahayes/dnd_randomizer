let filenames = [
    './npc/race.json',
    './npc/class.json',
    './npc/info.json',
    './npc/spells.json'
]
let npc = require('./npc-source.js')

if (process.argv[2] && process.argv[2].includes('h')) {
    console.log('---------------------------------------------------' +
                '\n A D&D 5e character generator.' + 
                '\n Usage: node npc.js # # c r s' +
                '\n No arguments will give a random character lv 1-20.' +
                '\n Arguments:' +
                '\n # = min and max level range.' +
                '\n c = class to generate' +
                '\n r = race to generate' +
                '\n s = subclass/school/domain to pick within class' +
                '\n---------------------------------------------------')
    process.exit()
}

npc.rollNPC(filenames)