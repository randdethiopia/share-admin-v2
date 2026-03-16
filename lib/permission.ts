import useAuthStore from "@/store/useAuthStore";


export const hasPermission = (key: string) => {
  const permissions = useAuthStore.getState().permissions ?? [];
  return permissions.includes(key);
};