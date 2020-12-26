
# 特色功能
*    常用榜。
*    模糊查询 (编辑距离、类SublimeText)，用于查找不能完全拼写出来的单词。
*    形似词，用于对比区分拼写相近易混淆的单词。
*    音似词，用于对比区分读音相近易混淆的单词。

# 安装

npm install h2dict -g # from npmjs.org
npm link # from source code

# Exmples

查询单词staff
```Shell
h2dict/dict/f staff 
```

使用通配符搜索单词
```Shell
h2dict/dict/f 'st?ff' 
```

使用通配符搜索1万常用单词，默认最多显示20个
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

使用编辑距离算法模糊搜索，默认最多显示20个最匹配的单词
```Shell
ff stff 
```

使用编辑距离算法，在前1万常用单词中，模糊搜索，并显示前3个最匹配的单词
```Shell
ff stff 1w 3 
```

使用类SublimeText矢量算法，在前1万常用单词中，模糊搜索，并显示前3个最匹配的单词
```Shell
fff stff 1w 3 
```
