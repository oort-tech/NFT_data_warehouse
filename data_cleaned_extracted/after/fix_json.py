import json

# Read the original file
with open('contract_stat_30d.json', 'r') as f:
    data = f.read()

# Fix the JSON
fixed_data = '[' + data.replace('}{', '},{') + ']'
parsed_data = json.loads(fixed_data)

# Save the fixed JSON to a new file
with open('fixed_contract_stat_30d.json', 'w') as f:
    json.dump(parsed_data, f, indent=4)
