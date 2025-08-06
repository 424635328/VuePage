// -- Supabase Edge Function: contact-form-handler/index.ts --

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

// [代码健壮性修复] 1. 定义 CORS 头，允许来自任何源的请求
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// [最佳实践] 2. 从 Supabase 环境变量中安全地获取敏感信息
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_EMAIL = Deno.env.get('CONTACT_FORM_RECIPIENT_EMAIL') // 您的收件邮箱
// [品牌化] 3. 将您的 LOGO URL 放在这里 (必须是公开可访问的链接)
// 建议：上传到您的 Supabase Storage，并获取其公共 URL
const LOGO_URL = 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/assets/LOGO.jpeg' // <-- 请替换为您的真实 Logo 链接

// 确保环境变量已设置
if (!RESEND_API_KEY || !TO_EMAIL) {
  console.error("环境变量 RESEND_API_KEY 或 CONTACT_FORM_RECIPIENT_EMAIL 未设置。")
}
const resend = new Resend(RESEND_API_KEY!)


serve(async (req) => {
  // 处理跨域预检请求 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message } = await req.json()

    // [安全性] 4. 对用户输入的消息进行简单的 HTML 转义，防止注入
    const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // [邮件风格优化] 5. 使用专业、带样式的 HTML 模板
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>来自 MHStudio 的新消息</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f7; color: #333;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 30px 20px; background-color: #1a1a1a; border-bottom: 3px solid #00f2ea;">
                    <img src="${LOGO_URL}" alt="MHStudio Logo" width="60" style="display: block; border-radius: 50%;">
                    <h1 style="color: #ffffff; margin: 10px 0 0; font-size: 24px;">您有一条新留言</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 30px 40px;">
                    <h2 style="font-size: 18px; margin-top: 0; color: #555;">详细信息:</h2>
                    <table width="100%" border="0" cellspacing="0" cellpadding="5" style="border-collapse: collapse;">
                      <tr style="border-bottom: 1px solid #eeeeee;">
                        <td style="padding: 10px 0; width: 100px; font-weight: bold;">来自:</td>
                        <td style="padding: 10px 0;">${name}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eeeeee;">
                        <td style="padding: 10px 0; font-weight: bold;">邮箱:</td>
                        <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a></td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eeeeee;">
                        <td style="padding: 10px 0; font-weight: bold;">主题:</td>
                        <td style="padding: 10px 0;">${subject || '无'}</td>
                      </tr>
                    </table>
                    <h2 style="font-size: 18px; margin: 30px 0 10px; color: #555;">消息内容:</h2>
                    <div style="background-color: #f9f9f9; border-left: 3px solid #00f2ea; padding: 15px; border-radius: 4px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
                      ${sanitizedMessage}
                    </div>
                  </td>
                </tr>
                <!-- Action Button -->
                <tr>
                  <td align="center" style="padding: 20px 40px 40px;">
                    <a href="mailto:${email}" style="display: inline-block; padding: 12px 25px; background-color: #00f2ea; color: #1a1a1a; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      直接回复
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px; background-color: #f0f0f0; font-size: 12px; color: #888;">
                    此邮件由 MHStudio 网站联系表单自动发送
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: 'MHStudio Contact <onboarding@resend.dev>', // 可以自定义发件人名称
      to: [TO_EMAIL], // 使用环境变量中的收件人地址
      reply_to: email,
      subject: `来自您网站的新消息: ${subject || '无主题'}`,
      html: emailHtml, // 使用优化后的 HTML 模板
    });

    if (error) {
      console.error({ error });
      throw error;
    }

    return new Response(JSON.stringify({ message: 'Email sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
