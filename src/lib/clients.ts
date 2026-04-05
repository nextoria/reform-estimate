export interface ClientConfig {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  phone: string;
  lineUrl?: string;
}

export const clients: Record<string, ClientConfig> = {
  "client-a": {
    id: "client-a",
    name: "サンプルリフォーム株式会社",
    primaryColor: "#2563eb",
    phone: "0120-000-001",
    lineUrl: "https://line.me/R/ti/p/@example-a",
  },
  "client-b": {
    id: "client-b",
    name: "快適住まいリフォーム",
    primaryColor: "#059669",
    phone: "0120-000-002",
    lineUrl: "https://line.me/R/ti/p/@example-b",
  },
};

export function getClient(clientId: string): ClientConfig | undefined {
  return clients[clientId];
}

/** Static config with defaults for clients not in the hardcoded map */
export function getClientConfig(clientKey: string): Omit<ClientConfig, "id" | "name"> {
  const config = clients[clientKey];
  return {
    primaryColor: config?.primaryColor ?? "#2563eb",
    phone: config?.phone ?? "",
    lineUrl: config?.lineUrl,
    logo: config?.logo,
  };
}
