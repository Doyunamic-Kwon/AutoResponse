import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma"; // VER_103_RELATIVE

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const store = await prisma.store.findFirst({
        where: { userId },
    });

    return NextResponse.json(store || { naverId: "", kakaoId: "" });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { naverId, kakaoId } = await req.json();
    const userId = (session.user as any).id;

    const store = await prisma.store.upsert({
        where: { userId },
        update: { naverId, kakaoId },
        create: { userId, naverId, kakaoId },
    });

    return NextResponse.json(store);
}
