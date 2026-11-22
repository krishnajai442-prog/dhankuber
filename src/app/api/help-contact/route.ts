export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["tips", "agent", "advertise", "listing", "build", "suggest"]),
  lang: z.string().min(2).max(5),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(5, "Telegram or WhatsApp number is required"),
  gameName: z.string().max(100).optional().or(z.literal("")),
  resultTime: z.string().max(10).optional().or(z.literal("")),
  message: z.string().max(280).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (validation.data.type === "listing") {
      if (!validation.data.gameName || !validation.data.resultTime) {
        return NextResponse.json({ success: false, message: "Game name and result time are required" }, { status: 400 });
      }
    }
    // In production you can email / save this to MongoDB here.
    console.log("Help contact submission:", validation.data);
    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Help contact error:", error);
    return NextResponse.json({ success: false, message: "Failed to send message" }, { status: 500 });
  }
}