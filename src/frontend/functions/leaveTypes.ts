export type LeaveModalRecord = {
  id: number;
  fullName: string;
  employeeType: "teaching" | "non-teaching";
  periodOfLeave: string;
  particulars: string;
  balVl: number;
  balSl: number;
  dateOfAction: string;
};
