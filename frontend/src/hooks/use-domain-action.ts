import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authError } from "@/services/auth-service";
export function useDomainAction() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(action: () => Promise<void>, success = "Changes saved.") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await client.invalidateQueries({ queryKey: ["domain"] });
      setMessage(success);
    } catch (err) {
      setError(authError(err));
    } finally {
      setBusy(false);
    }
  }
  return { run, error, busy, message };
}
