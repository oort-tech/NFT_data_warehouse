#!/usr/bin/env python3
import requests
import time
import json

page_size = 50
continuation = None
count = 0
max_requests = 2000

url = 'https://api.nftport.xyz/v0/nfts?chain=ethereum&page_size='+str(page_size)+'&include=metadata'

filename = 'transaction-history.json'
f = open(filename, 'w')

headers = {
    "accept": "application/json",
    "Authorization": "mingyangsongissuperhandsome"
}

while True:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        print(count, ' success')
        metadata = json.loads(response.text)
        continuation = metadata['continuation']
        # print(continuation)
        url = 'https://api.nftport.xyz/v0/nfts?chain=ethereum&page_size='+str(page_size)+'&continuation='+continuation+'&include=metadata'
        json.dump(',', f, indent = 4)
        json.dump(metadata, f, indent = 4)

    count += 1
    if(count == max_requests):
        print('done')
        break

    time.sleep(0.35)
