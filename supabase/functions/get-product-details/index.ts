// /supabase/functions/get-product-details/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // 处理浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const publicId = url.searchParams.get('public_id');

    if (!publicId) {
      return new Response(JSON.stringify({ error: '查询参数 "public_id" 必须提供' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 使用 service_role key 创建一个拥有管理员权限的 Supabase 客户端
    // 这可以绕过行级安全策略（RLS），实现对所有数据的查询
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. 使用 'public_id' 列来查询唯一的商品记录
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('public_id', publicId)
      .single();

    // 如果查询主产品出错或未找到，则直接返回错误
    if (productError) {
      console.error('Product fetch error:', productError.message);
      // 根据错误类型判断，如果是 PGRST116，说明未找到记录
      const status = productError.code === 'PGRST116' ? 404 : 500;
      const message = status === 404 ? '商品未找到' : '查询商品时出错';
      return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      });
    }

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('id, image_url, position') // 可以选择需要的字段
      .eq('product_id', product.id)
      .order('position', { ascending: true }); // 按 position 排序

    // 如果获取图片时出错，记录日志但不要让整个请求失败
    if (imagesError) {
      console.error(`Failed to fetch images for product ${product.id}:`, imagesError.message);
    }

    const responsePayload = {
      ...product,
      images: images || [], // 如果 images 为 null 或 undefined，则返回一个空数组
    };

    // 4. 返回聚合后的完整数据
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // 处理其他未知错误
    console.error('Unexpected error:', err.message);
    return new Response(JSON.stringify({ error: err?.message ?? '未知服务器错误' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // 未知错误通常是 500
    });
  }
})
