import crypto from 'crypto';

/**
 * 企业微信消息加解密工具
 * 参考: https://developer.work.weixin.qq.com/document/path/90968
 */

export class WeComCrypto {
  private token: string;
  private encodingAESKey: string;
  private corpId: string;
  private aesKey: Buffer;
  private iv: Buffer;

  constructor(token: string, encodingAESKey: string, corpId: string) {
    this.token = token;
    this.encodingAESKey = encodingAESKey;
    this.corpId = corpId;
    
    // EncodingAESKey 是 Base64 编码的 AES 密钥
    this.aesKey = Buffer.from(encodingAESKey + '=', 'base64');
    // AES CBC 模式的 IV 是密钥的前 16 字节
    this.iv = this.aesKey.slice(0, 16);
  }

  /**
   * 验证签名
   */
  verifySignature(signature: string, timestamp: string, nonce: string, echostr: string): boolean {
    const calculatedSignature = this.calculateSignature(timestamp, nonce, echostr);
    return calculatedSignature === signature;
  }

  /**
   * 计算签名
   */
  private calculateSignature(timestamp: string, nonce: string, echostr: string): string {
    const arr = [this.token, timestamp, nonce, echostr].sort();
    const sha1 = crypto.createHash('sha1');
    sha1.update(arr.join(''));
    return sha1.digest('hex');
  }

  /**
   * 解密 echostr
   */
  decrypt(echostr: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.aesKey, this.iv);
    decipher.setAutoPadding(false);
    
    let decrypted = Buffer.concat([
      decipher.update(echostr, 'base64'),
      decipher.final()
    ]);

    // 去除 PKCS#7 填充
    const pad = decrypted[decrypted.length - 1];
    if (pad < 1 || pad > 32) {
      pad; // no-op, just to avoid unused variable warning
    } else {
      decrypted = decrypted.slice(0, decrypted.length - pad);
    }

    // 解密后的数据格式：
    // 16 字节随机字符串 + 4 字节消息长度（网络字节序）+ 消息内容 + CorpID
    const msgLength = decrypted.readUInt32BE(16);
    const message = decrypted.slice(20, 20 + msgLength).toString('utf8');
    const extractedCorpId = decrypted.slice(20 + msgLength).toString('utf8');

    if (extractedCorpId !== this.corpId) {
      throw new Error(`CorpID mismatch: expected ${this.corpId}, got ${extractedCorpId}`);
    }

    return message;
  }

  /**
   * 验证并解密 echostr（用于 GET 请求验证）
   */
  verifyAndDecrypt(msgSignature: string, timestamp: string, nonce: string, echostr: string): string {
    // 1. 验证签名
    if (!this.verifySignature(msgSignature, timestamp, nonce, echostr)) {
      throw new Error('Signature verification failed');
    }

    // 2. 解密 echostr
    return this.decrypt(echostr);
  }
}

/**
 * 创建企业微信加解密实例
 */
export function createWeComCrypto(): WeComCrypto | null {
  const token = process.env.WECOM_TOKEN;
  const encodingAESKey = process.env.WECOM_ENCODING_AES_KEY;
  const corpId = process.env.WECOM_CORP_ID;

  if (!token || !encodingAESKey || !corpId) {
    console.error('Missing WECOM_TOKEN, WECOM_ENCODING_AES_KEY, or WECOM_CORP_ID');
    return null;
  }

  return new WeComCrypto(token, encodingAESKey, corpId);
}
