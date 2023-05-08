import json
import csv

# Open and read the JSON file
with open('top_contract_30d.json') as json_file:
    data = json.load(json_file)

# Extract "contract_address" and "name" for each contract
contracts = []
for contract in data['contracts']:
    address = contract['contract_address']
    name = contract['name']
    contracts.append({'address': address, 'name': name})

# Write the extracted data to a CSV file
with open('top_stat_30d.csv', mode='w', newline='') as csv_file:
    writer = csv.writer(csv_file)
    writer.writerow(['contract_address', 'name'])
    for contract in contracts:
        writer.writerow([contract['address'], contract['name']])



# Open the output file in append mode
with open('top_stat_30d.csv', mode='a', newline='') as output_file:
    output_writer = csv.writer(output_file)

    # Open the contract_stat.json file and parse it as JSON
    with open('fixed_contract_stat.json') as json_file:
        data = json.load(json_file)

        # Write the headers for the new columns to the output file
        headers = list(data[0]['statistics'].keys())
        output_writer.writerow(['', ''] + headers)

        # Loop through each contract in the JSON data
        for contract in data:
            # Get the statistics for the contract
            stats = contract['statistics']

            # Write the statistics to the output file
            row = ['', '']
            for key in headers:
                row.append(stats[key])
            output_writer.writerow(row)