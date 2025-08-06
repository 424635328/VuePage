import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // 处理浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    // ✨ 修复: 将查询参数从 'id' 改为 'public_id'，与前端和数据库字段保持一致
    const publicId = url.searchParams.get('public_id');

    if (!publicId) {
      // ✨ 优化: 更新错误提示，使其更明确
      throw new Error('查询参数 "public_id" 必须提供');
    }

    // 使用 service_role key 创建一个拥有管理员权限的 Supabase 客户端
    // 这可以绕过行级安全策略（RLS），实现对所有数据的查询
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 使用 'public_id' 列来查询唯一的商品记录
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('public_id', publicId)
      .single(); // .single() 确保只返回一条记录，否则会报错

    // 如果查询出错或未找到商品，返回 404
    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: '商品未找到' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 成功找到商品，返回商品数据
    return new Response(JSON.stringify(product), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // 处理其他未知错误
    return new Response(JSON.stringify({ error: err?.message ?? '未知错误' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
