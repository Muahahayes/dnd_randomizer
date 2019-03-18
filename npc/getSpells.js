let rows = document.getElementsByClassName('spell-name')
let spells = []
for (let row of rows) {
    let a = row.getElementsByTagName('a')
    spells.push(a[0].innerHTML)
}
spells

// use in dndbeyond.com's spell search page to make the dev tool window print an array of all the spell names