import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("audio") as File | null;
      const courseId = formData.get("courseId") as string | null;
      const title = formData.get("title") as string | null;

      if (!file) {
        return NextResponse.json(
          { error: "No audio file provided." },
          { status: 400 }
        );
      }

      if (!courseId) {
        return NextResponse.json(
          { error: "Course ID is required." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds maximum of 500MB." },
          { status: 400 }
        );
      }

      if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid file type. Supported formats: MP3, WAV, M4A, OGG, WebM, FLAC.",
          },
          { status: 400 }
        );
      }

      const course = await db.course.findFirst({
        where: {
          id: courseId,
          userId: session.user.id,
        },
      });

      if (!course) {
        return NextResponse.json(
          { error: "Course not found." },
          { status: 404 }
        );
      }

      const lecture = await db.lecture.create({
        data: {
          courseId,
          userId: session.user.id,
          title: title || `Lecture ${new Date().toLocaleDateString()}`,
          captureMethod: "UPLOAD",
          processingStatus: "PENDING",
          durationSeconds: null,
        },
      });

      return NextResponse.json(
        {
          lecture: {
            id: lecture.id,
            title: lecture.title,
            processingStatus: lecture.processingStatus,
            captureMethod: lecture.captureMethod,
            createdAt: lecture.createdAt,
          },
          message:
            "Lecture audio uploaded. Processing will begin shortly.",
        },
        { status: 201 }
      );
    }

    const body = await request.json();
    const { courseId, title, captureMethod } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required." },
        { status: 400 }
      );
    }

    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    const lecture = await db.lecture.create({
      data: {
        courseId,
        userId: session.user.id,
        title: title || `Lecture ${new Date().toLocaleDateString()}`,
        captureMethod: captureMethod || "UPLOAD",
        processingStatus: "PENDING",
      },
    });

    return NextResponse.json(
      {
        lecture: {
          id: lecture.id,
          title: lecture.title,
          processingStatus: lecture.processingStatus,
          captureMethod: lecture.captureMethod,
          createdAt: lecture.createdAt,
        },
        message:
          "Lecture record created. Upload audio to begin processing.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lecture upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload lecture." },
      { status: 500 }
    );
  }
}
