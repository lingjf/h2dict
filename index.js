#!/usr/bin/env node

var S1 = require("./lcs.js");
var S2 = require("./levenshtein.js");
var S3 = require("./fts_fuzzy_match.js");
// https://www.forrestthewoods.com/blog/reverse_engineering_sublime_texts_fuzzy_match/
// https://github.com/forrestthewoods/lib_fts
var S4 = require("./double_metaphone.js");

var P = require("commander");

var chalk = require("chalk");

var stringWidth = require("string-width");

// var words = require('an-array-of-english-words')

var wordlist = require("./wordlist.json");
var wordroot = require("./wordroot.json");
var wordfixa = require("./wordfixa.json");
var wordfixs = require("./wordfixs.json");

function calcSimilarity(a, b) {
  //Similarity(A,B)=LCS(A,B)/(LD(A,B)+LCS(A,B))
  var ld = S2.Levenshtein(a, b);
  var lc = S1.LCS(a, b).length;
  return lc / (ld + lc);
}

function getSimilars(x) {
  return wordlist
    .map(function (a) {
      a.similarity = calcSimilarity(x, a.w);
      return a;
    })
    .sort(function (a, b) {
      return b.similarity - a.similarity;
    });
}

function getFuzzys(x) {
  return wordlist
    .filter(function (a) {
      r = S3.fuzzyMatch(x, a.w);
      if (r[0]) a.similarity = r[1];
      return r[0];
    })
    .sort(function (a, b) {
      return b.similarity - a.similarity;
    });
}

function getPhontics(x) {
  var m = S4.DoubleMetaphone(x);
  return wordlist.filter(function (a) {
    var n = S4.DoubleMetaphone(a.w);
    return m[0] == n[0] || m[1] == n[1];
  });
}

function isNumbers(x) {
  return /^[0-9\-/]+/.test(x);
}

function isChinese(c) {
  return /[\u4e00-\u9fa5]/.test(c);
}

function isWildCard(x) {
  var result = -1;
  if (x) result = x.search(/[\*\?\[\]\^\$]/);
  return result !== -1;
}

function getWildcards(x) {
  var re = new RegExp("^" + x.replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
  return wordlist.filter(function (a) {
    return re.test(a.w);
  });
}

function number_fmt(a) {
  a = a * 100;
  return a.toFixed(0) / 100;
}

function parseKWM(str) {
  n = parseFloat(str);
  if (str.toUpperCase().endsWith("K")) n = n * 1000;
  else if (str.toUpperCase().endsWith("W")) n = n * 1000 * 10;
  else if (str.toUpperCase().endsWith("M")) n = n * 1000 * 1000;
  return n;
}

function isKWM(str) {
  if (str.toUpperCase().endsWith("K")) return true;
  else if (str.toUpperCase().endsWith("W")) return true;
  else if (str.toUpperCase().endsWith("M")) return true;
  else return false;
}

function short_explain(e) {
  var a = e.join("; ");
  if (a.length > 24) return a.substring(0, 24) + " ......";
  return a;
}

function showline_word(word) {
  var cs = process.stdout.columns;

  var wordstr = word.w + ": ";
  process.stdout.write(chalk.cyan(wordstr));
  cs -= stringWidth(wordstr);

  var importance = word.i + " ";
  process.stdout.write(chalk.yellow(importance));
  cs -= stringWidth(importance);

  if (word.similarity) {
    var similarity = number_fmt(word.similarity) + " ";
    process.stdout.write(chalk.blue(similarity));
    cs -= stringWidth(similarity);
  }

  if (word.p && word.p.length > 0) {
    process.stdout.write(word.p[word.p.length - 1] + " ");
    cs -= stringWidth(word.p[word.p.length - 1]) + 1;
  }

  for (var x of word.e) {
    var len = stringWidth(x + "；");
    if (cs > len) {
      process.stdout.write(chalk.green(x) + "；");
      cs -= len;
    }
  }

  console.log("");
}

function show_words(words, a1, a2) {
  ki = 30000;
  ci = 32;
  if (a1) {
    if (isKWM(a1)) ki = parseKWM(a1);
    else ci = parseInt(a1);
  }
  if (a2) {
    if (isKWM(a2)) ki = parseKWM(a2);
    else ci = parseInt(a2);
  }

  res = {};
  s = 0;
  words.forEach(function (x) {
    if (s < ci && s < ki && x.i < ki) {
      s++;
      // if (x.similarity) {
      //   res[x.w] = [x.i, number_fmt(x.similarity), short_explain(x.e)];
      // } else {
      //   res[x.w] = [x.i, x.p[0], short_explain(x.e)];
      // }
      showline_word(x);
    }
  });
  // console.log(res);
}

function matchline_wordstem(line) {
  if (P.args.length == 0) return true;
  for (const arg of P.args) {
    for (const item of line) {
      if (isWildCard(arg)) {
        var re = new RegExp("^" + arg.replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
        if (re.test(item)) return true;
      } else if (item.indexOf(arg) == 0) {
        return true;
      }
      if (isChinese(item)) {
        break;
      }
    }
  }
  return false;
}

function showline_wordstem(line) {
  var cs = process.stdout.columns;
  var ph = 0;
  for (var i = 0; i < line.length; i++) {
    const item = line[i];
    if (isChinese(item)) {
      if (ph == 0) ph = 1;
    } else {
      if (ph == 1) ph = 2;
    }
    if (ph == 0) {
      if (!P.without_stem) {
        if (i == 0) process.stdout.write(chalk.red(item + " "));
        else process.stdout.write(chalk.magenta(item + " "));
        cs -= item.length + 1;
      }
    } else if (ph == 1) {
      if (!P.without_mean) {
        process.stdout.write(chalk.green(item + " "));
        cs -= item.length + 1;
      }
    } else {
      if (!P.without_inst) {
        if (!isChinese(item)) {
          cs -= item.length + 1;
          if (cs < 5) {
            break;
          }
          process.stdout.write(chalk.cyan(item + " "));
        }
      }
    }
  }
  console.log("");
}

function showpage_wordstem(line) {
  var ph = 0;
  var str1 = "";
  var insts = [];
  for (var i = 0; i < line.length; i++) {
    const item = line[i];
    if (isChinese(item)) {
      if (ph == 0) ph = 1;
    } else {
      if (ph == 1) ph = 2;
    }
    if (ph == 0) {
      if (!P.without_stem) {
        if (i == 0) str1 += chalk.red(item + " ");
        else str1 += chalk.magenta(item + " ");
      }
    } else if (ph == 1) {
      if (!P.without_mean) {
        str1 += chalk.green(item + " ");
      }
    } else {
      if (!P.without_inst) {
        if (!isChinese(item)) {
          insts.push({ w: item });
        } else {
          insts[insts.length - 1].m = item;
        }
      }
    }
  }
  console.log(str1);
  for (const inst of insts) {
    const word = wordlist.find((x) => x.w == inst.w);
    if (word) {
      var cs = process.stdout.columns;

      process.stdout.write(chalk.cyan(" " + word.w));
      cs -= stringWidth(word.w) + 1;

      var importance = " " + word.i;
      process.stdout.write(chalk.yellow(importance));
      cs -= stringWidth(importance);

      if (word.p && word.p.length > 0) {
        process.stdout.write(" " + word.p[word.p.length - 1]);
        cs -= stringWidth(word.p[word.p.length - 1]) + 1;
      }

      process.stdout.write(" ");
      cs -= 1;

      const es = inst.m ? [inst.m] : [];
      es.push(...word.e);

      for (var x of es) {
        var len = stringWidth(x + "；");
        if (cs > len) {
          process.stdout.write(chalk.green(x) + "；");
          cs -= len;
        }
      }

      console.log("");
    }
  }
}

function handle_wordstem(jsons) {
  // 如果多参数、参数是通配符表达式、没有精确匹配：则为列表模式
  var listable = true;
  if (P.args.length == 1 && !isWildCard(P.args[0])) {
    for (const line of jsons) {
      for (const item of line) {
        if (item == P.args[0]) {
          listable = false;
          break;
        }
      }
    }
  }
  if (listable) {
    for (const line of jsons) {
      if (matchline_wordstem(line)) {
        showline_wordstem(line);
      }
    }
  } else {
    const stem = P.args[0];
    for (const line of jsons) {
      for (const item of line) {
        if (item == stem) {
          showpage_wordstem(line);
          break;
        }
      }
    }
  }
}

P.version("h2dict 1.6.2 https://github.com/lingjf/h2dict.git")
  .option("-e, --levenshtein_fuzzy", "Fuzzy search with Levenshtein Edit Distance")
  .option("-v, --sublimetext_fuzzy", "Fuzzy search with Sublime Vector Matching")
  .option("-1, --without_stem", "Without 词根")
  .option("-2, --without_mean", "Without 解释")
  .option("-3, --without_inst", "Without 实例")
  .parse(process.argv);

var args = P.args;
var tool = process.argv[1];

if (tool.endsWith("/f1")) {
  var p1 = args[0];
  if (!isWildCard(args[0])) p1 = "*" + args[0] + "*";
  show_words(getWildcards(p1), args[1], args[2]);
} else if (tool.endsWith("/f2")) {
  handle_wordstem(wordroot);
} else if (tool.endsWith("/f3")) {
  handle_wordstem(wordfixa);
} else if (tool.endsWith("/f4")) {
  handle_wordstem(wordfixs);
} else if (tool.endsWith("/f7") || P.levenshtein_fuzzy) {
  show_words(getSimilars(args[0]), args[1], args[2]);
} else if (tool.endsWith("/f8") || P.sublimetext_fuzzy) {
  show_words(getFuzzys(args[0]), args[1], args[2]);
} else {
  if (!args[0]) {
    console.log("");
    console.log("h2dict/dict/f staff #查询单词staff");
    console.log("h2dict/dict/f 'st?ff' #使用通配符搜索单词");
    console.log("h2dict/dict/f 'st?ff' 1w # 使用通配符搜索1万常用单词,默认最多显示20个");
    console.log("h2dict/dict/f 'st?ff' 1w 3 # 使用通配符搜索1万常用单词,并显示前3个");
    console.log("h2dict/dict/f 10 # 列举前10常用单词");
    console.log("h2dict/dict/f 1k 5 # 列举1000到1005常用单词");
    console.log("h2dict/dict/f1 tract # 使用子串或通配符搜索单词");
    console.log("h2dict/dict/f2 tract # 列出词根tract");
    console.log("h2dict/dict/f3 ab # 列出前缀ab");
    console.log("h2dict/dict/f4 able # 列出后缀able");
    console.log("h2dict/dict/f7 stff # 使用编辑距离算法模糊搜索,默认最多显示20个最匹配的单词");
    console.log("h2dict/dict/f7 stff 1w 3 # 使用编辑距离算法,在前1万常用单词中模糊搜索,并显示前3个最匹配的单词");
    console.log("h2dict/dict/f8 stff 1w 3 # 使用类SublimeText矢量算法,在前1万常用单词中模糊搜索,并显示前3个最匹配的单词");
    console.log("");
  } else if (isWildCard(args[0])) {
    show_words(getWildcards(args[0]), args[1], args[2]);
  } else if (isChinese(args[0])) {
    cn = args[0];
    res = wordlist.filter(function (a) {
      var r = false;
      for (var i = 0; i < a.e.length; i++) {
        if (0 <= a.e[i].indexOf(cn)) {
          a.e = [a.e[i]];
          r = true;
          break;
        }
      }
      return r;
    });
    show_words(res, args[1], args[2]);
  } else if (isNumbers(args[0])) {
    var start = 0;
    var end = 0;

    if (args[1]) {
      start = parseKWM(args[0]);
      end = parseKWM(args[1]) + start;
    } else {
      end = parseKWM(args[0]);
    }

    r2 = {};
    wordlist.forEach(function (x, i) {
      if (start <= i && i < end) {
        r2[x.w] = [x.i, x.p[0], short_explain(x.e)];
      }
    });

    console.log(r2);
  } else {
    word = args[0];
    a = undefined;
    for (var i = 0; i < wordlist.length; i++) {
      if (wordlist[i]["w"] == word) {
        a = wordlist[i];
      }
    }
    if (a) {
      wout = {};
      wout["解释"] = a.e;
      wout["常用榜"] = a.i;
      wout["音标"] = a.p;
      if (a.s) wout["近义词"] = a.s;
      if (a.f) wout["词家族"] = a.f;
      var t1 = getSimilars(word)
        .slice(0, 8)
        .filter(function (x) {
          return x.similarity != 1;
        })
        .map(function (x) {
          return x.w;
        });
      if (t1) wout["形似字"] = t1;
      var t2 = getPhontics(word)
        .slice(0, 4)
        .filter(function (x) {
          return x.w != word;
        })
        .map(function (x) {
          return x.w;
        });
      if (t2) wout["音似字"] = t2;
      if (a.r) wout["相关字"] = a.r;
      console.log(wout);
    } else {
      show_words(getSimilars(word));
    }
  }
}
