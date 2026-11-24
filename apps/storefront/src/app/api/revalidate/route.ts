import { revalidateTag, revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-revalidate-secret")
  const secretQuery = req.nextUrl.searchParams.get("secret")
  const expectedSecret = process.env.REVALIDATION_SECRET || "nizamlar_revalidate_secret_2026"

  const body = await req.json().catch(() => ({}))
  const secretBody = body?.secret

  const providedSecret = secretHeader || secretQuery || secretBody
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ message: "Yetkisiz erişim (Unauthorized)" }, { status: 401 })
  }

  try {
    const rawTags = body.tags || (body.tag ? [body.tag] : ["products", "site-content"])
    const rawPaths = body.paths || (body.path ? [body.path] : [])
    const handle = body.handle

    const tags = new Set<string>(Array.isArray(rawTags) ? rawTags : [rawTags])
    const paths = new Set<string>(Array.isArray(rawPaths) ? rawPaths : [rawPaths])

    if (handle) {
      tags.add(`product-${handle}`)
      paths.add(`/products/${handle}`)
      paths.add(`/tr/products/${handle}`)
    }

    const revalidatedTags: string[] = []
    for (const tag of tags) {
      try {
        revalidateTag(tag, { expire: 0 })
        revalidatedTags.push(tag)
      } catch {
        try {
          ;(revalidateTag as unknown as (tag: string) => void)(tag)
          revalidatedTags.push(tag)
        } catch {}
      }
    }

    const revalidatedPaths: string[] = []
    for (const p of paths) {
      try {
        revalidatePath(p, "page")
        revalidatedPaths.push(p)
      } catch {}
    }

    return NextResponse.json({
      revalidated: true,
      tags: revalidatedTags,
      paths: revalidatedPaths,
      timestamp: Date.now(),
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Revalidation failed" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const secretQuery = req.nextUrl.searchParams.get("secret")
  const secretHeader = req.headers.get("x-revalidate-secret")
  const expectedSecret = process.env.REVALIDATION_SECRET || "nizamlar_revalidate_secret_2026"

  if ((secretQuery || secretHeader) !== expectedSecret) {
    return NextResponse.json({ message: "Yetkisiz erişim (Unauthorized)" }, { status: 401 })
  }

  const tagParam = req.nextUrl.searchParams.get("tag")
  const pathParam = req.nextUrl.searchParams.get("path")
  const handleParam = req.nextUrl.searchParams.get("handle")

  const tags = tagParam ? tagParam.split(",") : ["products", "site-content"]
  const paths = pathParam ? pathParam.split(",") : ["/", "/tr", "/store", "/tr/store"]

  if (handleParam) {
    tags.push(`product-${handleParam}`)
    paths.push(`/products/${handleParam}`, `/tr/products/${handleParam}`)
  }

  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch {
      try {
        ;(revalidateTag as unknown as (tag: string) => void)(tag)
      } catch {}
    }
  }

  for (const p of paths) {
    try {
      revalidatePath(p, "page")
    } catch {}
  }

  return NextResponse.json({
    revalidated: true,
    tags,
    paths,
    timestamp: Date.now(),
  })
}
