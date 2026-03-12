import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OpenClaw 中文博客',
  description: 'OpenClaw 入门指南与使用技巧',
  lang: 'zh-CN',
  
  ignoreDeadLinks: [
    /^http:\/\/localhost/,
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '入门指南', link: '/guide/getting-started' },
      { text: '教程', link: '/tutorial/' },
      { text: 'GitHub', link: 'https://github.com/openclaw/openclaw' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: 'OpenClaw 简介', link: '/guide/getting-started' },
            { text: '快速安装', link: '/guide/installation' },
            { text: '基础配置', link: '/guide/configuration' }
          ]
        }
      ],
      '/tutorial/': [
        {
          text: '教程',
          items: [
            { text: '教程列表', link: '/tutorial/' },
            { text: 'OpenClaw 安全配置完全指南', link: '/tutorial/security-guide' },
            { text: 'OpenClaw 进阶技巧：30个实战经验', link: '/tutorial/power-user-tips' },
            { text: 'OpenClaw 新手避坑指南', link: '/tutorial/common-pitfalls' },
            { text: 'OpenClaw 生产环境部署指南', link: '/tutorial/production-deployment' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/BestDingSheng/openclaw_blog' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 OpenClaw 中文社区'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '目录'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#E74C3C' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh_CN' }]
  ]
})
