
import json
import sys
import os

from urllib.request import urlopen
from urllib.parse import quote
from bs4 import BeautifulSoup

def save_wordmap(wordmap):
    with open('wordmap.json', 'w', encoding='utf-8') as f:
        json.dump(wordmap, f, ensure_ascii=False)

def youdao_query(word):
    url = "http://www.youdao.com/w/eng/" + word
    c1 = urlopen(url).read()
    c2 = c1.decode('utf-8')
    return c2

def youdao_normalize(html):
    soup = BeautifulSoup(html, features='html.parser')
    c2 = {"pronounces": [], "explains": [], "synonyms": [], "relwords": []}
    keyword = soup.select('.wordbook-js .keyword')
    if len(keyword) == 0:
        return None
    else:
        c2["keyword"] = keyword[0].string
    explains = soup.select('#phrsListTab .trans-container li')
    if len(explains) == 0:
        return None
    else:
        for v in explains:
            c2["explains"].append(v.string)
    pronounces = soup.select('#phrsListTab .pronounce .phonetic')
    for v in pronounces:
        c2["pronounces"].append(v.string)
    synonyms = soup.select('#synonyms a')
    for v in synonyms:
        c2["synonyms"].append(v.string)
    relwords = soup.select('#relWordTab a')
    for v in relwords:
        c2["relwords"].append(v.string)
    return c2

def get_wordlist():
    wordlist = []
    with open('./wordlist.txt', 'r') as f:
        for line in f:
            wordlist.append(line.split()[0])

    a = []
    try:
        with open('./append.txt', 'r') as f:
            for line in f:
                a.append(line.split()[0])
    except:
        pass

    for word in a:
        if word not in wordlist:
            wordlist.append(word)

    b = []
    try:
        with open('./ignore.txt', 'r') as f:
            for line in f:
                b.append(line.split()[0])
    except:
        pass

    for word in b:
        if word in wordlist:
            wordlist.remove(word)
    return wordlist

def create_wordmap(wordlist):
    wordmap = {}
    try:
        with open('wordmap.json', 'r') as f:
            wordmap = json.load(f)
    except:
        pass
    for i, w in enumerate(wordlist):
        if w not in wordmap:
            wordmap[w] = {}
        wordmap[w]["word"] = w
        wordmap[w]["list_index"] = i + 1
    
    wordmap2 = {}
    for k in wordmap:
        if k in wordlist:
            wordmap2[k] = wordmap[k]
    save_wordmap(wordmap2)
    return wordmap2

def youdao(wordmap):
    for k in wordmap:
        if "explains" not in wordmap[k] or len(wordmap[k]["explains"]) == 0:
            print("youdao.com: " + k)
            r1 = youdao_query(k)
            r2 = youdao_normalize(r1)
            if not r2:
                print("youdao.com not found " + k)
                continue
            if r2["keyword"] != k:
                print("youdao.com not match " + k + " " + r2["keyword"])
                continue
            wordmap[k]["pronounces"] = r2["pronounces"]
            wordmap[k]["explains"] = r2["explains"]
            wordmap[k]["synonyms"] = r2["synonyms"]
            wordmap[k]["relwords"] = r2["relwords"]
            save_wordmap(wordmap)

def __getfamily(html):
    soup = BeautifulSoup(html, features='html.parser')
    c2 = soup.find('vcom:wordfamily')
    if not c2:
        return None
    return c2.get('data')

def query_vocabulary(word, entry):
    url = "http://www.vocabulary.com/dictionary/" + word
    r1 = os.popen("curl -L -s " + url)
    r2 = __getfamily(r1.read())
    if r2:
        r3 = json.loads(r2)
        for a in r3:
            if a["word"] == word:
                entry["freq"] = a["freq"]
                entry["ffreq"] = a["ffreq"]
                if "parent" in a:
                    entry["parent"] = a["parent"]
                print(word + ' found vocabulary.com ' + str(a["freq"]))
                return True
    print(word + ' not found vocabulary.com !!!')
    return False

def vocabulary(wordmap):
    for k in wordmap:
        if "freq" not in wordmap[k]:
            print("vocabulary.com: " + k)
            if query_vocabulary(k, wordmap[k]):
                save_wordmap(wordmap)

def kv(d, k):
    if k in d:
        return d[k]
    return 0

def convert_freq_to_seq(wordmap, k):
    wordsort1 = []
    for word in wordmap:
        wordmap[word]["word"] = word
        wordsort1.append(wordmap[word])
    wordsort1.sort(key=lambda entry: kv(entry, k), reverse=True)
    for i, word in enumerate(wordsort1):
        wordmap[word["word"]][k + "_index"] = i

def bnc_seq(wordmap):
    bnc = []
    try:
        with open('./bnc15knum.txt', 'r') as f:
            for line in f:
                bnc.append(line.split()[0])
    except:
        return
    for i, word in enumerate(bnc):
        if word in wordmap:
            wordmap[word]["bnc_index"] = i

def manual_adjust_seq(wordmap):
    adjust = {}
    try:
        with open('./append.txt', 'r') as f:
            for line in f:
                xx = line.split()
                if len(xx) > 1:
                    adjust[xx[0]] = int(xx[1])
    except:
        return
    for word in adjust:
        if word in wordmap:
            wordmap[word]["adjust_index"] = adjust[word]

def mix_sort(elem):
    res = 80000
    if "list_index" in elem:
        res = min(elem["list_index"], res)
    if "ffreq_index" in elem:
        res = min(elem["ffreq_index"], res)
    if "freq_index" in elem:
        res = min(elem["freq_index"], res)
    if "bnc_index" in elem:
        res = min(elem["bnc_index"], res)
    if "adjust_index" in elem:
        res = min(elem["adjust_index"], res)
    return res

def sequence(wordmap):
    convert_freq_to_seq(wordmap, 'freq')
    convert_freq_to_seq(wordmap, 'ffreq')
    bnc_seq(wordmap)
    manual_adjust_seq(wordmap)
    wordsort1 = []
    for word in wordmap:
        wordsort1.append(wordmap[word])
    wordsort1.sort(key=mix_sort, reverse=False)
    for i, word in enumerate(wordsort1):
        wordmap[word["word"]]["seq"] = i + 1
    return wordsort1
    
def build_family(wordmap):
    for word in wordmap:
        wordmap[word]["family"] = []
        if "parent" in wordmap[word]:
            wordmap[word]["family"].append(wordmap[word]["parent"])
        if "relwords" in wordmap[word]:
            for x in wordmap[word]["relwords"]:
                if x not in wordmap[word]["family"]:
                    wordmap[word]["family"].append(x)
    for word in wordmap:
        if "parent" in wordmap[word]:
            p = wordmap[word]["parent"]
            if p in wordmap:
                if word not in wordmap[p]["family"]:
                    wordmap[p]["family"].append(word)

def generate(wordsort):
    wordlist = []
    for i, word in enumerate(wordsort):
        t = {}
        t["w"] = word["word"]
        t["p"] = word["pronounces"]
        t["e"] = word["explains"]
        t["i"] = word["seq"]
        if "synonyms" in word and 0 < len(word["synonyms"]):
            t["s"] = word["synonyms"]
        if "family" in word and 0 < len(word["family"]):
            t["f"] = word["family"]
        wordlist.append(t)
    with open('../wordlist.json', 'w') as f:
        json.dump(wordlist, f, ensure_ascii=False)

#main()
wordlist = get_wordlist()
wordmap = create_wordmap(wordlist)
youdao(wordmap)
vocabulary(wordmap)
build_family(wordmap)
wordsort = sequence(wordmap)
generate(wordsort)
