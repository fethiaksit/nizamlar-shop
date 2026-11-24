import { expect, type Page } from "@playwright/test"

export const FIXED_EPOCH_MS = Date.parse("2026-11-24T12:00:00.000Z")

export async function installDeterministicSceneHarness(page: Page) {
  await page.clock.install({ time: new Date(FIXED_EPOCH_MS) })
  await page.addInitScript(() => {
    let seed = 20261124
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }

    type Vec3Like = {
      x: number
      y: number
      z: number
      set: (x: number, y: number, z: number) => void
    }

    type ThreeObjectLike = {
      type?: string
      position: Vec3Like
      rotation: Vec3Like
      children: ThreeObjectLike[]
      geometry?: {
        boundingBox: { min: Vec3Like; max: Vec3Like } | null
        computeBoundingBox: () => void
        attributes?: { position?: { count?: number } }
      }
      updateMatrixWorld?: (force?: boolean) => void
      traverse?: (cb: (obj: ThreeObjectLike) => void) => void
    }

    type R3fStoreLike = {
      getState: () => {
        clock?: {
          startTime: number
          oldTime: number
          elapsedTime: number
          running: boolean
        }
        pointer?: { set?: (x: number, y: number) => void }
        camera?: ThreeObjectLike
        scene?: ThreeObjectLike
      }
    }

    const canvasStores = new WeakMap<HTMLCanvasElement, R3fStoreLike>()
    const origMapSet = Map.prototype.set
    Map.prototype.set = function (key: unknown, value: unknown) {
      if (
        key instanceof HTMLCanvasElement &&
        value &&
        typeof value === "object" &&
        "store" in value
      ) {
        const store = (value as { store?: R3fStoreLike }).store
        if (store && typeof store.getState === "function") {
          canvasStores.set(key, store)
        }
      }
      return origMapSet.call(this, key, value)
    }

    ;(
      window as unknown as {
        __nizamlarTestSyncR3fCanvas: (c: HTMLCanvasElement) => boolean
      }
    ).__nizamlarTestSyncR3fCanvas = (canvas: HTMLCanvasElement) => {
      const store = canvasStores.get(canvas)
      if (!store) return false
      const state = store.getState()
      if (!state.clock || !state.scene) return false

      state.pointer?.set?.(0, 0)
      state.camera?.position.set(0, 0, 0)

      let primaryMesh: ThreeObjectLike | null = null
      state.scene.traverse?.((obj) => {
        if (
          obj.type === "Mesh" &&
          (obj.geometry?.attributes?.position?.count || 0) > 500 &&
          !primaryMesh
        ) {
          primaryMesh = obj
        }
        if (obj.type === "Group") {
          obj.rotation.set(0, 0, 0)
        }
      })

      if (primaryMesh) {
        const mesh = primaryMesh as ThreeObjectLike
        mesh.rotation.set(0, 0, 0)
        mesh.geometry?.computeBoundingBox()
        const bb = mesh.geometry?.boundingBox
        if (bb) {
          const cx = -(bb.min.x + bb.max.x) / 2
          const cy = -(bb.min.y + bb.max.y) / 2
          const cz = -(bb.min.z + bb.max.z) / 2
          state.scene.traverse?.((obj) => {
            if (
              obj.type === "Group" &&
              (Math.abs(obj.position.x) > 1e-6 ||
                Math.abs(obj.position.y) > 1e-6 ||
                Math.abs(obj.position.z) > 1e-6)
            ) {
              obj.position.set(cx, cy, cz)
            }
          })
        }
      }

      state.scene.updateMatrixWorld?.(true)

      const t = performance.now()
      state.clock.startTime = t
      state.clock.oldTime = t
      state.clock.elapsedTime = 0
      state.clock.running = true
      return true
    }

    const origDrawElements = WebGL2RenderingContext.prototype.drawElements
    WebGL2RenderingContext.prototype.drawElements = function (
      mode,
      count,
      type,
      offset
    ) {
      const result = origDrawElements.call(this, mode, count, type, offset)
      if (
        this.canvas instanceof HTMLCanvasElement &&
        !this.isContextLost()
      ) {
        if (count > 300) {
          this.canvas.dataset.testGarmentDrawn = "true"
        }
        if (count > 3000) {
          this.canvas.dataset.testModelDrawn = "true"
        }
      }
      return result
    }
  })
}

export async function pauseAtAlignedFrame(page: Page, minLeadMs = 400) {
  const now = await page.evaluate(() => Date.now())
  const alignedPauseMs =
    FIXED_EPOCH_MS + Math.ceil((now + minLeadMs - FIXED_EPOCH_MS) / 16) * 16
  await page.clock.pauseAt(new Date(alignedPauseMs))
}

export async function assertVisibleImagesLoaded(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          return [...document.images]
            .filter((image) => {
              const rect = image.getBoundingClientRect()
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < innerHeight &&
                rect.left < innerWidth &&
                getComputedStyle(image).visibility !== "hidden"
              )
            })
            .every((image) => image.complete && image.naturalWidth > 0)
        }),
      {
        message:
          "Visible images must load successfully before a baseline is accepted",
      }
    )
    .toBe(true)
}

export async function settleDeterministicUi(page: Page, runMs = 2560) {
  await pauseAtAlignedFrame(page)
  await page.clock.runFor(runMs)
  await assertVisibleImagesLoaded(page)
}

export async function settleDeterministicTshirt3dSection(page: Page) {
  const section = page.getByTestId("tshirt3d-section")
  await page.clock.resume()

  await section.evaluate((el) => {
    el.scrollIntoView({ block: "start", behavior: "instant" })
  })

  const canvas = section.locator("canvas")
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveAttribute("data-test-model-drawn", "true")
  await page.waitForLoadState("networkidle")
  await page.evaluate(() => document.fonts.ready)

  await pauseAtAlignedFrame(page)

  const synced = await canvas.evaluate((el) => {
    if (!(el instanceof HTMLCanvasElement)) return false
    const win = window as unknown as {
      __nizamlarTestSyncR3fCanvas?: (c: HTMLCanvasElement) => boolean
    }
    return win.__nizamlarTestSyncR3fCanvas?.(el) ?? false
  })
  expect(synced, "Must synchronize R3F store clock and pointer").toBe(true)

  await page.clock.runFor(8000)
  await assertVisibleImagesLoaded(page)
}
