#!/usr/bin/env node
/**
 * 同步围棋 (Simultaneous Go) - Version Info Script
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin)
 * 
 * Usage: node scripts/version.js
 */

const APP_INFO = require('../src/shared/app-info');
const pkg = require('../package.json');

console.log('');
console.log('==============================================');
console.log(`  ${APP_INFO.name} (${APP_INFO.nameEn})`);
console.log('==============================================');
console.log(`  版本 (Version):    ${APP_INFO.versionFull}`);
console.log(`  构建日期 (Build):  ${APP_INFO.buildDate}`);
console.log(`  NPM 版本:         ${pkg.version}`);
console.log(`  工作室 (Studio):   ${APP_INFO.studio}`);
console.log(`  作者 (Author):     ${APP_INFO.author} (${APP_INFO.authorEn})`);
console.log(`  许可 (License):    ${APP_INFO.license}`);
console.log(`  App ID:            ${APP_INFO.appId}`);
console.log('');
console.log(`  ${APP_INFO.copyright}`);
console.log('==============================================');
console.log('');
