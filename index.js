// 导入依赖模块
const UILayout = require('./src/ui/layout');
const Logger = require('./src/utils/logger');
const Banner = require('./src/utils/banner');
const UIDisplay = require('./src/ui/display');
const ConfigLoader = require('./src/config/loader');
const ConfigSaver = require('./src/config/saver');
const ProxyManager = require('./src/utils/proxy');
const UserAPI = require('./src/api/user');
const NodeAPI = require('./src/api/node');

class ParasailNodeBot {
  constructor() {
    // 初始化UI系统
    this.ui = {
      layout: new UILayout(),
    };
    
    // 初始化工具类
    this.utils = {
      logger: new Logger(this.ui.layout),
      banner: new Banner(this.ui.layout),
    };
    
    // 初始化配置
    this.config = {
      loader: new ConfigLoader(this.utils.logger),
      saver: new ConfigSaver(this.utils.logger),
    };
    
    // 初始化API服务
    this.api = {
      user: new UserAPI(this.utils.logger),
      node: new NodeAPI(this.utils.logger),
    };
    
    // 初始化UI显示
    this.ui.display = new UIDisplay(this.ui.layout, this.utils.logger);
    
    // 初始化代理
    this.utils.proxyManager = new ProxyManager(this.utils.logger);
    
    // 加载配置
    this.accounts = [];
    this.loadAccounts();
    
    // 状态追踪
    this.currentAccountIndex = 0;
    this.intervals = {};
    
    // 开始运行
    this.utils.logger.info('系统初始化中，请稍候...');
  }

  loadAccounts() {
    // 加载账号配置
    const config = this.config.loader.loadConfig();
    
    if (Array.isArray(config)) {
      this.multiAccountMode = true;
      this.accounts = config;
    } else {
      this.multiAccountMode = false;
      this.accounts.push(config);
    }
    
    // 初始化当前账号指针
    this.currentAccount = this.accounts[0];
    this.referLink = this.currentAccount.referLink || 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0';
    
    // 通知UI当前有多少个账号
    this.ui.display.setAccountsLength(this.accounts.length);
  }
  
  async start() {
    this.utils.logger.info(`🚀 启动 Parasail 节点管理器 (${this.multiAccountMode ? '多账号模式' : '单账号模式'})`);
    
    try {
      // 保存当前配置
      this.config.saver.saveConfig(this.accounts);
      
      // 多账号模式显示账号列表
      if (this.multiAccountMode) {
        this.utils.logger.info(`加载了 ${this.accounts.length} 个账号`);
        for (let i = 0; i < this.accounts.length; i++) {
          const account = this.accounts[i];
          this.utils.logger.info(`账号 ${i+1}: ${this.api.user.maskAddress(account.wallet_address || '未验证')}`);
        }
      }
      
      // 处理所有账号
      const allAccountsData = [];
      
      for (let i = 0; i < this.accounts.length; i++) {
        // 设置当前账号
        this.currentAccountIndex = i;
        this.currentAccount = this.accounts[i];
        this.referLink = this.currentAccount.referLink || 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0';
        
        // 显示当前处理的账号
        this.utils.logger.system(`开始处理账号 ${i+1}/${this.accounts.length}: ${this.api.user.maskAddress(this.currentAccount.wallet_address || '未验证')}`);
        this.utils.banner.showVersionInfo('1.2.1', this.currentAccount.custom_name || `账号${i+1}`);
        
        // 验证账号
        if (!this.currentAccount.bearer_token) {
          const authResult = await this.api.user.verifyUser(
            this.currentAccount.privateKey,
            this.referLink
          );
          
          this.currentAccount.bearer_token = authResult.token;
          this.currentAccount.wallet_address = authResult.address;
          this.config.saver.saveConfig(this.accounts);
        }

        this.utils.logger.info(`💼 钱包地址: ${this.api.user.maskAddress(this.currentAccount.wallet_address)}`);

        // 初始化代理
        if (this.currentAccount.proxy) {
          this.utils.logger.info(`正在配置代理服务器...`);
          const proxyResult = this.utils.proxyManager.setupProxy(this.currentAccount.proxy);
          if (proxyResult) {
            this.utils.banner.updateFooter(`已连接到代理服务器`);
          } else {
            this.utils.logger.warn(`代理服务器配置失败，将使用直接连接`);
            this.utils.banner.updateFooter(`直接连接中`);
          }
        } else {
          this.utils.logger.info(`未检测到代理配置，将使用直接连接`);
          this.utils.banner.updateFooter(`直接连接中`);
        }

        // 节点操作
        await this.api.node.onboardNode(
          this.currentAccount.wallet_address,
          this.currentAccount.bearer_token,
          this.referLink
        );
        
        await this.api.node.checkIn(
          this.currentAccount.wallet_address,
          this.currentAccount.bearer_token,
          this.referLink
        );
        
        // 获取并更新状态
        const nodeStats = await this.api.node.getNodeStats(
          this.currentAccount.wallet_address,
          this.currentAccount.bearer_token,
          this.referLink
        );
        
        // 缓存数据
        allAccountsData.push({
          wallet: this.currentAccount.wallet_address,
          data: nodeStats.data
        });
        
        // 显示节点状态
        this.ui.display.updateNodeStats(nodeStats);
        
        // 记录分隔线
        this.utils.logger.separator();
      }
      
      // 显示所有账号的状态表格
      this.ui.display.updateAccountsTable(allAccountsData);
      
      // 重置为第一个账号继续使用
      this.currentAccountIndex = 0;
      this.currentAccount = this.accounts[0];
      this.referLink = this.currentAccount.referLink || 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0';
      
      // 启动定时任务
      this.startCountdown();
      
      this.utils.logger.success('✅ 初始化完成，程序正在运行中');
    } catch (error) {
      this.utils.logger.error(`❌ 初始化失败: ${error.message}`);
    }
  }

  startCountdown() {
    let remainingSeconds = 30 * 60; // 30分钟倒计时
    
    const now = new Date();
    const nextCheckIn = new Date(now.getTime() + remainingSeconds * 1000);
    
    // 倒计时定时器
    const countdownInterval = setInterval(() => {
      this.ui.display.updateCountdown(nextCheckIn);
      
      const currentTime = new Date();
      if (currentTime >= nextCheckIn) {
        clearInterval(countdownInterval);
        this.utils.logger.success('🔄 签到时间到，开始执行新一轮任务!');
        this.performRoutineTasks();
      }
    }, 1000);

    // 状态更新定时器 - 每10分钟轮询一次所有账号状态
    const statsInterval = setInterval(async () => {
      try {
        // 更新当前账号状态
        const currentStats = await this.api.node.getNodeStats(
          this.currentAccount.wallet_address,
          this.currentAccount.bearer_token,
          this.referLink
        );
        
        this.ui.display.updateNodeStats(currentStats);
        
        // 如果是多账号模式，更新所有账号状态表格
        if (this.multiAccountMode) {
          this.utils.logger.info('执行账号状态检查...');
          
          // 所有账号数据的缓存
          const allAccountsData = [];
          
          // 保存当前账号索引
          const originalIndex = this.currentAccountIndex;
          
          // 轮询所有账号状态
          for (let i = 0; i < this.accounts.length; i++) {
            // 切换到目标账号
            this.currentAccountIndex = i;
            this.currentAccount = this.accounts[i];
            this.referLink = this.currentAccount.referLink || 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0';
            
            // 获取状态
            const stats = await this.api.node.getNodeStats(
              this.currentAccount.wallet_address,
              this.currentAccount.bearer_token,
              this.referLink
            );
            
            // 添加到数据表
            allAccountsData.push({
              wallet: this.currentAccount.wallet_address,
              data: stats.data
            });
          }
          
          // 恢复原来的账号索引
          this.currentAccountIndex = originalIndex;
          this.currentAccount = this.accounts[originalIndex];
          this.referLink = this.currentAccount.referLink || 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0';
          
          // 更新账号表格
          this.ui.display.updateAccountsTable(allAccountsData);
        }
      } catch (error) {
        this.utils.logger.error(`状态更新失败: ${error.message}`);
      }
    }, 10 * 60 * 1000); // 10分钟轮询一次

    // 保存定时器以便清理
    this.intervals = { countdownInterval, statsInterval };
  }

  async performRoutineTasks() {
    try {
      this.utils.logger.info('🔄 开始执行日常任务...');
      
      // 所有账号数据的缓存
      const allAccountsData = [];
      
      // 处理所有账号
      for (let i = 0; i < this.accounts.length; i++) {
        // 设置当前账号
        this.currentAccountIndex = i;
        this.currentAccount = this.accounts[i];
        this.referLink = this.currentAccount.referLink || 'MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0';
        
        // 显示当前处理的账号
        this.utils.logger.system(`执行账号 ${i+1}/${this.accounts.length} 的日常任务: ${this.api.user.maskAddress(this.currentAccount.wallet_address)}`);
        this.utils.banner.showVersionInfo('1.2.1', this.currentAccount.custom_name || `账号${i+1}`);
        
        // 执行任务
        await this.api.node.onboardNode(
          this.currentAccount.wallet_address,
          this.currentAccount.bearer_token,
          this.referLink
        );
        
        await this.api.node.checkIn(
          this.currentAccount.wallet_address,
          this.currentAccount.bearer_token,
          this.referLink
        );
        
        // 获取状态
        const nodeStats = await this.api.node.getNodeStats(
          this.currentAccount.wallet_address,
          this.currentAccount.bearer_token,
          this.referLink
        );
        
        // 添加到数据表
        allAccountsData.push({
          wallet: this.currentAccount.wallet_address,
          data: nodeStats.data
        });
        
        // 更新状态显示
        this.ui.display.updateNodeStats(nodeStats);
        
        // 记录分隔线
        this.utils.logger.separator();
      }
      
      // 更新账号表格
      this.ui.display.updateAccountsTable(allAccountsData);
      
      // 重新开始倒计时
      this.startCountdown();
      
      this.utils.logger.success('✅ 日常任务全部完成');
    } catch (error) {
      this.utils.logger.error(`❌ 日常任务失败: ${error.message}`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const nodeBot = new ParasailNodeBot();
  try {
    await nodeBot.start();
  } catch (error) {
    // 使用内部Logger记录错误，而不是console.error
    if (nodeBot.utils && nodeBot.utils.logger) {
      nodeBot.utils.logger.error(`主程序错误: ${error.message}`);
    } else {
      // 仅在Logger不可用时才使用console
      console.error('主程序初始化错误:', error.message);
    }
  }
}

// 执行主程序
main();