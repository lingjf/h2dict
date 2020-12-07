
import json
import sys
import os

from urllib.request import urlopen
from urllib.parse import quote
from bs4 import BeautifulSoup


def __getone(word):
    url = "http://www.youdao.com/w/eng/" + word
    c1 = urlopen(url).read()
    c2 = c1.decode('utf-8')
    return c2

def __normalize(html):
    soup = BeautifulSoup(html,features='html.parser')
    c2 = {"pronounces": [], "explains":[], "synonyms":[], "relwords":[]}
    explains = soup.select('#phrsListTab .trans-container li')
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

def youdao():
    wordlist1 = json.load(open('wordlist1.json', 'r'))
    wordmap2 = {}
    try:
        with open('wordmap2.json', 'r') as f:
            wordmap2 = json.load(f)
    except:
        pass

    index = 0
    for word in wordlist1:
        if word not in wordmap2:
            r1 = __getone(word)
            r2 = __normalize(r1)
            wordmap2[word] = r2
            index = index + 1
            print(word + "  " + str(index))
            with open('wordmap2.json', 'w', encoding='utf-8') as f:
                json.dump(wordmap2, f, ensure_ascii=False)
    for word in wordmap2: # check
        if len(wordmap2[word]["explains"]) == 0:
            print(word + " not in")
            wordlist1.remove(word)
    with open('wordlist2.json', 'w', encoding='utf-8') as f:
        json.dump(wordlist1, f, ensure_ascii=False)

def __getfamily(html):
    soup = BeautifulSoup(html,features='html.parser')
    c2 = soup.find('vcom:wordfamily')
    if not c2:
        return None
    return c2.get('data')

def vocabulary():
    wordlist2 = json.load(open('wordlist2.json', 'r'))
    wordmap3 = {}
    try:
        with open('wordmap3.json', 'r') as f:
            wordmap3 = json.load(f)
    except:
        pass

    i = 0
    for word in wordlist2:
        i = i + 1
        if not wordmap3.get(word):
            print(str(i) + "   " + word)
            url = "http://www.vocabulary.com/dictionary/" + word
            r1 = os.popen("curl -L -s " + url)
            r2 = __getfamily(r1.read())
            if r2:
                r3 = json.loads(r2)
                for a in r3:
                    wordmap3[a["word"]] = a
                with open('wordmap3.json', 'w') as f:
                    json.dump(wordmap3, f)
            else:
                print('not found family !!!')
            


def freq_sort(elem):
    return elem["freq"]
def ffreq_sort(elem):
    return elem["ffreq"]


def sequence():
    wordmap3 = {}
    with open('wordmap3.json', 'r') as f:
        wordmap3 = json.load(f)

    print("Coverting to list...")
    wordsort1 = []
    wordsort2 = []
    for word in wordmap3:
        wordsort1.append(wordmap3[word])
        wordsort2.append(wordmap3[word])
            
    print("Sorting list...")

    wordsort1.sort(key=freq_sort, reverse=True)        
    wordsort2.sort(key=ffreq_sort, reverse=True)        

    i1 = 0
    for word in wordsort1:
        i1 = i1 + 1
        wordmap3[word["word"]]["i1"] = i1
    i2 = 0
    for word in wordsort2:
        i2 = i2 + 1
        wordmap3[word["word"]]["i2"] = i2
            
    print("Writing wordmap4.json...")
    with open('wordmap4.json', 'w') as f:
        json.dump(wordmap3, f)


def merge():
    print("Loading youdao.com ...")
    wordmap2 = {}
    with open('wordmap2.json', 'r') as f:
        wordmap2 = json.load(f)
    print("Loading vocabulary.com ...")
    wordmap4 = {}
    with open('wordmap4.json', 'r') as f:
        wordmap4 = json.load(f)
    wordmap5 = {}
    for word in wordmap2:
        wordmap5[word] = {}
        wordmap5[word]["p"] = wordmap2[word]["pronounces"]
        wordmap5[word]["e"] = wordmap2[word]["explains"]
        if "synonyms" in wordmap2[word] and 0 < len(wordmap2[word]["synonyms"]):
            wordmap5[word]["s"] = wordmap2[word]["synonyms"]
        if word in wordmap4:
            if "parent" in wordmap4[word]:
                wordmap5[word]["f"] = [wordmap4[word]["parent"]]
            if "i1" in wordmap4[word] and "i2" in wordmap4[word]:
                wordmap5[word]["i"] = [wordmap4[word]["i1"], wordmap4[word]["i2"]]
    for word in wordmap4:
        if "parent" in wordmap4[word]:
            p = wordmap4[word]["parent"]
            if p in wordmap5:
                if "f" in wordmap5[p]:
                    if word not in wordmap5[p]["f"]:
                        wordmap5[p]["f"].append(word)
                else:
                    wordmap5[p]["f"] = [word]
    print("Writing wordmap5.json...")
    with open('wordmap5.json', 'w') as f:
        json.dump(wordmap5, f, ensure_ascii=False)

def i0_sort(elem):
    return elem["i"][0]
def i1_sort(elem):
    return elem["i"][1]

def generate():
    print("Loading wordlist ...")
    wordlist2 = json.load(open('wordlist2.json', 'r'))
    print("Loading youdao.com ...")
    wordmap2 = json.load(open('wordmap2.json', 'r'))
    print("Loading vocabulary.com ...")
    wordmap4 = json.load(open('wordmap4.json', 'r'))
    sortlist = []
    index = 0
    for word in wordlist2:
        index = index + 1
        if word in wordmap2:
            t = {}
            t["w"] = word
            t["p"] = wordmap2[word]["pronounces"]
            t["e"] = wordmap2[word]["explains"]
            if "synonyms" in wordmap2[word] and 0 < len(wordmap2[word]["synonyms"]):
                t["s"] = wordmap2[word]["synonyms"]
            if word in wordmap4:
                if "parent" in wordmap4[word]:
                    t["f"] = [wordmap4[word]["parent"]]
                if "i1" in wordmap4[word] and "i2" in wordmap4[word]:
                    t["i"] = [wordmap4[word]["i1"], wordmap4[word]["i2"]]
            else:
                t["i"] = [index, index]
            sortlist.append(t)
    sortlist.sort(key=i0_sort)
    index = 0
    for word in sortlist:
        index = index + 1
        word["i"][0] = index
    sortlist.sort(key=i1_sort)
    index = 0
    for word in sortlist:
        index = index + 1
        word["i"][1] = index
    wordlist = []
    for word in sortlist:
        wordlist.append(word["w"])
    
    print("Writing wordlist.json...")
    with open('wordlist.json', 'w') as f:
        json.dump(wordlist, f, ensure_ascii=False)

    wordmap = {}
    for word in sortlist:
        wordmap[word["w"]] = word
        wordmap[word["w"]].pop("w")

    for word in wordmap4:
        if "parent" in wordmap4[word]:
            p = wordmap4[word]["parent"]
            if p in wordmap:
                if "f" in wordmap[p]:
                    if word not in wordmap[p]["f"]:
                        wordmap[p]["f"].append(word)
                else:
                    wordmap[p]["f"] = [word]
    print("Writing wordmap.json...")
    with open('wordmap.json', 'w') as f:
        json.dump(wordmap, f, ensure_ascii=False)


# youdao() # gen wordmap3.json
# vocabulary() # gen wordmap3.json
# sequence() # gen wordmap4.json
# merge() # gen wordmap5.json
generate() # gen wordlist.json wordmap.json
