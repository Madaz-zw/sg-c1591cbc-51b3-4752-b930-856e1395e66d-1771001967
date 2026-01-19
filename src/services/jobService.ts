import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { JobCard } from "@/types";

type JobCardRow = Database["public"]["Tables"]["job_cards"]["Row"];
type JobCardInsert = Database["public"]["Tables"]["job_cards"]["Insert"];
type JobCardUpdate = Database["public"]["Tables"]["job_cards"]["Update"];

export const jobService = {
  // Get all job cards
  async getAllJobs(): Promise<JobCard[]> {
    const { data, error } = await supabase
      .from("job_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToJobCard);
  },

  // Create job card
  async createJob(job: Omit<JobCard, "id" | "createdAt">): Promise<JobCard> {
    const insertData: JobCardInsert = {
      job_card_number: job.jobCardNumber,
      board_name: job.boardName,
      board_color: job.boardColor,
      board_type: job.boardType,
      recipient_name: job.recipientName,
      supervisor_name: job.supervisorName,
      supervisor_id: job.supervisorId,
      status: job.status,
      materials_used: job.materialsUsed || [],
      created_by: job.createdBy,
      created_by_name: job.createdByName,
      fabrication_completed_at: job.fabricationCompletedAt,
      assembling_completed_at: job.assemblingCompletedAt,
      completed_at: job.completedAt
    };

    const { data, error } = await supabase
      .from("job_cards")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToJobCard(data);
  },

  // Update job card
  async updateJob(id: string, updates: Partial<JobCard>): Promise<JobCard> {
    const updateData: JobCardUpdate = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.materialsUsed) updateData.materials_used = updates.materialsUsed;
    if (updates.fabricationCompletedAt) updateData.fabrication_completed_at = updates.fabricationCompletedAt;
    if (updates.assemblingCompletedAt) updateData.assembling_completed_at = updates.assemblingCompletedAt;
    if (updates.completedAt) updateData.completed_at = updates.completedAt;

    const { data, error } = await supabase
      .from("job_cards")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToJobCard(data);
  },

  // Delete job card
  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from("job_cards")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Map database row to JobCard
  mapToJobCard(row: JobCardRow): JobCard {
    return {
      id: row.id,
      jobCardNumber: row.job_card_number,
      boardName: row.board_name,
      boardColor: row.board_color || "",
      boardType: row.board_type as "dinrail" | "hynman",
      recipientName: row.recipient_name,
      supervisorName: row.supervisor_name,
      supervisorId: row.supervisor_id,
      status: row.status as "fabrication" | "assembling" | "completed",
      materialsUsed: (row.materials_used as any[]) || [],
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at || new Date().toISOString(),
      fabricationCompletedAt: row.fabrication_completed_at || undefined,
      assemblingCompletedAt: row.assembling_completed_at || undefined,
      completedAt: row.completed_at || undefined
    };
  }
};