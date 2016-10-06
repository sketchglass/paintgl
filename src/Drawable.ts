import {Transform} from "paintvec"

export
interface Drawable {
  draw(transform: Transform): void
}
