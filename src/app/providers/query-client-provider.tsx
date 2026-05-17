import type { PropsWithChildren } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";

type QueryProviderProps = PropsWithChildren<{
  queryClient: QueryClient;
}>;

export function AppQueryProvider({ children, queryClient }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
