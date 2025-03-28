class UIDisplay {
  constructor(layout, logger) {
    this.layout = layout;
    this.logger = logger;
    this.screen = layout.getScreen();
    this.nodeStatsBox = layout.getNodeStatsBox();
    this.countdownBox = layout.getCountdownBox();
  }

  updateNodeStats(nodeData) {
    if (!nodeData || !nodeData.data) {
      this.nodeStatsBox.setContent('❌ 无节点数据');
      return;
    }

    const stats = nodeData.data;
    
    const maskedAddress = stats.node_address ? 
      `0x${stats.node_address.substr(0, 6)}...${stats.node_address.substr(-6)}` : 'N/A';
    
    const statusIcon = stats.has_node ? '🟢' : '🔴';
    const statusText = stats.has_node ? 'ACTIVE' : 'UNKNOWN';
    
    const lastCheckin = stats.last_checkin_time 
      ? new Date(stats.last_checkin_time * 1000).toLocaleString()
      : '从未签到';
    
    const points = stats.points ? stats.points : 0;
    
    // 创建无边框的简洁风格
    let content = '';
    
    // 标题
    content += '节点状态信息\n';
    content += '------------------\n';
    
    // 进度
    content += `积分: [${points}]\n\n`;
    
    // 节点信息
    content += `节点 ID: ${maskedAddress}\n`;
    content += `状态: ${statusIcon} ${statusText}\n`;
    content += `上次签到: ${lastCheckin}\n`;
    
    this.nodeStatsBox.setContent(content);
    this.layout.render();
  }

  updateCountdown(nextTime) {
    if (!nextTime) {
      this.countdownBox.setContent('⏳ 等待下一周期...');
      return;
    }

    const now = new Date();
    const nextDate = new Date(nextTime);
    const diff = Math.max(0, nextDate - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const totalSeconds = 30 * 60; // 修改为30分钟总时间
    const remainingSeconds = hours * 3600 + minutes * 60 + seconds;
    const progressPercentage = Math.floor((1 - remainingSeconds / totalSeconds) * 100);
    
    // 构建简洁的倒计时内容
    let content = '';
    
    // 标题
    content += `下次执行任务倒计时 (30分钟)\n`;
    content += '------------------\n';
    
    // 时间
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    content += `⏰ ${timeStr}\n`;
    
    // 进度
    if (this.accountsLength && this.accountsLength > 1) {
      content += `进度: [${progressPercentage}%] (${this.accountsLength}个账号)`;
    } else {
      content += `进度: [${progressPercentage}%]`;
    }
    
    this.countdownBox.setContent(content);
    this.layout.render();
  }

  setAccountsLength(length) {
    this.accountsLength = length;
  }

  updateAccountsTable(accountsData) {
    if (!accountsData || accountsData.length === 0) {
      return;
    }
    
    // 创建表格数据
    const headers = ['钱包地址', '状态', '积分', '上次签到'];
    const tableData = [];
    
    // 填充数据
    accountsData.forEach(account => {
      const data = account.data;
      // 修改地址格式，确保统一显示
      let maskedAddress = 'N/A';
      if (account.wallet) {
        // 确保地址格式统一，删除多余空格
        if (account.wallet.startsWith('0x')) {
          maskedAddress = `${account.wallet.substr(0, 6)}...${account.wallet.substr(-4)}`;
        } else {
          maskedAddress = `0x${account.wallet.substr(0, 4)}...${account.wallet.substr(-4)}`;
        }
      }
      
      const status = data.has_node ? '🟢' : '🔴';
      const points = data.points || 0;
      const lastCheckin = data.last_checkin_time 
        ? new Date(data.last_checkin_time * 1000).toLocaleDateString()
        : '从未';
      
      tableData.push([maskedAddress, status, points, lastCheckin]);
    });
    
    // 使用logger的表格功能显示
    this.logger.table(headers, tableData, '多账号状态总览');
  }
}

module.exports = UIDisplay; 