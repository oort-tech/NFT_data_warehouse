#!/usr/bin/env python3
import requests
import json
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import time

db_ = True # db stuff

headers = {
    "accept": "application/json",
    "Authorization": "mingyangsongissuperhandsome"
}

obj = {
    '_id': '',
    'nft_name': '',
    'nft_description': '',
    'nft_url': '',
    'nft_attributes': [],
    'nft_token_id': '',
    'updated_date': ''
}

nft_name = ''
nft_description = ''
nft_url = ''
nft_attributes = []  
image_binary = None
nft_time = ''

pic_path = './nfts/'
counts = 0
total = 0

def retrieve_image(url, type, name, token_id):
    try:
        fn = pic_path + name + '_' + token_id + '.' + type
        response = requests.get(url)
        if response.status_code == 200:
            if type == 'png' or type == 'PNG' or type=='JPG' or type == 'jpg' or type == 'jpeg' or type == 'gif' or type == 'svg' or type == 'mp4':
                with open(fn, "wb") as f:
                    f.write(response.content)
                return True
    except:
        return False

    return False

client = MongoClient('mongodb://localhost:27017/')
db = client['nfts']
collection = db['nft_db_1']

filename = 'transaction-history.json'
fd = open(filename, 'r')
f = json.load(fd)

for i in range(2000):
    boat = f[i]['nfts']
    for data in boat:
        contract_address = data['contract_address']
        token_id = data['token_id']
        metadata = data['metadata']
        nft_time = data['updated_date']
        if metadata:
            total += 1
            try:
                nft_name = metadata['name']
                nft_description = metadata['description']
                nft_url = metadata['image']
                nft_attributes = metadata['attributes']
                # get the image from url
                if db_:

                    img_type = nft_url.split('.')[-1]
                    try:
                        if retrieve_image(nft_url, img_type, nft_name, token_id) == False :
                            break
                    except:
                        break
                    # print('image saved: ',nft_name, token_id)
                    obj['_id'] = str(counts)
                    obj['nft_name'] = nft_name
                    obj['nft_description'] = nft_description
                    obj['nft_url'] = nft_url
                    obj['nft_attributes'] = nft_attributes
                    obj['nft_token_id'] = token_id
                    obj['updated_date'] = nft_time
                    # print('break point 1')
                    result = ''
                    try:
                        result = collection.insert_one(obj)
                        # print(result)
                    except DuplicateKeyError as e:
                        print(e)
                    counts += 1
                    print('obj id:',result.inserted_id, 'inserted, ', total, 'contracts processed')
            except:
                break
        else:
            break

client.close() # db close
print('process finished, ', total, 'contracts processed')