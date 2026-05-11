export type Roles = "ADMIN" | `TRANNIE`;

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

