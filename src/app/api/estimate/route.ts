import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateEstimate } from "@/lib/estimate";
import { sendEstimateNotification } from "@/lib/line-notify";
import { getClient } from "@/lib/clients";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientId = formData.get("clientId") as string;
    const buildingAge = parseInt(formData.get("buildingAge") as string) || 0;
    const concerns = (formData.get("concerns") as string)?.split(",").filter(Boolean) ?? [];
    const details = (formData.get("details") as string) || null;
    const lineUserId = (formData.get("lineUserId") as string) || null;

    // Handle photo uploads
    const photoPaths: string[] = [];
    for (let i = 0; i < 3; i++) {
      const photo = formData.get(`photo${i}`) as File | null;
      if (photo && photo.size > 0) {
        const uploadDir = path.join(process.cwd(), "public/uploads", clientId);
        await mkdir(uploadDir, { recursive: true });
        const ext = photo.name.split(".").pop() ?? "jpg";
        const filename = `${Date.now()}-${i}.${ext}`;
        const filepath = path.join(uploadDir, filename);
        const bytes = new Uint8Array(await photo.arrayBuffer());
        await writeFile(filepath, bytes);
        photoPaths.push(`/uploads/${clientId}/${filename}`);
      }
    }

    // Generate estimate (async - reads from EstimateRule DB)
    const estimate = await generateEstimate({
      clientId,
      buildingAge,
      concerns,
      photoCount: photoPaths.length,
      details: details ?? undefined,
    });

    // Save to DB
    const lead = await prisma.lead.create({
      data: {
        clientId,
        buildingAge,
        concerns: concerns.join(","),
        details,
        photos: JSON.stringify(photoPaths),
        estimate: JSON.stringify(estimate),
        lineUserId,
      },
    });

    // Send LINE notification (non-blocking)
    let lineNotified = false;
    if (lineUserId) {
      const client = getClient(clientId);
      if (client) {
        lineNotified = await sendEstimateNotification({
          lineUserId,
          clientName: client.name,
          estimate,
          clientPhone: client.phone,
        });
      }
    }

    return Response.json({ id: lead.id, estimate, lineNotified });
  } catch (error) {
    console.error("Estimate error:", error);
    return Response.json({ error: "見積の生成に失敗しました" }, { status: 500 });
  }
}
