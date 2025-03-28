const axios = require('axios');

class NodeAPI {
  constructor(logger) {
    this.logger = logger;
    this.baseUrl = 'https://www.parasail.network/api';
  }

  /**
   * 获取节点统计信息
   */
  async getNodeStats(wallet_address, bearer_token, referLink) {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/node/node_stats`, {
        params: { 
          address: wallet_address,
          refer: referLink
        },
        headers: {
          'Authorization': `Bearer ${bearer_token}`,
          'Accept': 'application/json, text/plain, */*',
          'Referer': `https://www.parasail.network/season?refer=${referLink}`
        }
      });
      return response.data;
    } catch (error) {
      this._handleApiError(error, '获取节点统计');
      throw error;
    }
  }

  /**
   * 执行每日签到
   */
  async checkIn(wallet_address, bearer_token, referLink) {
    try {
      const checkInResponse = await axios.post(
        `${this.baseUrl}/v1/node/check_in`, 
        { 
          address: wallet_address,
          refer: referLink
        },
        {
          headers: {
            'Authorization': `Bearer ${bearer_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Referer': `https://www.parasail.network/season?refer=${referLink}`
          }
        }
      );

      this.logger.success('✅ 节点签到成功');
      return checkInResponse.data;
    } catch (error) {
      this._handleApiError(error, '节点签到');
      throw error;
    }
  }

  /**
   * 激活节点
   */
  async onboardNode(wallet_address, bearer_token, referLink) {
    try {
      const response = await axios.post(`${this.baseUrl}/v1/node/onboard`, 
        { 
          address: wallet_address,
          refer: referLink
        },
        {
          headers: {
            'Authorization': `Bearer ${bearer_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Referer': `https://www.parasail.network/season?refer=${referLink}`
          }
        }
      );

      this.logger.success('🚀 节点激活成功');
      return response.data;
    } catch (error) {
      this._handleApiError(error, '节点激活');
      throw error;
    }
  }

  /**
   * 处理API错误
   * @private
   */
  _handleApiError(error, operation) {
    if (error.response) {
      this.logger.error(`❌ ${operation}错误详情:`);
      this.logger.error(`   状态码: ${error.response.status}`);
      this.logger.error(`   错误信息: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      this.logger.error(`❌ ${operation}无响应: ${error.request}`);
    } else {
      this.logger.error(`❌ ${operation}请求错误: ${error.message}`);
    }
  }
}

module.exports = NodeAPI; 