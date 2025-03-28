const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const axios = require('axios');

class ProxyManager {
  constructor(logger) {
    this.logger = logger;
    this.agent = null;
  }

  /**
   * 设置代理
   * @param {string} proxyString - 代理字符串 (格式: ip:port 或 http://user:pass@host:port)
   * @returns {boolean} 是否成功设置代理
   */
  setupProxy(proxyString) {
    if (!proxyString) {
      // 无代理配置时直接重置代理设置
      this._resetProxy();
      return false;
    }

    try {
      // 处理不同格式的代理字符串
      let proxyUrl = proxyString;
      
      // 如果只有IP:PORT格式，添加http://前缀
      if (!proxyUrl.includes('://')) {
        proxyUrl = `http://${proxyUrl}`;
      }
      
      // 创建代理代理
      const httpsAgent = new HttpsProxyAgent(proxyUrl);
      const httpAgent = new HttpProxyAgent(proxyUrl);
      
      // 设置全局代理
      axios.defaults.httpsAgent = httpsAgent;
      axios.defaults.httpAgent = httpAgent;
      axios.defaults.proxy = false;  // 必须设置为false，让Agent处理代理
      
      // 记录代理信息
      this.agent = {
        https: httpsAgent,
        http: httpAgent,
        url: proxyUrl
      };
      
      this.logger.success(`✅ 代理服务器已配置: ${this._maskProxyUrl(proxyUrl)}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ 代理服务器配置失败: ${error.message}`);
      this._resetProxy();
      return false;
    }
  }

  /**
   * 重置代理配置
   * @private
   */
  _resetProxy() {
    axios.defaults.httpsAgent = undefined;
    axios.defaults.httpAgent = undefined;
    axios.defaults.proxy = undefined;
    this.agent = null;
  }

  /**
   * 掩码显示代理URL
   * @private
   * @param {string} url - 原始代理URL
   * @returns {string} 掩码后的URL
   */
  _maskProxyUrl(url) {
    try {
      const proxyUrl = new URL(url);
      
      // 如果有用户名密码，进行掩码处理
      if (proxyUrl.username) {
        return `${proxyUrl.protocol}//${proxyUrl.username.substring(0, 2)}***:***@${proxyUrl.host}`;
      }
      
      // 无验证信息的代理直接返回
      return url;
    } catch (error) {
      // 如果URL格式不正确，返回原始字符串
      return url;
    }
  }

  /**
   * 获取当前代理状态
   * @returns {object|null} 当前代理状态或null
   */
  getStatus() {
    if (!this.agent) {
      return null;
    }
    
    return {
      active: true,
      url: this._maskProxyUrl(this.agent.url)
    };
  }
}

module.exports = ProxyManager; 