
import json
import sys
import os


def do_delete(word):
    with open('../wordlist.json', 'r') as f:
        wordlist = json.load(f)
    with open('../wordmap.json', 'r') as f:
        wordmap = json.load(f)
    if word in wordlist:
        wordlist.remove(word)
    if word in wordmap:
        wordmap.pop(word)
    index = 0
    for w in wordlist:
        index = index + 1
        wordmap[w]["i"][1] = index 
    with open('../wordlist.json', 'w') as f:
        json.dump(wordlist, f, ensure_ascii=False)
    with open('../wordmap.json', 'w') as f:
        json.dump(wordmap, f, ensure_ascii=False)
    print(word + " deleted!")


for a in sys.argv[1:]:
    do_delete(a)
