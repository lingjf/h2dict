#!/usr/bin/env node

var S1 = require('./lcs.js');
var S2 = require('./levenshtein.js');
var S3 = require('./double_metaphone.js');

var wordlist = require('./wordlist.json');
var wordmap = require('./wordmap.json');

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
	return h.sort(function(x,y){return y[1]-x[1];}).map(function(d){return {word:d[0], similarity:d[1]};});
}

function getPhontics(x) {
	var m = S3.DoubleMetaphone(x);
	var h = [];
	for (var i = 0; i < wordlist.length; i++) {
		var n = S3.DoubleMetaphone(wordlist[i])
		if (m[0] == n[0] || m[1] == n[1]) {
			h.push(wordlist[i]);
		}
	}
	return h;
}

function isNumbers(x) {
	return /^[0-9\-/]+$/.test(x);
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
	var re = new RegExp('^' + x.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', "i");
	for (var i = 0; i < wordlist.length; i++) {
		if (re.test(wordlist[i])) {
			c = c + 1;
			result.push(wordlist[i]);
		}
	}
	return result;
}

function number_fmt(a) {
	a = a * 100;
	return a.toFixed(0)/100
}

function short_explain(e) {
	var a = e.join("; ")
	if (a.length > 24) {
		return a.substring(0, 24) + ' ......'
	}
	return a;
}

var args = process.argv.splice(2)
word = args[0];
if (word == '-v') {
	console.log("h2dict 1.0 Ling Jianfa https://github.com/lingjf/h2dict.git");
} else if (word == '-h') {
	console.log("h2dict/dict/f staff", "查询单词staff");
	console.log("h2dict/dict/f 'st?ff' 使用通配符搜索单词");
	console.log("h2dict/dict/f 10 列举前10常用的单词");
	console.log("h2dict/dict/f 1000-1110 列举1000到1110常用的单词");
	console.log("h2dict/dict/f 1000/5 列举1000到1005常用的单词");
} else if (isNumbers(word)) {
	var start = 0;
	var end = 0;
	if (word.indexOf("-") != -1) {
		var r1 = word.split("-");
		start = parseInt(r1[0]);
		end = parseInt(r1[1]);
	} else if (word.indexOf("/") != -1) {
		var r1 = word.split("/");
		start = parseInt(r1[0]);
		end = start + parseInt(r1[1]);
	} else {
		end = parseInt(word);
	}
	
	r2 = {};
	wordlist.forEach(function(x, i){
		if (start <= i && i < end) {
			r2[x] = [
				wordmap[x]["i"][1],
				short_explain(wordmap[x]["e"])
			]
		}
	});
	console.log(r2);
} else if (isWildCard(word)) {
	e1 = 30000;
	if (args[1]) {
		e1 = parseInt(args[1]);
	}
	r3 = getWildcards(word);
	r4 = {};
	r3.forEach(function(x){
		if (wordmap[x]["i"][1] < e1) {
			r4[x] = [
				wordmap[x]["i"][1], 
				short_explain(wordmap[x]["e"])
			];
		}
	});
	console.log(r4);
} else {
	if (wordmap[word]) {
		wout = {}
		wout["解释"] = wordmap[word]["e"];
		wout["常用榜"] = wordmap[word]["i"];
		wout["音标"] = wordmap[word]["p"];
		if (wordmap[word]["s"]) wout["近义词"] = wordmap[word]["s"];
		if (wordmap[word]["f"]) wout["词家族"] = wordmap[word]["f"];
		var t1 = getSimilars(word).slice(0,8).filter(function(x){return x.similarity!=1}).map(function(x) {return x.word});
		if (t1) wout["形似字"] = t1;
		var t2 = getPhontics(word).slice(0,4).filter(function(x){return x!=word});
		if (t2) wout["音似字"] = t2;
		if (wordmap[word]["r"]) wout["相关字"] = wordmap[word]["r"];
		console.log(wout);
	} else {
		r3 = getSimilars(word).slice(0,20);
		r4 = {};
		r3.forEach(function(x){
			r4[x.word] = [
				wordmap[x.word]["i"][1], 
				number_fmt(x.similarity), 
				short_explain(wordmap[x.word]["e"])
			];
		});
		console.log(r4);
	}
}
