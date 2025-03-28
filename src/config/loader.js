const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * 从文本文件读取私钥和代理配置
   */
  loadFromTextFiles() {
    try {
      const privateKeyPath = path.resolve('./privatekeys.txt');
      const proxyPath = path.resolve('./proxies.txt');
      const referLinkPath = path.resolve('./referLink.txt');
      
      // 检查私钥文件是否存在
      if (!fs.existsSync(privateKeyPath)) {
        this.logger.warn('未找到privatekeys.txt文件，将使用config.json中的配置');
        return false;
      }
      
      // 读取私钥文件
      const privateKeys = fs.readFileSync(privateKeyPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());
      
      // 读取代理文件（如果存在）
      let proxies = [];
      if (fs.existsSync(proxyPath)) {
        proxies = fs.readFileSync(proxyPath, 'utf8')
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => line.trim());
      }
      
      // 读取推荐链接文件（如果存在）
      let referLink = 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0'; // 默认值
      if (fs.existsSync(referLinkPath)) {
        const referLinks = fs.readFileSync(referLinkPath, 'utf8')
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => line.trim());
        
        if (referLinks.length > 0) {
          referLink = referLinks[0]; // 使用第一行作为推荐链接
          this.logger.info(`从文件读取到推荐链接: ${referLink}`);
        }
      }
      
      this.logger.info(`从文件读取到 ${privateKeys.length} 个私钥`);
      
      // 创建账号配置数组
      const newAccounts = [];
      
      // 为每个私钥创建配置
      for (let i = 0; i < privateKeys.length; i++) {
        const privateKey = privateKeys[i];
        // 匹配代理（如果代理数量少于私钥，循环使用代理）
        const proxy = proxies.length > 0 ? proxies[i % proxies.length] : null;
        
        newAccounts.push({
          privateKey,
          proxy,
          custom_name: `账号-${i + 1}`,
          referLink: referLink
        });
      }
      
      // 检查是否从文件中读取到了有效的账号
      if (newAccounts.length === 0) {
        this.logger.warn('从文件中未读取到有效的账号配置');
        return false;
      }
      
      this.logger.success(`成功从文件中加载 ${newAccounts.length} 个账号配置`);
      return newAccounts;
    } catch (error) {
      this.logger.error(`从文本文件加载配置失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 加载配置文件
   */
  loadConfig() {
    try {
      // 先尝试从文本文件加载
      const textFileConfig = this.loadFromTextFiles();
      if (textFileConfig) {
        return textFileConfig;
      }
      
      // 如果从文本文件加载失败，从config.json加载
      const configPath = path.resolve('./config.json');
      if (fs.existsSync(configPath)) {
        const rawConfig = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(rawConfig);
      } else {
        this.logger.warn('未找到config.json文件，将创建默认配置');
        // 创建一个最小化的默认配置
        const defaultConfig = [{
          privateKey: '',
          custom_name: '示例账号',
          referLink: 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0'
        }];
        
        // 如果存在示例配置文件，则使用它作为模板
        const examplePath = path.resolve('./config.example.json');
        if (fs.existsSync(examplePath)) {
          try {
            const exampleConfig = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
            // 使用示例配置但清除私钥字段
            if (Array.isArray(exampleConfig)) {
              const cleanConfig = exampleConfig.map(item => ({
                ...item,
                privateKey: '' // 清空私钥
              }));
              // 保存配置文件
              fs.writeFileSync(configPath, JSON.stringify(cleanConfig, null, 2));
              this.logger.info('已根据示例创建config.json文件，请填写您的私钥');
              return cleanConfig;
            }
          } catch (exErr) {
            this.logger.error(`读取示例配置失败: ${exErr.message}`);
          }
        }
        
        // 如果没有示例配置或读取失败，创建默认配置
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        this.logger.info('已创建默认config.json文件，请填写您的私钥');
        return defaultConfig;
      }
    } catch (error) {
      this.logger.error(`配置文件加载错误: ${error.message}`);
      this.logger.error('请创建privatekeys.txt或config.json配置文件');
      // 返回一个空的配置数组，让程序可以继续运行
      return [{
        privateKey: '',
        custom_name: '示例账号',
        referLink: 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0'
      }];
    }
  }

  /**
   * 确保数据目录存在
   */
  ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    return dataDir;
  }
}

module.exports = ConfigLoader; 