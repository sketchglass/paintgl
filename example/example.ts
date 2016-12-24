import simpleExample from "./examples/simple"
import shapeExample from "./examples/shape"
import shaderExample from "./examples/shader"
const select = document.getElementById("example-select")!
const root = document.getElementById("root")!

const examples = new Map<string, (elem: HTMLCanvasElement) => void>()
examples.set("simple", simpleExample)
examples.set("shape", shapeExample)
examples.set("shader", shaderExample)

function loadExample(name: string) {
  const example = examples.get(name)
  if (example) {
    while (root.firstChild) {
      root.removeChild(root.firstChild)
    }
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 400
    root.appendChild(canvas)
    example(canvas)
  }
}

select.addEventListener("change", e => {
  loadExample((e.target as HTMLSelectElement).value)
})

loadExample("simple")
