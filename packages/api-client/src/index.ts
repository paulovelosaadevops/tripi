export type HealthStatus = {
  status: "UP";
  service: "tripi-api";
};

export async function getHealth(baseUrl: string): Promise<HealthStatus> {
  const response = await fetch(new URL("/v1/health", baseUrl));

  if (!response.ok) {
    throw new Error(`Tripi API health check failed with ${response.status}`);
  }

  return response.json() as Promise<HealthStatus>;
}
