const blessed = require('blessed');

class Banner {
  constructor(layout) {
    this.layout = layout;
    this.screen = layout.getScreen();
    
    this.createBanner();
    this.createFooter();
  }

  createBanner() {
    // 创建顶部横幅
    this.banner = blessed.box({
      parent: this.layout.layout,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: ' Parasail 节点自动管理 ',
      align: 'center',
      valign: 'middle',
      tags: true,
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true
      }
    });
  }

  createFooter() {
    // 创建底部状态栏
    this.footer = blessed.box({
      parent: this.layout.layout,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: ' {blue-fg}加载中...{/blue-fg} | 按 {red-fg}q{/red-fg} 或 {red-fg}Ctrl+C{/red-fg} 退出',
      tags: true,
      style: {
        fg: 'white',
        bg: 'black'
      }
    });
  }

  showVersionInfo(version, accountName) {
    try {
      if (this.banner) {
        this.banner.setContent(` Parasail 节点自动管理 v${version} | ${accountName || '未命名账号'} `);
        this.layout.render();
      }
    } catch (error) {
      // 使用UI显示错误，而不是控制台
      if (this.layout && this.layout.getLogBox()) {
        const logBox = this.layout.getLogBox();
        logBox.log(`{red-fg}更新版本信息失败: ${error.message}{/red-fg}`);
        this.layout.render();
      }
    }
  }

  updateFooter(statusText) {
    try {
      if (this.footer) {
        const currentTime = new Date().toLocaleTimeString();
        this.footer.setContent(` {cyan-fg}${statusText || '运行中'}{/cyan-fg} | ${currentTime} | 按 {red-fg}q{/red-fg} 或 {red-fg}Ctrl+C{/red-fg} 退出`);
        this.layout.render();
      }
    } catch (error) {
      // 使用UI显示错误，而不是控制台
      if (this.layout && this.layout.getLogBox()) {
        const logBox = this.layout.getLogBox();
        logBox.log(`{red-fg}更新底部状态失败: ${error.message}{/red-fg}`);
        this.layout.render();
      }
    }
  }
}

module.exports = Banner; 