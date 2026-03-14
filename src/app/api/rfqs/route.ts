import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-context";
import {
  createRFQSchema,
  type CreateRFQInput,
} from "@/lib/validators/rfq";
import { RFQService } from "@/services/rfq-service";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthUser({ requireCompany: true });

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const status = searchParams.get("status") ?? undefined;

    const result = await RFQService.listRFQs(ctx, {
      page,
      pageSize,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch RFQs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthUser({ requireCompany: true });
    const body = (await request.json()) as CreateRFQInput;
    const parsed = createRFQSchema.safeParse(body);
    console.log("parsed Data::", parsed);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const rfq = await RFQService.createRFQ(ctx, parsed.data);
    return NextResponse.json({ id: rfq._id.toString() }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create RFQ" },
      { status: 500 }
    );
  }
}

