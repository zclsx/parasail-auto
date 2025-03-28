const fs = require('fs');
const path = require('path');

class Logger {
  constructor(layout) {
    this.layout = layout;
    this.logBox = layout.getLogBox();
    this.screen = layout.getScreen();

    // Create log directory
    this.logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }

    // Create log file
    const today = new Date().toISOString().split('T')[0];
    this.logFilePath = path.join(this.logDir, `parasail-${today}.log`);

    // Log styles
    this.styles = {
      info: { icon: 'ℹ️', prefix: '{blue-fg}INFO{/blue-fg}', color: 'blue' },
      success: { icon: '✅', prefix: '{green-fg}SUCCESS{/green-fg}', color: 'green' },
      warn: { icon: '⚠️', prefix: '{yellow-fg}WARN{/yellow-fg}', color: 'yellow' },
      error: { icon: '❌', prefix: '{red-fg}ERROR{/red-fg}', color: 'red' },
      debug: { icon: '🔍', prefix: '{magenta-fg}DEBUG{/magenta-fg}', color: 'magenta' },
      network: { icon: '🌐', prefix: '{cyan-fg}NETWORK{/cyan-fg}', color: 'cyan' },
      event: { icon: '🔔', prefix: '{white-fg}EVENT{/white-fg}', color: 'white' },
      system: { icon: '⚙️', prefix: '{grey-fg}SYSTEM{/grey-fg}', color: 'grey' },
      plain: { icon: '', prefix: '', color: 'plain' }
    };
  }

  _log(style, message) {
    const time = new Date().toLocaleTimeString();
    const logMessage = `${style.icon} ${style.prefix} ⏱ ${time}\n   ${message}`;
    this._writeToUI(logMessage);
    this._writeToFile(style, message, time);
    this.layout.render();
  }

  _writeToUI(content) {
    if (this.logBox) {
      this.logBox.log(content);
    }
  }

  _writeToFile(style, message, time) {
    try {
      const fileContent = `[${time}] [${style.color.toUpperCase()}] ${message}\n`;
      fs.appendFileSync(this.logFilePath, fileContent);
    } catch (error) {
      // 不使用console.error，而是将错误重定向到UI
      if (this.logBox) {
        const errorMsg = `{red-fg}[错误] 无法写入日志文件: ${error.message}{/red-fg}`;
        this.logBox.log(errorMsg);
        this.layout.render();
      }
    }
  }

  _formatTime() {
    return new Date().toLocaleTimeString();
  }

  /**
   * Calculate the display width of a string
   * Chinese characters take 2 widths, ASCII characters take 1 width, special symbols (like ●) adjusted based on terminal
   */
  getDisplayWidth(str) {
    let width = 0;
    for (let char of str) {
      const codePoint = char.codePointAt(0);
      if (
        (codePoint >= 0x4E00 && codePoint <= 0x9FFF) || // CJK Unified Ideographs
        (codePoint >= 0x3000 && codePoint <= 0x303F) || // CJK Symbols and Punctuation
        (codePoint >= 0xFF00 && codePoint <= 0xFFEF)    // Fullwidth Forms
      ) {
        width += 2; // Chinese characters take 2 display widths
      } else if (codePoint === 0x25CF) { // Black Circle ●
        width += 1; // Default to 1 width, adjust to 2 if needed
      } else {
        width += 1; // Other characters take 1 display width
      }
    }
    return width;
  }

  info(message) { this._log(this.styles.info, message); }
  success(message) { this._log(this.styles.success, message); }
  warn(message) { this._log(this.styles.warn, message); }
  error(message) { this._log(this.styles.error, message); }
  debug(message) { this._log(this.styles.debug, message); }
  network(message) { this._log(this.styles.network, message); }
  event(message) { this._log(this.styles.event, message); }
  system(message) { this._log(this.styles.system, message); }

  separator() {
    const width = 50;
    const line = "·".repeat(width);
    this._writeToUI(`{grey-fg}${line}{/grey-fg}`);
    this._writeToFile({ color: 'grey' }, line, this._formatTime());
    this.layout.render();
  }

  /**
   * Generate a table
   * @param {string[]} headers - Array of headers
   * @param {string[][]} data - Array of data rows
   * @param {string} title - Table title
   */
  table(headers, data, title = '表格数据') {
    if (!headers || !data || !Array.isArray(headers) || !Array.isArray(data)) {
      this.error('表格数据格式错误');
      return;
    }

    this._writeToUI(`\n{cyan-fg}${title}{/cyan-fg}\n`);

    const colWidths = [];
    for (let i = 0; i < headers.length; i++) {
      const headerLength = this.getDisplayWidth(headers[i]);
      const maxDataLength = Math.max(...data.map(row => this.getDisplayWidth(String(row[i] || ''))));
      colWidths[i] = Math.max(headerLength, maxDataLength) + 2;
    }

    // 计算总宽度
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);

    // 表格顶部边框 - 一条直线
    this._writeToUI('─'.repeat(totalWidth));

    // 添加表头内容 - 不带边框
    let headerContent = '';
    headers.forEach((header, i) => {
      const displayWidth = this.getDisplayWidth(header);
      const padding = Math.floor((colWidths[i] - displayWidth) / 2);
      const extraSpace = colWidths[i] - displayWidth - padding * 2;
      headerContent += ' '.repeat(padding) + header + ' '.repeat(padding + extraSpace);
    });
    this._writeToUI(headerContent);

    // 表头和数据之间的分隔线 - 一条直线
    this._writeToUI('─'.repeat(totalWidth));

    // 添加数据行 - 不带边框
    data.forEach(row => {
      let dataRow = '';
      headers.forEach((_, i) => {
        const cell = String(row[i] || '');
        const displayWidth = this.getDisplayWidth(cell);
        const padding = Math.floor((colWidths[i] - displayWidth) / 2);
        const extraSpace = colWidths[i] - displayWidth - padding * 2;
        dataRow += ' '.repeat(padding) + cell + ' '.repeat(padding + extraSpace);
      });
      this._writeToUI(dataRow);
    });

    // 表格底部边框 - 一条直线
    this._writeToUI('─'.repeat(totalWidth));

    this._writeToFile({ color: 'cyan' }, `Table: ${title}`, this._formatTime());
    this.layout.render();
  }

  logPlain(message) {
    this._writeToUI(message);
    this._writeToFile(this.styles.plain, message, this._formatTime());
    this.layout.render();
  }
}

module.exports = Logger;