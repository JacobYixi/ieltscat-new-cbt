# 新东方雅思猫机考 · 新版机考界面复刻

油猴脚本，把新东方雅思猫机考做题页（`/mock/detail/*`）改造为接近新版雅思机考的界面观感。

> 由于平台 DOM 结构和技术限制，无法做到像素级 100% 复刻，但在配色、排版、布局和交互逻辑上尽量贴近新版机考官方演示界面。只作用于机考做题页，练习页完全不受影响。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 打开 [raw 脚本链接](https://raw.githubusercontent.com/JacobYixi/ieltscat-new-cbt/main/ieltscat-new-cbt.user.js)，Tampermonkey 会自动弹出安装确认

## 功能

- 官方白底 Arial 排版，清除平台蓝/灰渐变背景
- 56px 页头（IELTS 品牌 + Test taker ID + 时间 + Options/Show notes）
- 文章/题目左右分栏，中间可拖拽分割条
- 选中文字浮条（Note / Highlight / Clear all），酒红色高亮
- Notes 侧栏，蓝色高亮标注
- 底部 Part 题号导航，可左右滚动，已答题目蓝色框，Review 圆形
- 倒计时最后 5 分钟红色预警
- 右下角开关随时切换新旧界面
- **只作用于机考做题页，练习页完全不受影响**

## 说明

- 由于技术原因，本脚本的 highlight/note 与原版右键菜单独立运行，互不影响。建议全程使用浮条操作，避免混用。
- highlight 和 note 均为临时存储，关闭标签页或刷新页面后自动清除。

## 许可

[Anti-996 License](https://github.com/kattgu7/Anti-996-License)
