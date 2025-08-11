// /supabase/functions/get-product-details/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // 处理浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 从请求体中获取 public_id，这与你的 k6 测试脚本保持一致
    // 注意：如果前端是通过 query string 传递，需要改回 url.searchParams.get('public_id')
    const { public_id } = await req.json()

    if (!public_id) {
      return new Response(JSON.stringify({ error: '请求体中必须提供 "public_id"' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 使用 service_role key 创建一个拥有管理员权限的 Supabase 客户端
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ✨ 核心优化：从我们创建的视图中进行一次查询！
    const { data: productDetails, error } = await supabaseAdmin
      .from('product_details') // <--- 查询视图，而不是表
      .select('*')
      .eq('public_id', public_id)
      .single(); // 我们期望只找到一个结果

    if (error) {
      // 如果是 'PGRST116'，说明视图中没有找到对应的记录
      const status = error.code === 'PGRST116' ? 404 : 500;
      const message = status === 404 ? '商品未找到' : '查询商品详情时出错';
      console.error(`Error fetching product details for ${public_id}:`, error.message);
      return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      });
    }

    // 如果查询结果中的 images 字段为 null（即没有任何关联图片），则将其设置为空数组
    if (productDetails.images === null) {
      productDetails.images = [];
    }

    // 🚀 性能火箭：返回聚合后的完整数据，并添加缓存头！
    return new Response(JSON.stringify(productDetails), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // s-maxage=60: 让 CDN 缓存 60 秒
        // stale-while-revalidate=300: 缓存过期后，允许在后台更新的同时先返回旧缓存，持续5分钟
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      },
      status: 200,
    });

  } catch (err) {
    // 处理 JSON 解析错误等其他未知问题
    console.error('Unexpected error:', err.message);
    return new Response(JSON.stringify({ error: err?.message ?? '未知服务器错误' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
