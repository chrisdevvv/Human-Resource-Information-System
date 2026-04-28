export type LeaveModalRecord = {
  id: number;
  fullName: string;
  employeeType: "teaching" | "non-teaching" | "teaching-related";
  schoolName?: string;
  periodOfLeave: string;
  particulars: string;
  balVl: number;
  balSl: number;
  dateOfAction: string;
  // leave-record-specific fields (optional; not present on employee-only records)
  employeeId?: number;
  earnedVl?: number;
  absWithPayVl?: number;
  absWithoutPayVl?: number;
  earnedSl?: number;
  absWithPaySl?: number;
  absWithoutPaySl?: number;
};
