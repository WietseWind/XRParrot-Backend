const chars = 'abcdehlkmrtwxyz'.toUpperCase()

const to = (decimal) => {
  let out = ''
  while (true) {
    let remainder = (decimal - 1) % chars.length
    out = chars[remainder] + out;
    decimal = Math.floor((decimal - 1) / chars.length);
    if (decimal === 0) break
  }
  return out;
}

const from = (alpha) => {
  const crs = chars.split('')
  const letters = alpha.split('')
  let out = 0
  for (let i = 0; i < letters.length; i++) {
    let indexPos = crs.indexOf(letters[letters.length - 1 - i])
    out += (indexPos + 1) * Math.pow(crs.length, i) 
  }
  return out
}

module.exports = { to, from }
