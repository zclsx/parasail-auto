const axios = require('axios');
const ethers = require('ethers');

class UserAPI {
  constructor(logger) {
    this.logger = logger;
    this.baseUrl = 'https://www.parasail.network/api';
  }

  /**
   * 打码显示地址
   */
  maskAddress(address) {
    if (!address) return '未验证';
    return `${address.substr(0, 6)}...${address.substr(-4)}`;
  }

  /**
   * 生成验证签名
   */
  async generateSignature(privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    const message = `By signing this message, you confirm that you agree to the Parasail Terms of Service.

Parasail (including the Website and Parasail Smart Contracts) is not intended for:
(a) access and/or use by Excluded Persons;
(b) access and/or use by any person or entity in, or accessing or using the Website from, an Excluded Jurisdiction.

Excluded Persons are prohibited from accessing and/or using Parasail (including the Website and Parasail Smart Contracts).

For full terms, refer to: https://parasail.network/Parasail_User_Terms.pdf`;
    
    const signature = await wallet.signMessage(message);
    return {
      address: wallet.address,
      msg: message,
      signature
    };
  }

  /**
   * 验证用户并获取令牌
   */
  async verifyUser(privateKey, referLink) {
    try {
      const signatureData = await this.generateSignature(privateKey);
      
      this.logger.info(`🔑 正在验证钱包地址: ${this.maskAddress(signatureData.address)}`);
      
      const response = await axios.post(`${this.baseUrl}/user/verify`, signatureData, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Referer': `https://www.parasail.network/season?refer=${referLink}`
        }
      });

      this.logger.success('✅ 用户验证成功');
      
      return {
        token: response.data.token,
        address: signatureData.address
      };
    } catch (error) {
      this._handleApiError(error, '用户验证');
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

module.exports = UserAPI; 