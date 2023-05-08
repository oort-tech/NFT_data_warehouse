import json
import csv

# read the meta.json file
with open('fixed_meta.json') as f:
    data = json.load(f)

#Contracts
for j in range(50):
    try:
        # code that may raise an error
        for nft in data[j]['nfts']:
            contract_address = nft['contract_address']
            attributes = nft['metadata']['attributes']
            token_id = nft['token_id']
            with open(f'{contract_address}.csv', 'a', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['token_id', 'trait_type', 'value'])
                for attribute in attributes:
                    writer.writerow([token_id, attribute['trait_type'], attribute['value']])
    except Exception:
        # code to handle the error (or you can leave it empty if you just want to skip the item)
        continue
    # loop through each nft
    for nft in data[j]['nfts']:
        # get the contract_address
        contract_address = nft['contract_address']

        # get the token_id
        token_id = nft['token_id']

        # get the attributes
        attributes = nft['metadata']['attributes']

        # create a new csv file with the contract_address as the file name
        with open(f'{contract_address}.csv', 'a', newline='') as csvfile:
            writer = csv.writer(csvfile)

            # write the header row
            writer.writerow(['token_id', 'trait_type', 'value'])

            # write the data rows
            for attribute in attributes:
                writer.writerow([token_id, attribute['trait_type'], attribute['value']])
            
    tokens = {}

    # read in the CSV file
    with open(f'{contract_address}.csv', 'r') as csv_file:
        csv_reader = csv.reader(csv_file)

        # iterate through each row in the CSV file
        for row in csv_reader:

            # if the row is a trait_type header row
            if row[0] == 'token_id' and row[1] == 'trait_type' and row[2] == 'value':

                # iterate through the remaining rows until the next trait_type header row is reached
                for next_row in csv_reader:

                    # if the next row is a trait_type header row, break out of the inner loop
                    if next_row[0] == 'token_id' and next_row[1] == 'trait_type' and next_row[2] == 'value':
                        break

                    # otherwise, add the trait_type and value to the dictionary for the corresponding token_id
                    token_id = next_row[0]
                    trait_type = next_row[1]
                    value = next_row[2]

                    if token_id not in tokens:
                        tokens[token_id] = {}

                    tokens[token_id][trait_type] = value

    # extract the unique trait_type headers and sort them alphabetically
    trait_types = sorted(set([trait_type for token in tokens.values() for trait_type in token]))

    # write the organized CSV file
    with open(f'{contract_address}.csv', 'w', newline='') as csv_file:
        csv_writer = csv.writer(csv_file)

        # write the trait_type header row
        csv_writer.writerow(['token_id'] + trait_types)

        # write a row for each token_id
        for token_id in sorted(tokens.keys()):
            row = [token_id]
            token = tokens[token_id]

            # fill in the values for each trait_type, or 'N/A' if the trait_type is not present for this token
            for trait_type in trait_types:
                row.append(token.get(trait_type, 'N/A'))

            csv_writer.writerow(row)

