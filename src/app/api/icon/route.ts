import { NextRequest, NextResponse } from "next/server";

const FALLBACK = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "item";
  const id = searchParams.get("id");

  if (!id) return NextResponse.redirect(FALLBACK);

  try {
    const url =
      type === "spell"
        ? `https://nether.wowhead.com/tooltip/spell/${id}?dataEnv=4`
        : `https://nether.wowhead.com/tooltip/item/${id}?dataEnv=2`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.redirect(FALLBACK);

    const data = await res.json();
    const iconName = data.icon || "inv_misc_questionmark";
    return NextResponse.redirect(
      `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`
    );
  } catch {
    return NextResponse.redirect(FALLBACK);
  }
}
