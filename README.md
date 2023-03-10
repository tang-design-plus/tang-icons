
<div align="center">
\!\[markdown picture](./logo.svg)

## tang-icons
基于vite+lit 自动构建的 web-components svg图标库 
</div>

## 安装
```
pnpm install @tang/icons
```
## 使用
### 在 vue 使用
```ts
// vite.config.js
import vue from '@vitejs/plugin-vue'
export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将所有带短横线的标签名都视为自定义元素
          isCustomElement: (tag) => tag.includes('t-')
        }
      }
    })
  ]
}
// *.vue
<script setup lang="ts">
import '@tang/iocns'
</script>
...
<template>
  <t-uer clolors="#fe3,#f30"></t-user>
</template>
```
### 在 html 使用
```html
<script type="module" src="./dist/icons.js"></script>
...
<div style="font-size:20px">
  <t-user />
</div>
...
```
## 添加图标
[图标绘制规范](https://www.iconfont.cn/help/detail?spm=a313x.7781069.1998910419.26&helptype=draw)
讲符合规范的svg图标复制进 src/svg 目录
```
pnpm run optimize 
pnpm run build
```
执行以上命令，压缩svg文件 以及生成新的图标相关文件，可直接在项目中使用