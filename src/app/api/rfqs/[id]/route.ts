import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-context";
import {
  updateRFQSchema,
  type UpdateRFQInput,
} from "@/lib/validators/rfq";
import { RFQService } from "@/services/rfq-service";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuthUser({ requireCompany: true });
    const result = await RFQService.getRFQ(ctx, params.id);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch RFQ" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuthUser({ requireCompany: true });
    const body = (await request.json()) as UpdateRFQInput;
    const parsed = updateRFQSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const rfq = await RFQService.updateRFQ(ctx, params.id, parsed.data);
    if (!rfq) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update RFQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuthUser({ requireCompany: true });
    const rfq = await RFQService.deleteRFQ(ctx, params.id);
    if (!rfq) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete RFQ" },
      { status: 500 }
    );
  }
}

