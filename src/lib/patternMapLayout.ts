export const MAP_WIDTH = 860
export const MAP_HEIGHT = 500
// A fixed drawing coordinate system prevents canvas stretching, label clipping,
// and differences between rendering coordinates and pointer coordinates.
export function fitPatternNodes<T extends { id: string; x: number; y: number }>(nodes: T[]): (T & { px: number; py: number })[] {
  if (!nodes.length) return []
  const xs = nodes.map(node => node.x), ys = nodes.map(node => node.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  return nodes.map(node => ({ ...node,
    px: maxX === minX ? MAP_WIDTH / 2 : 90 + (node.x - minX) / (maxX - minX) * (MAP_WIDTH - 180),
    py: maxY === minY ? MAP_HEIGHT / 2 : 65 + (node.y - minY) / (maxY - minY) * (MAP_HEIGHT - 150),
  }))
}
