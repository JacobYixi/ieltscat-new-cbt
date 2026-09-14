// ==UserScript==
// @name         新东方雅思猫机考 · 新版雅思机考界面
// @name:en      XDF IELTS Cat Mock → New CBT Interface
// @namespace    ieltscat.newcbt
// @version      3.9.7
// @description  把新东方雅思猫机考做题页改造为接近新版雅思机考界面的观感。由于平台 DOM 结构和技术限制，无法做到像素级 100% 复刻，但在配色、排版、布局和交互逻辑上尽量贴近新版机考官方演示界面：白底 Arial、56px 页头（IELTS 品牌 + Test taker ID + 时间 + Show notes）、阅读/写作左右分栏 + 可拖拽分割条、底部 Part 题号导航、选中文字浮条（Note/Highlight/Clear all）、酒红色高亮、Notes 侧栏、倒计时最后 5 分钟红色预警。只作用于机考做题页（/mock/detail/*），练习页完全不受影响。
// @description:en  Restyles IELTS Cat mock exam pages to resemble the new official IELTS on computer test interface. Due to DOM and technical constraints, pixel-perfect replication is not possible, but colors, layout, and interactions closely follow the official demo. Only affects /mock/detail/*; practice pages are untouched.
// @author       JacobYixi
// @license      Anti-996
// @match        https://ieltscat.xdf.cn/*
// @match        http://ieltscat.xdf.cn/*
// @match        https://www.ieltscat.com/*
// @match        http://www.ieltscat.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  /* ============================================================
   * 状态与存储
   * ============================================================ */
  var LS = {
    get: function (k, d) {
      try {
        if (typeof GM_getValue === 'function') { var v = GM_getValue(k, undefined); return v === undefined ? d : v; }
        var s = localStorage.getItem(k); return s === null ? d : JSON.parse(s);
      } catch (e) { return d; }
    },
    set: function (k, v) {
      try {
        if (typeof GM_setValue === 'function') { GM_setValue(k, v); return; }
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    }
  };

  var KEYS = {
    on: 'cbt-mock-new-interface',
    fs: 'cbt-mock-font-size',
    left: 'cbt-mock-left-pct-',
    note: 'cbt-mock-notes:',
    noteData: 'cbt-mock-note-data:'
  };

  var state = {
    enabled: LS.get(KEYS.on, true) !== false,
    fs: parseInt(LS.get(KEYS.fs, 16), 10) || 16,
    hl: false
  };

  /* ============================================================
   * 官方样式复刻（参考 IDP Inspera 演示页实测值）
   * ============================================================ */
  var CSS = `
/* 关闭状态：隐藏所有注入元素（开关除外） */
body:not(.cbt-new) [data-cbt]:not([data-cbt="toggle"]){display:none!important}

/* ---------- 全局：彻底清除平台浅蓝/深蓝渐变背景 ---------- */
html.cbt-new,html.cbt-new body{background:#ffffff!important}
body.cbt-new{background:#ffffff!important;color:#000000!important;font-family:Arial,sans-serif!important}
body.cbt-new .exam-detail-page{background:#ffffff!important;height:100vh!important;overflow:hidden!important}
body.cbt-new .exam-page{display:flex!important;flex-direction:column!important;width:100vw!important;max-width:100vw!important;min-width:0!important;height:100vh!important;overflow:hidden!important;background:#ffffff!important;background-image:none!important}
body.cbt-new .exam-page__content{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important;background:#ffffff!important;width:100%!important}
body.cbt-new .exam-bank{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;min-height:0!important;width:100%!important;max-width:100%!important;margin:0!important;position:static!important;background:#ffffff!important}
body.cbt-new .exam-bank-wrapper{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;width:100%!important;max-width:100%!important;position:static!important;box-sizing:border-box!important;background:#ffffff!important;background-image:none!important}

/* ---------- 页头：官方 56px 白底 ---------- */
body.cbt-new .normal-que-header{background:#ffffff!important;background-image:none!important;border-bottom:none!important;flex-shrink:0!important}
body.cbt-new .normal-header{height:56px!important;background:#ffffff!important;background-image:none!important;display:flex!important;align-items:center!important;gap:8px!important;padding:0 16px!important;flex-wrap:nowrap!important;min-width:0!important;border-bottom:none!important;box-shadow:0 1px 0 #d92d20!important;position:relative!important;z-index:10!important}
body.cbt-new .normal-header__logo{display:none!important}
body.cbt-new .cbt-brand{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:2px!important;flex:0 1 auto!important;min-width:0!important;height:100%!important;overflow:visible!important}
body.cbt-new .cbt-brand-row{display:flex!important;align-items:center!important;gap:10px!important;flex:0 1 auto!important;min-width:0!important;height:auto!important;line-height:1!important}
body.cbt-new .cbt-ielts{font-family:Arial,Helvetica,sans-serif!important;font-size:22px!important;font-weight:800!important;font-style:italic!important;letter-spacing:.5px!important;color:#000000!important;line-height:1!important;white-space:nowrap!important;flex:0 0 auto!important}
body.cbt-new .cbt-taker{display:flex!important;align-items:center!important;gap:6px!important;padding:0 24px 0 16px!important;font-size:16px!important;color:#000000!important;font-family:Arial,sans-serif!important;border-left:1px solid #d5d5d5!important;white-space:nowrap!important;flex:0 1 auto!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1!important}
body.cbt-new .cbt-taker b{font-weight:700!important}
body.cbt-new .normal-header__middle{flex:1!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;min-width:0!important;background:#ffffff!important;background-image:none!important;position:static!important;z-index:auto!important}
body.cbt-new #clock-info{display:flex!important;align-items:center!important;gap:4px!important;font-size:21px!important;font-weight:700!important;color:#000000!important;font-family:Arial,sans-serif!important;font-variant-numeric:tabular-nums!important;background:transparent!important;background-image:none!important}
body.cbt-new #clock-info i.icon{display:none!important}
/* 计时挪到 IELTS 品牌下方：小字 */
body.cbt-new .cbt-brand #clock-info{font-size:12px!important;font-weight:400!important;color:#000000!important;gap:3px!important;padding:0 16px 0 1px!important;margin-top:1px!important;line-height:1!important;font-variant-numeric:tabular-nums!important}
body.cbt-new .cbt-brand #clock-info *{color:#000000!important}
body.cbt-new .cbt-brand #clock-info.cbt-warn,body.cbt-new .cbt-brand #clock-info.cbt-warn *{color:#d92d20!important;animation:cbt-pulse 1s ease-in-out infinite!important}
body.cbt-new #clock-info.cbt-warn{color:#d92d20!important;animation:cbt-pulse 1s ease-in-out infinite!important}
@keyframes cbt-pulse{0%,100%{opacity:1}50%{opacity:.5}}
/* 最后 5 分钟：整条顶栏变粉红 */
body.cbt-new .normal-que-header{transition:background .6s ease!important}
body.cbt-new.cbt-header-warn .normal-que-header{background:#ffd1d9!important;background-image:none!important}
body.cbt-new.cbt-header-warn .normal-header{background:#ffd1d9!important;background-image:none!important}
body.cbt-new.cbt-header-warn .normal-header__btns-item:hover{background:#ffbecb!important}
body.cbt-new.cbt-header-warn #clock-info{color:#d92d20!important;animation:cbt-pulse 1s ease-in-out infinite!important}
body.cbt-new .normal-header__btns{display:flex!important;align-items:center!important;gap:0!important;flex-shrink:0!important;background:transparent!important}
body.cbt-new .normal-header__btns-item{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0 14px!important;font-size:16px!important;font-weight:400!important;cursor:pointer!important;color:#000000!important;background:transparent!important;background-image:none!important;border:none!important;border-radius:0!important;white-space:nowrap!important;box-sizing:border-box!important;height:56px!important;line-height:1!important;font-family:Arial,sans-serif!important}
body.cbt-new .normal-header__btns-item:hover{background:#f2f2f2!important}
body.cbt-new .normal-header__btns-item.blue{background:transparent!important;background-image:none!important;color:#000000!important;font-weight:400!important}
body.cbt-new .normal-header__btns-item.blue:hover{background:#f2f2f2!important}
body.cbt-new .cbt-notes-btn{display:inline-flex!important;align-items:center!important;padding:0 14px!important;font-size:16px!important;color:#000000!important;background:transparent!important;border:none!important;border-radius:0!important;cursor:pointer!important;height:56px!important;font-family:Arial,sans-serif!important;margin-right:16px!important;white-space:nowrap!important}
body.cbt-new .cbt-notes-btn:hover{background:#f2f2f2!important}

/* ---------- 官方 rubric 标题区 ---------- */
body.cbt-new .exam-bank-header{background:#f1f2ec!important;border-bottom:1px solid #d5d5d5!important;padding:12px 16px!important;margin:16px!important;flex-shrink:0!important;box-sizing:border-box!important}
body.cbt-new .exam-bank-header .h1{font-size:16px!important;font-weight:700!important;color:#000000!important;font-family:Arial,sans-serif!important;margin:0 0 4px!important}
body.cbt-new .exam-bank-header .sub{font-size:16px!important;font-weight:400!important;color:#000000!important;font-family:Arial,sans-serif!important;margin:0!important;padding:0!important}

/* ---------- 听力单栏 ---------- */
body.cbt-new .listen-question{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0 16px 90px!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;margin:0!important;background:#ffffff!important;background-image:none!important}

/* ---------- 阅读/写作左右分屏（官方 divider） ---------- */
body.cbt-new .reading-wrap,body.cbt-new .writing-wrap{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:row!important;position:relative!important;overflow:hidden!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin:0!important;background:#ffffff!important;background-image:none!important}
body.cbt-new .reading-wrap__section.left,body.cbt-new .writing-wrap__section.left{flex:0 0 auto;width:50%;overflow-y:auto!important;overflow-x:hidden!important;box-sizing:border-box!important;min-width:0!important;padding:0 16px!important;font-size:var(--cbt-fs);background:#ffffff!important;background-image:none!important;scrollbar-width:none!important}
body.cbt-new .reading-wrap__section.left::-webkit-scrollbar,body.cbt-new .writing-wrap__section.left::-webkit-scrollbar{display:none!important}
body.cbt-new .reading-wrap__section.left p,body.cbt-new .writing-wrap__section.left p{font-size:var(--cbt-fs)!important;line-height:1.6!important;color:#000000!important;font-family:Arial,sans-serif!important}
body.cbt-new .reading-wrap__section.right,body.cbt-new .writing-wrap__section.right{flex:1 1 0%!important;width:auto!important;max-width:none!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;box-sizing:border-box!important;min-width:0!important;padding:8px 0 48px!important;font-size:var(--cbt-fs);background:#ffffff!important;background-image:none!important;scrollbar-width:none!important}
body.cbt-new .reading-wrap__section.right::-webkit-scrollbar,body.cbt-new .writing-wrap__section.right::-webkit-scrollbar{display:none!important}
body.cbt-new .reading-wrap,body.cbt-new .writing-wrap{scrollbar-width:none!important}
body.cbt-new .reading-wrap::-webkit-scrollbar,body.cbt-new .writing-wrap::-webkit-scrollbar{display:none!important}
body.cbt-new .listen-question::-webkit-scrollbar{display:none!important}
body.cbt-new .iScrollVerticalScrollbar{width:4px!important}
body.cbt-new .iScrollVerticalScrollbar > div{width:4px!important;border-radius:0!important;background:#c0c0c0!important}
body.cbt-new .reading-wrap__section.right p,body.cbt-new .writing-wrap__section.right p{font-size:var(--cbt-fs)!important;line-height:1.6!important;color:#000000!important;font-family:Arial,sans-serif!important}
/* 官方分割条：2px 线 + 16px 拖拽热区 + 32×32 手柄 */
body.cbt-new .cbt-divider{flex:0 0 1px!important;position:relative;background:rgba(0,0,0,.3)!important;cursor:ew-resize!important;z-index:100!important;touch-action:none!important}
body.cbt-new .cbt-divider::before{content:'';position:absolute!important;top:0!important;bottom:0!important;left:-6px!important;width:13px!important;cursor:ew-resize!important;z-index:2!important}
body.cbt-new .cbt-handle{position:absolute!important;top:50%!important;transform:translateY(-50%)!important;left:-14px!important;width:28px!important;height:28px!important;background:#ffffff!important;border:1px solid #999!important;border-radius:0!important;color:#666!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:2!important;font-size:13px!important;pointer-events:none!important}
body.cbt-new .cbt-divider:hover{background:rgba(0,0,0,.5)!important}

/* ---------- Header 设置按钮 + 下拉菜单（字体调节） ---------- */
body.cbt-new .cbt-options-btn{display:inline-flex!important;align-items:center!important;padding:0 14px!important;font-size:16px!important;color:#000000!important;background:transparent!important;border:none!important;border-radius:0!important;cursor:pointer!important;height:56px!important;font-family:Arial,sans-serif!important;white-space:nowrap!important}
body.cbt-new .cbt-options-btn:hover{background:#f2f2f2!important}
body.cbt-new .cbt-options-menu{position:fixed!important;top:56px!important;right:16px!important;z-index:9998!important;background:#ffffff!important;border:1px solid #d5d5d5!important;border-radius:3px!important;box-shadow:0 2px 10px rgba(0,0,0,.25)!important;padding:14px 16px!important;display:none!important;min-width:170px!important;font-family:Arial,sans-serif!important}
body.cbt-new .cbt-options-menu.cbt-open{display:block!important}
body.cbt-new .cbt-options-title{font-size:14px!important;color:#333333!important;margin-bottom:8px!important;font-weight:400!important}
body.cbt-new .cbt-options-control{display:flex!important;align-items:center!important;gap:8px!important}
body.cbt-new .cbt-options-control button{width:28px!important;height:28px!important;border:1px solid #d5d5d5!important;border-radius:3px!important;background:#ffffff!important;color:#333333!important;font-size:14px!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;line-height:1!important}
body.cbt-new .cbt-options-control button:hover{background:#f2f2f2!important}
body.cbt-new .cbt-options-control .cbt-fs-label{font-size:13px!important;color:#333333!important;min-width:36px!important;text-align:center!important;font-weight:400!important}
body.cbt-new .cbt-options-reset{display:block!important;width:100%!important;margin-top:10px!important;padding:6px 8px!important;border:1px solid #d5d5d5!important;border-radius:3px!important;background:#ffffff!important;color:#333333!important;font-size:13px!important;cursor:pointer!important;font-family:Arial,sans-serif!important;text-align:center!important}
body.cbt-new .cbt-options-reset:hover{background:#f2f2f2!important}

/* ---------- 底部官方导航 ---------- */
body.cbt-new .exam-bank-footer{flex-shrink:0!important;background:#ffffff!important;border-top:1px solid #d5d5d5!important;display:flex!important;align-items:center!important;gap:14px!important;padding:0 20px!important;height:72px!important;flex-basis:72px!important;min-height:72px!important;max-height:72px!important;box-sizing:border-box!important;width:100%!important;position:static!important}
body.cbt-new .exam-bank-footer .btn-arrow{display:none!important}
body.cbt-new .exam-bank-footer .btn-review{display:flex!important;align-items:center!important;gap:8px!important;cursor:pointer!important;color:#000000!important;font-size:16px!important;user-select:none!important;white-space:nowrap!important;flex-shrink:0!important;font-family:Arial,sans-serif!important;height:auto!important}
body.cbt-new .exam-bank-footer .btn-review .checkbox{width:18px!important;height:18px!important;border:2px solid #418FC6!important;border-radius:3px!important;background:#ffffff!important;background-image:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;font-size:0!important}
body.cbt-new .exam-bank-footer .btn-review .checkbox.checked{background:#418FC6!important;background-image:none!important}
body.cbt-new .exam-bank-footer .pager{flex:1!important;min-width:0!important;overflow:hidden!important;background:#ffffff!important;background-image:none!important;height:100%!important;max-height:100%!important}
body.cbt-new .exam-bank-footer .scroller{display:flex!important;gap:1px!important;overflow-x:scroll!important;overflow-y:hidden!important;scrollbar-width:thin!important;align-items:center!important;height:69px!important;flex-shrink:0!important;width:100%!important;padding-bottom:6px!important;box-sizing:border-box!important}
body.cbt-new .exam-bank-footer .scroller::-webkit-scrollbar{display:block!important;height:10px!important;background:#f0f0f0!important}
body.cbt-new .exam-bank-footer .scroller::-webkit-scrollbar-track{background:#f0f0f0!important}
body.cbt-new .exam-bank-footer .scroller::-webkit-scrollbar-thumb{background:#999999!important;border-radius:0!important;min-width:40px!important}
body.cbt-new .exam-bank-footer .part{display:flex!important;align-items:center!important;gap:1px!important;flex-shrink:0!important;height:69px!important;margin:0 1px!important}
body.cbt-new .exam-bank-footer .part .title{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:16px 20px!important;font-size:16px!important;font-weight:600!important;color:#333333!important;white-space:nowrap!important;font-family:Arial,sans-serif!important;cursor:default!important;height:69px!important;box-sizing:border-box!important}
body.cbt-new .exam-bank-footer .part .item{width:21px!important;height:27px!important;border:2px solid #418FC6!important;border-radius:3px!important;background:#ffffff!important;color:#333333!important;font-size:16px!important;font-weight:700!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-sizing:border-box!important;font-family:Arial,sans-serif!important;flex-shrink:0!important;line-height:1!important}
body.cbt-new .exam-bank-footer .part .item:hover{background:#eef4fb!important}
body.cbt-new .exam-bank-footer .part .item.selected{background:#ffffff!important;color:#333333!important;border-color:#418FC6!important;box-shadow:inset 0 0 0 1px #418FC6!important}
/* Review 标记：题号方块变圆形 */
body.cbt-new .exam-bank-footer .part .item.mark{width:26px!important;height:26px!important;border-radius:50%!important;background:#418FC6!important;color:#ffffff!important;border-color:#418FC6!important}
body.cbt-new .exam-bank-footer .part .cbt-check{color:#2e7d32!important;margin-right:6px!important;font-weight:700!important;font-size:16px!important}
body.cbt-new .cbt-arrow{width:38px!important;height:38px!important;flex:0 0 auto!important;border:none!important;border-radius:3px!important;background:#dddddd!important;color:#ffffff!important;font-size:22px!important;line-height:1!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important}
body.cbt-new .cbt-arrow:hover{background:#418FC6!important}

/* ---------- 答题控件 ---------- */
body.cbt-new .input-item{background:#ffffff!important;border:1px solid #595959!important;border-radius:3px!important;color:#000000!important;font-size:var(--cbt-fs)!important;font-family:Arial,sans-serif!important;outline:none!important;box-shadow:none!important;padding:2px 8px!important}
body.cbt-new .input-item:focus{border-color:#418FC6!important}
body.cbt-new textarea.input-area{font-size:var(--cbt-fs)!important;line-height:1.6!important;border:1px solid #595959!important;border-radius:3px!important;background:#ffffff!important;color:#000000!important;outline:none!important;box-shadow:none!important;padding:12px!important;box-sizing:border-box!important;width:100%!important;resize:none!important;font-family:Arial,sans-serif!important}
body.cbt-new textarea.input-area:focus{border-color:#418FC6!important}
body.cbt-new .writing-answer_area-wrap{width:100%!important;max-width:100%!important;display:flex!important;flex-direction:column!important;gap:4px!important}
body.cbt-new .writing-answer-operate-wrap{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:10px!important;font-size:16px!important;color:#000000!important;margin:0!important;font-family:Arial,sans-serif!important}
body.cbt-new .writing-answer-operate-wrap .counter{font-weight:400!important;color:#000000!important;font-size:16px!important}

/* ---------- 官方高亮 ---------- */
body.cbt-new .cbt-adder{position:absolute!important;z-index:9990!important;display:flex!important;align-items:center!important;gap:2px!important;background:#ffffff!important;border:1px solid #737373!important;border-radius:4px!important;box-shadow:0 2px 10px rgba(0,0,0,.25)!important;padding:0!important}
body.cbt-new .cbt-adder button{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:10px 10px 7px!important;font-size:12px!important;color:#737373!important;background:transparent!important;border:none!important;cursor:pointer!important;font-family:Arial,sans-serif!important;white-space:nowrap!important}
body.cbt-new .cbt-adder button:hover{background:#f2f2f2!important;color:#000000!important}
body.cbt-new .cbt-adder svg{width:16px!important;height:16px!important;flex-shrink:0!important}
body.cbt-new .cbt-hl{background:rgb(125,74,90)!important;color:#ffffff!important;padding:0!important;margin:0!important;border-radius:0!important}
body.cbt-new .cbt-hl{background:rgb(125,74,90)!important;color:#ffffff!important}
/* 蓝色笔记高亮：点击可查看/编辑笔记 */
body.cbt-new .cbt-note{background:#cfe8ff!important;color:#000000!important;border-bottom:2px solid #2196f3!important;padding:0 1px!important;border-radius:2px!important;cursor:pointer!important;display:inline!important}
body.cbt-new .cbt-note:hover{background:#b8dcff!important}
body.cbt-new .cbt-note-orig-wrap{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:6px!important;border-bottom:1px solid #e0e0e0!important;padding-bottom:6px!important;margin-bottom:8px!important}
body.cbt-new .cbt-note-orig-wrap .cbt-note-orig{border-bottom:none!important;padding-bottom:0!important;margin-bottom:0!important}
body.cbt-new .cbt-note-del{flex:0 0 auto!important;border:none!important;background:none!important;color:#999!important;font-size:16px!important;cursor:pointer!important;padding:0 2px!important;line-height:1!important}
body.cbt-new .cbt-note-del:hover{color:#d92d20!important}
body.cbt-new .cbt-notes-list{flex:1!important;overflow-y:auto!important;padding:12px!important;box-sizing:border-box!important}
body.cbt-new .cbt-note-item{margin-bottom:12px!important;background:#ffffff!important;border:1px solid #d5d5d5!important;border-radius:3px!important;padding:10px!important}
body.cbt-new .cbt-note-item .cbt-note-orig{font-size:13px!important;color:#2196f3!important;border-bottom:1px solid #e0e0e0!important;padding-bottom:6px!important;margin-bottom:8px!important;font-style:italic!important;word-break:break-word!important}
body.cbt-new .cbt-note-item textarea{width:100%!important;box-sizing:border-box!important;border:none!important;outline:none!important;resize:vertical!important;min-height:50px!important;font-size:14px!important;line-height:1.5!important;color:#000!important;font-family:Arial,sans-serif!important;background:#ffffff!important;display:block!important}

/* ---------- 官方 Notes 侧边栏 ---------- */
body.cbt-new .cbt-notes{position:fixed!important;top:56px!important;right:0!important;bottom:72px!important;width:300px!important;max-width:92vw!important;background:#e8e8e8!important;z-index:9999!important;display:flex!important;flex-direction:column!important;transform:translateX(102%)!important;transition:transform .22s ease!important;border-left:1px solid #d5d5d5!important}
body.cbt-new.cbt-notes-open .exam-page__content{margin-right:300px!important;transition:margin-right .22s ease!important}
body.cbt-new.cbt-notes-open .exam-bank-footer{margin-right:0!important}
body.cbt-new .cbt-notes.cbt-open{transform:translateX(0)!important}
body.cbt-new .cbt-notes-head{display:flex!important;align-items:center!important;justify-content:space-between!important;height:56px!important;background:#ffffff!important;padding:0 16px!important;font-size:16px!important;color:#000000!important;font-family:Arial,sans-serif!important;border-bottom:1px solid #d5d5d5!important;box-sizing:border-box!important}
body.cbt-new .cbt-notes-head span{font-weight:400!important}
body.cbt-new .cbt-notes-head button{border:none!important;background:none!important;font-size:20px!important;cursor:pointer!important;color:#000000!important;padding:0 4px!important}
body.cbt-new .cbt-notes-ta{flex:1!important;border:none!important;outline:none!important;resize:none!important;padding:12px!important;font-size:16px!important;line-height:1.6!important;color:#000000!important;font-family:Arial,sans-serif!important;background:#ffffff!important;border-radius:3px!important;margin:12px!important;box-sizing:border-box!important}
body.cbt-new .cbt-notes-ta:focus{outline:none!important;border:none!important;box-shadow:none!important}
body.cbt-new .cbt-notes-empty{position:absolute!important;top:70px!important;left:0!important;right:0!important;text-align:center!important;font-size:15px!important;color:#333333!important;font-family:Arial,sans-serif!important;line-height:1.5!important;padding:0 24px!important}

/* ---------- 开关 ---------- */
.cbt-toggle{position:fixed!important;right:18px!important;bottom:18px!important;z-index:10001!important;padding:8px 14px!important;border-radius:3px!important;border:1px solid #737373!important;background:rgba(255,255,255,.95)!important;color:#000000!important;font-size:13px!important;cursor:pointer!important;box-shadow:0 2px 10px rgba(0,0,0,.25)!important;font-family:Arial,sans-serif!important}
.cbt-toggle:hover{background:#f2f2f2!important}
`;

  var styleEl = null;
  function ensureStyle() {
    if (!styleEl || !styleEl.parentNode) {
      styleEl = document.createElement('style');
      styleEl.setAttribute('data-cbt', 'style');
      styleEl.textContent = CSS;
      (document.head || document.documentElement).appendChild(styleEl);
    } else if (document.head) {
      document.head.appendChild(styleEl);
    }
  }

  /* ============================================================
   * 工具
   * ============================================================ */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function addClass(el, c) { if (el && !el.classList.contains(c)) el.classList.add(c); }
  function removeClass(el, c) { if (el) el.classList.remove(c); }

  function isMock() { return /^\/mock\/detail\//.test(location.pathname); }

  function moduleName() {
    var m = location.pathname.match(/\/(listen|read|write)\//);
    if (!m) return '';
    return { listen: 'Listening', read: 'Reading', write: 'Writing' }[m[1]] || '';
  }

  function findUserId() {
    try {
      var t = document.body.innerText;
      var m = /\d{3}\*{2,}\d{0,6}|\d{11}/.exec(t);
      if (m) return m[0];
    } catch (e) {}
    return '';
  }

  /* ============================================================
   * 页头（官方：IELTS 品牌 + Test taker ID + 右侧按钮 + Show notes）
   * ============================================================ */
  /* 记录 clock-info 原始位置，用于关闭开关时还原 */
  var clockOrigParent = null, clockOrigNext = null;

  function transformHeader() {
    var header = $('.normal-header');
    if (!header) return;
    if (!$('[data-cbt="brand"]', header)) {
      var brand = document.createElement('div');
      brand.setAttribute('data-cbt', 'brand');
      brand.className = 'cbt-brand';
      var uid = findUserId();
      brand.innerHTML = '<div class="cbt-brand-row"><span class="cbt-ielts">IELTS</span>' +
        '<span class="cbt-taker">Test taker ID' + (uid ? ':&nbsp;<b></b>' : '') + '</span></div>';
      if (uid) brand.querySelector('.cbt-taker b').textContent = uid;
      header.insertBefore(brand, header.firstChild);
    }
    /* 把计时挪到 IELTS 品牌下方（小字） */
    var brand2 = $('[data-cbt="brand"]', header);
    var clock = document.getElementById('clock-info');
    if (brand2 && clock && clock.parentNode !== brand2) {
      /* 记录原始位置 */
      clockOrigParent = clock.parentNode;
      clockOrigNext = clock.nextSibling;
      if (!brand2.querySelector('.cbt-brand-row')) {
        var row = document.createElement('div');
        row.className = 'cbt-brand-row';
        var ielts = brand2.querySelector('.cbt-ielts');
        var taker = brand2.querySelector('.cbt-taker');
        if (ielts) row.appendChild(ielts);
        if (taker) row.appendChild(taker);
        brand2.insertBefore(row, brand2.firstChild);
      }
      brand2.appendChild(clock);
    }
    var btns = $('.normal-header__btns', header);
    if (btns && !$('[data-cbt="notes-btn"]', btns)) {
      var nb = document.createElement('button');
      nb.setAttribute('data-cbt', 'notes-btn');
      nb.className = 'cbt-notes-btn';
      nb.textContent = 'Show notes';
      nb.addEventListener('click', toggleNotes);
      btns.insertBefore(nb, btns.firstChild);
    }
  }

  /* ============================================================
   * 左右分屏 + 官方可拖拽分割条
   * ============================================================ */
  function transformSplit() {
    $$('.reading-wrap, .writing-wrap').forEach(function (wrap) {
      if (wrap.getAttribute('data-cbt-split')) return;
      wrap.setAttribute('data-cbt-split', '1');
      var left = wrap.firstElementChild;
      var right = wrap.lastElementChild;
      if (!left || !right || left === right) return;
      var kind = wrap.classList.contains('reading-wrap') ? 'reading' : 'writing';
      addClass(left, 'cbt-col-left');
      addClass(right, 'cbt-col-right');
      var divider = document.createElement('div');
      divider.setAttribute('data-cbt', 'divider');
      divider.className = 'cbt-divider';
      divider.innerHTML = '<div class="cbt-handle">&#8660;</div>';
      right.parentNode.insertBefore(divider, right);
      var pct = parseFloat(LS.get(KEYS.left + kind, 50)) || 50;
      left.style.width = pct + '%';
      initDrag(wrap, left, divider, kind);
    });
  }

  function initDrag(container, left, divider, kind) {
    var dragging = false, startX = 0, startPct = 50;
    divider.addEventListener('mousedown', function (e) {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startPct = parseFloat(left.style.width) || 50;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var rect = container.getBoundingClientRect();
      var w = rect.width || 1;
      var pct = startPct + ((e.clientX - startX) / w) * 100;
      pct = Math.max(30, Math.min(70, pct));
      left.style.width = pct + '%';
    });
    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      LS.set(KEYS.left + kind, parseFloat(left.style.width) || 50);
    });
  }

  /* ============================================================
   * 字号工具条（高亮走官方选中浮条）
   * ============================================================ */
  function transformOptions() {
    var header = $('.normal-header');
    if (!header) return;
    if ($('[data-cbt="options-btn"]')) return;
    var btns = $('.normal-header__btns', header);
    var insertTarget = btns || header;
    var ob = document.createElement('button');
    ob.setAttribute('data-cbt', 'options-btn');
    ob.className = 'cbt-options-btn';
    ob.textContent = 'Options';
    ob.addEventListener('click', function (e) {
      e.stopPropagation();
      var m = $('[data-cbt="options-menu"]');
      if (m) m.classList.toggle('cbt-open');
    });
    insertTarget.insertBefore(ob, btns ? btns.firstChild : null);
    var menu = document.createElement('div');
    menu.setAttribute('data-cbt', 'options-menu');
    menu.className = 'cbt-options-menu';
    menu.innerHTML = '<div class="cbt-options-title">Text size</div>' +
      '<div class="cbt-options-control">' +
      '<button data-cbt-fs-down>&#8722;</button>' +
      '<span class="cbt-fs-label"></span>' +
      '<button data-cbt-fs-up>+</button></div>' +
      '<button class="cbt-options-reset" data-cbt-fs-reset>Reset text size</button>';
    document.body.appendChild(menu);
    menu.querySelector('[data-cbt-fs-down]').addEventListener('click', function () { setFs(state.fs - 1); });
    menu.querySelector('[data-cbt-fs-up]').addEventListener('click', function () { setFs(state.fs + 1); });
    menu.querySelector('[data-cbt-fs-reset]').addEventListener('click', function () { setFs(16); });
    syncFsLabel();
    applyFs();
    document.addEventListener('mousedown', function (e) {
      var btn = $('[data-cbt="options-btn"]');
      if (btn && btn.contains(e.target)) return;
      if (!menu.contains(e.target)) menu.classList.remove('cbt-open');
    });
  }

  function syncFsLabel() {
    var l = $('[data-cbt="options-menu"] .cbt-fs-label');
    if (l) l.textContent = state.fs + 'px';
  }

  function setFs(v) {
    state.fs = Math.max(14, Math.min(20, v));
    LS.set(KEYS.fs, state.fs);
    applyFs();
    syncFsLabel();
  }

  function applyFs() {
    document.documentElement.style.setProperty('--cbt-fs', state.fs + 'px');
  }

  /* ============================================================
   * 官方高亮：选中文字 → Note / Highlight 浮条
   * ============================================================ */
  function transformAdder() {
    if ($('[data-cbt="adder"]')) return;
    var adder = document.createElement('div');
    adder.setAttribute('data-cbt', 'adder');
    adder.className = 'cbt-adder';
    adder.style.setProperty('display', 'none', 'important');
    adder.innerHTML =
      '<button data-cbt-note>' + SVG_PEN + '<span>Note</span></button>' +
      '<button data-cbt-hl>' + SVG_MARK + '<span>Highlight</span></button>' +
      '<button data-cbt-clear-all><span>Clear all</span></button>';
    document.body.appendChild(adder);
    /* 关键：浮条按钮 mousedown 阻止默认，防止点击时浏览器清空文本选区 */
    adder.addEventListener('mousedown', function (e) { e.preventDefault(); });
    adder.querySelector('[data-cbt-hl]').addEventListener('click', function () {
      var range = savedRange;
      if (!range) {
        var sel = window.getSelection();
        range = sel && !sel.isCollapsed ? sel.getRangeAt(0) : null;
      }
      var isClear = adder.querySelector('[data-cbt-hl] span').textContent === 'Clear';
      if (range) {
        var mark = closestMark(range.commonAncestorContainer);
        if (isClear) {
          if (mark && mark.parentNode) {
            var nid = mark.getAttribute('data-cbt-note-id');
            if (nid && window.__cbtNotes) delete window.__cbtNotes[nid];
            var p0 = mark.parentNode;
            while (mark.firstChild) p0.insertBefore(mark.firstChild, mark);
            p0.removeChild(mark);
          }
        } else {
          if (mark && mark.parentNode) {
            var nid2 = mark.getAttribute('data-cbt-note-id');
            if (nid2 && window.__cbtNotes) delete window.__cbtNotes[nid2];
            var p1 = mark.parentNode;
            while (mark.firstChild) p1.insertBefore(mark.firstChild, mark);
            p1.removeChild(mark);
          } else {
            wrapRange(range, 'cbt-hl');
          }
        }
      }
      var sel2 = window.getSelection();
      sel2 && sel2.removeAllRanges();
      savedRange = null;
      hideAdder();
    });
    adder.querySelector('[data-cbt-clear-all]').addEventListener('click', function () {
      $$('.cbt-hl, .cbt-note, .highlighted').forEach(function (m) {
        if (m.parentNode) {
          var p = m.parentNode;
          while (m.firstChild) p.insertBefore(m.firstChild, m);
          p.removeChild(m);
        }
      });
      window.__cbtNotes = {};
      var sel = window.getSelection();
      if (sel) sel.removeAllRanges();
      savedRange = null;
      hideAdder();
    });
    adder.querySelector('[data-cbt-note]').addEventListener('click', function () {
      var range = savedRange;
      var sel = window.getSelection();
      if (!range) {
        range = sel && !sel.isCollapsed ? sel.getRangeAt(0) : null;
      }
      if (range) {
        var txt = range.toString().trim();
        if (txt) {
          var id = noteIdFor(txt);
          wrapRange(range, 'cbt-note', id);
          saveNoteEntry(id, txt, '');
        }
      }
      if (sel) sel.removeAllRanges();
      savedRange = null;
      hideAdder();
      if (txt) openNotesForNew(id);
    });
    bindHighlightMouse();
  }

  var savedRange = null;

  var SVG_PEN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M11 2.5l2.5 2.5-7.2 7.2-3.3.8.8-3.3L11 2.5z"/></svg>';
  var SVG_MARK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 13l1.5-4.5L11 1l4 4-7.5 7.5L3 14l-1-1zM9.5 2.5L13.5 6.5"/></svg>';

  function bindHighlightMouse() {
    var left = $('.cbt-col-left');
    if (!left || left.getAttribute('data-cbt-hl-bound')) return;
    left.setAttribute('data-cbt-hl-bound', '1');
    var downX = 0, downY = 0, movedDist = 0, downActive = false;
    function isInContent(el) {
      if (!el) return false;
      if (el.nodeType === 3) el = el.parentElement;
      return el && (el.closest('.cbt-col-left') || el.closest('.cbt-col-right'));
    }
    function showAdderForSelection() {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) { hideAdder(); return; }
      var range = sel.getRangeAt(0);
      var container = range.commonAncestorContainer;
      if (!isInContent(container)) { hideAdder(); return; }
      savedRange = range.cloneRange();
      var r = range.getBoundingClientRect();
      var adder = $('[data-cbt="adder"]');
      if (!adder) return;
      var hlBtn = adder.querySelector('[data-cbt-hl] span');
      if (hlBtn) hlBtn.textContent = closestMark(range.commonAncestorContainer) ? 'Clear' : 'Highlight';
      var x = r.left + r.width / 2;
      var below = r.bottom + 8;
      var above = r.top - adder.offsetHeight - 8;
      var top = below;
      if (below + adder.offsetHeight > window.innerHeight - 8 && above > 8) top = above;
      adder.style.setProperty('display', 'flex', 'important');
      adder.style.left = Math.max(8, Math.min(window.innerWidth - adder.offsetWidth - 8, x - adder.offsetWidth / 2)) + 'px';
      adder.style.top = Math.max(8, top) + 'px';
    }
    document.addEventListener('contextmenu', function (e) {
      hideAdder();
      if (document.body.classList.contains('cbt-new')) {
        e.preventDefault();
        return;
      }
      /* 监听原版 Clear all，点了之后我们也清自己的 */
      setTimeout(function () {
        var items = document.querySelectorAll('.contextMenu-item');
        for (var i = 0; i < items.length; i++) {
          if (items[i].textContent.trim() === 'Clear all') {
            items[i].addEventListener('click', function () {
              $$('.cbt-hl, .cbt-note').forEach(function (m) {
                if (m.parentNode) {
                  var p = m.parentNode;
                  while (m.firstChild) p.insertBefore(m.firstChild, m);
                  p.removeChild(m);
                }
              });
              window.__cbtNotes = {};
            });
          }
        }
      }, 50);
    }, true);
    document.addEventListener('mousedown', function (e) {
      if (!document.body.classList.contains('cbt-new')) return;
      /* 点击输入框/按钮时完全不干扰，让浏览器默认 focus 行为 */
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable || t.closest('button'))) {
        downActive = false;
        return;
      }
      var adder = $('[data-cbt="adder"]');
      if (adder && adder.contains(e.target)) { downActive = false; return; }
      if (!isInContent(e.target)) { downActive = false; return; }
      downActive = true; downX = e.clientX; downY = e.clientY; movedDist = 0;
      hideAdder();
    }, true);
    document.addEventListener('mousemove', function (e) {
      if (!document.body.classList.contains('cbt-new')) return;
      if (!downActive) return;
      var d = Math.max(Math.abs(e.clientX - downX), Math.abs(e.clientY - downY));
      if (d > movedDist) movedDist = d;
    }, true);
    document.addEventListener('mouseup', function (e) {
      if (!document.body.classList.contains('cbt-new')) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable || t.closest('button'))) {
        downActive = false;
        return;
      }
      var adder = $('[data-cbt="adder"]');
      if (adder && adder.contains(e.target)) { downActive = false; return; }
      if (!isInContent(e.target)) { downActive = false; return; }
      var wasDrag = downActive && movedDist >= 10;
      downActive = false;
      if (wasDrag) {
        showAdderForSelection();
      } else {
        var s = window.getSelection();
        if (s) s.removeAllRanges();
        hideAdder();
      }
    }, true);
    document.addEventListener('scroll', function () { hideAdder(); }, true);
    /* 绝对兜底：浮条显示但选区已为空（或不在左栏）时，强制随选区一起消失 */
    setInterval(function () {
      if (!document.body.classList.contains('cbt-new')) return;
      var adder = $('[data-cbt="adder"]');
      if (!adder || adder.style.display !== 'flex') return;
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !isInContent(sel.anchorNode)) hideAdder();
    }, 400);
  }

  function hideAdder() {
    var adder = $('[data-cbt="adder"]');
    if (adder) adder.style.setProperty('display', 'none', 'important');
  }

  function closestMark(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== document.body) {
      if (el.tagName === 'MARK' && el.classList.contains('cbt-hl')) return el;
      el = el.parentElement;
    }
    return null;
  }

  /* ============================================================
   * 官方 Notes 侧边栏
   * ============================================================ */
  function transformNotes() {
    var panel = $('[data-cbt="notes"]');
    if (!panel) {
      panel = document.createElement('aside');
      panel.setAttribute('data-cbt', 'notes');
      panel.className = 'cbt-notes';
      panel.innerHTML = '<div class="cbt-notes-head"><span>Notes</span><button data-cbt-notes-close>&#215;</button></div>' +
        '<div class="cbt-notes-list"></div>';
      document.body.appendChild(panel);
      panel.querySelector('[data-cbt-notes-close]').addEventListener('click', function () {
        removeClass(panel, 'cbt-open');
        document.body.classList.remove('cbt-notes-open');
        updateNotesBtn();
      });
    }
    renderNotesList();
  }

  function renderNotesList() {
    var panel = $('[data-cbt="notes"]');
    if (!panel) return;
    var list = panel.querySelector('.cbt-notes-list');
    var data = getNoteData();
    list.innerHTML = '';
    var ids = Object.keys(data);
    if (!ids.length) {
      list.innerHTML = '<div class="cbt-notes-empty">No notes yet.<br>Select text and click Note.</div>';
      return;
    }
    ids.forEach(function (id) {
      var item = document.createElement('div');
      item.className = 'cbt-note-item';
      item.setAttribute('data-id', id);
      item.innerHTML = '<div class="cbt-note-orig-wrap"><div class="cbt-note-orig"></div>' +
        '<button class="cbt-note-del" title="Delete note">&#215;</button></div>' +
        '<textarea spellcheck="false" placeholder="Write your note..."></textarea>';
      item.querySelector('.cbt-note-orig').textContent = '「' + data[id].text + '」';
      var ta = item.querySelector('textarea');
      ta.value = data[id].note || '';
      ta.addEventListener('input', function () {
        var d = getNoteData();
        if (d[id]) d[id].note = ta.value;
      });
      item.querySelector('.cbt-note-del').addEventListener('click', function () {
        var d = getNoteData();
        delete d[id];
        /* 删除蓝色 mark（unwrap） */
        $$('.cbt-note[data-cbt-note-id="' + id + '"]').forEach(function (m) {
          while (m.firstChild) m.parentNode.insertBefore(m.firstChild, m);
          m.parentNode.removeChild(m);
        });
        renderNotesList();
      });
      list.appendChild(item);
    });
  }

  function openNotesForId(id) {
    transformNotes();
    var p = $('[data-cbt="notes"]');
    if (!p) return;
    addClass(p, 'cbt-open');
    document.body.classList.add('cbt-notes-open');
    updateNotesBtn();
    renderNotesList();
    var item = p.querySelector('.cbt-note-item[data-id="' + id + '"]');
    if (item) {
      item.scrollIntoView({ block: 'center', behavior: 'smooth' });
      item.style.outline = '2px solid #2196f3';
      var ta = item.querySelector('textarea');
      if (ta) setTimeout(function () { ta.focus(); }, 300);
    }
  }

  function toggleNotes() {
    transformNotes();
    var p = $('[data-cbt="notes"]');
    if (!p) return;
    p.classList.toggle('cbt-open');
    document.body.classList.toggle('cbt-notes-open', p.classList.contains('cbt-open'));
    updateNotesBtn();
  }

  function openNotesForNew(id) {
    openNotesForId(id);
  }

  /* ---------- 蓝色笔记高亮 + 点击弹层 ---------- */
  /* 跨节点/跨段包裹：遍历所有被选中文本节点，每个单独包 mark，不破坏 block 结构 */
  function wrapRange(range, cls, noteId) {
    var marks = [];
    var container = range.commonAncestorContainer;
    var nodes = [];
    if (container.nodeType === 3) {
      /* 单个文本节点 */
      var start = range.startContainer === container ? range.startOffset : 0;
      var end = range.endContainer === container ? range.endOffset : container.textContent.length;
      if (end > start) nodes.push({ node: container, start: start, end: end });
    } else {
      /* 跨节点：遍历所有文本节点 */
      var w = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      var n;
      while ((n = w.nextNode())) {
        if (!range.intersectsNode(n)) continue;
        var s = n === range.startContainer ? range.startOffset : 0;
        var e = n === range.endContainer ? range.endOffset : n.textContent.length;
        if (e > s) nodes.push({ node: n, start: s, end: e });
      }
    }
    /* 从后往前包裹，避免位置偏移 */
    nodes.reverse().forEach(function (info) {
      var r = document.createRange();
      r.setStart(info.node, info.start);
      r.setEnd(info.node, info.end);
      var m = document.createElement('span');
      m.className = cls + ' highlighted';
      if (noteId) m.setAttribute('data-cbt-note-id', noteId);
      try { r.surroundContents(m); marks.push(m); } catch (e) {}
    });
    return marks;
  }

  function noteIdFor(txt) {
    var id = 0;
    for (var i = 0; i < txt.length; i++) id = ((id * 31) + txt.charCodeAt(i)) | 0;
    return 'n' + Math.abs(id);
  }
  function getNoteData() {
    return window.__cbtNotes || {};
  }
  function saveNoteEntry(id, txt, note) {
    window.__cbtNotes = window.__cbtNotes || {};
    window.__cbtNotes[id] = { text: txt, note: note };
  }
  function restoreNotes() {
    var data = getNoteData();
    var left = $('.cbt-col-left');
    if (!left) return;
    Object.keys(data).forEach(function (id) {
      var txt = data[id].text;
      if (!txt) return;
      if (left.querySelector('.cbt-note[data-cbt-note-id="' + id + '"]')) return;
      var w = document.createTreeWalker(left, NodeFilter.SHOW_TEXT);
      var n;
      while ((n = w.nextNode())) {
        if (n.parentNode && n.parentNode.closest('mark')) continue;
        var idx = n.textContent.indexOf(txt);
        if (idx >= 0) {
          var range = document.createRange();
          range.setStart(n, idx);
          range.setEnd(n, idx + txt.length);
          wrapRange(range, 'cbt-note', id);
          break;
        }
      }
    });
  }
  function showNotePopup(mark, id, entry) {
    hideNotePopup();
    var r = mark.getBoundingClientRect();
    var pop = document.createElement('div');
    pop.className = 'cbt-note-popup';
    pop.setAttribute('data-cbt', 'note-popup');
    pop.innerHTML = '<div class="cbt-note-orig"></div>' +
      '<textarea spellcheck="false" placeholder="Write your note..."></textarea>' +
      '<button class="cbt-note-save">Save note</button>';
    pop.querySelector('.cbt-note-orig').textContent = '“' + entry.text + '”';
    pop.querySelector('textarea').value = entry.note || '';
    document.body.appendChild(pop);
    var top = r.bottom + 8;
    if (top + pop.offsetHeight > window.innerHeight - 8) top = r.top - pop.offsetHeight - 8;
    pop.style.top = Math.max(8, top) + 'px';
    pop.style.left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left + r.width / 2 - pop.offsetWidth / 2)) + 'px';
    var ta = pop.querySelector('textarea');
    setTimeout(function () { ta.focus(); }, 50);
    pop.querySelector('.cbt-note-save').addEventListener('click', function () {
      saveNoteEntry(id, entry.text, ta.value.trim());
      hideNotePopup();
    });
    setTimeout(function () {
      document.addEventListener('mousedown', closeNotePopupOnOutside, true);
    }, 0);
  }
  function hideNotePopup() {
    var p = $('[data-cbt="note-popup"]');
    if (p) p.remove();
    document.removeEventListener('mousedown', closeNotePopupOnOutside, true);
  }
  function closeNotePopupOnOutside(e) {
    var p = $('[data-cbt="note-popup"]');
    if (p && !p.contains(e.target) && !(e.target.closest && e.target.closest('.cbt-note'))) hideNotePopup();
  }
  /* 点击蓝色笔记 → 弹层 */
  document.addEventListener('click', function (e) {
    var mark = e.target && e.target.closest ? e.target.closest('.cbt-note') : null;
    if (!mark) return;
    e.preventDefault();
    e.stopPropagation();
    var id = mark.getAttribute('data-cbt-note-id');
    openNotesForId(id);
  });

  function updateNotesBtn() {
    var p = $('[data-cbt="notes"]');
    var btn = $('[data-cbt="notes-btn"]');
    if (btn) btn.textContent = (p && p.classList.contains('cbt-open')) ? 'Hide notes' : 'Show notes';
  }

  /* ============================================================
   * 底部题号导航（加官方风格箭头）
   * ============================================================ */
  function transformNav() {
    var footer = $('.exam-bank-footer');
    if (!footer) return;
    /* 官方 "Part 1"（无冒号） */
    $$('.part .title', footer).forEach(function (t) {
      var s = t.textContent || '';
      if (/Part\s*\d+\s*:/.test(s)) t.textContent = s.replace(/Part\s*(\d+)\s*:/, 'Part $1');
    });
    updatePartChecks();
    if (!$('[data-cbt="prev"]', footer)) {
      var prev = document.createElement('button');
      prev.setAttribute('data-cbt', 'prev');
      prev.className = 'cbt-arrow';
      prev.innerHTML = '&#8249;';
      prev.addEventListener('click', function () { navStep(-1); });
      footer.insertBefore(prev, footer.firstChild);
    }
    if (!$('[data-cbt="next"]', footer)) {
      var next = document.createElement('button');
      next.setAttribute('data-cbt', 'next');
      next.className = 'cbt-arrow';
      next.innerHTML = '&#8250;';
      next.addEventListener('click', function () { navStep(1); });
      footer.appendChild(next);
    }
  }

  function updatePartChecks() {
    var ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
    $$('.exam-bank-footer .part').forEach(function (part) {
      var title = part.querySelector('.title');
      if (!title) return;
      var items = part.querySelectorAll('.item');
      var total = items.length;
      var answered = 0;
      items.forEach(function (it) {
        var c = it.className;
        /* 已答标记：had / answered / 或有下划线样式 */
        if (/\b(had|answered|done|completed)\b/.test(c)) answered++;
        else if (it.querySelector('u, .underline, .answered')) answered++;
      });
      var allDone = total > 0 && answered === total;
      var existing = title.querySelector('.cbt-check');
      if (allDone && !existing) {
        var check = document.createElement('span');
        check.className = 'cbt-check';
        check.textContent = '\u2713';
        title.insertBefore(check, title.firstChild);
      } else if (!allDone && existing) {
        existing.remove();
      }
    });
  }

  function navStep(d) {
    var items = $$('.exam-bank-footer .part .item');
    if (!items.length) return;
    var sel = $('.exam-bank-footer .part .item.selected');
    var idx = sel ? items.indexOf(sel) : 0;
    var n = idx + d;
    if (n < 0 || n >= items.length) return;
    var t = items[n];
    if (t && t.click) t.click();
    else t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  /* ============================================================
   * 倒计时红色预警
   * ============================================================ */
  function startTimerWatch() {
    if (window.__cbtTimer) return;
    window.__cbtTimer = setInterval(function () {
      var clock = document.getElementById('clock-info');
      if (!clock || !document.body.classList.contains('cbt-new')) return;
      var t = (clock.innerText || '') + ' ' + (clock.textContent || '');
      var m = /(\d+)\s*(minutes?|min)\s*left|(\d+)m\s*(\d+)s|(\d+):(\d{2})/.exec(t);
      if (!m) return;
      var remain;
      if (m[1]) remain = parseInt(m[1], 10) * 60;
      else if (m[2]) remain = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
      else remain = parseInt(m[5], 10) * 60 + parseInt(m[6], 10);
      if (remain <= 300) {
        addClass(clock, 'cbt-warn');
        document.body.classList.add('cbt-header-warn');
      } else {
        removeClass(clock, 'cbt-warn');
        document.body.classList.remove('cbt-header-warn');
      }
    }, 1000);
  }

  /* ============================================================
   * 开关
   * ============================================================ */
  function transformToggle() {
    var t = $('[data-cbt="toggle"]');
    if (!t) {
      t = document.createElement('button');
      t.setAttribute('data-cbt', 'toggle');
      t.className = 'cbt-toggle';
      t.addEventListener('click', function () { setEnabled(!state.enabled); });
      document.body.appendChild(t);
    }
    t.textContent = state.enabled ? '新版机考：开' : '新版机考：关';
  }

  /* ============================================================
   * 关闭开关时还原原始 DOM（不刷新，保住作答）
   * ============================================================ */
  function revertAll() {
    try {
      var clock = document.getElementById('clock-info');
      if (clock && clockOrigParent && clockOrigParent.parentNode) {
        if (clockOrigNext && clockOrigNext.parentNode === clockOrigParent) {
          clockOrigParent.insertBefore(clock, clockOrigNext);
        } else {
          clockOrigParent.appendChild(clock);
        }
      }
      $$('.cbt-col-left').forEach(function (el) { el.classList.remove('cbt-col-left'); el.style.width = ''; });
      $$('.cbt-col-right').forEach(function (el) { el.classList.remove('cbt-col-right'); });
      $$('[data-cbt-split]').forEach(function (el) { el.removeAttribute('data-cbt-split'); });
      /* 删除注入元素，但绝不删 toggle */
      $$('[data-cbt]').forEach(function (el) {
        var k = el.getAttribute('data-cbt');
        if (k && k !== 'toggle') el.remove();
      });
      document.body.classList.remove('cbt-new', 'cbt-notes-open', 'cbt-header-warn');
      document.documentElement.classList.remove('cbt-new');
    } catch (e) { console.warn('cbt revert error', e); }
    /* 确保 toggle 按钮一定在 */
    var t = $('[data-cbt="toggle"]');
    if (!t) {
      t = document.createElement('button');
      t.setAttribute('data-cbt', 'toggle');
      t.className = 'cbt-toggle';
      t.addEventListener('click', function () { setEnabled(!state.enabled); });
      document.body.appendChild(t);
    }
  }

  function setEnabled(v) {
    state.enabled = v;
    LS.set(KEYS.on, v);
    if (v) {
      document.body.classList.add('cbt-new');
      document.documentElement.classList.add('cbt-new');
      transformAll();
    } else {
      revertAll();
    }
    transformToggle();
  }

  /* ============================================================
   * 主流程（仅机考做题页）
   * ============================================================ */
  function transformAll() {
    if (!isMock()) {
      document.body.classList.remove('cbt-new');
      document.documentElement.classList.remove('cbt-new');
      return;
    }
    /* 输入中不重跑，避免失焦 */
    var ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
    ensureStyle();
    document.body.classList.toggle('cbt-new', state.enabled);
    document.documentElement.classList.toggle('cbt-new', state.enabled);
    if (!state.enabled) return;
    transformHeader();
    transformSplit();
    transformOptions();
    transformNav();
    transformAdder();
    transformNotes();
    transformToggle();
    applyFs();
    startTimerWatch();
    restoreNotes();
    clearOnSubmit();
  }

  /* 交卷时清空所有高亮和笔记（DOM + localStorage） */
  function clearAllMarks() {
    function unwrap(m) {
      while (m.firstChild) m.parentNode.insertBefore(m.firstChild, m);
      m.parentNode.removeChild(m);
    }
    $$('.cbt-hl').forEach(unwrap);
    $$('.cbt-note').forEach(unwrap);
    window.__cbtNotes = {};
  }

  function clearOnSubmit() {
    var btns = $$('.normal-header__btns-item');
    btns.forEach(function (b) {
      if (b.getAttribute('data-cbt-cleared')) return;
      if (/submit/i.test(b.textContent || '')) {
        b.setAttribute('data-cbt-cleared', '1');
        b.addEventListener('click', clearAllMarks, true);
      }
    });
  }

  function boot() {
    ensureStyle();
    if (isMock()) transformToggle();
    transformAll();
    var lastUrl = location.href;
    function checkUrl() {
      if (location.href !== lastUrl) {
        /* 离开做题页（强制收卷跳到结果页）时清空高亮笔记 */
        if (!isMock()) clearAllMarks();
        lastUrl = location.href;
        clearTimeout(window.__cbtDebounce);
        window.__cbtDebounce = setTimeout(transformAll, 300);
      }
      requestAnimationFrame(checkUrl);
    }
    requestAnimationFrame(checkUrl);
    setInterval(function () {
      if (document.body.classList.contains('cbt-new')) updatePartChecks();
    }, 1000);
  }

  ensureStyle();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
