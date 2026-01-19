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
    // Generate job card number
    const count = await this.getJobCount();
    const jobCardNumber = `JC-${String(count + 1).padStart(4, "0")}`;

    const insertData: JobCardInsert = {
      job_card_number: jobCardNumber,
      job_name: job.jobName || "",
      client_name: job.clientName || "",
      board_name: job.boardName || job.jobName || "",
      board_color: job.boardColor || "",
      board_type: (job.boardType || "dinrail").toLowerCase(),
      recipient_name: job.recipientName || "",
      supervisor_name: job.supervisorName || "",
      supervisor_id: job.supervisorId || "",
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

  // Update job status (fabrication or assembling)
  async updateJobStatus(
    id: string,
    type: "fabrication" | "assembling",
    status: "Pending" | "In Progress" | "Completed",
    userId: string,
    userName: string
  ): Promise<JobCard> {
    const job = await this.getJobById(id);
    if (!job) throw new Error("Job not found");

    const updates: Partial<JobCard> = {};

    if (type === "fabrication") {
      updates.fabricationStatus = status;
      updates.fabricationBy = userId;
      updates.fabricationByName = userName;
      if (status === "Completed") {
        updates.fabricationCompletedAt = new Date().toISOString();
      }
    } else {
      updates.assemblingStatus = status;
      updates.assemblingBy = userId;
      updates.assemblingByName = userName;
      if (status === "Completed") {
        updates.assemblingCompletedAt = new Date().toISOString();
      }
    }

    // Update overall status
    if (type === "assembling" && status === "Completed") {
      updates.status = "completed";
      updates.completedAt = new Date().toISOString();
    } else if (type === "fabrication" && status === "In Progress") {
      updates.status = "fabrication";
    } else if (type === "assembling" && status === "In Progress") {
      updates.status = "assembling";
    }

    return this.updateJob(id, updates);
  },

  // Get job by ID
  async getJobById(id: string): Promise<JobCard | null> {
    const { data, error } = await supabase
      .from("job_cards")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapToJobCard(data) : null;
  },

  // Get job count
  async getJobCount(): Promise<number> {
    const { count, error } = await supabase
      .from("job_cards")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
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
      jobName: row.job_name || "",
      clientName: row.client_name || "",
      boardName: row.board_name,
      boardColor: row.board_color || "",
      boardType: (row.board_type as "dinrail" | "hynman") || "dinrail",
      recipientName: row.recipient_name,
      supervisorName: row.supervisor_name,
      supervisorId: row.supervisor_id,
      priority: row.priority as "Low" | "Normal" | "High" | undefined,
      status: row.status as "fabrication" | "assembling" | "completed",
      fabricationStatus: row.fabrication_status || "Pending",
      assemblingStatus: row.assembling_status || "Pending",
      fabricationBy: row.fabrication_by || undefined,
      fabricationByName: row.fabrication_by_name || undefined,
      assemblingBy: row.assembling_by || undefined,
      assemblingByName: row.assembling_by_name || undefined,
      materialsUsed: (row.materials_used as any[]) || [],
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at || new Date().toISOString(),
      fabricationCompletedAt: row.fabrication_completed_at || undefined,
      assemblingCompletedAt: row.assembling_completed_at || undefined,
      completedAt: row.completed_at || undefined,
      notes: row.notes || undefined
    };
  }
};