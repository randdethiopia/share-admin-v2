import axios from "axios";
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from "@tanstack/react-query";



export interface Permission {
  _id: string;
  name: string;
  description: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface RoleResponse {
  message: string;
  roles: Role[];
}

export interface PermissionResponse {
  message: string;
  permissions: Permission[];
}

interface CreateRoleInput {
  name: string;
  description: string;
  permissionIds: string[]
}

interface CreateRoleResponse {
  message: string;
  role: Role;
}

const createRoleFn = async (data: CreateRoleInput) => {
  return (await axios.post("/api/access/roles", data)).data
}

const getRolesFn = async () => {
  return (await axios.get("/api/access/roles")).data
}

const getPermissionsFn = async () => {
  return (await axios.get("/api/access/permissions")).data
}




const Access = {
  createRole: {
    useMutation: (options?: UseMutationOptions<CreateRoleResponse, unknown, CreateRoleInput>) =>
      useMutation({
        mutationFn: (data) => createRoleFn(data),
        ...options
      })
  },
  getRoles: {
    useQuery: (options?: UseQueryOptions<RoleResponse, Error>) =>
      useQuery({
        queryKey: ["roles"],
        queryFn: getRolesFn,
        ...options
      })
  },

  getPermissions: {
    useQuery: (options?: UseQueryOptions<PermissionResponse, Error>) =>
      useQuery({
        queryKey: ["permissions"],
        queryFn: getPermissionsFn,
        ...options
      })
  }

}

export default Access;
