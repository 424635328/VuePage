// src/utils/crypto.js

// 1. 动态确定全局上下文。在主线程是 window，在 Worker 中是 self。
const G = typeof window !== 'undefined' ? window : self;

/**
 * 从密码和盐生成一个可用于加密的密钥。
 * @param {string} password - 用户提供的密码。
 * @param {Uint8Array} salt - 用于密钥派生的盐。
 * @returns {Promise<CryptoKey>} - 用于 AES-GCM 的密钥。
 */
async function getKey(password, salt) {
  const enc = new TextEncoder();
  // 2. 使用动态全局对象 G 访问 crypto API
  const keyMaterial = await G.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  // 2. 使用动态全局对象 G 访问 crypto API
  return G.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * 使用 AES-GCM 加密数据。
 * @param {string} data - 要加密的 JSON 字符串数据。
 * @param {string} password - 加密密码。
 * @returns {Promise<string>} - Base64 编码的加密字符串。
 */
export async function encryptData(data, password) {
  // 2. 使用动态全局对象 G 访问 crypto API
  const salt = G.crypto.getRandomValues(new Uint8Array(16));
  const iv = G.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);
  const enc = new TextEncoder();

  // 2. 使用动态全局对象 G 访问 crypto API
  const encryptedContent = await G.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(data)
  );

  const encryptedContentArr = new Uint8Array(encryptedContent);
  const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContentArr.byteLength);
  buffer.set(salt, 0);
  buffer.set(iv, salt.byteLength);
  buffer.set(encryptedContentArr, salt.byteLength + iv.byteLength);

  // 3. 使用动态全局对象 G 调用 btoa
  return G.btoa(String.fromCharCode.apply(null, buffer));
}

/**
 * 解密使用 AES-GCM 加密的数据。
 * @param {string} encryptedBase64 - Base64 编码的加密字符串。
 * @param {string} password - 解密密码。
 * @returns {Promise<string>} - 解密后的原始 JSON 字符串。
 */
export async function decryptData(encryptedBase64, password) {
  try {
    // 3. 使用动态全局对象 G 调用 atob
    const encryptedData = G.atob(encryptedBase64);
    const buffer = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      buffer[i] = encryptedData.charCodeAt(i);
    }

    const salt = buffer.slice(0, 16);
    const iv = buffer.slice(16, 28);
    const data = buffer.slice(28);

    const key = await getKey(password, salt);

    // 2. 使用动态全局对象 G 访问 crypto API
    const decryptedContent = await G.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch(error) {
    console.error("Decryption failed:", error);
    // 抛出一个更友好的错误，这通常是因为密码错误或数据损坏
    throw new Error("解密失败，密码错误或文件已损坏。");
  }
}
