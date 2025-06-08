import chalk from "chalk"

const color = (text, colorName) => {
  return !colorName ? chalk.green(text) : chalk.keyword(colorName)(text)
}

const bgcolor = (text, bgcolorName) => {
  return !bgcolorName ? chalk.green(text) : chalk.bgKeyword(bgcolorName)(text)
}

export { color, bgcolor }
