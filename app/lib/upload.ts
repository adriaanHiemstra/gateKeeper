import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export const uploadImage = async (uri: string, bucket: string) => {
  try {
    // 1. Determine file type based on extension
    const isVideo =
      uri.toLowerCase().endsWith(".mp4") || uri.toLowerCase().endsWith(".mov");
    const fileExt = isVideo ? "mp4" : "jpg";
    const contentType = isVideo ? "video/mp4" : "image/jpeg";

    // 2. Read the file
    // Note: For very large videos, readAsStringAsync might be slow.
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    // 3. Generate a unique file name with correct extension
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    // 4. Upload to Supabase with correct Content-Type
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64), {
        contentType: contentType, // ✅ Dynamic content type
      });

    if (error) {
      throw error;
    }

    // 5. Get the Public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
