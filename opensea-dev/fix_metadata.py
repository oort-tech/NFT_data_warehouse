#!/usr/bin/python3
import os

directory="./build/contracts"
keyword="\"metadata\": \"\","
base=os.path.join("build","contracts")

for fn in os.listdir(base):
    print("Fixing file {}...".format(fn))
    fs=open(os.path.join(base,fn),'r+')
    text=fs.read()
    text=text.replace(keyword,'')
    fs.seek(0,0)
    fs.truncate(0)
    fs.write(text)
    fs.close()
print("Finished!")