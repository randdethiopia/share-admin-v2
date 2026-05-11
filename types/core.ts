export type Roles = "ADMIN" | "COORDINATOR" | `TRANNIE`;

export type ErrorRes = { 
  message: string 
};
export interface SuccessRes {
  success: boolean;
  message: string;
}
export interface FileType {
  url: string;
  id: string;
}

