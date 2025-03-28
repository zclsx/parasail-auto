const fs = require('fs');
const path = require('path');

class ConfigSaver {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * 保存配置到文件
   */
  saveConfig(config) {
    try {
      const configPath = path.resolve('./config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      this.logger.success('✅ 配置已保存成功');
      return true;
    } catch (error) {
      this.logger.error(`❌ 保存配置失败: ${error.message}`);
      return false;
    }
  }
}

module.exports = ConfigSaver; 