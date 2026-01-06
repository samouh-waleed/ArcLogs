// hooks/useUpdateSubscriptionSeats.ts
import { useMutation } from "@tanstack/react-query";

export function useUpdateSubscriptionSeats() {
  return useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch("/api/update-subscription-seats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update subscription");
      }

      return response.json();
    },
  });
}
