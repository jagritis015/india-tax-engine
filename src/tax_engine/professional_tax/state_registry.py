STATE_ALIASES = {
    "andhra pradesh": "andhra_pradesh",
    "ap": "andhra_pradesh",

    "arunachal pradesh": "arunachal_pradesh",

    "assam": "assam",

    "bihar": "bihar",

    "chhattisgarh": "chhattisgarh",

    "goa": "goa",

    "gujarat": "gujarat",

    "haryana": "haryana",

    "himachal pradesh": "himachal_pradesh",

    "jharkhand": "jharkhand",

    "karnataka": "karnataka",
    "ka": "karnataka",

    "kerala": "kerala",

    "madhya pradesh": "madhya_pradesh",
    "mp": "madhya_pradesh",

    "maharashtra": "maharashtra",
    "mh": "maharashtra",

    "manipur": "manipur",

    "meghalaya": "meghalaya",

    "mizoram": "mizoram",

    "nagaland": "nagaland",

    "odisha": "odisha",
    "orissa": "odisha",

    "punjab": "punjab",

    "rajasthan": "rajasthan",

    "sikkim": "sikkim",

    "tamil nadu": "tamil_nadu",
    "tn": "tamil_nadu",

    "telangana": "telangana",
    "ts": "telangana",

    "tripura": "tripura",

    "uttar pradesh": "uttar_pradesh",
    "up": "uttar_pradesh",

    "uttarakhand": "uttarakhand",

    "west bengal": "west_bengal",
    "wb": "west_bengal",

    "andaman and nicobar islands": "andaman_nicobar",
    "chandigarh": "chandigarh",
    "dadra and nagar haveli and daman and diu": "dadra_nagar_haveli_daman_diu",
    "delhi": "delhi",
    "new delhi": "delhi",
    "jammu and kashmir": "jammu_kashmir",
    "ladakh": "ladakh",
    "lakshadweep": "lakshadweep",
    "puducherry": "puducherry",
    "pondicherry": "puducherry",
}


def normalize_state(state: str) -> str:
    normalized = " ".join(state.strip().lower().split())

    if normalized not in STATE_ALIASES:
        raise ValueError(f"Unknown Indian state or UT: {state}")

    return STATE_ALIASES[normalized]
