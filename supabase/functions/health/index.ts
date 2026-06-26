import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY")

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({
        status: "error",
        db: "missing_config",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const start = Date.now()
  const { error } = await supabase
    .from("suppliers")
    .select("id", { count: "exact", head: true })
  const dbMs = Date.now() - start

  const body = {
    status: error ? "degraded" : "ok",
    db: error ? "error" : "ok",
    dbMs,
    timestamp: new Date().toISOString(),
    error: error?.message,
  }

  return new Response(JSON.stringify(body), {
    status: error ? 503 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
