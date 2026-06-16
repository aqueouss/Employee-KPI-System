import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";
import type { Tables } from "@/types/database.types";

// Deduped per request: the dashboard layout and the page both call this during
// a single render, so React.cache collapses them into one auth + profile fetch.
export const getSessionProfile = cache(
  async (): Promise<Profile | null> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Tables<"profiles">>();

    if (!profile || !profile.is_active) {
      return null;
    }

    return profile;
  },
);
