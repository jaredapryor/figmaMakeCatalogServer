const { createLocalStore } = require("./localStore");
const { createSupabaseStore } = require("./supabaseStore");

function createDataStore() {
  const source = (process.env.DATA_SOURCE || "local").toLowerCase().trim();

  if (source === "local" || source === "") {
    return { store: createLocalStore(), source: "local" };
  }

  if (source === "supabase") {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error(
        "DATA_SOURCE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
      );
    }

    return {
      store: createSupabaseStore({ url, serviceRoleKey }),
      source: "supabase",
    };
  }

  throw new Error(`Unknown DATA_SOURCE "${source}". Use "local" or "supabase".`);
}

module.exports = { createDataStore };
