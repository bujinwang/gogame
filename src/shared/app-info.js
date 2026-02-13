/**
 * 无先围棋 (Wuxian Go) - 应用信息 / Application Info
 * 
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin)
 * Version: 三宝001版 (v1.0.0-sanbao001)
 * 
 * All rights reserved. Unauthorized copying, modification, or distribution
 * of this software is strictly prohibited.
 */

const APP_INFO = {
  // 应用名称
  name: '无先围棋',
  nameEn: 'WuxianGo',
  
  // 版本信息
  version: '1.0.0-sanbao001',
  versionDisplay: '三宝001版',
  versionFull: 'v1.0.0 三宝001版',
  buildDate: '2026-02-09',
  
  // 版权信息
  copyright: 'Copyright © 2026 三宝棋道工作室 (Sanbao Chess Studio)',
  copyrightShort: '© 2026 三宝棋道工作室',
  year: 2026,
  
  // 工作室信息
  studio: '三宝棋道工作室',
  studioEn: 'Sanbao Chess Studio',
  
  // 作者信息
  author: '步紧',
  authorEn: 'Bujin',
  
  // 联系方式
  email: 'bujin@sanyachess.studio',
  website: 'https://sanyachess.studio',
  
  // 应用标识
  appId: 'com.sanyachess.simultaneous-go',
  
  // 许可证
  license: 'Commercial - All Rights Reserved',
  licenseShort: 'Proprietary',
  
  // 描述
  description: '无先围棋是一款创新性的围棋变体游戏，双方在每一步中同时下棋。',
  descriptionEn: 'WuxianGo is an innovative Go variant where both players move simultaneously each turn.',
  
  // 完整关于信息
  getAboutText() {
    return `${this.name} (${this.nameEn})\n` +
           `版本: ${this.versionFull}\n` +
           `构建日期: ${this.buildDate}\n\n` +
           `${this.copyright}\n` +
           `作者: ${this.author} (${this.authorEn})\n\n` +
           `${this.description}\n\n` +
           `本软件为商业软件，未经授权不得复制、修改或分发。\n` +
           `This software is proprietary. Unauthorized copying or distribution is prohibited.`;
  },
  
  // 简短关于信息
  getAboutShort() {
    return `${this.name} ${this.versionDisplay} | ${this.copyrightShort} | 作者: ${this.author}`;
  }
};

module.exports = APP_INFO;
