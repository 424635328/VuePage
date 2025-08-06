import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    // ✨ UPDATED: Look for 'public_id' instead of 'id' in the query params.
    const publicId = url.searchParams.get('id'); // We'll keep the param name 'id' for simplicity in the URL

    if (!publicId) {
      throw new Error('商品 ID 必须提供');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: product, error } = await supabaseAdmin
      .from('products')
      // ✨ UPDATED: Query using the 'public_id' column.
      .select('*')
      .eq('public_id', publicId)
      .single();

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: '商品未找到' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(product), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
