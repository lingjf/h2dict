# h2dict
程序员的英语字典

# 特色功能：
## 常用度指标
## 模糊查询 (编辑距离、类SublimeText)
## 形似词
## 音似词

# 安装：
npm link

npm install h2dict -g


# Exmples

h2dict/dict/f staff #查询单词staff

h2dict/dict/f 'st?ff' #使用通配符搜索单词

h2dict/dict/f 'st?ff' 1w #使用通配符搜索1万常用单词，默认显示20个

h2dict/dict/f 'st?ff' 1w 3 #使用通配符搜索1万常用单词，并显示前3个

h2dict/dict/f 10 #列举前10常用单词

h2dict/dict/f 1k 5 #列举1000到1005常用单词

ff stff 1w 3 #使用编辑距离算法，模糊搜索1万常用单词，并显示前3个

fff stff 1w 3 #使用类SublimeText算法，模糊搜索1万常用单词，并显示前3个

