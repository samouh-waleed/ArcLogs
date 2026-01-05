// This hook should be called whenever you add or remove organization members
// Example usage in your member management code

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

// Example usage in Settings page:

/*
import { useUpdateSubscriptionSeats } from "@/hooks/useUpdateSubscriptionSeats";

export default function SettingsPage() {
  const updateSeats = useUpdateSubscriptionSeats();
  
  // After adding a member
  const addMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      // Add member logic...
    },
    onSuccess: () => {
      // Update subscription seats
      updateSeats.mutate(activeOrg?.id);
    },
  });
  
  // After removing a member
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Remove member logic...
    },
    onSuccess: () => {
      // Update subscription seats
      updateSeats.mutate(activeOrg?.id);
    },
  });
}
*/
