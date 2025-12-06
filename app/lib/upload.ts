import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export const uploadImage = async (uri: string, bucket: string) => {
  try {
    // 1. Read the file as Base64 (Using string 'base64' avoids the undefined error)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    // 2. Generate a unique file name
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.jpg`;

    // 3. Upload to Supabase
    // We decode the base64 string back to an ArrayBuffer for Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64), {
        contentType: "image/jpeg",
      });

    if (error) {
      throw error;
    }

    // 4. Get the Public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
