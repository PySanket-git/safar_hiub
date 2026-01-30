import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/config/database";
import Message from "@/models/Message";
import { auth } from "@/lib/middlewares/auth";

// GET messages for a requirement
export const GET = auth(async (req: NextRequest) => {
  try {
    await dbConnect();

    const user = (req as any).user;
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requirementId = searchParams.get("requirementId");
    const otherUserId = searchParams.get("userId");

    if (!requirementId || !otherUserId) {
      return NextResponse.json(
        { success: false, message: "requirementId and userId are required" },
        { status: 400 }
      );
    }

    // Get messages between the two users for this requirement
    const messages = await Message.find({
      requirementId,
      $or: [
        { sender: user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName avatar")
      .populate("receiver", "fullName avatar");

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("GET /messages ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});

// POST a new message
export const POST = auth(async (req: NextRequest) => {
  try {
    await dbConnect();

    const user = (req as any).user;
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { requirementId, receiverId, message } = body;

    if (!requirementId || !receiverId || !message?.trim()) {
      return NextResponse.json(
        { success: false, message: "requirementId, receiverId, and message are required" },
        { status: 400 }
      );
    }

    const newMessage = await Message.create({
      requirementId,
      sender: user.id,
      receiver: receiverId,
      message: message.trim(),
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "fullName avatar")
      .populate("receiver", "fullName avatar");

    return NextResponse.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("POST /messages ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});
