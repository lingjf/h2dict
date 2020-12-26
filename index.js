#!/usr/bin/env node

var S1 = require("./lcs.js");
var S2 = require("./levenshtein.js");
var S3 = require("./fts_fuzzy_match.js");
var S4 = require("./double_metaphone.js");

var P = require("commander");

var wordlist = require("./wordlist.json");
var wordmap = require("./wordmap.json");


function calcSimilarity(a, b) {
  //Similarity(A,B)=LCS(A,B)/(LD(A,B)+LCS(A,B))
  var ld = S2.Levenshtein(a, b);
  var lc = S1.LCS(a, b).length;
  return lc / (ld + lc);
}

function getSimilars(x) {
  var h = [];
  for (var i = 0; i < wordlist.length; i++) {
    h.push([wordlist[i], calcSimilarity(x, wordlist[i])]);
  }
  return h
    .sort(function (x, y) {
      return y[1] - x[1];
    })
    .map(function (d) {
      return { word: d[0], similarity: d[1] };
    });
}

function getFuzzys(x) {
  var h = [];
  for (var i = 0; i < wordlist.length; i++) {
    r = S3.fuzzyMatch(x, wordlist[i]);
    if (r[0]) h.push([wordlist[i], r[1]]);
  }
  return h
    .sort(function (x, y) {
      return y[1] - x[1];
    })
    .map(function (d) {
      return { word: d[0], similarity: d[1] };
    });
}

function getPhontics(x) {
  var m = S4.DoubleMetaphone(x);
  var h = [];
  for (var i = 0; i < wordlist.length; i++) {
    var n = S4.DoubleMetaphone(wordlist[i]);
    if (m[0] == n[0] || m[1] == n[1]) {
      h.push(wordlist[i]);
    }
  }
  return h;
}

function isNumbers(x) {
  return /^[0-9\-/]+/.test(x);
}

function isWildCard(x) {
  var result = -1;
  if (x) {
    result = x.search(/[\*\?\[\]\^\$]/);
  }
  return result !== -1;
}

function getWildcards(x) {
  var result = [];
  var c = 0;
  var re = new RegExp(
    "^" + x.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    "i"
  );
  for (var i = 0; i < wordlist.length; i++) {
    if (re.test(wordlist[i])) {
      c = c + 1;
      result.push({ word: wordlist[i] });
    }
  }
  return result;
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
  if (a.length > 24) {
    return a.substring(0, 24) + " ......";
  }
  return a;
}

function show_words(words, a1, a2) {
  ki = 30000;
  ci = 20;
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
    if (s < ci && s < ki && wordmap[x.word]["i"][1] < ki) {
      s++;
      if (x.similarity) {
        res[x.word] = [
          wordmap[x.word]["i"][1],
          number_fmt(x.similarity),
          short_explain(wordmap[x.word]["e"]),
        ];
      } else {
        res[x.word] = [
          wordmap[x.word]["i"][1],
          short_explain(wordmap[x.word]["e"]),
        ];
      }
    }
  });
  console.log(res);
}

P.version("h2dict 1.0.0 https://github.com/lingjf/h2dict.git")
.option("-e, --edit_distance_fuzzy", "Fuzzy search with edit distance")
.option("-v, --vector_fuzzy", "Fuzzy search with vector matches")
.parse(process.argv);

var args = P.args;
var tool = process.argv[1];

if (!args[0]) {
	console.log("");
	console.log("h2dict/dict/f staff #查询单词staff");
	console.log("h2dict/dict/f 'st?ff' #使用通配符搜索单词");
	console.log("h2dict/dict/f 'st?ff' 1w # 使用通配符搜索1万常用单词，默认最多显示20个" );
	console.log("h2dict/dict/f 'st?ff' 1w 3 # 使用通配符搜索1万常用单词，并显示前3个" );
	console.log("h2dict/dict/f 10 # 列举前10常用单词");
	console.log("h2dict/dict/f 1k 5 # 列举1000到1005常用单词");
	console.log("h2dict/dict/f -e stff # 使用编辑距离算法模糊搜索，默认最多显示20个最匹配的单词" );
	console.log("h2dict/dict/f -e stff 1w 3 # 使用编辑距离算法，在前1万常用单词中模糊搜索，并显示前3个最匹配的单词" );
	console.log("h2dict/dict/f -v stff 1w 3 # 使用类SublimeText矢量算法，在前1万常用单词中模糊搜索，并显示前3个最匹配的单词" );
	console.log("");

} else {
	if (tool.endsWith("/ff") || P.edit_distance_fuzzy) {
		show_words(getSimilars(args[0]), args[1], args[2]);
	} else if (tool.endsWith("/fff") || P.vector_fuzzy) {
		show_words(getFuzzys(args[0]), args[1], args[2]);
	} else if (isWildCard(args[0])) {
		show_words(getWildcards(args[0]), args[1], args[2]);
	} else if (isNumbers(args[0])) {
		var start = 0;
		var end = 0;
	
		if (args[2]) {
			start = parseKWM(args[1]);
			end = parseKWM(args[2]) + start;
		} else {
			end = parseKWM(args[1]);
		}
	
		r2 = {};
		wordlist.forEach(function (x, i) {
			if (start <= i && i < end) {
				r2[x] = [wordmap[x]["i"][1], short_explain(wordmap[x]["e"])];
			}
		});
		console.log(r2);
	} else {
		word = args[0];
		if (wordmap[word]) {
			wout = {};
			wout["解释"] = wordmap[word]["e"];
			wout["常用榜"] = wordmap[word]["i"];
			wout["音标"] = wordmap[word]["p"];
			if (wordmap[word]["s"]) wout["近义词"] = wordmap[word]["s"];
			if (wordmap[word]["f"]) wout["词家族"] = wordmap[word]["f"];
			var t1 = getSimilars(word).slice(0, 8) .filter(function (x) { return x.similarity != 1; }) .map(function (x) { return x.word; });
			if (t1) wout["形似字"] = t1;
			var t2 = getPhontics(word) .slice(0, 4) .filter(function (x) { return x != word; });
			if (t2) wout["音似字"] = t2;
			if (wordmap[word]["r"]) wout["相关字"] = wordmap[word]["r"];
			console.log(wout);
		} else {
			show_words(getSimilars(word));
		}
	}
}
