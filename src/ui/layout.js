const blessed = require('blessed');

class UILayout {
  constructor() {
    this.initScreenAndLayout();
  }

  initScreenAndLayout() {
    // 创建屏幕
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Parasail 节点自动管理系统',
      fastCSR: true,     // 提高渲染性能
      fullUnicode: true, // 支持完整Unicode字符集
      dockBorders: true, // 边框对齐
      autoPadding: true  // 自动内边距
    });

    // 创建布局
    this.layout = blessed.layout({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    });

    // 创建日志框
    this.logBox = blessed.log({
      parent: this.layout,
      top: 3,
      left: 0,
      width: '70%',
      height: '90%',
      label: ' 📝 系统日志 ',
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: '|',         // 简化滚动条字符
        fg: 'cyan',
        track: {         // 滚动条轨道
          bg: 'black'
        }
      },
      style: {
        fg: 'white',
        bg: 'black',
        label: {
          fg: 'cyan',
          bold: true
        },
        scrollbar: {
          bg: 'blue'
        }
      }
    });

    // 创建统计框
    this.statsBox = blessed.box({
      parent: this.layout,
      top: 3,
      right: 0,
      width: '30%',
      height: '90%',
      label: ' 📊 状态监控 ',
      style: {
        fg: 'white',
        bg: 'black',
        label: {
          fg: 'cyan',
          bold: true
        }
      },
      padding: {
        left: 1,
        right: 1
      }
    });

    // 创建倒计时框
    this.countdownBox = blessed.box({
      parent: this.statsBox,
      top: 1,
      left: 0,
      right: 0,
      height: 6,     // 高度适合简洁风格
      content: '⏳ 加载倒计时...',
      style: {
        fg: 'yellow',
        bold: true
      }
    });

    // 创建节点信息框
    this.nodeStatsBox = blessed.box({
      parent: this.statsBox,
      top: 8,        // 位置下移
      left: 0,
      right: 0,
      height: '75%', // 高度比例不变
      content: '⏳ 加载节点数据...',
      style: {
        fg: 'cyan'
      }
    });

    // 设置键盘事件
    this.screen.key(['q', 'C-c'], () => {
      return process.exit(0);
    });

    // 渲染UI
    this.screen.render();
  }

  // 获取特定组件实例
  getScreen() {
    return this.screen;
  }

  getLogBox() {
    return this.logBox;
  }

  getStatsBox() {
    return this.statsBox;
  }

  getCountdownBox() {
    return this.countdownBox;
  }

  getNodeStatsBox() {
    return this.nodeStatsBox;
  }

  // 渲染更新
  render() {
    this.screen.render();
  }
}

module.exports = UILayout; 