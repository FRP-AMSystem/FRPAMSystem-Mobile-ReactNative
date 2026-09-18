import client from "./client";
import { SkillItem } from "../types/skill";

export async function getSkills(): Promise<SkillItem[]> {
  const res = await client.get("/Skills", {
    params: { Size: 100 },
  });
  const rawList = res.data?.data?.items || res.data?.items || res.data?.data || [];
  return rawList.map((s: any) => ({
    skillId: Number(s.skillId || s.id || 0),
    skillName: s.skillName || s.name || "",
    description: s.description || null,
  }));
}
