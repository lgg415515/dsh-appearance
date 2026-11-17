# dsh-appearance

给 DSH 工作区做外观定制：背景图、面板透明度、强调色，全部可在「设置 → 插件」里改。

## 安装

```sh
dsh plugin add github:YOUR_USERNAME/dsh-appearance
```

装完重启一次 DSH，再 `Ctrl+Shift+R` 硬刷新。

## 配置项

在插件管理器里选中 `dsh-appearance`，即可编辑这些设置：

| 字段 | 含义 | 默认 |
|---|---|---|
| `backgroundDir` | 背景图目录；留空用 `~/.dsh/workspace-background` | 空 |
| `accentColor` | 强调色（「已完成·用时」「正在分析请求」等状态文字） | `#cd5e85` |
| `accentIconColor` | 图标色（用量/时间等小图标） | `#a87080` |
| `workspaceOpacity` | 工作区不透明度（0–100） | `20` |
| `sidebarOpacity` | 侧边栏不透明度（0–100） | `30` |
| `overlayStrength` | 背景图上的压暗强度（0–100） | `40` |

## 背景图

- 目录：`~/.dsh/workspace-background/`（Windows 为 `C:\Users\<你>\.dsh\workspace-background\`）。
- 推荐命名 `background.png` / `background.jpg` / `background.webp`；或直接放任意图片，插件取最近修改的那张。
- 支持的格式：`.png` `.jpg` `.jpeg` `.webp` `.gif` `.avif` `.bmp`。

## 许可

MIT
