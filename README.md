
# 特色功能
*    常用度指标。
*    模糊查询 (编辑距离、类SublimeText)，用于查找不能完全拼写出来的单词。
*    形似词，用于对比区分拼写相近易混淆的单词。
*    音似词，用于对比区分发音相近易混淆的单词。

# 安装
npm link

npm install h2dict -g


# Exmples

查询单词staff
```Shell
h2dict/dict/f staff 
```

使用通配符搜索单词
```Shell
h2dict/dict/f 'st?ff' 
```

使用通配符搜索1万常用单词，默认显示20个
```Shell
h2dict/dict/f 'st?ff' 1w 
```

使用通配符搜索1万常用单词，并显示前3个
```Shell
h2dict/dict/f 'st?ff' 1w 3 
```

列举前10常用单词
```Shell
h2dict/dict/f 10 
```

列举1000到1005常用单词
```Shell
h2dict/dict/f 1k 5 
```

使用编辑距离算法，模糊搜索1万常用单词，并显示前3个
```Shell
ff stff 1w 3 
```

使用类SublimeText算法，模糊搜索1万常用单词，并显示前3个
```Shell
fff stff 1w 3 
```
