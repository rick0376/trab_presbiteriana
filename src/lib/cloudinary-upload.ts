//src/lib/cloudinary-upload.ts

import cloudinary from "@/lib/cloudinary";

export async function uploadBufferToCloudinary(params: {
  buffer: Buffer;
  folder: string;
  transformation?: Record<string, any>[];
}) {
  const { buffer, folder, transformation } = params;

  const result: any = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
          transformation: transformation ?? [
            { width: 1800, height: 1800, crop: "limit" },
            { quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      )
      .end(buffer);
  });

  return {
    url: result.secure_url as string,
    publicId: result.public_id as string,
  };
}

export async function destroyCloudinaryAssetAndCleanup(
  publicId?: string | null,
) {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Erro ao deletar asset do Cloudinary:", err);
  }

  try {
    const folder = publicId.split("/").slice(0, -1).join("/");

    if (!folder) return;

    const resources = await cloudinary.api.resources({
      type: "upload",
      prefix: folder,
      max_results: 1,
    });

    if (resources.resources.length === 0) {
      await cloudinary.api.delete_folder(folder);
    }
  } catch (err) {
    console.error("Erro ao limpar pasta do Cloudinary:", err);
  }
}
