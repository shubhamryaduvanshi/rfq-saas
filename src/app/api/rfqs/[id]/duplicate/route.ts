import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-context";
import { RFQService } from "@/services/rfq-service";

interface RouteParams {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuthUser({ requireCompany: true });
    const rfq = await RFQService.duplicateRFQ(ctx, params.id);
    return NextResponse.json({ id: rfq._id.toString() }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to duplicate RFQ" },
      { status: 500 }
    );
  }
}

