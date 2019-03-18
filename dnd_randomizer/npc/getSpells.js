let rows = document.getElementsByClassName('spell-name')
let spells = []
for (let row of rows) {
    let a = row.getElementsByTagName('a')
    spells.push(a[0].innerHTML)
}
spells