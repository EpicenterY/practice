// An import statement allows your code to use jscad methods:
const { cube } = require('@jscad/modeling').primitives

// A function declaration that returns geometry
const main = () => {
  return cube()
}

// A declaration of what elements in the module (this file) are externally available.
module.exports = { main }